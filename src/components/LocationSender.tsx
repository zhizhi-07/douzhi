/**
 * 位置发送组件
 * 用户输入地点名称和详细地址
 */

import { useState, useEffect } from 'react'

interface LocationSenderProps {
  show: boolean
  onClose: () => void
  onSend: (name: string, address: string) => void
}

const LocationSender = ({ show, onClose, onSend }: LocationSenderProps) => {
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')

  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setLocationName('')
      setLocationAddress('')
    }
  }, [show])

  const handleSend = () => {
    if (!locationName.trim()) {
      alert('请输入位置名称')
      return
    }

    onSend(locationName.trim(), locationAddress.trim())

    // 重置表单
    setLocationName('')
    setLocationAddress('')
  }

  const handleClose = () => {
    setLocationName('')
    setLocationAddress('')
    onClose()
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50">
          <div className="text-xl font-semibold text-gray-900 text-center">发送位置</div>
        </div>

        <div className="p-6 space-y-6">
          {/* 地点名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">地点名称</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：星巴克咖啡"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>

          {/* 详细地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详细地址（可选）</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：北京市朝阳区..."
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              onClick={handleSend}
              disabled={!locationName.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default LocationSender
