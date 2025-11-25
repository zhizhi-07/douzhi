/**
 * 统一记忆服务 - 独立的记忆管理系统
 * 使用 IndexedDB 存储
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// 记忆领域
export type MemoryDomain = 'chat' | 'moments' | 'action' | 'all'

// 记忆接口
export interface UnifiedMemory {
  id: string
  domain: MemoryDomain
  characterId: string
  characterName: string
  characterAvatar?: string
  title: string
  summary: string
  importance: 'high' | 'normal' | 'low'
  timestamp: number
  tags: string[]
  emotionalTone?: 'positive' | 'neutral' | 'negative'
  
  // 扩展字段
  relatedMessageIds?: string[]  // 关联的消息ID
  extractedBy?: 'manual' | 'auto'  // 提取方式
  timeRange?: {  // 记忆时间范围
    start: number  // 起始时间戳
    end: number    // 结束时间戳
  }
}

// 数据库结构
interface UnifiedMemoryDB extends DBSchema {
  memories: {
    key: string
    value: UnifiedMemory
    indexes: {
      'by-character': string
      'by-domain': MemoryDomain
      'by-timestamp': number
      'by-importance': string
    }
  }
}

class UnifiedMemoryService {
  private dbName = 'UnifiedMemoryDB'
  private version = 1
  private db: IDBPDatabase<UnifiedMemoryDB> | null = null

  /**
   * 初始化数据库
   */
  async init() {
    if (this.db) return this.db

    this.db = await openDB<UnifiedMemoryDB>(this.dbName, this.version, {
      upgrade(db) {
        // 创建记忆表
        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' })
          
          // 创建索引
          memoryStore.createIndex('by-character', 'characterId')
          memoryStore.createIndex('by-domain', 'domain')
          memoryStore.createIndex('by-timestamp', 'timestamp')
          memoryStore.createIndex('by-importance', 'importance')
        }
      }
    })

    return this.db
  }

  /**
   * 添加记忆
   */
  async addMemory(memory: Omit<UnifiedMemory, 'id'>): Promise<string> {
    const db = await this.init()
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullMemory: UnifiedMemory = {
      id,
      ...memory
    }

    await db.add('memories', fullMemory)
    console.log('✅ [记忆系统] 已添加记忆:', fullMemory.title)
    
    return id
  }

  /**
   * 获取所有记忆
   */
  async getAllMemories(): Promise<UnifiedMemory[]> {
    const db = await this.init()
    const memories = await db.getAll('memories')
    
    // 按时间倒序
    return memories.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 根据角色ID获取记忆
   */
  async getMemoriesByCharacter(characterId: string): Promise<UnifiedMemory[]> {
    const db = await this.init()
    const memories = await db.getAllFromIndex('memories', 'by-character', characterId)
    
    return memories.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 根据领域获取记忆
   */
  async getMemoriesByDomain(domain: MemoryDomain): Promise<UnifiedMemory[]> {
    if (domain === 'all') {
      return this.getAllMemories()
    }
    
    const db = await this.init()
    const memories = await db.getAllFromIndex('memories', 'by-domain', domain)
    
    return memories.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 根据角色和领域筛选
   */
  async getMemories(filters: {
    characterId?: string
    domain?: MemoryDomain
  }): Promise<UnifiedMemory[]> {
    let memories = await this.getAllMemories()

    if (filters.characterId) {
      memories = memories.filter(m => m.characterId === filters.characterId)
    }

    if (filters.domain && filters.domain !== 'all') {
      memories = memories.filter(m => m.domain === filters.domain)
    }

    return memories
  }

  /**
   * 更新记忆
   */
  async updateMemory(id: string, updates: Partial<UnifiedMemory>): Promise<void> {
    const db = await this.init()
    const memory = await db.get('memories', id)
    
    if (!memory) {
      throw new Error(`记忆不存在: ${id}`)
    }

    const updated = { ...memory, ...updates }
    await db.put('memories', updated)
    
    console.log('✅ [记忆系统] 已更新记忆:', updated.title)
  }

  /**
   * 删除记忆
   */
  async deleteMemory(id: string): Promise<void> {
    const db = await this.init()
    await db.delete('memories', id)
    
    console.log('✅ [记忆系统] 已删除记忆:', id)
  }

  /**
   * 搜索记忆（标题或摘要）
   */
  async searchMemories(query: string): Promise<UnifiedMemory[]> {
    const memories = await this.getAllMemories()
    const lowerQuery = query.toLowerCase()

    return memories.filter(m =>
      m.title.toLowerCase().includes(lowerQuery) ||
      m.summary.toLowerCase().includes(lowerQuery) ||
      m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    const memories = await this.getAllMemories()
    
    return {
      total: memories.length,
      chat: memories.filter(m => m.domain === 'chat').length,
      moments: memories.filter(m => m.domain === 'moments').length,
      action: memories.filter(m => m.domain === 'action').length,
      high: memories.filter(m => m.importance === 'high').length,
    }
  }

  /**
   * 清空所有记忆（谨慎使用）
   */
  async clearAll(): Promise<void> {
    const db = await this.init()
    await db.clear('memories')
    
    console.log('⚠️ [记忆系统] 已清空所有记忆')
  }
}

// 导出单例
export const unifiedMemoryService = new UnifiedMemoryService()
