import { useState, useEffect } from 'react'
import { MusicIcon, HeartIcon, PlayIcon, PauseIcon, SkipForwardIcon } from './Icons'

interface MusicPlayerCardProps {
  currentSong?: {
    title: string
    artist: string
    cover?: string
  }
  isPlaying: boolean
  onTogglePlay: () => void
  onNext: () => void
  onClick?: () => void
}

const MusicPlayerCard: React.FC<MusicPlayerCardProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onClick
}) => {
  // 音乐背景
  const [musicBg, setMusicBg] = useState(() => {
    return localStorage.getItem('music_background') || ''
  })
  
  // 监听背景更新
  useEffect(() => {
    const handleBgUpdate = () => {
      setMusicBg(localStorage.getItem('music_background') || '')
    }
    window.addEventListener('musicBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('musicBackgroundUpdate', handleBgUpdate)
  }, [])
  if (!currentSong) {
    return (
      <div 
        className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative overflow-visible cursor-pointer mb-4 ios-button bg-cover bg-center"
        style={musicBg ? { backgroundImage: `url(${musicBg})` } : {}}
        onClick={onClick}
      >
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <MusicIcon size={32} className="mx-auto mb-2" />
            <div className="text-sm">暂无播放音乐</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative overflow-visible cursor-pointer mb-4 ios-button bg-cover bg-center"
      style={musicBg ? { backgroundImage: `url(${musicBg})` } : {}}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* 左侧：唱片 */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <div 
            className={`w-32 h-32 rounded-full backdrop-blur-md bg-white/20 shadow-2xl flex items-center justify-center border-2 border-white/30 ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
          >
            <div className="w-[115px] h-[115px] rounded-full overflow-hidden shadow-inner bg-white flex items-center justify-center">
              {currentSong.cover ? (
                <img
                  src={currentSong.cover}
                  alt={currentSong.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <MusicIcon size={32} className="text-blue-500" />
              )}
            </div>
          </div>
        </div>

        {/* 右侧：信息和控制 */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="text-lg font-bold text-gray-900 truncate">
            {currentSong.title}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {currentSong.artist}
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <HeartIcon size={18} className="text-red-500" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onTogglePlay()
              }}
              className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <PauseIcon size={18} className="text-gray-700" />
              ) : (
                <PlayIcon size={18} className="text-gray-700" />
              )}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <SkipForwardIcon size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MusicPlayerCard
