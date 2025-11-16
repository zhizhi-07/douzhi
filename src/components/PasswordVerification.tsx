import { useState } from 'react'

interface PasswordVerificationProps {
  onVerified: () => void
  onCancel: () => void
}

const PasswordVerification = ({ onVerified, onCancel }: PasswordVerificationProps) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (password === '66666zhizhi') {
      localStorage.setItem('admin_verified', 'true')
      onVerified()
    } else {
      setError('密码错误，请重新输入')
      setPassword('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-md mx-4 animate-scale-in">
        {/* 头部 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">管理员验证</h2>
          <p className="text-sm text-gray-500 mt-1">Administrator Verification</p>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5">
          {/* 说明文字 */}
          <div className="mb-5">
            <p className="text-sm text-gray-700 mb-4">
              此功能需要管理员权限。为保护敏感数据，访问此功能需要提供酒馆使用证明。
            </p>

            {/* 验证要求 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-900 mb-3">验证要求</p>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• 提供 SillyTavern 角色卡界面截图一张</p>
                <p>• 提供 50层以上聊天记录截图一张</p>
                <p>• 将以上材料发送至管理员获取访问密码</p>
              </div>
            </div>
          </div>

          {/* 密码输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请输入管理员密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="输入密码以继续"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* 提示信息 */}
          <p className="text-xs text-gray-500">
            密码验证成功后将保存在本地，下次访问无需重复输入
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!password}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            验证并继续
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </div>
  )
}

export default PasswordVerification
