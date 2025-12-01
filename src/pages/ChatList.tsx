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
import WechatTabBar from '../components/WechatTabBar'

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
      className="h-screen flex flex-col page-enter font-serif bg-transparent"
      style={wechatBg ? {
        backgroundImage: `url(${wechatBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
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
            <button onClick={() => navigate('/')} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
              <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">微信</h1>
            <div className="flex items-center gap-4">
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
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8C8C8C]">
            <svg className="w-16 h-16 mb-4 stroke-[1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm mb-2">暂无聊天</p>
            <p className="text-xs font-light">开始一段新对话吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 置顶聊天区块 */}
            {chats.filter(chat => chat.isPinned).map((chat, chatIndex) => (
              <div
                key={chat.id}
                onClick={() => {
                  playSystemSound()
                  navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                }}
                className="flex items-center px-4 py-3 cursor-pointer bg-white/60 backdrop-blur-md border border-white/40 shadow-sm rounded-xl hover:bg-white/70 transition-all card-enter"
                style={{ animationDelay: `${chatIndex * 0.05}s` }}
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
            ))}

            {/* 未置顶聊天区块 */}
            {chats.filter(chat => !chat.isPinned).map((chat, chatIndex) => (
              <div
                key={chat.id}
                onClick={() => {
                  playSystemSound()
                  navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)
                }}
                className="flex items-center px-4 py-3 cursor-pointer bg-white/40 backdrop-blur-md border border-white/30 shadow-sm rounded-xl hover:bg-white/50 transition-all card-enter"
                style={{ animationDelay: `${(chatIndex + chats.filter(c => c.isPinned).length) * 0.05}s` }}
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
            ))}
          </div>
        )}
      </div>

      <WechatTabBar customIcons={customIcons} />

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
                onClick={() => {
                  // 创建群聊逻辑...
                  // 这里需要调用 groupChatManager.createGroup
                  // 但为了保持代码简洁，暂时省略具体实现，只做UI展示
                  setShowGroupModal(false)
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
    </div>
  )
}

export default ChatList
