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
  const [extensionList, setExtensionList] = useState<Array<{name: string, content: string, enabled: boolean}>>([])
  const [maxTokens, setMaxTokens] = useState<number>(3000)
  const [temperature, setTemperature] = useState<number>(0.7)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [characterStatus, setCharacterStatus] = useState({
    hp: 100,
    mood: '愉快',
    location: '家中',
    relationship: 80,
    energy: 90
  })
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [authorNote, setAuthorNote] = useState('')
  const [showAuthorNote, setShowAuthorNote] = useState(false)
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
    
    // 如果有作者注释，添加到消息中
    let messageToSend = inputValue
    if (authorNote && !inputValue.includes('[作者注:')) {
      messageToSend = `${inputValue}\n[作者注: ${authorNote}]`
    }
    
    // 发送用户消息
    chatAI.handleSend(messageToSend, setInputValue, null, undefined, 'offline')
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
  
  // 加载扩展条目列表
  const loadExtensions = useCallback(() => {
    const saved = localStorage.getItem('offline-extensions')
    if (saved) {
      try {
        const extensions = JSON.parse(saved)
        setExtensionList(extensions)
      } catch (e) {
        console.error('扩展条目加载失败:', e)
      }
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
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-base font-medium text-black">
              {chatState.character.nickname || chatState.character.realName}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <button
                onClick={() => setShowStatusPanel(!showStatusPanel)}
                className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                状态
              </button>
              <button
                onClick={() => setShowAuthorNote(!showAuthorNote)}
                className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                作者注
              </button>
              <button
                onClick={() => setShowMemoryStorage(true)}
                className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                记忆
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 美化设置按钮 */}
            <div>
              <button
                onClick={() => setShowBeautifySettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="美化设置"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
            </div>
            
            {/* 高级设置按钮（移到最右边） */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-600 hover:text-black transition-colors p-1"
                title="设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* 设置面板 */}
              {showSettings && (
                <div className="absolute right-0 top-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(148,163,184,0.15)] p-5 min-w-[320px] z-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">高级设置</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 预设管理 */}
                    <div>
                      <div className="text-xs font-medium text-slate-600 mb-3">预设管理</div>
                      
                      {/* 新增按钮 */}
                      {!showAddPreset ? (
                        <button 
                          onClick={() => setShowAddPreset(true)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-sm transition-all shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] mb-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>新增条目</span>
                        </button>
                      ) : (
                        <div className="mb-3 p-4 bg-slate-50/50 rounded-xl space-y-3 border border-slate-100">
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="条目名称"
                            className="w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-700 outline-none border border-slate-200 focus:border-slate-400 transition-colors shadow-sm"
                          />
                          <textarea
                            value={newPresetContent}
                            onChange={(e) => setNewPresetContent(e.target.value)}
                            placeholder='条目内容（纯文本或JSON格式）\n\n纯文本示例：\n增加动作描写的细节性...\n\nJSON示例：\n{"prompt":"增加动作描写..."}'
                            className="w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-700 outline-none border border-slate-200 focus:border-slate-400 transition-colors resize-none shadow-sm"
                            rows={6}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveNewExtension}
                              className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setShowAddPreset(false)
                                setNewPresetName('')
                                setNewPresetContent('')
                              }}
                              className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-all shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* 扩展条目列表 */}
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {extensionList.map((extension, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all group"
                          >
                            <label className="flex items-center gap-2 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={extension.enabled}
                                onChange={() => toggleExtension(index)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                              />
                              <span className="text-sm font-medium text-slate-600">{extension.name}</span>
                            </label>
                            <button
                              onClick={() => {
                                if (confirm(`确定删除条目「${extension.name}」？`)) {
                                  deleteExtension(index)
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
                        
                        {extensionList.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            暂无条目，点击上方按钮创建
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 分隔线 */}
                    <div className="h-px bg-slate-100 my-4"></div>
                    
                    {/* 字数限制 */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="font-medium">目标字数</span>
                        <span className="font-semibold text-slate-700">{maxTokens} 字</span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">
                        AI会控制在此字数左右，非硬性截断
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
                        className="w-full appearance-none cursor-pointer offline-slider"
                      />
                      <style>{`
                        .offline-slider {
                          height: 6px;
                          border-radius: 10px;
                          background: linear-gradient(to right, #64748b 0%, #64748b ${(maxTokens - 500) / 45}%, #e2e8f0 ${(maxTokens - 500) / 45}%, #e2e8f0 100%);
                          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                        }
                        .offline-slider::-webkit-slider-track {
                          height: 6px;
                          border-radius: 10px;
                          background: transparent;
                        }
                        .offline-slider::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ffffff;
                          cursor: pointer;
                          margin-top: -7px;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                        }
                        .offline-slider::-moz-range-track {
                          height: 6px;
                          border-radius: 10px;
                          background: transparent;
                        }
                        .offline-slider::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ffffff;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                        }
                      `}</style>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[800, 1500, 3000].map(preset => (
                          <button
                            key={preset}
                            onClick={() => {
                              setMaxTokens(preset)
                              localStorage.setItem('offline-max-tokens', preset.toString())
                            }}
                            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                              maxTokens === preset
                                ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                                : 'glass-card text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 创造性温度 */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-2">
                        <span className="font-medium">创造性</span>
                        <span className="font-semibold text-slate-700">
                          {temperature < 0.3 ? '保守' : temperature < 0.7 ? '平衡' : '创意'} ({temperature})
                        </span>
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
                        className="w-full appearance-none cursor-pointer offline-slider-temp"
                      />
                      <style>{`
                        .offline-slider-temp {
                          height: 6px;
                          border-radius: 10px;
                          background: linear-gradient(to right, #64748b 0%, #64748b ${temperature * 100}%, #e2e8f0 ${temperature * 100}%, #e2e8f0 100%);
                          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                        }
                        .offline-slider-temp::-webkit-slider-track {
                          height: 6px;
                          border-radius: 10px;
                          background: transparent;
                        }
                        .offline-slider-temp::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ffffff;
                          cursor: pointer;
                          margin-top: -7px;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                        }
                        .offline-slider-temp::-moz-range-track {
                          height: 6px;
                          border-radius: 10px;
                          background: transparent;
                        }
                        .offline-slider-temp::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ffffff;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                        }
                      `}</style>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { label: '保守', value: 0.3 },
                          { label: '平衡', value: 0.7 },
                          { label: '创意', value: 1.0 }
                        ].map(preset => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              setTemperature(preset.value)
                              localStorage.setItem('offline-temperature', preset.value.toString())
                            }}
                            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                              Math.abs(temperature - preset.value) < 0.05
                                ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                                : 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 流式开关 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">流式输出</span>
                      <button
                        onClick={() => {
                          setUseStreaming(!useStreaming)
                          localStorage.setItem('offline-streaming', (!useStreaming).toString())
                        }}
                        className={`relative w-11 h-6 rounded-full transition-all ${
                          useStreaming 
                            ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                            : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                        }`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] ${
                          useStreaming ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 作者注释面板 */}
      {showAuthorNote && (
        <div className="bg-white px-6 py-3 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2">作者注释（影响剧情走向）</div>
                <textarea
                  value={authorNote}
                  onChange={(e) => setAuthorNote(e.target.value)}
                  placeholder="例如：让角色变得更勇敢，故事更加紧张..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:bg-gray-100"
                  rows={2}
                />
              </div>
              <button
                onClick={() => {
                  setShowAuthorNote(false)
                  // 作者注释将在发送时自动附加
                }}
                className="px-3 py-1 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 角色状态面板 */}
      {showStatusPanel && (
        <div className="bg-gray-50 px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">HP</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${characterStatus.hp}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{characterStatus.hp}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">心情</div>
                <div className="text-sm font-medium text-gray-700">{characterStatus.mood}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">位置</div>
                <div className="text-sm font-medium text-gray-700">{characterStatus.location}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">好感度</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-pink-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${characterStatus.relationship}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{characterStatus.relationship}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">精力</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${characterStatus.energy}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{characterStatus.energy}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4 pt-2">
        {offlineMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-12">
            <div className="max-w-md bg-white shadow-lg px-12 py-16 rounded-2xl text-center">
              <div className="text-gray-400 mb-6">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-800 mb-3">故事尚未开始</h2>
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
            <div key={message.id} className="group relative">
              <OfflineMessageBubble
                message={message}
                characterName={chatState.character!.nickname || chatState.character!.realName}
                characterAvatar={chatState.character!.avatar}
                chatId={id}
              />
              
              {/* 消息操作按钮 */}
              <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                {editingMessageId === message.id ? (
                  <>
                    <button
                      onClick={() => handleEditMessage(message.id, editingContent)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(null)
                        setEditingContent('')
                      }}
                      className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id)
                        setEditingContent(message.content || '')
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  {message.type === 'received' && (
                    <button
                      onClick={() => {
                        // 重新生成AI回复
                        handleDeleteMessage(message.id)
                        setTimeout(() => {
                          chatAI.handleAIReply('offline')
                        }, 100)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="重新生成"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
            
            {/* 编辑框 */}
            {editingMessageId === message.id && (
              <div className="px-6 sm:px-12 -mt-8 mb-8">
                <div className="max-w-2xl mx-auto">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full px-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none focus:shadow-md resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
      </div>
      
      
      {/* Input */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm">
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                // 自动保存草稿
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
              placeholder="写下你的文字..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 resize-none min-h-[20px] max-h-[120px]"
              rows={1}
            />
            
            <div className="flex items-center gap-2">
              {/* 发送按钮 */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || chatAI.isAiTyping}
                className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-200 flex items-center justify-center transition-colors"
              >
                {chatAI.isAiTyping ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
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
