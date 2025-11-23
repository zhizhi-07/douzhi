/**
 * 位置输入组件
 */

import { useState, useEffect } from 'react'
import { getImage } from '../utils/unifiedStorage'

interface LocationInputProps {
  show: boolean
  onClose: () => void
  onConfirm: (name: string, address: string) => void
}

const LocationInput = ({ show, onClose, onConfirm }: LocationInputProps) => {
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [functionBg, setFunctionBg] = useState('')
  
  // 加载功能背景
  useEffect(() => {
    const loadFunctionBg = async () => {
      const bg = await getImage('function_bg')
      if (bg) setFunctionBg(bg)
    }
    loadFunctionBg()
  }, [])

  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setLocationName('')
      setAddress('')
    }
  }, [show])

  if (!show) return null

  const handleConfirm = () => {
    if (!locationName.trim()) {
      alert('请输入位置名称')
      return
    }
    onConfirm(locationName.trim(), address.trim() || locationName.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative glass-card rounded-3xl p-6 mx-4 w-full max-w-sm shadow-2xl modal-slide-up"
        style={functionBg ? {
          backgroundImage: `url(${functionBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">📍 发送位置</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            位置名称：
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="例如：星巴克咖啡厅"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-base"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            详细地址（可选）：
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="详细地址"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-base"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 active:scale-95 transition-all shadow-lg"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationInput
