/**
 * 线下模式美化设置
 * 支持：背景设置 + 气泡CSS（与线上模式共享）
 */

import { useState, useEffect } from 'react'

interface OfflineBeautifySettingsProps {
  chatId: string
  onClose: () => void
}

export default function OfflineBeautifySettings({ chatId, onClose }: OfflineBeautifySettingsProps) {
  // 背景设置（线下模式独立）
  const [customBg, setCustomBg] = useState<string>('')

  // 气泡CSS（与线上模式共享）
  const [cssInput, setCSSInput] = useState('')
  const [previewCSS, setPreviewCSS] = useState('')

  // 加载已保存的设置
  useEffect(() => {
    // 加载背景
    const savedBg = localStorage.getItem(`offline-bg-${chatId}`)
    if (savedBg) setCustomBg(savedBg)

    // 加载气泡CSS（与线上模式共享同一个key）
    const userCSS = localStorage.getItem(`user_bubble_css_${chatId}`) || ''
    const aiCSS = localStorage.getItem(`ai_bubble_css_${chatId}`) || ''
    if (userCSS || aiCSS) {
      setCSSInput(`${userCSS}\n\n${aiCSS}`.trim())
      setPreviewCSS(userCSS + '\n' + aiCSS)
    }
  }, [chatId])

  // 上传背景图片
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setCustomBg(imageUrl)
        localStorage.setItem(`offline-bg-${chatId}`, imageUrl)
        // 触发自定义事件通知背景更新
        window.dispatchEvent(new Event('storage'))
      }
      reader.readAsDataURL(file)
    }
  }

  // 清除背景
  const handleClearBg = () => {
    setCustomBg('')
    localStorage.removeItem(`offline-bg-${chatId}`)
    // 触发自定义事件通知背景更新
    window.dispatchEvent(new Event('storage'))
  }

  // 应用气泡CSS
  const handleApplyCSS = () => {
    const lines = cssInput.split('\n')
    let userCSS = ''
    let aiCSS = ''
    let currentTarget: 'user' | 'ai' | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('.message-container.sent') || trimmed.startsWith('.sent')) {
        currentTarget = 'user'
      } else if (trimmed.startsWith('.message-container.received') || trimmed.startsWith('.received')) {
        currentTarget = 'ai'
      }

      if (currentTarget === 'user') {
        userCSS += line + '\n'
      } else if (currentTarget === 'ai') {
        aiCSS += line + '\n'
      }
    }

    // 保存到localStorage（与线上模式共享）
    localStorage.setItem(`user_bubble_css_${chatId}`, userCSS)
    localStorage.setItem(`ai_bubble_css_${chatId}`, aiCSS)

    // 更新预览
    setPreviewCSS(userCSS + '\n' + aiCSS)

    // 触发全局样式更新事件
    window.dispatchEvent(new Event('bubbleStyleUpdate'))

    alert('✅ 气泡样式已应用！')
  }

  // 重置气泡CSS
  const handleResetCSS = () => {
    if (!confirm('确定要重置气泡样式吗？')) return

    const userCSS = `.message-container.sent .message-bubble {
  background: #1F2937 !important;
  color: #FFFFFF !important;
  border-radius: 18px 18px 4px 18px !important;
  padding: 12px 16px !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}`

    const aiCSS = `.message-container.received .message-bubble {
  background: #FFFFFF !important;
  color: #1F2937 !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 12px 16px !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}`

    localStorage.setItem(`user_bubble_css_${chatId}`, userCSS)
    localStorage.setItem(`ai_bubble_css_${chatId}`, aiCSS)

    setCSSInput(`${userCSS}\n\n${aiCSS}`)
    setPreviewCSS(userCSS + '\n' + aiCSS)

    window.dispatchEvent(new Event('bubbleStyleUpdate'))
    alert('✅ 已重置为默认样式！')
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(148,163,184,0.2)] border border-slate-100 max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">线下模式美化</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 背景设置 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">背景图片</h3>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-[0_2px_8px_rgba(71,85,105,0.25)] cursor-pointer text-sm">
                上传背景
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />
              </label>
              {customBg && (
                <button
                  onClick={handleClearBg}
                  className="px-4 py-2.5 bg-white text-slate-600 rounded-xl font-medium transition-all shadow-[0_2px_8px_rgba(148,163,184,0.12)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] text-sm"
                >
                  清除背景
                </button>
              )}
            </div>
            {customBg && (
              <div className="mt-3 rounded-lg overflow-hidden border">
                <img src={customBg} alt="背景预览" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          {/* 分隔线 */}
          <div className="h-px bg-slate-100 my-8"></div>

          {/* 气泡CSS设置 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">气泡样式</h3>
              <span className="text-xs text-slate-400">与线上模式共享</span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              修改用户和AI的气泡外观，支持标准CSS属性。
            </p>

            <textarea
              value={cssInput}
              onChange={(e) => setCSSInput(e.target.value)}
              placeholder={`.message-container.sent .message-bubble {
  background: #1F2937 !important;
  color: #FFFFFF !important;
  border-radius: 18px 18px 4px 18px !important;
}

.message-container.received .message-bubble {
  background: #FFFFFF !important;
  color: #1F2937 !important;
  border-radius: 18px 18px 18px 4px !important;
}`}
              className="w-full h-64 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono resize-none focus:outline-none focus:border-slate-400 transition-colors shadow-sm"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleApplyCSS}
                className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-medium shadow-[0_2px_8px_rgba(71,85,105,0.25)]"
              >
                应用样式
              </button>
              <button
                onClick={handleResetCSS}
                className="px-4 py-2.5 bg-white text-slate-600 rounded-xl transition-all text-sm font-medium shadow-[0_2px_8px_rgba(148,163,184,0.12)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)]"
              >
                重置默认
              </button>
            </div>
          </div>

          {/* 预览样式 */}
          {previewCSS && (
            <style>{previewCSS}</style>
          )}
        </div>
      </div>
    </div>
  )
}
