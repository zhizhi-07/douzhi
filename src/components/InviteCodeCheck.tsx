/**
 * 邀请码验证组件
 * 所有用户进入应用时必须先验证邀请码
 * 设计风格与登录/注册页面一致
 */

import { useState, useEffect, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface InviteCodeCheckProps {
  children: ReactNode
}

// 有效的邀请码列表
const VALID_INVITE_CODES = [
  'xiaoxiaoyangshan',
  '小艾大小姐我们喜欢你！',
  'TianTian520',
  '泮个终于',
  'zhizhiiloveu',
  '雪无尘',
  '韧啫喱',
  'sule1029',
  '荷包蛋最可爱！'
]

const InviteCodeCheck = ({ children }: InviteCodeCheckProps) => {
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // 检查本地存储中是否有已验证的标记
    const checkVerification = () => {
      // 🔥 开发环境自动跳过验证
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      if (isDev) {
        setIsVerified(true)
        setLoading(false)
        return
      }
      
      const verified = localStorage.getItem('invite_code_verified')
      const verifiedCode = localStorage.getItem('verified_invite_code')
      
      // 检查是否已验证且邀请码有效
      if (verified === 'true' && verifiedCode && VALID_INVITE_CODES.includes(verifiedCode)) {
        setIsVerified(true)
      }
      
      setLoading(false)
    }

    checkVerification()
  }, [])

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    // 清除之前的错误
    setError('')

    // 验证邀请码
    const trimmedCode = inviteCode.trim()
    
    if (!trimmedCode) {
      setError('请输入邀请码')
      return
    }

    setVerifying(true)

    // 模拟验证延迟
    setTimeout(() => {
      if (VALID_INVITE_CODES.includes(trimmedCode)) {
        // 邀请码有效
        localStorage.setItem('invite_code_verified', 'true')
        localStorage.setItem('verified_invite_code', trimmedCode)
        localStorage.setItem('invite_code_time', new Date().toISOString())
        setIsVerified(true)
      } else {
        // 邀请码无效
        setError('邀请码无效')
        setVerifying(false)
      }
    }, 500)
  }

  // 加载中
  if (loading) {
    return null
  }

  // 已验证，显示应用内容
  if (isVerified) {
    return <>{children}</>
  }

  // 显示邀请码输入界面（与Auth页面一致的设计）
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

        {/* 邀请码表单 */}
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="space-y-4">
            <div className="group relative">
              <input
                type="text"
                placeholder="请输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-xl border-none text-[#1d1d1f] placeholder:text-[#86868b] text-[15px] px-5 py-4 rounded-2xl focus:ring-0 focus:bg-white transition-all shadow-sm group-hover:shadow-md outline-none"
                maxLength={30}
                autoFocus
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-black text-white py-4 rounded-2xl text-[16px] font-semibold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
          >
            {verifying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                验证邀请码
                <ChevronRight className="w-5 h-5 opacity-70" />
              </>
            )}
          </button>
        </form>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-[#86868b] text-xs tracking-wide">
            请输入正确的邀请码以继续使用
          </p>
        </div>
      </div>
    </div>
  )
}

export default InviteCodeCheck
