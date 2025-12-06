/**
 * AI记忆库 - 以角色为中心的记忆管理系统
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { unifiedMemoryService, UnifiedMemory } from '../services/unifiedMemoryService'
import { getAllCharacters } from '../utils/characterManager'
import { triggerCharacterMemoryExtraction } from '../services/memoryExtractor'
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
  }, [])

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
          
          <div className="w-9" /> {/* 占位保持居中 */}
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
                      {/* 删除按钮 - 直接显示在右上角 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMemory(memory.id)
                        }}
                        className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除这条记忆"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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

                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMemory(memory.id)
                            }}
                            className="px-4 py-2 text-sm text-red-600 hover:glass-card rounded-lg transition-colors"
                          >
                            删除记忆
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
    </div>
  )
}

export default GlobalMemoryPage
