/**
 * 转发的聊天记录卡片组件
 * 显示合并转发的聊天记录摘要
 */

interface ForwardedMessage {
  senderName: string
  content: string
  messageType?: string
}

interface ForwardedChatCardProps {
  title: string
  messages: ForwardedMessage[]
  messageCount: number
  onView: () => void
  isSent?: boolean
}

const ForwardedChatCard = ({
  title,
  messages,
  messageCount,
  onView,
  isSent = false
}: ForwardedChatCardProps) => {
  return (
    <div
      onClick={onView}
      className="max-w-[260px] rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 bg-white border border-gray-200"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      {/* 标题栏 */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
        </svg>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{title}</span>
      </div>

      {/* 消息预览 */}
      <div className="px-3 py-2.5 space-y-1">
        {messages.slice(0, 3).map((msg, index) => (
          <div key={index} className="text-xs text-gray-600 truncate">
            <span className="font-medium text-gray-800">{msg.senderName}:</span>{' '}
            <span>
              {msg.messageType === 'photo' ? '[图片]' : 
               msg.messageType === 'voice' ? '[语音]' :
               msg.messageType === 'location' ? '[位置]' :
               msg.messageType === 'transfer' ? '[转账]' :
               msg.content}
            </span>
          </div>
        ))}
      </div>

      {/* 底部信息 */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs">
        <span className="text-gray-500">聊天记录</span>
        <span className="text-gray-400">{messageCount} 条</span>
      </div>
    </div>
  )
}

export default ForwardedChatCard
