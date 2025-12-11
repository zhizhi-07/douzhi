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
    <div className="px-4 sm:px-8 py-4">
      <div className="max-w-xl mx-auto">
        {/* 时间分隔线 - 极简风格 */}
        <div className="flex items-center justify-center gap-3 mb-4 opacity-40">
          <div className="w-8 h-px bg-gray-300"></div>
          <span className="text-[10px] font-serif text-gray-500 tracking-widest">{message.time}</span>
          <div className="w-8 h-px bg-gray-300"></div>
        </div>

        {/* 线下记录卡片 - 书签风格 */}
        <div className="bg-white rounded-[18px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative group transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          {/* 装饰：左侧强调线 */}
          <div className="absolute left-0 top-6 bottom-6 w-1 bg-gray-800 rounded-r"></div>

          {/* 标签和操作按钮 */}
          <div className="flex items-center justify-between mb-3 pl-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Offline Story</span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1 group/btn"
              >
                {isExpanded ? '收起' : '展开'}
                <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover/btn:translate-y-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 py-1 bg-gray-50 text-gray-500 text-[10px] rounded-full hover:bg-gray-100 hover:text-gray-900"
              >
                修订
              </button>
            )}
          </div>

          {/* 标题 */}
          <h3 className="text-base font-bold text-gray-800 mb-2 pl-4 font-serif tracking-wide leading-relaxed">
            {title}
          </h3>

          {/* 摘要内容 */}
          {isExpanded && (
            <div className="pl-4 mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-[13px] text-gray-600 leading-8 whitespace-pre-wrap font-serif text-justify">
                {summary}
              </p>
              
              {/* 底部提示 */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[10px] text-gray-300 italic">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>AI Story Memory</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineSummaryCard
