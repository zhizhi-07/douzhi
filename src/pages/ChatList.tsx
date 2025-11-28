import { useNavigate } from 'react-router-dom'
import { getAllUIIcons } from '../utils/iconStorage'
import { useState, useEffect, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'
import { loadMessages } from '../utils/simpleMessageManager'
import { getUnreadCount } from '../utils/simpleNotificationManager'
import { groupChatManager } from '../utils/groupChatManager'
import { getUserInfo } from '../utils/userUtils'
import { loadChatList, saveChatList } from '../utils/chatListManager'
import { playSystemSound } from '../utils/soundManager'
import { getImage } from '../utils/unifiedStorage'

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
  const [chats, setChats] = useState<Chat[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupAvatar, setGroupAvatar] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([])
  const [wechatBg, setWechatBg] = useState('')
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  
    
  // 加载调整参数
  const [topbarScale, setTopbarScale] = useState(100)
  const [topbarX, setTopbarX] = useState(0)
  const [topbarY, setTopbarY] = useState(0)
  const [bottombarScale, setBottombarScale] = useState(100)
  const [bottombarX, setBottombarX] = useState(0)
  const [bottombarY, setBottombarY] = useState(0)

  // 更新聊天列表的最新消息和头像
  const updateChatsWithLatestMessages = useCallback((chatList: Chat[]) => {
    return chatList.filter(chat => {
      // 如果不是群聊，检查角色是否还存在
      if (!chat.isGroup) {
        const character = characterService.getById(chat.characterId)
        // 如果角色已被删除，过滤掉这个聊天
        if (!character) {
          console.log(`🗑️ 过滤已删除角色的聊天: ${chat.name} (${chat.characterId})`)
          return false
        }
      }
      return true
    }).map(chat => {
      // 获取角色最新信息（包括头像）
      const character = characterService.getById(chat.characterId)
      
      // 读取未读数
      const unread = getUnreadCount(chat.characterId)
      
      const messages = loadMessages(chat.characterId)
      if (messages.length === 0) {
        return {
          ...chat,
          avatar: character?.avatar || chat.avatar,
          name: character ? (character.nickname || character.realName) : chat.name,
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
          name: character ? (character.nickname || character.realName) : chat.name
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
        name: character ? (character.nickname || character.realName) : chat.name,
        lastMessage: lastMessageText,
        time: lastMessage.time,
        timestamp: lastMessage.timestamp || 0,  // 保存时间戳用于排序
        unread
      }
    })
  }, [])

  // 加载自定义图标
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        let icons = await getAllUIIcons()
        
        console.log('🔍 检查图标:', Object.keys(icons))
        console.log('🔍 global-background存在?', !!icons['global-background'])
        
        // 🌍 全局设置：应用到所有界面
        if (icons['global-background']) {
          // 全局背景应用到主界面
          setWechatBg(icons['global-background'])
          console.log('🌍 应用全局背景到主界面', icons['global-background'].substring(0, 50))
        } else {
          console.log('❌ 没有找到global-background')
        }
        if (icons['global-topbar']) {
          // 全局顶栏应用到主界面（如果没有单独设置）
          if (!icons['main-topbar-bg']) {
            icons['main-topbar-bg'] = icons['global-topbar']
            console.log('🌍 应用全局顶栏到主界面')
          }
        }
        
        // 🔥 同步更新到sessionStorage缓存
        sessionStorage.setItem('__preloaded_icons__', JSON.stringify(icons))
        
        setCustomIcons(icons)
        console.log('✅ ChatList加载自定义图标:', Object.keys(icons).length, '个')
        
        // 调试输出
        if (icons['main-topbar-bg']) {
          console.log('  - 主界面顶栏背景: 已加载')
        }
        if (icons['main-bottombar-bg']) {
          console.log('  - 主界面底栏背景: 已加载')
        }
      } catch (error) {
        console.error('❌ 加载自定义图标失败:', error)
        // 出错时从localStorage恢复
        try {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            const icons = JSON.parse(saved)
            setCustomIcons(icons)
            console.log('✅ 从localStorage备份恢复')
          }
        } catch (err) {
          console.error('备份恢复失败:', err)
        }
      }
    }
    
    // 立即加载
    loadCustomIcons()
    
    // 延迟再次加载，确保数据完整性
    const timer = setTimeout(() => {
      console.log('⏱️ 延迟加载图标...')
      loadCustomIcons()
    }, 100)
    
    // 加载调整参数
    const loadAdjustParams = () => {
      const topScale = localStorage.getItem('main-topbar-bg-scale')
      const topX = localStorage.getItem('main-topbar-bg-x')
      const topY = localStorage.getItem('main-topbar-bg-y')
      const bottomScale = localStorage.getItem('main-bottombar-bg-scale')
      const bottomX = localStorage.getItem('main-bottombar-bg-x')
      const bottomY = localStorage.getItem('main-bottombar-bg-y')
      
      if (topScale) setTopbarScale(parseInt(topScale))
      if (topX) setTopbarX(parseInt(topX))
      if (topY) setTopbarY(parseInt(topY))
      if (bottomScale) setBottombarScale(parseInt(bottomScale))
      if (bottomX) setBottombarX(parseInt(bottomX))
      if (bottomY) setBottombarY(parseInt(bottomY))
      console.log('📐 ChatList加载调整参数:', { topScale, topX, topY, bottomScale, bottomX, bottomY })
    }
    loadAdjustParams()
    
    // 监听图标更新事件
    const handleIconsChange = () => {
      console.log('📡 收到图标更新事件')
      loadCustomIcons()
    }
    const handleAdjust = () => {
      console.log('🔄 收到调整事件')
      loadAdjustParams()
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ui_custom_icons') {
        console.log('检测到localStorage变化')
        loadCustomIcons()
      }
    }
    
    window.addEventListener('uiIconsChanged', handleIconsChange)
    window.addEventListener('iconAdjust', handleAdjust)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('uiIconsChanged', handleIconsChange)
      window.removeEventListener('iconAdjust', handleAdjust)
      window.removeEventListener('storage', handleStorageChange)
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
  }, [updateChatsWithLatestMessages])

  // 加载聊天列表
  useEffect(() => {
    refreshChatList()
    loadCharacters()
  }, [refreshChatList])

  // 监听未读数更新事件和置顶更新
  useEffect(() => {
    const handleUnreadUpdate = () => {
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

  // 注意：不要自动保存 chats 到 localStorage
  // 因为 unread 字段由 unreadMessages.ts 管理
  // 只在添加/删除聊天时手动保存

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

  // 加载微信背景（全局背景在loadCustomIcons中已经设置）
  useEffect(() => {
    const loadWechatBg = async () => {
      // 只有在没有全局背景时才加载单独的微信背景
      const icons = await getAllUIIcons()
      if (!icons['global-background']) {
        const bg = await getImage('wechat_bg')
        if (bg) setWechatBg(bg)
      }
    }
    loadWechatBg()
    
    const handleBgUpdate = async () => {
      console.log('📡 ChatList: 收到背景更新事件')
      const icons = await getAllUIIcons()
      if (!icons['global-background']) {
        const bg = await getImage('wechat_bg')
        if (bg) {
          console.log('✅ ChatList: 背景更新成功')
        }
        setWechatBg(bg || '')
      }
    }
    window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
  }, [])

  
  return (
    <div 
      className="h-screen flex flex-col page-enter"
      style={wechatBg ? { 
        backgroundImage: `url(${wechatBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* 顶部 */}
      <div 
        className="relative"
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: `${topbarScale}%`,
          backgroundPosition: `calc(50% + ${topbarX}px) calc(50% + ${topbarY}px)`
        } : { 
          background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(20px) saturate(180%)', 
          WebkitBackdropFilter: 'blur(20px) saturate(180%)' 
        }}
      >
        <StatusBar />
        <div className="px-5 py-3">
          {/* 用户头像和操作区 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/')} className="text-gray-700 active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">微信</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  loadAllCharacters()
                  setShowGroupModal(true)
                }}
                className="text-gray-700 active:scale-95 transition-transform"
              >
                {customIcons['main-group'] ? (
                  <img src={customIcons['main-group']} alt="群聊" className="w-8 h-8 object-contain" />
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                )}
              </button>
              <button 
                onClick={() => {
                  loadCharacters()
                  setShowAddModal(true)
                }}
                className="text-gray-700 active:scale-95 transition-transform"
              >
                {customIcons['main-add'] ? (
                  <img src={customIcons['main-add']} alt="添加" className="w-8 h-8 object-contain" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-base mb-2">暂无聊天</p>
            <p className="text-sm">点击右上角 + 添加角色开始聊天</p>
          </div>
        ) : (
          <>
            {/* 置顶聊天区块 */}
            {chats.some(chat => chat.isPinned) && (
              <div className="glass-card rounded-[48px] overflow-hidden mb-3">
                {chats.filter(chat => chat.isPinned).map((chat, chatIndex) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      playSystemSound()
                      navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                    }}
                    className="flex items-center px-4 py-3 cursor-pointer active:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 card-enter"
                    style={{ animationDelay: `${chatIndex * 0.05}s` }}
                  >
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {chat.avatar ? (
                        <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xl">{chat.isGroup ? '👥' : '👤'}</div>
                      )}
                    </div>

                    {/* 消息内容 */}
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[15px] text-gray-900 truncate">{chat.name}</span>
                        <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] text-gray-500 truncate flex-1 pr-2">{chat.lastMessage}</p>
                        {(chat.unread ?? 0) > 0 && (
                          <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[11px] text-white flex items-center justify-center bg-red-500 flex-shrink-0 badge-pop">
                            {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 未置顶聊天区块 */}
            {chats.some(chat => !chat.isPinned) && (
              <div className="glass-card rounded-[48px] overflow-hidden">
                {chats.filter(chat => !chat.isPinned).map((chat, chatIndex) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      playSystemSound()
                      navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                    }}
                    className="flex items-center px-4 py-3 cursor-pointer active:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 card-enter"
                    style={{ animationDelay: `${(chatIndex + chats.filter(c => c.isPinned).length) * 0.05}s` }}
                  >
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {chat.avatar ? (
                        <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xl">{chat.isGroup ? '👥' : '👤'}</div>
                      )}
                    </div>

                    {/* 消息内容 */}
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[15px] text-gray-900 truncate">{chat.name}</span>
                        <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] text-gray-500 truncate flex-1 pr-2">{chat.lastMessage}</p>
                        {(chat.unread ?? 0) > 0 && (
                          <span className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[11px] text-white flex items-center justify-center bg-red-500 flex-shrink-0 badge-pop">
                            {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="px-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        <div 
          className="glass-card rounded-[48px] shadow-lg"
          style={customIcons['main-bottombar-bg'] ? {
            backgroundImage: `url(${customIcons['main-bottombar-bg']})`,
            backgroundSize: `${bottombarScale}%`,
            backgroundPosition: `calc(50% + ${bottombarX}px) calc(50% + ${bottombarY}px)`
          } : {}}
        >
          <div className="grid grid-cols-4 h-14 px-2">
            <button className="flex flex-col items-center justify-center text-green-600 active:scale-95 transition-transform">
              {customIcons['nav-chat'] ? (
                <img src={customIcons['nav-chat']} alt="微信" className="w-10 h-10 mb-0.5 object-contain animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              )}
              <span className="text-xs font-medium">微信</span>
            </button>
            <button onClick={() => navigate('/contacts')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-contacts'] ? (
                <img src={customIcons['nav-contacts']} alt="通讯录" className="w-10 h-10 mb-0.5 object-contain animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
                </svg>
              )}
              <span className="text-xs">通讯录</span>
            </button>
            <button onClick={() => navigate('/discover')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-discover'] ? (
                <img src={customIcons['nav-discover']} alt="发现" className="w-10 h-10 mb-0.5 object-contain animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              )}
              <span className="text-xs">发现</span>
            </button>
            <button onClick={() => navigate('/me')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-me'] ? (
                <img src={customIcons['nav-me']} alt="我" className="w-10 h-10 mb-0.5 object-contain animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
              <span className="text-xs">我</span>
            </button>
          </div>
        </div>
      </div>

      {/* 添加角色弹窗 */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-[0_-4px_24px_rgba(148,163,184,0.2)] border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">添加角色</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {availableCharacters.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500 mb-4">暂无可添加的角色</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      navigate('/create-character')
                    }}
                    className="px-6 py-2 bg-green-500 text-white rounded-full active:scale-95 transition-transform"
                  >
                    创建新角色
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCharacters.map(character => (
                    <div
                      key={character.id}
                      onClick={() => handleAddCharacter(character.id)}
                      className="flex items-center p-4 bg-white rounded-xl cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(148,163,184,0.08)]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                        {character.avatar ? (
                          <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h3 className="font-medium text-gray-900">{character.nickname || character.realName}</h3>
                        {character.signature && (
                          <p className="text-sm text-gray-500 truncate">{character.signature}</p>
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

      {/* 创建群聊弹窗 */}
      {showGroupModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowGroupModal(false)
              setGroupName('')
              setGroupAvatar('')
              setSelectedMembers(new Set())
            }}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-[0_-4px_24px_rgba(148,163,184,0.2)] border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">创建群聊</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false)
                    setGroupName('')
                    setGroupAvatar('')
                    setSelectedMembers(new Set())
                  }}
                  className="text-gray-500"
                >
                  ✕
                </button>
              </div>

              {/* 群名称 */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">群名称</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="请输入群名称"
                  className="w-full px-3 py-2 bg-gray-100 rounded-lg focus:outline-none"
                />
              </div>

              {/* 群头像 */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">群头像（可选）</label>
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
                  className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => document.getElementById('group-avatar-upload')?.click()}
                >
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="群头像" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👥</span>
                  )}
                </div>
              </div>

              {/* 选择成员 */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">选择成员 ({selectedMembers.size})</label>
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
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                            {char.avatar && (
                              <img src={char.avatar} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-sm">{char.nickname || char.realName}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-gray-600 border-gray-600' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 创建按钮 */}
              <button
                onClick={() => {
                  if (!groupName.trim()) {
                    alert('请输入群名称')
                    return
                  }
                  if (selectedMembers.size < 2) {
                    alert('请至少选择2个成员')
                    return
                  }
                  // 获取成员名称
                  const userInfo = getUserInfo()
                  const userName = userInfo.nickname || userInfo.realName
                  const memberIds = ['user', ...Array.from(selectedMembers)]
                  const memberNames = memberIds.map(id => {
                    if (id === 'user') return userName
                    const char = availableCharacters.find(c => c.id === id)
                    return char?.nickname || char?.realName || '未知'
                  })
                  
                  const group = groupChatManager.createGroup(groupName, memberIds, userName, memberNames)
                  if (groupAvatar) {
                    groupChatManager.updateGroup(group.id, { avatar: groupAvatar })
                  }
                  setShowGroupModal(false)
                  setGroupName('')
                  setGroupAvatar('')
                  setSelectedMembers(new Set())
                  refreshChatList()
                  navigate(`/group/${group.id}`)
                }}
                disabled={!groupName.trim() || selectedMembers.size < 2}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  groupName.trim() && selectedMembers.size >= 2
                    ? 'bg-green-500 text-white active:scale-95'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                创建群聊
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatList
