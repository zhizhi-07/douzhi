import { getStoredUserProfileJSON } from '../utils/userProfileStorage'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'
import { loadMessages, saveMessages, forceRecoverFromIndexedDB } from '../utils/simpleMessageManager'
import { getUnreadCount } from '../utils/unreadMessages'
import { groupChatManager } from '../utils/groupChatManager'
import { loadChatList, saveChatList, clearChatListCache } from '../utils/chatListManager'
import { playSystemSound } from '../utils/soundManager'

// 🔥🔥🔥 紧急修复：启动时强制从IndexedDB恢复数据
clearChatListCache()
forceRecoverFromIndexedDB().catch(error => console.error('加载聊天缓存失败:', error))
// 🔥 清除sessionStorage旧缓存，防止加载过期数据
sessionStorage.removeItem('__preloaded_chatlist__')

interface Chat {
  id: string
  characterId: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  timestamp?: number  // 时间戳用于排序
  unread?: number
  isGroup?: boolean
  isPinned?: boolean
}

const ChatList = () => {
  const navigate = useNavigate()
  const { customIcons } = useOutletContext<{ customIcons: Record<string, string> }>()

  // 🔥 从预加载缓存初始化，避免进入时闪烁
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const cached = sessionStorage.getItem('__preloaded_chatlist__')
      if (cached) {
        const parsed = JSON.parse(cached)
        console.log('⚡ ChatList: 从缓存加载', parsed.length, '个聊天')
        return parsed
      }
    } catch (e) {
      console.error('读取缓存失败:', e)
    }
    return []
  })
  // 🔥 追踪是否完成首次加载，避免闪现"暂无聊天"
  const [isInitialLoaded, setIsInitialLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupAvatar, setGroupAvatar] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([])

  // 左滑菜单状态
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchCurrentX, setTouchCurrentX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Chat | null>(null)


  // 加载调整参数
  const [topbarScale, setTopbarScale] = useState(100)
  const [topbarX, setTopbarX] = useState(0)
  const [topbarY, setTopbarY] = useState(0)

  // 更新聊天列表的最新消息和头像
  const updateChatsWithLatestMessages = useCallback((chatList: Chat[]) => {
    // 🔥 不再过滤角色不存在的聊天，防止数据恢复后看不到
    return chatList.map(chat => {
      // 获取角色最新信息（包括头像）
      const character = characterService.getById(chat.characterId)

      // 读取未读数
      const unread = getUnreadCount(chat.characterId)

      const messages = loadMessages(chat.characterId)
      if (messages.length === 0) {
        return {
          ...chat,
          avatar: character?.avatar || chat.avatar,
          name: character ? (character.remark || character.nickname || character.realName) : chat.name,
          unread
        }
      }

      // 找到最后一条非系统消息
      const lastMessage = [...messages].reverse().find(msg => {
        if (msg.type === 'system') {
          // 视频通话记录显示在列表
          if (msg.messageType === 'video-call-record') {
            return true
          }
          return false
        }
        return true
      })

      if (!lastMessage) {
        return {
          ...chat,
          avatar: character?.avatar || chat.avatar,
          name: character ? (character.remark || character.nickname || character.realName) : chat.name
          // 保留 unread 字段
        }
      }

      // 格式化最后一条消息
      let lastMessageText = '开始聊天吧'
      if (lastMessage.messageType === 'transfer' && lastMessage.transfer) {
        lastMessageText = `[转账] ¥${lastMessage.transfer.amount}`
      } else if (lastMessage.messageType === 'voice') {
        lastMessageText = '[语音]'
      } else if (lastMessage.messageType === 'location') {
        lastMessageText = '[位置]'
      } else if (lastMessage.messageType === 'photo') {
        lastMessageText = '[照片]'
      } else if (lastMessage.messageType === 'video-call-record') {
        lastMessageText = '[视频通话]'
      } else if (lastMessage.content) {
        lastMessageText = lastMessage.content
      }

      return {
        ...chat,
        avatar: character?.avatar || chat.avatar,
        name: character ? (character.remark || character.nickname || character.realName) : chat.name,
        lastMessage: lastMessageText,
        time: lastMessage.time,
        timestamp: lastMessage.timestamp || 0,  // 保存时间戳用于排序
        unread
      }
    })
  }, [])

  // 加载调整参数
  useEffect(() => {
    const loadAdjustParams = () => {
      const topScale = localStorage.getItem('main-topbar-bg-scale')
      const topX = localStorage.getItem('main-topbar-bg-x')
      const topY = localStorage.getItem('main-topbar-bg-y')

      if (topScale) setTopbarScale(parseInt(topScale))
      if (topX) setTopbarX(parseInt(topX))
      if (topY) setTopbarY(parseInt(topY))
    }
    loadAdjustParams()

    const handleAdjust = () => {
      console.log('🔄 收到调整事件')
      loadAdjustParams()
    }

    window.addEventListener('iconAdjust', handleAdjust)
    return () => {
      window.removeEventListener('iconAdjust', handleAdjust)
    }
  }, [])

  // 统一的聊天列表刷新函数
  const refreshChatList = useCallback(async () => {
    // 加载单聊（从 IndexedDB）
    let chatList: Chat[] = []
    let originalLength = 0
    try {
      const originalChatList = await loadChatList()
      originalLength = originalChatList.length
      chatList = updateChatsWithLatestMessages(originalChatList)

      // 如果过滤后数量减少了，说明有角色被删除，需要保存更新后的列表
      if (chatList.length < originalLength) {
        console.log(`🔄 检测到 ${originalLength - chatList.length} 个已删除角色的聊天，正在清理...`)
        await saveChatList(chatList)
      }
    } catch (error) {
      console.error('加载聊天列表失败:', error)
    }

    // 加载群聊
    const groups = groupChatManager.getAllGroups()

    // 去重群聊（基于ID）
    const uniqueGroups = groups.filter((group, index, self) =>
      index === self.findIndex(g => g.id === group.id)
    )

    const groupChats: Chat[] = uniqueGroups.map(group => ({
      id: group.id,
      characterId: group.id,
      name: group.name,
      avatar: group.avatar || '',
      lastMessage: group.lastMessage || '开始聊天吧',
      time: group.lastMessageTime || '',
      timestamp: group.lastMessageTimestamp || 0,  // 使用时间戳用于排序
      isGroup: true
    }))

    // 合并并去重（基于ID）
    const allChats = [...chatList, ...groupChats]
    const uniqueChats = allChats.filter((chat, index, self) =>
      index === self.findIndex(c => c.id === chat.id)
    )

    // 排序：置顶的在最上面，其余按时间戳排序
    uniqueChats.sort((a, b) => {
      // 先按置顶状态排序
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 置顶状态相同时，按时间戳排序（越新的越靠前）
      const timestampA = a.timestamp || 0
      const timestampB = b.timestamp || 0

      return timestampB - timestampA
    })

    setChats(uniqueChats)
    
    // 🔥 更新缓存，供下次快速加载（限制数量避免配额超出）
    try {
      const toCache = uniqueChats.slice(0, 50).map((c: any) => ({
        ...c,
        lastMessage: c.lastMessage?.substring?.(0, 100) || c.lastMessage
      }))
      sessionStorage.setItem('__preloaded_chatlist__', JSON.stringify(toCache))
    } catch (e) {
      // 配额超出，清空缓存
      sessionStorage.removeItem('__preloaded_chatlist__')
    }
  }, [updateChatsWithLatestMessages])

  // 加载聊天列表
  useEffect(() => {
    refreshChatList().then(() => {
      setIsInitialLoaded(true)
    })
    loadCharacters()
  }, [refreshChatList])

  // 监听未读数更新事件和置顶更新
  useEffect(() => {
    const handleUnreadUpdate = (e: Event) => {
      console.log(`📬 [ChatList] 收到 unread-updated 事件`, (e as CustomEvent).detail)
      refreshChatList()
    }

    const handleChatListUpdate = () => {
      console.log('📌 收到聊天列表更新事件，刷新列表')
      refreshChatList()
    }

    window.addEventListener('unread-updated', handleUnreadUpdate) // 修复：使用正确的事件名
    window.addEventListener('storage', handleUnreadUpdate)
    window.addEventListener('chat-list-update', handleChatListUpdate)

    return () => {
      window.removeEventListener('unread-updated', handleUnreadUpdate)
      window.removeEventListener('storage', handleUnreadUpdate)
      window.removeEventListener('chat-list-update', handleChatListUpdate)
    }
  }, [refreshChatList])

  // 监听页面可见性，当返回页面时更新消息
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshChatList()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshChatList])

  // 加载未添加的角色（用于单聊）
  const loadCharacters = () => {
    const allCharacters = characterService.getAll()
    // 过滤出未添加到聊天列表的角色
    const available = allCharacters.filter(
      c => !chats.some(chat => chat.characterId === c.id)
    )
    setAvailableCharacters(available)
  }

  // 加载所有角色（用于群聊）
  const loadAllCharacters = () => {
    const allCharacters = characterService.getAll()
    setAvailableCharacters(allCharacters)
  }

  // 左滑相关的触摸处理
  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    // 如果已经有滑动打开的项，先关闭它
    if (swipedChatId && swipedChatId !== chatId) {
      setSwipedChatId(null)
    }
    setTouchStartX(e.touches[0].clientX)
    setTouchCurrentX(e.touches[0].clientX)
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent, chatId: string) => {
    if (!isSwiping) return
    const currentX = e.touches[0].clientX
    setTouchCurrentX(currentX)

    const diff = touchStartX - currentX
    // 左滑超过30px时触发
    if (diff > 30 && swipedChatId !== chatId) {
      setSwipedChatId(chatId)
    } else if (diff < -30 && swipedChatId === chatId) {
      setSwipedChatId(null)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    setTouchStartX(0)
    setTouchCurrentX(0)
  }

  // 删除聊天
  const handleDeleteChat = async (chat: Chat) => {
    try {
      // 1. 从聊天列表中移除
      const updatedChats = chats.filter(c => c.id !== chat.id)
      await saveChatList(updatedChats.filter(c => !c.isGroup))

      // 2. 清空该角色的聊天记录
      if (!chat.isGroup) {
        saveMessages(chat.characterId, [])
      } else {
        // 群聊删除
        await groupChatManager.deleteGroup(chat.id)
      }

      // 3. 刷新列表
      await refreshChatList()
      setShowDeleteConfirm(null)
      setSwipedChatId(null)

      console.log('✅ 已删除聊天:', chat.name)
    } catch (error) {
      console.error('❌ 删除聊天失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 置顶/取消置顶
  const handleTogglePin = async (chat: Chat) => {
    try {
      const updatedChats = chats.map(c => {
        if (c.id === chat.id) {
          return { ...c, isPinned: !c.isPinned }
        }
        return c
      })

      // 只保存非群聊到聊天列表
      await saveChatList(updatedChats.filter(c => !c.isGroup))

      // 刷新列表
      await refreshChatList()
      setSwipedChatId(null)

      // 触发更新事件
      window.dispatchEvent(new Event('chat-list-update'))

      console.log('✅ 已' + (chat.isPinned ? '取消置顶' : '置顶') + ':', chat.name)
    } catch (error) {
      console.error('❌ 置顶操作失败:', error)
    }
  }

  const handleAddCharacter = async (characterId: string) => {
    const character = availableCharacters.find(c => c.id === characterId)
    if (!character) return

    const newChat: Chat = {
      id: characterId,
      characterId: characterId,
      name: character.nickname || character.realName,
      avatar: character.avatar || '',
      lastMessage: '开始聊天吧',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const updatedChats = [newChat, ...chats.filter(c => !c.isGroup)]

    // 保存到 IndexedDB
    try {
      await saveChatList(updatedChats)
      console.log('✅ 聊天列表已保存')
    } catch (error) {
      console.error('❌ 保存聊天列表失败:', error)
      alert('保存失败，存储空间可能不足')
    }

    // 刷新列表
    await refreshChatList()
    setShowAddModal(false)
    loadCharacters() // 重新加载可用角色
  }

  return (
    <div className="h-full flex flex-col font-serif soft-page-enter">
      {/* 顶部 - 玻璃拟态 */}
      <div
        className="relative z-10"
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: `${topbarScale}%`,
          backgroundPosition: `calc(50% + ${topbarX}px) calc(50% + ${topbarY}px)`
        } : {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        <StatusBar />
        <div className="px-5 py-3">
          {/* 用户头像和操作区 */}
          <div className="flex items-center justify-between mb-3">
            <div className="w-20 flex justify-start">
              <button onClick={() => navigate('/')} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
                <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">微信</h1>
            <div className="w-20 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  loadAllCharacters()
                  setShowGroupModal(true)
                }}
                className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform"
              >
                {customIcons['main-group'] ? (
                  <img src={customIcons['main-group']} alt="群聊" className="w-8 h-8 object-contain" />
                ) : (
                  <svg className="w-5 h-5 stroke-[1.5]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  loadCharacters()
                  setShowAddModal(true)
                }}
                className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform"
              >
                {customIcons['main-add'] ? (
                  <img src={customIcons['main-add']} alt="添加" className="w-8 h-8 object-contain" />
                ) : (
                  <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-20">
        {chats.length === 0 && isInitialLoaded ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8C8C8C]">
            <svg className="w-16 h-16 mb-4 stroke-[1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm mb-2">暂无聊天</p>
            <p className="text-xs font-light">开始一段新对话吧</p>
          </div>
        ) : chats.length > 0 ? (
          <div className="space-y-2">
            {/* 置顶聊天区块 */}
            {chats.filter(chat => chat.isPinned).map((chat, chatIndex) => (
              <div
                key={chat.id}
                className="relative overflow-hidden rounded-xl card-enter"
                style={{ animationDelay: `${chatIndex * 0.05}s` }}
              >
                {/* 右侧操作按钮 - 固定在右侧 */}
                <div className="absolute right-0 top-0 bottom-0 flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTogglePin(chat)
                    }}
                    className="w-16 h-full bg-[#C7C7CC] text-white text-sm font-medium flex items-center justify-center"
                  >
                    取消置顶
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(chat)
                    }}
                    className="w-16 h-full bg-[#FF3B30] text-white text-sm font-medium flex items-center justify-center"
                  >
                    删除
                  </button>
                </div>

                {/* 主内容区域 - 可滑动 */}
                <div
                  onTouchStart={(e) => handleTouchStart(e, chat.id)}
                  onTouchMove={(e) => handleTouchMove(e, chat.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (swipedChatId === chat.id) {
                      setSwipedChatId(null)
                    } else {
                      playSystemSound()
                      navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                    }
                  }}
                  className="relative flex items-center px-4 py-3 cursor-pointer bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-xl hover:bg-white/70 transition-transform duration-200"
                  style={{
                    transform: swipedChatId === chat.id ? 'translateX(-128px)' : 'translateX(0)'
                  }}
                >
                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/40">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xl text-[#8C8C8C]">{chat.isGroup ? '👥' : '👤'}</div>
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 ml-4 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[15px] text-[#2C2C2C] truncate tracking-wide">{chat.name}</span>
                      <span className="text-[10px] text-[#8C8C8C] ml-2 flex-shrink-0 font-sans">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-[#5A5A5A] truncate flex-1 pr-2 font-light">{chat.lastMessage}</p>
                      {(chat.unread ?? 0) > 0 && (
                        <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] text-white flex items-center justify-center bg-[#8B3A3A] flex-shrink-0 badge-pop shadow-sm">
                          {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 置顶标识 */}
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#2C2C2C]/20 rounded-full"></div>
                </div>
              </div>
            ))}

            {/* 未置顶聊天区块 */}
            {chats.filter(chat => !chat.isPinned).map((chat, chatIndex) => (
              <div
                key={chat.id}
                className="relative overflow-hidden rounded-xl card-enter"
                style={{ animationDelay: `${(chatIndex + chats.filter(c => c.isPinned).length) * 0.05}s` }}
              >
                {/* 右侧操作按钮 - 固定在右侧 */}
                <div className="absolute right-0 top-0 bottom-0 flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTogglePin(chat)
                    }}
                    className="w-16 h-full bg-[#C7C7CC] text-white text-sm font-medium flex items-center justify-center"
                  >
                    置顶
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(chat)
                    }}
                    className="w-16 h-full bg-[#FF3B30] text-white text-sm font-medium flex items-center justify-center"
                  >
                    删除
                  </button>
                </div>

                {/* 主内容区域 - 可滑动 */}
                <div
                  onTouchStart={(e) => handleTouchStart(e, chat.id)}
                  onTouchMove={(e) => handleTouchMove(e, chat.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (swipedChatId === chat.id) {
                      setSwipedChatId(null)
                    } else {
                      playSystemSound()
                      navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                    }
                  }}
                  className="relative flex items-center px-4 py-3 cursor-pointer bg-white/40 backdrop-blur-md border border-white/30 shadow-sm rounded-xl hover:bg-white/50 transition-transform duration-200"
                  style={{
                    transform: swipedChatId === chat.id ? 'translateX(-128px)' : 'translateX(0)'
                  }}
                >
                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/30">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xl text-[#8C8C8C]">{chat.isGroup ? '👥' : '👤'}</div>
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 ml-4 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[15px] text-[#2C2C2C] truncate tracking-wide">{chat.name}</span>
                      <span className="text-[10px] text-[#8C8C8C] ml-2 flex-shrink-0 font-sans">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-[#5A5A5A] truncate flex-1 pr-2 font-light">{chat.lastMessage}</p>
                      {(chat.unread ?? 0) > 0 && (
                        <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] text-white flex items-center justify-center bg-[#8B3A3A] flex-shrink-0 badge-pop shadow-sm">
                          {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 添加角色弹窗 - 玻璃拟态 */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-[#2C2C2C]/20 backdrop-blur-sm z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl border-t border-white/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-[#2C2C2C]">添加联系人</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#8C8C8C] hover:text-[#5A5A5A]"
                >
                  ✕
                </button>
              </div>
              {availableCharacters.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[#8C8C8C] mb-4 text-sm font-light">暂无可用角色</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      navigate('/create-character')
                    }}
                    className="px-6 py-2 bg-[#2C2C2C] text-[#F9F8F4] rounded-full active:scale-95 transition-transform text-xs tracking-widest uppercase"
                  >
                    新建角色
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCharacters.map(character => (
                    <div
                      key={character.id}
                      onClick={() => handleAddCharacter(character.id)}
                      className="flex items-center p-3 bg-white/50 border border-white/40 rounded-xl cursor-pointer hover:bg-white/70 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-white/40">
                        {character.avatar ? (
                          <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-[#8C8C8C]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h3 className="font-medium text-[#2C2C2C] tracking-wide">{character.nickname || character.realName}</h3>
                        {character.signature && (
                          <p className="text-xs text-[#8C8C8C] truncate font-light">{character.signature}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 创建群聊弹窗 - 玻璃拟态 */}
      {showGroupModal && (
        <>
          <div
            className="fixed inset-0 bg-[#2C2C2C]/20 backdrop-blur-sm z-40"
            onClick={() => {
              setShowGroupModal(false)
              setGroupName('')
              setGroupAvatar('')
              setSelectedMembers(new Set())
            }}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl border-t border-white/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-[#2C2C2C]">创建群聊</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false)
                    setGroupName('')
                    setGroupAvatar('')
                    setSelectedMembers(new Set())
                  }}
                  className="text-[#8C8C8C] hover:text-[#5A5A5A]"
                >
                  ✕
                </button>
              </div>

              {/* 群名称 */}
              <div className="mb-4">
                <label className="text-xs text-[#8C8C8C] mb-2 block">群聊名称</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="输入群聊名称"
                  className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-lg focus:outline-none focus:bg-white/70 transition-colors text-sm"
                />
              </div>

              {/* 群头像 */}
              <div className="mb-4">
                <label className="text-xs text-[#8C8C8C] mb-2 block">群头像（可选）</label>
                <input
                  type="file"
                  id="group-avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = () => {
                        setGroupAvatar(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <div
                  className="w-16 h-16 rounded-xl bg-white/50 border border-white/40 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/70 transition-colors shadow-sm"
                  onClick={() => document.getElementById('group-avatar-upload')?.click()}
                >
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="群头像" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-[#8C8C8C]">👥</span>
                  )}
                </div>
              </div>

              {/* 选择成员 */}
              <div className="mb-4">
                <label className="text-xs text-[#8C8C8C] mb-2 block">选择成员 ({selectedMembers.size})</label>
                <div className="space-y-2">
                  {availableCharacters.map(char => {
                    const isSelected = selectedMembers.has(char.id)
                    return (
                      <div
                        key={char.id}
                        onClick={() => {
                          const newSet = new Set(selectedMembers)
                          if (isSelected) {
                            newSet.delete(char.id)
                          } else {
                            newSet.add(char.id)
                          }
                          setSelectedMembers(newSet)
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-white/70 border-[#2C2C2C]/20' : 'bg-white/30 border-transparent hover:bg-white/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/40 overflow-hidden border border-white/40">
                            {char.avatar && (
                              <img src={char.avatar} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-[#2C2C2C]">{char.nickname || char.realName}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#2C2C2C] border-[#2C2C2C]' : 'border-[#D4D4D4]'
                          }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!groupName || selectedMembers.size === 0) return
                  
                  // 获取用户信息
                  const userInfo = JSON.parse(getStoredUserProfileJSON() || '{}')
                  const creatorName = userInfo.nickname || userInfo.realName || '你'
                  
                  // 准备成员ID列表（包含用户自己）
                  const memberIds = ['user', ...Array.from(selectedMembers)]
                  
                  // 准备成员名称列表
                  const memberNames = memberIds.map(id => {
                    if (id === 'user') return creatorName
                    const char = characterService.getById(id)
                    return char?.nickname || char?.realName || id
                  })
                  
                  // 创建群聊
                  const newGroup = await groupChatManager.createGroup(
                    groupName,
                    memberIds,
                    creatorName,
                    memberNames
                  )
                  
                  // 如果有群头像，更新群聊
                  if (groupAvatar) {
                    await groupChatManager.updateGroup(newGroup.id, { avatar: groupAvatar })
                  }
                  
                  // 关闭弹窗并重置状态
                  setShowGroupModal(false)
                  setGroupName('')
                  setGroupAvatar('')
                  setSelectedMembers(new Set())
                  
                  // 刷新聊天列表
                  await refreshChatList()
                  
                  // 播放音效
                  playSystemSound()
                  
                  // 导航到新创建的群聊
                  navigate(`/group/${newGroup.id}`)
                }}
                disabled={!groupName || selectedMembers.size === 0}
                className={`w-full py-3 rounded-xl text-sm font-medium tracking-widest uppercase transition-all ${groupName && selectedMembers.size > 0
                  ? 'bg-[#2C2C2C] text-[#F9F8F4] shadow-lg hover:opacity-90'
                  : 'bg-[#E5E5E5] text-[#A0A0A0] cursor-not-allowed'
                  }`}
              >
                创建
              </button>
            </div>
          </div>
        </>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 animate-scale-in">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">删除聊天</h3>
                <p className="text-sm text-gray-500 mb-1">
                  确定删除与 <span className="font-medium text-gray-700">{showDeleteConfirm.name}</span> 的聊天？
                </p>
                <p className="text-xs text-red-400">
                  聊天记录将被永久删除，无法恢复
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteChat(showDeleteConfirm)}
                  className="flex-1 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatList
