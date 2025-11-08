/**
 * 未读消息管理系统
 * 跟踪每个聊天的未读消息数量
 */

interface UnreadData {
  chatId: string
  count: number
  lastUpdate: number
}

const STORAGE_KEY = 'unread_messages'

/**
 * 获取未读消息数据
 */
function getUnreadData(): Map<string, UnreadData> {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return new Map()
  
  try {
    const entries = JSON.parse(saved) as Array<[string, UnreadData]>
    return new Map(entries)
  } catch (e) {
    console.error('读取未读消息数据失败:', e)
    return new Map()
  }
}

/**
 * 保存未读消息数据
 */
function saveUnreadData(data: Map<string, UnreadData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(data.entries())))
}

/**
 * 增加未读消息数
 */
export function incrementUnread(chatId: string, count: number = 1) {
  const data = getUnreadData()
  const current = data.get(chatId)
  
  let newCount = count
  if (current) {
    current.count += count
    current.lastUpdate = Date.now()
    newCount = current.count
  } else {
    data.set(chatId, {
      chatId,
      count,
      lastUpdate: Date.now()
    })
  }
  
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(chatId, newCount)
  
  console.log(`📬 未读消息 +${count}: ${chatId}, 总计: ${newCount}`)
}

/**
 * 清除未读消息
 */
export function clearUnread(chatId: string) {
  const data = getUnreadData()
  data.delete(chatId)
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(chatId, 0)
  
  console.log(`✅ 已清除未读消息: ${chatId}`)
}

/**
 * 获取未读消息数
 */
export function getUnreadCount(chatId: string): number {
  const data = getUnreadData()
  return data.get(chatId)?.count || 0
}

/**
 * 更新聊天列表中的未读数
 */
function updateChatListUnread(chatId: string, count: number) {
  try {
    const CHAT_LIST_KEY = 'chat_list' // 使用正确的key
    const chatListStr = localStorage.getItem(CHAT_LIST_KEY)
    if (!chatListStr) {
      console.log(`⚠️ 未找到聊天列表: key=${CHAT_LIST_KEY}`)
      return
    }
    
    const chatList = JSON.parse(chatListStr)
    
    const chatIndex = chatList.findIndex((c: any) => c.characterId === chatId)
    
    if (chatIndex >= 0) {
      chatList[chatIndex].unread = count > 0 ? count : undefined
      localStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chatList))
      
      console.log(`✅ 更新聊天列表未读数: chatId=${chatId}, count=${count}`)
      
      // 触发未读更新事件
      window.dispatchEvent(new CustomEvent('unread-updated', {
        detail: { chatId, count }
      }))
    } else {
      console.log(`⚠️ 在聊天列表中未找到chatId: ${chatId}`)
    }
  } catch (e) {
    console.error('更新聊天列表未读数失败:', e)
  }
}

/**
 * 获取所有未读消息总数
 */
export function getTotalUnreadCount(): number {
  const data = getUnreadData()
  let total = 0
  data.forEach(item => {
    total += item.count
  })
  return total
}
