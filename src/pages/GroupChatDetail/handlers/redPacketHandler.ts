/**
 * 红包指令处理器
 * 拆分自GroupChatDetail.tsx，保持代码整洁
 */

import { flushSync } from 'react-dom'
import type { GroupMessage } from '../../../utils/groupChatManager'

interface RedPacketHandlerContext {
  id: string
  member: { id: string; name: string }
  currentMessages: GroupMessage[]
  groupChatManager: any
  setMessages: (messages: GroupMessage[]) => void
  getMemberAvatar: (userId: string) => string
}

/**
 * 处理AI领取红包指令
 */
export function handleRedPacketClaim(
  content: string,
  context: RedPacketHandlerContext
): { newContent: string; hasCommand: boolean } {
  const { id, member, currentMessages, groupChatManager, setMessages, getMemberAvatar } = context
  
  if (!content.includes('[领取红包]')) {
    return { newContent: content, hasCommand: false }
  }
  
  console.log(`🧧 [AI指令] ${member.name} 领取红包`)
  
  // 查找可领取的红包（用户发的，还有剩余，且该成员未领取过）
  const availableRedPacket = currentMessages.find(msg => 
    (msg as any).messageType === 'redPacket' &&
    (msg as any).redPacket?.remainingCount > 0 &&
    msg.userId === 'user' &&
    !(msg as any).redPacket?.received?.some((r: any) => r.userId === member.id)
  )
  
  if (availableRedPacket) {
    const redPacket = (availableRedPacket as any).redPacket
    
    // 计算领取金额（手气红包算法）
    let amount = 0
    if (redPacket.remainingCount === 1) {
      amount = Math.round(redPacket.remaining * 100) / 100
    } else {
      const max = (redPacket.remaining / redPacket.remainingCount) * 2
      amount = Math.round(Math.random() * max * 100) / 100
      if (amount < 0.01) amount = 0.01
    }
    
    // 🔥 从数据库重新读取完整消息列表，确保不丢失系统消息
    const allMessages = groupChatManager.getMessages(id)
    
    // 更新红包状态
    const updatedRedPacket = {
      ...redPacket,
      remaining: Math.round((redPacket.remaining - amount) * 100) / 100,
      remainingCount: redPacket.remainingCount - 1,
      received: [
        ...redPacket.received,
        {
          userId: member.id,
          userName: member.name,
          userAvatar: getMemberAvatar(member.id),
          amount,
          timestamp: Date.now()
        }
      ]
    }
    
    const updatedMessages = allMessages.map((msg: GroupMessage) => 
      msg.id === availableRedPacket.id
        ? { ...msg, redPacket: updatedRedPacket }
        : msg
    )
    
    // 添加系统提示消息（显示金额）
    const systemMsg = groupChatManager.addMessage(id, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${member.name}领取了你的红包 ¥${amount.toFixed(2)}`,
      type: 'system',
      aiReadableContent: `[系统提示] ${member.name}领取了红包，获得¥${amount.toFixed(2)}。你可以对此做出反应。`
    })
    updatedMessages.push(systemMsg)
    
    // 更新数据库和本地数组
    groupChatManager.replaceAllMessages(id, updatedMessages as any)
    currentMessages.length = 0
    currentMessages.push(...updatedMessages)
    
    // 立即刷新UI
    flushSync(() => {
      setMessages([...currentMessages])
    })
    
    console.log(`✅ [红包] ${member.name} 已领取红包 ¥${amount.toFixed(2)}`)
  }
  
  // 从内容中移除指令部分
  const newContent = content.replace(/\[领取红包\]/, '').trim()
  return { newContent, hasCommand: true }
}
