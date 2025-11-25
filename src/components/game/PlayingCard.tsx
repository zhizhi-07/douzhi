import React, { memo } from 'react'

interface Card {
  suit: 'spade' | 'heart' | 'diamond' | 'club' | 'joker'
  rank: number
  id: string
}

interface PlayingCardProps {
  card?: Card // 支持传入整个 card 对象
  suit?: 'spade' | 'heart' | 'diamond' | 'club' | 'joker' // 或单独传入
  rank?: number // 3-15 (14=A, 15=2), 16=Small Joker, 17=Big Joker
  selected?: boolean
  hidden?: boolean // 是否显示背面
  isLandlord?: boolean // 是否是地主牌（右上角角标）
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
  scale?: number // 新增：整体缩放比例
}

const PlayingCard: React.FC<PlayingCardProps> = memo(({ 
  card,
  suit: suitProp, 
  rank: rankProp, 
  selected = false, 
  hidden = false, 
  isLandlord = false,
  onClick,
  style,
  className = '',
  scale = 1
}) => {
  // 支持两种传参方式
  const suit = card?.suit ?? suitProp ?? 'spade'
  const rank = card?.rank ?? rankProp ?? 3
  const isRed = suit === 'heart' || suit === 'diamond' || (suit === 'joker' && rank === 17)
  
  // 基础尺寸
  const BASE_WIDTH = 105
  const BASE_HEIGHT = 150
  
  // 转换显示文本
  const getRankText = (r: number, s: string) => {
    if (s === 'joker') return r === 17 ? '大\n王' : '小\n王'
    if (r <= 10) return r.toString()
    if (r === 11) return 'J'
    if (r === 12) return 'Q'
    if (r === 13) return 'K'
    if (r === 14) return 'A'
    if (r === 15) return '2'
    return ''
  }

  const getSuitSymbol = (s: string) => {
    switch (s) {
      case 'spade': return '♠'
      case 'heart': return '♥'
      case 'diamond': return '♦'
      case 'club': return '♣'
      default: return ''
    }
  }

  const rankText = getRankText(rank, suit)
  const suitSymbol = getSuitSymbol(suit)

  // 牌背纹理（经典蓝白格纹）
  if (hidden) {
    return (
      <div 
        className={`relative rounded-lg shadow-lg select-none overflow-hidden bg-[#3b82f6] border border-white/20 ${className}`}
        style={{
          width: BASE_WIDTH * scale,
          height: BASE_HEIGHT * scale,
          ...style // 允许外部覆盖宽高用于占位，但内容会按 scale 缩放
        }}
      >
        {/* 内部内容容器，始终保持原始尺寸，通过 transform 缩放 */}
        <div style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: `
            repeating-linear-gradient(45deg, #1e40af 25%, transparent 25%, transparent 75%, #1e40af 75%, #1e40af),
            repeating-linear-gradient(45deg, #1e40af 25%, #2563eb 25%, #2563eb 75%, #1e40af 75%, #1e40af)
          `,
          backgroundPosition: '0 0, 10px 10px',
          backgroundSize: '20px 20px',
        }}>
           <div className="absolute inset-2 border-2 border-white/30 rounded-md opacity-50" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-white/10 rounded-full blur-xl" />
           </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg select-none transition-transform duration-100 ${className}`}
      style={{
        width: BASE_WIDTH * scale,
        height: BASE_HEIGHT * scale,
        cursor: 'pointer',
        transform: selected ? 'translateY(-20px)' : 'translateY(0)',
        ...style
      }}
    >
      {/* 缩放容器 */}
      <div style={{
         width: BASE_WIDTH,
         height: BASE_HEIGHT,
         transform: `scale(${scale})`,
         transformOrigin: 'top left',
         backgroundColor: '#fdfbf7', // 暖白色纸张
         boxShadow: selected 
           ? '0 0 0 3px #fbbf24, 0 10px 20px rgba(0,0,0,0.2)' 
           : '1px 1px 3px rgba(0,0,0,0.2), inset 0 0 2px rgba(0,0,0,0.1)',
         border: '1px solid #d1d5db',
         borderRadius: '8px',
         position: 'relative',
         overflow: 'hidden'
      }}>
          {/* 地主标识 */}
          {isLandlord && (
            <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500 shadow-sm z-10 rounded-bl-lg flex items-center justify-center">
              <span className="text-xs font-bold text-red-900">地</span>
            </div>
          )}

          {/* 左上角：数字+花色 */}
          <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${isRed ? 'text-[#dc2626]' : 'text-[#111827]'}`}>
            <span className={`font-bold tracking-tighter ${suit === 'joker' ? 'text-base writing-vertical-rl mt-1' : 'text-2xl'}`} style={{ fontFamily: 'Times New Roman, serif' }}>
              {rankText}
            </span>
            {suit !== 'joker' && (
              <span className="text-xl mt-0.5">{suitSymbol}</span>
            )}
          </div>

          {/* 中央大花色/人物 */}
          <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'text-[#dc2626]' : 'text-[#111827]'}`}>
            {suit === 'joker' ? (
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-serif ${rank === 17 ? 'text-red-600' : 'text-black'}`}>
                  {rank === 17 ? '👑' : '🃏'}
                </span>
                <span className="text-xs font-bold mt-2 tracking-widest opacity-60">JOKER</span>
              </div>
            ) : (
              <span className="text-6xl opacity-90">{suitSymbol}</span>
            )}
          </div>

          {/* 右下角（倒转） */}
          {suit !== 'joker' && (
            <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-[#dc2626]' : 'text-[#111827]'}`}>
              <span className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Times New Roman, serif' }}>{rankText}</span>
              <span className="text-xl mt-0.5">{suitSymbol}</span>
            </div>
          )}
      </div>
    </div>
  )
})

export default PlayingCard
