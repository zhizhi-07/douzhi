/**
 * 记忆查看器页面
 * 查看和管理 AI 记住的关于用户的所有记忆
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { memoryManager, Memory } from '../utils/memorySystem'
import { characterService } from '../services/characterService'

const MemoryViewer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const character = id ? characterService.getById(id) : undefined

  const [memories, setMemories] = useState<Memory[]>([])
  const [filter, setFilter] = useState<'all' | Memory['type']>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stats, setStats] = useState<any>(null)
  
  // 添加记忆弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMemory, setNewMemory] = useState({
    type: 'fact' as Memory['type'],
    content: '',
    importance: 5,
    tags: ''
  })

  useEffect(() => {
    if (id) {
      loadMemories()
    }
  }, [id, filter, searchKeyword])

  const loadMemories = () => {
    if (!id) return

    const system = memoryManager.getSystem(id)
    const query: any = {}
    
    if (filter !== 'all') {
      query.type = filter
    }
    
    if (searchKeyword) {
      query.keyword = searchKeyword
    }

    const results = system.searchMemories(query)
    setMemories(results)
    setStats(system.getStatistics())
  }

  const handleDeleteMemory = (memoryId: string) => {
    if (!id) return
    
    if (confirm('确定要删除这条记忆吗？')) {
      const system = memoryManager.getSystem(id)
      system.deleteMemory(memoryId)
      loadMemories()
    }
  }
  
  const handleAddMemory = () => {
    if (!id) return
    if (!newMemory.content.trim()) {
      alert('请输入记忆内容')
      return
    }
    
    const system = memoryManager.getSystem(id)
    const tags = newMemory.tags.split(/[,，\s]+/).filter(t => t.trim())
    
    system.addMemory(
      newMemory.type,
      newMemory.content.trim(),
      newMemory.importance,
      tags
    )
    
    // 重置表单
    setNewMemory({
      type: 'fact',
      content: '',
      importance: 5,
      tags: ''
    })
    setShowAddModal(false)
    loadMemories()
  }

  const handleExport = () => {
    if (!id) return
    
    const system = memoryManager.getSystem(id)
    const data = system.exportMemories()
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character?.realName}_memories_${Date.now()}.json`
    a.click()
  }

  const getTypeLabel = (type: Memory['type']) => {
    const labels = {
      fact: '事实',
      preference: '偏好',
      event: '事件',
      emotion: '情绪',
      relationship: '关系'
    }
    return labels[type]
  }

  const getTypeColor = (_type: Memory['type']) => {
    return 'bg-gray-100 text-gray-900'
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 - 状态栏和导航合并 */}
      <div className="bg-white border-b border-gray-200/50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {character?.realName} 的记忆
              </h1>
              {stats && (
                <p className="text-xs text-gray-500">
                  共 {stats.total} 条记忆
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              新增
            </button>
            <button
              onClick={handleExport}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              导出
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="bg-white px-4 py-3">
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.fact}</div>
              <div className="text-xs text-gray-500">事实</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.preference}</div>
              <div className="text-xs text-gray-500">偏好</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.event}</div>
              <div className="text-xs text-gray-500">事件</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.emotion}</div>
              <div className="text-xs text-gray-500">情绪</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.relationship}</div>
              <div className="text-xs text-gray-500">关系</div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white px-4 py-3">
        <input
          type="text"
          placeholder="搜索记忆..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-100 rounded-lg mb-3 focus:outline-none focus:bg-white"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('fact')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'fact' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            事实
          </button>
          <button
            onClick={() => setFilter('preference')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'preference' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            偏好
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'event' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            事件
          </button>
          <button
            onClick={() => setFilter('emotion')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'emotion' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            情绪
          </button>
          <button
            onClick={() => setFilter('relationship')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'relationship' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            关系
          </button>
        </div>
      </div>

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {memories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div>暂无记忆</div>
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(memory.type)}`}>
                  {getTypeLabel(memory.type)}
                </span>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  删除
                </button>
              </div>
              
              <div className="text-gray-800 mb-2">{memory.content}</div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>重要度: {memory.importance.toFixed(1)}/10</span>
                  <span>访问: {memory.accessCount}次</span>
                </div>
                <span>{formatDate(memory.timestamp)}</span>
              </div>
              
              {memory.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {memory.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 添加记忆弹窗 */}
      {showAddModal && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          
          {/* 弹窗 */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">添加记忆</h2>
            
            {/* 记忆类型 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">记忆类型</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNewMemory({ ...newMemory, type: 'fact' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    newMemory.type === 'fact'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  事实
                </button>
                <button
                  onClick={() => setNewMemory({ ...newMemory, type: 'preference' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    newMemory.type === 'preference'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  偏好
                </button>
                <button
                  onClick={() => setNewMemory({ ...newMemory, type: 'event' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    newMemory.type === 'event'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  事件
                </button>
                <button
                  onClick={() => setNewMemory({ ...newMemory, type: 'emotion' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    newMemory.type === 'emotion'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  情绪
                </button>
                <button
                  onClick={() => setNewMemory({ ...newMemory, type: 'relationship' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    newMemory.type === 'relationship'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  关系
                </button>
              </div>
            </div>
            
            {/* 记忆内容 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">记忆内容</label>
              <textarea
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                placeholder="输入记忆内容..."
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                rows={4}
              />
            </div>
            
            {/* 重要度 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重要度: {newMemory.importance}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newMemory.importance}
                onChange={(e) => setNewMemory({ ...newMemory, importance: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低</span>
                <span>中</span>
                <span>高</span>
              </div>
            </div>
            
            {/* 标签 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">标签（可选）</label>
              <input
                type="text"
                value={newMemory.tags}
                onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                placeholder="用逗号或空格分隔多个标签"
                className="w-full px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            
            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddMemory}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MemoryViewer
