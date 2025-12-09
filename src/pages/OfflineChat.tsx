/**
 * 线下模式/小说模式页面
 * 独立的剧情叙事界面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useChatState, useChatAI } from './ChatDetail/hooks'
import OfflineMessageBubble from './ChatDetail/components/OfflineMessageBubble'
import MemoryStorage from '../components/MemoryStorage'
import OfflineBeautifySettings from './OfflineChat/OfflineBeautifySettings'
import { useChatBubbles } from '../hooks/useChatBubbles'
import { saveMessages } from '../utils/simpleMessageManager'
import { getDefaultExtensions, type OfflineExtension } from '../constants/defaultOfflineExtensions'

const OfflineChat = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div className="flex items-center justify-center h-screen">角色ID不存在</div>
  }

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
  const [useStreaming, setUseStreaming] = useState(false)
  const [showBeautifySettings, setShowBeautifySettings] = useState(false)
  const [extensionList, setExtensionList] = useState<OfflineExtension[]>([])
  const [maxTokens, setMaxTokens] = useState<number>(3000)
  const [temperature, setTemperature] = useState<number>(0.7)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  const [showMemoryStorage, setShowMemoryStorage] = useState(false)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetContent, setNewPresetContent] = useState('')

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

    // 保存设置
    localStorage.setItem('offline-streaming', useStreaming.toString())
    localStorage.setItem('offline-max-tokens', maxTokens.toString())
    localStorage.setItem('offline-temperature', temperature.toString())

    // 发送用户消息
    chatAI.handleSend(inputValue, setInputValue, null, undefined, 'offline')
    setInputValue('')

    // 触发AI回复（传递 offline 场景模式）
    setTimeout(() => {
      chatAI.handleAIReply('offline')
    }, 100)
  }

  // 删除消息
  const handleDeleteMessage = (messageId: number | string) => {
    chatState.setMessages(prev => {
      const newMessages = prev.filter(m => m.id !== messageId)
      // 🔥 持久化保存到localStorage
      saveMessages(id, newMessages)
      return newMessages
    })
  }

  // 编辑消息
  const handleEditMessage = (messageId: number | string, newContent: string) => {
    chatState.setMessages(prev => {
      const newMessages = prev.map(m =>
        m.id === messageId ? { ...m, content: newContent } : m
      )
      // 🔥 持久化保存到localStorage
      saveMessages(id, newMessages)
      return newMessages
    })
    setEditingMessageId(null)
    setEditingContent('')
  }

  // 加载扩展条目列表（首次使用时自动初始化默认条目，并合并新默认项）
  const loadExtensions = useCallback(() => {
    const saved = localStorage.getItem('offline-extensions')
    const defaults = getDefaultExtensions()
    
    if (saved) {
      try {
        const savedExtensions = JSON.parse(saved) as OfflineExtension[]
        
        // 检查是否有新的默认预设未被包含，或已存在的默认条目需要更新内容
        let hasChanges = false
        const mergedExtensions = [...savedExtensions]
        
        defaults.forEach(defExt => {
          if (!defExt.isDefault) return
          
          const existingIndex = mergedExtensions.findIndex(e => e.name === defExt.name)
          
          if (existingIndex === -1) {
            // 新条目，添加
            mergedExtensions.push(defExt)
            hasChanges = true
            console.log(`📦 [线下模式] 添加新默认预设: ${defExt.name}`)
          } else {
            // 已存在的条目，检查内容是否需要更新
            const existing = mergedExtensions[existingIndex]
            if (existing.content !== defExt.content) {
              // 🔥 强制更新默认条目的内容（保留用户的enabled状态）
              mergedExtensions[existingIndex] = {
                ...defExt,
                enabled: existing.enabled  // 保留用户的开关状态
              }
              hasChanges = true
              console.log(`📦 [线下模式] 更新默认预设内容: ${defExt.name}`)
            }
          }
        })
        
        setExtensionList(mergedExtensions)
        
        if (hasChanges) {
          console.log('📦 [线下模式] 默认预设已同步更新')
          localStorage.setItem('offline-extensions', JSON.stringify(mergedExtensions))
        }
        
      } catch (e) {
        console.error('扩展条目加载失败:', e)
        // 解析失败时初始化默认条目
        setExtensionList(defaults)
        localStorage.setItem('offline-extensions', JSON.stringify(defaults))
      }
    } else {
      // 首次使用：初始化默认条目
      console.log('📦 [线下模式] 首次使用，初始化默认预设条目')
      setExtensionList(defaults)
      localStorage.setItem('offline-extensions', JSON.stringify(defaults))
    }
  }, [])

  // 加载流式状态和扩展条目
  useEffect(() => {
    const savedStreaming = localStorage.getItem('offline-streaming')
    if (savedStreaming === 'true') setUseStreaming(true)

    const savedMaxTokens = localStorage.getItem('offline-max-tokens')
    if (savedMaxTokens) {
      const tokens = parseInt(savedMaxTokens)
      setMaxTokens(tokens)
    } else {
      localStorage.setItem('offline-max-tokens', '3000')
    }

    const savedTemperature = localStorage.getItem('offline-temperature')
    if (savedTemperature) {
      setTemperature(parseFloat(savedTemperature))
    }

    loadExtensions()
  }, [loadExtensions])

  // 保存新扩展条目
  const handleSaveNewExtension = () => {
    if (!newPresetName.trim()) {
      alert('请输入条目名称')
      return
    }
    if (!newPresetContent.trim()) {
      alert('请输入条目内容')
      return
    }

    const content = newPresetContent.trim()

    // 检查是否已存在同名条目
    const existingIndex = extensionList.findIndex(p => p.name === newPresetName)
    let updatedList: typeof extensionList

    if (existingIndex !== -1) {
      // 更新已存在的条目
      updatedList = [...extensionList]
      updatedList[existingIndex] = { ...updatedList[existingIndex], content }
      alert(`条目「${newPresetName}」已更新！`)
    } else {
      // 添加新条目（默认禁用）
      const newExtension = { name: newPresetName, content, enabled: false }
      updatedList = [...extensionList, newExtension]
      alert(`条目「${newPresetName}」已创建！`)
    }

    setExtensionList(updatedList)
    localStorage.setItem('offline-extensions', JSON.stringify(updatedList))

    // 关闭表单并重置
    setShowAddPreset(false)
    setNewPresetName('')
    setNewPresetContent('')
  }

  // 切换条目开关
  const toggleExtension = (index: number) => {
    const updatedList = [...extensionList]
    updatedList[index].enabled = !updatedList[index].enabled
    setExtensionList(updatedList)
    localStorage.setItem('offline-extensions', JSON.stringify(updatedList))
  }

  // 删除条目
  const deleteExtension = (index: number) => {
    const updatedList = extensionList.filter((_, i) => i !== index)
    setExtensionList(updatedList)
    localStorage.setItem('offline-extensions', JSON.stringify(updatedList))
  }

  // 气泡样式（与线上模式共享）
  useChatBubbles(id)

  // 背景设置（线下模式独立）
  const [customBg, setCustomBg] = useState<string>('')

  useEffect(() => {
    const saved = localStorage.getItem(`offline-bg-${id}`)
    if (saved) setCustomBg(saved)

    // 监听背景变化
    const handleStorageChange = () => {
      const newBg = localStorage.getItem(`offline-bg-${id}`)
      setCustomBg(newBg || '')
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [id])

  const bgStyle = customBg
    ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: '#faf9f6' }

  if (!chatState.character) {
    return <div className="flex items-center justify-center h-screen font-serif text-gray-400">正在翻开书页...</div>
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden relative soft-page-enter"
      style={bgStyle}
    >
      {/* 顶部 Header */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="text-gray-400 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* 角色名称 */}
          <h1 className="text-sm font-serif font-medium text-gray-800 tracking-widest">
            {chatState.character.nickname || chatState.character.realName}
          </h1>

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-1">
             <button
                onClick={() => setShowMemoryStorage(true)}
                className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
                title="记忆片段"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
            <div className="relative">
               <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-gray-800 transition-colors p-2 -mr-2 rounded-full hover:bg-gray-100"
                  title="设置"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                 {/* 设置面板 */}
                 {showSettings && (
                  <div className="absolute right-0 top-10 bg-[#fdfbf7] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 min-w-[320px] z-50 border border-gray-100/50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-800 font-serif tracking-widest">阅读设定</h3>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* 字数控制 */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2 font-serif tracking-wide">
                          <span>篇幅</span>
                          <span>{maxTokens} 字</span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="5000"
                          step="100"
                          value={maxTokens}
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            setMaxTokens(value)
                            localStorage.setItem('offline-max-tokens', value.toString())
                          }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
                        />
                      </div>

                      {/* 创造性 */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2 font-serif tracking-wide">
                          <span>想象</span>
                          <span>{temperature}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            setTemperature(value)
                            localStorage.setItem('offline-temperature', value.toString())
                          }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
                        />
                      </div>

                      {/* 预设管理 */}
                      <div>
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-serif text-gray-500 tracking-wide">指令预设</span>
                            <button 
                              onClick={() => setShowAddPreset(true)}
                              className="text-xs text-gray-400 hover:text-gray-800 transition-colors"
                            >
                              + 新增
                            </button>
                         </div>
                         
                         {/* 新增预设表单 */}
                         {showAddPreset && (
                            <div className="mb-3 p-3 bg-white border border-gray-100 rounded-lg space-y-2 shadow-sm">
                              <input
                                type="text"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="预设名称"
                                className="w-full px-2 py-1.5 bg-transparent border-b border-gray-100 text-xs font-serif focus:outline-none focus:border-gray-300 placeholder:text-gray-300"
                              />
                              <textarea
                                value={newPresetContent}
                                onChange={(e) => setNewPresetContent(e.target.value)}
                                placeholder="预设内容..."
                                className="w-full px-2 py-1.5 bg-transparent text-xs font-serif focus:outline-none resize-none h-16 placeholder:text-gray-300"
                              />
                              <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setShowAddPreset(false)} className="text-[10px] text-gray-400 hover:text-gray-600">取消</button>
                                <button onClick={handleSaveNewExtension} className="text-[10px] text-white bg-gray-800 px-3 py-1 rounded hover:bg-black">保存</button>
                              </div>
                            </div>
                         )}

                         <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                            {extensionList.map((ext, idx) => (
                              <div key={idx} className="flex items-center justify-between group hover:bg-white p-2 rounded-lg transition-colors cursor-pointer" onClick={() => toggleExtension(idx)}>
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className={`w-3 h-3 border border-gray-300 rounded-full flex items-center justify-center transition-all ${ext.enabled ? 'border-gray-800 bg-gray-800' : ''}`}>
                                    {ext.enabled && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                  </div>
                                  <span className={`text-xs font-serif truncate transition-colors ${ext.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{ext.name}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteExtension(idx);
                                  }} 
                                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                         </div>
                      </div>
                      
                      {/* 美化设置入口 */}
                      <button
                        onClick={() => {
                          setShowSettings(false)
                          setShowBeautifySettings(true)
                        }}
                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-serif tracking-widest pt-4 border-t border-gray-100"
                      >
                        页面样式调整
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages - 阅读区域 */}
      <div className="flex-1 overflow-y-auto pb-32 pt-20 px-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="max-w-2xl mx-auto min-h-full bg-white shadow-sm border border-gray-100/50 px-8 py-12 rounded-sm relative">
           {/* 书页装饰 */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-50"></div>
           
          {offlineMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 mb-6 text-gray-200">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-serif text-gray-800 mb-4 tracking-widest">序章</h2>
              <p className="text-sm text-gray-400 font-serif leading-loose italic">
                空白的书页等待着墨迹<br />
                写下第一句话，开始你们的故事
              </p>
            </div>
          ) : (
            offlineMessages.map(message => (
              <div key={message.id} className="group relative mb-2">
                <OfflineMessageBubble
                  message={message}
                  characterName={chatState.character!.nickname || chatState.character!.realName}
                  characterAvatar={chatState.character!.avatar}
                  chatId={id}
                  onBranchSelect={setInputValue}
                />

                {/* 极简操作栏 - 仅悬浮显示 */}
                <div className="absolute -right-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                  {/* 编辑按钮 */}
                   <button
                      onClick={() => {
                        setEditingMessageId(message.id)
                        setEditingContent(message.content || '')
                      }}
                      className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50"
                      title="修订"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-full hover:bg-gray-50"
                      title="移除"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                </div>

                {/* 原位编辑框 */}
                {editingMessageId === message.id && (
                  <div className="absolute inset-0 bg-white z-10 flex flex-col p-4 shadow-lg rounded-sm border border-gray-100">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full flex-1 bg-transparent text-gray-800 font-serif leading-loose resize-none focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setEditingMessageId(null)
                          setEditingContent('')
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleEditMessage(message.id, editingContent)}
                        className="text-xs text-white bg-black px-4 py-1.5 rounded-sm hover:bg-gray-800 transition-colors"
                      >
                        保存修订
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - 底部悬浮 */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-50 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/50 p-1.5 flex items-end gap-2 transition-all focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.12)] focus-within:bg-white">
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                if (e.target.value.length > 0) {
                  setAutoSaveStatus('saving')
                  const timer = setTimeout(() => {
                    localStorage.setItem(`offline-draft-${id}`, e.target.value)
                    setAutoSaveStatus('saved')
                    setTimeout(() => setAutoSaveStatus(null), 2000)
                  }, 500)
                  return () => clearTimeout(timer)
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入你的行动或指令..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 resize-none max-h-[120px] min-h-[44px] px-4 py-3 focus:outline-none"
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || chatAI.isAiTyping}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ${
                inputValue.trim() 
                  ? 'bg-black text-white shadow-md hover:bg-gray-800 transform hover:scale-105' 
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {chatAI.isAiTyping ? (
                <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          
          {/* 保存状态提示 */}
          <div className={`absolute -top-6 right-4 text-[10px] text-gray-400 transition-opacity duration-300 ${autoSaveStatus ? 'opacity-100' : 'opacity-0'}`}>
            {autoSaveStatus === 'saving' ? '保存中...' : '已保存草稿'}
          </div>
        </div>
      </div>

      {/* 记忆储存弹窗 */}
      <MemoryStorage
        isOpen={showMemoryStorage}
        onClose={() => setShowMemoryStorage(false)}
        currentMessages={offlineMessages}
        characterId={id || ''}
        characterName={chatState.character?.nickname || chatState.character?.realName || ''}
        onLoadMemory={(messages) => {
          // 加载记忆中的对话
          chatState.setMessages(messages)
          setShowMemoryStorage(false)
        }}
        allMessages={chatState.messages}
        onUpdateMessages={(messages) => {
          chatState.setMessages(messages)
        }}
      />

      {/* 美化设置弹窗 */}
      {showBeautifySettings && (
        <OfflineBeautifySettings
          chatId={id}
          onClose={() => setShowBeautifySettings(false)}
        />
      )}
    </div>
  )
}

export default OfflineChat
