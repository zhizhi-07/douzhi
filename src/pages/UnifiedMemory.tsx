/**
 * 统一记忆管理 - 文艺极简版
 * Design: 极简、留白、杂志感、黑白灰主调
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { unifiedMemoryService, type UnifiedMemory, type MemoryDomain } from '../services/unifiedMemoryService'
import { characterService } from '../services/characterService'

// 角色类型
interface Character {
  id: string
  name: string
  avatar?: string
}

// 使用统一记忆类型
type Memory = UnifiedMemory

const UnifiedMemory = () => {
  const navigate = useNavigate()
  
  // 状态管理
  const [memories, setMemories] = useState<Memory[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedDomain, setSelectedDomain] = useState<MemoryDomain>('all')
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // 添加记忆表单
  const [newMemory, setNewMemory] = useState<{
    characterId: string
    domain: MemoryDomain
    title: string
    summary: string
    importance: 'high' | 'normal' | 'low'
    tags: string
    date: string
    startTime: string
    endTime: string
  }>({
    characterId: '',
    domain: 'chat',
    title: '',
    summary: '',
    importance: 'normal',
    tags: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: ''
  })

  // 加载数据 + 自动迁移旧记忆
  useEffect(() => {
    const init = async () => {
      await loadCharacters()
      await migrateOldMemories()  // 自动迁移
      await loadMemories()
    }
    init()
  }, [])
  
  // 自动迁移旧记忆（静默执行）
  const migrateOldMemories = async () => {
    const allChars = characterService.getAll()
    let migrated = 0
    
    for (const char of allChars) {
      // 1. 迁移 memories_${id} 的数据
      const memoriesKey = `memories_${char.id}`
      const oldData = localStorage.getItem(memoriesKey)
      if (oldData) {
        try {
          const memoriesArray = JSON.parse(oldData) as Array<[string, any]>
          for (const [_, memory] of memoriesArray) {
            await unifiedMemoryService.addMemory({
              domain: 'action',  // 记忆类型
              characterId: char.id,
              characterName: char.nickname || char.realName,
              characterAvatar: char.avatar,
              title: memory.type || '记忆',
              summary: memory.content,
              importance: memory.importance >= 7 ? 'high' : memory.importance >= 4 ? 'normal' : 'low',
              tags: memory.tags || [],
              timestamp: memory.timestamp || Date.now(),
              emotionalTone: 'neutral',
              extractedBy: 'manual'
            })
            migrated++
          }
          localStorage.removeItem(memoriesKey)
          console.log(`✅ 已迁移 ${char.realName} 的 ${memoriesArray.length} 条记忆`)
        } catch (e) {
          console.error(`迁移记忆失败:`, e)
        }
      }
      
      // 2. 迁移 memory_timeline_${id} 的时间线数据
      const timelineKey = `memory_timeline_${char.id}`
      const timelineData = localStorage.getItem(timelineKey)
      if (timelineData && timelineData.trim()) {
        try {
          // 从时间线文本中解析真实的时间范围
          // 格式如：[11/28 22:24-11/28 22:29] 或 [11/28 22:24-22:29]
          const timeMatches = timelineData.match(/\[(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})-(?:(\d{1,2})\/(\d{1,2})\s+)?(\d{1,2}):(\d{2})\]/g)
          
          let startTime: number | undefined
          let endTime: number | undefined
          
          if (timeMatches && timeMatches.length > 0) {
            // 只解析第一个事件的时间范围
            const firstEventMatch = timeMatches[0].match(/\[(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})-(?:(\d{1,2})\/(\d{1,2})\s+)?(\d{1,2}):(\d{2})\]/)
            if (firstEventMatch) {
              const now = new Date()
              // 开始时间
              startTime = new Date(now.getFullYear(), parseInt(firstEventMatch[1]) - 1, parseInt(firstEventMatch[2]), parseInt(firstEventMatch[3]), parseInt(firstEventMatch[4])).getTime()
              // 结束时间（如果没有独立的月/日，使用开始时间的月/日）
              const endMonth = firstEventMatch[5] ? parseInt(firstEventMatch[5]) - 1 : parseInt(firstEventMatch[1]) - 1
              const endDay = firstEventMatch[6] ? parseInt(firstEventMatch[6]) : parseInt(firstEventMatch[2])
              endTime = new Date(now.getFullYear(), endMonth, endDay, parseInt(firstEventMatch[7]), parseInt(firstEventMatch[8])).getTime()
            }
          }
          
          // 如果解析失败，使用最后处理时间
          if (!startTime || !endTime) {
            const lastProcessedTs = localStorage.getItem(`memory_last_processed_ts_${char.id}`)
            endTime = lastProcessedTs ? parseInt(lastProcessedTs) : Date.now()
            startTime = endTime - (7 * 24 * 60 * 60 * 1000)  // 往前7天
          }
          
          await unifiedMemoryService.addMemory({
            domain: 'chat',  // 总结类型
            characterId: char.id,
            characterName: char.nickname || char.realName,
            characterAvatar: char.avatar,
            title: '历史总结',
            summary: timelineData,
            importance: 'high',
            tags: ['时间线', '总结'],
            timestamp: endTime,
            emotionalTone: 'neutral',
            extractedBy: 'manual',
            timeRange: {
              start: startTime,
              end: endTime
            }
          })
          migrated++
          localStorage.removeItem(timelineKey)
          localStorage.removeItem(`memory_last_processed_ts_${char.id}`)
          console.log(`✅ 已迁移 ${char.realName} 的时间线总结`)
        } catch (e) {
          console.error(`迁移时间线失败:`, e)
        }
      }
    }
    
    if (migrated > 0) {
      console.log(`📦 总共迁移了 ${migrated} 条数据`)
    }
    
    // 3. 修复已迁移但没有正确timeRange的记忆（只取第一个事件的时间）
    const allMemories = await unifiedMemoryService.getAllMemories()
    for (const mem of allMemories) {
      if (mem.title === '历史总结' && mem.summary) {
        // 尝试从文本解析第一个事件的时间
        const firstEventMatch = mem.summary.match(/\[(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})-(?:(\d{1,2})\/(\d{1,2})\s+)?(\d{1,2}):(\d{2})\]/)
        
        if (firstEventMatch) {
          const now = new Date()
          const startTime = new Date(now.getFullYear(), parseInt(firstEventMatch[1]) - 1, parseInt(firstEventMatch[2]), parseInt(firstEventMatch[3]), parseInt(firstEventMatch[4])).getTime()
          const endMonth = firstEventMatch[5] ? parseInt(firstEventMatch[5]) - 1 : parseInt(firstEventMatch[1]) - 1
          const endDay = firstEventMatch[6] ? parseInt(firstEventMatch[6]) : parseInt(firstEventMatch[2])
          const endTime = new Date(now.getFullYear(), endMonth, endDay, parseInt(firstEventMatch[7]), parseInt(firstEventMatch[8])).getTime()
          
          // 只有当解析出的时间和现有的不同时才更新
          if (!mem.timeRange || mem.timeRange.start !== startTime || mem.timeRange.end !== endTime) {
            await unifiedMemoryService.updateMemory(mem.id, {
              timeRange: { start: startTime, end: endTime }
            })
            console.log(`🔧 已修复 ${mem.characterName} 的历史总结时间范围`)
          }
        }
      }
    }
  }

  const loadCharacters = () => {
    // 从角色服务加载真实角色
    const allCharacters = characterService.getAll()
    const characterList: Character[] = allCharacters.map(char => ({
      id: char.id,
      name: char.nickname || char.realName,
      avatar: char.avatar
    }))
    setCharacters(characterList)
  }

  const loadMemories = async () => {
    // 从数据库加载真实记忆
    const realMemories = await unifiedMemoryService.getAllMemories()
    
    // 如果没有记忆，添加一些示例数据
    if (realMemories.length === 0) {
      console.log('📝 [记忆系统] 首次使用，添加示例记忆...')
      await addSampleMemories()
      const updated = await unifiedMemoryService.getAllMemories()
      setMemories(updated)
    } else {
      setMemories(realMemories)
    }
  }

  // 添加示例记忆（仅首次使用）
  const addSampleMemories = async () => {
    const sampleMemories: Omit<Memory, 'id'>[] = [
      {
        domain: 'chat',
        characterId: '1',
        characterName: '汁汁',
        characterAvatar: undefined,
        title: '关于未来的约定',
        summary: '深夜里，我们聊起了关于未来的规划。他说想要换一份工作，去一个能看到海的城市。那个瞬间，我觉得我们的距离前所未有的近。',
        importance: 'high',
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        tags: ['约定', '深度对话', '未来'],
        emotionalTone: 'positive',
        extractedBy: 'manual'
      },
      {
        domain: 'moments',
        characterId: '2',
        characterName: '分发',
        characterAvatar: undefined,
        title: '雨天的问候',
        summary: '在你那条"心情不好"的朋友圈下，他写下了一段很长的评论。不像平时那么吊儿郎当，字里行间都是小心翼翼的安慰。',
        importance: 'normal',
        timestamp: Date.now() - 1000 * 60 * 60 * 25,
        tags: ['朋友圈', '安慰'],
        emotionalTone: 'positive',
        extractedBy: 'manual'
      },
      {
        domain: 'action',
        characterId: '1',
        characterName: '汁汁',
        characterAvatar: undefined,
        title: '无声的陪伴',
        summary: '没有任何征兆，只是发来了一张天空的照片。不需要多说什么，这份默契已经足够。',
        importance: 'normal',
        timestamp: Date.now() - 1000 * 60 * 60 * 48,
        tags: ['主动', '分享'],
        emotionalTone: 'positive',
        extractedBy: 'manual'
      },
      {
        domain: 'chat',
        characterId: '3',
        characterName: '唐秋水',
        characterAvatar: undefined,
        title: '争执之后',
        summary: '虽然还在生气，但还是别扭地问了一句"吃饭了吗"。这大概就是他表达歉意的方式吧。',
        importance: 'low',
        timestamp: Date.now() - 1000 * 60 * 60 * 72,
        tags: ['日常', '和解'],
        emotionalTone: 'neutral',
        extractedBy: 'manual'
      }
    ]
    
    // 保存到数据库
    for (const mem of sampleMemories) {
      await unifiedMemoryService.addMemory(mem)
    }
  }

  // 统计数据（按类型统计：总结=chat, 记忆=其他）
  const stats = useMemo(() => {
    return {
      total: memories.length,
      summary: memories.filter(m => m.domain === 'chat').length,
      memory: memories.filter(m => m.domain !== 'chat').length,
    }
  }, [memories])

  // 过滤记忆（按类型过滤：summary=chat, memory=其他）+ 按时间排序
  const filteredMemories = useMemo(() => {
    return memories
      .filter(memory => {
        // 按类型过滤
        if (selectedDomain === 'summary' && memory.domain !== 'chat') return false
        if (selectedDomain === 'memory' && memory.domain === 'chat') return false
        if (selectedCharacter !== 'all' && memory.characterId !== selectedCharacter) return false
        return true
      })
      // 按时间排序（优先用timeRange.start，否则用timestamp）
      .sort((a, b) => {
        const timeA = a.timeRange?.start || a.timestamp
        const timeB = b.timeRange?.start || b.timestamp
        return timeB - timeA  // 新的在前
      })
  }, [memories, selectedDomain, selectedCharacter])

  // 格式化日期 - 文艺风格
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const week = weekDays[date.getDay()]
    return {
      date: `${month}.${day.toString().padStart(2, '0')}`,
      week,
      full: date.toLocaleString('zh-CN', { hour12: false, month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
  
  // 格式化时间范围（只显示时间，不显示日期）
  const formatTimeRange = (memory: any) => {
    if (memory.timeRange) {
      const start = new Date(memory.timeRange.start)
      const end = new Date(memory.timeRange.end)
      const formatTime = (d: Date) => 
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      return `${formatTime(start)}-${formatTime(end)}`
    }
    return ''
  }
  
  // 清理summary中的垃圾文字
  const cleanSummary = (summary: any) => {
    if (!summary || typeof summary !== 'string') {
      return ''
    }
    return summary
      .replace(/【记忆更新[^】]*】[^\n]*/g, '')  // 删除【记忆更新...】行
      .replace(/提取记忆:\s*\d+\s*条/g, '')  // 删除"提取记忆: X 条"
      .replace(/\[\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}-(?:\d{1,2}\/\d{1,2}\s+)?\d{1,2}:\d{2}\]\s*/g, '')  // 删除[11/28 22:24-22:29]
      .replace(/━+/g, '')  // 删除分隔线
      .replace(/\n{3,}/g, '\n\n')  // 多余空行合并
      .trim()
  }

  // 分类映射（简化版：总结 + 记忆）
  const categoryMap: Record<string, string> = {
    all: '全部',
    summary: '总结',
    memory: '记忆'
  }

  // 处理删除记忆
  const handleDeleteMemory = async (id: string) => {
    if (confirm('确定删除这条记忆？此操作不可恢复！')) {
      await unifiedMemoryService.deleteMemory(id)
      console.log('✅ [记忆删除] 已从IndexedDB中永久删除记忆:', id)
      setSelectedMemory(null)
      await loadMemories()
    }
  }

  // 处理添加记忆
  const handleAddMemory = async () => {
    if (!newMemory.characterId || !newMemory.title || !newMemory.summary) {
      alert('请填写完整信息')
      return
    }

    const selectedChar = characters.find(c => c.id === newMemory.characterId)
    if (!selectedChar) {
      alert('请选择角色')
      return
    }

    const tagsArray = newMemory.tags
      .split(/[,，、\s]+/)
      .map(t => t.trim())
      .filter(t => t)

    // 构建timeRange
    let timeRange: { start: number; end: number } | undefined
    if (newMemory.date && newMemory.startTime) {
      const startDate = new Date(`${newMemory.date}T${newMemory.startTime}`)
      const endDate = newMemory.endTime 
        ? new Date(`${newMemory.date}T${newMemory.endTime}`)
        : startDate
      timeRange = {
        start: startDate.getTime(),
        end: endDate.getTime()
      }
    }

    await unifiedMemoryService.addMemory({
      domain: newMemory.domain,
      characterId: selectedChar.id,
      characterName: selectedChar.name,
      characterAvatar: selectedChar.avatar,
      title: newMemory.title,
      summary: newMemory.summary,
      importance: newMemory.importance,
      tags: tagsArray,
      timestamp: Date.now(),
      emotionalTone: 'neutral',
      extractedBy: 'manual',
      timeRange
    })

    // 刷新列表
    await loadMemories()

    // 重置表单
    setNewMemory({
      characterId: '',
      domain: 'chat',
      title: '',
      summary: '',
      importance: 'normal',
      tags: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: ''
    })

    setShowAddModal(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#f9f9f9] text-gray-800 font-sans selection:bg-gray-200">
      <StatusBar />
      
      {/* 顶部导航 - 极简风格 */}
      <div className="px-6 pt-6 pb-4 bg-[#f9f9f9] z-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            {/* 添加记忆按钮 */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-2 hover:bg-gray-900 bg-gray-800 text-white rounded-full transition-colors"
              title="手动添加记忆"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* 大标题区域 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-wide text-gray-900 font-serif">
            记忆碎片
          </h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 tracking-wider uppercase">
            <span>Total {stats.total}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>总结 {stats.summary}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>记忆 {stats.memory}</span>
          </div>
        </div>

        {/* 角色选择栏 */}
        <div className="flex gap-4 mt-8 overflow-x-auto scrollbar-hide pb-2">
          {/* 全部 */}
          <button
            onClick={() => setSelectedCharacter('all')}
            className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
              selectedCharacter === 'all' ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
              selectedCharacter === 'all' 
                ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                : 'bg-white border-gray-200 text-gray-400'
            }`}>
              <span className="text-xs tracking-widest">ALL</span>
            </div>
            <span className={`text-xs tracking-wider ${selectedCharacter === 'all' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              全部
            </span>
          </button>

          {/* 角色列表 */}
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                selectedCharacter === char.id ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'
              }`}
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden border transition-all ${
                selectedCharacter === char.id 
                  ? 'border-gray-900 shadow-lg' 
                  : 'border-gray-200'
              }`}>
                {char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    {char.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className={`text-xs tracking-wider ${selectedCharacter === char.id ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {char.name}
              </span>
            </button>
          ))}
        </div>

        {/* 分类Tab：总结 + 记忆 */}
        <div className="flex gap-8 mt-4 border-b border-gray-200/60 pb-1 overflow-x-auto scrollbar-hide">
          {(['all', 'summary', 'memory'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedDomain(cat as any)}
              className={`pb-3 text-sm tracking-widest transition-colors relative whitespace-nowrap ${
                selectedDomain === cat
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {categoryMap[cat]}
              {selectedDomain === cat && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 记忆列表 - 杂志风格 */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-8">
          {filteredMemories.map((memory, index) => {
            // 使用timeRange.start作为日期，否则用timestamp
            const displayTime = memory.timeRange?.start || memory.timestamp
            const timeData = formatDate(displayTime)
            const timeRangeStr = formatTimeRange(memory)
            return (
              <div
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex gap-4">
                  {/* 左侧时间轴 */}
                  <div className="flex flex-col items-center pt-1 w-12 shrink-0">
                    <span className="text-xl font-serif text-gray-900 leading-none">{timeData.date.split('.')[1]}</span>
                    <span className="text-[10px] text-gray-400 uppercase mt-1 tracking-wider">{timeData.week}</span>
                  </div>

                  {/* 右侧内容卡片 */}
                  <div className="flex-1 pb-8 border-b border-gray-100 group-last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {memory.importance === 'high' && (
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        )}
                        <span className="text-xs text-gray-400 tracking-wide">
                           {timeRangeStr ? `${timeRangeStr} · ` : ''}{memory.characterName}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-800 mb-3 group-hover:text-gray-600 transition-colors">
                      {memory.title}
                    </h3>

                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 font-light">
                      {cleanSummary(memory.summary)}
                    </p>

                    {/* 底部标签 */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {memory.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-gray-400 px-2 py-1 bg-gray-100 rounded-sm tracking-wide">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {filteredMemories.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-gray-300 font-serif text-4xl mb-4">Empty</div>
              <p className="text-gray-400 text-xs tracking-widest uppercase">No memories found</p>
            </div>
          )}
        </div>
      </div>

      {/* 详情弹窗 - 极简风格 */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col animate-fade-in"
          onClick={() => setSelectedMemory(null)}
        >
          <div 
            className="flex-1 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <div className="sticky top-0 flex justify-end p-6 bg-white/0 z-10">
              <button
                onClick={() => setSelectedMemory(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-12 max-w-2xl mx-auto mt-10">
              {/* 元数据 */}
              <div className="flex items-center gap-3 mb-6 text-sm text-gray-400 font-light tracking-widest uppercase">
                <span>{formatDate(selectedMemory.timestamp).full}</span>
                <span className="w-px h-3 bg-gray-300" />
                <span>{selectedMemory.domain === 'chat' ? '总结' : '记忆'}</span>
              </div>

              {/* 标题 */}
              <h2 className="text-3xl font-serif text-gray-900 mb-8 leading-tight">
                {selectedMemory.title}
              </h2>

              {/* 角色信息 */}
              <div className="flex items-center gap-3 mb-10 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                   {selectedMemory.characterAvatar ? (
                     <img src={selectedMemory.characterAvatar} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">AI</div>
                   )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{selectedMemory.characterName}</div>
                  <div className="text-xs text-gray-400">
                    {selectedMemory.importance === 'high' ? '核心记忆' : '普通记忆'}
                  </div>
                </div>
              </div>

              {/* 正文 */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-loose text-lg font-light text-justify">
                  {selectedMemory.summary}
                </p>
              </div>

              {/* 底部标签区 */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-3">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500 hover:border-gray-400 transition-colors cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 删除按钮 */}
              <div className="mt-16 flex justify-center">
                <button
                  onClick={() => handleDeleteMemory(selectedMemory.id)}
                  className="group text-xs text-gray-300 hover:text-gray-500 tracking-widest uppercase transition-colors flex items-center gap-2"
                >
                  <span className="w-4 h-[1px] bg-gray-200 group-hover:bg-gray-400 transition-colors" />
                  DELETE
                  <span className="w-4 h-[1px] bg-gray-200 group-hover:bg-gray-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加记忆弹窗 */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: '#ffffff' }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-serif text-gray-900">添加记忆</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-6 space-y-6">
              {/* 选择角色 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择角色</label>
                <select
                  value={newMemory.characterId}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, characterId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">请选择角色</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
              </div>

              {/* 类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <div className="flex gap-3">
                  {(['summary', 'memory'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewMemory(prev => ({ ...prev, domain: cat === 'summary' ? 'chat' : 'action' }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (cat === 'summary' && newMemory.domain === 'chat') || (cat === 'memory' && newMemory.domain !== 'chat')
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {categoryMap[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 重要度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">重要程度</label>
                <div className="flex gap-3">
                  {(['high', 'normal', 'low'] as const).map(importance => (
                    <button
                      key={importance}
                      onClick={() => setNewMemory(prev => ({ ...prev, importance }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newMemory.importance === importance
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {importance === 'high' ? '核心' : importance === 'normal' ? '普通' : '一般'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="简短的标题（10字以内）"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* 摘要 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">记忆内容</label>
                <textarea
                  value={newMemory.summary}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="详细描述这段记忆..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              {/* 时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">发生时间</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={newMemory.date}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, date: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <input
                    type="time"
                    value={newMemory.startTime}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, startTime: e.target.value }))}
                    placeholder="开始"
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <span className="flex items-center text-gray-400">-</span>
                  <input
                    type="time"
                    value={newMemory.endTime}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, endTime: e.target.value }))}
                    placeholder="结束"
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <input
                  type="text"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="用逗号分隔，如：约定, 深度对话, 未来"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMemory}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  保存记忆
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedMemory
