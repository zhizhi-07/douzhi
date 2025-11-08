import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface DynamicIslandProps {
  isPlaying: boolean
  currentSong: {
    title: string
    artist: string
    cover: string
    lyrics?: string
  } | null
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  currentTime: number
  duration: number
}

const DynamicIsland = ({
  isPlaying,
  currentSong,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  duration
}: DynamicIslandProps) => {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)

  // 解析LRC格式歌词，保留时间信息
  const parseLyricsWithTime = (lyricsText?: string): Array<{ time: number; text: string }> => {
    if (!lyricsText) return []
    
    return lyricsText
      .split('\n')
      .map(line => {
        const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
        if (match) {
          const minutes = parseInt(match[1])
          const seconds = parseInt(match[2])
          const milliseconds = parseInt(match[3])
          const text = match[4].trim()
          const time = minutes * 60 + seconds + milliseconds / 1000
          return { time, text }
        }
        return null
      })
      .filter((item): item is { time: number; text: string } => {
        if (!item || !item.text) return false
        const text = item.text
        if (text.includes('作词') || text.includes('作曲')) return false
        if (text.includes('编曲') || text.includes('制作')) return false
        if (text.includes('混音') || text.includes('录音')) return false
        if (text.includes('母带') || text.includes('监制')) return false
        if (text.includes('发行') || text.includes('企划')) return false
        if (text.includes('封面') || text.includes('钢琴')) return false
        if (text.includes('吉他') || text.includes('贝斯')) return false
        if (text.includes('鼓') || text.includes('弦乐')) return false
        if (text.includes('No Label Crew')) return false
        if (text.includes('本歌曲来自') || text.includes('营销推广')) return false
        if (text.includes('青云') || text.includes('LAB')) return false
        return true
      })
      .sort((a, b) => a.time - b.time)
  }

  // 获取解析后的歌词
  const lyricsWithTime = parseLyricsWithTime(currentSong?.lyrics)
  const lyrics = lyricsWithTime.map(item => item.text)
  
  // 歌词根据LRC时间轴精确同步
  useEffect(() => {
    if (lyricsWithTime.length > 0) {
      let index = 0
      for (let i = 0; i < lyricsWithTime.length; i++) {
        if (currentTime >= lyricsWithTime[i].time) {
          index = i
        } else {
          break
        }
      }
      setCurrentLyricIndex(index)
    }
  }, [currentTime, lyricsWithTime])

  // 点击灵动岛
  const handleClick = () => {
    if (isExpanded) {
      // 如果已展开，点击返回音乐播放器
      navigate('/music-player')
    } else {
      // 展开灵动岛
      setIsExpanded(true)
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentSong) return null

  return (
    <>
      {/* 灵动岛 - 收起状态 */}
      <div
        className={`fixed top-2 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ${
          isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClick}
      >
        <div className="bg-black rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg cursor-pointer hover:scale-105 transition-transform w-[150px]">
          {/* 封面 */}
          <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
          </div>
          
          {/* 歌词滚动 */}
          <div className="overflow-hidden flex-1">
            <div className="text-white text-xs whitespace-nowrap">
              {lyrics[currentLyricIndex] || currentSong.title}
            </div>
          </div>

          {/* 播放状态 */}
          <div className="flex items-center gap-0.5">
            {isPlaying ? (
              <>
                <div className="w-0.5 h-2 bg-white rounded animate-pulse"></div>
                <div className="w-0.5 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-0.5 h-1.5 bg-white rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </>
            ) : (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 灵动岛 - 展开状态背景遮罩 */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* 灵动岛 - 展开状态 */}
      <div
        className={`fixed top-2 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="bg-black rounded-3xl p-4 w-[320px] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部信息 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={currentSong.cover}
                alt={currentSong.title}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{currentSong.title}</div>
              <div className="text-gray-400 text-sm truncate">{currentSong.artist}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 歌词显示 */}
          {lyrics.length > 0 && (
            <div className="mb-3 h-16 overflow-hidden flex items-center justify-center">
              <div className="text-center space-y-1">
                {lyrics.slice(Math.max(0, currentLyricIndex - 1), currentLyricIndex + 2).map((line, index) => (
                  <p
                    key={index}
                    className={`text-sm transition-all duration-300 ${
                      index === 1 ? 'text-white font-medium text-base' : 'text-gray-500 text-xs'
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 进度条 */}
          <div className="mb-3">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrevious()
              }}
              className="text-white hover:scale-110 transition-transform"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlayPause()
              }}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className="text-white hover:scale-110 transition-transform"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* 点击返回提示 */}
          <div className="text-center mt-3">
            <button
              onClick={handleClick}
              className="text-gray-400 text-xs hover:text-white transition-colors"
            >
              点击返回播放器
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-marquee {
          animation: marquee 10s linear infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </>
  )
}

export default DynamicIsland
