import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import DynamicIsland from '../components/DynamicIsland'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { characterService } from '../services/characterService'

interface Song {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  audioUrl?: string
  lyrics?: string
}

const MusicPlayer = () => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [listeningTogether, setListeningTogether] = useState<any>(null)
  const [listeningDuration, setListeningDuration] = useState('')
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [customBackground, setCustomBackground] = useState<string>(() => {
    return localStorage.getItem('music_background') || ''
  })
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image')
  
  // 检查一起听状态和计算时长
  useEffect(() => {
    const loadListeningState = () => {
      const listeningData = localStorage.getItem('listening_together')
      if (listeningData) {
        const data = JSON.parse(listeningData)
        const character = characterService.getById(data.characterId)
        setListeningTogether({ ...data, character })
      }
    }
    
    loadListeningState()
    
    // 每秒更新一起听时长
    const updateDuration = () => {
      const listeningData = localStorage.getItem('listening_together')
      if (listeningData) {
        const data = JSON.parse(listeningData)
        const startTime = data.startTime || Date.now()
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        
        const hours = Math.floor(elapsed / 3600)
        const minutes = Math.floor((elapsed % 3600) / 60)
        const seconds = elapsed % 60
        
        if (hours > 0) {
          setListeningDuration(`${hours}小时${minutes}分钟`)
        } else if (minutes > 0) {
          setListeningDuration(`${minutes}分${seconds}秒`)
        } else {
          setListeningDuration(`${seconds}秒`)
        }
      }
    }
    
    updateDuration()
    const durationTimer = setInterval(updateDuration, 1000)
    
    // 监听切歌事件
    const handleChangeSong = async (e: Event) => {
      const { songTitle, songArtist } = (e as CustomEvent).detail
      console.log('🎵 收到切歌请求:', songTitle, songArtist)
      
      // 更新一起听状态
      loadListeningState()
      
      // 查找本地音乐库中是否有这首歌
      const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
      const foundSong = customSongs.find((song: any) => 
        song.title === songTitle && song.artist === songArtist
      )
      
      if (foundSong) {
        // 如果找到了，直接播放
        const index = customSongs.indexOf(foundSong)
        musicPlayer.setCurrentSong(foundSong, index)
        musicPlayer.play()
        console.log('✅ 已切换到:', songTitle)
      } else {
        // 没找到，跳转到音乐搜索并自动搜索
        console.log('⚠️ 本地未找到歌曲，跳转到搜索:', songTitle)
        navigate(`/music-search?q=${encodeURIComponent(songTitle + ' ' + songArtist)}`)
      }
    }
    
    window.addEventListener('change-song', handleChangeSong)
    
    return () => {
      clearInterval(durationTimer)
      window.removeEventListener('change-song', handleChangeSong)
    }
  }, [musicPlayer, navigate])

  // 处理背景上传
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomBackground(url)
      
      if (file.type.startsWith('video/')) {
        setBackgroundType('video')
      } else {
        setBackgroundType('image')
      }
      
      localStorage.setItem('musicPlayerBackground', url)
      localStorage.setItem('musicPlayerBackgroundType', file.type.startsWith('video/') ? 'video' : 'image')
    }
  }

  // 加载保存的背景
  useEffect(() => {
    const savedBg = localStorage.getItem('musicPlayerBackground')
    const savedType = localStorage.getItem('musicPlayerBackgroundType') as 'image' | 'video'
    if (savedBg) {
      setCustomBackground(savedBg)
      setBackgroundType(savedType || 'image')
    }
  }, [])

  // 从localStorage加载自定义歌曲
  const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
  const playlist: Song[] = customSongs

  // 初始化全局播放器
  useEffect(() => {
    if (playlist.length > 0 && !musicPlayer.currentSong) {
      musicPlayer.setPlaylist(playlist)
      musicPlayer.setCurrentSong(playlist[0], 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 使用全局播放器的状态
  const currentSong = musicPlayer.currentSong || playlist[0] || {
    id: 0,
    title: '暂无歌曲',
    artist: '请搜索或上传歌曲',
    album: '',
    duration: 0,
    cover: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23999" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60" fill="%23fff"%3E🎵%3C/text%3E%3C/svg%3E'
  }
  const isPlaying = musicPlayer.isPlaying
  const currentTime = musicPlayer.currentTime
  const duration = musicPlayer.duration
  const currentSongIndex = musicPlayer.currentIndex

  // 解析LRC格式歌词
  const parseLyricsWithTime = (lyricsText?: string): Array<{ time: number; text: string }> => {
    if (!lyricsText) return []
    
    const parsed = lyricsText
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
        return item !== null && item.text.trim() !== ''
      })
    
    return parsed.sort((a, b) => a.time - b.time)
  }

  const lyricsWithTime = currentSong?.lyrics ? parseLyricsWithTime(currentSong.lyrics) : []
  const parsedLyrics = lyricsWithTime.map(item => item.text)

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 播放控制
  const togglePlay = () => musicPlayer.togglePlay()
  const playPrevious = () => musicPlayer.previous()
  const playNext = () => musicPlayer.next()
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    musicPlayer.seek(parseFloat(e.target.value))
  }
  const selectSong = (index: number) => {
    musicPlayer.setCurrentSong(playlist[index], index)
    musicPlayer.play()
    setShowPlaylist(false)
  }

  // 唱片旋转动画
  useEffect(() => {
    let animationFrame: number
    if (isPlaying) {
      const rotate = () => {
        setRotation(prev => (prev + 0.5) % 360)
        animationFrame = requestAnimationFrame(rotate)
      }
      animationFrame = requestAnimationFrame(rotate)
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [isPlaying])

  // 歌词同步
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

  return (
    <>
      {/* 灵动岛 */}
      {currentSong && currentSong.id !== 0 && (
        <DynamicIsland
          isPlaying={isPlaying}
          currentSong={currentSong}
          onPlayPause={togglePlay}
          onNext={playNext}
          onPrevious={playPrevious}
          currentTime={currentTime}
          duration={duration || currentSong.duration}
        />
      )}
      
      <div className="h-screen flex flex-col relative overflow-hidden bg-white">
        <StatusBar />
      
      
      {/* 背景层 */}
      <div className="absolute inset-0 top-[44px]">
        {customBackground ? (
          backgroundType === 'video' ? (
            <video src={customBackground} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${customBackground})` }} />
          )
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
        <div className="absolute inset-0 bg-white/50" />
      </div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate('/', { replace: true })} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-medium text-gray-700">正在播放</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/music-search')} className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <label className="w-10 h-10 flex items-center justify-center cursor-pointer">
            <input type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          <button onClick={() => setShowPlaylist(!showPlaylist)} className="w-10 h-10 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 播放列表弹窗 */}
      {showPlaylist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowPlaylist(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">播放列表</h2>
                <button onClick={() => setShowPlaylist(false)} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-sm">暂无歌曲</p>
                  <p className="text-xs mt-1">去搜索或上传歌曲吧</p>
                </div>
              ) : (
                playlist.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => selectSong(index)}
                    className={`flex items-center gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                      index === currentSongIndex ? 'bg-red-50' : ''
                    }`}
                  >
                    <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className={`font-medium ${index === currentSongIndex ? 'text-red-500' : 'text-gray-900'}`}>{song.title}</div>
                      <div className="text-sm text-gray-500">{song.artist}</div>
                    </div>
                    {index === currentSongIndex && isPlaying && (
                      <div className="flex gap-1 items-end">
                        <div className="w-1 h-3 bg-red-500 rounded animate-pulse"></div>
                        <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-2 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start p-4 pt-8 overflow-y-auto">
        {/* 一起听头像显示 - 在唱片上方 */}
        {listeningTogether && (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-medium">
                  我
                </div>
              </div>
              <div className="w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden -ml-6">
                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white text-xl font-medium">
                  {listeningTogether.character?.avatar || listeningTogether.character?.realName?.[0] || 'AI'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              一起听了 <span className="font-medium text-gray-900">{listeningDuration}</span>
            </div>
          </div>
        )}
        
        {/* 唱片封面和歌词容器 */}
        <div className="relative mb-6 w-48 h-48 flex items-center justify-center">
          {/* 唱片盘 */}
          <div 
            className={`absolute transition-opacity duration-500 ${showLyrics ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setShowLyrics(true)}
          >
            <div className="relative w-48 h-48">
              <div 
                className="w-48 h-48 rounded-full backdrop-blur-md bg-white/20 shadow-2xl flex items-center justify-center cursor-pointer border-2 border-white/30"
                style={{ transform: `rotate(${rotation}deg)`, transition: isPlaying ? 'none' : 'transform 0.5s' }}
              >
                <div className="w-[170px] h-[170px] rounded-full overflow-hidden shadow-inner bg-white flex items-center justify-center">
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* 歌词显示 */}
          <div 
            className={`absolute transition-opacity duration-500 ${showLyrics ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowLyrics(false)}
          >
            <div className="w-48 h-48 flex items-center justify-center cursor-pointer">
              {parsedLyrics.length > 0 ? (
                <div className="w-full h-full overflow-hidden flex items-center">
                  <div className="w-full text-center space-y-2 px-4">
                    {Array.from({ length: 5 }, (_, i) => {
                      const lyricIndex = currentLyricIndex - 2 + i
                      const line = parsedLyrics[lyricIndex] || ''
                      const isCurrent = i === 2
                      return (
                        <p key={i} className={`text-sm transition-all duration-300 ${isCurrent ? 'text-gray-900 font-bold text-base scale-110' : 'text-gray-400 text-xs'}`}>
                          {line || '\u00A0'}
                        </p>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-sm">暂无歌词</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 歌曲信息和操作 */}
        <div className="w-full max-w-md mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{currentSong.title}</h2>
              <p className="text-gray-600 text-base">{currentSong.artist}</p>
            </div>
            <button onClick={() => setIsLiked(!isLiked)} className="w-10 h-10 flex items-center justify-center">
              <svg className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-md mb-5">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{ background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${(currentTime / duration) * 100}%, #E5E7EB ${(currentTime / duration) * 100}%, #E5E7EB 100%)` }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentSong.duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <button onClick={playPrevious} className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button onClick={togglePlay} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button onClick={playNext} className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>
      </div>


      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      </div>
    </>
  )
}

export default MusicPlayer
