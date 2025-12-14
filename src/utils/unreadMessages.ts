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
  console.log(`📬 [incrementUnread] 开始增加未读: chatId=${chatId}, count=${count}`)
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
  console.log(`📬 [incrementUnread] 已保存未读数据: ${chatId}, 总计: ${newCount}`)
  
  // 更新聊天列表
  updateChatListUnread(chatId, newCount)
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
 * 🔥 修复：使用 IndexedDB 而不是 localStorage
 */
async function updateChatListUnread(chatId: string, count: number) {
  console.log(`📬 [updateChatListUnread] 开始更新: chatId=${chatId}, count=${count}`)
  try {
    // 动态导入避免循环依赖
    const { loadChatList, saveChatList } = await import('./chatListManager')
    
    const chatList = await loadChatList()
    console.log(`📬 [updateChatListUnread] 加载聊天列表: ${chatList?.length || 0} 个`)
    if (!chatList || chatList.length === 0) {
      console.log(`⚠️ 未找到聊天列表`)
      return
    }
    
    const chatIndex = chatList.findIndex((c: any) => c.characterId === chatId)
    console.log(`📬 [updateChatListUnread] 查找chatId=${chatId}, 找到索引=${chatIndex}`)
    
    if (chatIndex >= 0) {
      chatList[chatIndex].unread = count > 0 ? count : undefined
      await saveChatList(chatList)
      
      console.log(`✅ [updateChatListUnread] 已更新聊天列表未读数: chatId=${chatId}, count=${count}`)
      
      // 触发未读更新事件
      window.dispatchEvent(new CustomEvent('unread-updated', {
        detail: { chatId, count }
      }))
      console.log(`📬 [updateChatListUnread] 已触发 unread-updated 事件`)
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
