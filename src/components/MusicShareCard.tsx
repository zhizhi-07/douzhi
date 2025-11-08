interface MusicShareCardProps {
  songTitle: string
  songArtist: string
  songCover?: string
  onClick?: () => void
}

const MusicShareCard = ({
  songTitle,
  songArtist,
  songCover,
  onClick
}: MusicShareCardProps) => {
  return (
    <div 
      className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden max-w-[280px] border border-white/20 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      {/* 卡片头部 */}
      <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-gray-100/50">
        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <span className="text-gray-800 font-medium text-sm">音乐分享</span>
      </div>

      {/* 歌曲信息 */}
      <div className="p-4">
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-100/50">
          {/* 封面 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {songCover ? (
              <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>

          {/* 歌曲详情 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{songTitle}</div>
            <div className="text-xs text-gray-500 truncate">{songArtist}</div>
          </div>

          {/* 音乐波纹动画 */}
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
        </div>

        {/* 提示文字 */}
        <div className="text-xs text-gray-400 text-center mt-2">
          点击查看详情
        </div>
      </div>
    </div>
  )
}

export default MusicShareCard
