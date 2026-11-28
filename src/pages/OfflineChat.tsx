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
import StatusBar from '../components/StatusBar'
import { useChatBubbles } from '../hooks/useChatBubbles'
import { deleteMessage, updateMessage } from '../utils/simpleMessageManager'
import { getDefaultExtensions, type OfflineExtension } from '../constants/defaultOfflineExtensions'
import type { Message } from '../types/chat'

const OfflineChat = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div className="flex items-center justify-center h-screen">角色ID不存在</div>
  }

  const chatState = useChatState(id || '')
  const [error, setError] = useState<string | null>(null)

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
  const [messageLimit, setMessageLimit] = useState<number>(20) // 线下模式消息条数设置
  const [showSettings, setShowSettings] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null)
  
  const [showMemoryStorage, setShowMemoryStorage] = useState(false)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetContent, setNewPresetContent] = useState('')
  const [collapsedChapters, setCollapsedChapters] = useState<Set<number>>(new Set()) // 🔥 折叠的章节索引

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages])

  // 🔥 首次加载时滚动到底部（确保DOM渲染完成后执行）
  useEffect(() => {
    // 使用 requestAnimationFrame 确保在下一帧渲染后滚动
    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      })
    }
    
    // 延迟执行，确保消息列表已渲染
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, []) // 空依赖数组，只在组件挂载时执行一次

  // 🎭 监听面具切换事件（从聊天设置页面触发）
  // useChatAI 在每次 handleAIReply 时会从 localStorage 读取最新设置
  // 这里只需要监听事件用于调试日志
  useEffect(() => {
    const handleMaskSwitched = (event: CustomEvent<{ maskId: string | null }>) => {
      console.log('[OfflineChat] 🎭 面具已切换:', event.detail?.maskId || '主身份')
      console.log('[OfflineChat] 下次 AI 回复将使用新面具设置')
    }
    
    window.addEventListener('maskSwitched', handleMaskSwitched as EventListener)
    return () => window.removeEventListener('maskSwitched', handleMaskSwitched as EventListener)
  }, [id])

  // 只显示线下模式的消息（使用 useMemo 避免渲染时触发状态更新）
  const offlineMessages = useMemo(() =>
    chatState.messages.filter(m => m.sceneMode === 'offline'),
    [chatState.messages]
  )

  // 🔥 按章节分组消息（以 offline-summary 或 topic-start 为分隔）
  const messageChapters = useMemo(() => {
    const chapters: { title: string; messages: typeof offlineMessages; isSummary: boolean }[] = []
    let currentChapter: typeof offlineMessages = []
    let chapterTitle = '当前章节'
    
    offlineMessages.forEach((msg) => {
      if (msg.messageType === 'offline-summary' || msg.messageType === 'topic-start') {
        // 遇到总结/新话题标记，保存之前的章节
        if (currentChapter.length > 0) {
          chapters.push({ title: chapterTitle, messages: currentChapter, isSummary: false })
        }
        // 总结消息本身作为一个章节标记
        chapters.push({ 
          title: msg.offlineSummary?.title || '章节总结', 
          messages: [msg], 
          isSummary: true 
        })
        currentChapter = []
        chapterTitle = `第 ${chapters.filter(c => !c.isSummary).length + 1} 章`
      } else {
        currentChapter.push(msg)
      }
    })
    
    // 添加最后一个章节
    if (currentChapter.length > 0) {
      chapters.push({ title: chapterTitle, messages: currentChapter, isSummary: false })
    }
    
    return chapters
  }, [offlineMessages])
  
  // 🔥 首次加载时，自动折叠所有旧章节（除了最后一个）
  useEffect(() => {
    if (messageChapters.length > 1) {
      const toCollapse = new Set<number>()
      // 折叠所有非总结章节，除了最后一个
      messageChapters.forEach((chapter, idx) => {
        if (!chapter.isSummary && idx < messageChapters.length - 1) {
          toCollapse.add(idx)
        }
      })
      setCollapsedChapters(toCollapse)
    }
  }, [messageChapters.length])
  
  // 🔥 开启新话题
  const handleStartNewTopic = () => {
    const topicMessage: Message = {
      id: Date.now(),
      type: 'system',
      messageType: 'topic-start',
      content: '─── 新章节开始 ───',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      sceneMode: 'offline',
      offlineSummary: {
        title: `第 ${messageChapters.filter(c => !c.isSummary).length + 1} 章`,
        summary: '新的故事开始...',
        memoryId: `topic-${Date.now()}`
      }
    }
    
    // 添加新话题标记
    chatState.setMessages(prev => [...prev, topicMessage])
    
    // 保存到缓存
    import('../utils/simpleMessageManager').then(({ saveMessages }) => {
      saveMessages(id, [...chatState.messages, topicMessage])
    })
  }
  
  // 切换章节折叠状态
  const toggleChapterCollapse = (chapterIdx: number) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterIdx)) {
        next.delete(chapterIdx)
      } else {
        next.add(chapterIdx)
      }
      return next
    })
  }

  const handleSend = async () => {
    if (!inputValue.trim() || chatAI.isAiTyping) return

    // 保存设置
    localStorage.setItem('offline-streaming', useStreaming.toString())
    localStorage.setItem('offline-max-tokens', maxTokens.toString())
    localStorage.setItem('offline-temperature', temperature.toString())
    localStorage.setItem(`offline-message-limit-${id}`, messageLimit.toString())

    // 发送用户消息
    chatAI.handleSend(inputValue, setInputValue, null, undefined, 'offline')
    setInputValue('')

    // 触发AI回复（传递 offline 场景模式）
    setTimeout(() => {
      chatAI.handleAIReply('offline')
    }, 100)
  }

  // 删除消息 - 🔥 使用 deleteMessage 从完整缓存中删除，避免分页后丢失历史消息
  const handleDeleteMessage = (messageId: number | string) => {
    // 先更新 React 状态（用于显示）
    chatState.setMessages(prev => prev.filter(m => m.id !== messageId))
    // 使用 deleteMessage 从完整缓存中删除
    deleteMessage(id, messageId as number)
  }

  // 编辑消息 - 🔥 使用 updateMessage 从完整缓存中更新
  const handleEditMessage = (messageId: number | string, newContent: string) => {
    // 先更新 React 状态（用于显示）
    chatState.setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: newContent } : m
    ))
    // 使用 updateMessage 从完整缓存中更新
    const msgToUpdate = chatState.messages.find(m => m.id === messageId)
    if (msgToUpdate) {
      updateMessage(id, { ...msgToUpdate, content: newContent })
    }
  }

  // 重回消息 - 删除该消息并重新生成
  const handleRerollMessage = async (messageId: number | string) => {
    const messageIndex = offlineMessages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return
    
    // 🔥🔥🔥 关键修复：从IndexedDB读取完整消息列表，而不是使用React状态（可能只有30条分页数据）
    const { ensureMessagesLoaded, saveMessages } = await import('../utils/simpleMessageManager')
    const fullMessages = await ensureMessagesLoaded(id)
    const newMessages = fullMessages.filter(m => m.id !== messageId)
    
    // 更新React状态
    chatState.setMessages(newMessages)
    
    // 🔥 同步保存到缓存（使用 forceOverwrite 确保删除生效）
    await saveMessages(id, newMessages, true)  // forceOverwrite=true
    console.log(`🗑️ 重回：已删除消息 ${messageId}（完整列表共${fullMessages.length}条，删除后${newMessages.length}条）`)
    
    // 🔥 删除完成后再触发AI回复
    setTimeout(() => {
      chatAI.handleAIReply('offline')
    }, 50)
  }

  // 加载扩展条目列表（首次使用时自动初始化默认条目，并合并新默认项）
  const loadExtensions = useCallback(() => {
    const defaults = getDefaultExtensions()
    const saved = localStorage.getItem('offline-extensions')
    // 🔥 读取已删除的默认预设列表
    const deletedDefaults = JSON.parse(localStorage.getItem('offline-deleted-defaults') || '[]') as string[]
    
    if (saved) {
      try {
        const savedExtensions = JSON.parse(saved) as OfflineExtension[]
        
        // 检查是否有新的默认预设未被包含（且未被用户删除过）
        let hasChanges = false
        const mergedExtensions = [...savedExtensions]
        
        defaults.forEach(defExt => {
          if (!defExt.isDefault) return
          // 🔥 如果用户删除过这个默认预设，不要再添加回来
          if (deletedDefaults.includes(defExt.name)) return
          
          const existingIndex = mergedExtensions.findIndex(e => e.name === defExt.name)
          
          if (existingIndex === -1) {
            // 新条目，添加
            mergedExtensions.push(defExt)
            hasChanges = true
            console.log(`📦 [线下模式] 添加新默认预设: ${defExt.name}`)
          }
          // 🔥 不再强制更新内容，尊重用户的修改
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

    // 🔥 加载线下模式消息条数设置
    const savedMessageLimit = localStorage.getItem(`offline-message-limit-${id}`)
    if (savedMessageLimit) {
      setMessageLimit(parseInt(savedMessageLimit))
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
    const toDelete = extensionList[index]
    
    // 🔥 如果是默认预设，记录到已删除列表，防止刷新后恢复
    if (toDelete.isDefault) {
      const deletedDefaults = JSON.parse(localStorage.getItem('offline-deleted-defaults') || '[]') as string[]
      if (!deletedDefaults.includes(toDelete.name)) {
        deletedDefaults.push(toDelete.name)
        localStorage.setItem('offline-deleted-defaults', JSON.stringify(deletedDefaults))
      }
    }
    
    const updatedList = extensionList.filter((_, i) => i !== index)
    setExtensionList(updatedList)
    localStorage.setItem('offline-extensions', JSON.stringify(updatedList))
  }
  
  
  // 🔥 拖拽排序（鼠标+触摸兼容）
  const [dragState, setDragState] = useState<{ dragging: boolean; index: number; startY: number; currentY: number } | null>(null)
  
  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    // 只响应拖拽手柄区域
    const target = e.target as HTMLElement
    if (!target.closest('.drag-handle')) return
    
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDragState({ dragging: true, index, startY: e.clientY, currentY: e.clientY })
  }
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState?.dragging) return
    
    const deltaY = e.clientY - dragState.startY
    const itemHeight = 40 // 大约每个条目高度
    const moveSteps = Math.round(deltaY / itemHeight)
    
    if (moveSteps !== 0) {
      const newIndex = Math.max(0, Math.min(extensionList.length - 1, dragState.index + moveSteps))
      if (newIndex !== dragState.index) {
        const newList = [...extensionList]
        const [item] = newList.splice(dragState.index, 1)
        newList.splice(newIndex, 0, item)
        setExtensionList(newList)
        setDragState({ ...dragState, index: newIndex, startY: e.clientY })
      }
    }
    setDragState(prev => prev ? { ...prev, currentY: e.clientY } : null)
  }
  
  const handlePointerUp = () => {
    if (dragState?.dragging) {
      localStorage.setItem('offline-extensions', JSON.stringify(extensionList))
    }
    setDragState(null)
  }

  // 气泡样式（与线上模式共享）
  const { cssLoaded: bubbleCssLoaded } = useChatBubbles(id)

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
      {/* 顶部 Header - 极简/沉浸式设计 */}
      <div className="absolute top-0 left-0 right-0 z-50 transition-all duration-500">
        {/* 渐变背景 - 保证文字可读性但移除生硬边框 */}
        <div className="absolute inset-0 h-32 bg-gradient-to-b from-white/90 via-white/60 to-transparent pointer-events-none duration-500" />
        
        {/* 系统状态栏 */}
        <div className="relative z-20">
          <StatusBar />
        </div>
        
        <div className="relative max-w-3xl mx-auto px-6 py-2 flex items-center justify-between">
          {/* 返回按钮 - 优雅箭头 */}
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors py-2 pl-2 pr-4 rounded-full hover:bg-white/50"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-serif tracking-widest opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">返回</span>
          </button>

          {/* 角色名称 - 居中衬线体 */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <h1 className="text-base font-serif font-medium text-gray-800 tracking-[0.3em] ml-1">
              {chatState.character.nickname || chatState.character.realName}
            </h1>
            <div className="w-4 h-0.5 bg-gray-200 mt-1 rounded-full opacity-50" />
          </div>

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-1">
             <button
                onClick={() => setShowMemoryStorage(true)}
                className="text-gray-400 hover:text-gray-800 transition-colors p-2.5 rounded-full hover:bg-white/60 backdrop-blur-sm group relative"
                title="记忆片段"
              >
                <svg className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-serif text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">记忆</span>
              </button>

            <div className="relative">
               <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-gray-400 hover:text-gray-800 transition-all duration-300 p-2.5 -mr-2 rounded-full hover:bg-white/60 backdrop-blur-sm group ${showSettings ? 'rotate-90 bg-white/80 text-gray-800 shadow-sm' : ''}`}
                  title="设置"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
                
                 {/* 设置面板 - 悬浮卡片风格 */}
                 {showSettings && (
                  <div className="absolute right-0 top-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 min-w-[340px] z-50 border border-white/50 animate-in fade-in zoom-in-95 duration-200 slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-gray-800 rounded-full"></span>
                        <h3 className="text-sm font-medium text-gray-800 font-serif tracking-[0.2em]">阅读设定</h3>
                      </div>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-7">
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

                      {/* 消息条数 */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2 font-serif tracking-wide">
                          <span>记忆</span>
                          <span>{messageLimit === 0 ? '全部' : `${messageLimit} 条`}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={messageLimit}
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            setMessageLimit(value)
                            localStorage.setItem(`offline-message-limit-${id}`, value.toString())
                          }}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">AI读取的历史消息数量，0=全部</p>
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

                         <div 
                           className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-200"
                           onPointerMove={handlePointerMove}
                           onPointerUp={handlePointerUp}
                           onPointerLeave={handlePointerUp}
                         >
                            {extensionList.map((ext, idx) => (
                              <div 
                                key={idx} 
                                className={`flex items-center justify-between group hover:bg-white p-2 rounded-lg transition-all ${dragState?.index === idx ? 'bg-blue-50 shadow-sm scale-[1.02]' : ''}`}
                                onPointerDown={(e) => handlePointerDown(e, idx)}
                              >
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                  {/* 拖拽手柄 */}
                                  <div className="drag-handle flex flex-col items-center justify-center w-5 h-8 cursor-grab active:cursor-grabbing touch-none select-none">
                                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                      <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                      <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                                    </svg>
                                  </div>
                                  <div 
                                    className={`w-3 h-3 border border-gray-300 rounded-full flex items-center justify-center transition-all cursor-pointer ${ext.enabled ? 'border-gray-800 bg-gray-800' : ''}`}
                                    onClick={() => toggleExtension(idx)}
                                  >
                                    {ext.enabled && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                  </div>
                                  <span 
                                    className={`text-xs font-serif truncate transition-colors cursor-pointer ${ext.enabled ? 'text-gray-800' : 'text-gray-400'}`}
                                    onClick={() => toggleExtension(idx)}
                                  >{ext.name}</span>
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

      {/* 错误提示 */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">生成失败</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages - 阅读区域 */}
      <div className="flex-1 overflow-y-auto pb-32 pt-28 px-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="max-w-2xl mx-auto">
           
          {!bubbleCssLoaded ? (
            <div className="flex items-center justify-center h-96 text-gray-400 text-sm font-serif tracking-widest animate-pulse">
              正在翻开书页...
            </div>
          ) : offlineMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6 animate-in fade-in duration-1000 slide-in-from-bottom-4">
              <div className="w-24 h-24 mb-8 text-gray-100 relative group cursor-default">
                 <div className="absolute inset-0 bg-gray-50 rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl"></div>
                 <svg className="w-full h-full relative z-10 transition-transform duration-700 group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center justify-center gap-3 opacity-30 mb-6">
                  <div className="w-12 h-px bg-gray-800"></div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-serif">Prologue</span>
                  <div className="w-12 h-px bg-gray-800"></div>
                </div>
                
                <h2 className="text-2xl font-serif text-gray-800 tracking-[0.2em] font-light">
                  序章：空白书页
                </h2>
                
                <p className="text-sm text-gray-400 font-serif leading-loose italic font-light tracking-wide">
                  "每一个伟大的故事，<br />
                  都始于一次不经意的落笔。"
                </p>
                
                <div className="pt-8 opacity-40 text-[10px] text-gray-400 font-serif tracking-widest uppercase">
                  等待书写中...
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 🔥 按章节渲染消息 */}
              {messageChapters.map((chapter, chapterIdx) => {
                const isCollapsed = collapsedChapters.has(chapterIdx)
                const isLastChapter = chapterIdx === messageChapters.length - 1
                
                // 总结消息特殊渲染
                if (chapter.isSummary) {
                  return (
                    <div key={`summary-${chapterIdx}`} className="my-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                        <div className="px-4 py-2 bg-white/80 rounded-full border border-gray-100 shadow-sm">
                          <span className="text-xs text-gray-500 font-serif tracking-wide">
                            ✧ {chapter.title} ✧
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      </div>
                    </div>
                  )
                }
                
                // 普通章节
                return (
                  <div key={`chapter-${chapterIdx}`} className="mb-4">
                    {/* 章节折叠按钮（非最后一个章节才显示） */}
                    {!isLastChapter && (
                      <button
                        onClick={() => toggleChapterCollapse(chapterIdx)}
                        className="w-full py-2.5 px-4 mb-3 bg-white/60 hover:bg-white rounded-xl border border-gray-100 transition-all flex items-center justify-center gap-2"
                      >
                        <svg 
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-xs text-gray-500 font-serif tracking-wide">
                          {isCollapsed ? `展开 ${chapter.title} (${chapter.messages.length} 条)` : `收起 ${chapter.title}`}
                        </span>
                      </button>
                    )}
                    
                    {/* 章节内容 */}
                    {(!isCollapsed || isLastChapter) && (
                      <div className={`space-y-2 ${!isLastChapter ? 'opacity-90' : ''}`}>
                        {chapter.messages.map(message => (
                          <div key={message.id} className="mb-2">
                            <OfflineMessageBubble
                              message={message}
                              characterName={chatState.character!.nickname || chatState.character!.realName}
                              characterAvatar={chatState.character!.avatar}
                              chatId={id}
                              onBranchSelect={setInputValue}
                              onEdit={handleEditMessage}
                              onDelete={handleDeleteMessage}
                              onReroll={handleRerollMessage}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* 🔥 开启新话题按钮 */}
              {offlineMessages.length > 0 && (
                <div className="mt-8 mb-4">
                  <button
                    onClick={handleStartNewTopic}
                    className="w-full py-3 px-4 bg-gradient-to-r from-gray-50 to-white hover:from-white hover:to-gray-50 rounded-2xl border border-dashed border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 font-serif tracking-wide transition-colors">
                      开启新章节
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - 底部悬浮 - 极简小说创作模式 */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-50 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/60 p-1.5 flex items-end gap-2 transition-all duration-500 focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.08)] focus-within:bg-white focus-within:scale-[1.01]">
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
              placeholder="书写你的行动..."
              className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400/80 resize-none max-h-[120px] min-h-[44px] px-4 py-3 focus:outline-none font-serif leading-relaxed tracking-wide"
              rows={1}
            />
            
            {/* 重新生成按钮 - 输入框为空且有消息时显示 */}
            {!inputValue.trim() && offlineMessages.length > 0 && !chatAI.isAiTyping && (
              <button
                onClick={() => chatAI.handleAIReply('offline')}
                className="px-3 h-10 rounded-full flex items-center justify-center gap-1.5 transition-all duration-300 mb-0.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                title="重新生成"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-serif">续写</span>
              </button>
            )}
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || chatAI.isAiTyping}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 mb-0.5 ${
                inputValue.trim() 
                  ? 'bg-gray-900 text-white shadow-lg hover:bg-black hover:shadow-xl transform hover:-translate-y-0.5' 
                  : chatAI.isAiTyping
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-gray-50 text-gray-300'
              }`}
            >
              {chatAI.isAiTyping ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              )}
            </button>
          </div>
          
          {/* 保存状态提示 - 极简风格 */}
          <div className={`absolute -top-8 right-6 flex items-center gap-1.5 transition-all duration-500 ${autoSaveStatus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-[10px] text-gray-400 font-serif tracking-widest">
              {autoSaveStatus === 'saving' ? 'SAVING...' : 'SAVED'}
            </span>
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
