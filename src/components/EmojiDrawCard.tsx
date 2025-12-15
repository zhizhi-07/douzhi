/**
 * AI画的emoji/字符画展示卡片
 * 风格：模拟试卷题目效果
 */

interface EmojiDrawCardProps {
  content: string  // AI画的字符画内容
  characterName?: string
}

const EmojiDrawCard = ({ content, characterName = 'TA' }: EmojiDrawCardProps) => {
  return (
    <div className="w-64 bg-white/95 backdrop-blur-sm rounded-sm shadow-md border border-gray-300/80 relative overflow-hidden font-serif">
      {/* 试卷纹理背景 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* 顶部装订线效果 */}
      <div className="absolute top-0 left-0 w-full h-8 border-b-2 border-dashed border-gray-300 pointer-events-none"></div>
      <div className="absolute top-2 left-4 w-3 h-3 rounded-full border border-gray-300 bg-white z-10"></div>

      <div className="p-5 pt-8 relative z-0">
        {/* 题目区域 */}
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 inline-block">
            第一题
          </h3>
          <p className="text-xs text-gray-600 italic">
            请辨认下方字符画所表示的物品。（10分）
          </p>
        </div>
        
        {/* 画布区域 - 模拟答题框 */}
        <div className="mt-3 p-4 bg-white/50 border-2 border-gray-200 rounded-sm min-h-[120px] flex items-center justify-center relative">
          {/* 答题框角落标记 */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-gray-400"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-gray-400"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-gray-400"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-gray-400"></div>
          
          <pre className="text-center font-mono text-sm leading-tight whitespace-pre-wrap text-gray-800 select-none relative z-10">
            {content}
          </pre>
        </div>
        
        {/* 底部出题人 */}
        <div className="mt-3 text-right">
          <p className="text-[10px] text-gray-400">
            出题人：{characterName}
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmojiDrawCard
