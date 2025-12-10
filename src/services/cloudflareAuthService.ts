/**
 * Cloudflare 国内认证服务
 * 用于没有梯子的用户
 */

// Cloudflare Worker URL（国内线路）
const CF_WORKER_URL = 'https://douzhi.2373922440.workers.dev'

// 本地存储 token
const TOKEN_KEY = 'cf_auth_token'
const USER_KEY = 'cf_auth_user'

export interface CFUser {
  id: string
  email: string
}

export interface CFAuthResult {
  success: boolean
  user?: CFUser
  error?: string
}

/**
 * 检查 Cloudflare 服务是否可用
 */
export const checkCFAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${CF_WORKER_URL}/health`, {
      signal: controller.signal
    })
    clearTimeout(timeout)
    
    return res.ok
  } catch {
    return false
  }
}

/**
 * 注册
 */
export const cfSignUp = async (email: string, password: string): Promise<CFAuthResult> => {
  try {
    const res = await fetch(`${CF_WORKER_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return { success: false, error: data.error || '注册失败' }
    }
    
    // 保存 token 和用户信息
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem('auth_channel', 'cloudflare')
    
    return { success: true, user: data.user }
  } catch (e) {
    return { success: false, error: '网络错误，请重试' }
  }
}

/**
 * 登录
 */
export const cfSignIn = async (email: string, password: string): Promise<CFAuthResult> => {
  try {
    const res = await fetch(`${CF_WORKER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return { success: false, error: data.error || '登录失败' }
    }
    
    // 保存 token 和用户信息
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem('auth_channel', 'cloudflare')
    
    return { success: true, user: data.user }
  } catch (e) {
    return { success: false, error: '网络错误，请重试' }
  }
}

/**
 * 获取当前用户
 */
export const cfGetUser = async (): Promise<CFUser | null> => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/auth/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}

/**
 * 登出
 */
export const cfSignOut = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('auth_channel')
}

/**
 * 上传备份
 */
export const cfUploadBackup = async (backupData: Record<string, unknown>): Promise<{ success: boolean; error?: string; lastSyncTime?: string }> => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return { success: false, error: '未登录' }
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/backup/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ backup_data: backupData })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return { success: false, error: data.error }
    }
    
    return { success: true, lastSyncTime: data.lastSyncTime }
  } catch (e) {
    return { success: false, error: '网络错误' }
  }
}

/**
 * 下载备份
 */
export const cfDownloadBackup = async (): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return { success: false, error: '未登录' }
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/backup/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return { success: false, error: data.error }
    }
    
    return { success: true, data: data.backup_data }
  } catch (e) {
    return { success: false, error: '网络错误' }
  }
}

/**
 * 获取当前认证渠道
 */
export const getAuthChannel = (): 'supabase' | 'cloudflare' | null => {
  return localStorage.getItem('auth_channel') as 'supabase' | 'cloudflare' | null
}

// ========== 管理员接口 ==========

/**
 * 获取所有用户（管理员）
 */
export const cfGetAllUsers = async () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return []
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    return data.users || []
  } catch {
    return []
  }
}

/**
 * 封禁用户（管理员）
 */
export const cfBanUser = async (userId: string, reason: string): Promise<boolean> => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/admin/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: userId, reason })
    })
    
    return res.ok
  } catch {
    return false
  }
}

/**
 * 解封用户（管理员）
 */
export const cfUnbanUser = async (userId: string): Promise<boolean> => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  
  try {
    const res = await fetch(`${CF_WORKER_URL}/admin/unban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: userId })
    })
    
    return res.ok
  } catch {
    return false
  }
}
