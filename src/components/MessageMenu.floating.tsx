/**
 * 消息悬浮菜单组件
 * 悬浮在消息旁边的气泡菜单，带箭头指向消息
 */

import type { Message } from '../types/chat'

interface MenuPosition {
  x: number
  y: number
}

interface MessageMenuProps {
  isOpen: boolean
  message: Message | null
  menuPosition: MenuPosition
  onClose: () => void
  onCopy: () => void
  onDelete: () => void
  onRecall: () => void
  onQuote: () => void
  onEdit: () => void
  onBatchDelete: () => void
}

const MessageMenu = ({
  isOpen,
  message,
  menuPosition,
  onClose,
  onCopy,
  onDelete,
  onRecall,
  onQuote,
  onEdit,
  onBatchDelete
}: MessageMenuProps) => {
  if (!isOpen || !message) return null

  const isSentMessage = message.type === 'sent'
  const canRecall = isSentMessage && (Date.now() - message.timestamp < 120000) // 2分钟内可撤回

  return (
    <>
      {/* 遮罩层 - 液态玻璃效果 */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* 悬浮菜单气泡 */}
      <div
        className="fixed z-50"
        style={{
          top: `${Math.min(menuPosition.y + 10, window.innerHeight - 200)}px`,
          left: isSentMessage
            ? `${Math.min(menuPosition.x - 140, window.innerWidth - 160)}px`
            : `${Math.max(menuPosition.x - 20, 20)}px`,
          minWidth: '140px',
          maxWidth: '160px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          transform: 'scale(1)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'menuFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* 小箭头指向消息 */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            transform: 'rotate(45deg)',
            top: '-6px',
            [isSentMessage ? 'right' : 'left']: '20px',
            zIndex: -1
          }}
        />

        {/* 菜单项列表 */}
        <div style={{ padding: '8px 0' }}>
          {/* 复制 */}
          <button
            onClick={() => {
              onCopy()
              onClose()
            }}
            className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 transition-all"
            style={{ border: 'none', background: 'transparent' }}
          >
            复制
          </button>

          {/* 引用 */}
          <button
            onClick={() => {
              onQuote()
              onClose()
            }}
            className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 transition-all"
            style={{ border: 'none', background: 'transparent' }}
          >
            引用
          </button>

          {/* 编辑（仅自己的消息） */}
          {isSentMessage && (
            <button
              onClick={() => {
                onEdit()
                onClose()
              }}
              className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 transition-all"
              style={{ border: 'none', background: 'transparent' }}
            >
              编辑
            </button>
          )}

          {/* 撤回（仅自己的消息，且2分钟内） */}
          {canRecall && (
            <button
              onClick={() => {
                onRecall()
                onClose()
              }}
              className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 transition-all"
              style={{ border: 'none', background: 'transparent' }}
            >
              撤回
            </button>
          )}

          {/* 删除 */}
          <button
            onClick={() => {
              onDelete()
              onClose()
            }}
            className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 transition-all"
            style={{ border: 'none', background: 'transparent' }}
          >
            删除
          </button>

          {/* 批量删除 */}
          <button
            onClick={() => {
              onBatchDelete()
              onClose()
            }}
            className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-red-600 transition-all"
            style={{ border: 'none', background: 'transparent' }}
          >
            批量删除
          </button>
        </div>
      </div>

      <style>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )
}

export default MessageMenu
