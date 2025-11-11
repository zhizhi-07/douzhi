/**
 * 群聊详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import Avatar from '../components/Avatar'
import { generateGroupChatReply, type GroupMember } from '../utils/groupChatApi'
import { generateGroupChatSummary } from '../utils/groupChatSummary'
import { groupChatManager, type GroupMessage } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
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
  const isAIReplying = useRef(false)  // 标志位：AI是否正在回复中

  useEffect(() => {
    if (!id) return
    
    // 加载群聊信息
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
    }
    
    // 🔥 异步加载消息（等待IndexedDB加载完成）
    const loadMessages = async () => {
      // 先尝试同步获取（可能返回缓存或空数组）
      const msgs = groupChatManager.getMessages(id)
      setMessages(msgs)
      
      // 等待100ms让异步加载完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 再次获取（此时应该已经从IndexedDB加载完成）
      const updatedMsgs = groupChatManager.getMessages(id)
      if (updatedMsgs.length > 0 || msgs.length === 0) {
        setMessages(updatedMsgs)
        scrollToBottom()
      }
    }
    
    loadMessages()
    
    // 监听storage事件以更新消息
    const handleStorageChange = () => {
      // 🔥 AI回复期间不响应storage事件，避免消息一次性显示
      if (isAIReplying.current) {
        console.log('🚫 [storage事件] AI回复中，忽略storage事件')
        return
      }
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

  // 格式化文本段落
  const formatParagraphs = (text: string) => {
    // 将文本按换行符分割成段落
    const paragraphs = text.split('\n')
    
    return paragraphs.map((para, index) => {
      const trimmedPara = para.trim()
      // 跳过空段落
      if (!trimmedPara) {
        // 保留空行，但限制连续空行数量
        if (index > 0 && paragraphs[index - 1].trim() === '') {
          return null // 跳过连续的空行
        }
        return <br key={`br-${index}`} />
      }
      
      return (
        <span key={`para-${index}`}>
          {index > 0 && <br />}
          {trimmedPara}
        </span>
      )
    }).filter(Boolean)
  }

  // 渲染带@高亮的消息内容（优化段落显示）
  const renderMessageContent = (content: string) => {
    if (!id) return formatParagraphs(content)
    const group = groupChatManager.getGroup(id)
    if (!group) return formatParagraphs(content)

    // 先按段落分割
    const paragraphs = content.split('\n')
    
    return paragraphs.map((para, paraIndex) => {
      const trimmedPara = para.trim()
      
      // 处理空段落
      if (!trimmedPara) {
        if (paraIndex > 0 && paragraphs[paraIndex - 1].trim() === '') {
          return null
        }
        return <br key={`br-${paraIndex}`} />
      }
      
      // 对每个段落处理@提及
      const mentionRegex = /@([^\s@]+)/g
      const parts: (string | JSX.Element)[] = []
      let lastIndex = 0
      let match

      while ((match = mentionRegex.exec(trimmedPara)) !== null) {
        // 添加@之前的文本
        if (match.index > lastIndex) {
          parts.push(trimmedPara.substring(lastIndex, match.index))
        }

        // 添加@高亮
        const mentionedName = match[1]
        const isMentioned = group.memberIds.some(memberId => {
          const char = characterService.getById(memberId)
          return (char?.realName === mentionedName || char?.nickname === mentionedName)
        })
        
        if (isMentioned) {
          parts.push(
            <span key={`mention-${paraIndex}-${match.index}`} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">
              @{mentionedName}
            </span>
          )
        } else {
          parts.push(`@${mentionedName}`)
        }

        lastIndex = match.index + match[0].length
      }

      // 添加剩余文本
      if (lastIndex < trimmedPara.length) {
        parts.push(trimmedPara.substring(lastIndex))
      }

      return (
        <span key={`para-${paraIndex}`}>
          {paraIndex > 0 && <br />}
          {parts.length > 0 ? parts : trimmedPara}
        </span>
      )
    }).filter(Boolean)
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
    isAIReplying.current = true  // 🔥 设置AI回复标志
    console.log('🔒 [AI回复] 已设置isAIReplying标志，storage事件将被忽略')
    try {
      // 获取群聊信息
      const group = groupChatManager.getGroup(id)
      if (!group) return
      
      // 🔥 先从 groupChatManager 重新读取最新消息
      let latestMessages = groupChatManager.getMessages(id)
      
      // 🔥 删除上一轮的AI回复（重新生成）
      // 找到最后一条用户消息的索引
      const lastUserMessageIndex = latestMessages.map((m, i) => ({ m, i }))
        .reverse()
        .find(({ m }) => m.userId === 'user')?.i
      
      if (lastUserMessageIndex !== undefined) {
        // 删除这条用户消息之后的所有AI消息
        const messagesToDelete = latestMessages.slice(lastUserMessageIndex + 1)
          .filter(m => m.userId !== 'user')
        
        if (messagesToDelete.length > 0) {
          console.log(`🗑️ 删除上一轮的 ${messagesToDelete.length} 条AI消息`)
          
          // 从数组中移除这些消息
          latestMessages = latestMessages.slice(0, lastUserMessageIndex + 1)
          
          // 🔥 真正从 IndexedDB 删除（覆盖保存）
          groupChatManager.replaceAllMessages(id, latestMessages)
          
          // 更新UI
          setMessages(latestMessages)
          
          // 短暂延迟，确保删除操作完成
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      
      // 构建成员列表（包含角色和头衔）
      const members: GroupMember[] = group.memberIds.map(memberId => {
        const memberDetail = group.members?.find(m => m.id === memberId)
        
        if (memberId === 'user') {
          return {
            id: 'user',
            name: '用户',
            description: '',
            type: 'user',
            role: memberDetail?.role,
            title: memberDetail?.title
          }
        }
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char?.realName || char?.nickname || '未知',
          description: char?.personality || '',
          type: 'character',
          role: memberDetail?.role,
          title: memberDetail?.title
        }
      })
      
      // 构建消息历史（使用最新的消息列表）
      const chatMessages = latestMessages.map(msg => {
        // 如果是表情包消息，标注出来
        if (msg.type === 'emoji' || msg.emojiDescription || msg.emojiUrl) {
          const description = msg.emojiDescription || msg.content || '表情包'
          console.log(`📦 检测到表情包消息: ${msg.userName} - ${description} (type=${msg.type})`)
          return {
            userId: msg.userId,
            userName: msg.userName,
            content: `[发送了表情包：${description}]`,
            id: msg.id  // 包含消息ID用于引用
          }
        }
        return {
          userId: msg.userId,
          userName: msg.userName,
          content: msg.content,
          id: msg.id  // 包含消息ID用于引用
        }
      })
      
      console.log(`📝 传给AI的消息历史 (${chatMessages.length}条):`)
      chatMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.userName}: ${msg.content}`)
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
        if (lastUserMessage.type === 'emoji' || lastUserMessage.emojiDescription || lastUserMessage.emojiUrl) {
          const description = lastUserMessage.emojiDescription || lastUserMessage.content || '表情包'
          triggerEvent = `[发送了表情包：${description}]`
        } else {
          triggerEvent = lastUserMessage.content
        }
      }
      
      console.log(`📢 触发事件: ${triggerEvent}`)
      
      // 🔥 检查是否开启智能总结
      const smartSummaryEnabled = group.smartSummary?.enabled || false
      const oldSummaryStr = group.smartSummary?.lastSummary
      
      let parsedOldSummary = null
      let script = null
      
      if (smartSummaryEnabled && oldSummaryStr) {
        // 🎬 有旧总结：基于总结生成剧本（不显示总结）
        console.log('📊 [双AI架构] 有旧总结，基于总结生成剧本')
        
        try {
          parsedOldSummary = JSON.parse(oldSummaryStr)
        } catch (error) {
          console.error('解析旧总结失败:', error)
        }
        
        // 基于总结生成剧本
        script = await generateGroupChatReply(
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          parsedOldSummary || undefined
        )
      } else {
        // 🎬 无总结：正常生成剧本
        console.log('🎬 [正常模式] 生成剧本')
        script = await generateGroupChatReply(
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          undefined  // 不使用总结
        )
      }
      
      if (!script) {
        console.error('生成群聊回复失败')
        return
      }
      
      // 逐条添加AI回复（第一条立即显示，后续间隔1.5秒）
      console.log(`🎬 [AI回复] 开始添加${script.actions.length}条消息，延迟显示`)
      
      for (let i = 0; i < script.actions.length; i++) {
        const action = script.actions[i]
        
        // 第一条消息立即显示，后续消息延迟1.5秒
        if (i > 0) {
          console.log(`⏰ [AI回复] 等待1.5秒后显示第${i + 1}条消息...`)
          await new Promise(resolve => setTimeout(resolve, 1500))
          console.log(`✅ [AI回复] 延迟结束，现在显示第${i + 1}条消息`)
        } else {
          console.log(`⚡ [AI回复] 立即显示第1条消息`)
        }
        
        // 查找成员
        const member = members.find(m => m.name === action.actorName && m.type === 'character')
        if (!member) {
          console.warn('找不到成员:', action.actorName)
          continue
        }
        
        // 查找引用的消息
        let quotedMsg = undefined
        if (action.quotedMessageId) {
          const quoted = latestMessages.find(m => m.id === action.quotedMessageId)
          if (quoted) {
            quotedMsg = {
              id: quoted.id,
              content: quoted.content,
              userName: quoted.userName
            }
            console.log(`引用了消息: ${quoted.userName} - ${quoted.content}`)
          }
        }
        
        // 🔥 检查是否包含特殊指令，支持"台词+指令"组合
        let content = action.content || ''
        let hasCommand = false
        
        // 检查撤回指令：[撤回:msg_xxx]
        const recallMatch = content.match(/\[撤回:(msg_\w+)\]/)
        if (recallMatch) {
          const targetMsgId = recallMatch[1]
          console.log(`🗑️ [AI指令] ${member.name} 撤回消息: ${targetMsgId}`)
          groupChatManager.recallMessage(id, targetMsgId)
          
          // 从内容中移除指令部分
          content = content.replace(/\[撤回:msg_\w+\]/, '').trim()
          hasCommand = true
        }
        
        // 检查踢出指令：[踢出:成员名]
        const kickMatch = content.match(/\[踢出:(.+?)\]/)
        if (kickMatch) {
          const targetName = kickMatch[1]
          console.log(`👢 [AI指令] ${member.name} 踢出成员: ${targetName}`)
          
          // 查找目标成员
          const targetMember = members.find(m => m.name === targetName)
          if (targetMember && targetMember.type === 'character') {
            groupChatManager.removeMember(id, targetMember.id, true, member.name)
          } else {
            console.warn('找不到目标成员或无法踢出:', targetName)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[踢出:.+?\]/, '').trim()
          hasCommand = true
        }
        
        // 检查群公告指令：[群公告:内容]
        const announcementMatch = content.match(/\[群公告:(.+?)\]/)
        if (announcementMatch) {
          const newAnnouncement = announcementMatch[1]
          console.log(`📢 [AI指令] ${member.name} 修改群公告: ${newAnnouncement}`)
          groupChatManager.updateAnnouncement(id, newAnnouncement, member.name)
          
          // 从内容中移除指令部分
          content = content.replace(/\[群公告:.+?\]/, '').trim()
          hasCommand = true
        }
        
        // 如果有指令且没有剩余文本，刷新消息列表后继续
        if (hasCommand) {
          const updatedMsgs = groupChatManager.getMessages(id)
          setMessages(updatedMsgs)
          
          // 如果没有剩余文本，跳过添加消息
          if (!content) {
            continue
          }
        }
        
        // 🔥 先添加消息到存储，获取完整的消息对象
        let newMessage
        
        // 检查是否是表情包消息
        if (action.emojiIndex && emojis.length > 0) {
          const emoji = emojis[action.emojiIndex - 1] // 编号从1开始，数组从0开始
          if (emoji) {
            // 发送表情包消息（带引用）
            newMessage = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: emoji.description,
              type: 'emoji',
              emojiUrl: emoji.url,
              emojiDescription: emoji.description,
              quotedMessage: quotedMsg
            })
          } else {
            console.warn('表情包编号超出范围:', action.emojiIndex)
            // 降级为文本消息
            newMessage = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: content,  // 使用处理后的content
              type: 'text',
              quotedMessage: quotedMsg
            })
          }
        } else {
          // 普通文本消息（带引用）
          newMessage = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: content,  // 使用处理后的content
            type: 'text',
            quotedMessage: quotedMsg
          })
        }
        
        // 🔥 只添加新消息到React状态，而不是重新读取所有消息
        console.log(`📨 [AI回复] 第${i + 1}条消息已添加到UI: ${action.actorName} - ${action.content?.substring(0, 20)}`)
        setMessages(prev => {
          const updated = [...prev, newMessage]
          console.log(`📊 [AI回复] 当前UI显示消息总数: ${updated.length}`)
          return updated
        })
        setTimeout(scrollToBottom, 100)
      }
      
      // 🔥 AI回复完成后，后台生成/更新总结（如果开启了智能总结）
      if (smartSummaryEnabled) {
        const currentMessages = groupChatManager.getMessages(id)
        // 统计用户发的消息数量（按轮数计算）
        const userMessageCount = currentMessages.filter(m => m.userId === 'user').length
        const lastSummaryUserMessageCount = group.smartSummary?.lastSummaryUserMessageCount || 0
        const triggerInterval = group.smartSummary?.triggerInterval || 10
        
        // 检查是否达到触发间隔（按轮数）
        const shouldTrigger = (userMessageCount - lastSummaryUserMessageCount) >= triggerInterval
        
        if (shouldTrigger) {
          console.log(`📊 [后台任务] 已达到触发间隔(${triggerInterval}轮)，开始生成/更新总结...`)
          
          // 获取上次总结（如果有）
          let lastSummary = undefined
          if (group.smartSummary?.lastSummary) {
            try {
              lastSummary = JSON.parse(group.smartSummary.lastSummary)
            } catch (e) {
              console.warn('📊 解析上次总结失败，将进行全量总结')
            }
          }
          
          // 获取新消息（从上次总结后的消息）
          const messagesToSummarize = lastSummary 
            ? currentMessages.slice(-(userMessageCount - lastSummaryUserMessageCount) * 2) // 用户消息+AI回复
            : currentMessages  // 第一次总结，使用全部消息
          
          console.log(`📊 本次总结消息数: ${messagesToSummarize.length} (总共${currentMessages.length}条)`)
          
          // 异步执行，不阻塞UI
          generateGroupChatSummary(
            group.name,
            members,
            messagesToSummarize,
            lastSummary  // 传入上次总结
          ).then(newSummary => {
            if (newSummary && id) {
              console.log('📊 [后台任务] 总结生成成功，保存到群聊数据')
              const updatedGroup = groupChatManager.getGroup(id)
              groupChatManager.updateGroup(id, {
                smartSummary: {
                  ...updatedGroup?.smartSummary,
                  enabled: true,
                  triggerInterval: triggerInterval,
                  lastSummary: JSON.stringify(newSummary),
                  lastSummaryTime: new Date().toISOString(),
                  lastSummaryUserMessageCount: userMessageCount
                }
              })
            }
          }).catch(error => {
            console.error('📊 [后台任务] 总结生成失败:', error)
          })
        } else {
          console.log(`📊 [后台任务] 未达到触发间隔(当前${userMessageCount - lastSummaryUserMessageCount}/${triggerInterval}轮)，跳过总结`)
        }
      }
    } catch (error) {
      console.error('✅ AI回复失败:', error)
    } finally {
      setIsAiTyping(false)
      isAIReplying.current = false  // 🔥 清除AI回复标志
      console.log('🔓 [AI回复] 已清除isAIReplying标志，storage事件恢复响应')
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
          messages.map((msg, index) => {
            // 判断是否显示时间戳（固定5分钟时间刻度）
            const prevMsg = messages[index - 1]
            let shouldShowTimestamp = false
            
            if (index === 0) {
              shouldShowTimestamp = true
            } else if (msg.timestamp && prevMsg?.timestamp) {
              // 计算当前消息和上一条消息所在的5分钟时间段（向下取整）
              const current5MinSlot = Math.floor(msg.timestamp / (5 * 60 * 1000))
              const prev5MinSlot = Math.floor(prevMsg.timestamp / (5 * 60 * 1000))
              // 如果跨越了5分钟时间段，显示时间戳
              shouldShowTimestamp = current5MinSlot !== prev5MinSlot
            }
            
            // 系统消息（撤回）
            if (msg.type === 'system' || msg.isRecalled) {
              return (
                <div key={msg.id}>
                  {shouldShowTimestamp && msg.timestamp && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(msg.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-gray-400">{msg.content}</span>
                  </div>
                </div>
              )
            }

            const isSent = msg.userId === 'user'
            const avatar = msg.userAvatar || getMemberAvatar(msg.userId)
            const char = msg.userId !== 'user' ? characterService.getById(msg.userId) : null
            
            return (
              <div key={msg.id}>
                {/* 时间戳 */}
                {shouldShowTimestamp && msg.timestamp && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(msg.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                <div className={`message-container flex items-start gap-1.5 my-1 ${
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
                    className="cursor-pointer"
                  >
                    {/* 表情包消息 - 单独处理 */}
                    {msg.type === 'emoji' && msg.emojiUrl ? (
                      <div>
                        {/* 引用消息显示（在表情包上方）*/}
                        {msg.quotedMessage && (
                          <div className="mb-2 pb-2 px-2 bg-white/80 rounded-lg">
                            <div className="text-[11px] text-gray-500">
                              {msg.quotedMessage.userName}:
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {msg.quotedMessage.content}
                            </div>
                          </div>
                        )}
                        <img
                          src={msg.emojiUrl}
                          alt={msg.emojiDescription || msg.content}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      /* 文本消息 */
                      <div className={`message-bubble px-3 py-2 rounded-2xl break-words ${
                        isSent 
                          ? 'bg-[#95ec69] text-gray-900' 
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}>
                        {/* 引用消息显示 - 🎨 统一灰色背景 */}
                        {msg.quotedMessage && (
                          <div className="mb-2 pb-2 px-2 py-1.5 -mx-1 -mt-1 rounded-t-xl border-b bg-gray-50 border-gray-200">
                            <div className="text-[11px] text-gray-500">
                              {msg.quotedMessage.userName}:
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {msg.quotedMessage.content}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {renderMessageContent(msg.content)}
                        </p>
                      </div>
                    )}
                  </div>
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
