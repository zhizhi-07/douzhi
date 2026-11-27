/**
 * 群聊管理器
 * 🔥 使用 IndexedDB 存储，解决 localStorage 配额限制
 */

import * as IDB from './indexedDBManager'
import { mergeMessages, repairDuplicateMessageIds } from './mergeMessages'
import { nextMessageId } from './messageId'
import { characterService } from '../services/characterService'

export interface GroupMember {
  id: string
  role: 'owner' | 'admin' | 'member'  // 角色：群主、管理员、普通成员
  title?: string  // 自定义头衔
}

export interface GroupChat {
  id: string
  name: string
  avatar?: string
  memberIds: string[]
  members?: GroupMember[]  // 成员详细信息
  owner?: string  // 群主ID
  createdAt: string
  lastMessage?: string
  lastMessageTime?: string
  lastMessageTimestamp?: number  // 最后一条消息的时间戳（用于排序）
  announcement?: string  // 群公告
  minReplyCount?: number  // AI每次回复的最少消息条数（默认10条）
  lorebookId?: string  // 挂载的世界书ID（全局世界书）
  enableTheatreCards?: boolean  // 是否启用小剧场卡片功能（默认true）
  smartSummary?: {
    enabled: boolean  // 是否启用智能总结
    triggerInterval?: number  // 每隔多少轮对话触发一次总结（默认10轮）
    lastSummary?: string  // 最后一次总结的JSON字符串
    lastSummaryTime?: string  // 最后一次总结的时间
    lastSummaryMessageCount?: number  // 上次总结时的消息总数（已废弃）
    lastSummaryUserMessageCount?: number  // 上次总结时用户发送的消息数（按轮数计算）
  }
  // 🔥 剧情摘要（每次 AI 回复后自动保存，用于下次回复时作为背景，避免 AI 失忆）
  plotSummary?: {
    relationships: string  // 当前人物关系
    plot: string  // 当前剧情进展
    updatedAt: number  // 更新时间
  }
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  time: string
  type: 'text' | 'image' | 'voice' | 'emoji' | 'system'
  timestamp?: number
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容
  recalledBy?: string  // 谁撤回的
  quotedMessage?: {  // 引用的消息
    id: string
    content: string
    userName: string
  }
  emojiUrl?: string  // 表情包URL
  emojiDescription?: string  // 表情包描述
  // 🔥 新增：多媒体消息支持
  messageType?: 'text' | 'voice' | 'location' | 'photo' | 'transfer' | 'emoji' | 'redPacket'
  voiceText?: string  // 语音消息的文本内容
  voiceUrl?: string   // 语音消息的音频URL
  duration?: number   // 语音时长（秒）
  location?: {        // 位置消息
    name: string      // 地点名称
    address: string   // 详细地址
  }
  photoDescription?: string  // 照片描述
  photoBase64?: string        // 照片的base64编码
  transfer?: {        // 转账消息
    amount: number
    message: string
    toUserId: string  // 转账接收者ID（群聊特有，指定转给谁）
    toUserName: string // 转账接收者名称
    status?: 'pending' | 'received' | 'expired'
  }
  redPacket?: {       // 红包消息
    totalAmount: number     // 总金额
    count: number           // 红包个数
    blessing: string        // 祝福语
    received: Array<{       // 已领取列表
      userId: string
      userName: string
      amount: number
      timestamp: number
    }>
    remaining: number       // 剩余金额
    remainingCount: number  // 剩余个数
  }
}

const GROUP_CHATS_KEY = 'group_chats' // 仅用于迁移
const GROUP_MESSAGES_PREFIX = 'group_messages_' // 仅用于迁移

// 消息ID计数器（用于同一毫秒内的消息区分）

// 🔥 批量添加模式标志（AI回复期间设为true，避免每条消息都触发事件）
let batchMode = false
export const setBatchMode = (enabled: boolean) => {
  batchMode = enabled
  console.log(`📦 [批量模式] ${enabled ? '开启' : '关闭'}`)
}

// 缓存（避免频繁读取 localStorage）
let groupsCache: GroupChat[] | null = null
// 🔥 缓存消息（避免频繁读取 localStorage，key: groupId, value: messages）
const messagesCache = new Map<string, GroupMessage[]>()
// Serialize writes without discarding payloads or overwrite flags.
const messageWrites = new Map<string, Promise<void>>()
const messageLoads = new Map<string, Promise<GroupMessage[]>>()
const loadedGroups = new Set<string>()
const retryWrites = new Map<string, Array<{ snapshot: GroupMessage[]; overwrite: boolean }>>()
const messageRevisions = new Map<string, number>()

// 启动时从 IndexedDB 加载群聊列表
IDB.getItem<GroupChat[]>(IDB.STORES.MISC, 'group_chats').then(groups => {
  if (groups && groups.length > 0) {
    groupsCache = groups
    console.log(`✅ 已从 IndexedDB 加载 ${groups.length} 个群聊`)
  } else {
    // 尝试从 localStorage 迁移
    try {
      const saved = localStorage.getItem(GROUP_CHATS_KEY)
      if (saved) {
        const localGroups = JSON.parse(saved)
        console.log(`📦 从 localStorage 迁移 ${localGroups.length} 个群聊到 IndexedDB`)
        groupsCache = localGroups
        IDB.setItem(IDB.STORES.MISC, 'group_chats', localGroups).then(() => {
          if (localStorage.getItem(GROUP_CHATS_KEY) === saved) localStorage.removeItem(GROUP_CHATS_KEY)
        }).catch(e => console.error('迁移群聊失败，原数据已保留:', e))
      } else {
        groupsCache = []
      }
    } catch (e) {
      console.error('迁移群聊失败:', e)
      groupsCache = []
    }
  }
})

class GroupChatManager {
  // 获取所有群聊（同步，使用缓存）
  getAllGroups(): GroupChat[] {
    return groupsCache || []
  }

  // 获取单个群聊
  getGroup(groupId: string): GroupChat | null {
    const groups = this.getAllGroups()
    const group = groups.find(g => g.id === groupId) || null
    
    // 🔥 兼容旧数据：如果members不存在，自动初始化
    if (group && !group.members && group.memberIds) {
      group.members = group.memberIds.map((id, index) => ({
        id,
        role: index === 0 ? 'owner' : 'member'
      }))
      group.owner = group.memberIds[0]
      // 保存更新
      this.updateGroup(groupId, { members: group.members, owner: group.owner })
    }
    
    return group
  }

  // 创建群聊
  createGroup(name: string, memberIds: string[], creatorName: string = '你', memberNames: string[] = []): GroupChat {
    const groupId = `group_${Date.now()}`
    
    // 初始化成员角色，第一个成员(user)为群主
    const members: GroupMember[] = memberIds.map((id, index) => ({
      id,
      role: index === 0 ? 'owner' : 'member'
    }))
    
    const newGroup: GroupChat = {
      id: groupId,
      name,
      memberIds,
      members,
      owner: memberIds[0], // 第一个成员为群主
      createdAt: new Date().toISOString(),
      lastMessage: '开始聊天吧',
      lastMessageTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      lastMessageTimestamp: Date.now()
    }
    
    if (!groupsCache) groupsCache = []
    groupsCache.push(newGroup)
    
    // 后台异步保存到 IndexedDB
    IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    
    // 🎉 添加系统消息：创建群聊
    const otherMembers = memberNames.filter((_, idx) => memberIds[idx] !== 'user')
    if (otherMembers.length > 0) {
      const membersText = otherMembers.join('、')
      this.addMessage(groupId, {
        userId: 'system',
        userName: '系统',
        userAvatar: '',
        content: `${creatorName}邀请${membersText}加入了群聊`,
        type: 'system'
      })
    }
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    
    return newGroup
  }

  // 更新群聊
  updateGroup(groupId: string, updates: Partial<GroupChat>): void {
    if (!groupsCache) return
    const index = groupsCache.findIndex(g => g.id === groupId)
    if (index !== -1) {
      groupsCache[index] = { ...groupsCache[index], ...updates }
      // 后台异步保存
      IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    }
  }

  // 更新群公告（带系统消息）
  updateAnnouncement(groupId: string, announcement: string, userName: string = '你'): void {
    // 更新群聊信息
    this.updateGroup(groupId, { announcement })
    
    // 添加系统消息
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${userName}修改了群公告`,
      type: 'system'
    })
  }

  // 设置/取消管理员（带系统消息）
  setAdmin(groupId: string, memberId: string, isAdmin: boolean, userName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group || !group.members) return
    
    const memberIndex = group.members.findIndex(m => m.id === memberId)
    if (memberIndex === -1) return
    
    // 更新成员角色
    group.members[memberIndex].role = isAdmin ? 'admin' : 'member'
    this.updateGroup(groupId, { members: group.members })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    const content = isAdmin 
      ? `${userName}设置${memberName}为管理员 🛡️`
      : `${userName}取消了${memberName}的管理员身份`
    
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content,
      type: 'system'
    })
  }

  // 设置头衔（带系统消息）
  setTitle(groupId: string, memberId: string, title: string, userName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group || !group.members) return
    
    const memberIndex = group.members.findIndex(m => m.id === memberId)
    if (memberIndex === -1) return
    
    const oldTitle = group.members[memberIndex].title
    
    // 更新头衔
    if (title) {
      group.members[memberIndex].title = title
    } else {
      delete group.members[memberIndex].title
    }
    this.updateGroup(groupId, { members: group.members })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    let content = ''
    if (title && !oldTitle) {
      content = `${userName}给${memberName}设置了头衔为：✨${title}`
    } else if (title && oldTitle) {
      content = `${userName}将${memberName}的头衔更改为：✨${title}`
    } else if (!title && oldTitle) {
      content = `${userName}取消了${memberName}的头衔`
    }
    
    if (content) {
      this.addMessage(groupId, {
        userId: 'system',
        userName: '系统',
        userAvatar: '',
        content,
        type: 'system'
      })
    }
  }

  // 转让群主（带系统消息）
  transferOwner(groupId: string, newOwnerId: string, operatorName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group || !group.members) return

    // 当前群主ID
    const currentOwnerId = group.owner || group.members.find(m => m.role === 'owner')?.id
    if (!currentOwnerId || currentOwnerId === newOwnerId) return

    const newOwner = group.members.find(m => m.id === newOwnerId)
    if (!newOwner) return

    // 更新成员角色
    group.members = group.members.map(m => {
      if (m.id === currentOwnerId) {
        return { ...m, role: 'member' }
      }
      if (m.id === newOwnerId) {
        return { ...m, role: 'owner' }
      }
      return m
    })

    group.owner = newOwnerId
    this.updateGroup(groupId, { members: group.members, owner: group.owner })

    // 系统消息
    const memberName = this.getMemberName(newOwnerId)
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${operatorName}将群主转让给了${memberName}`,
      type: 'system'
    })
  }

  // 获取成员名称的辅助方法
  private getMemberName(memberId: string): string {
    if (memberId === 'user') return '我'
    const char = characterService.getById(memberId)
    return char?.realName || char?.nickname || memberId
  }

  // 删除群聊
  deleteGroup(groupId: string): void {
    if (!groupsCache) return
    groupsCache = groupsCache.filter(g => g.id !== groupId)
    
    // 删除群聊数据和消息
    IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    void this.persistMessages(groupId, [], true)
    messagesCache.delete(groupId)
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
  }

  // 添加成员
  addMember(groupId: string, userId: string): void {
    const group = this.getGroup(groupId)
    if (group && !group.memberIds.includes(userId)) {
      group.memberIds.push(userId)
      this.updateGroup(groupId, { memberIds: group.memberIds })
    }
  }

  // 移除成员（退出或被踢）
  removeMember(groupId: string, memberId: string, isKicked: boolean = false, operatorName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group) return
    
    // 移除成员ID
    group.memberIds = group.memberIds.filter(id => id !== memberId)
    
    // 移除成员详情
    if (group.members) {
      group.members = group.members.filter(m => m.id !== memberId)
    }
    
    // 保存更新
    this.updateGroup(groupId, { 
      memberIds: group.memberIds,
      members: group.members
    })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    const content = isKicked 
      ? `${operatorName}将${memberName}移出了群聊`
      : `${memberName}退出了群聊`
    
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content,
      type: 'system'
    })
  }

  // Keep all history. Rendering windows, not destructive storage trimming, limit DOM work.
  getMessages(groupId: string): GroupMessage[] {
    return messagesCache.get(groupId) || []
  }

  async loadMessagesAsync(groupId: string): Promise<GroupMessage[]> {
    if (loadedGroups.has(groupId)) return this.getMessages(groupId)
    const pending = messageLoads.get(groupId)
    if (pending) return pending
    const promise = (async () => {
      const storageKey = 'group_' + groupId
      let messages = await IDB.getItem<GroupMessage[]>(IDB.STORES.MESSAGES, storageKey, true) || []
      if (!Array.isArray(messages)) throw new Error('群聊记录格式错误，原数据已保留')
      const createId = () => `msg_${nextMessageId()}`
      if (repairDuplicateMessageIds(messages, createId) !== messages) {
        messages = await IDB.updateItem<GroupMessage[]>(IDB.STORES.MESSAGES, storageKey,
          current => repairDuplicateMessageIds(current || [], createId))
      }
      const legacyKey = GROUP_MESSAGES_PREFIX + groupId
      const raw = localStorage.getItem(legacyKey)
      if (raw) {
        const legacy = JSON.parse(raw)
        if (!Array.isArray(legacy)) throw new Error('旧群聊记录格式错误，原数据已保留')
        messages = await IDB.updateItem<GroupMessage[]>(IDB.STORES.MESSAGES, storageKey,
          current => mergeMessages(repairDuplicateMessageIds(legacy, createId), current || []))
        if (localStorage.getItem(legacyKey) === raw) localStorage.removeItem(legacyKey)
      }
      const merged = mergeMessages(messages, this.getMessages(groupId))
      messagesCache.set(groupId, merged)
      loadedGroups.add(groupId)
      return merged
    })()
    messageLoads.set(groupId, promise)
    try { return await promise } finally { messageLoads.delete(groupId) }
  }

  private persistMessages(groupId: string, incoming: GroupMessage[], overwrite = false): Promise<void> {
    const revision = (messageRevisions.get(groupId) || 0) + 1
    messageRevisions.set(groupId, revision)
    const snapshot = structuredClone(incoming)
    const promise = (messageWrites.get(groupId) || Promise.resolve()).catch(() => {}).then(async () => {
      const operations = retryWrites.get(groupId) || []
      operations.push({ snapshot, overwrite })
      retryWrites.set(groupId, operations)
      await this.loadMessagesAsync(groupId)
      let saved: GroupMessage[] = []
      while (operations.length) {
        const operation = operations[0]
        saved = await IDB.updateItem<GroupMessage[]>(IDB.STORES.MESSAGES, 'group_' + groupId,
          current => operation.overwrite ? operation.snapshot : mergeMessages(current || [], operation.snapshot))
        operations.shift()
      }
      retryWrites.delete(groupId)
      if (messageRevisions.get(groupId) === revision) {
        messagesCache.set(groupId, saved)
        localStorage.removeItem(GROUP_MESSAGES_PREFIX + groupId)
      }
    })
    messageWrites.set(groupId, promise)
    void promise.catch(error => {
      try { localStorage.setItem(GROUP_MESSAGES_PREFIX + groupId, JSON.stringify(this.getMessages(groupId))) } catch {}
      console.error('群聊消息保存失败，内存数据已保留:', error)
      window.dispatchEvent(new CustomEvent('message-save-error', { detail: { chatId: groupId } }))
    }).finally(() => { if (messageWrites.get(groupId) === promise) messageWrites.delete(groupId) })
    return promise
  }

  async flushMessages(groupId: string): Promise<void> {
    await messageWrites.get(groupId)
  }

  // 添加消息（🔥 使用 IndexedDB）
  // silent: 是否静默模式（不触发事件，用于批量添加）
  addMessage(groupId: string, message: Omit<GroupMessage, 'id' | 'groupId' | 'time'>, silent: boolean = false): GroupMessage {
    // 🔥 使用时间戳 + 计数器生成唯一ID，避免同一毫秒内的冲突
    const now = Date.now()
    const uniqueId = nextMessageId()
    
    const newMessage: GroupMessage = {
      id: `msg_${uniqueId}`,
      groupId,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      ...message
    }
    
    const messages = [...this.getMessages(groupId), newMessage]
    
    // 更新缓存
    messagesCache.set(groupId, messages)
    
    // Silent/batch only suppresses notifications, never durability.
    void this.persistMessages(groupId, [newMessage])
    // 更新群聊最后消息
    this.updateGroup(groupId, {
      lastMessage: newMessage.content,
      lastMessageTime: newMessage.time,
      lastMessageTimestamp: newMessage.timestamp
    })
    
    if (silent || batchMode) return newMessage

    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    
    // 🔥 触发消息保存事件（用于通知和未读标记）
    window.dispatchEvent(new CustomEvent('chat-message-saved', {
      detail: { chatId: groupId, messageType: 'group' }
    }))
    
    return newMessage
  }

  // 清空消息
  clearMessages(groupId: string): void {
    messagesCache.set(groupId, [])
    void this.persistMessages(groupId, [], true)
    this.updateGroup(groupId, {
      lastMessage: undefined,
      lastMessageTime: undefined
    })
  }

  // 🔥 替换所有消息（用于重新生成AI回复）
  // forceOverwrite: true 时直接覆盖，不合并（用于删除消息的场景如"重回"）
  // silent: true 时不触发事件，用于用户发送消息等场景
  replaceAllMessages(groupId: string, messages: GroupMessage[], forceOverwrite: boolean = false, silent: boolean = false): void {
    const validMessages = messages.filter(m => m && m.id)
    if (!forceOverwrite && validMessages.length === 0) return
    messagesCache.set(groupId, forceOverwrite ? validMessages : mergeMessages(this.getMessages(groupId), validMessages))
    void this.persistMessages(groupId, validMessages, forceOverwrite)

    // 更新最后一条消息
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      this.updateGroup(groupId, {
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.time,
        lastMessageTimestamp: lastMsg.timestamp
      })
    } else {
      this.updateGroup(groupId, {
        lastMessage: undefined,
        lastMessageTime: undefined,
        lastMessageTimestamp: undefined
      })
    }
    
    // 🔥 静默模式不触发事件，避免用户发送消息时重复渲染
    if (!silent) {
      // 触发更新事件
      window.dispatchEvent(new Event('storage'))
      
      // 🔥 触发消息保存事件（用于通知和未读标记）
      if (messages.length > 0) {
        window.dispatchEvent(new CustomEvent('chat-message-saved', {
          detail: { chatId: groupId, messageType: 'group' }
        }))
      }
    }
  }

  // 撤回消息
  recallMessage(groupId: string, messageId: string, recallerName?: string): void {
    const messages = [...this.getMessages(groupId)]
    const messageIndex = messages.findIndex(m => m.id === messageId)
    
    if (messageIndex !== -1) {
      const originalMessage = messages[messageIndex]
      const senderName = recallerName || originalMessage.userName || '某人'
      
      messages[messageIndex] = { ...originalMessage }
      messages[messageIndex] = { ...originalMessage }
      messages[messageIndex].isRecalled = true
      messages[messageIndex].recalledContent = originalMessage.content
      messages[messageIndex].recalledBy = senderName  // 记录谁撤回的
      messages[messageIndex].content = `${senderName} 撤回了一条消息`
      messages[messageIndex].type = 'system'
      
      // 更新缓存和 IndexedDB
      messagesCache.set(groupId, messages)
      void this.persistMessages(groupId, [messages[messageIndex]])
      
      // 触发更新事件
      window.dispatchEvent(new Event('storage'))
    }
  }
}

export const groupChatManager = new GroupChatManager()
