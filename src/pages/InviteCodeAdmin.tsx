/**
 * 邀请码管理员页面
 * 独立路由：/invite-admin
 */

import { useState, useEffect } from 'react'
import { Copy, Trash2, Unlock, Plus, Lock } from 'lucide-react'
import { InviteCode } from '../types/inviteCode'
import * as inviteCodeStore from '../services/inviteCodeStore'

// 管理员密码
const ADMIN_PASSWORD = 'douzhi1112'

const InviteCodeAdmin = () => {
  const [isAuthed, setIsAuthed] = useState(() => {
    return localStorage.getItem('invite_admin_authed') === 'true'
  })
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (isAuthed) {
      loadCodes()
    }
  }, [isAuthed])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('invite_admin_authed', 'true')
      setIsAuthed(true)
    } else {
      setError('密码错误')
    }
  }

  const loadCodes = async () => {
    setLoading(true)
    const allCodes = await inviteCodeStore.getAllCodes()
    setCodes(allCodes)
    setLoading(false)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const newCode = await inviteCodeStore.createCode()
    if (newCode) {
      setCodes([newCode, ...codes])
    }
    setGenerating(false)
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('已复制')
  }

  const handleUnbind = async (id: string) => {
    if (await inviteCodeStore.unbindDevice(id)) {
      loadCodes()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    if (await inviteCodeStore.deleteCode(id)) {
      setCodes(codes.filter(c => c.id !== id))
    }
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-semibold">管理员验证</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="请输入管理员密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white px-4 py-3 rounded-xl outline-none"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-xl font-medium"
            >
              进入
            </button>
          </form>
        </div>
      </div>
    )
  }

  const boundCount = codes.filter(c => c.status === 'bound').length
  const unboundCount = codes.filter(c => c.status === 'unbound').length

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">邀请码管理</h1>

        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{boundCount}</div>
            <div className="text-xs text-green-600">已绑定</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{unboundCount}</div>
            <div className="text-xs text-gray-600">未绑定</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{codes.length}</div>
            <div className="text-xs text-blue-600">总计</div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-black text-white py-3 rounded-xl mb-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5" />
              生成新邀请码
            </>
          )}
        </button>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无邀请码</div>
        ) : (
          <div className="space-y-3">
            {codes.map(code => (
              <div key={code.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg font-semibold">{code.code}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    code.status === 'bound' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {code.status === 'bound' ? '已绑定' : '未绑定'}
                  </span>
                </div>
                
                {code.boundAt && (
                  <div className="text-xs text-gray-500 mb-2">
                    绑定时间: {new Date(code.boundAt).toLocaleString()}
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleCopy(code.code)}
                    className="flex-1 py-2 bg-gray-100 rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  {code.status === 'bound' && (
                    <button
                      onClick={() => handleUnbind(code.id)}
                      className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <Unlock className="w-4 h-4" />
                      解绑
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="py-2 px-3 bg-red-100 text-red-700 rounded-lg text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InviteCodeAdmin
