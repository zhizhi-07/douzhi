-- ============================================
-- 豆汁 云备份系统 - Supabase 数据库表结构
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本
-- ============================================

-- 1. 用户状态表（用于封禁管理）
CREATE TABLE IF NOT EXISTS user_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户备份表（存储用户数据）
CREATE TABLE IF NOT EXISTS user_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 启用 Row Level Security (RLS)
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- 4. 用户状态表策略
-- 用户只能查看自己的状态
CREATE POLICY "Users can view own status" ON user_status
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建自己的状态记录
CREATE POLICY "Users can insert own status" ON user_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许所有已认证用户读取（管理员需要查看所有用户）
CREATE POLICY "Authenticated users can view all status" ON user_status
  FOR SELECT TO authenticated USING (true);

-- 允许更新（管理员封禁需要）
CREATE POLICY "Allow status updates" ON user_status
  FOR UPDATE TO authenticated USING (true);

-- 5. 用户备份表策略
-- 用户只能查看和修改自己的备份
CREATE POLICY "Users can view own backups" ON user_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups" ON user_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups" ON user_backups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups" ON user_backups
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_is_banned ON user_status(is_banned);
CREATE INDEX IF NOT EXISTS idx_user_backups_user_id ON user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backups_updated_at ON user_backups(updated_at);

-- ============================================
-- 执行完成后，请在 src/lib/supabase.ts 中
-- 添加你的管理员邮箱到 ADMIN_EMAILS 数组
-- ============================================
