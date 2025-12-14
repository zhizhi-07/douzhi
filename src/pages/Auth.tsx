/**
 * 登录/注册页面
 * 极简高级设计风格
 * 支持双渠道：Supabase（国际）和 Cloudflare（国内）
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, checkBanned } from '../lib/supabase'
import { downloadBackup } from '../services/cloudSyncService'
import { cfSignIn, cfSignUp, cfGetUser, getAuthChannel } from '../services/cloudflareAuthService'
import { getDeviceId } from '../utils/deviceId'
import { ChevronRight, Zap } from 'lucide-react'

type AuthMode = 'login' | 'register'
type AuthChannel = 'supabase' | 'cloudflare'

const Auth = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [channel, setChannel] = useState<AuthChannel>('supabase')

  // 检查是否已登录
  useEffect(() => {
    const checkSession = async () => {
      // 检查上次使用的渠道
      const lastChannel = getAuthChannel()
      
      if (lastChannel === 'cloudflare') {
        const cfUser = await cfGetUser()
        if (cfUser) {
          navigate('/')
          return
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          navigate('/')
          return
        }
      }
      setChecking(false)
    }
    checkSession()
  }, [navigate])

  // Supabase 登录/注册
  const handleSupabaseAuth = async () => {
    // 获取设备ID
    const deviceId = await getDeviceId()
    
    if (mode === 'register') {
      // 先检查设备是否被封禁
      const { data: bannedDevice } = await supabase
        .from('banned_devices')
        .select('device_id, banned_reason')
        .eq('device_id', deviceId)
        .single()
      
      if (bannedDevice) {
        throw new Error(`此设备已被清理，无法注册新账号`)
      }
      
      // 检查设备是否已经注册过账号
      const { data: existingUser } = await supabase
        .from('user_status')
        .select('email')
        .eq('device_id', deviceId)
        .single()
      
      if (existingUser) {
        throw new Error(`此设备已注册账号 ${existingUser.email}，请直接登录`)
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (data.user) {
        await supabase.from('user_status').insert({
          user_id: data.user.id,
          email: data.user.email,
          device_id: deviceId,  // 保存设备ID
          is_banned: false,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('auth_channel', 'supabase')
        window.location.href = '/'
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const banned = await checkBanned(data.user.id)
        if (banned) {
          await supabase.auth.signOut()
          throw new Error('账号已被清理')
        }
        localStorage.setItem('auth_channel', 'supabase')
        downloadBackup().catch(console.error)
        window.location.href = '/'
      }
    }
  }

  // Cloudflare 登录/注册
  const handleCloudflareAuth = async () => {
    if (mode === 'register') {
      const result = await cfSignUp(email, password)
      if (!result.success) {
        throw new Error(result.error)
      }
      window.location.href = '/'
    } else {
      const result = await cfSignIn(email, password)
      if (!result.success) {
        throw new Error(result.error)
      }
      window.location.href = '/'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('密码不一致')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('密码需6位以上')
          setLoading(false)
          return
        }
      }

      if (channel === 'cloudflare') {
        await handleCloudflareAuth()
      } else {
        await handleSupabaseAuth()
      }
    } catch (e: any) {
      console.error(e)
      const errMsg = e.message || ''
      
      // 检测网络错误
      if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('Failed') || errMsg.includes('timeout')) {
        setError('网络连接失败，请尝试切换线路')
      } else if (errMsg.includes('Invalid login')) {
        setError('账号或密码错误')
      } else if (errMsg.includes('User already registered')) {
        setError('该邮箱已注册')
      } else {
        setError(errMsg || '登录失败，请尝试切换线路')
      }
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* 背景装饰 */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        {/* Logo区域 */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 hover:scale-105 duration-500 transition-transform">
            <img src="/icon-192.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-wide mb-1">豆汁</h1>
          <p className="text-xs text-[#86868b] tracking-wider uppercase">DOUZHI</p>
        </div>

        {/* 极简表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="group relative">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-xl border-none text-[#1d1d1f] placeholder:text-[#86868b] text-[15px] px-5 py-4 rounded-2xl focus:ring-0 focus:bg-white transition-all shadow-sm group-hover:shadow-md outline-none"
                required
              />
            </div>

            <div className="group relative">
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-xl border-none text-[#1d1d1f] placeholder:text-[#86868b] text-[15px] px-5 py-4 rounded-2xl focus:ring-0 focus:bg-white transition-all shadow-sm group-hover:shadow-md outline-none"
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="group relative animate-fade-in">
                  <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/50 backdrop-blur-xl border-none text-[#1d1d1f] placeholder:text-[#86868b] text-[15px] px-5 py-4 rounded-2xl focus:ring-0 focus:bg-white transition-all shadow-sm group-hover:shadow-md outline-none"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center animate-shake">
              {error}
            </div>
          )}

          {/* 渠道选择 - 暂时隐藏，默认使用国际线路 */}
          {/* 如需启用，取消下方注释 */}
          {/*
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setChannel('supabase')
                setError('')
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                channel === 'supabase'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🌍 国际线路
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel('cloudflare')
                setError('')
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                channel === 'cloudflare'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              国内线路
            </button>
          </div>
          */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl text-[16px] font-semibold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? '登录' : '注册'}
                <ChevronRight className="w-5 h-5 opacity-70" />
              </>
            )}
          </button>
        </form>

        {/* 切换模式 */}
        <div className="mt-8 text-center space-y-3">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="text-[#86868b] text-xs tracking-wide hover:text-[#1d1d1f] transition-colors"
          >
            {mode === 'login' ? '还没有账号？立即注册' : '已有账号？直接登录'}
          </button>
          
          {mode === 'login' && (
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError('请先输入邮箱')
                  return
                }
                setLoading(true)
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/auth'
                  })
                  if (error) throw error
                  setError('')
                  alert('重置密码邮件已发送，请查收邮箱')
                } catch (e: any) {
                  setError(e.message || '发送失败')
                } finally {
                  setLoading(false)
                }
              }}
              className="block mx-auto text-[#86868b] text-xs tracking-wide hover:text-[#1d1d1f] transition-colors"
            >
              忘记密码？
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth
