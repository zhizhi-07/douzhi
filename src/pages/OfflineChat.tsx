/**
 * 线下模式/小说模式页面
 * 独立的剧情叙事界面
 */

import { useNavigate, useParams } from 'react-router-dom'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useChatState, useChatAI } from './ChatDetail/hooks'
import OfflineMessageBubble from './ChatDetail/components/OfflineMessageBubble'

const OfflineChat = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const chatState = useChatState(id || '')
  const [, setError] = useState<string | null>(null)
  
  const chatAI = useChatAI(
    id || '',
    chatState.character,
    chatState.messages,
    chatState.setMessages,
    setError
  )
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [customBg, setCustomBg] = useState<string | null>(null)
  const [useStreaming, setUseStreaming] = useState(false)
  const [presetName, setPresetName] = useState<string>('默认')
  const [showPresetMenu, setShowPresetMenu] = useState(false)
  const [presetList, setPresetList] = useState<Array<{name: string, content: string}>>([])
  const [activePreset, setActivePreset] = useState<string>('默认')
  const [maxTokens, setMaxTokens] = useState<number>(2000)
  
  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages])
  
  // 只显示线下模式的消息（使用 useMemo 避免渲染时触发状态更新）
  const offlineMessages = useMemo(() => 
    chatState.messages.filter(m => m.sceneMode === 'offline'),
    [chatState.messages]
  )
  
  const handleSend = async () => {
    if (!inputValue.trim() || chatAI.isAiTyping) return
    
    // 保存流式状态和字数限制，供线下模式使用
    localStorage.setItem('offline-streaming', useStreaming.toString())
    localStorage.setItem('offline-max-tokens', maxTokens.toString())
    
    // 发送用户消息
    chatAI.handleSend(inputValue, setInputValue, null, undefined, 'offline')
    setInputValue('')
    
    // 触发AI回复（传递 offline 场景模式）
    setTimeout(() => {
      chatAI.handleAIReply('offline')
    }, 100)
  }
  
  // 加载预设列表
  const loadPresets = useCallback(() => {
    const saved = localStorage.getItem('offline-presets')
    if (saved) {
      try {
        const presets = JSON.parse(saved)
        
        // 🔥 去重：如果有重复名称，只保留最后一个
        const uniquePresets = presets.reduce((acc: typeof presets, preset: any) => {
          const existingIndex = acc.findIndex((p: any) => p.name === preset.name)
          if (existingIndex !== -1) {
            // 替换已存在的
            acc[existingIndex] = preset
          } else {
            // 添加新的
            acc.push(preset)
          }
          return acc
        }, [])
        
        setPresetList(uniquePresets)
        
        // 如果去重后数量变化，更新 localStorage
        if (uniquePresets.length !== presets.length) {
          localStorage.setItem('offline-presets', JSON.stringify(uniquePresets))
          console.log(`🧹 [预设去重] 从 ${presets.length} 个预设去重到 ${uniquePresets.length} 个`)
        }
      } catch (e) {
        console.error('预设列表加载失败:', e)
      }
    }
  }, [])
  
  // 加载流式状态和当前预设
  useEffect(() => {
    const savedStreaming = localStorage.getItem('offline-streaming')
    if (savedStreaming === 'true') setUseStreaming(true)
    
    const savedMaxTokens = localStorage.getItem('offline-max-tokens')
    if (savedMaxTokens) {
      const tokens = parseInt(savedMaxTokens)
      setMaxTokens(tokens)
      console.log(`📏 [页面加载] 恢复字数限制: ${tokens}`)
    } else {
      // 如果没有保存过，设置默认值并保存
      localStorage.setItem('offline-max-tokens', '2000')
      console.log(`📏 [页面加载] 设置默认字数限制: 2000`)
    }
    
    // 🔥 先加载预设列表
    loadPresets()
    
    // 🔥 然后恢复激活的预设
    const savedActive = localStorage.getItem('offline-active-preset')
    if (savedActive && savedActive !== '默认') {
      setActivePreset(savedActive)
      setPresetName(savedActive)
      
      // 🔥 从预设列表中找到对应的预设内容并激活
      const savedPresets = localStorage.getItem('offline-presets')
      if (savedPresets) {
        try {
          const presets = JSON.parse(savedPresets)
          const activePresetData = presets.find((p: any) => p.name === savedActive)
          if (activePresetData) {
            localStorage.setItem('offline-preset', activePresetData.content)
          }
        } catch (e) {
          console.error('❌ [页面加载] 恢复预设失败:', e)
        }
      }
    } else {
      setActivePreset('默认')
      setPresetName('默认')
    }
  }, [loadPresets])
  
  // 处理预设上传
  const handlePresetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const preset = JSON.parse(content)
          const presetName = preset.name || file.name.replace('.json', '')
          
          // 🔥 检查是否已存在同名预设
          const existingIndex = presetList.findIndex(p => p.name === presetName)
          let updatedList: typeof presetList
          
          if (existingIndex !== -1) {
            // 替换已存在的预设
            updatedList = [...presetList]
            updatedList[existingIndex] = { name: presetName, content }
            alert(`预设「${presetName}」已更新并激活！`)
          } else {
            // 添加新预设
            const newPreset = { name: presetName, content }
            updatedList = [...presetList, newPreset]
            alert(`预设「${presetName}」已上传并激活！`)
          }
          
          setPresetList(updatedList)
          
          // 保存到localStorage
          localStorage.setItem('offline-presets', JSON.stringify(updatedList))
          
          // 🔥 自动激活刚上传的预设
          localStorage.setItem('offline-preset', content)
          localStorage.setItem('offline-active-preset', presetName)
          setActivePreset(presetName)
          setPresetName(presetName)
        } catch (error) {
          console.error('❌ [预设上传] 预设解析失败:', error)
          alert('预设文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    // 重置input
    e.target.value = ''
  }
  
  // 切换预设
  const switchPreset = (presetName: string) => {
    const preset = presetList.find(p => p.name === presetName)
    if (preset) {
      localStorage.setItem('offline-preset', preset.content)
      localStorage.setItem('offline-active-preset', presetName)
      setActivePreset(presetName)
      setPresetName(presetName)
      setShowPresetMenu(false)
    } else if (presetName === '默认') {
      localStorage.removeItem('offline-preset')
      localStorage.setItem('offline-active-preset', '默认')
      setActivePreset('默认')
      setPresetName('默认')
      setShowPresetMenu(false)
    }
  }
  
  // 删除预设
  const deletePreset = (presetName: string) => {
    const updatedList = presetList.filter(p => p.name !== presetName)
    setPresetList(updatedList)
    localStorage.setItem('offline-presets', JSON.stringify(updatedList))
    
    // 如果删除的是当前激活的预设，切回默认
    if (activePreset === presetName) {
      switchPreset('默认')
    }
    
    console.log('✅ 预设已删除:', presetName)
  }
  
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setCustomBg(imageUrl)
        localStorage.setItem(`offline-bg-${id}`, imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 加载保存的背景
  useEffect(() => {
    const saved = localStorage.getItem(`offline-bg-${id}`)
    if (saved) setCustomBg(saved)
  }, [id])
  
  const bgStyle = customBg 
    ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
  
  if (!chatState.character) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }
  
  return (
    <div 
      className="flex flex-col h-screen bg-gray-50"
      style={bgStyle}
    >
      {/* Header */}
      <div className="backdrop-blur-md bg-white/50 border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-base font-serif text-gray-700 tracking-wider">
              {chatState.character.nickname || chatState.character.realName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">预设: {presetName}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 预设管理 */}
            <div className="relative">
              <button
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="预设管理"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              {/* 预设管理弹窗 */}
              {showPresetMenu && (
                <div className="absolute right-0 top-8 backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl p-4 min-w-[280px] max-w-[320px] z-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">预设管理</h3>
                    <button
                      onClick={() => setShowPresetMenu(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 上传按钮 */}
                  <label className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm cursor-pointer transition-colors mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>上传新预设</span>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handlePresetUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {/* 预设列表 */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* 默认预设 */}
                    <div 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                        activePreset === '默认' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } cursor-pointer`}
                      onClick={() => switchPreset('默认')}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {activePreset === '默认' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-sm font-medium">默认</span>
                      </div>
                    </div>
                    
                    {/* 用户上传的预设 */}
                    {presetList.map((preset) => (
                      <div 
                        key={preset.name}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors group ${
                          activePreset === preset.name 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => switchPreset(preset.name)}
                        >
                          {activePreset === preset.name && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-sm font-medium truncate">{preset.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`确定删除预设「${preset.name}」？`)) {
                              deletePreset(preset.name)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {presetList.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        暂无预设<br/>
                        点击上方按钮上传
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 流式开关 */}
            <button
              onClick={() => setUseStreaming(!useStreaming)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <div className={`relative w-12 h-7 rounded-full transition-all backdrop-blur-lg border-2 ${
                useStreaming 
                  ? 'bg-gradient-to-r from-gray-100/40 to-gray-200/40 border-gray-300/60 shadow-inner' 
                  : 'bg-gray-200/30 border-gray-300/50'
              }`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${
                  useStreaming ? 'translate-x-5' : 'translate-x-0.5'
                }`}
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.85), rgba(240,240,240,0.9))',
                  boxShadow: useStreaming 
                    ? '0 2px 6px rgba(0,0,0,0.15), inset -1px -1px 2px rgba(0,0,0,0.1), inset 1px 1px 2px rgba(255,255,255,0.8)'
                    : '0 2px 4px rgba(0,0,0,0.12), inset -1px -1px 2px rgba(0,0,0,0.08), inset 1px 1px 2px rgba(255,255,255,0.7)'
                }}
                ></div>
              </div>
              <span className="font-medium">流式</span>
            </button>
            
            {/* 壁纸上传 */}
            <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBgUpload}
                className="hidden"
              />
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4 pt-2">
        {offlineMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-12">
            <div className="max-w-md backdrop-blur-md bg-white/70 shadow-xl px-12 py-16 rounded-lg text-center">
              <div className="text-gray-400 mb-6">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-sm text-gray-500 mb-3">* * *</div>
              <p className="text-sm text-gray-600 font-serif leading-loose">
                此刻，故事尚未开始<br/>
                等待着你的第一句话<br/>
                开启这段独特的叙事之旅
              </p>
              <div className="text-sm text-gray-500 mt-3">* * *</div>
            </div>
          </div>
        ) : (
          offlineMessages.map(message => (
            <OfflineMessageBubble
              key={message.id}
              message={message}
              characterName={chatState.character!.nickname || chatState.character!.realName}
              characterAvatar={chatState.character!.avatar}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="backdrop-blur-md bg-white/50 border-t border-white/40 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 backdrop-blur-sm bg-white/80 rounded-xl border border-gray-300 px-5 py-3 shadow-lg">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="写下你的文字..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 font-serif"
            />
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || chatAI.isAiTyping}
              className="text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
            >
              {chatAI.isAiTyping ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineChat
