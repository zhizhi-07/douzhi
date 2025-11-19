/**
 * 线下模式/小说模式页面
 * 独立的剧情叙事界面
 */

import { useNavigate, useParams } from 'react-router-dom'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useChatState, useChatAI } from './ChatDetail/hooks'
import OfflineMessageBubble from './ChatDetail/components/OfflineMessageBubble'
import MemoryStorage from '../components/MemoryStorage'

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
  const [temperature, setTemperature] = useState<number>(0.7)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showBranches, setShowBranches] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [characterStatus, setCharacterStatus] = useState({
    hp: 100,
    mood: '平静',
    location: '家中',
    relationship: 50,
    energy: 80
  })
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [authorNote, setAuthorNote] = useState('')
  const [showAuthorNote, setShowAuthorNote] = useState(false)
  const [suggestedActions, setSuggestedActions] = useState<string[]>([])
  const [showActions, setShowActions] = useState(false)
  const [showMemoryStorage, setShowMemoryStorage] = useState(false)
  
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
    chatState.setMessages(prev => prev.filter(m => m.id !== messageId))
  }
  
  // 编辑消息
  const handleEditMessage = (messageId: number | string, newContent: string) => {
    chatState.setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, content: newContent } : m
    ))
    setEditingMessageId(null)
    setEditingContent('')
  }
  
  // 生成剧情分支
  const generateBranches = () => {
    // 让AI根据当前剧情动态生成分支
    const promptForBranches = '[系统指令：基于当前剧情，生成3条可能的剧情分支选项]'
    // 这里先使用预设分支，实际应该调用AI生成
    const sampleBranches = [
      '温柔地继续交流',
      '提出新的话题',
      '做出意外举动'
    ]
    setBranches(sampleBranches)
    setShowBranches(true)
    
    // TODO: 实际应该发送promptForBranches给AI，获取动态分支
  }
  
  // 选择分支
  const selectBranch = (branch: string) => {
    setInputValue(`[剧情分支: ${branch}]`)
    setShowBranches(false)
    setTimeout(() => handleSend(), 100)
  }
  
  // 生成动作建议
  const generateActionSuggestions = () => {
    const actions = [
      '继续对话',
      '描述动作',
      '内心独白',
      '场景转换',
      '时间推进',
      '观察环境'
    ]
    setSuggestedActions(actions)
    setShowActions(true)
  }
  
  // 选择动作
  const selectAction = (action: string) => {
    setInputValue(action)
    setShowActions(false)
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
    
    const savedTemperature = localStorage.getItem('offline-temperature')
    if (savedTemperature) {
      setTemperature(parseFloat(savedTemperature))
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
      <div className="bg-white border-b border-gray-200 px-6 py-3">
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
              <p className="text-xs text-gray-500">预设: {presetName}</p>
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
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 设置按钮 */}
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
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl p-4 min-w-[300px] z-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">高级设置</h3>
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
                    {/* 字数限制 */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>字数限制</span>
                        <span className="font-medium text-black">{maxTokens} 字</span>
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #000 0%, #000 ${(maxTokens - 500) / 45}%, #e5e7eb ${(maxTokens - 500) / 45}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[800, 1500, 3000].map(preset => (
                          <button
                            key={preset}
                            onClick={() => {
                              setMaxTokens(preset)
                              localStorage.setItem('offline-max-tokens', preset.toString())
                            }}
                            className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                              maxTokens === preset
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 创造性温度 */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>创造性</span>
                        <span className="font-medium text-black">
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #000 0%, #000 ${temperature * 100}%, #e5e7eb ${temperature * 100}%, #e5e7eb 100%)`
                        }}
                      />
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
                            className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                              Math.abs(temperature - preset.value) < 0.05
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 流式开关 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">流式输出</span>
                      <button
                        onClick={() => {
                          setUseStreaming(!useStreaming)
                          localStorage.setItem('offline-streaming', (!useStreaming).toString())
                        }}
                        className="relative w-10 h-6 rounded-full transition-all bg-gray-300 data-[active=true]:bg-black"
                        data-active={useStreaming}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                          useStreaming ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 预设管理 */}
            <div className="relative">
              <button
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                className="text-gray-600 hover:text-black transition-colors"
                title="预设管理"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              {/* 预设管理弹窗 */}
              {showPresetMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] z-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">预设管理</h3>
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
                  <label className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm cursor-pointer transition-colors mb-3">
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
                          ? 'bg-black text-white' 
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
                            ? 'bg-black text-white' 
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
            
            {/* 记忆储存 */}
            <button
              onClick={() => setShowMemoryStorage(true)}
              className="text-gray-600 hover:text-black transition-colors p-1"
              title="记忆储存"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* 背景管理 */}
            <div className="relative">
              <button
                onClick={() => document.getElementById('bg-upload')?.click()}
                className="text-gray-600 hover:text-black transition-colors p-1"
                title="背景设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                id="bg-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBgUpload}
              />
              {customBg && (
                <button
                  onClick={() => {
                    setCustomBg(null)
                    localStorage.removeItem(`offline-bg-${id}`)
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  title="清除背景"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 作者注释面板 */}
      {showAuthorNote && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2">作者注释（影响剧情走向）</div>
                <textarea
                  value={authorNote}
                  onChange={(e) => setAuthorNote(e.target.value)}
                  placeholder="例如：让角色变得更勇敢，故事更加紧张..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-400"
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
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
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
            <div className="max-w-md bg-white shadow-lg px-12 py-16 rounded-lg text-center border border-gray-200">
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
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
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
      
      {/* 动作建议 */}
      {showActions && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs text-gray-500 mb-2">快速动作：</div>
            <div className="flex flex-wrap gap-2">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => selectAction(action)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 剧情分支选择 */}
      {showBranches && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs text-gray-500 mb-2">选择剧情走向：</div>
            <div className="grid grid-cols-2 gap-2">
              {branches.map((branch, index) => (
                <button
                  key={index}
                  onClick={() => selectBranch(branch)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-2xl mx-auto">
          {/* 字数统计 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              {inputValue.length > 0 && `${inputValue.length} 字`}
            </span>
            {autoSaveStatus && (
              <span className={`text-xs flex items-center gap-1 ${
                autoSaveStatus === 'saved' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {autoSaveStatus === 'saving' ? (
                  <>
                    <div className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    保存中
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    已保存
                  </>
                )}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-5 py-3 focus-within:border-gray-400 transition-colors">
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
              {/* 动作建议按钮 */}
              <button
                onClick={generateActionSuggestions}
                className="text-gray-500 hover:text-gray-800 transition-colors"
                title="动作建议"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              
              {/* 剧情分支按钮 */}
              <button
                onClick={generateBranches}
                className="text-gray-500 hover:text-gray-800 transition-colors"
                title="剧情分支"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              
              {/* 发送按钮 */}
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
      />
    </div>
  )
}

export default OfflineChat
