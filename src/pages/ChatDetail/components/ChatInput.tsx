/**
 * 聊天输入框组件
 */

import { playMessageSendSound } from '../../../utils/soundManager'
import { useCustomIcons } from '../hooks/useCustomIcons'

interface ChatInputProps {
  inputValue: string
  isAiTyping: boolean
  quotedMessage: any
  onInputChange: (value: string) => void
  onSend: () => void
  onAIReply: () => void
  onClearQuote: () => void
  onShowAddMenu: () => void
}

const ChatInput = ({
  inputValue,
  isAiTyping,
  quotedMessage,
  onInputChange,
  onSend,
  onAIReply,
  onClearQuote,
  onShowAddMenu
}: ChatInputProps) => {
  const { customIcons } = useCustomIcons()

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        onSend()
      } else {
        onAIReply()
      }
    }
  }

  return (
    <div className="bg-transparent">
      {/* 引用消息预览 */}
      {quotedMessage && (
        <div className="px-3 pt-2 pb-1">
          <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 mb-0.5">
                {quotedMessage.type === 'sent' ? '我' : quotedMessage.senderName}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || quotedMessage.location?.name || '特殊消息'}
              </div>
            </div>
            <button
              onClick={onClearQuote}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* 输入栏 */}
      <div className="px-3 py-3 flex items-center gap-2">
        {/* 添加按钮 */}
        <button
          onClick={() => {
            onShowAddMenu()
          }}
          className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect overflow-hidden rounded-full"
        >
          {customIcons['chat-add-btn'] ? (
            <img src={customIcons['chat-add-btn']} alt="add" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        {/* 输入框 */}
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="发送消息"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            disabled={isAiTyping}
          />
        </div>
        
        {/* 表情按钮 */}
        <button className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect overflow-hidden rounded-full">
          {customIcons['chat-emoji'] ? (
            <img src={customIcons['chat-emoji']} alt="emoji" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        {/* 发送/AI按钮 */}
        {inputValue.trim() ? (
          <button
            onClick={onSend}
            disabled={isAiTyping}
            className={`w-10 h-10 flex items-center justify-center ios-button rounded-full disabled:opacity-50 ios-spring btn-press-fast overflow-hidden ${customIcons['chat-send'] ? '' : 'bg-gray-900 text-white shadow-lg'}`}
          >
            {customIcons['chat-send'] ? (
              <img src={customIcons['chat-send']} alt="send" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              playMessageSendSound() // 🎵 AI回复使用与发送相同的音效
              onAIReply()
            }}
            disabled={isAiTyping}
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 btn-press-fast touch-ripple-effect overflow-hidden rounded-full"
          >
            {isAiTyping ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : customIcons['chat-ai'] ? (
              <img src={customIcons['chat-ai']} alt="ai" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatInput
