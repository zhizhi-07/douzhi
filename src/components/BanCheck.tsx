/**
 * 全局封禁检查组件
 * 被封禁的用户无法使用应用
 * 支持双渠道：Supabase 和 Cloudflare
 */

import { useState, useEffect, ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { supabase, checkBanned } from '../lib/supabase'
import { cfGetUser, getAuthChannel } from '../services/cloudflareAuthService'
import { Ban } from 'lucide-react'

interface BanCheckProps {
  children: ReactNode
}

const BanCheck = ({ children }: BanCheckProps) => {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [banReason, setBanReason] = useState<string | null>(null)

  // 登录页面不拦截
  const isAuthPage = location.pathname === '/auth'

  useEffect(() => {
    // 如果是登录页，不需要检查
    if (isAuthPage) {
      setChecking(false)
      return
    }
    
    // 🔥 开发环境自动登录管理员账号
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isDev) {
      const autoLogin = async () => {
        // 检查是否已登录
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // 自动登录管理员账号
          console.log('🔧 [DEV] 自动登录管理员账号...')
          const { error } = await supabase.auth.signInWithPassword({
            email: '2373922440@qq.com',
            password: '2373922440'
          })
          if (error) {
            console.error('🔧 [DEV] 自动登录失败:', error.message)
          } else {
            console.log('🔧 [DEV] 自动登录成功')
            localStorage.setItem('auth_channel', 'supabase')
          }
        }
        setChecking(false)
      }
      autoLogin()
      return
    }
    
    const checkUserBan = async () => {
      try {
        // 检查使用的认证渠道
        const channel = getAuthChannel()
        
        if (channel === 'cloudflare') {
          // Cloudflare 渠道
          const cfUser = await cfGetUser()
          if (!cfUser) {
            setChecking(false)
            setNeedLogin(true)
            return
          }
          // Cloudflare 渠道登录成功，放行
          setChecking(false)
          return
        }
        
        // Supabase 渠道（默认）
        // 🔥 先检查本地session（不发网络请求），再验证用户
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // 本地没有session，未登录
          setChecking(false)
          setNeedLogin(true)
          return
        }
        
        // 有本地session，获取用户信息
        const user = session.user

        // 检查是否被封禁
        const banned = await checkBanned(user.id)
        
        if (banned) {
          // 获取封禁原因
          const { data } = await supabase
            .from('user_status')
            .select('banned_reason')
            .eq('user_id', user.id)
            .single()
          
          setBanReason(data?.banned_reason || null)
          setIsBanned(true)
          
          // 强制登出
          await supabase.auth.signOut()
        }
      } catch (e) {
        console.error('检查封禁状态失败:', e)
      } finally {
        setChecking(false)
      }
    }

    checkUserBan()

    // 监听登录状态变化（仅 Supabase）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserBan()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 登录页面直接放行
  if (isAuthPage) {
    return <>{children}</>
  }

  // 检查中，显示加载
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  // 被封禁，显示封禁页面
  if (isBanned) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Ban className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">账号已被清理</h1>
        
        <p className="text-gray-500 text-center mb-4">
          您的账号已被清理，无法继续使用本应用。
        </p>
        
        {banReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 max-w-sm">
            <p className="text-sm text-red-600">
              <span className="font-medium">原因：</span>{banReason}
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-400 text-center">
          如有疑问，请联系管理员
        </p>
      </div>
    )
  }

  // 未登录，直接跳转到登录页
  if (needLogin) {
    return <Navigate to="/auth" replace />
  }

  // 正常用户，显示应用内容
  return <>{children}</>
}

export default BanCheck
