/**
 * 全局记忆管理器
 * 统一管理所有模块的记忆存储和读取
 */

import { Message } from '../types/chat'

// 记忆类型枚举
export enum MemoryType {
  PRIVATE_CHAT = 'private_chat',    // 私聊
  GROUP_CHAT = 'group_chat',        // 群聊
  OFFLINE = 'offline',              // 线下模式
  MOMENTS = 'moments',              // 朋友圈
  FORUM = 'forum',                  // 论坛
  GLOBAL = 'global'                 // 全局通用
}

// 记忆条目接口
export interface GlobalMemory {
  id: string
  type: MemoryType
  characterId?: string              // 角色ID（私聊、线下）
  groupId?: string                  // 群组ID（群聊）
  title: string
  summary: string
  content: any                      // 原始内容（可以是消息、帖子等）
  messages?: Message[]              // 如果是对话类型
  tags: string[]
  createdAt: number
  updatedAt: number
  importance: 'low' | 'normal' | 'high'
  metadata?: {                      // 额外元数据
    location?: string
    mood?: string
    context?: string
    [key: string]: any
  }
}

// 记忆查询条件
export interface MemoryQuery {
  type?: MemoryType
  characterId?: string
  groupId?: string
  tags?: string[]
  importance?: string
  searchText?: string
  limit?: number
  offset?: number
}

class GlobalMemoryManager {
  private readonly STORAGE_KEY = 'global_memories'
  private memories: GlobalMemory[] = []

  constructor() {
    this.loadMemories()
  }

  // 加载所有记忆
  private loadMemories() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.memories = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load global memories:', error)
      this.memories = []
    }
  }

  // 保存记忆到存储
  private saveMemories() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memories))
    } catch (error) {
      console.error('Failed to save global memories:', error)
    }
  }

  // 创建新记忆
  createMemory(memory: Omit<GlobalMemory, 'id' | 'createdAt' | 'updatedAt'>): GlobalMemory {
    const newMemory: GlobalMemory = {
      ...memory,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.memories.push(newMemory)
    this.saveMemories()
    return newMemory
  }

  // 更新记忆
  updateMemory(id: string, updates: Partial<GlobalMemory>): GlobalMemory | null {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return null

    this.memories[index] = {
      ...this.memories[index],
      ...updates,
      id: this.memories[index].id,
      createdAt: this.memories[index].createdAt,
      updatedAt: Date.now()
    }

    this.saveMemories()
    return this.memories[index]
  }

  // 删除记忆
  deleteMemory(id: string): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories.splice(index, 1)
    this.saveMemories()
    return true
  }

  // 查询记忆
  queryMemories(query: MemoryQuery = {}): GlobalMemory[] {
    let results = [...this.memories]

    // 按类型筛选
    if (query.type) {
      results = results.filter(m => m.type === query.type)
    }

    // 按角色筛选
    if (query.characterId) {
      results = results.filter(m => m.characterId === query.characterId)
    }

    // 按群组筛选
    if (query.groupId) {
      results = results.filter(m => m.groupId === query.groupId)
    }

    // 按标签筛选
    if (query.tags && query.tags.length > 0) {
      results = results.filter(m => 
        query.tags!.some(tag => m.tags.includes(tag))
      )
    }

    // 按重要度筛选
    if (query.importance) {
      results = results.filter(m => m.importance === query.importance)
    }

    // 文本搜索
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase()
      results = results.filter(m => 
        m.title.toLowerCase().includes(searchLower) ||
        m.summary.toLowerCase().includes(searchLower) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // 排序（最新的在前）
    results.sort((a, b) => b.updatedAt - a.updatedAt)

    // 分页
    const offset = query.offset || 0
    const limit = query.limit || results.length
    
    return results.slice(offset, offset + limit)
  }

  // 获取单个记忆
  getMemory(id: string): GlobalMemory | null {
    return this.memories.find(m => m.id === id) || null
  }

  // 获取所有标签
  getAllTags(): string[] {
    const tags = new Set<string>()
    this.memories.forEach(m => {
      m.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }

  // 获取记忆统计
  getStatistics() {
    const stats = {
      total: this.memories.length,
      byType: {} as Record<string, number>,
      byImportance: {
        high: 0,
        normal: 0,
        low: 0
      },
      recentUpdates: [] as GlobalMemory[]
    }

    this.memories.forEach(m => {
      // 按类型统计
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1
      
      // 按重要度统计
      stats.byImportance[m.importance]++
    })

    // 最近更新的5条
    stats.recentUpdates = this.memories
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)

    return stats
  }

  // 为特定角色创建记忆上下文
  getCharacterContext(characterId: string, limit: number = 10): string {
    const memories = this.queryMemories({
      characterId,
      limit
    })

    if (memories.length === 0) {
      return '暂无相关记忆。'
    }

    const context = memories.map(m => {
      const date = new Date(m.createdAt).toLocaleDateString('zh-CN')
      return `[${date}] ${m.title}: ${m.summary}`
    }).join('\n')

    return `相关记忆：\n${context}`
  }

  // 合并重复记忆
  mergeMemories(ids: string[], newTitle?: string): GlobalMemory | null {
    const memoriesToMerge = ids.map(id => this.getMemory(id)).filter(Boolean) as GlobalMemory[]
    if (memoriesToMerge.length < 2) return null

    // 合并内容
    const mergedContent: any[] = []
    const mergedMessages: Message[] = []
    const mergedTags = new Set<string>()
    
    memoriesToMerge.forEach(m => {
      if (m.content) mergedContent.push(m.content)
      if (m.messages) mergedMessages.push(...m.messages)
      m.tags.forEach(tag => mergedTags.add(tag))
    })

    // 创建合并后的记忆
    const mergedMemory = this.createMemory({
      type: memoriesToMerge[0].type,
      characterId: memoriesToMerge[0].characterId,
      groupId: memoriesToMerge[0].groupId,
      title: newTitle || `合并的记忆 (${memoriesToMerge.length}条)`,
      summary: `合并了${memoriesToMerge.length}条相关记忆`,
      content: mergedContent.length > 0 ? mergedContent : undefined,
      messages: mergedMessages.length > 0 ? mergedMessages : undefined,
      tags: Array.from(mergedTags),
      importance: 'normal',
      metadata: {
        mergedFrom: ids,
        mergedAt: Date.now()
      }
    })

    // 删除原始记忆
    ids.forEach(id => this.deleteMemory(id))

    return mergedMemory
  }

  // 导出记忆
  exportMemories(query?: MemoryQuery): string {
    const memories = query ? this.queryMemories(query) : this.memories
    return JSON.stringify(memories, null, 2)
  }

  // 导入记忆
  importMemories(json: string, replace: boolean = false): number {
    try {
      const imported = JSON.parse(json) as GlobalMemory[]
      
      if (replace) {
        this.memories = imported
      } else {
        // 避免ID冲突，重新生成ID
        imported.forEach(memory => {
          const newId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          memory.id = newId
          this.memories.push(memory)
        })
      }
      
      this.saveMemories()
      return imported.length
    } catch (error) {
      console.error('Failed to import memories:', error)
      return 0
    }
  }

  // 清理过期记忆（可选功能）
  cleanupOldMemories(daysToKeep: number = 30): number {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    const beforeCount = this.memories.length
    
    this.memories = this.memories.filter(m => 
      m.updatedAt > cutoffTime || m.importance === 'high'
    )
    
    this.saveMemories()
    return beforeCount - this.memories.length
  }
}

// 导出单例
export const globalMemoryManager = new GlobalMemoryManager()

// 导出便捷方法
export const createGlobalMemory = globalMemoryManager.createMemory.bind(globalMemoryManager)
export const queryGlobalMemories = globalMemoryManager.queryMemories.bind(globalMemoryManager)
export const getCharacterMemoryContext = globalMemoryManager.getCharacterContext.bind(globalMemoryManager)
