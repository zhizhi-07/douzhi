import { useCallback, useState } from 'react'
import { Message } from '../../../types/chat'
import { saveMessages } from '../../../utils/simpleMessageManager'

export const useMusicInvite = (
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  characterId?: string
) => {
  const [showMusicInviteSelector, setShowMusicInviteSelector] = useState(false)

  // 发送一起听邀请
  const sendMusicInvite = useCallback((songTitle: string, songArtist: string, songCover?: string) => {
    console.log('🎵 sendMusicInvite被调用:', songTitle)
    setShowMusicInviteSelector(false)
    
    const newMessage: Message = {
      id: Date.now() + Math.random(),
      type: 'sent',
      messageType: 'musicInvite',
      content: `我想和你一起听《${songTitle}》`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      musicInvite: {
        songTitle,
        songArtist,
        songCover: songCover || '',
        inviterName: '我',
        status: 'pending'
      },
      timestamp: Date.now()
    }
    console.log('🎵 准备添加消息，ID:', newMessage.id)
    setMessages((prev) => {
      console.log('🎵 setMessages被执行，当前消息数:', prev.length)
      const updated = [...prev, newMessage]
      // 保存到IndexedDB
      saveMessages(chatId, updated)
      console.log('💾 [音乐邀请] 消息已保存到IndexedDB')
      return updated
    })
  }, [chatId, setMessages])

  // 用户接受邀请（点击接受按钮）
  const acceptInvite = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId && (msg as any).musicInvite
          ? { ...msg, musicInvite: { ...(msg as any).musicInvite, status: 'accepted' } }
          : msg
      )
      
      // 添加系统提示
      const inviteMsg = updated.find(m => m.id === messageId)
      if (inviteMsg && (inviteMsg as any).musicInvite) {
        // 保存一起听状态到localStorage
        if (characterId) {
          localStorage.setItem('listening_together', JSON.stringify({
            characterId,
            songTitle: (inviteMsg as any).musicInvite.songTitle,
            songArtist: (inviteMsg as any).musicInvite.songArtist,
            startTime: Date.now()
          }))
        }
        
        const systemMsg: Message = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: `你已接受邀请，开始一起听《${(inviteMsg as any).musicInvite.songTitle}》`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
        
        // 触发播放器切歌
        window.dispatchEvent(new CustomEvent('change-song', {
          detail: { 
            songTitle: (inviteMsg as any).musicInvite.songTitle, 
            songArtist: (inviteMsg as any).musicInvite.songArtist 
          }
        }))
        
        return [...updated, systemMsg]
      }
      return updated
    })
  }, [setMessages, characterId])

  // 用户拒绝邀请（点击拒绝按钮）
  const rejectInvite = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId && (msg as any).musicInvite
        ? { ...msg, musicInvite: { ...(msg as any).musicInvite, status: 'rejected' } }
        : msg
    ))
  }, [setMessages])

  return {
    showMusicInviteSelector,
    setShowMusicInviteSelector,
    sendMusicInvite,
    acceptInvite,
    rejectInvite
  }
}
