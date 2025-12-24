/**
 * 五子棋结果卡片 - VS对战结果展示
 */

interface GomokuResultCardProps {
  userWin: boolean
  userName?: string
  userAvatar?: string
  aiName: string
  aiAvatar?: string
}

const GomokuResultCard = ({
  userWin,
  userName = '你',
  userAvatar,
  aiName,
  aiAvatar
}: GomokuResultCardProps) => {
  return (
    <div className="w-[280px] rounded-2xl overflow-hidden shadow-xl font-sans"
         style={{
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
         }}
    >
      {/* 标题 */}
      <div className="text-center py-2 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20">
        <span className="text-amber-300 text-xs tracking-[0.3em] font-bold">⚫ 五子连珠 ⚪</span>
      </div>

      {/* VS 对战区域 */}
      <div className="flex items-center justify-between px-6 py-5">
        {/* 用户方 */}
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg ${userWin ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-gray-500'}`}>
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {userName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-white text-xs mt-2 max-w-[60px] truncate">{userName}</span>
          <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${userWin ? 'bg-amber-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
            {userWin ? '胜' : '败'}
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600"
               style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.3)' }}>
            VS
          </div>
          <div className="flex gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-black border border-gray-600"></div>
            <div className="w-2 h-2 rounded-full bg-white border border-gray-400"></div>
          </div>
        </div>

        {/* AI方 */}
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg ${!userWin ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-gray-500'}`}>
            {aiAvatar ? (
              <img src={aiAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {aiName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-white text-xs mt-2 max-w-[60px] truncate">{aiName}</span>
          <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${!userWin ? 'bg-amber-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
            {!userWin ? '胜' : '败'}
          </div>
        </div>
      </div>

      {/* 结果文字 */}
      <div className="text-center pb-4">
        <span className={`text-sm font-bold ${userWin ? 'text-amber-300' : 'text-gray-400'}`}>
          {userWin ? '🎉 恭喜获胜！' : '再接再厉！'}
        </span>
      </div>

      {/* 底部装饰 */}
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
    </div>
  )
}

export default GomokuResultCard
