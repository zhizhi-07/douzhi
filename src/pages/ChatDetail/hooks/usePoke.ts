/**
 * 拍一拍功能Hook
 */

import { useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { getCurrentUserName } from '../../../utils/userUtils'
import { saveMessages } from '../../../utils/simpleMessageManager'

export const usePoke = (
  id: string | undefined,
  character: any,
  messages: Message[],
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
) => {
  const handlePoke = useCallback(() => {
    if (!id || !character) return
    
    // 🔥 使用考虑小号的函数获取用户名
    const userName = getCurrentUserName()
    const aiName = character.nickname || character.realName
    const pokeSuffix = character.pokeSuffix || ''
    
    const pokeMessage: Message = {
      id: Date.now(),
      type: 'system',
      messageType: 'poke',
      content: `${userName}拍了拍${aiName}${pokeSuffix}`,
      aiReadableContent: `【系统通知】${userName}拍了拍${aiName}${pokeSuffix}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      poke: {
        fromName: userName,
        toName: aiName,
        suffix: pokeSuffix
      }
    }
    
    // 🔥 使用函数式更新，确保获取最新的消息列表
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, pokeMessage]
      // 🔥 在回调中保存，确保使用最新的消息列表
      saveMessages(id, updatedMessages)
      console.log('👋 拍一拍:', pokeMessage, `当前消息数: ${updatedMessages.length}`)
      return updatedMessages
    })
  }, [id, character, setMessages])

  return {
    handlePoke
  }
}
