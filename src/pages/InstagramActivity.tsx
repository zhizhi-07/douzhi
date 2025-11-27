import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getDMConversations, type DMConversation } from '../utils/instagramDM'

/**
 * Instagram 私聊列表页面
 */
const InstagramActivity = () => {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<DMConversation[]>([])

  useEffect(() => {
    setConversations(getDMConversations())
  }, [])

  return (
    <InstagramLayout showHeader={false}>
      {/* 顶部标题 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">私聊</h1>
        </div>
      </div>

      {/* 私聊列表 */}
      <div className="pb-20">
        {conversations.length > 0 ? (
          <div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/instagram/dm/${conv.id}`)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50 cursor-pointer"
              >
                {/* 头像 */}
                {conv.avatar ? (
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-lg">
                    {conv.name[0]}
                  </div>
                )}
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{conv.name}</span>
                    <span className="text-xs text-gray-400">{conv.lastTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                
                {/* 未读标记 */}
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">{conv.unreadCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">私聊</h3>
            <p className="text-sm text-gray-500 px-8">
              暂时还没有人私聊你
            </p>
          </div>
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramActivity
