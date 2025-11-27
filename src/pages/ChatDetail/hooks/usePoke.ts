/**
 * 拍一拍功能Hook
 */

import { useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { getUserInfo } from '../../../utils/userUtils'
import { saveMessages } from '../../../utils/simpleMessageManager'

export const usePoke = (
  id: string | undefined,
  character: any,
  messages: Message[],
  setMessages: (messages: Message[]) => void
) => {
  const handlePoke = useCallback(() => {
    if (!id || !character) return
    
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName || '用户'
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
    
    const updatedMessages = [...messages, pokeMessage]
    setMessages(updatedMessages)
    saveMessages(id, updatedMessages)
    
    console.log('👋 拍一拍:', pokeMessage)
  }, [id, character, messages, setMessages])

  return {
    handlePoke
  }
}
