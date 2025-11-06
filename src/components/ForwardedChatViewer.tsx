/**
 * 查看转发的聊天记录弹窗
 */

interface ForwardedMessage {
  senderName: string
  content: string
  messageType?: string
  time?: string
}

interface ForwardedChatViewerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  messages: ForwardedMessage[]
}

const ForwardedChatViewer = ({
  isOpen,
  onClose,
  title,
  messages
}: ForwardedChatViewerProps) => {
  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed inset-x-4 top-[10%] bottom-[10%] z-[60] max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">{msg.senderName}</span>
                  {msg.time && (
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  )}
                </div>
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <p className="text-sm text-gray-800 break-words">
                    {msg.messageType === 'photo' ? '[图片]' :
                     msg.messageType === 'voice' ? '[语音]' :
                     msg.messageType === 'location' ? '[位置]' :
                     msg.messageType === 'transfer' ? '[转账]' :
                     msg.messageType === 'video-call-record' ? '[视频通话]' :
                     msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 底部 */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-95 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForwardedChatViewer
