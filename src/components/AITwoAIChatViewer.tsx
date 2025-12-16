/**
 * AI间聊天室
 * 用于查看两个AI角色之间的聊天记录，支持刷新让AI互动
 * 
 * 功能：
 * 1. 显示两个AI的聊天记录
 * 2. 好友申请状态（pending/accepted/rejected）
 * 3. 刷新按钮让AI进行一轮对话
 * 4. 读取双方人设进行对话
 */

import { useState, useEffect, useRef } from 'react'
import { playSystemSound } from '../utils/soundManager'
import { getAllCharacters } from '../utils/characterManager'

export interface AIMessage {
  id: number
  senderId: string
  senderName: string
  content: string
  timestamp: number
  time: string
}

// AI间好友关系状态
export interface AIFriendship {
  status: 'pending' | 'accepted' | 'rejected'
  requesterId: string  // 发起请求的AI
  targetId: string     // 被请求的AI
  timestamp: number
}

interface AITwoAIChatViewerProps {
  isOpen: boolean
  onClose: () => void
  aiCharacterId: string      // 当前聊天的AI（发起添加好友的）
  aiCharacterName: string
  targetCharacterId: string  // 名片中的目标AI
  targetCharacterName: string
  targetCharacterAvatar?: string
}

// 获取AI间聊天记录的key
const getAIChatKey = (id1: string, id2: string) => {
  const sorted = [id1, id2].sort()
  return `ai_chat_${sorted[0]}_${sorted[1]}`
}

// 获取AI间好友关系的key
const getFriendshipKey = (id1: string, id2: string) => {
  const sorted = [id1, id2].sort()
  return `ai_friendship_${sorted[0]}_${sorted[1]}`
}

// 加载AI间聊天记录（自动去重）
export const loadAIChat = (aiId1: string, aiId2: string): AIMessage[] => {
  const key = getAIChatKey(aiId1, aiId2)
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const messages: AIMessage[] = JSON.parse(stored)
      // 去重：按ID去重，保留最后一个
      const seen = new Map<number, AIMessage>()
      for (const msg of messages) {
        seen.set(msg.id, msg)
      }
      const unique = Array.from(seen.values())
      // 如果有重复，保存去重后的数据
      if (unique.length !== messages.length) {
        saveAIChat(aiId1, aiId2, unique)
      }
      return unique
    } catch (e) {
      console.error('加载AI聊天记录失败:', e)
    }
  }
  return []
}

// 保存AI间聊天记录
export const saveAIChat = (aiId1: string, aiId2: string, messages: AIMessage[]) => {
  const key = getAIChatKey(aiId1, aiId2)
  localStorage.setItem(key, JSON.stringify(messages))
}

// 加载好友关系
export const loadFriendship = (aiId1: string, aiId2: string): AIFriendship | null => {
  const key = getFriendshipKey(aiId1, aiId2)
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {}
  }
  return null
}

// 保存好友关系
export const saveFriendship = (aiId1: string, aiId2: string, friendship: AIFriendship) => {
  const key = getFriendshipKey(aiId1, aiId2)
  localStorage.setItem(key, JSON.stringify(friendship))
}

// 添加一条AI间聊天消息
// 用于生成唯一ID的计数器
let messageIdCounter = 0

export const addAIChatMessage = (
  senderId: string,
  senderName: string,
  receiverId: string,
  content: string
) => {
  const messages = loadAIChat(senderId, receiverId)
  const now = new Date()
  // 使用时间戳+计数器确保唯一性
  const uniqueId = Date.now() * 1000 + (messageIdCounter++ % 1000)
  const newMessage: AIMessage = {
    id: uniqueId,
    senderId,
    senderName,
    content,
    timestamp: now.getTime(),
    time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  messages.push(newMessage)
  saveAIChat(senderId, receiverId, messages)
  return newMessage
}

const AITwoAIChatViewer = ({
  isOpen,
  onClose,
  aiCharacterId,
  aiCharacterName,
  targetCharacterId,
  targetCharacterName,
  targetCharacterAvatar
}: AITwoAIChatViewerProps) => {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [friendship, setFriendship] = useState<AIFriendship | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiCharacter, setAiCharacter] = useState<any>(null)
  const [targetCharacter, setTargetCharacter] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 加载聊天记录和好友关系
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, aiCharacterId, targetCharacterId])

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 获取角色头像
  const getCharacterAvatar = (characterId: string) => {
    if (characterId === targetCharacterId && targetCharacterAvatar) {
      return targetCharacterAvatar
    }
    if (characterId === aiCharacterId && aiCharacter?.avatar) {
      return aiCharacter.avatar
    }
    if (characterId === targetCharacterId && targetCharacter?.avatar) {
      return targetCharacter.avatar
    }
    return null
  }

  
  if (!isOpen) return null

  const isFriends = friendship?.status === 'accepted'
  const isPending = friendship?.status === 'pending'
  const isRejected = friendship?.status === 'rejected'

  return (
    <>
      {/* 聊天室面板 - 全屏覆盖 */}
      <div className="fixed inset-0 bg-white z-[999999] flex flex-col" style={{ height: '100vh', width: '100vw' }}>
        {/* 头部 */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3">
          <button
            onClick={() => {
              playSystemSound()
              onClose()
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
          
          {/* 刷新按钮 - 让两个AI私信聊天 */}
          {(isPending || isFriends || isRejected) && (
            <button
              onClick={async () => {
                playSystemSound()
                setIsLoading(true)
                try {
                  // 统一调用私信聊天函数
                  const { decideFriendRequest } = await import('../services/aiToAiChat')
                  await decideFriendRequest(
                    aiCharacterId,
                    aiCharacterName,
                    targetCharacterId,
                    targetCharacterName
                  )
                  // 更新好友状态为已接受
                  const newFriendship: AIFriendship = {
                    status: 'accepted',
                    requesterId: aiCharacterId,
                    targetId: targetCharacterId,
                    timestamp: Date.now()
                  }
                  setFriendship(newFriendship)
                  // 重新加载消息
                  const updated = loadAIChat(aiCharacterId, targetCharacterId)
                  console.log('📨 [私信] 加载到的消息:', updated)
                  setMessages(updated)
                } catch (error) {
                  console.error('私信对话失败:', error)
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isPending ? '处理中...' : '对话中...'}</span>
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
        <div ref={scrollRef} className="overflow-y-auto p-4 space-y-4 bg-[#f5f5f5]" style={{ flex: 1, minHeight: 0 }}>
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
    </>
  )
}

export default AITwoAIChatViewer
