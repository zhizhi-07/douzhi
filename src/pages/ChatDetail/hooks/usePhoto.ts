/**
 * 拍照功能Hook
 * 负责：拍照发送逻辑
 */

import { useCallback, useState } from 'react'
import type { Message } from '../../../types/chat'
import { addMessage, addMessages } from '../../../utils/simpleMessageManager'
import { blacklistManager } from '../../../utils/blacklistManager'
import { generatePlaceholderImageBase64 } from '../../../utils/imageUtils'
import { playMessageSendSound } from '../../../utils/soundManager'

export const usePhoto = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string
) => {
  const [showPhotoSender, setShowPhotoSender] = useState(false)
  const [showAlbumSelector, setShowAlbumSelector] = useState(false)

  /**
   * 发送单张照片消息
   */
  const handleSendPhoto = useCallback((description: string) => {
    if (!description.trim()) return
    
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')
    
    // 生成图片的base64编码（用于AI视觉识别）
    const photoBase64 = generatePlaceholderImageBase64(description.trim())
    
    console.log('📸 生成照片消息，描述:', description.trim())
    console.log('🖼️ 已生成图片base64，长度:', photoBase64.length)

    const photoMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'photo',
      blockedByReceiver: isUserBlocked,
      photoDescription: description.trim(),
      photoBase64: photoBase64  // 添加base64编码供AI识图使用
    }

    // 保存到IndexedDB
    addMessage(chatId, photoMsg)
    
    setMessages(prev => [...prev, photoMsg])
    
    // 播放发送音效
    playMessageSendSound()

    setShowPhotoSender(false)
  }, [setMessages, chatId])

  /**
   * 发送多张照片消息（从相册选择）
   */
  const handleSendPhotos = useCallback((photos: Array<{ base64: string, name: string }>) => {
    if (photos.length === 0) return

    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')

    console.log(`📸 从相册发送 ${photos.length} 张照片`)
    photos.forEach((p, i) => {
      console.log(`  照片${i+1}: ${p.name}, base64长度=${p.base64.length}`)
    })

    // 为每张照片创建消息
    const photoMessages: Message[] = photos.map((photo, index) => {
      const msg = {
        id: Date.now() + index,
        type: 'sent' as const,
        content: '',
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now() + index,
        messageType: 'photo' as const,
        blockedByReceiver: isUserBlocked,
        photoDescription: '一张图片',  // 简单描述即可，AI会通过图片识别真实内容
        photoBase64: photo.base64  // 使用真实上传的图片base64
      }
      console.log(`✅ 创建照片消息${index+1}:`, {
        id: msg.id,
        photoDescription: msg.photoDescription,
        hasPhotoBase64: !!msg.photoBase64,
        base64Length: msg.photoBase64?.length
      })
      return msg
    })

    // 🔥 使用批量添加，避免竞态条件导致只保存一张
    addMessages(chatId, photoMessages)

    // 🔥 使用函数式更新，避免触发滚动逻辑
    setMessages(prev => {
      return [...prev, ...photoMessages]
    })

    // 播放一次发送音效（批量发送也只播一次）
    playMessageSendSound()
    setShowAlbumSelector(false)
  }, [setMessages, chatId])

  return {
    showPhotoSender,
    setShowPhotoSender,
    showAlbumSelector,
    setShowAlbumSelector,
    handleSendPhoto,
    handleSendPhotos
  }
}
