/**
 * 管理后台 - 用户管理
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isAdmin, ADMIN_EMAILS } from '../lib/supabase'
import StatusBar from '../components/StatusBar'
import { ChevronLeft, Shield, Ban, CheckCircle, RefreshCw } from 'lucide-react'

interface UserStatus {
  id: string
  user_id: string
  email: string
  is_banned: boolean
  created_at: string
  banned_at?: string
  banned_reason?: string
  device_id?: string  // 设备ID
}

const Admin = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [showBanModal, setShowBanModal] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const admin = await isAdmin()
      setIsAdminUser(admin)
      
      if (!admin) {
        setLoading(false)
        return
      }
      
      await loadUsers()
    }
    
    checkAdminAndLoad()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('加载用户列表失败:', error)
        return
      }
      
      setUsers(data || [])
    } catch (e) {
      console.error('加载用户列表异常:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (userId: string, banDevice: boolean = true) => {
    setActionLoading(userId)
    try {
      // 获取用户信息（包括设备ID）
      const user = users.find(u => u.user_id === userId)
      
      // 封禁用户
      const { error } = await supabase
        .from('user_status')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banReason || '违规操作',
        })
        .eq('user_id', userId)
      
      if (error) {
        alert('封禁失败: ' + error.message)
        return
      }
      
      // 同时封禁设备
      if (banDevice && user?.device_id) {
        const { data: { user: adminUser } } = await supabase.auth.getUser()
        await supabase.from('banned_devices').upsert({
          device_id: user.device_id,
          banned_reason: banReason || '违规操作',
          banned_by: adminUser?.email || 'admin',
        }, { onConflict: 'device_id' })
      }
      
      setShowBanModal(null)
      setBanReason('')
      await loadUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnban = async (userId: string, unbanDevice: boolean = true) => {
    setActionLoading(userId)
    try {
      // 获取用户信息（包括设备ID）
      const user = users.find(u => u.user_id === userId)
      
      const { error } = await supabase
        .from('user_status')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
        })
        .eq('user_id', userId)
      
      if (error) {
        alert('解封失败: ' + error.message)
        return
      }
      
      // 同时解封设备
      if (unbanDevice && user?.device_id) {
        await supabase
          .from('banned_devices')
          .delete()
          .eq('device_id', user.device_id)
      }
      
      await loadUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAdminUser) {
    return (
      <div className="h-full flex flex-col font-serif soft-page-enter">
        <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/40">
          <StatusBar />
          <div className="px-5 py-3 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">用户管理</h1>
            <div className="w-5" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 soft-fade-in-up">
            <div className="w-16 h-16 bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-medium text-[#2C2C2C] mb-2 tracking-wide">无权限访问</h2>
            <p className="text-sm text-[#5A5A5A] mb-4 font-light">此页面仅管理员可访问</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-[#5A5A5A] text-sm active:scale-95 transition-transform"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-serif soft-page-enter">
      {/* 顶部 - 玻璃拟态（状态栏+导航栏合并） */}
      <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/40">
        <StatusBar />
        <div className="px-5 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">用户管理</h1>
          <button onClick={loadUsers} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 管理员邮箱提示 */}
      <div className="bg-amber-50/60 backdrop-blur-sm px-4 py-2 text-xs text-amber-700">
        管理员: {ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS.join(', ') : '未配置'}
      </div>

      {/* 用户列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="p-8 text-center text-[#8C8C8C]">加载中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#8C8C8C]">暂无用户</div>
        ) : (
          <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl overflow-hidden shadow-sm">
            {users.map((user, index) => (
              <div key={user.id}>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2C2C2C] truncate tracking-wide">
                        {user.email}
                      </p>
                      <p className="text-xs text-[#8C8C8C] mt-0.5">
                        注册于 {formatDate(user.created_at)}
                      </p>
                      {user.is_banned && (
                        <p className="text-xs text-red-500 mt-1">
                          封禁原因: {user.banned_reason || '未说明'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnban(user.user_id)}
                          disabled={actionLoading === user.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/90 text-white text-xs rounded-full disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          解封
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowBanModal(user.user_id)}
                          disabled={actionLoading === user.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/90 text-white text-xs rounded-full disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          封禁
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {index < users.length - 1 && (
                  <div className="mx-5 border-b border-[#2C2C2C]/10" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计 - 玻璃拟态 */}
      <div className="bg-white/60 backdrop-blur-md border-t border-white/40 px-4 py-4 flex justify-around text-center">
        <div>
          <p className="text-xl font-semibold text-[#2C2C2C]">{users.length}</p>
          <p className="text-xs text-[#8C8C8C]">总用户</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-red-500">
            {users.filter(u => u.is_banned).length}
          </p>
          <p className="text-xs text-[#8C8C8C]">已封禁</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-green-500">
            {users.filter(u => !u.is_banned).length}
          </p>
          <p className="text-xs text-[#8C8C8C]">正常</p>
        </div>
      </div>

      {/* 封禁确认弹窗 */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-xl border border-white/50">
            <h3 className="text-lg font-medium text-[#2C2C2C] mb-4 tracking-wide">确认封禁</h3>
            <p className="text-sm text-[#5A5A5A] mb-4 font-light">
              封禁后该用户将无法登录，请输入封禁原因：
            </p>
            <input
              type="text"
              placeholder="封禁原因（可选）"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-white/40 rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBanModal(null)
                  setBanReason('')
                }}
                className="flex-1 py-3 bg-white/60 border border-white/40 text-[#5A5A5A] rounded-xl text-sm active:scale-[0.98] transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => handleBan(showBanModal)}
                disabled={actionLoading === showBanModal}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                确认封禁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
