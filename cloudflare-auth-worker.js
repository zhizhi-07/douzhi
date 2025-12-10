/**
 * Cloudflare Worker - 国内认证服务
 * 用于没有梯子的用户登录/注册/同步
 * 
 * 部署步骤：
 * 1. 登录 Cloudflare Dashboard
 * 2. Workers & Pages -> Create Worker
 * 3. 粘贴此代码
 * 4. Settings -> Variables -> 添加环境变量 JWT_SECRET (随机字符串)
 * 5. 创建 D1 数据库：wrangler d1 create douzhidb
 * 6. 绑定 D1 数据库到 Worker（变量名：DB）
 * 7. 执行下方的 SQL 初始化数据库
 */

/**
 * D1 数据库初始化 SQL（在 Cloudflare Dashboard 的 D1 控制台执行）：
 * 
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_banned INTEGER DEFAULT 0,
  banned_reason TEXT,
  banned_at TEXT
);

CREATE TABLE user_backups (
  user_id TEXT PRIMARY KEY,
  backup_data TEXT,
  updated_at TEXT
);

CREATE INDEX idx_users_email ON users(email);
 */

// 简单的密码哈希（生产环境建议用更安全的方案）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'douzhi_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 生成 JWT Token
async function generateToken(userId, email, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: userId, 
    email: email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30天过期
  }));
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${header}.${payload}.${sig}`;
}

// 验证 JWT Token
async function verifyToken(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const data = JSON.parse(atob(payload));
    
    if (data.exp < Date.now()) {
      return null; // 过期
    }
    
    return data;
  } catch {
    return null;
  }
}

// 生成用户ID
function generateUserId() {
  return 'cf_' + crypto.randomUUID();
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 注册
      if (path === '/auth/signup' && request.method === 'POST') {
        const { email, password } = await request.json();
        
        if (!email || !password) {
          return Response.json({ error: '邮箱和密码不能为空' }, { status: 400, headers: corsHeaders });
        }

        // 检查邮箱是否已存在
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
          return Response.json({ error: '该邮箱已注册' }, { status: 400, headers: corsHeaders });
        }

        const userId = generateUserId();
        const passwordHash = await hashPassword(password);

        await env.DB.prepare(
          'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
        ).bind(userId, email, passwordHash).run();

        const token = await generateToken(userId, email, env.JWT_SECRET);

        return Response.json({ 
          user: { id: userId, email },
          token 
        }, { headers: corsHeaders });
      }

      // 登录
      if (path === '/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json();
        
        const user = await env.DB.prepare(
          'SELECT id, email, password_hash, is_banned, banned_reason FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user) {
          return Response.json({ error: '用户不存在' }, { status: 400, headers: corsHeaders });
        }

        const passwordHash = await hashPassword(password);
        if (user.password_hash !== passwordHash) {
          return Response.json({ error: '密码错误' }, { status: 400, headers: corsHeaders });
        }

        if (user.is_banned) {
          return Response.json({ error: `账号已被封禁：${user.banned_reason || '违规操作'}` }, { status: 403, headers: corsHeaders });
        }

        const token = await generateToken(user.id, user.email, env.JWT_SECRET);

        return Response.json({ 
          user: { id: user.id, email: user.email },
          token 
        }, { headers: corsHeaders });
      }

      // 获取当前用户信息
      if (path === '/auth/user' && request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ user: null }, { headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        if (!payload) {
          return Response.json({ user: null }, { headers: corsHeaders });
        }

        const user = await env.DB.prepare(
          'SELECT id, email, is_banned FROM users WHERE id = ?'
        ).bind(payload.sub).first();

        if (!user || user.is_banned) {
          return Response.json({ user: null }, { headers: corsHeaders });
        }

        return Response.json({ 
          user: { id: user.id, email: user.email }
        }, { headers: corsHeaders });
      }

      // 上传备份
      if (path === '/backup/upload' && request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ error: '未登录' }, { status: 401, headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        if (!payload) {
          return Response.json({ error: '登录已过期' }, { status: 401, headers: corsHeaders });
        }

        // 检查是否被封禁
        const user = await env.DB.prepare('SELECT is_banned FROM users WHERE id = ?').bind(payload.sub).first();
        if (user?.is_banned) {
          return Response.json({ error: '账号已被封禁' }, { status: 403, headers: corsHeaders });
        }

        const { backup_data } = await request.json();
        const now = new Date().toISOString();

        await env.DB.prepare(
          'INSERT OR REPLACE INTO user_backups (user_id, backup_data, updated_at) VALUES (?, ?, ?)'
        ).bind(payload.sub, JSON.stringify(backup_data), now).run();

        return Response.json({ success: true, lastSyncTime: now }, { headers: corsHeaders });
      }

      // 下载备份
      if (path === '/backup/download' && request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ error: '未登录' }, { status: 401, headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        if (!payload) {
          return Response.json({ error: '登录已过期' }, { status: 401, headers: corsHeaders });
        }

        const backup = await env.DB.prepare(
          'SELECT backup_data, updated_at FROM user_backups WHERE user_id = ?'
        ).bind(payload.sub).first();

        if (!backup) {
          return Response.json({ backup_data: null }, { headers: corsHeaders });
        }

        return Response.json({ 
          backup_data: JSON.parse(backup.backup_data),
          updated_at: backup.updated_at
        }, { headers: corsHeaders });
      }

      // ========== 管理员接口 ==========
      
      // 获取所有用户（管理员）
      if (path === '/admin/users' && request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ error: '未登录' }, { status: 401, headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        // 检查是否是管理员（这里简单用邮箱判断，你可以改成你的邮箱）
        const adminEmails = ['2373922440@qq.com'];
        if (!adminEmails.includes(payload?.email)) {
          return Response.json({ error: '无权限' }, { status: 403, headers: corsHeaders });
        }

        const users = await env.DB.prepare(
          'SELECT id, email, created_at, is_banned, banned_reason, banned_at FROM users ORDER BY created_at DESC'
        ).all();

        return Response.json({ users: users.results }, { headers: corsHeaders });
      }

      // 封禁用户（管理员）
      if (path === '/admin/ban' && request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ error: '未登录' }, { status: 401, headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        const adminEmails = ['2373922440@qq.com'];
        if (!adminEmails.includes(payload?.email)) {
          return Response.json({ error: '无权限' }, { status: 403, headers: corsHeaders });
        }

        const { user_id, reason } = await request.json();

        await env.DB.prepare(
          'UPDATE users SET is_banned = 1, banned_reason = ?, banned_at = ? WHERE id = ?'
        ).bind(reason || '违规操作', new Date().toISOString(), user_id).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 解封用户（管理员）
      if (path === '/admin/unban' && request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth?.startsWith('Bearer ')) {
          return Response.json({ error: '未登录' }, { status: 401, headers: corsHeaders });
        }

        const token = auth.slice(7);
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        const adminEmails = ['2373922440@qq.com'];
        if (!adminEmails.includes(payload?.email)) {
          return Response.json({ error: '无权限' }, { status: 403, headers: corsHeaders });
        }

        const { user_id } = await request.json();

        await env.DB.prepare(
          'UPDATE users SET is_banned = 0, banned_reason = NULL, banned_at = NULL WHERE id = ?'
        ).bind(user_id).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 健康检查
      if (path === '/health') {
        return Response.json({ status: 'ok', channel: 'cloudflare' }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Error:', error);
      return Response.json({ error: '服务器错误' }, { status: 500, headers: corsHeaders });
    }
  }
};
