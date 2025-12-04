/**
 * 判定对错功能 - 用户立场输入弹窗
 * 用户填写立场后发送到聊天中
 */

import { useState, useEffect } from 'react'
import { playSystemSound } from '../utils/soundManager'

// 判定偏向类型
export type BiasType = 'neutral' | 'user' | 'ai'

interface JudgmentInputModalProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  onSubmit: (userReason: string, bias: BiasType) => void
}

const JudgmentInputModal = ({
  isOpen,
  onClose,
  characterName,
  onSubmit
}: JudgmentInputModalProps) => {
  const [userReason, setUserReason] = useState('')
  const [bias, setBias] = useState<BiasType>('neutral')
  const [showBiasMenu, setShowBiasMenu] = useState(false)

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setUserReason('')
      setBias('neutral')
      setShowBiasMenu(false)
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!userReason.trim()) return
    playSystemSound()
    onSubmit(userReason.trim(), bias)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* 主面板 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={onClose} className="text-gray-500">取消</button>
          <h2 className="text-lg font-semibold">⚖️ 谁对谁错</h2>
          <div className="w-10" />
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-sm text-gray-500">
            描述事情的经过和你的立场，发送后等待对方回应，然后可以请求判定。
          </div>
          
          <textarea
            value={userReason}
            onChange={(e) => setUserReason(e.target.value)}
            placeholder="请描述这件事情的经过，以及你为什么觉得生气/委屈..."
            className="w-full h-32 p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          {/* 作弊选项 */}
          <div className="relative">
            <button
              onClick={() => setShowBiasMenu(!showBiasMenu)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <span>🎯 判定偏向:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                bias === 'neutral' ? 'bg-gray-100' :
                bias === 'user' ? 'bg-blue-100 text-blue-600' :
                'bg-pink-100 text-pink-600'
              }`}>
                {bias === 'neutral' ? '中立公正' : bias === 'user' ? '偏向我' : `偏向${characterName}`}
              </span>
            </button>
            
            {showBiasMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setBias('neutral'); setShowBiasMenu(false) }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${bias === 'neutral' ? 'text-blue-600' : ''}`}
                >
                  ⚖️ 中立公正
                </button>
                <button
                  onClick={() => { setBias('user'); setShowBiasMenu(false) }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${bias === 'user' ? 'text-blue-600' : ''}`}
                >
                  💙 偏向我
                </button>
                <button
                  onClick={() => { setBias('ai'); setShowBiasMenu(false) }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${bias === 'ai' ? 'text-blue-600' : ''}`}
                >
                  💗 偏向{characterName}
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!userReason.trim()}
            className={`w-full py-3 rounded-xl font-medium transition ${
              userReason.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            发送给{characterName}
          </button>
        </div>
      </div>
    </>
  )
}

export default JudgmentInputModal
