/**
 * 消息长按菜单组件
 */

import type { Message } from '../types/chat'
import { playMenuSelectSound, playMenuCloseSound } from '../utils/soundManager'

interface MenuItemConfig {
  label: string
  onClick: () => void
  icon: JSX.Element
  danger?: boolean
}

interface MessageMenuProps {
  isOpen: boolean
  message: Message | null
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

  // 菜单项配置
  const menuItems: MenuItemConfig[] = []

  // 复制
  menuItems.push({
    label: '复制',
    onClick: onCopy,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
  })

  // 引用
  menuItems.push({
    label: '引用',
    onClick: onQuote,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
  })

  // 编辑（仅自己发送的消息）
  if (isSentMessage) {
    menuItems.push({
      label: '编辑',
      onClick: onEdit,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    })
  }

  // 撤回（仅自己发送的消息，且2分钟内）
  if (canRecall) {
    menuItems.push({
      label: '撤回',
      onClick: onRecall,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
      danger: true
    })
  }

  // 删除
  menuItems.push({
    label: '删除',
    onClick: onDelete,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    danger: true
  })

  // 批量删除
  menuItems.push({
    label: '批量删除',
    onClick: onBatchDelete,
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  })

  return (
    <>
      {/* 遮罩层 - 液态玻璃效果 + 淡入动画 */}
      <div
        className="fixed inset-0 z-50 glass-dark modal-overlay-enter"
        onClick={() => {
          playMenuCloseSound() // 🎵 播放关闭音效
          onClose()
        }}
        style={{
          willChange: 'opacity',
          transform: 'translateZ(0)' // 🚀 GPU加速
        }}
      />

      {/* 菜单面板 - 从底部滑入 */}
      <div
        className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl z-50 modal-slide-up pb-safe"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)' // 🚀 GPU加速
        }}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 消息预览 */}
        <div className="px-5 py-3 border-b border-gray-200/50">
          <div className="text-xs text-gray-500 mb-1">
            {isSentMessage ? '你' : '对方'}
          </div>
          <div className="text-sm text-gray-800 line-clamp-2 break-words">
            {message.content}
          </div>
        </div>

        {/* 菜单项列表 - 瀑布流动画 */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                playMenuSelectSound() // 🎵 播放菜单选择音效
                item.onClick()
                onClose()
              }}
              className={`w-full px-5 py-3 flex items-center gap-3 hover:bg-white/50 active:bg-white/70 transition-all btn-press-fast menu-item-enter ${
                item.danger ? 'text-red-500' : 'text-gray-800'
              }`}
              style={{
                animationDelay: `${index * 0.05}s`,
                willChange: 'transform, opacity'
              }}
            >
              <div className={item.danger ? 'text-red-500' : 'text-gray-600'}>
                {item.icon}
              </div>
              <span className="text-base font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}

export default MessageMenu
