/**
 * 线下记录卡片组件 - 在线上聊天中显示线下经历摘要
 */

import { useState } from 'react'
import { Message } from '../../../types/chat'

interface OfflineSummaryCardProps {
  message: Message
  onEdit?: (message: Message) => void
}

const OfflineSummaryCard: React.FC<OfflineSummaryCardProps> = ({ message, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!message.offlineSummary) return null

  const { title, summary } = message.offlineSummary

  return (
    <div className="px-4 sm:px-8 py-2">
      <div className="max-w-2xl mx-auto">
        {/* 时间分隔线 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-xs text-gray-400">{message.time}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* 线下记录卡片 */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 relative group">
          {/* 标签和操作按钮 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-gray-600 text-white text-xs font-medium rounded">
                线下经历
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {isExpanded ? '收起' : '展开'}
                <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-white text-gray-600 text-xs rounded hover:bg-gray-100"
              >
                编辑
              </button>
            )}
          </div>

          {/* 标题 */}
          <h3 className="text-sm font-medium text-gray-800 mb-1">
            {title}
          </h3>

          {/* 摘要内容（可折叠） */}
          {isExpanded && (
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mt-2">
              {summary}
            </p>
          )}

          {/* 底部提示 */}
          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>此段经历已被AI记录并理解</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineSummaryCard
