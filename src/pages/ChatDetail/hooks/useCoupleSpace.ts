/**
 * 情侣空间相关逻辑
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Message, Character } from '../../../types/chat'
import { 
  getCoupleSpaceRelation, 
  acceptCoupleSpaceInvite, 
  rejectCoupleSpaceInvite, 
  createCoupleSpaceInvite 
} from '../../../utils/coupleSpaceUtils'
import { addCouplePhoto, addCoupleMessage, addCoupleAnniversary } from '../../../utils/coupleSpaceContentUtils'
import { addMessage as saveMessage } from '../../../utils/simpleMessageManager'

export const useCoupleSpace = (
  chatId: string | undefined,
  character: Character | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [inputType, setInputType] = useState<'photo' | 'message' | 'anniversary' | null>(null)

  // 打开快捷菜单
  const openMenu = () => {
    if (!chatId || !character) return

    const relation = getCoupleSpaceRelation()
    
    // 🔥 调试信息
    console.log('💕 [情侣空间] openMenu被调用', {
      chatId,
      relation,
      sender: relation?.sender
    })
    
    // 如果已经是活跃状态，显示快捷菜单
    if (relation?.status === 'active' && relation.characterId === chatId) {
      setShowMenu(true)
      return
    }

    // 如果有待处理的邀请
    if (relation?.status === 'pending') {
      if (relation.characterId === chatId) {
        if (relation.sender === 'character') {
          // AI发起的邀请，询问用户是否要清除并发起新邀请
          const clearAndSend = confirm('对方之前向你发起过情侣空间邀请。\n\n点击"确定"清除旧邀请并发起新邀请\n点击"取消"保留现状')
          if (!clearAndSend) return
          // 清除旧邀请
          localStorage.removeItem('couple_space_relation')
          console.log('💕 [情侣空间] 清除了AI发起的旧邀请，准备发起新邀请')
        } else {
          // 用户之前发起的邀请还在等待
          alert('已经发送过邀请了，等待对方回应')
          return
        }
      } else {
        // 与其他角色有pending邀请，询问是否覆盖
        const override = confirm(`你与${relation.characterName}有未处理的情侣空间邀请。\n\n点击"确定"清除并向当前角色发起新邀请`)
        if (!override) return
        localStorage.removeItem('couple_space_relation')
        console.log('💕 [情侣空间] 清除了与其他角色的邀请，准备发起新邀请')
      }
    }

    // 创建邀请
    const inviteResult = createCoupleSpaceInvite(
      'user',
      chatId,
      character.nickname || character.realName,
      character.avatar,
      'user'  // 用户发起的邀请
    )

    if (!inviteResult) {
      alert('创建邀请失败')
      return
    }

    // 发送邀请卡片
    const newMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: '情侣空间邀请',
      aiReadableContent: `[系统消息] 用户向你发送了情侣空间邀请，等待你回应。你可以用 [同意情侣空间] 接受，或用 [拒绝情侣空间] 拒绝。`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      coupleSpaceInvite: {
        status: 'pending',
        senderName: '我',
        senderAvatar: undefined
      }
    }
    // 🔥 修复：保存到存储，避免退出窗口后消息丢失
    saveMessage(chatId, newMessage)
    setMessages(prev => [...prev, newMessage])
  }

  // 接受邀请
  const acceptInvite = (messageId: number) => {
    console.log('💕 [情侣空间] 用户点击接受邀请，messageId:', messageId, 'chatId:', chatId)
    if (!chatId) {
      console.error('❌ [情侣空间] chatId为空')
      return
    }

    const success = acceptCoupleSpaceInvite(chatId)
    console.log('💕 [情侣空间] acceptCoupleSpaceInvite结果:', success)

    if (success) {
      // 🔥 修复：更新消息状态并保存
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === messageId && msg.coupleSpaceInvite
            ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'accepted' as const } }
            : msg
        )
        // 保存更新后的消息列表
        const updatedMsg = updated.find(m => m.id === messageId)
        if (updatedMsg) {
          saveMessage(chatId, updatedMsg)
        }
        return updated
      })

      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: '你接受了情侣空间邀请',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      setMessages(prev => [...prev, systemMsg])
      console.log('✅ [情侣空间] 接受成功')
    } else {
      console.error('❌ [情侣空间] 接受失败')
    }
  }

  // 拒绝邀请
  const rejectInvite = (messageId: number) => {
    console.log('💔 [情侣空间] 用户点击拒绝邀请，messageId:', messageId, 'chatId:', chatId)
    if (!chatId) {
      console.error('❌ [情侣空间] chatId为空')
      return
    }

    const success = rejectCoupleSpaceInvite(chatId)
    console.log('💔 [情侣空间] rejectCoupleSpaceInvite结果:', success)

    if (success) {
      // 🔥 修复：更新消息状态并保存
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === messageId && msg.coupleSpaceInvite
            ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'rejected' as const } }
            : msg
        )
        // 保存更新后的消息列表
        const updatedMsg = updated.find(m => m.id === messageId)
        if (updatedMsg) {
          saveMessage(chatId, updatedMsg)
        }
        return updated
      })

      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: '你拒绝了情侣空间邀请',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      setMessages(prev => [...prev, systemMsg])
      console.log('✅ [情侣空间] 拒绝成功')
    } else {
      console.error('❌ [情侣空间] 拒绝失败')
    }
  }

  // 提交内容
  const submitContent = async (content: string, data?: { date?: string, title?: string }) => {
    if (!chatId || !character) return

    if (inputType === 'photo') {
      try {
        await addCouplePhoto(chatId, '我', content)
        const systemMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: `你在情侣空间相册分享了照片`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        saveMessage(chatId, systemMsg)
        setMessages(prev => [...prev, systemMsg])
      } catch (error) {
        console.error('❌ 保存照片失败:', error)
        alert(error instanceof Error ? error.message : '保存失败，请重试')
      }
    } else if (inputType === 'message') {
      addCoupleMessage(chatId, '我', content)
      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: `你在情侣空间留言板留言：${content}`,
        aiReadableContent: `用户在情侣空间留言板留言：${content}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      saveMessage(chatId, systemMsg)
      setMessages(prev => [...prev, systemMsg])
    } else if (inputType === 'anniversary' && data?.date && data?.title) {
      addCoupleAnniversary(chatId, character.nickname || character.realName, data.date, data.title, content || undefined)
      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: `你添加了纪念日：${data.title}（${data.date}）`,
        aiReadableContent: `用户添加了一个纪念日：${data.title}，日期是${data.date}${content ? `，备注：${content}` : ''}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      saveMessage(chatId, systemMsg)
      setMessages(prev => [...prev, systemMsg])
    }
  }

  // 检查是否有激活的情侣空间
  const relation = getCoupleSpaceRelation()
  const hasCoupleSpace = relation?.status === 'active' && relation.characterId === chatId

  return {
    showMenu,
    setShowMenu,
    showInput,
    setShowInput,
    inputType,
    setInputType,
    openMenu,
    acceptInvite,
    rejectInvite,
    submitContent,
    navigate,
    hasCoupleSpace
  }
}
