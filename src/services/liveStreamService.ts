/**
 * 直播服务 - 使用 zhizhi API 生成直播内容
 */

import { characterService } from './characterService'
import { saveToIndexedDB, getFromIndexedDB } from '../utils/unifiedStorage'
import { callZhizhiApi } from './zhizhiapi'

// 直播间类型
export interface LiveStream {
  id: string
  streamerId: string
  streamerName: string
  streamerAvatar?: string
  title: string
  description: string
  category: string
  viewers: number
  likes: number
  followers: number
  color: string
  isLive: boolean
  startTime: number
  comments: LiveComment[]
  gifts: LiveGift[]
  fanBadgeName?: string  // 粉丝牌名称
}

// 评论类型
export interface LiveComment {
  id: string
  userId: string
  userName: string
  avatar?: string
  content: string
  timestamp: number
  isSystem?: boolean
}

// 礼物类型
export interface LiveGift {
  id: string
  userId: string
  userName: string
  giftType: GiftType
  count: number
  timestamp: number
}

// 礼物定义
export interface GiftType {
  id: string
  name: string
  icon: string
  price: number  // 金币
  animationType: 'normal' | 'rocket' | 'crown' | 'castle' | 'galaxy' // 特效类型
  color: string // 礼物卡片背景色
}

// 预设礼物列表
export const GIFT_LIST: GiftType[] = [
  { id: 'heart', name: '小心心', icon: '❤️', price: 1, animationType: 'normal', color: 'from-pink-500 to-rose-500' },
  { id: 'flower', name: '鲜花', icon: '🌹', price: 10, animationType: 'normal', color: 'from-red-500 to-rose-600' },
  { id: 'star', name: '星星', icon: '⭐', price: 50, animationType: 'normal', color: 'from-yellow-400 to-orange-500' },
  { id: 'crown', name: '皇冠', icon: '👑', price: 200, animationType: 'crown', color: 'from-yellow-500 to-amber-600' },
  { id: 'rocket', name: '火箭', icon: '🚀', price: 500, animationType: 'rocket', color: 'from-blue-500 to-indigo-600' },
  { id: 'castle', name: '城堡', icon: '🏰', price: 1000, animationType: 'castle', color: 'from-purple-500 to-indigo-600' },
  { id: 'galaxy', name: '银河', icon: '🌌', price: 5000, animationType: 'galaxy', color: 'from-violet-600 to-fuchsia-600' },
  { id: 'planet', name: '星球', icon: '🪐', price: 2000, animationType: 'normal', color: 'from-teal-500 to-emerald-600' },
]

// 直播分类
export const LIVE_CATEGORIES = ['推荐', '18+', '带货', '情感', '游戏', '才艺', '聊天']

// 用户直播数据
export interface UserLiveData {
  odiumLevel: number              // 观众等级 1-50
  exp: number                     // 当前经验值
  totalGiftValue: number          // 总送礼金额
  totalWatchTime: number          // 总观看时长(秒)
  fanClubs: FanClubMembership[]   // 加入的粉丝团
  badges: string[]                // 获得的徽章
  roomAdminOf: string[]           // 是哪些直播间的房管
}

// 粉丝团成员信息
export interface FanClubMembership {
  streamerId: string
  streamerName: string
  level: number                   // 粉丝牌等级 1-30
  intimacy: number                // 亲密度
  giftValue: number               // 给这个主播送的礼物总值
  joinTime: number
  badgeName: string               // 粉丝牌名称
  badgeColor: string              // 粉丝牌颜色
}

// 贡献榜条目
export interface LeaderboardEntry {
  odiumRank: number
  odiumUserId: string
  userName: string
  avatar?: string
  giftValue: number
  fanLevel: number
  isRoomAdmin: boolean
}

// 用户等级配置
export const USER_LEVEL_CONFIG = {
  // 等级 -> 所需经验
  expRequired: (level: number) => Math.floor(100 * Math.pow(1.5, level - 1)),
  // 等级对应的颜色
  levelColor: (level: number) => {
    if (level >= 40) return 'from-yellow-400 to-red-500'      // 传说
    if (level >= 30) return 'from-purple-400 to-pink-500'    // 荣耀
    if (level >= 20) return 'from-blue-400 to-cyan-500'      // 真爱
    if (level >= 10) return 'from-green-400 to-emerald-500'  // 铁粉
    return 'from-gray-400 to-gray-500'                        // 普通
  },
  // 等级称号
  levelTitle: (level: number) => {
    if (level >= 40) return '传说'
    if (level >= 30) return '荣耀'
    if (level >= 20) return '真爱'
    if (level >= 10) return '铁粉'
    return '观众'
  }
}

// 粉丝牌颜色列表
export const FAN_BADGE_COLORS = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-pink-500',
]

// 渐变色列表
const GRADIENT_COLORS = [
  'from-purple-900 to-indigo-900',
  'from-slate-800 to-gray-800',
  'from-amber-900 to-orange-900',
  'from-blue-900 to-cyan-900',
  'from-emerald-900 to-teal-900',
  'from-rose-900 to-pink-900',
  'from-violet-900 to-purple-900',
  'from-neutral-800 to-stone-800',
]

// 存储键
const STORAGE_KEY = 'live_streams_data'
const CUSTOM_STREAMERS_KEY = 'custom_live_streamers'

// 自定义主播类型
export interface CustomStreamer {
  id: string
  name: string
  avatar?: string
  personality: string
  category: string
  createdAt: number
}

class LiveStreamService {
  private streams: LiveStream[] = []
  private customStreamers: CustomStreamer[] = []
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.loadCustomStreamers()
    // 清理旧的 localStorage 数据，释放空间
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  // 加载自定义主播
  private loadCustomStreamers() {
    try {
      const data = localStorage.getItem(CUSTOM_STREAMERS_KEY)
      if (data) {
        this.customStreamers = JSON.parse(data)
      }
    } catch (e) {
      console.error('加载自定义主播失败:', e)
    }
  }

  // 保存自定义主播
  private saveCustomStreamers() {
    localStorage.setItem(CUSTOM_STREAMERS_KEY, JSON.stringify(this.customStreamers))
  }

  // 添加自定义主播
  addCustomStreamer(streamer: Omit<CustomStreamer, 'id' | 'createdAt'>): CustomStreamer {
    const newStreamer: CustomStreamer = {
      ...streamer,
      id: `custom_${Date.now()}`,
      createdAt: Date.now()
    }
    this.customStreamers.push(newStreamer)
    this.saveCustomStreamers()
    return newStreamer
  }

  // 删除自定义主播
  removeCustomStreamer(id: string) {
    this.customStreamers = this.customStreamers.filter(s => s.id !== id)
    this.saveCustomStreamers()
  }

  // 获取所有自定义主播
  getCustomStreamers(): CustomStreamer[] {
    return this.customStreamers
  }

  // 初始化直播数据（使用 zhizhi API）
  async initialize(forceRefresh = false): Promise<LiveStream[]> {
    // 防止重复初始化
    if (this.initPromise && !forceRefresh) {
      return this.initPromise.then(() => this.streams)
    }

    // 检查缓存
    if (!forceRefresh) {
      const cached = await this.loadFromStorage()
      if (cached && cached.length > 0) {
        // 检查是否超过30分钟
        const oldestStream = cached.reduce((min: number, s: LiveStream) => s.startTime < min ? s.startTime : min, Date.now())
        if (Date.now() - oldestStream < 30 * 60 * 1000) {
          this.streams = cached
          this.isInitialized = true
          return this.streams
        }
      }
    }

    this.initPromise = this.generateStreams()
    await this.initPromise
    return this.streams
  }

  // 从存储加载（异步）
  private async loadFromStorage(): Promise<LiveStream[] | null> {
    try {
      const data = await getFromIndexedDB('SETTINGS', STORAGE_KEY)
      return data || null
    } catch (e) {
      console.error('加载直播数据失败:', e)
    }
    return null
  }

  // 保存到存储（异步）
  private async saveToStorage() {
    try {
      // 只保留最近的20个直播，减少存储量
      const toSave = this.streams.slice(0, 20).map(s => ({
        ...s,
        comments: s.comments.slice(-50), // 每个直播只保留最近50条评论
        gifts: s.gifts.slice(-30)  // 只保留最近30个礼物
      }))
      await saveToIndexedDB('SETTINGS', STORAGE_KEY, toSave)
    } catch (e) {
      console.error('保存直播数据失败:', e)
    }
  }

  // 使用 AI 生成直播内容
  private async generateStreams(): Promise<void> {
    console.log('🎬 开始生成直播内容...')

    // 获取当前时间段信息
    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 6 ? '深夜' : hour < 9 ? '早晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜'
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    // 生成4-6个直播
    const streamCount = 4 + Math.floor(Math.random() * 3)

    const prompt = `你是一个直播平台的内容生成器。

【当前时间】${timeStr}（${timeOfDay}）

请你自己创造${streamCount}个正在直播的主播，每个主播都要有独特的名字、性格、直播内容。

返回JSON数组格式：
[
  {
    "streamerName": "主播名字（你自己起，要有网感）",
    "streamerPersonality": "主播性格简介（20-40字）",
    "title": "直播标题（10-20字，吸引人）",
    "description": "直播简介（30-50字）",
    "category": "分类（音乐/情感/助眠/聊天/游戏/二次元/美食/户外/学习）",
    "initialComments": ["弹幕1", "弹幕2", ... 共10条弹幕],
    "streamerGreeting": "主播开场白（20-40字）"
  }
]

要求：
1. 主播名字要有创意，像真实网红昵称
2. 根据时间段生成合适的内容（深夜助眠/情感，早上早安/运动，下午聊天/游戏等）
3. 每个主播风格要不同，有男有女，有活泼有安静
4. 标题要吸引人，让人想点进去
5. 每个直播间必须有10条弹幕，弹幕要自然，像真实观众，内容多样（互动、提问、夸赞、吐槽等）
6. 直接返回JSON数组，不要其他内容`

    try {
      // 📝 打印提示词
      console.log('\n🎤 ===== 直播内容生成提示词 =====')
      console.log(prompt)
      console.log('===== 提示词结束 =====\n')

      // 使用随机轮询API
      const content = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.8, max_tokens: 2000 }
      )

      // 📝 打印AI输出
      console.log('\n🤖 ===== AI输出 =====')
      console.log(content || '(空)')
      console.log('===== AI输出结束 =====\n')
      
      // 解析JSON
      const match = content.match(/\[[\s\S]*\]/)
      if (match) {
        const streamData = JSON.parse(match[0])
        
        this.streams = streamData.map((s: any, index: number) => {
          const streamerId = `npc_${Date.now()}_${index}`
          const streamerName = s.streamerName || `主播${index + 1}`
          
          // 初始评论/弹幕
          const viewerNames = ['小星星', '夜猫子', '路人甲', '粉丝一号', '新来的', '追梦少年', '甜甜圈', '小确幸', '深夜食堂', '云朵朵']
          const initialComments: LiveComment[] = (s.initialComments || []).map((c: string, i: number) => ({
            id: `init_comment_${Date.now()}_${index}_${i}`,
            userId: `user_${Math.random().toString(36).slice(2, 8)}`,
            userName: viewerNames[i % viewerNames.length] || `观众${i+1}`,
            content: c,
            timestamp: Date.now() - (10 - i) * 3000
          }))

          // 主播开场白
          if (s.streamerGreeting) {
            initialComments.push({
              id: `streamer_greeting_${Date.now()}_${index}`,
              userId: streamerId,
              userName: streamerName,
              content: s.streamerGreeting,
              timestamp: Date.now(),
              isSystem: false
            })
          }

          return {
            id: `live_${Date.now()}_${index}`,
            streamerId,
            streamerName,
            streamerAvatar: undefined,
            streamerPersonality: s.streamerPersonality || '',
            title: s.title || '精彩直播中',
            description: s.description || '',
            category: s.category || LIVE_CATEGORIES[Math.floor(Math.random() * LIVE_CATEGORIES.length)],
            viewers: Math.floor(Math.random() * 50000) + 100,
            likes: Math.floor(Math.random() * 10000),
            followers: Math.floor(Math.random() * 100000) + 1000,
            color: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
            isLive: true,
            startTime: Date.now() - Math.floor(Math.random() * 3600000),
            comments: initialComments,
            gifts: [],
            fanBadgeName: streamerName.slice(0, 2) + '粉'
          }
        })

        console.log('✅ 生成直播内容成功:', this.streams.length, '个直播间')
        this.saveToStorage()
        this.isInitialized = true
        return
      }
    } catch (e) {
      console.error('❌ 生成直播内容失败:', e)
    }

    // 失败时使用默认数据
    this.streams = this.getDefaultStreams()
    this.saveToStorage()
    this.isInitialized = true
  }

  // 默认直播数据（AI生成失败时的兜底）
  private getDefaultStreams(): LiveStream[] {
    const defaults = [
      { name: '深夜电台小K', title: '深夜电台·陪你入眠', category: '助眠' },
      { name: '闲聊达人', title: '一起来聊聊天吧', category: '聊天' },
      { name: '音乐小站', title: '音乐分享会', category: '音乐' },
      { name: '游戏高手', title: '游戏实况·冲冲冲', category: '游戏' },
    ]

    return defaults.map((d, i) => ({
      id: `live_default_${i}`,
      streamerId: `default_${i}`,
      streamerName: d.name,
      streamerAvatar: undefined,
      title: d.title,
      description: '欢迎来到直播间，一起度过美好时光',
      category: d.category,
      viewers: Math.floor(Math.random() * 10000) + 100,
      likes: Math.floor(Math.random() * 5000),
      followers: Math.floor(Math.random() * 50000) + 500,
      color: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
      isLive: true,
      startTime: Date.now() - Math.floor(Math.random() * 3600000),
      comments: [],
      gifts: [],
      fanBadgeName: d.name.slice(0, 2) + '粉'
    }))
  }

  // 获取所有直播
  getStreams(): LiveStream[] {
    return this.streams
  }

  // 获取单个直播
  getStream(id: string): LiveStream | undefined {
    return this.streams.find(s => s.id === id)
  }

  // 按分类筛选
  getStreamsByCategory(category: string): LiveStream[] {
    if (category === '推荐') return this.streams
    return this.streams.filter(s => s.category === category)
  }

  // 生成直播评论（AI互动）
  async generateComments(streamId: string, count = 5): Promise<LiveComment[]> {
    const stream = this.getStream(streamId)
    if (!stream) return []

    const prompt = `你是直播间的观众模拟器。当前直播间信息：
- 主播：${stream.streamerName}
- 标题：${stream.title}
- 内容：${stream.description}

请生成${count}条真实的观众弹幕/评论，返回JSON数组：
[
  { "userName": "用户昵称", "content": "评论内容（5-20字）" }
]

要求：
1. 评论要自然，像真实观众
2. 有互动性，可以问问题、夸主播、聊内容
3. 昵称要有网感
4. 直接返回JSON，不要其他内容`

    try {
      const content = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.9, max_tokens: 500 }
      )
      
      const match = content.match(/\[[\s\S]*\]/)
      if (match) {
        const comments = JSON.parse(match[0])
        return comments.map((c: any, i: number) => ({
          id: `comment_${Date.now()}_${i}`,
          userId: `user_${Math.random().toString(36).slice(2, 8)}`,
          userName: c.userName || `观众${i + 1}`,
          content: c.content || '主播好棒！',
          timestamp: Date.now()
        }))
      }
    } catch (e) {
      console.error('生成评论失败:', e)
    }

    // 默认评论
    return this.getDefaultComments()
  }

  // 默认评论
  private getDefaultComments(): LiveComment[] {
    const defaults = [
      { userName: '小星星', content: '主播好厉害！' },
      { userName: '夜猫子', content: '深夜来报道' },
      { userName: '路人甲', content: '氛围太好了' },
      { userName: '粉丝一号', content: '每天都来支持' },
      { userName: '新来的', content: '第一次看，感觉不错' }
    ]
    return defaults.map((c, i) => ({
      id: `default_comment_${i}`,
      userId: `default_user_${i}`,
      userName: c.userName,
      content: c.content,
      timestamp: Date.now() - i * 5000
    }))
  }

  // 主播回复用户（AI生成）
  async generateStreamerReply(streamId: string, userMessage: string): Promise<string> {
    const stream = this.getStream(streamId)
    if (!stream) return '谢谢支持~'

    // 获取主播人设
    let personality = ''
    const character = characterService.getById(stream.streamerId)
    if (character?.personality) {
      personality = character.personality
    } else {
      const customStreamer = this.customStreamers.find(s => s.id === stream.streamerId)
      if (customStreamer?.personality) {
        personality = customStreamer.personality
      }
    }

    const prompt = `你是直播主播"${stream.streamerName}"。
${personality ? `你的人设：${personality}` : ''}
当前正在直播：${stream.title}

有观众发了一条弹幕：${userMessage}

请用主播的身份回复这条弹幕，要求：
1. 符合主播人设
2. 自然亲切，像真实主播
3. 15-40字左右
4. 只返回回复内容，不要其他`

    try {
      const content = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.8, max_tokens: 100 }
      )
      return content || '谢谢宝子的支持~'
    } catch (e) {
      console.error('生成主播回复失败:', e)
      return '谢谢支持，比心~'
    }
  }

  // 增加观看人数
  addViewer(streamId: string) {
    const stream = this.getStream(streamId)
    if (stream) {
      stream.viewers += 1
      this.saveToStorage()
    }
  }

  // 点赞
  addLike(streamId: string) {
    const stream = this.getStream(streamId)
    if (stream) {
      stream.likes += 1
      this.saveToStorage()
    }
  }

  // 送礼物
  sendGift(streamId: string, userId: string, userName: string, giftType: GiftType, count = 1): LiveGift | null {
    const stream = this.getStream(streamId)
    if (!stream) return null

    const gift: LiveGift = {
      id: `gift_${Date.now()}`,
      userId,
      userName,
      giftType,
      count,
      timestamp: Date.now()
    }

    stream.gifts.push(gift)
    this.saveToStorage()
    return gift
  }

  // 添加评论
  addComment(streamId: string, comment: Omit<LiveComment, 'id' | 'timestamp'>): LiveComment | null {
    const stream = this.getStream(streamId)
    if (!stream) return null

    const newComment: LiveComment = {
      ...comment,
      id: `comment_${Date.now()}`,
      timestamp: Date.now()
    }

    stream.comments.push(newComment)
    // 只保留最近100条评论
    if (stream.comments.length > 100) {
      stream.comments = stream.comments.slice(-100)
    }
    this.saveToStorage()
    return newComment
  }

  // 清除缓存，强制刷新
  clearCache() {
    localStorage.removeItem(STORAGE_KEY)
    this.streams = []
    this.isInitialized = false
    this.initPromise = null
  }

  // ========== 用户直播数据管理 ==========
  
  private getUserLiveDataKey() {
    return 'user_live_data'
  }

  // 获取用户直播数据
  getUserLiveData(): UserLiveData {
    try {
      const data = localStorage.getItem(this.getUserLiveDataKey())
      if (data) return JSON.parse(data)
    } catch (e) {
      console.error('获取用户直播数据失败:', e)
    }
    // 默认数据
    return {
      odiumLevel: 1,
      exp: 0,
      totalGiftValue: 0,
      totalWatchTime: 0,
      fanClubs: [],
      badges: [],
      roomAdminOf: []
    }
  }

  // 保存用户直播数据
  saveUserLiveData(data: UserLiveData) {
    localStorage.setItem(this.getUserLiveDataKey(), JSON.stringify(data))
  }

  // 增加经验值并检查升级
  addExp(amount: number): { newLevel: number, levelUp: boolean } {
    const data = this.getUserLiveData()
    data.exp += amount
    
    let levelUp = false
    let newLevel = data.odiumLevel
    
    // 检查升级
    while (data.exp >= USER_LEVEL_CONFIG.expRequired(newLevel) && newLevel < 50) {
      data.exp -= USER_LEVEL_CONFIG.expRequired(newLevel)
      newLevel++
      levelUp = true
    }
    
    data.odiumLevel = newLevel
    this.saveUserLiveData(data)
    
    return { newLevel, levelUp }
  }

  // 加入粉丝团
  joinFanClub(streamerId: string, streamerName: string, badgeName: string): FanClubMembership {
    const data = this.getUserLiveData()
    
    // 检查是否已加入
    const existing = data.fanClubs.find(f => f.streamerId === streamerId)
    if (existing) return existing
    
    const colorIndex = data.fanClubs.length % FAN_BADGE_COLORS.length
    const membership: FanClubMembership = {
      streamerId,
      streamerName,
      level: 1,
      intimacy: 0,
      giftValue: 0,
      joinTime: Date.now(),
      badgeName,
      badgeColor: FAN_BADGE_COLORS[colorIndex]
    }
    
    data.fanClubs.push(membership)
    this.saveUserLiveData(data)
    return membership
  }

  // 获取粉丝团信息
  getFanClubMembership(streamerId: string): FanClubMembership | undefined {
    const data = this.getUserLiveData()
    return data.fanClubs.find(f => f.streamerId === streamerId)
  }

  // 增加粉丝团亲密度
  addIntimacy(streamerId: string, amount: number): { newLevel: number, levelUp: boolean } {
    const data = this.getUserLiveData()
    const membership = data.fanClubs.find(f => f.streamerId === streamerId)
    
    if (!membership) return { newLevel: 0, levelUp: false }
    
    membership.intimacy += amount
    
    let levelUp = false
    // 粉丝牌升级: 每100亲密度升1级，最高30级
    const newLevel = Math.min(30, Math.floor(membership.intimacy / 100) + 1)
    if (newLevel > membership.level) {
      membership.level = newLevel
      levelUp = true
    }
    
    this.saveUserLiveData(data)
    return { newLevel: membership.level, levelUp }
  }

  // 记录送礼
  recordGiftSent(streamerId: string, giftValue: number) {
    const data = this.getUserLiveData()
    data.totalGiftValue += giftValue
    
    // 更新粉丝团送礼记录
    const membership = data.fanClubs.find(f => f.streamerId === streamerId)
    if (membership) {
      membership.giftValue += giftValue
    }
    
    this.saveUserLiveData(data)
    
    // 送礼获得经验
    this.addExp(Math.floor(giftValue / 10))
    
    // 增加亲密度
    if (membership) {
      this.addIntimacy(streamerId, Math.floor(giftValue / 5))
    }
  }

  // 设为房管
  setRoomAdmin(streamerId: string) {
    const data = this.getUserLiveData()
    if (!data.roomAdminOf.includes(streamerId)) {
      data.roomAdminOf.push(streamerId)
      this.saveUserLiveData(data)
    }
  }

  // 检查是否是房管
  isRoomAdmin(streamerId: string): boolean {
    const data = this.getUserLiveData()
    return data.roomAdminOf.includes(streamerId)
  }

  // 生成模拟榜单数据（更真实的网名）
  generateLeaderboard(_streamId: string): LeaderboardEntry[] {
    // 真实风格的网名
    const prefixes = ['小', '阿', '大', '老', '']
    const names1 = ['星星', '月亮', '太阳', '云朵', '雨滴', '雪花', '微风', '清风']
    const names2 = ['猫咪', '狐狸', '兔子', '熊猫', '柴犬', '企鹅', '仓鼠', '考拉']
    const names3 = ['奶茶', '咖啡', '柠檬', '草莓', '蜜桃', '葡萄', '芒果', '西瓜']
    const suffixes = ['', '呀', '儿', '酱', '君', 'er', '~', '']
    
    const generateName = () => {
      const type = Math.floor(Math.random() * 3)
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      let name = ''
      if (type === 0) name = names1[Math.floor(Math.random() * names1.length)]
      else if (type === 1) name = names2[Math.floor(Math.random() * names2.length)]
      else name = names3[Math.floor(Math.random() * names3.length)]
      return prefix + name + suffix
    }
    
    const avatars = ['🦊', '🐱', '🐼', '🦁', '🐯', '🐰', '🦋', '🌟', '🍑', '🍓']
    const usedNames = new Set<string>()
    
    return Array.from({ length: 5 }, (_, i) => {
      let name = generateName()
      while (usedNames.has(name)) {
        name = generateName()
      }
      usedNames.add(name)
      
      return {
        odiumRank: i + 1,
        odiumUserId: `user_${i}_${Date.now()}`,
        userName: name,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        giftValue: Math.floor(10000 / (i + 1)) + Math.floor(Math.random() * 1000),
        fanLevel: Math.max(1, 20 - i * 3),
        isRoomAdmin: i < 2
      }
    })
  }
}

export const liveStreamService = new LiveStreamService()
