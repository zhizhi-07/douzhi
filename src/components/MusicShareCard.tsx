

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
      className="message-bubble w-[200px] overflow-hidden cursor-pointer select-none"
      style={{ borderRadius: '12px' }}
      onClick={onClick}
    >
      <div className="p-3 flex items-center gap-3">
        {/* 封面图 */}
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {songCover ? (
            <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* 歌曲信息 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <h3 className="text-[13px] font-medium text-gray-900 truncate">{songTitle}</h3>
          <p className="text-[11px] text-gray-500 truncate">{songArtist}</p>
        </div>

        {/* 播放按钮 */}
        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* 底部来源标识 */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full bg-[#C20C0C] flex items-center justify-center">
          <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">音乐分享</span>
      </div>
    </div>
  )
}

export default MusicShareCard
