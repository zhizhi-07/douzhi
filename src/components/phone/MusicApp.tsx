import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MusicAppProps {
  content: AIPhoneContent
  onBack?: () => void
}

const MusicApp = ({ content, onBack }: MusicAppProps) => {
  // 生成随机渐变背景
  const getGradient = (index: number) => {
    const gradients = [
      'bg-gradient-to-br from-pink-400 to-red-500',
      'bg-gradient-to-br from-purple-400 to-indigo-500',
      'bg-gradient-to-br from-blue-400 to-cyan-500',
      'bg-gradient-to-br from-green-400 to-emerald-500',
      'bg-gradient-to-br from-orange-400 to-yellow-500'
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative absolute inset-0">
      {/* 顶部标题栏 */}
      <div className="bg-white px-5 pt-4 pb-2 sticky top-0 z-[1000]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-[#FA233B] flex items-center gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回
          </button>
        </div>
        <h1 className="text-[34px] font-bold text-black tracking-tight mb-4">音乐</h1>
        <div className="flex items-center gap-6 border-b border-gray-200 pb-2">
          <span className="text-[17px] font-semibold text-black border-b-2 border-[#FA233B] pb-2">资料库</span>
          <span className="text-[17px] text-gray-500 pb-2">浏览</span>
          <span className="text-[17px] text-gray-500 pb-2">广播</span>
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className="flex-1 overflow-y-auto bg-white px-5 pb-24">
        <h2 className="text-[22px] font-bold text-black mt-4 mb-3">最近添加</h2>
        <div className="space-y-1">
          {content.musicPlaylist.map((song, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0 active:bg-gray-50 transition-colors"
            >
              {/* 专辑封面占位 */}
              <div className={`w-12 h-12 rounded-[6px] ${getGradient(index)} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-medium text-black truncate">{song.title}</div>
                <div className="text-[13px] text-gray-500 truncate mt-0.5">
                  {song.artist} {song.mood ? `· ${song.mood}` : ''}
                </div>
                {/* 听歌感受 */}
                {song.feeling && (
                  <div className="text-[11px] text-gray-400 mt-1 leading-relaxed italic">
                    「{song.feeling}」
                  </div>
                )}
              </div>

              <button className="p-2 text-[#FA233B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="19" cy="12" r="1" fill="currentColor" />
                  <circle cx="5" cy="12" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 底部迷你播放器 */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-2 flex items-center gap-3 border border-gray-100/50 z-20">
        <div className={`w-10 h-10 rounded-[6px] ${getGradient(0)} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-black truncate">正在播放</div>
          <div className="text-[12px] text-gray-500 truncate">点击继续播放</div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
        </div>
      </div>
    </div>
  )
}

export default MusicApp
