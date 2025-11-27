/**
 * 气泡设置组件
 * 使用IndexedDB存储CSS数据，解决localStorage空间不足问题
 */

import { useState, useEffect } from 'react'

// IndexedDB存储工具
const DB_NAME = 'BubbleStyleDB'
const STORE_NAME = 'styles'

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

const saveToIDB = async (key: string, value: string): Promise<boolean> => {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({ key, value })
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => { db.close(); resolve(false) }
    })
  } catch {
    return false
  }
}

const getFromIDB = async (key: string): Promise<string> => {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        db.close()
        resolve(request.result?.value || '')
      }
      request.onerror = () => { db.close(); resolve('') }
    })
  } catch {
    return ''
  }
}

interface BubbleSettingsProps {
  chatId: string
  onSaved: () => void
}

const BubbleSettings = ({ chatId, onSaved }: BubbleSettingsProps) => {
  const [userBubbleColor, setUserBubbleColor] = useState('#95EC69')
  const [aiBubbleColor, setAiBubbleColor] = useState('#FFFFFF')
  const [userTextColor, setUserTextColor] = useState('#FFFFFF')
  const [aiTextColor, setAiTextColor] = useState('#1F2937')
  const [cssInput, setCSSInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewCSS, setPreviewCSS] = useState('')

  // 从IndexedDB加载数据
  useEffect(() => {
    const loadData = async () => {
      const [userCSS, aiCSS, uBubble, aBubble, uText, aText] = await Promise.all([
        getFromIDB(`user_bubble_css_${chatId}`),
        getFromIDB(`ai_bubble_css_${chatId}`),
        getFromIDB(`user_bubble_color_${chatId}`),
        getFromIDB(`ai_bubble_color_${chatId}`),
        getFromIDB(`user_text_color_${chatId}`),
        getFromIDB(`ai_text_color_${chatId}`)
      ])
      
      if (userCSS || aiCSS) setCSSInput(`${userCSS}\n\n${aiCSS}`.trim())
      if (uBubble) setUserBubbleColor(uBubble)
      if (aBubble) setAiBubbleColor(aBubble)
      if (uText) setUserTextColor(uText)
      if (aText) setAiTextColor(aText)
    }
    loadData()
  }, [chatId])

  // 应用CSS代码
  const handleApplyCSS = async () => {
    if (!cssInput.trim()) {
      alert('请输入CSS代码')
      return
    }
    
    // 清理CSS：移除HTML标签和多余空白
    let cleanedCSS = cssInput
      .replace(/<br\s*\/?>/gi, '\n')  // 替换<br/>为换行
      .replace(/<[^>]+>/g, '')        // 移除所有HTML标签
      .replace(/&nbsp;/g, ' ')        // 替换&nbsp;
      .replace(/&lt;/g, '<')          // 替换&lt;
      .replace(/&gt;/g, '>')          // 替换&gt;
      .trim()
    
    console.log('🎨 清理后的CSS:', cleanedCSS.substring(0, 100))
    
    // 🔥 智能合并：如果CSS中没有定义color，则使用颜色选择器的字体颜色作为默认值
    let finalCSS = cleanedCSS
    
    // 检查用户气泡CSS是否包含color属性
    const userCSSMatch = finalCSS.match(/\.message-container\.sent[^}]+}/gs)
    const aiCSSMatch = finalCSS.match(/\.message-container\.received[^}]+}/gs)
    
    let userCSS = ''
    let aiCSS = ''
    
    if (userCSSMatch) {
      userCSS = userCSSMatch.join('\n')
      // 如果CSS中没有定义color，添加颜色选择器的字体颜色
      if (!userCSS.includes('color:') && !userCSS.includes('color :')) {
        userCSS = userCSS.replace('}', `  color: ${userTextColor} !important;\n}`)
      }
    } else {
      // 如果没有标准格式，使用整个CSS并添加字体颜色
      userCSS = finalCSS
      if (!userCSS.includes('color:') && !userCSS.includes('color :')) {
        userCSS += `\n.message-container.sent .message-bubble {\n  color: ${userTextColor} !important;\n}`
      }
    }
    
    if (aiCSSMatch) {
      aiCSS = aiCSSMatch.join('\n')
      // 如果CSS中没有定义color，添加颜色选择器的字体颜色
      if (!aiCSS.includes('color:') && !aiCSS.includes('color :')) {
        aiCSS = aiCSS.replace('}', `  color: ${aiTextColor} !important;\n}`)
      }
    } else {
      // 如果没有标准格式，使用整个CSS并添加字体颜色
      aiCSS = finalCSS
      if (!aiCSS.includes('color:') && !aiCSS.includes('color :')) {
        aiCSS += `\n.message-container.received .message-bubble {\n  color: ${aiTextColor} !important;\n}`
      }
    }
    
    // 使用IndexedDB存储
    const [userSuccess, aiSuccess] = await Promise.all([
      saveToIDB(`user_bubble_css_${chatId}`, userCSS),
      saveToIDB(`ai_bubble_css_${chatId}`, aiCSS)
    ])
    
    if (userSuccess && aiSuccess) {
      setPreviewCSS(userCSS + '\n' + aiCSS)
      window.dispatchEvent(new Event('bubbleStyleUpdate'))
      onSaved()
      alert('✅ CSS样式已应用！')
    } else {
      alert('❌ CSS存储失败')
    }
  }

  // 保存颜色选择器设置
  const saveBubbleColors = async () => {
    // 生成CSS
    const userCSS = `.message-container.sent .message-bubble {
  background: ${userBubbleColor} !important;
  color: ${userTextColor} !important;
  border-radius: 18px 18px 4px 18px !important;
  padding: 10px 14px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}`
    
    const aiCSS = `.message-container.received .message-bubble {
  background: ${aiBubbleColor} !important;
  color: ${aiTextColor} !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 10px 14px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}`
    
    // 使用IndexedDB存储
    const results = await Promise.all([
      saveToIDB(`user_bubble_color_${chatId}`, userBubbleColor),
      saveToIDB(`ai_bubble_color_${chatId}`, aiBubbleColor),
      saveToIDB(`user_text_color_${chatId}`, userTextColor),
      saveToIDB(`ai_text_color_${chatId}`, aiTextColor),
      saveToIDB(`user_bubble_css_${chatId}`, userCSS),
      saveToIDB(`ai_bubble_css_${chatId}`, aiCSS)
    ])
    
    if (results.every(r => r)) {
      window.dispatchEvent(new Event('bubbleStyleUpdate'))
      onSaved()
      alert('✅ 颜色设置已应用！')
    } else {
      alert('❌ 保存失败')
    }
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(148,163,184,0.1)]">
      {/* 标题栏（可点击折叠/展开） */}
      <div 
        className="p-4 cursor-pointer active:bg-slate-50 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900">聊天气泡</h2>
          <p className="text-xs text-gray-500 mt-0.5">自定义消息气泡颜色或导入CSS</p>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* 内容区域 */}
      {isExpanded && (
      <div className="px-6 pb-6 expand-animate">
      
      {/* 自定义颜色 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">颜色选择器</div>
          <button
            onClick={saveBubbleColors}
            className="px-3 py-1 bg-black hover:bg-gray-800 text-white text-xs rounded-full active:scale-95 transition-all"
          >
            应用颜色
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-2">用户气泡</div>
            <input
              type="color"
              value={userBubbleColor}
              onChange={(e) => setUserBubbleColor(e.target.value)}
              className="w-full aspect-square rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">用户字体</div>
            <input
              type="color"
              value={userTextColor}
              onChange={(e) => setUserTextColor(e.target.value)}
              className="w-full aspect-square rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">AI气泡</div>
            <input
              type="color"
              value={aiBubbleColor}
              onChange={(e) => setAiBubbleColor(e.target.value)}
              className="w-full aspect-square rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">AI字体</div>
            <input
              type="color"
              value={aiTextColor}
              onChange={(e) => setAiTextColor(e.target.value)}
              className="w-full aspect-square rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* CSS输入 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">导入CSS样式</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const template = `.message-container.sent .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: #FFFFFF !important;
  border-radius: 18px 18px 4px 18px !important;
  padding: 10px 14px !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
}

.message-container.received .message-bubble {
  background: #FFFFFF !important;
  color: #1F2937 !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 10px 14px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}`
                setCSSInput(template)
              }}
              className="text-xs text-blue-500 hover:text-blue-600 active:scale-95 transition-all"
            >
              加载模板
            </button>
            <button
              onClick={handleApplyCSS}
              className="px-3 py-1 bg-black hover:bg-gray-800 text-white text-xs rounded-full active:scale-95 transition-all"
            >
              应用CSS
            </button>
          </div>
        </div>
        <textarea
          value={cssInput}
          onChange={(e) => setCSSInput(e.target.value)}
          placeholder="粘贴CSS代码，或点击右上角'加载模板'查看示例"
          className="w-full h-32 px-3 py-2 bg-gray-50 rounded-lg text-xs font-mono resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="mt-1.5 text-xs text-gray-400">
          💡 支持渐变色、阴影、圆角等CSS属性，完全独立于颜色选择器
        </div>
      </div>
      
      {/* 预览窗口 */}
      <div className="mb-3 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500">预览</div>
          <button
            onClick={() => {
              // 实时预览CSS
              if (cssInput.trim()) {
                const cleanedCSS = cssInput
                  .replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<[^>]+>/g, '')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .trim()
                setPreviewCSS(cleanedCSS)
              }
            }}
            className="text-xs text-blue-500 hover:text-blue-600 active:scale-95 transition-all"
          >
            刷新预览
          </button>
        </div>
        <style>{previewCSS}</style>
        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="message-container sent">
              <div 
                className="message-bubble px-3 py-2 text-sm"
                style={!previewCSS ? { 
                  background: userBubbleColor, 
                  color: userTextColor,
                  borderRadius: '18px 18px 4px 18px'
                } : {}}
              >
                我的消息
              </div>
            </div>
            <div className="message-container received">
              <div 
                className="message-bubble px-3 py-2 text-sm"
                style={!previewCSS ? { 
                  background: aiBubbleColor, 
                  color: aiTextColor,
                  borderRadius: '18px 18px 18px 4px'
                } : {}}
              >
                AI回复
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  )
}

export default BubbleSettings
