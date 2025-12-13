/**
 * AI画的emoji/字符画展示卡片
 * 类似画板的视觉效果，不是普通文字气泡
 */

interface EmojiDrawCardProps {
  content: string  // AI画的字符画内容
  characterName?: string
}

const EmojiDrawCard = ({ content, characterName = 'TA' }: EmojiDrawCardProps) => {
  return (
    <div className="w-64 rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* 画板头部 */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-gray-600">{characterName} 的画</span>
      </div>
      
      {/* 画布区域 - 模拟画板效果 */}
      <div className="p-4 bg-[#fefefe] min-h-[120px] flex items-center justify-center">
        <pre className="text-center font-mono text-sm leading-tight whitespace-pre-wrap text-gray-800 select-none">
          {content}
        </pre>
      </div>
      
      {/* 底部提示 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">猜猜这是什么？</p>
      </div>
    </div>
  )
}

export default EmojiDrawCard
