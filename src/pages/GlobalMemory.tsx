/**
 * AI记忆库 - 以角色为中心的记忆管理系统
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { globalMemoryManager, GlobalMemory } from '../utils/globalMemoryManager'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'

const GlobalMemoryPage = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [memories, setMemories] = useState<GlobalMemory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<GlobalMemory | null>(null)
  const [searchText, setSearchText] = useState('')

  // 加载角色列表
  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
  }

  // 加载记忆
  const loadMemories = () => {
    if (!selectedCharacter) {
      setMemories([])
      return
    }
    
    const result = globalMemoryManager.queryMemories({
      characterId: selectedCharacter.id,
      searchText: searchText || undefined
    })
    setMemories(result)
  }

  useEffect(() => {
    loadMemories()
  }, [selectedCharacter, searchText])

  // 删除记忆
  const deleteMemory = (id: string) => {
    if (confirm('确定删除这条记忆？')) {
      globalMemoryManager.deleteMemory(id)
      loadMemories()
      if (selectedMemory?.id === id) {
        setSelectedMemory(null)
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
                      {globalMemoryManager.queryMemories({ characterId: char.id }).length} 条记忆
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
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{memory.summary}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(memory.createdAt).toLocaleDateString('zh-CN')}
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

                        {memory.messages && memory.messages.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">对话片段</h4>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                              {memory.messages.slice(0, 10).map((msg, index) => (
                                <div key={index} className="text-sm">
                                  <span className={`font-medium ${msg.type === 'sent' ? 'text-blue-600' : 'text-green-600'}`}>
                                    {msg.type === 'sent' ? '我' : selectedCharacter.realName}：
                                  </span>
                                  <span className="text-gray-600">
                                    {msg.content?.substring(0, 100)}
                                    {msg.content && msg.content.length > 100 ? '...' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
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
