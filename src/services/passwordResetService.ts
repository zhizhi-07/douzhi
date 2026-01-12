/**
 * 密码重置服务
 */

import { supabase } from '../lib/supabase'

export interface ResetRequest {
  id: string
  email: string
  reset_code: string | null
  status: 'pending' | 'code_sent' | 'completed'
  created_at: string
}

// 生成6位验证码
function generateCode(): string {
  return Math.random().toString().slice(2, 8)
}

// 用户提交重置申请
export async function submitResetRequest(email: string): Promise<boolean> {
  const { error } = await supabase
    .from('password_reset_requests')
    .insert({ email, status: 'pending' })
  
  return !error
}

// 获取所有待处理的申请
export async function getPendingRequests(): Promise<ResetRequest[]> {
  const { data } = await supabase
    .from('password_reset_requests')
    .select('*')
    .in('status', ['pending', 'code_sent'])
    .order('created_at', { ascending: false })
  
  return data || []
}

// 管理员生成验证码
export async function generateResetCode(requestId: string): Promise<string | null> {
  const code = generateCode()
  
  const { error } = await supabase
    .from('password_reset_requests')
    .update({ reset_code: code, status: 'code_sent', updated_at: new Date().toISOString() })
    .eq('id', requestId)
  
  return error ? null : code
}

// 验证验证码
export async function verifyResetCode(email: string, code: string): Promise<boolean> {
  const { data } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('email', email)
    .eq('reset_code', code)
    .eq('status', 'code_sent')
    .single()
  
  return !!data
}

// 完成重置
export async function completeReset(email: string, code: string): Promise<boolean> {
  const { error } = await supabase
    .from('password_reset_requests')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('email', email)
    .eq('reset_code', code)
  
  return !error
}

// 删除申请
export async function deleteRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('password_reset_requests')
    .delete()
    .eq('id', requestId)
  
  return !error
}
