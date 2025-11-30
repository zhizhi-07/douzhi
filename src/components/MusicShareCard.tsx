

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
      className="group relative w-[260px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 select-none"
      onClick={onClick}
    >
      {/* 背景模糊效果 */}
      {songCover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08] blur-xl scale-150 saturate-150"
          style={{ backgroundImage: `url(${songCover})` }}
        />
      )}

      <div className="relative z-10 p-3 flex items-center gap-3">
        {/* 封面图 */}
        <div className="relative w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
            {songCover ? (
              <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 歌曲信息 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <h3 className="text-[13px] font-medium text-gray-900 truncate pr-2 leading-tight">{songTitle}</h3>
          <p className="text-[11px] text-gray-500 truncate">{songArtist}</p>
        </div>

        {/* 播放按钮 */}
        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* 底部来源标识 */}
      <div className="relative z-10 px-3 pb-2 flex items-center justify-between opacity-80">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-[#C20C0C] flex items-center justify-center shadow-sm">
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">音乐分享</span>
        </div>
      </div>
    </div>
  )
}

export default MusicShareCard
