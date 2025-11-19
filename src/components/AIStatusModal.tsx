import React from 'react'
import { AIStatus } from '../utils/aiStatusManager'

interface AIStatusModalProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  characterAvatar?: string
  status: AIStatus | null
  onForceUpdate?: () => void
}

const AIStatusModal: React.FC<AIStatusModalProps> = ({
  isOpen,
  onClose,
  characterName,
  characterAvatar,
  status,
  onForceUpdate
}) => {
  if (!isOpen || !status) return null

  return (
    <>
      {/* 🔥 从顶部滑下的状态详情卡片 */}
      <div
        className="fixed top-[60px] right-4 z-50 w-80 rounded-2xl p-5 shadow-2xl modal-slide-down"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* 头部 - 名字和按钮 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{characterName} 的状态</h2>
            <div className="flex items-center gap-2">
              {/* 修正状态按钮 */}
              {onForceUpdate && (
                <button
                  onClick={() => {
                    onForceUpdate()
                    onClose()
                  }}
                  className="px-2 py-1 rounded-lg bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 btn-press-fast font-medium"
                >
                  修正
                </button>
              )}
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 btn-press-fast"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 状态详情 */}
          <div className="space-y-3">
            {/* 动作 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-2xl flex-shrink-0">🎬</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">正在做什么</p>
                <p className="text-sm text-gray-900 font-medium break-words">{status.action}</p>
              </div>
            </div>

            {/* 地点 */}
            {status.location && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-2xl flex-shrink-0">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">所在位置</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{status.location}</p>
                </div>
              </div>
            )}

            {/* 服装 */}
            {status.outfit && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-2xl flex-shrink-0">👔</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">穿着</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{status.outfit}</p>
                </div>
              </div>
            )}

            {/* 心情 */}
            {status.mood && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-2xl flex-shrink-0">💭</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">心情</p>
                  <p className="text-sm text-gray-900 font-medium break-words">{status.mood}</p>
                </div>
              </div>
            )}

            {/* 更新时间 */}
            <div className="pt-2 text-center">
              <p className="text-xs text-gray-400">
                更新于 {new Date(status.updatedAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
    </>
  )
}

export default AIStatusModal

