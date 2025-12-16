/**
 * AI私信聊天页面
 * 查看两个AI角色之间的聊天记录
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { playSystemSound } from '../utils/soundManager'
import { getAllCharacters } from '../utils/characterManager'
import { 
  AIMessage, 
  AIFriendship, 
  loadAIChat, 
  loadFriendship 
} from '../components/AITwoAIChatViewer'

const AITwoAIChat = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // 从URL参数获取角色信息
  const aiCharacterId = searchParams.get('aiId') || ''
  const aiCharacterName = searchParams.get('aiName') || ''
  const targetCharacterId = searchParams.get('targetId') || ''
  const targetCharacterName = searchParams.get('targetName') || ''
  
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [friendship, setFriendship] = useState<AIFriendship | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiCharacter, setAiCharacter] = useState<any>(null)
  const [targetCharacter, setTargetCharacter] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 加载聊天记录和好友关系
  useEffect(() => {
    if (aiCharacterId && targetCharacterId) {
      const loaded = loadAIChat(aiCharacterId, targetCharacterId)
      setMessages(loaded)
      
      const fs = loadFriendship(aiCharacterId, targetCharacterId)
      setFriendship(fs)
      
      // 加载两个角色的信息
      getAllCharacters().then(chars => {
        const ai = chars.find(c => c.id === aiCharacterId)
        const target = chars.find(c => c.id === targetCharacterId)
        setAiCharacter(ai)
        setTargetCharacter(target)
      })
    }
  }, [aiCharacterId, targetCharacterId])

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 获取角色头像
  const getCharacterAvatar = (characterId: string) => {
    if (characterId === targetCharacterId && targetCharacter?.avatar) {
      return targetCharacter.avatar
    }
    if (characterId === aiCharacterId && aiCharacter?.avatar) {
      return aiCharacter.avatar
    }
    return null
  }

  const isFriends = friendship?.status === 'accepted'
  const isPending = friendship?.status === 'pending'
  const isRejected = friendship?.status === 'rejected'

  // 刷新对话
  const handleRefresh = async () => {
    playSystemSound()
    setIsLoading(true)
    try {
      const { decideFriendRequest } = await import('../services/aiToAiChat')
      await decideFriendRequest(
        aiCharacterId,
        aiCharacterName,
        targetCharacterId,
        targetCharacterName
      )
      // 更新好友状态
      setFriendship({
        status: 'accepted',
        requesterId: aiCharacterId,
        targetId: targetCharacterId,
        timestamp: Date.now()
      })
      // 重新加载消息
      const updated = loadAIChat(aiCharacterId, targetCharacterId)
      setMessages(updated)
    } catch (error) {
      console.error('私信对话失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      {/* 头部 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => {
            playSystemSound()
            navigate(-1)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="font-medium text-gray-800">
            {aiCharacterName} 与 {targetCharacterName}
          </div>
          <div className="text-xs text-gray-500">
            {isFriends ? '已成为好友' : isPending ? '好友申请中' : isRejected ? '已拒绝' : '未建立关系'}
          </div>
        </div>
        
        {/* 刷新按钮 */}
        {(isPending || isFriends || isRejected) && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>对话中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 聊天内容 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">暂无聊天记录</p>
            <p className="text-xs mt-1">
              {isPending ? '等待对方同意好友申请' : isFriends ? '点击刷新让TA们聊天吧' : '尚未建立好友关系'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isFromCurrentAI = msg.senderId === aiCharacterId
            const isSystem = msg.senderId === 'system'
            const avatar = getCharacterAvatar(msg.senderId)

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <span className="inline-block px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                    {msg.content}
                  </span>
                </div>
              )
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isFromCurrentAI ? 'flex-row-reverse' : ''}`}
              >
                {/* 头像 */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 消息气泡 */}
                <div className={`max-w-[70%] ${isFromCurrentAI ? 'items-end' : 'items-start'}`}>
                  <div className={`text-xs text-gray-500 mb-1 ${isFromCurrentAI ? 'text-right' : ''}`}>
                    {msg.senderName}
                  </div>
                  <div
                    className={`
                      px-3 py-2 rounded-xl text-sm
                      ${isFromCurrentAI
                        ? 'bg-green-500 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm'
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isFromCurrentAI ? 'text-right' : ''}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AITwoAIChat
