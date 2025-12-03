/**
 * AI帖子生成器组件
 * 可以生成各种类型的虚拟帖子
 */

import { useState, useEffect } from 'react'
import { playSystemSound } from '../utils/soundManager'
import { getImage } from '../utils/unifiedStorage'

interface PostGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, selectedRoles: string[]) => void
  onSend: () => void
  characterName?: string
  characterAvatar?: string
  characterId?: string
  userAvatar?: string
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
  userAvatar,
  generatedPost,
  onClearPost
}: PostGeneratorProps) => {
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [functionBg, setFunctionBg] = useState('')

  // 加载功能背景
  useEffect(() => {
    const loadFunctionBg = async () => {
      const bg = await getImage('function_bg')
      if (bg) setFunctionBg(bg)
    }
    loadFunctionBg()
  }, [])

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
      {/* 遮罩层 - 使用更柔和的模糊 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 modal-overlay-enter transition-all duration-500"
        onClick={() => {
          playSystemSound()
          onClose()
        }}
      />

      {/* 主面板 - 玻璃拟态风格 */}
      <div
        data-modal-container
        className="fixed bottom-0 left-0 right-0 z-50 modal-slide-up pb-safe max-h-[85vh] overflow-y-auto rounded-t-[32px]"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.08)',
          borderTop: '1px solid rgba(255, 255, 255, 0.6)'
        }}
      >
        {/* 装饰性光晕 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-blue-50/30 to-transparent blur-3xl pointer-events-none" />

        <div className="relative h-full min-h-[50vh]">
          {/* 拖动条 */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-gray-200/80 rounded-full backdrop-blur-sm" />
          </div>

          {/* 标题区域 */}
          <div className="px-6 py-4 text-center relative z-10">
            <h3 className="text-xl font-medium text-gray-800 tracking-wide">灵感生成</h3>
            <p className="text-xs text-gray-500/80 mt-1.5 font-light tracking-wider">
              AI 辅助创作 · 激发无限可能
            </p>
          </div>

          {/* 角色选择 */}
          {!generatedPost && (
            <div className="px-6 py-2">
              <div className="flex items-center justify-center gap-8">
                {/* User Role */}
                <button
                  onClick={() => toggleRole('user')}
                  className="group flex flex-col items-center gap-2 transition-all duration-300"
                >
                  <div className={`relative p-[3px] rounded-full transition-all duration-300 ${selectedRoles.includes('user')
                      ? 'bg-gradient-to-tr from-blue-400 via-indigo-400 to-purple-400 shadow-lg shadow-blue-200/50 scale-110'
                      : 'bg-gray-100 hover:bg-gray-200 scale-100'
                    }`}>
                    <div className="bg-white rounded-full p-0.5">
                      {userAvatar ? (
                        <img src={userAvatar} alt="用户" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium">
                          ME
                        </div>
                      )}
                    </div>
                    {selectedRoles.includes('user') && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        ✓
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium tracking-wide transition-colors ${selectedRoles.includes('user') ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                    当前用户
                  </span>
                </button>

                {/* Divider Line */}
                <div className="w-px h-8 bg-gray-200/60 rounded-full" />

                {/* AI Role */}
                <button
                  onClick={() => toggleRole('ai')}
                  className="group flex flex-col items-center gap-2 transition-all duration-300"
                >
                  <div className={`relative p-[3px] rounded-full transition-all duration-300 ${selectedRoles.includes('ai')
                      ? 'bg-gradient-to-tr from-rose-400 via-pink-400 to-orange-400 shadow-lg shadow-rose-200/50 scale-110'
                      : 'bg-gray-100 hover:bg-gray-200 scale-100'
                    }`}>
                    <div className="bg-white rounded-full p-0.5">
                      {characterAvatar ? (
                        <img src={characterAvatar} alt={characterName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium">
                          AI
                        </div>
                      )}
                    </div>
                    {selectedRoles.includes('ai') && (
                      <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        ✓
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium tracking-wide transition-colors ${selectedRoles.includes('ai') ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                    {characterName || '智能助手'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 帖子描述输入 */}
          {!generatedPost && (
            <div className="px-6 py-4">
              <label className="text-xs font-medium text-gray-400 mb-3 block pl-1 tracking-wider uppercase">
                创意描述
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-2xl blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="描述你想生成的内容场景...&#10;例如：生成一个深夜emo的文案&#10;例如：模仿营销号的语气写一段话"
                  className="relative w-full p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 focus:bg-white/60 focus:border-blue-300/50 focus:ring-4 focus:ring-blue-50/50 transition-all duration-300 resize-none placeholder-gray-400/80 text-gray-700 text-sm leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* 帖子预览 */}
          {generatedPost && (
            <div className="px-6 py-4">
              <label className="text-xs font-medium text-gray-400 mb-3 block pl-1 tracking-wider uppercase">
                生成预览
              </label>
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-h-80 overflow-y-auto">
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-light">
                  {generatedPost}
                </div>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="p-6 mt-2 sticky bottom-0 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-[2px]">
            {!generatedPost ? (
              <button
                onClick={handleGenerate}
                disabled={!customPrompt.trim() || isGenerating}
                className={`w-full py-3.5 rounded-2xl font-medium tracking-wide transition-all duration-300 active:scale-[0.98] shadow-lg ${customPrompt.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-gray-200 hover:shadow-gray-300'
                  : 'bg-gray-100/80 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在构思...</span>
                  </div>
                ) : '开始生成'}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    onClearPost()
                    setCustomPrompt('')
                    setSelectedRoles([])
                  }}
                  className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 bg-white/60 border border-white/60 hover:bg-white/80 transition-all active:scale-[0.98]"
                >
                  重试
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-3.5 rounded-2xl font-medium text-white bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg shadow-gray-200/50 hover:shadow-gray-300/50 transition-all active:scale-[0.98]"
                >
                  发送
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PostGenerator
