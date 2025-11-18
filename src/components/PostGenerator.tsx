/**
 * AI帖子生成器组件
 * 可以生成各种类型的虚拟帖子
 */

import { useState } from 'react'
import { playSystemSound } from '../utils/soundManager'

interface PostGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, selectedRoles: string[]) => void
  onSend: () => void
  characterName?: string
  characterAvatar?: string
  characterId?: string
  generatedPost: string | null
  onClearPost: () => void
}

const PostGenerator = ({
  isOpen,
  onClose,
  onGenerate,
  onSend,
  characterName,
  characterAvatar,
  characterId,
  generatedPost,
  onClearPost
}: PostGeneratorProps) => {
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const toggleRole = (role: string) => {
    playSystemSound()
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleGenerate = async () => {
    playSystemSound()
    
    if (!customPrompt.trim()) {
      alert('请输入帖子描述')
      return
    }

    setIsGenerating(true)
    await onGenerate(customPrompt.trim(), selectedRoles)
    setIsGenerating(false)
  }

  const handleSend = () => {
    playSystemSound()
    onSend()
    
    // 重置状态
    setCustomPrompt('')
    setSelectedRoles([])
  }

  const handleClose = () => {
    playSystemSound()
    onClose()
    onClearPost()
    setCustomPrompt('')
    setSelectedRoles([])
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 modal-overlay-enter"
        onClick={() => {
          playSystemSound()
          onClose()
        }}
      />

      {/* 主面板 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 modal-slide-up pb-safe max-h-[80vh] overflow-y-auto">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 标题 */}
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">生成AI帖子</h3>
          <p className="text-xs text-gray-500 mt-1">描述你想生成的帖子，可选择相关角色</p>
        </div>

        {/* 角色选择 */}
        {!generatedPost && (
          <div className="p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">选择相关角色（可选）</label>
            <div className="flex gap-3">
              <button
                onClick={() => toggleRole('user')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                  selectedRoles.includes('user')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    我
                  </div>
                  <div className="text-xs font-medium text-gray-700">用户</div>
                </div>
              </button>
              <button
                onClick={() => toggleRole('ai')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                  selectedRoles.includes('ai')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {characterAvatar ? (
                    <img src={characterAvatar} alt={characterName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                      {characterName?.charAt(0) || 'AI'}
                    </div>
                  )}
                  <div className="text-xs font-medium text-gray-700">{characterName}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 帖子描述输入 */}
        {!generatedPost && (
          <div className="px-4 pb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">帖子描述</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：生成一个校园墙帖子，讨论最近的期末考试&#10;例如：生成几个人在吵架的帖子&#10;例如：生成关于某人的黑料讨论"
              className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none"
              rows={5}
            />
          </div>
        )}

        {/* 帖子预览 */}
        {generatedPost && (
          <div className="px-4 pb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">生成的帖子</label>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto">
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {generatedPost}
              </div>
            </div>
          </div>
        )}

        {/* 按钮区域 */}
        <div className="px-4 pb-4 flex gap-3">
          {!generatedPost ? (
            <button
              onClick={handleGenerate}
              disabled={!customPrompt.trim() || isGenerating}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 ${
                customPrompt.trim() && !isGenerating
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? '生成中...' : '生成帖子'}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  onClearPost()
                  setCustomPrompt('')
                  setSelectedRoles([])
                }}
                className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 bg-gray-200 text-gray-700"
              >
                重新生成
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 bg-blue-500 text-white"
              >
                发送
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default PostGenerator
