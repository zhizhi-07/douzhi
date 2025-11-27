/**
 * 聊天相关弹窗组件集合
 */

import React from 'react'
import type { Message, Character } from '../../../types/chat'

interface ChatModalsProps {
  character: Character
  viewingRecalledMessage: Message | null
  onCloseRecalledMessage: () => void
  viewingCallRecord: Message | null
  onCloseCallRecord: () => void
}

const ChatModals = ({
  character,
  viewingRecalledMessage,
  onCloseRecalledMessage,
  viewingCallRecord,
  onCloseCallRecord
}: ChatModalsProps) => {
  // 格式化文本段落
  const formatText = (text?: string) => {
    if (!text) return null
    
    const paragraphs = text.split('\n')
    
    return paragraphs.map((para, index) => {
      const trimmedPara = para.trim()
      
      if (!trimmedPara) {
        if (index > 0 && paragraphs[index - 1].trim() === '') {
          return null
        }
        return <br key={index} />
      }
      
      return (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          <span>{trimmedPara}</span>
        </React.Fragment>
      )
    }).filter(Boolean)
  }
  
  return (
    <>
      {/* 查看撤回消息 */}
      {viewingRecalledMessage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCloseRecalledMessage}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900 mb-4">撤回的消息</div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-900 leading-relaxed break-words">
                {formatText(viewingRecalledMessage.recalledContent)}
              </div>
            </div>
            {viewingRecalledMessage.recallReason && (
              <div className="text-xs text-gray-500 mb-4">
                撤回理由：{viewingRecalledMessage.recallReason}
              </div>
            )}
            <button
              onClick={onCloseRecalledMessage}
              className="w-full py-2 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 查看通话记录 */}
      {viewingCallRecord && viewingCallRecord.videoCallRecord && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCloseCallRecord}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900 mb-4">通话详情</div>
            
            {/* 通话统计信息 */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">通话对象</span>
                <span className="text-sm font-medium text-gray-900">
                  {character.nickname || character.realName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">通话类型</span>
                <span className="text-sm font-medium text-gray-900">视频通话</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">通话时长</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.floor(viewingCallRecord.videoCallRecord.duration / 60)}分{viewingCallRecord.videoCallRecord.duration % 60}秒
                </span>
              </div>
            </div>

            {/* 聊天记录 */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="text-sm font-medium text-gray-700 mb-3">聊天记录</div>
              <div className="space-y-2">
                {viewingCallRecord.videoCallRecord.messages.map((msg) => {
                  if (msg.type === 'narrator') {
                    // 旁白消息（画面描述）
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <div className="text-xs text-gray-400 italic px-4">
                          {msg.content}
                        </div>
                      </div>
                    )
                  }
                  
                  // 普通对话消息
                  else {
                    // 普通对话消息
                    const isUser = msg.type === 'user'
                    return (
                      <div
                        key={msg.id}
                        className={`message-container flex ${isUser ? 'sent justify-end' : 'received justify-start'}`}
                      >
                        <div className="flex flex-col max-w-[75%]">
                          <div className={`text-xs text-gray-500 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
                            {isUser ? '我' : (character.nickname || character.realName)} · {msg.time}
                          </div>
                          <div
                            className={`message-bubble px-3 py-2 ${
                              isUser
                                ? ''
                                : 'bg-gray-100 text-gray-900'
                            }`}
                            style={{
                              borderRadius: isUser 
                                ? '18px 18px 4px 18px'  // 水滴形状：右下角小圆角
                                : '18px 18px 18px 4px'  // 水滴形状：左下角小圆角
                            }}
                          >
                            <div className="text-sm leading-relaxed break-words">
                              {formatText(msg.content)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>

            <button
              onClick={onCloseCallRecord}
              className="w-full py-2 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatModals
