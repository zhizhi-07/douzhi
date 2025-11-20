/**
 * 线下记录卡片组件 - 在线上聊天中显示线下经历摘要
 */

import { Message } from '../../../types/chat'

interface OfflineSummaryCardProps {
  message: Message
  onEdit?: (message: Message) => void
}

const OfflineSummaryCard: React.FC<OfflineSummaryCardProps> = ({ message, onEdit }) => {
  if (!message.offlineSummary) return null

  const { title, summary } = message.offlineSummary

  return (
    <div className="px-6 sm:px-12 py-4">
      <div className="max-w-2xl mx-auto">
        {/* 时间分隔线 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-xs text-gray-400">{message.time}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* 线下记录卡片 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 shadow-md border border-amber-200/50 relative group">
          {/* 装饰图标 */}
          <div className="absolute top-4 right-4 text-amber-400/30">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          {/* 标签 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-full">
              线下经历
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-white/80 text-gray-600 text-xs rounded-md hover:bg-white"
              >
                编辑
              </button>
            )}
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {title}
          </h3>

          {/* 摘要内容 */}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>

          {/* 底部装饰 */}
          <div className="mt-4 pt-3 border-t border-amber-200/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>此段经历已被AI记录并理解</span>
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineSummaryCard
