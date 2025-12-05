import { useState, useCallback } from 'react'
import { Message } from '../../../types/chat'
import { saveMessages } from '../../../utils/simpleMessageManager'
import { getIntimatePayRelations, type IntimatePayRelation } from '../../../utils/walletUtils'
import { getUserInfo } from '../../../utils/userUtils'

/**
 * 代付功能 Hook
 */
export const usePaymentRequest = (
  chatId: string,
  characterId: string,
  characterName: string,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showPaymentRequestSender, setShowPaymentRequestSender] = useState(false)

  /**
   * 检查是否有可用的亲密付
   */
  const hasIntimatePay = useCallback(() => {
    const relations = getIntimatePayRelations()
    const relation = relations.find((r: IntimatePayRelation) => 
      r.characterId === characterId && 
      r.type === 'character_to_user' &&
      r.usedAmount < r.monthlyLimit
    )
    return !!relation
  }, [characterId])

  /**
   * 发送代付请求
   */
  const sendPaymentRequest = useCallback((
    itemName: string,
    amount: number,
    note: string,
    paymentMethod: 'ai' | 'self' | 'intimate'
  ) => {
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName || '用户'

    // 根据支付方式决定消息类型和状态
    let messageType: Message['type'] = 'sent'
    let status: 'pending' | 'paid' | 'rejected' = 'pending'
    let systemMessage: Message | null = null

    // 自己支付：直接完成，生成系统消息
    if (paymentMethod === 'self') {
      status = 'paid'
      
      // 扣除用户钱包（这里只是记录，实际钱包逻辑可以后续完善）
      console.log(`💰 [代付] 用户自己支付 ¥${amount}`)
      
      systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `你使用自己的钱购买了 ${itemName} ¥${amount.toFixed(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now() + 1,
        messageType: 'system'
      }
    }

    // 亲密付：直接完成，生成系统消息
    if (paymentMethod === 'intimate') {
      const relations = getIntimatePayRelations()
      const relation = relations.find((r: IntimatePayRelation) => 
        r.characterId === characterId && 
        r.type === 'character_to_user'
      )

      if (!relation) {
        alert('未开通亲密付')
        return
      }

      const remaining = relation.monthlyLimit - relation.usedAmount
      if (remaining < amount) {
        alert(`亲密付余额不足，剩余 ¥${remaining.toFixed(2)}`)
        return
      }

      status = 'paid'

      // 扣除亲密付额度
      relation.usedAmount += amount
      localStorage.setItem('intimate_pay_relations', JSON.stringify(relations))
      console.log(`💳 [代付] 使用亲密付支付 ¥${amount}，剩余额度 ¥${(relation.monthlyLimit - relation.usedAmount).toFixed(2)}`)

      systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `你使用了 ${characterName} 的亲密付购买 ${itemName} ¥${amount.toFixed(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now() + 1,
        messageType: 'system'
      }
    }

    // 创建代付消息
    const paymentMessage: Message = {
      id: Date.now(),
      type: messageType,
      content: `[代付] ${itemName} ¥${amount.toFixed(2)}`,
      aiReadableContent: `[用户发起代付请求] 商品：${itemName}，金额：¥${amount.toFixed(2)}${note ? `，备注：${note}` : ''}，支付方式：${
        paymentMethod === 'ai' ? 'AI代付（需要你确认，15分钟内有效，过期后会自动失效）' :
        paymentMethod === 'self' ? '用户自己支付（已完成）' :
        '亲密付（已完成）'
      }`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'paymentRequest',
      paymentRequest: {
        itemName,
        amount,
        note: note || undefined,
        paymentMethod,
        status,
        requesterId: 'user',
        requesterName: userName,
        payerId: paymentMethod === 'ai' ? characterId : undefined,
        payerName: paymentMethod === 'ai' ? characterName : paymentMethod === 'intimate' ? characterName : undefined
      }
    }

    // 更新消息列表
    setMessages(prev => {
      const newMessages = systemMessage 
        ? [...prev, paymentMessage, systemMessage]
        : [...prev, paymentMessage]
      
      // 保存到 IndexedDB
      saveMessages(chatId, newMessages)
      console.log('💾 [代付] 消息已保存到IndexedDB')
      
      return newMessages
    })

    console.log('📤 [代付] 发送代付请求:', {
      itemName,
      amount,
      paymentMethod,
      status,
      '最终状态': status === 'pending' ? '待确认' : status === 'paid' ? '已支付' : '已拒绝'
    })
    
    if (paymentMethod === 'ai' && status !== 'pending') {
      console.error('⚠️ [代付错误] AI代付的状态应该是pending，但实际是:', status)
    }
  }, [chatId, characterId, characterName, setMessages])

  /**
   * AI 同意代付
   */
  const acceptPayment = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.paymentRequest) {
          return {
            ...msg,
            paymentRequest: {
              ...msg.paymentRequest,
              status: 'paid' as const
            }
          }
        }
        return msg
      })

      // 找到对应的代付消息
      const paymentMsg = updated.find(m => m.id === messageId)
      if (paymentMsg?.paymentRequest) {
        // 判断是谁发起的代付请求
        const isUserRequest = paymentMsg.type === 'sent' // 用户发起的请求
        
        // 添加系统消息
        const systemMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: isUserRequest
            ? `${characterName} 已代付 ${paymentMsg.paymentRequest.itemName} ¥${paymentMsg.paymentRequest.amount.toFixed(2)}`
            : `你已代付 ${paymentMsg.paymentRequest.itemName} ¥${paymentMsg.paymentRequest.amount.toFixed(2)}`,
          aiReadableContent: isUserRequest
            ? `【系统提示】你同意了代付请求，已为对方支付 ${paymentMsg.paymentRequest.itemName}，金额 ¥${paymentMsg.paymentRequest.amount.toFixed(2)}。你可以对此做出反应，比如说"已经帮你付了"或调侃对方。`
            : `【系统提示】对方同意了你的代付请求，已为你支付 ${paymentMsg.paymentRequest.itemName}，金额 ¥${paymentMsg.paymentRequest.amount.toFixed(2)}。你可以表示感谢。`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        updated.push(systemMsg)

        console.log(`✅ [代付] ${isUserRequest ? 'AI同意用户的代付' : '用户同意AI的代付'} ¥${paymentMsg.paymentRequest.amount}`)
      }

      // 保存到 IndexedDB
      saveMessages(chatId, updated)
      return updated
    })
  }, [chatId, characterName, setMessages])

  /**
   * AI 拒绝代付
   */
  const rejectPayment = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.paymentRequest) {
          return {
            ...msg,
            paymentRequest: {
              ...msg.paymentRequest,
              status: 'rejected' as const
            }
          }
        }
        return msg
      })

      // 找到对应的代付消息
      const paymentMsg = updated.find(m => m.id === messageId)
      if (paymentMsg?.paymentRequest) {
        // 判断是谁发起的代付请求
        const isUserRequest = paymentMsg.type === 'sent' // 用户发起的请求
        
        // 添加系统消息
        const systemMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: isUserRequest 
            ? `${characterName} 拒绝了代付请求`
            : '你拒绝了代付请求',
          aiReadableContent: isUserRequest
            ? `【系统提示】你拒绝了对方的代付请求（${paymentMsg.paymentRequest.itemName} ¥${paymentMsg.paymentRequest.amount.toFixed(2)}）。你可以解释原因或开玩笑。`
            : `【系统提示】对方拒绝了你的代付请求（${paymentMsg.paymentRequest.itemName} ¥${paymentMsg.paymentRequest.amount.toFixed(2)}）。`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        updated.push(systemMsg)

        console.log(`❌ [代付] ${isUserRequest ? 'AI拒绝用户的代付' : '用户拒绝AI的代付'}`)
      }

      // 保存到 IndexedDB
      saveMessages(chatId, updated)
      return updated
    })
  }, [chatId, characterName, setMessages])

  /**
   * AI 同意购物车代付
   */
  const acceptCartPayment = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.cartPaymentRequest) {
          return {
            ...msg,
            cartPaymentRequest: {
              ...msg.cartPaymentRequest,
              status: 'paid' as const,
              payerName: characterName
            }
          }
        }
        return msg
      })

      // 找到对应的代付消息
      const paymentMsg = updated.find(m => m.id === messageId)
      if (paymentMsg?.cartPaymentRequest) {
        const isUserRequest = paymentMsg.type === 'sent'
        
        // 添加系统消息
        const systemMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: isUserRequest
            ? `${characterName} 已代付购物车 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}`
            : `你已代付购物车 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}`,
          aiReadableContent: isUserRequest
            ? `【系统提示】你同意了购物车代付请求，已为对方支付 ${paymentMsg.cartPaymentRequest.items.length}件商品，金额 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}。你可以对此做出反应。`
            : `【系统提示】对方同意了你的购物车代付请求，已为你支付 ${paymentMsg.cartPaymentRequest.items.length}件商品，金额 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}。你可以表示感谢。`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        updated.push(systemMsg)

        console.log(`✅ [购物车代付] ${isUserRequest ? 'AI同意用户的代付' : '用户同意AI的代付'} ￥${paymentMsg.cartPaymentRequest.totalAmount}`)
      }

      // 保存到 IndexedDB
      saveMessages(chatId, updated)
      return updated
    })
  }, [chatId, characterName, setMessages])

  /**
   * AI 拒绝购物车代付
   */
  const rejectCartPayment = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.cartPaymentRequest) {
          return {
            ...msg,
            cartPaymentRequest: {
              ...msg.cartPaymentRequest,
              status: 'rejected' as const
            }
          }
        }
        return msg
      })

      // 找到对应的代付消息
      const paymentMsg = updated.find(m => m.id === messageId)
      if (paymentMsg?.cartPaymentRequest) {
        const isUserRequest = paymentMsg.type === 'sent'
        
        // 添加系统消息
        const systemMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: isUserRequest
            ? `${characterName} 拒绝了购物车代付请求`
            : `你拒绝了购物车代付请求`,
          aiReadableContent: isUserRequest
            ? `【系统提示】你拒绝了对方的购物车代付请求（金额 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}）。你可以解释原因或表达歉意。`
            : `【系统提示】对方拒绝了你的购物车代付请求（金额 ￥${paymentMsg.cartPaymentRequest.totalAmount.toFixed(2)}）。你可以表示理解。`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        updated.push(systemMsg)

        console.log(`❌ [购物车代付] ${isUserRequest ? 'AI拒绝用户的代付' : '用户拒绝AI的代付'} ￥${paymentMsg.cartPaymentRequest.totalAmount}`)
      }

      // 保存到 IndexedDB
      saveMessages(chatId, updated)
      return updated
    })
  }, [chatId, characterName, setMessages])

  return {
    showPaymentRequestSender,
    setShowPaymentRequestSender,
    hasIntimatePay: hasIntimatePay(),
    sendPaymentRequest,
    acceptPayment,
    rejectPayment,
    acceptCartPayment,
    rejectCartPayment
  }
}
