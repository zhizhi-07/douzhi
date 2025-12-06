/**
 * 记忆储存系统 - 保存和管理重要对话片段
 */

import { useState, useEffect } from 'react'
import { Message } from '../types/chat'
import { generateAISummaryWithMeta } from '../utils/subApiManager'
import { saveMessages } from '../utils/simpleMessageManager'

interface MemoryItem {
  id: string
  title: string
  summary: string
  messages: Message[]
  tags: string[]
  createdAt: number
  importance: 'low' | 'normal' | 'high'
  characterId: string
}

interface MemoryStorageProps {
  isOpen: boolean
  onClose: () => void
  currentMessages: Message[]
  characterId: string
  characterName: string
  onLoadMemory?: (messages: Message[]) => void
  allMessages?: Message[]  // 所有聊天消息（用于插入线下记录）
  onUpdateMessages?: (messages: Message[]) => void  // 更新消息列表
}

const MemoryStorage: React.FC<MemoryStorageProps> = ({
  isOpen,
  onClose,
  currentMessages,
  characterId,
  characterName,
  onLoadMemory,
  allMessages,
  onUpdateMessages
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [memoryTitle, setMemoryTitle] = useState('')
  const [memoryTags, setMemoryTags] = useState('')
  const [memoryImportance, setMemoryImportance] = useState<'low' | 'normal' | 'high'>('normal')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState('')

  // 加载记忆
  useEffect(() => {
    const savedMemories = localStorage.getItem(`memories-${characterId}`)
    if (savedMemories) {
      try {
        setMemories(JSON.parse(savedMemories))
      } catch (e) {
        console.error('Failed to load memories:', e)
      }
    }
  }, [characterId])

  // 保存记忆列表
  const saveMemories = (newMemories: MemoryItem[]) => {
    localStorage.setItem(`memories-${characterId}`, JSON.stringify(newMemories))
    setMemories(newMemories)
  }

  // 生成总结
  const generateSummary = async () => {
    if (currentMessages.length === 0) {
      alert('没有消息可以总结')
      return
    }

    console.log('📝 开始生成总结，消息数量:', currentMessages.length)
    setIsGeneratingSummary(true)
    
    try {
      // 构建对话内容
      const conversationText = currentMessages.map(m => {
        const sender = m.type === 'sent' ? '用户' : characterName
        return `${sender}: ${m.content || ''}`
      }).join('\n')

      console.log('📝 对话文本长度:', conversationText.length, '字符')
      console.log('📝 调用AI生成总结（含标题和标签）...')

      // 使用新的API生成带标题和标签的总结
      const result = await generateAISummaryWithMeta(conversationText)

      console.log('✅ 总结生成成功:', result.title, result.tags)
      setGeneratedSummary(result.summary)
      setMemoryTitle(result.title)           // 🔥 自动填充标题
      setMemoryTags(result.tags.join(', '))  // 🔥 自动填充标签
      
    } catch (error) {
      console.error('❌ AI总结失败:', error)
      
      // 显示用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`AI总结失败: ${errorMessage}\n\n将使用简单总结`)
      
      // 备用：使用简单总结
      const messageCount = currentMessages.length
      const userMessages = currentMessages.filter(m => m.type === 'sent').length
      const aiMessages = currentMessages.filter(m => m.type === 'received').length
      
      const summary = `这段对话包含 ${messageCount} 条消息（用户 ${userMessages} 条，${characterName} ${aiMessages} 条）`
      console.log('📝 使用备用总结:', summary)
      setGeneratedSummary(summary)
    } finally {
      console.log('📝 总结流程结束，打开保存对话框')
      setIsGeneratingSummary(false)
      setShowSaveDialog(true)
    }
  }

  // 保存记忆
  const saveMemory = () => {
    if (!memoryTitle.trim()) {
      alert('请输入记忆标题')
      return
    }

    const now = Date.now()
    const newMemory: MemoryItem = {
      id: `memory-${now}`,
      title: memoryTitle,
      summary: generatedSummary || '暂无总结',
      messages: [...currentMessages],
      tags: memoryTags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: now,
      importance: memoryImportance,
      characterId
    }

    saveMemories([...memories, newMemory])
    
    // 🔥 同时在线上聊天中创建一条线下记录消息
    if (allMessages && onUpdateMessages) {
      const offlineSummaryMessage: Message = {
        id: now,
        type: 'system',
        messageType: 'offline-summary',
        content: memoryTitle,
        time: new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now,
        sceneMode: 'online',
        offlineSummary: {
          title: memoryTitle,
          summary: generatedSummary || '暂无总结',
          memoryId: newMemory.id
        },
        aiReadableContent: `[系统记录：线下经历 - ${memoryTitle}]
总结：${generatedSummary || '暂无总结'}`
      }
      
      // 插入到消息列表中，按时间排序
      const updatedMessages = [...allMessages, offlineSummaryMessage]
        .sort((a, b) => a.timestamp - b.timestamp)
      
      // 保存到IndexedDB
      saveMessages(characterId, updatedMessages)
      
      // 更新UI
      onUpdateMessages(updatedMessages)
      
      console.log('✅ 线下记录已插入线上聊天:', memoryTitle)
    }
    
    // 重置表单
    setMemoryTitle('')
    setMemoryTags('')
    setMemoryImportance('normal')
    setGeneratedSummary('')
    setShowSaveDialog(false)
    
    alert('记忆已保存！并在线上聊天中创建了线下记录。')
  }

  // 删除记忆
  const deleteMemory = (memoryId: string) => {
    if (confirm('确定删除这条记忆？')) {
      saveMemories(memories.filter(m => m.id !== memoryId))
      if (selectedMemory?.id === memoryId) {
        setSelectedMemory(null)
      }
    }
  }

  // 获取所有标签
  const allTags = Array.from(new Set(memories.flatMap(m => m.tags)))

  // 过滤记忆
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = searchQuery === '' || 
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.summary.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = filterTag === '' || memory.tags.includes(filterTag)
    
    return matchesSearch && matchesTag
  })

  // 重要度颜色
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'normal': return 'text-gray-600 bg-gray-50'
      case 'low': return 'text-gray-400 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">记忆储存</h2>
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {memories.length} 条记忆
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateSummary}
              disabled={isGeneratingSummary || currentMessages.length === 0}
              className="px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {isGeneratingSummary ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  总结中...
                </span>
              ) : (
                '生成总结'
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记忆..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">所有标签</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {/* 主体内容 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 记忆列表 */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {filteredMemories.length > 0 ? (
              filteredMemories.map(memory => (
                <div
                  key={memory.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedMemory?.id === memory.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm text-gray-900">{memory.title}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getImportanceColor(memory.importance)}`}>
                      {memory.importance === 'high' ? '重要' : memory.importance === 'normal' ? '普通' : '一般'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{memory.summary}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(memory.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    {memory.tags.length > 0 && (
                      <div className="flex gap-1">
                        {memory.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                        {memory.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{memory.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm">暂无记忆</p>
                <p className="text-xs mt-1">点击"生成总结"保存当前对话</p>
              </div>
            )}
          </div>

          {/* 记忆详情 */}
          <div className="flex-1 overflow-y-auto">
            {selectedMemory ? (
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{selectedMemory.title}</h3>
                    <div className="flex gap-2">
                      {onLoadMemory && (
                        <button
                          onClick={() => {
                            onLoadMemory(selectedMemory.messages)
                            onClose()
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          加载对话
                        </button>
                      )}
                      <button
                        onClick={() => deleteMemory(selectedMemory.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>创建时间：{new Date(selectedMemory.createdAt).toLocaleString('zh-CN')}</div>
                    <div>消息数量：{selectedMemory.messages.length} 条</div>
                    <div className="flex items-center gap-2">
                      重要程度：
                      <span className={`px-2 py-0.5 rounded text-xs ${getImportanceColor(selectedMemory.importance)}`}>
                        {selectedMemory.importance === 'high' ? '重要' : selectedMemory.importance === 'normal' ? '普通' : '一般'}
                      </span>
                    </div>
                    {selectedMemory.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        标签：
                        {selectedMemory.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-2">总结</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {selectedMemory.summary}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium mb-2">对话内容预览</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {selectedMemory.messages.slice(0, 10).map((msg, index) => (
                      <div key={index} className="text-sm">
                        <span className={`font-medium ${msg.type === 'sent' ? 'text-blue-600' : 'text-green-600'}`}>
                          {msg.type === 'sent' ? '我' : characterName}：
                        </span>
                        <span className="text-gray-600">
                          {msg.content?.substring(0, 100)}{msg.content && msg.content.length > 100 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                    {selectedMemory.messages.length > 10 && (
                      <div className="text-xs text-gray-400 text-center mt-2">
                        还有 {selectedMemory.messages.length - 10} 条消息...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">选择一条记忆查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 保存记忆对话框 */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={() => setShowSaveDialog(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">保存记忆</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <input
                    type="text"
                    value={memoryTitle}
                    onChange={(e) => setMemoryTitle(e.target.value)}
                    placeholder="给这段记忆起个名字..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">总结</label>
                  <textarea
                    value={generatedSummary}
                    onChange={(e) => setGeneratedSummary(e.target.value)}
                    placeholder="描述这段对话的主要内容..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={memoryTags}
                    onChange={(e) => setMemoryTags(e.target.value)}
                    placeholder="例如：重要对话, 剧情转折, 感情发展"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">重要程度</label>
                  <div className="flex gap-2">
                    {(['low', 'normal', 'high'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setMemoryImportance(level)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          memoryImportance === level
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {level === 'high' ? '重要' : level === 'normal' ? '普通' : '一般'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={saveMemory}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryStorage
