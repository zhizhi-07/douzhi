/**
 * 群聊详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import Avatar from '../components/Avatar'
import { groupChatManager } from '../utils/groupChatManager'
import type { GroupMessage } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
import { generateGroupChatReply, GroupMember } from '../utils/groupChatApi'
import EmojiPanel from '../components/EmojiPanel'
import type { Emoji } from '../utils/emojiStorage'
import { getEmojis } from '../utils/emojiStorage'

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') return ''
  const char = characterService.getById(userId)
  return char?.avatar || ''
}

// ... (rest of the code remains the same)

const GroupChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [groupName, setGroupName] = useState('')
  const [inputText, setInputText] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [quotedMessage, setQuotedMessage] = useState<GroupMessage | null>(null)
  const [longPressMessage, setLongPressMessage] = useState<GroupMessage | null>(null)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    
    // 加载群聊信息
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
    }
    
    // 加载消息
    const msgs = groupChatManager.getMessages(id)
    setMessages(msgs)
    scrollToBottom()
    
    // 监听storage事件以更新消息
    const handleStorageChange = () => {
      const updatedMsgs = groupChatManager.getMessages(id)
      setMessages(updatedMsgs)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 处理输入框变化（检测@）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputText(value)
    
    const position = e.target.selectionStart || 0
    setCursorPosition(position)
    
    // 检查是否输入了@
    const textBeforeCursor = value.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // 如果@后面没有空格，显示成员列表
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt)
        setShowMentionList(true)
        return
      }
    }
    
    setShowMentionList(false)
  }

  // 选择@的成员
  const handleSelectMention = (memberName: string) => {
    const textBeforeCursor = inputText.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = inputText.substring(0, lastAtIndex)
      const afterCursor = inputText.substring(cursorPosition)
      const newValue = `${beforeAt}@${memberName} ${afterCursor}`
      
      setInputText(newValue)
      setShowMentionList(false)
      
      // 聚焦输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = lastAtIndex + memberName.length + 2
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // 获取过滤后的成员列表
  const getFilteredMembers = () => {
    if (!id) return []
    const group = groupChatManager.getGroup(id)
    if (!group) return []
    
    // 过滤掉用户自己，只显示AI成员
    const aiMembers = group.memberIds
      .filter(memberId => memberId !== 'user')
      .map(memberId => {
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char?.realName || char?.nickname || '未知',
        }
      })
      .filter(member => 
        member.name.toLowerCase().includes(mentionSearch.toLowerCase())
      )
    
    return aiMembers
  }

  // 渲染带@高亮的消息内容
  const renderMessageContent = (content: string) => {
    if (!id) return content
    const group = groupChatManager.getGroup(id)
    if (!group) return content

    // 匹配@某人的模式
    const mentionRegex = /@([^\s@]+)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // 添加@之前的文本
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      // 添加@高亮
      const mentionedName = match[1]
      const isMentioned = group.memberIds.some(memberId => {
        const char = characterService.getById(memberId)
        return (char?.realName === mentionedName || char?.nickname === mentionedName)
      })
      
      if (isMentioned) {
        parts.push(
          <span key={match.index} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">
            @{mentionedName}
          </span>
        )
      } else {
        parts.push(`@${mentionedName}`)
      }

      lastIndex = match.index + match[0].length
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  // 长按消息（撤回）
  const handleLongPressStart = (message: GroupMessage) => {
    // 只有用户自己的消息可以撤回
    if (message.userId !== 'user') return
    if (message.isRecalled) return
    
    longPressTimer.current = window.setTimeout(() => {
      setLongPressMessage(message)
    }, 500) // 长按500ms
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 撤回消息
  const handleRecallMessage = () => {
    if (!longPressMessage || !id) return
    
    groupChatManager.recallMessage(id, longPressMessage.id)
    setLongPressMessage(null)
    
    // 更新本地消息列表
    const updatedMsgs = groupChatManager.getMessages(id)
    setMessages(updatedMsgs)
  }

  // 发送表情包
  const handleSelectEmoji = (emoji: Emoji) => {
    if (!id) return

    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: emoji.description,
      type: 'emoji',
      timestamp: Date.now(),
      emojiUrl: emoji.url,
      emojiDescription: emoji.description
    })

    // 🔥 立即刷新消息列表
    const updatedMsgs = groupChatManager.getMessages(id)
    setMessages(updatedMsgs)
    
    setTimeout(scrollToBottom, 100)
  }

  // AI主动回复（用户不发消息，只触发AI聊天）
  const handleAIReply = async () => {
    if (!id || isAiTyping) return
    
    setIsAiTyping(true)
    try {
      // 获取群聊信息
      const group = groupChatManager.getGroup(id)
      if (!group) return
      
      // 🔥 先从 groupChatManager 重新读取最新消息（确保AI能看到用户刚发的消息）
      const latestMessages = groupChatManager.getMessages(id)
      
      // 构建成员列表
      const members: GroupMember[] = group.memberIds.map(memberId => {
        if (memberId === 'user') {
          return {
            id: 'user',
            name: '用户',
            description: '',
            type: 'user'
          }
        }
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char?.realName || char?.nickname || '未知',
          description: char?.personality || '',
          type: 'character'
        }
      })
      
      // 构建消息历史（使用最新的消息列表）
      const chatMessages = latestMessages.map(msg => {
        // 如果是表情包消息，标注出来
        if (msg.type === 'emoji' && msg.emojiDescription) {
          return {
            userId: msg.userId,
            userName: msg.userName,
            content: `[发送了表情包：${msg.emojiDescription}]`
          }
        }
        return {
          userId: msg.userId,
          userName: msg.userName,
          content: msg.content
        }
      })
      
      // 🎨 加载表情包列表
      const emojis = await getEmojis()
      console.log(`📦 加载了 ${emojis.length} 个表情包`)
      
      // 🔥 获取最后一条用户消息作为触发事件
      const lastUserMessage = latestMessages
        .slice()
        .reverse()
        .find(msg => msg.userId === 'user')
      
      let triggerEvent = '（群里有点安静，AI们可以主动聊天）'
      if (lastUserMessage) {
        // 如果是表情包消息，标注出来
        if (lastUserMessage.type === 'emoji' && lastUserMessage.emojiDescription) {
          triggerEvent = `[发送了表情包：${lastUserMessage.emojiDescription}]`
        } else {
          triggerEvent = lastUserMessage.content
        }
      }
      
      console.log(`📢 触发事件: ${triggerEvent}`)
      
      // 调用AI生成回复
      const script = await generateGroupChatReply(
        group.name,
        members,
        chatMessages,
        triggerEvent,
        emojis
      )
      
      if (!script) {
        console.error('❌ 生成群聊回复失败')
        return
      }
      
      // 逐条添加AI回复（间隔2秒）
      for (const action of script.actions) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 查找成员
        const member = members.find(m => m.name === action.actorName && m.type === 'character')
        if (!member) {
          console.warn('⚠️ 找不到成员:', action.actorName)
          continue
        }
        
        // 检查是否是表情包消息
        if (action.emojiIndex && emojis.length > 0) {
          const emoji = emojis[action.emojiIndex - 1] // 编号从1开始，数组从0开始
          if (emoji) {
            // 发送表情包消息
            groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: emoji.description,
              type: 'emoji',
              emojiUrl: emoji.url,
              emojiDescription: emoji.description
            })
          } else {
            console.warn('⚠️ 表情包编号超出范围:', action.emojiIndex)
            // 降级为文本消息
            groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: action.content,
              type: 'text'
            })
          }
        } else {
          // 普通文本消息
          groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: action.content,
            type: 'text'
          })
        }
        
        // 🔥 立即刷新消息列表
        const updatedMsgs = groupChatManager.getMessages(id)
        setMessages(updatedMsgs)
        
        setTimeout(scrollToBottom, 100)
      }
    } catch (error) {
      console.error('❌ AI回复失败:', error)
    } finally {
      setIsAiTyping(false)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || !id || isAiTyping) return
    
    const userMessage = inputText
    
    // 发送消息（带引用）
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: userMessage,
      type: 'text',
      timestamp: Date.now(),
      quotedMessage: quotedMessage ? {
        id: quotedMessage.id,
        content: quotedMessage.content,
        userName: quotedMessage.userName
      } : undefined
    })
    
    // 🔥 立即刷新消息列表，确保UI显示最新消息
    const updatedMsgs = groupChatManager.getMessages(id)
    setMessages(updatedMsgs)
    
    setInputText('')
    setQuotedMessage(null)  // 清除引用
    setTimeout(scrollToBottom, 100)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/wechat')}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">{groupName}</h1>
          <button 
            onClick={() => navigate(`/group/${id}/settings`)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无消息
          </div>
        ) : (
          messages.map((msg) => {
            // 系统消息（撤回）
            if (msg.type === 'system' || msg.isRecalled) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-xs text-gray-400">{msg.content}</span>
                </div>
              )
            }

            const isSent = msg.userId === 'user'
            const avatar = msg.userAvatar || getMemberAvatar(msg.userId)
            const char = msg.userId !== 'user' ? characterService.getById(msg.userId) : null
            
            return (
              <div key={msg.id} className={`message-container flex items-start gap-1.5 my-1 ${
                isSent ? 'sent flex-row-reverse' : 'received flex-row'
              }`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar 
                    type={isSent ? 'sent' : 'received'}
                    avatar={isSent ? undefined : avatar}
                    name={isSent ? '我' : (char?.realName || msg.userName)}
                  />
                </div>
                
                <div className={`flex flex-col max-w-[70%] ${
                  isSent ? 'items-end' : 'items-start'
                }`}>
                  {!isSent && (
                    <div className="text-xs text-gray-500 mb-1 px-1">{msg.userName}</div>
                  )}
                  <div
                    onClick={() => {
                      // 点击消息可以引用（非系统消息）
                      if (!msg.isRecalled) {
                        setQuotedMessage(msg)
                        inputRef.current?.focus()
                      }
                    }}
                    onTouchStart={() => handleLongPressStart(msg)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={() => handleLongPressStart(msg)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    className={`cursor-pointer ${
                      msg.type === 'emoji' 
                        ? '' // 表情包消息无背景
                        : `message-bubble px-3 py-2 rounded-2xl break-words ${
                            isSent 
                              ? 'bg-[#95ec69] text-gray-900' 
                              : 'bg-white text-gray-900 shadow-sm'
                          }`
                    }`}
                  >
                    {/* 引用消息显示 */}
                    {msg.quotedMessage && (
                      <div className={`mb-2 pb-2 border-b ${isSent ? 'border-gray-700/20' : 'border-gray-200'}`}>
                        <div className={`text-[11px] ${isSent ? 'text-gray-700' : 'text-gray-500'}`}>
                          {msg.quotedMessage.userName}:
                        </div>
                        <div className={`text-xs ${isSent ? 'text-gray-800' : 'text-gray-600'} truncate`}>
                          {msg.quotedMessage.content}
                        </div>
                      </div>
                    )}
                    
                    {/* 表情包消息 */}
                    {msg.type === 'emoji' && msg.emojiUrl ? (
                      <img
                        src={msg.emojiUrl}
                        alt={msg.emojiDescription || msg.content}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {renderMessageContent(msg.content)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {/* AI正在输入提示 */}
        {isAiTyping && (
          <div className="flex items-center gap-2 my-2 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs">🤖</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入栏 */}
      <div className="bg-[#f5f7fa] border-t border-gray-200/50">
        {/* 引用消息显示区域 */}
        {quotedMessage && (
          <div className="px-4 pt-3 pb-1">
            <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 mb-0.5">
                  {quotedMessage.userName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {quotedMessage.content}
                </div>
              </div>
              <button
                onClick={() => setQuotedMessage(null)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* @成员列表 */}
        {showMentionList && (
          <div className="px-4 pb-2 max-h-40 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {getFilteredMembers().map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMention(member.name)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0 border-gray-100"
                >
                  <span className="text-sm text-gray-900">{member.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="px-2 py-2 flex items-center gap-1">
          <button 
            onClick={() => alert('功能开发中：图片、语音、位置等')}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm touch-transition focus-within:shadow-md focus-within:scale-[1.01] min-w-0 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && !isAiTyping && handleSend()}
              placeholder={isAiTyping ? 'AI正在回复...' : '发送消息'}
              disabled={isAiTyping}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-w-0 disabled:opacity-50"
            />
          </div>
          <button 
            onClick={() => setShowEmojiPanel(true)}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {inputText.trim() ? (
            <button
              onClick={handleSend}
              disabled={isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg ios-spring btn-press-fast flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={handleAIReply}
              disabled={isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="触发AI回复"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 撤回消息确认对话框 */}
      {longPressMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setLongPressMessage(null)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认撤回</h3>
            <p className="text-sm text-gray-600 mb-6">确定要撤回这条消息吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLongPressMessage(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRecallMessage}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                撤回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 表情包面板 */}
      <EmojiPanel
        show={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelect={handleSelectEmoji}
      />
    </div>
  )
}

export default GroupChatDetail
