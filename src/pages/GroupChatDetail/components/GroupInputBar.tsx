/**
 * 群聊输入栏组件
 */

import React from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

interface GroupInputBarProps {
  inputText: string
  isAiTyping: boolean
  quotedMessage: GroupMessage | null
  customIcons: Record<string, string>
  chatDecorations: {
    topBar: string | null
    bottomBar: string | null
    plusButton: string | null
    emojiButton: string | null
    sendButtonNormal: string | null
    sendButtonActive: string | null
  }
  inputRef: React.RefObject<HTMLInputElement>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSend: () => void
  onAIReply: () => void
  onCancelQuote: () => void
  onOpenAddMenu: () => void
  onOpenEmojiPanel: () => void
}

const GroupInputBar: React.FC<GroupInputBarProps> = ({
  inputText,
  isAiTyping,
  quotedMessage,
  customIcons,
  chatDecorations,
  inputRef,
  onInputChange,
  onSend,
  onAIReply,
  onCancelQuote,
  onOpenAddMenu,
  onOpenEmojiPanel
}) => {
  return (
    <div className="bg-[#f5f7fa] border-t border-gray-200/50">
      {/* 引用消息显示区域 */}
      {quotedMessage && (
        <div className="px-4 pt-3 pb-1">
          <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 mb-0.5">
                {quotedMessage.userName}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {quotedMessage.content}
              </div>
            </div>
            <button
              onClick={onCancelQuote}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="px-2 py-2 flex items-center gap-1">
        <button 
          onClick={onOpenAddMenu}
          className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
        >
          {(customIcons['chat-add-btn'] || chatDecorations.plusButton) ? (
            <img src={customIcons['chat-add-btn'] || chatDecorations.plusButton!} alt="加号" className="w-8 h-8 object-contain" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm touch-transition focus-within:shadow-md focus-within:scale-[1.01] min-w-0 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={onInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isAiTyping) {
                if (inputText.trim()) {
                  onSend()  // 有文字：发送用户消息
                } else {
                  onAIReply()  // 无文字：触发 AI 回复
                }
              }
            }}
            placeholder={isAiTyping ? 'AI正在回复...' : '发送消息'}
            disabled={isAiTyping}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-w-0 disabled:opacity-50"
          />
        </div>
        <button 
          onClick={onOpenEmojiPanel}
          className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
        >
          {customIcons['chat-emoji'] ? (
            <img src={customIcons['chat-emoji']} alt="表情" className="w-8 h-8 object-contain" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        {inputText.trim() ? (
          <button
            onClick={onSend}
            disabled={isAiTyping}
            className="w-9 h-9 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg ios-spring btn-press-fast flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {customIcons['chat-send'] ? (
              <img src={customIcons['chat-send']} alt="发送" className="w-6 h-6 object-contain" />
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        ) : (
          <button 
            onClick={onAIReply}
            disabled={isAiTyping}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="触发AI回复"
            style={customIcons['chat-ai'] ? { background: 'transparent' } : {}}
          >
            {isAiTyping ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : customIcons['chat-ai'] ? (
              <img src={customIcons['chat-ai']} alt="AI回复" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupInputBar
