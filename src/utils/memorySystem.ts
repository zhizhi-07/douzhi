// AI 记忆系统 - 让 AI 真正记住你

export interface Memory {
  id: string
  type: 'fact' | 'event' | 'preference' | 'emotion' | 'relationship'
  content: string
  importance: number  // 1-10，重要程度
  timestamp: number
  relatedMemories?: string[]  // 关联记忆 ID
  tags: string[]
  decayRate: number  // 遗忘速率
  lastAccessed: number  // 最后访问时间
  accessCount: number  // 访问次数
}

export interface MemoryQuery {
  keyword?: string
  type?: Memory['type']
  minImportance?: number
  limit?: number
}

export class MemorySystem {
  private memories: Map<string, Memory> = new Map()
  private characterId: string
  private initialMemoriesExtracted: boolean = false

  constructor(characterId: string) {
    this.characterId = characterId
    this.loadMemories()
    this.loadInitialMemoriesFlag()
  }

  // 添加记忆
  addMemory(
    type: Memory['type'],
    content: string,
    importance: number = 5,
    tags: string[] = []
  ): Memory {
    const memory: Memory = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      importance: Math.max(1, Math.min(10, importance)),
      timestamp: Date.now(),
      tags,
      decayRate: this.calculateDecayRate(type, importance),
      lastAccessed: Date.now(),
      accessCount: 0
    }

    this.memories.set(memory.id, memory)
    this.saveMemories()
    
    console.log(`[记忆系统] 新记忆: [${type}] ${content} (重要度: ${importance})`)
    
    return memory
  }

  // 计算遗忘速率
  private calculateDecayRate(type: Memory['type'], importance: number): number {
    // 重要程度越高，遗忘越慢
    const baseRate = {
      fact: 0.1,        // 事实记忆遗忘慢
      event: 0.2,       // 事件记忆中等
      preference: 0.05, // 偏好记忆很慢
      emotion: 0.3,     // 情绪记忆快
      relationship: 0.02 // 关系记忆最慢
    }

    return baseRate[type] * (11 - importance) / 10
  }

  // 从对话中提取记忆（使用 AI 分析）
  // 注意：使用副API和客观总结风格，不使用角色口语
  async extractMemoriesFromConversation(
    userMessage: string,
    aiResponse: string,
    characterName: string = 'AI',
    _characterPersonality: string = '',  // 保留参数兼容性
    userName: string = '用户'
  ): Promise<{ memories: Memory[], summary: string }> {
    const newMemories: Memory[] = []
    let summary = ''

    try {
      // 使用当前项目的 API
      const { callAIApi } = await import('./chatApi')
      const { summaryApiService } = await import('../services/summaryApiService')
      
      // 使用独立的副API配置
      const summaryApiConfig = summaryApiService.get()
      
      // 🔥 检查副API是否已配置
      if (!summaryApiConfig.baseUrl || !summaryApiConfig.apiKey || !summaryApiConfig.model) {
        throw new Error('请先在系统设置中配置副API（智能总结API）')
      }
      
      const summarySettings = {
        baseUrl: summaryApiConfig.baseUrl,
        apiKey: summaryApiConfig.apiKey,
        model: summaryApiConfig.model,
        provider: summaryApiConfig.provider,
        temperature: 0.3,  // 记忆提取用较低温度
        maxTokens: 2000
      }
      
      console.log(`[记忆系统] 使用副API: ${summarySettings.model}`)
      
      // 客观总结风格的提示词
      const prompt = `你是一个记忆提取助手。请分析以下对话，提取对话中**双方**的具体、有用信息。

# 输入
【对话内容】
${userName}: ${userMessage}
${characterName}: ${aiResponse}

# 核心原则：记录对话中双方的具体信息，使用真实姓名

## ⚠️ 核心规则

1. **记录双方信息**：对话中涉及${userName}和${characterName}双方的信息都要记录
2. **使用真实姓名**：不要用"用户"、"AI"这样的称呼，直接用${userName}和${characterName}
3. **准确识别主语**：谁做的事就写谁的名字，不要搞混
4. **不要编造**：只记录对话中明确提到的信息，不要凭空编造

## 示例

**对话：**
【${userName}】："我有一个布娃娃，绿色眼睛的"
【${characterName}】："知道啊，我初二运动会套圈给你套来的"

**正确记录：**
✅ "${characterName}初二运动会套圈送了一个绿眼睛布娃娃给${userName}"

**错误记录：**
❌ "用户有一个布娃娃"（没用真实姓名）
❌ "${userName}套圈得到布娃娃"（主语错了，套圈的是${characterName}）
❌ "${userName}有一个布娃娃"（信息不完整，丢失了来源）

## 什么是有用的记忆？（像真人认识朋友那样观察）

**客观信息：**
- 基本情况（职业、住址、作息等）
- 生活习惯（喜欢做什么、怎么做事）
- 兴趣爱好（喜欢什么、不喜欢什么）
- 身体和健康状态（例如：来姨妈、生理期、肚子痛、生病、住院等）——这类信息通常很重要
- 重要经历（谁做过什么事、发生过什么）

**主观印象：**
- 性格特点（温柔/直爽/傲娇/害羞/大大咧咧...）——**优先记录${userName}的性格，不要单独记录${characterName}自己的性格**
- 外貌印象（漂亮/可爱/帅气，以及具体特征）
- 说话风格（喜欢用什么词、什么语气）——例如「${userName}说话喜欢加很多表情」
- 行为模式（遇事怎么反应、有什么小习惯）
- 情绪特征（容易生气/容易害羞/很乐观...）
- 相处感觉（和这个人相处起来什么感觉）

**关系互动：**
- 两人的关系状态和发展
- 对方对你的态度和要求
- 相处中的特殊时刻

## 什么是无用的记忆？（不要记录）
- 泛泛的情绪描述（"很开心"、"不满"）
- 临时的、一次性的情绪
- 模糊的、不具体的信息
- 日常寒暄、客套话
- 单纯的对话行为描述（"询问了..."、"表示..."）
- **编造的信息**（对话中没提到的不要写！）

## 更多示例

**差的记忆（不要这样）：**
- "用户对AI表现出不满的情绪"（用了"用户""AI"，太泛泛）
- "很开心"（没有主语，没有具体信息）
- "询问了功能"（只是行为，没有信息）

**好的记忆（要这样）：**
- "${userName}每天晚上8点有空闲时间"（生活作息）
- "${userName}很漂亮，笑起来特别好看"（外貌印象）
- "${userName}有点傲娇，嘴硬心软"（性格特点）
- "${userName}说话喜欢用'哼'来表达不满"（说话习惯）
- "${userName}遇到困难会先自己扛着，不轻易求助"（行为模式）
- "${userName}容易害羞，被夸会脸红"（情绪特征）
- "${userName}希望${characterName}回复简洁一些"（相处要求）

# 记忆类型

* **fact**: 基本信息、生活习惯、时间安排、外貌特征、性格印象
   * 例如: "${userName}每天7点下班", "${userName}住在杭州", "${userName}很漂亮", "${userName}有点傲娇"
   
* **preference**: 明确的喜好、厌恶
   * 例如: "${userName}不喜欢吃辣", "${characterName}喜欢看科幻片"
   
* **event**: 重要经历、计划、互动事件
   * 例如: "${userName}下周三要面试", "${characterName}初中送了一个娃娃给${userName}", "${userName}和${characterName}约定周末去看电影"
   
* **relationship**: 双方关系、要求或期望、相处模式
   * 例如: "${userName}希望${characterName}回复简洁一些", "${characterName}很在意${userName}的感受", "${characterName}觉得${userName}很可爱"

# 重要度评估 (1-10)

* **7-10**: 长期有效的重要信息（职业、住址、作息、核心喜好、重要计划）
* **4-6**: 一般信息（普通喜好、日常活动、对AI的要求）
* **1-3**: 次要信息（临时计划、不太重要的细节）

# 输出格式 (必须严格遵守 JSON)

{
  "memories": [
    {
      "type": "fact | preference | event | relationship",
      "content": "具体、可操作的描述",
      "importance": 1-10,
      "tags": ["相关标签"]
    }
  ],
  "summary": "简短总结本次对话的重要发现（没有新信息就留空）"
}

## 示例

**示例1：有用的信息**
${userName}："我每天晚上8点有空，可以陪你聊聊天"
{
  "memories": [
    {
      "type": "fact",
      "content": "${userName}每天晚上8点有空闲时间",
      "importance": 7,
      "tags": ["时间", "作息"]
    }
  ],
  "summary": "${userName}每天晚上8点有空"
}

**示例2：没有有用信息**
${userName}："嗯嗯，好的"
{
  "memories": [],
  "summary": ""
}

**示例3：提取具体需求**
${userName}："你能不能别这么啰嗦，简单点说就行了"
{
  "memories": [
    {
      "type": "relationship",
      "content": "${userName}希望${characterName}回复简洁一些",
      "importance": 6,
      "tags": ["交互", "偏好"]
    }
  ],
  "summary": "${userName}希望${characterName}回复更简洁"
}

**示例4：正确记录双方信息**
${userName}："我有一个布娃娃，绿色眼睛的"
${characterName}："知道啊，我初二运动会套圈给你套来的"
{
  "memories": [
    {
      "type": "event",
      "content": "${characterName}初二运动会套圈送了一个绿眼睛布娃娃给${userName}",
      "importance": 7,
      "tags": ["礼物", "回忆"]
    }
  ],
  "summary": "${characterName}初二时送了布娃娃给${userName}"
}

**示例5：记录主观印象**
${userName}："[照片:自拍]"（发了一张自拍）
${characterName}："哇，你今天好漂亮啊！笑起来真好看"
{
  "memories": [
    {
      "type": "fact",
      "content": "${userName}很漂亮，笑起来特别好看",
      "importance": 5,
      "tags": ["外貌", "印象"]
    }
  ],
  "summary": "${characterName}觉得${userName}很漂亮"
}

**示例6：记录性格特点**
${userName}："哼，才不是因为关心你呢，只是顺路买的"
${characterName}："行行行，不是因为关心我"
{
  "memories": [
    {
      "type": "fact",
      "content": "${userName}有点傲娇，嘴硬心软",
      "importance": 6,
      "tags": ["性格", "特点"]
    }
  ],
  "summary": "${userName}展现出傲娇性格"
}

**示例7：记录说话习惯**
${userName}："哼！不理你了！"（第三次在对话中说"哼"）
${characterName}："又哼上了"
{
  "memories": [
    {
      "type": "fact",
      "content": "${userName}说话喜欢用'哼'来表达不满或傲娇",
      "importance": 4,
      "tags": ["说话习惯", "语气"]
    }
  ],
  "summary": "${userName}常用'哼'表达情绪"
}

**示例8：记录行为模式**
${userName}："没事，我自己能搞定"
${characterName}："需要帮忙就说"
{
  "memories": [
    {
      "type": "fact",
      "content": "${userName}遇到困难习惯自己扛着，不轻易求助",
      "importance": 6,
      "tags": ["行为模式", "性格"]
    }
  ],
  "summary": "${userName}不喜欢麻烦别人"
}

# 特殊情况
* 如果没有新信息，返回: {"memories": [], "summary": ""}

# 现在请分析对话并输出JSON：
`

      // 调用 AI API（使用副API）
      const response = await callAIApi([
        { role: 'user', content: prompt }
      ], summarySettings)

      // 解析 AI 返回的 JSON
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1])
        
        // 提取记忆（只保存比较重要的条目，避免记一堆琐碎小事）
        if (result.memories && Array.isArray(result.memories)) {
          result.memories.forEach((mem: any) => {
            if (mem.type && mem.content && mem.importance) {
              const content: string = String(mem.content)

              // ❌ 不记录只描述 AI 自己性格/特点的记忆（例如“汁汁说话风格直爽”）
              // 规则：内容里只提到 characterName 而不提 userName，且类型为 fact，则跳过
              const aiName = characterName || 'AI'
              const hasAIName = content.includes(aiName)
              const hasUserName = content.includes(userName)
              const isAIOnlyFact = mem.type === 'fact' && hasAIName && !hasUserName

              if (isAIOnlyFact) {
                console.log('[记忆系统] 跳过关于 AI 自身性格的记忆:', content)
                return
              }

              // importance < 5 视为噪音，不写入记忆库
              if (mem.importance >= 5) {
                newMemories.push(
                  this.addMemory(
                    mem.type,
                    content,
                    mem.importance,
                    mem.tags || []
                  )
                )
              }
            }
          })
        }
        
        // 提取总结
        if (result.summary) {
          summary = result.summary
        }
      }

      console.log(`[记忆系统] AI 提取了 ${newMemories.length} 条记忆`)
      console.log(`[记忆系统] 生成了记忆总结`)
      
    } catch (error) {
      console.error('[记忆系统] AI 记忆提取失败:', error)
      // 失败时返回空数据，不影响正常对话
    }

    return { memories: newMemories, summary }
  }

  // 搜索记忆
  searchMemories(query: MemoryQuery): Memory[] {
    let results = Array.from(this.memories.values())

    // 应用遗忘机制
    results = results.map(memory => this.applyDecay(memory))

    // 过滤
    if (query.type) {
      results = results.filter(m => m.type === query.type)
    }

    if (query.minImportance !== undefined) {
      const minImp = query.minImportance
      results = results.filter(m => m.importance >= minImp)
    }

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      results = results.filter(m => 
        m.content.toLowerCase().includes(keyword) ||
        m.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    // 按重要度和新鲜度排序
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a)
      const scoreB = this.calculateRelevanceScore(b)
      return scoreB - scoreA
    })

    // 限制数量
    if (query.limit) {
      results = results.slice(0, query.limit)
    }

    // 更新访问记录
    results.forEach(memory => {
      memory.lastAccessed = Date.now()
      memory.accessCount++
    })

    this.saveMemories()

    return results
  }

  // 应用遗忘机制
  private applyDecay(memory: Memory): Memory {
    const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-memory.decayRate * daysSince)
    
    // 访问次数可以减缓遗忘
    const accessBonus = Math.min(memory.accessCount * 0.1, 2)
    
    const adjustedImportance = memory.importance * decayFactor + accessBonus
    
    return {
      ...memory,
      importance: Math.max(1, Math.min(10, adjustedImportance))
    }
  }

  // 计算相关性分数
  private calculateRelevanceScore(memory: Memory): number {
    const importanceScore = memory.importance * 10
    const recencyScore = Math.max(0, 100 - (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24))
    const accessScore = Math.min(memory.accessCount * 5, 50)
    
    return importanceScore + recencyScore + accessScore
  }

  // 获取相关记忆（用于生成回复）
  getRelevantMemories(context: string, limit: number = 5): Memory[] {
    // 提取关键词
    const keywords = this.extractKeywords(context)
    
    let relevantMemories: Memory[] = []
    
    // 搜索每个关键词
    keywords.forEach(keyword => {
      const memories = this.searchMemories({ keyword, limit: 3 })
      relevantMemories.push(...memories)
    })

    // 去重
    const uniqueMemories = Array.from(
      new Map(relevantMemories.map(m => [m.id, m])).values()
    )

    // 按相关性排序
    uniqueMemories.sort((a, b) => 
      this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a)
    )

    return uniqueMemories.slice(0, limit)
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const words = text.split(/[\s，。！？、]+/)
    return words.filter(word => word.length >= 2)
  }

  // 生成记忆摘要（用于 AI 提示词）
  generateMemorySummary(): string {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))
      .filter(m => m.importance >= 3)
      .sort((a, b) => this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a))
      .slice(0, 20)

    if (memories.length === 0) {
      return '暂无重要记忆。'
    }

    const grouped = {
      fact: memories.filter(m => m.type === 'fact'),
      preference: memories.filter(m => m.type === 'preference'),
      event: memories.filter(m => m.type === 'event'),
      emotion: memories.filter(m => m.type === 'emotion'),
      relationship: memories.filter(m => m.type === 'relationship')
    }

    let summary = '【关于用户的记忆】\n\n'

    if (grouped.fact.length > 0) {
      summary += '基本信息：\n'
      grouped.fact.forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.preference.length > 0) {
      summary += '偏好喜好：\n'
      grouped.preference.forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.event.length > 0) {
      summary += '最近事件：\n'
      grouped.event.slice(0, 5).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.emotion.length > 0) {
      summary += '情绪状态：\n'
      grouped.emotion.slice(0, 3).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.relationship.length > 0) {
      summary += '关系互动：\n'
      grouped.relationship.slice(0, 3).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    summary += '⚠️ 请在对话中自然地运用这些记忆，让用户感受到你真的记得他们！'

    return summary
  }

  // 清理低重要度记忆
  cleanupMemories() {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))

    // 删除重要度低于 1 的记忆
    memories.forEach(memory => {
      if (memory.importance < 1) {
        this.memories.delete(memory.id)
        console.log(`[记忆系统] 遗忘记忆: ${memory.content}`)
      }
    })

    this.saveMemories()
  }

  // 保存记忆到 localStorage
  private saveMemories() {
    try {
      const data = Array.from(this.memories.entries())
      localStorage.setItem(`memories_${this.characterId}`, JSON.stringify(data))
    } catch (error) {
      console.error('保存记忆失败:', error)
    }
  }

  // 从 localStorage 加载记忆
  private loadMemories() {
    try {
      const saved = localStorage.getItem(`memories_${this.characterId}`)
      if (saved) {
        const data = JSON.parse(saved)
        this.memories = new Map(data)
        console.log(`[记忆系统] 加载了 ${this.memories.size} 条记忆`)
      }
    } catch (error) {
      console.error('加载记忆失败:', error)
    }
  }

  // 加载初始记忆提取标记
  private loadInitialMemoriesFlag() {
    try {
      const flag = localStorage.getItem(`initial_memories_extracted_${this.characterId}`)
      this.initialMemoriesExtracted = flag === 'true'
    } catch (error) {
      console.error('加载初始记忆标记失败:', error)
    }
  }

  // 保存初始记忆提取标记
  private saveInitialMemoriesFlag() {
    try {
      localStorage.setItem(`initial_memories_extracted_${this.characterId}`, 'true')
      this.initialMemoriesExtracted = true
    } catch (error) {
      console.error('保存初始记忆标记失败:', error)
    }
  }

  // 从角色描述中提取初始记忆
  async extractInitialMemories(characterDescription: string): Promise<void> {
    if (this.initialMemoriesExtracted) {
      return
    }

    if (!characterDescription || characterDescription.trim().length === 0) {
      console.log('[记忆系统] 角色描述为空，跳过初始记忆提取')
      this.saveInitialMemoriesFlag()
      return
    }

    try {
      const { callAIApi, getApiSettings } = await import('./chatApi')
      
      const settings = getApiSettings()
      if (!settings) {
        throw new Error('请先配置 API 设置')
      }
      
      const prompt = `你是一个记忆提取助手。分析以下角色描述，提取关于用户的初始记忆。

角色描述：
${characterDescription}

⚠️ 格式说明：
- {{user}} 或 {{User}} 代表用户
- {{char}} 或 {{Char}} 代表 AI 角色
- 请提取所有关于 {{user}} 的信息

请提取描述中提到的关于用户的信息，例如：
- 用户的基本信息（姓名、年龄、职业等）
- 用户的偏好喜好
- 用户和角色的关系
- 其他重要信息

⚠️ 重要原则：
- 只提取关于 {{user}} 的信息，不要提取关于 {{char}} 的信息
- 只提取明确提到的信息
- 不要推测或想象
- 如果没有关于用户的信息，返回空数组

请以 JSON 格式返回：
\`\`\`json
[
  {
    "type": "fact|preference|event|emotion|relationship",
    "content": "记忆内容（用"用户"代替{{user}}）",
    "importance": 1-10,
    "tags": ["标签1", "标签2"]
  }
]
\`\`\`

如果没有需要记录的信息，返回：
\`\`\`json
[]
\`\`\``

      const response = await callAIApi([
        { role: 'user', content: prompt }
      ], settings)

      // 解析 AI 返回的 JSON
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const extractedMemories = JSON.parse(jsonMatch[1])
        
        if (Array.isArray(extractedMemories)) {
          extractedMemories.forEach((mem: any) => {
            if (mem.type && mem.content && mem.importance) {
              this.addMemory(
                mem.type,
                mem.content,
                mem.importance,
                [...(mem.tags || []), '初始记忆']
              )
            }
          })
          
          console.log(`[记忆系统] 从角色描述中提取了 ${extractedMemories.length} 条初始记忆`)
        }
      }

      this.saveInitialMemoriesFlag()
      
    } catch (error) {
      console.error('[记忆系统] 初始记忆提取失败:', error)
    }
  }

  // 导出记忆
  exportMemories(): string {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))
      .sort((a, b) => b.importance - a.importance)

    return JSON.stringify(memories, null, 2)
  }

  // 获取统计信息
  getStatistics() {
    const memories = Array.from(this.memories.values())
    
    return {
      total: memories.length,
      byType: {
        fact: memories.filter(m => m.type === 'fact').length,
        preference: memories.filter(m => m.type === 'preference').length,
        event: memories.filter(m => m.type === 'event').length,
        emotion: memories.filter(m => m.type === 'emotion').length,
        relationship: memories.filter(m => m.type === 'relationship').length
      },
      avgImportance: memories.length > 0 ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length : 0,
      oldestMemory: memories.length > 0 ? Math.min(...memories.map(m => m.timestamp)) : 0,
      newestMemory: memories.length > 0 ? Math.max(...memories.map(m => m.timestamp)) : 0
    }
  }

  // 删除记忆
  deleteMemory(memoryId: string) {
    this.memories.delete(memoryId)
    this.saveMemories()
  }

  // 生成时间线事件记录（用于记忆总结页面）
  async generateTimelineFromMessages(
    messages: any[],
    characterName: string = 'AI',
    userName: string = '用户'
  ): Promise<string> {
    try {
      const { callAIApi } = await import('./chatApi')
      const { summaryApiService } = await import('../services/summaryApiService')
      
      // 使用副API
      const summaryApiConfig = summaryApiService.get()
      
      // 🔥 检查副API是否已配置
      if (!summaryApiConfig.baseUrl || !summaryApiConfig.apiKey || !summaryApiConfig.model) {
        throw new Error('请先在系统设置中配置副API（智能总结API）')
      }
      
      const summarySettings = {
        baseUrl: summaryApiConfig.baseUrl,
        apiKey: summaryApiConfig.apiKey,
        model: summaryApiConfig.model,
        provider: summaryApiConfig.provider,
        temperature: 0.3,
        maxTokens: 4000  // 增加token限制
      }

      console.log('[时间线生成] 开始分析消息记录...')
      console.log(`[时间线生成] 总消息数: ${messages.length}`)

      // 如果消息太多，智能分批处理
      const BATCH_SIZE = 100 // 每批最多100条消息
      let allEvents: any[] = []
      
      if (messages.length > BATCH_SIZE) {
        console.log(`[时间线生成] 消息较多，分批处理...`)
        const batches = Math.ceil(messages.length / BATCH_SIZE)
        
        for (let i = 0; i < batches; i++) {
          const start = i * BATCH_SIZE
          const end = Math.min((i + 1) * BATCH_SIZE, messages.length)
          const batchMessages = messages.slice(start, end)
          
          console.log(`[时间线生成] 处理第 ${i + 1}/${batches} 批 (${start + 1}-${end})`)
          
          const batchEvents = await this.analyzeBatch(batchMessages, characterName, userName, summarySettings)
          allEvents.push(...batchEvents)
          
          // 避免请求过快
          if (i < batches - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        console.log(`[时间线生成] 所有批次处理完成，共 ${allEvents.length} 条事件`)
        
        // 格式化为时间线文本
        const timeline = allEvents.map(event => 
          `[${event.startTime}-${event.endTime}] ${event.description}`
        ).join('\n')
        
        return timeline
      }

      // 消息不多，一次性处理
      // 格式化所有消息为可读文本
      const formattedMessages = messages.map((m, idx) => {
        const time = new Date(m.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
        const sender = m.type === 'sent' ? userName : characterName
        let content = m.content || ''
        
        // 处理视频通话记录
        if (m.videoCallRecord) {
          const callDuration = m.videoCallRecord.duration
          const callMinutes = Math.floor(callDuration / 60)
          const conversations = m.videoCallRecord.messages
            .map((msg: any) => {
              const speaker = msg.type === 'user' ? userName : (msg.type === 'ai' ? characterName : '旁白')
              return `  ${speaker}: ${msg.content}`
            })
            .join('\n')
          content = `[视频通话${callMinutes}分钟]\n${conversations}`
        }
        
        // 处理线下模式
        if (m.sceneMode === 'offline') {
          content = `[线下剧情] ${content}`
        }
        
        return `${idx + 1}. [${time}] ${sender}: ${content}`
      }).join('\n')

      // 让AI智能分析和总结（使用数组拼接，避免复杂模板字符串转义问题）
      const prompt = [
        '你是时间线生成助手。分析聊天记录，生成一个人类能看懂的「我们这段时间发生了什么」时间轴。',
        '',
        '聊天记录：',
        formattedMessages,
        '',
        '规则：',
        '- 用 3-10 条事件概括整段聊天记录；',
        '- 每条 30-80 字，描述大致时间范围、主要聊了什么、氛围和结果；',
        '- 可以把普通闲聊合并成一句概括，例如「这段时间主要是日常聊天和打趣」。',
        '',
        '输出一个 JSON 数组，每一项形如：',
        '{"startTime":"MM/DD HH:mm","endTime":"MM/DD HH:mm","description":"具体事件描述"}',
        '',
        '如果整段聊天里确实完全没有值得一提的内容，可以返回空数组 []。'
      ].join('\n')

      // 调用副API生成时间线
      const response = await callAIApi([
        { role: 'user', content: prompt }
      ], summarySettings)

      console.log('[时间线生成] AI返回结果')
      
      // 解析AI返回的JSON
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/)
      if (!jsonMatch) {
        console.error('[时间线生成] AI返回格式错误，未找到JSON')
        return '时间线生成失败：AI返回格式错误'
      }
      
      const events = JSON.parse(jsonMatch[1])
      
      if (!Array.isArray(events)) {
        console.error('[时间线生成] AI返回格式错误，不是数组')
        return '时间线生成失败：返回格式错误'
      }
      
      console.log(`[时间线生成] 成功生成 ${events.length} 条事件`)
      
      // 格式化为时间线文本
      const timeline = events.map(event => 
        `[${event.startTime}-${event.endTime}] ${event.description}`
      ).join('\n')
      
      return timeline
      
    } catch (error) {
      console.error('[时间线生成] 失败:', error)
      return `时间线生成失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  }

  // 分析一批消息（辅助方法）
  private async analyzeBatch(
    messages: any[],
    characterName: string,
    userName: string,
    settings: any
  ): Promise<any[]> {
    const { callAIApi } = await import('./chatApi')
    
    // 格式化消息
    const formattedMessages = messages.map((m, idx) => {
      const time = new Date(m.timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      const sender = m.type === 'sent' ? userName : characterName
      let content = m.content || ''
      
      // 处理视频通话记录
      if (m.videoCallRecord) {
        const callDuration = m.videoCallRecord.duration
        const callMinutes = Math.floor(callDuration / 60)
        const conversations = m.videoCallRecord.messages
          .map((msg: any) => {
            const speaker = msg.type === 'user' ? userName : (msg.type === 'ai' ? characterName : '旁白')
            return `  ${speaker}: ${msg.content}`
          })
          .join('\n')
        content = `[视频通话${callMinutes}分钟]\n${conversations}`
      }
      
      // 处理线下模式
      if (m.sceneMode === 'offline') {
        content = `[线下剧情] ${content}`
      }
      
      return `${idx + 1}. [${time}] ${sender}: ${content}`
    }).join('\n')

    const prompt = `你是时间线生成助手。分析聊天记录，提取**真正重要的事件**生成简洁时间线。

聊天记录：
${formattedMessages}

## 核心原则：高度浓缩，只记录真正重要的

**什么是重要事件？**
- ✅ 关系发展（表白、确认关系、分手、和好）
- ✅ 重要决定（计划约会、做重要决定）
- ✅ 情绪爆发（大吵架、闹矛盾、深度倾诉）
- ✅ 特殊活动（视频通话、线下见面、一起做某事）
- ✅ 关键转折（态度转变、打开心扉、新发现）

**什么不重要？（不要记录）**
- ❌ 日常寒暄、闲聊、简单互动、普通对话

## 智能分段规则

1. **时间跨度要大**：一天内的多次对话可以合并成1-2个事件
2. **内容要浓缩**：100条消息可能只是"日常聊天"，1条事件即可
3. **抓住核心**：关注情感、关系、重要决定，忽略无意义对话
4. **严格筛选**：宁可少记录，不要流水账

## 输出要求

- 每批最多1-3个重要事件
- 每个事件50-80字，包含**具体内容、情感、结果**
- 时间跨度至少30分钟
- **如果整段聊天都是普通闲聊，返回空数组**

返回JSON：
\`\`\`json
[{"startTime":"MM/DD HH:mm","endTime":"MM/DD HH:mm","description":"详细描述"}]
\`\`\``

    try {
      const response = await callAIApi([
        { role: 'user', content: prompt }
      ], settings)
      
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      return []
    } catch (error) {
      console.error('[批次分析] 失败:', error)
      return []
    }
  }

}

// 单例管理器
class MemoryManager {
  private systems: Map<string, MemorySystem> = new Map()

  getSystem(characterId: string): MemorySystem {
    if (!this.systems.has(characterId)) {
      this.systems.set(characterId, new MemorySystem(characterId))
    }
    return this.systems.get(characterId)!
  }

  // 定期清理所有角色的记忆
  cleanupAll() {
    this.systems.forEach(system => system.cleanupMemories())
  }
}

export const memoryManager = new MemoryManager()

// 每天自动清理一次
setInterval(() => {
  const enableAutoCleanup = false
  if (enableAutoCleanup) {
    memoryManager.cleanupAll()
  }
}, 24 * 60 * 60 * 1000)
