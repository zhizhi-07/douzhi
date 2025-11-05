/**
 * 聊天相关弹窗组件集合
 */

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
              <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {viewingRecalledMessage.recalledContent}
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
            className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900 mb-4">通话详情</div>
            
            <div className="space-y-3 mb-4">
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
                  {viewingCallRecord.videoCallRecord.duration}秒
                </span>
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
