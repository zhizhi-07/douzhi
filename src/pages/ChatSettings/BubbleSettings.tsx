/**
 * 气泡设置组件
 */

import { useState } from 'react'

interface BubbleSettingsProps {
  chatId: string
  onSaved: () => void
}

const BubbleSettings = ({ chatId, onSaved }: BubbleSettingsProps) => {
  const [userBubbleColor, setUserBubbleColor] = useState(() => 
    localStorage.getItem(`user_bubble_color_${chatId}`) || '#95EC69'
  )
  const [aiBubbleColor, setAiBubbleColor] = useState(() => 
    localStorage.getItem(`ai_bubble_color_${chatId}`) || '#FFFFFF'
  )
  const [showPreview, setShowPreview] = useState(false)
  const [showCSSInput, setShowCSSInput] = useState(false)
  const [cssInput, setCSSInput] = useState('')

  // 应用CSS代码
  const handleApplyCSS = () => {
    if (!cssInput.trim()) {
      alert('请输入CSS代码')
      return
    }
    
    // 清理CSS：移除HTML标签和多余空白
    const cleanedCSS = cssInput
      .replace(/<br\s*\/?>/gi, '\n')  // 替换<br/>为换行
      .replace(/<[^>]+>/g, '')        // 移除所有HTML标签
      .replace(/&nbsp;/g, ' ')        // 替换&nbsp;
      .replace(/&lt;/g, '<')          // 替换&lt;
      .replace(/&gt;/g, '>')          // 替换&gt;
      .trim()
    
    console.log('🎨 清理后的CSS:', cleanedCSS.substring(0, 100))
    
    // 尝试分离用户CSS和AI CSS（如果包含的话）
    const userCSSMatch = cleanedCSS.match(/\.message-container\.sent[^}]+}/s)
    const aiCSSMatch = cleanedCSS.match(/\.message-container\.received[^}]+}/s)
    
    if (userCSSMatch || aiCSSMatch) {
      // 如果包含标准格式，分别保存
      if (userCSSMatch) {
        localStorage.setItem(`user_bubble_css_${chatId}`, userCSSMatch[0])
      }
      if (aiCSSMatch) {
        localStorage.setItem(`ai_bubble_css_${chatId}`, aiCSSMatch[0])
      }
    } else {
      // 否则，直接保存整个CSS给双方
      localStorage.setItem(`user_bubble_css_${chatId}`, cleanedCSS)
      localStorage.setItem(`ai_bubble_css_${chatId}`, cleanedCSS)
    }
    
    // 触发更新（使用自定义事件，因为storage事件不会在同窗口触发）
    window.dispatchEvent(new Event('bubbleStyleUpdate'))
    onSaved()
    setCSSInput('')
    setShowCSSInput(false)
    alert('✅ CSS样式已应用！')
  }

  // 保存气泡设置
  const saveBubbleColors = () => {
    // 如果有CSS输入，优先应用CSS
    if (cssInput.trim()) {
      handleApplyCSS()
      return
    }
    
    // 否则应用颜色
    localStorage.setItem(`user_bubble_color_${chatId}`, userBubbleColor)
    localStorage.setItem(`ai_bubble_color_${chatId}`, aiBubbleColor)
    
    // 生成CSS
    const userCSS = `.message-container.sent .message-bubble {
  background: ${userBubbleColor} !important;
  border-radius: 18px !important;
  padding: 10px 14px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}`
    
    const aiCSS = `.message-container.received .message-bubble {
  background: ${aiBubbleColor} !important;
  border-radius: 18px !important;
  padding: 10px 14px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}`
    
    localStorage.setItem(`user_bubble_css_${chatId}`, userCSS)
    localStorage.setItem(`ai_bubble_css_${chatId}`, aiCSS)
    
    // 触发更新
    window.dispatchEvent(new Event('bubbleStyleUpdate'))
    onSaved()
  }

  return (
    <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">聊天气泡</h2>
        <p className="text-xs text-gray-500 mt-0.5">自定义消息气泡颜色或导入CSS</p>
      </div>
      
      {/* 自定义颜色 */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">用户气泡</div>
            <input
              type="color"
              value={userBubbleColor}
              onChange={(e) => setUserBubbleColor(e.target.value)}
              className="w-full h-11 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">AI气泡</div>
            <input
              type="color"
              value={aiBubbleColor}
              onChange={(e) => setAiBubbleColor(e.target.value)}
              className="w-full h-11 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* CSS输入 */}
      <div className="mb-3">
        {!showCSSInput ? (
          <button
            onClick={() => setShowCSSInput(true)}
            className="w-full py-2.5 text-gray-600 text-sm active:scale-95 transition-all"
          >
            + 导入CSS样式
          </button>
        ) : (
          <textarea
            value={cssInput}
            onChange={(e) => setCSSInput(e.target.value)}
            placeholder="粘贴CSS代码，点击下方应用按钮生效"
            className="w-full h-24 px-3 py-2 bg-gray-50 rounded-lg text-xs font-mono resize-none focus:outline-none focus:bg-white"
          />
        )}
      </div>
      
      {/* 按钮组 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl active:scale-95 transition-all"
        >
          {showPreview ? '隐藏预览' : '预览'}
        </button>
        <button
          onClick={saveBubbleColors}
          className="flex-1 py-2.5 bg-pink-400 text-white rounded-xl active:scale-95 transition-all"
        >
          应用
        </button>
      </div>
      
      {/* 预览窗口 */}
      {showPreview && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-3">预览</div>
          <div className="space-y-2">
            <div className="flex justify-end">
              <div 
                className="px-3 py-2 rounded-2xl text-sm"
                style={{ background: userBubbleColor }}
              >
                我的消息
              </div>
            </div>
            <div className="flex justify-start">
              <div 
                className="px-3 py-2 rounded-2xl text-sm"
                style={{ background: aiBubbleColor }}
              >
                AI回复
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BubbleSettings
