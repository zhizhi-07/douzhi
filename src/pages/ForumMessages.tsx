import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ForumLayout from '../components/ForumLayout'
import { loadConversations } from '../utils/forumManager'
import type { ForumConversation } from '../types/forum'

const ForumMessages = () => {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ForumConversation[]>([])

  useEffect(() => {
    setConversations(loadConversations())
  }, [])

  return (
    <ForumLayout>
      <div className="p-4">
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/forum/chat/${conv.id}`)}
              className="py-4 cursor-pointer active:opacity-70 transition-opacity border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  {conv.isNPC && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">AI</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{conv.user}</span>
                    <span className="text-xs text-gray-400">{conv.lastTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="pt-32 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-400">暂无消息</p>
            <p className="text-xs text-gray-400 mt-1">NPC和角色会在这里私信你</p>
          </div>
        )}
      </div>
    </ForumLayout>
  )
}

export default ForumMessages
