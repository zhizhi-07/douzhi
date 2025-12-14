/**
 * Supabase 客户端配置
 * 用于用户认证和云备份
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://noqdevkhrchrnwgqlpxq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcWRldmtocmNocm53Z3FscHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTgwNzMsImV4cCI6MjA4MDkzNDA3M30.XkDP2Kq1PbCiUwJi_3hi4VtHxFbi9X77GbX5SklZrsE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'douzhi-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 管理员邮箱列表（可以封禁用户）
export const ADMIN_EMAILS: string[] = [
  '2373922440@qq.com'
]

/**
 * 检查当前用户是否是管理员
 */
export const isAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}

/**
 * 获取当前登录用户
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 检查用户是否被封禁
 */
export const checkBanned = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('user_status')
    .select('is_banned')
    .eq('user_id', userId)
    .single()
  
  return data?.is_banned ?? false
}
