/**
 * AI记忆库 - 以角色为中心的记忆管理系统
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { unifiedMemoryService, UnifiedMemory } from '../services/unifiedMemoryService'
import { getAllCharacters } from '../utils/characterManager'
import { triggerCharacterMemoryExtraction, retryPendingExtractions, getPendingExtractionCount, interactionCounter } from '../services/memoryExtractor'
import type { Character } from '../services/characterService'

const GlobalMemoryPage = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [memories, setMemories] = useState<UnifiedMemory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<UnifiedMemory | null>(null)
  const [characterMemoryCounts, setCharacterMemoryCounts] = useState<Record<string, number>>({})
  const [searchText, setSearchText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractResult, setExtractResult] = useState<string>('')
  const [pendingCount, setPendingCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [thresholdValue, setThresholdValue] = useState(15)
  const [editingMemory, setEditingMemory] = useState<UnifiedMemory | null>(null)
  const [editSummary, setEditSummary] = useState('')
  const [editTitle, setEditTitle] = useState('')

  // 手动提取记忆
  const handleExtractMemory = async () => {
    if (!selectedCharacter || isExtracting) return
    
    setIsExtracting(true)
    setExtractResult('正在提取...')
    
    try {
      // 清除上次提取时间戳，强制全量提取
      localStorage.removeItem(`last_extract_chat_${selectedCharacter.id}`)
      localStorage.removeItem(`last_extract_moments_${selectedCharacter.id}`)
      
      const results = await triggerCharacterMemoryExtraction(
        selectedCharacter.id,
        selectedCharacter.realName
      )
      
      setExtractResult(`✅ 私聊${results.privateChat} 群聊${results.groupChat} 朋友圈${results.moments} 论坛${results.forum} 线下${results.offline}`)
      // 🔥 更新待提取计数
      setPendingCount(getPendingExtractionCount())
      
      // 刷新记忆列表
      await loadMemories()
      
      // 更新记忆数量
      const mems = await unifiedMemoryService.getMemoriesByCharacter(selectedCharacter.id)
      setCharacterMemoryCounts(prev => ({ ...prev, [selectedCharacter.id]: mems.length }))
    } catch (error) {
      setExtractResult(`❌ 提取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsExtracting(false)
    }
  }

  // 加载角色列表
  useEffect(() => {
    loadCharacters()
    // 🔥 检查待提取队列
    setPendingCount(getPendingExtractionCount())
    // 🔥 加载当前阈值设置
    setThresholdValue(interactionCounter.getThreshold())
  }, [])
  
  // 🔥 启动时自动重试待提取任务
  useEffect(() => {
    const count = getPendingExtractionCount()
    if (count > 0) {
      console.log(`🔄 [记忆库] 发现 ${count} 个待提取任务，将在后台重试...`)
      // 延迟2秒后开始重试，避免影响页面加载
      const timer = setTimeout(async () => {
        setIsRetrying(true)
        try {
          await retryPendingExtractions()
        } finally {
          setIsRetrying(false)
          setPendingCount(getPendingExtractionCount())
          // 重试后刷新记忆列表
          loadCharacters()
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])
  
  // 🔥 手动重试所有待提取任务
  const handleRetryPending = async () => {
    if (isRetrying) return
    setIsRetrying(true)
    try {
      await retryPendingExtractions()
      setPendingCount(getPendingExtractionCount())
      await loadCharacters()
      if (selectedCharacter) {
        await loadMemories()
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
    
    // 预加载每个角色的记忆数量
    const counts: Record<string, number> = {}
    for (const char of chars) {
      const mems = await unifiedMemoryService.getMemoriesByCharacter(char.id)
      counts[char.id] = mems.length
    }
    setCharacterMemoryCounts(counts)
  }

  // 加载记忆
  const loadMemories = async () => {
    if (!selectedCharacter) {
      setMemories([])
      return
    }
    
    let result = await unifiedMemoryService.getMemoriesByCharacter(selectedCharacter.id)
    
    // 搜索过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      result = result.filter(m =>
        m.title.toLowerCase().includes(lowerSearch) ||
        m.summary.toLowerCase().includes(lowerSearch) ||
        m.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
      )
    }
    
    setMemories(result)
  }

  useEffect(() => {
    loadMemories()
  }, [selectedCharacter, searchText])

  // 删除记忆（真实删除）
  const deleteMemory = async (id: string) => {
    if (confirm('确定删除这条记忆？此操作不可恢复！')) {
      await unifiedMemoryService.deleteMemory(id)
      console.log('✅ [记忆删除] 已从IndexedDB中永久删除记忆:', id)
      await loadMemories()
      if (selectedMemory?.id === id) {
        setSelectedMemory(null)
      }
      // 更新角色记忆数量
      if (selectedCharacter) {
        const mems = await unifiedMemoryService.getMemoriesByCharacter(selectedCharacter.id)
        setCharacterMemoryCounts(prev => ({ ...prev, [selectedCharacter.id]: mems.length }))
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 状态栏 */}
      <StatusBar />
      
      {/* 顶部导航 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold">AI记忆库</h1>
          
          {/* 🔥 右侧按钮组 */}
          <div className="flex items-center gap-2">
            {/* 设置按钮 - 更明显 */}
            <button
              onClick={() => setShowThresholdModal(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              设置
            </button>
            {/* 待提取队列状态 */}
            {pendingCount > 0 && (
              <button
                onClick={handleRetryPending}
                disabled={isRetrying}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  isRetrying
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-orange-100 text-orange-600 active:scale-95'
                }`}
              >
                {isRetrying ? '重试中...' : `❗${pendingCount}待提取`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 选择角色 */}
      {!selectedCharacter ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">选择角色</h2>
            <div className="grid grid-cols-1 gap-3">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  {char.avatar && (
                    <img src={char.avatar} alt={char.realName} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{char.realName}</div>
                    <div className="text-sm text-gray-500">
                      {characterMemoryCounts[char.id] || 0} 条记忆
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              {characters.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>暂无角色</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 角色信息栏 */}
          <div className="px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCharacter(null)
                  setSelectedMemory(null)
                  setSearchText('')
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                切换角色
              </button>
              
              <div className="flex items-center gap-2">
                {selectedCharacter.avatar && (
                  <img src={selectedCharacter.avatar} alt={selectedCharacter.realName} className="w-8 h-8 rounded-full object-cover" />
                )}
                <span className="font-medium">{selectedCharacter.realName}</span>
              </div>
              
              <div className="text-sm text-gray-500">
                {memories.length} 条
              </div>
            </div>
          </div>

          {/* 提取记忆按钮 */}
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleExtractMemory}
                disabled={isExtracting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isExtracting
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white active:scale-95 hover:bg-blue-600'
                }`}
              >
                {isExtracting ? '提取中...' : '🧠 提取记忆'}
              </button>
              {extractResult && (
                <span className="text-xs text-gray-600 flex-1">{extractResult}</span>
              )}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="px-4 py-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索记忆..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* 记忆列表 */}
          <div className="flex-1 overflow-y-auto">
            {memories.length > 0 ? (
              <div className="space-y-2 p-4">
                {memories.map(memory => (
                  <div
                    key={memory.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${selectedMemory?.id === memory.id ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => setSelectedMemory(selectedMemory?.id === memory.id ? null : memory)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{memory.title}</h3>
                          {memory.importance === 'high' && (
                            <span className="text-red-500 text-sm">⭐</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${memory.domain === 'chat' ? 'bg-blue-100 text-blue-600' : memory.domain === 'action' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                            {memory.domain === 'chat' ? '总结' : memory.domain === 'action' ? '记忆' : '朋友圈'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{memory.summary}</p>
                      </div>
                      {/* 删除按钮 - 红色文字更明显 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMemory(memory.id)
                        }}
                        className="ml-2 px-2 py-1 text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                      >
                        删除
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(memory.timestamp).toLocaleDateString('zh-CN')}
                      </span>
                      {memory.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* 展开详情 */}
                    {selectedMemory?.id === memory.id && (
                      <div className="mt-4 pt-4">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium mb-2">完整总结</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{memory.summary}</p>
                        </div>

                        {memory.tags.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">标签</h4>
                            <div className="flex flex-wrap gap-2">
                              {memory.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 显示时间范围 */}
                        {memory.timeRange && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">对话时间</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(memory.timeRange.start).toLocaleString('zh-CN')} 至 {new Date(memory.timeRange.end).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMemory(memory)
                              setEditTitle(memory.title)
                              setEditSummary(memory.summary)
                            }}
                            className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                          >
                            编辑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMemory(memory.id)
                            }}
                            className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">暂无记忆</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 🔥 阈值设置弹窗 */}
      {showThresholdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowThresholdModal(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">记忆提取设置</h3>
            <p className="text-sm text-gray-500 mb-4">
              这是<span className="font-medium text-orange-600">全局设置</span>，影响所有AI角色。每过设定的轮数后，系统会自动提取记忆。
            </p>
            <p className="text-xs text-gray-400 mb-4">
              一轮 = 一次AI回复，包括私聊、论坛评论、群聊等所有互动。
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">每</span>
              <input
                type="number"
                min={1}
                max={100}
                value={thresholdValue}
                onChange={e => setThresholdValue(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">轮提取一次记忆</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowThresholdModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={() => {
                  interactionCounter.setThreshold(thresholdValue)
                  setShowThresholdModal(false)
                }}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium active:scale-95 transition-transform"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔥 编辑记忆弹窗 */}
      {editingMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingMemory(null)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">编辑记忆</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="记忆标题"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={6}
                  placeholder="记忆内容..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingMemory(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (editingMemory) {
                    await unifiedMemoryService.updateMemory(editingMemory.id, {
                      title: editTitle,
                      summary: editSummary
                    })
                    setEditingMemory(null)
                    await loadMemories()
                    console.log('✅ 记忆已更新')
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium active:scale-95 transition-transform"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalMemoryPage
