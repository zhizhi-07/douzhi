/**
 * Lorebook / World Info 系统
 * 基于关键词触发的知识库管理
 */


export interface LorebookEntry {
  id: string
  name: string
  keys: string[]              // 触发关键词
  content: string             // 注入内容
  enabled: boolean            // 是否启用
  
  // 高级选项
  priority: number            // 优先级 0-999
  insertion_order: number     // 插入顺序
  case_sensitive: boolean     // 大小写敏感
  use_regex: boolean          // 使用正则表达式
  
  // Token 管理
  token_budget: number        // Token 预算
  
  // 触发条件
  constant: boolean           // 始终注入
  selective: boolean          // 仅在相关时注入
  
  // 位置控制
  position: 'before_char' | 'after_char' | 'top' | 'bottom'
  
  // 元数据
  comment: string             // 备注
  category: string            // 分类
  created_at: number
  updated_at: number
}

export interface Lorebook {
  id: string
  name: string
  description: string
  entries: LorebookEntry[]
  
  // 全局设置
  scan_depth: number          // 扫描深度（最近N条消息）
  token_budget: number        // 总 Token 预算
  recursive_scanning: boolean // 递归扫描
  
  // 元数据
  is_global: boolean          // 是否为全局世界书
  character_ids: string[]     // 关联的角色ID（空表示全局）
  created_at: number
  updated_at: number
}

export interface LorebookImportResult {
  lorebook: Lorebook
  disabledEntries: { name: string; reason: string }[]  // 被禁用的条目
}

// 存储键
const STORAGE_KEY_LOREBOOKS = 'lorebooks'
const STORAGE_KEY_GLOBAL_LOREBOOK = 'global_lorebook_id'

/**
 * Lorebook 管理器
 */
class LorebookManager {
  /**
   * 获取所有世界书
   * 自动清理已删除角色的关联
   */
  getAllLorebooks(): Lorebook[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOREBOOKS)
      if (data) {
        const lorebooks: Lorebook[] = JSON.parse(data)
        
        return lorebooks
      }
      return []
    } catch (error) {
      console.error('获取世界书失败:', error)
      return []
    }
  }

  /**
   * 获取单个世界书
   */
  getLorebook(id: string): Lorebook | null {
    const lorebooks = this.getAllLorebooks()
    return lorebooks.find(lb => lb.id === id) || null
  }

  /**
   * 创建世界书
   */
  createLorebook(data: Omit<Lorebook, 'id' | 'created_at' | 'updated_at'>): Lorebook {
    const lorebook: Lorebook = {
      ...data,
      id: `lorebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    const lorebooks = this.getAllLorebooks()
    lorebooks.push(lorebook)
    this.saveLorebooks(lorebooks)

    return lorebook
  }

  /**
   * 更新世界书
   */
  updateLorebook(id: string, updates: Partial<Lorebook>): boolean {
    try {
      const lorebooks = this.getAllLorebooks()
      const index = lorebooks.findIndex(lb => lb.id === id)
      
      if (index === -1) return false

      lorebooks[index] = {
        ...lorebooks[index],
        ...updates,
        updated_at: Date.now()
      }

      this.saveLorebooks(lorebooks)
      return true
    } catch (error) {
      console.error('更新世界书失败:', error)
      return false
    }
  }

  /**
   * 删除世界书
   */
  deleteLorebook(id: string): boolean {
    try {
      const lorebooks = this.getAllLorebooks()
      const filtered = lorebooks.filter(lb => lb.id !== id)
      
      if (filtered.length === lorebooks.length) return false

      this.saveLorebooks(filtered)
      return true
    } catch (error) {
      console.error('删除世界书失败:', error)
      return false
    }
  }

  /**
   * 添加条目
   */
  addEntry(lorebookId: string, entry: Omit<LorebookEntry, 'id' | 'created_at' | 'updated_at'>): LorebookEntry | null {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return null

    const newEntry: LorebookEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    lorebook.entries.push(newEntry)
    this.updateLorebook(lorebookId, { entries: lorebook.entries })

    return newEntry
  }

  /**
   * 更新条目
   */
  updateEntry(lorebookId: string, entryId: string, updates: Partial<LorebookEntry>): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    const entryIndex = lorebook.entries.findIndex((e: LorebookEntry) => e.id === entryId)
    if (entryIndex === -1) return false

    lorebook.entries[entryIndex] = {
      ...lorebook.entries[entryIndex],
      ...updates,
      updated_at: Date.now()
    }

    return this.updateLorebook(lorebookId, { entries: lorebook.entries })
  }

  /**
   * 删除条目
   */
  deleteEntry(lorebookId: string, entryId: string): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    const filtered = lorebook.entries.filter((e: LorebookEntry) => e.id !== entryId)
    if (filtered.length === lorebook.entries.length) return false

    return this.updateLorebook(lorebookId, { entries: filtered })
  }

  /**
   * 获取全局世界书
   */
  getGlobalLorebook(): Lorebook | null {
    const globalId = localStorage.getItem(STORAGE_KEY_GLOBAL_LOREBOOK)
    if (!globalId) return null
    return this.getLorebook(globalId)
  }

  /**
   * 设置全局世界书
   */
  setGlobalLorebook(lorebookId: string): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    localStorage.setItem(STORAGE_KEY_GLOBAL_LOREBOOK, lorebookId)
    return this.updateLorebook(lorebookId, { is_global: true })
  }

  /**
   * 获取角色关联的世界书
   */
  getCharacterLorebooks(characterId: string): Lorebook[] {
    const lorebooks = this.getAllLorebooks()
    const result = lorebooks.filter(lb => 
      (Array.isArray(lb.character_ids) && lb.character_ids.includes(characterId)) || lb.is_global === true
    )
    console.log(`📚 [世界书] 角色 ${characterId} 关联的世界书:`, result.map(lb => `${lb.name}(全局:${lb.is_global})`))
    return result
  }

  /**
   * 导出世界书（JSON）
   */
  exportLorebook(id: string): string | null {
    const lorebook = this.getLorebook(id)
    if (!lorebook) return null

    return JSON.stringify(lorebook, null, 2)
  }

  /**
   * 导入世界书（JSON）
   * 支持本系统格式和 SillyTavern 格式
   */
  importLorebook(jsonString: string): LorebookImportResult | null {
    try {
      const data = JSON.parse(jsonString)
      
      // 检测是否为 SillyTavern 格式
      if (this.isSillyTavernFormat(data)) {
        return this.importFromSillyTavern(data)
      }
      
      // 本系统格式
      if (!data.name || !Array.isArray(data.entries)) {
        throw new Error('无效的世界书格式')
      }

      // 创建新的世界书（本系统格式，无需检测状态栏）
      const lorebook = this.createLorebook({
        name: data.name,
        description: data.description || '',
        entries: data.entries || [],
        scan_depth: data.scan_depth || 10,
        token_budget: data.token_budget || 2000,
        recursive_scanning: data.recursive_scanning || false,
        is_global: false,
        character_ids: []
      })
      
      return {
        lorebook,
        disabledEntries: []  // 本系统格式不需要禁用条目
      }
    } catch (error) {
      console.error('导入世界书失败:', error)
      return null
    }
  }

  /**
   * 从 Character Card 导入世界书
   */
  importFromCharacterCard(characterBook: any, characterId: string, characterName: string): LorebookImportResult | null {
    try {
      console.log('📚 从角色卡导入世界书:', characterName)
      
      // 转换为标准格式
      const convertedData = {
        name: characterBook.name || `${characterName}的世界书`,
        description: characterBook.description || `从角色卡《${characterName}》导入`,
        entries: characterBook.entries || [],
        scan_depth: characterBook.scan_depth || characterBook.scanDepth || 10,
        token_budget: characterBook.token_budget || characterBook.tokenBudget || 2000,
        recursive_scanning: characterBook.recursive_scanning || characterBook.recursiveScanning || false
      }
      
      // 导入世界书
      const result = this.importFromSillyTavern(convertedData)
      
      if (result && result.lorebook) {
        // 关联到角色
        this.updateLorebook(result.lorebook.id, { 
          character_ids: [characterId] 
        })
        console.log('✅ 世界书导入成功，已关联到角色')
      }
      
      return result
    } catch (error) {
      console.error('从角色卡导入世界书失败:', error)
      return null
    }
  }

  /**
   * 检测是否为 SillyTavern 格式
   */
  private isSillyTavernFormat(data: any): boolean {
    if (!data.entries) return false
    
    // entries 是数组
    if (Array.isArray(data.entries)) {
      return (
        data.entries.length > 0 &&
        (data.entries[0].keys !== undefined || data.entries[0].key !== undefined) &&
        data.entries[0].content !== undefined
      )
    }
    
    // entries 是对象（数字键）
    if (typeof data.entries === 'object') {
      const firstKey = Object.keys(data.entries)[0]
      if (firstKey) {
        const firstEntry = data.entries[firstKey]
        return (
          (firstEntry.keys !== undefined || firstEntry.key !== undefined) &&
          firstEntry.content !== undefined
        )
      }
    }
    
    return false
  }

  /**
   * 从 SillyTavern 格式导入
   */
  private importFromSillyTavern(data: any): LorebookImportResult {
    console.log('检测到 SillyTavern 格式，开始转换...')
    
    // 将 entries 转换为数组（如果是对象格式）
    let entriesArray: any[] = []
    if (Array.isArray(data.entries)) {
      entriesArray = data.entries
    } else if (typeof data.entries === 'object') {
      // 对象格式，转换为数组
      entriesArray = Object.values(data.entries)
    }
    
    console.log(`找到 ${entriesArray.length} 个条目`)
    
    // 转换条目
    const baseTimestamp = Date.now()
    const entries: LorebookEntry[] = entriesArray.map((stEntry: any, index: number) => {
      // 合并主关键词和次要关键词
      const primaryKeys = Array.isArray(stEntry.keys) ? stEntry.keys : (Array.isArray(stEntry.key) ? stEntry.key : [])
      const secondaryKeys = Array.isArray(stEntry.keysecondary) ? stEntry.keysecondary : []
      const allKeys = [...primaryKeys, ...secondaryKeys].filter(k => k && k.trim())
      
      // 检查条目名称或内容是否包含"状态栏"
      const entryName = stEntry.comment || stEntry.name || ''
      const entryContent = stEntry.content || ''
      const hasStatusBar = entryName.includes('状态栏') || entryContent.includes('状态栏')
      
      return {
        id: `entry_${baseTimestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        name: stEntry.comment || stEntry.name || `条目 ${index + 1}`,
        keys: allKeys,
        content: stEntry.content || '',
        // 支持 enabled 或 disable 字段，如果包含"状态栏"则自动禁用
        enabled: hasStatusBar ? false : (stEntry.disable === true ? false : (stEntry.enabled !== false)),
        
        // 优先级和顺序
        priority: stEntry.priority !== undefined ? stEntry.priority : 500,
        insertion_order: stEntry.insertion_order !== undefined ? stEntry.insertion_order : (stEntry.order !== undefined ? stEntry.order : index),
        
        // 匹配选项
        case_sensitive: stEntry.case_sensitive === true || stEntry.caseSensitive === true,
        use_regex: false,
        
        // Token 管理
        token_budget: 200,
        
        // 触发条件
        constant: stEntry.constant === true,
        selective: stEntry.selective === true,
        
        // 位置 - SillyTavern 使用数字，需要转换
        position: this.convertSTPosition(stEntry.position),
        
        // 元数据
        comment: stEntry.comment || '',
        category: stEntry.secondary_keys?.[0] || '',
        created_at: Date.now(),
        updated_at: Date.now()
      }
    })

    // 统计被禁用的状态栏条目
    const disabledStatusBarEntries = entries.filter(e => {
      const hasStatusBar = e.name.includes('状态栏') || e.content.includes('状态栏')
      return hasStatusBar && !e.enabled
    })
    
    if (disabledStatusBarEntries.length > 0) {
      console.log(`⚠️ 检测到 ${disabledStatusBarEntries.length} 个包含"状态栏"的条目，已自动禁用:`)
      disabledStatusBarEntries.forEach(e => {
        console.log(`  - ${e.name}`)
      })
    }

    // 创建世界书
    const lorebook = this.createLorebook({
      name: data.name || '导入的世界书',
      description: data.description || '从 SillyTavern 导入',
      entries: entries,
      scan_depth: data.scan_depth || data.scanDepth || 10,
      token_budget: data.token_budget || data.tokenBudget || 2000,
      recursive_scanning: data.recursive_scanning === true || data.recursiveScanning === true,
      is_global: false,
      character_ids: []
    })

    // 返回导入结果
    return {
      lorebook,
      disabledEntries: disabledStatusBarEntries.map(e => ({
        name: e.name,
        reason: '包含"状态栏"关键词'
      }))
    }
  }

  /**
   * 转换 SillyTavern 的位置值
   * SillyTavern: 0=after_char, 1=before_char, 2=top, 3=bottom
   */
  private convertSTPosition(position: any): 'before_char' | 'after_char' | 'top' | 'bottom' {
    if (position === 0 || position === 'after_char') return 'after_char'
    if (position === 1 || position === 'before_char') return 'before_char'
    if (position === 2 || position === 'top') return 'top'
    if (position === 3 || position === 'bottom') return 'bottom'
    return 'before_char' // 默认
  }

  /**
   * 匹配触发的条目
   */
  private matchEntries(lorebook: Lorebook, recentMessages: string): LorebookEntry[] {
    const triggered: LorebookEntry[] = []

    for (const entry of lorebook.entries) {
      if (!entry.enabled) continue

      // 始终注入
      if (entry.constant) {
        triggered.push(entry)
        continue
      }

      // 关键词匹配
      for (const key of entry.keys) {
        let matched = false

        if (entry.use_regex) {
          try {
            const regex = new RegExp(key, entry.case_sensitive ? '' : 'i')
            matched = regex.test(recentMessages)
          } catch (error) {
            console.warn(`正则表达式错误: ${key}`, error)
          }
        } else {
          const searchText = entry.case_sensitive ? recentMessages : recentMessages.toLowerCase()
          const searchKey = entry.case_sensitive ? key : key.toLowerCase()
          matched = searchText.includes(searchKey)
        }

        if (matched) {
          triggered.push(entry)
          break
        }
      }
    }

    return triggered
  }

  /**
   * 替换变量（完整SillyTavern变量支持）
   * @param content 原始内容
   * @param characterName 角色名
   * @param userName 用户名
   * @param character 角色完整信息（可选）
   */
  private replaceVariables(
    content: string, 
    characterName: string, 
    userName: string = '你',
    character?: any
  ): string {
    // 获取当前时间和日期
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const datetimeStr = now.toLocaleString('zh-CN')
    
    // 星期
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[now.getDay()]
    
    // 时段
    const hour = now.getHours()
    let timePeriod = '凌晨'
    if (hour >= 6 && hour < 9) timePeriod = '早上'
    else if (hour >= 9 && hour < 12) timePeriod = '上午'
    else if (hour >= 12 && hour < 14) timePeriod = '中午'
    else if (hour >= 14 && hour < 18) timePeriod = '下午'
    else if (hour >= 18 && hour < 22) timePeriod = '晚上'
    else if (hour >= 22 || hour < 6) timePeriod = '深夜'
    
    let result = content
    
    // 基础变量
    result = result
      .replace(/\{\{char\}\}/gi, characterName)
      .replace(/\{\{user\}\}/gi, userName)
    
    // 时间相关变量
    result = result
      .replace(/\{\{time\}\}/gi, timeStr)
      .replace(/\{\{date\}\}/gi, dateStr)
      .replace(/\{\{datetime\}\}/gi, datetimeStr)
      .replace(/\{\{weekday\}\}/gi, weekday)
      .replace(/\{\{daytime\}\}/gi, timePeriod)
    
    // 如果有完整角色信息，替换更多变量
    if (character) {
      result = result
        .replace(/\{\{personality\}\}/gi, character.personality || '')
        .replace(/\{\{description\}\}/gi, character.personality || '')
        .replace(/\{\{scenario\}\}/gi, character.scenario || '')
        .replace(/\{\{char_version\}\}/gi, character.version || '')
        .replace(/\{\{system\}\}/gi, character.system || '')
        .replace(/\{\{post_history_instructions\}\}/gi, character.post_history_instructions || '')
        .replace(/\{\{char_greeting\}\}/gi, character.first_mes || character.greeting || '')
        .replace(/\{\{original\}\}/gi, content) // 原始内容
    }
    
    // 移除未替换的变量（避免显示{{xxx}}）
    // 注意：这是可选的，有些用户可能想保留未知变量
    // result = result.replace(/\{\{[^}]+\}\}/g, '')
    
    return result
  }

  /**
   * 构建世界书上下文
   * @param characterId 角色ID
   * @param recentMessages 最近的消息文本（用于匹配关键词）
   * @param maxTokens Token预算限制
   * @param characterName 角色名（用于变量替换）
   * @param userName 用户名（用于变量替换）
   * @param character 角色完整信息（用于更多变量替换）
   * @returns 构建好的上下文文本
   */
  buildContext(
    characterId: string, 
    recentMessages: string, 
    maxTokens: number = 2000,
    characterName: string = '',
    userName: string = '你',
    character?: any,
    lorebookId?: string  // 🔥 可选：直接指定世界书ID（用于群聊）
  ): string {
    // 🔥 如果指定了 lorebookId，只使用该世界书
    let lorebooks: Lorebook[]
    if (lorebookId) {
      const lorebook = this.getLorebook(lorebookId)
      lorebooks = lorebook ? [lorebook] : []
    } else {
      lorebooks = this.getCharacterLorebooks(characterId)
    }
    
    if (lorebooks.length === 0) return ''

    const allTriggered: LorebookEntry[] = []

    // 收集所有触发的条目
    for (const lorebook of lorebooks) {
      const triggered = this.matchEntries(lorebook, recentMessages)
      allTriggered.push(...triggered)
    }

    if (allTriggered.length === 0) return ''

    // 按优先级和插入顺序排序
    allTriggered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // 高优先级在前
      }
      return a.insertion_order - b.insertion_order
    })

    // Token 预算管理（简单估算：中文约1.5字符=1token）
    const selected: LorebookEntry[] = []
    let currentTokens = 0

    for (const entry of allTriggered) {
      const estimatedTokens = Math.ceil(entry.content.length / 1.5)
      
      if (currentTokens + estimatedTokens <= maxTokens) {
        selected.push(entry)
        currentTokens += estimatedTokens
      }
    }

    if (selected.length === 0) return ''

    // 按位置分组
    const byPosition: Record<string, LorebookEntry[]> = {
      top: [],
      before_char: [],
      after_char: [],
      bottom: []
    }

    for (const entry of selected) {
      byPosition[entry.position].push(entry)
    }

    // 构建文本（应用变量替换）
    const parts: string[] = []

    if (byPosition.top.length > 0) {
      parts.push(byPosition.top.map(e => this.replaceVariables(e.content, characterName, userName, character)).join('\n\n'))
    }
    if (byPosition.before_char.length > 0) {
      parts.push(byPosition.before_char.map(e => this.replaceVariables(e.content, characterName, userName, character)).join('\n\n'))
    }
    if (byPosition.after_char.length > 0) {
      parts.push(byPosition.after_char.map(e => this.replaceVariables(e.content, characterName, userName, character)).join('\n\n'))
    }
    if (byPosition.bottom.length > 0) {
      parts.push(byPosition.bottom.map(e => this.replaceVariables(e.content, characterName, userName, character)).join('\n\n'))
    }

    const context = parts.filter(Boolean).join('\n\n')
    
    if (context) {
      console.log(`📚 世界书触发: ${selected.length} 条目, 约 ${currentTokens} tokens`)
    }

    return context
  }

  /**
   * 保存世界书列表
   */
  private saveLorebooks(lorebooks: Lorebook[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOREBOOKS, JSON.stringify(lorebooks))
    } catch (error) {
      console.error('保存世界书失败:', error)
      throw error
    }
  }
}

// 导出单例
export const lorebookManager = new LorebookManager()
