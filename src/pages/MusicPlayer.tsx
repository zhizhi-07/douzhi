import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import StatusBar from '../components/StatusBar'
import { getImage } from '../utils/unifiedStorage'
import '../css/music-player.css'
import DynamicIsland from '../components/DynamicIsland'
import { characterService } from '../services/characterService'
import { getUserInfoWithAvatar } from '../utils/userUtils'
import { getAllUIIcons } from '../utils/iconStorage'

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
  const [customBackground, setCustomBackground] = useState<string>('')
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image')
  const [userAvatar, setUserAvatar] = useState<string>('')

  // 加载用户头像（异步从IndexedDB）
  useEffect(() => {
    const loadUserAvatar = async () => {
      const userInfo = await getUserInfoWithAvatar()
      if (userInfo.avatar) {
        setUserAvatar(userInfo.avatar)
      }
    }
    loadUserAvatar()
    
    // 监听用户信息更新
    const handleUserInfoUpdate = () => { loadUserAvatar() }
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)
    window.addEventListener('storage', handleUserInfoUpdate)
    
    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
      window.removeEventListener('storage', handleUserInfoUpdate)
    }
  }, [])

  // 加载音乐背景
  useEffect(() => {
    const loadMusicBg = async () => {
      // 优先使用音乐专用背景
      const bg = await getImage('music_bg')
      if (bg) {
        setCustomBackground(bg)
      } else {
        // 如果没有音乐专用背景，尝试使用功能背景
        try {
          const icons = await getAllUIIcons()
          if (icons['menu-music']) {
            setCustomBackground(icons['menu-music'])
          }
        } catch (error) {
          console.error('加载音乐功能背景失败:', error)
        }
      }
    }
    loadMusicBg()

    // 监听背景更新事件
    const handleBgUpdate = async () => {
      const bg = await getImage('music_bg')
      if (bg) {
        setCustomBackground(bg)
      } else {
        try {
          const icons = await getAllUIIcons()
          if (icons['menu-music']) {
            setCustomBackground(icons['menu-music'])
          } else {
            setCustomBackground('')
          }
        } catch (error) {
          setCustomBackground('')
        }
      }
    }
    window.addEventListener('musicBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('musicBackgroundUpdate', handleBgUpdate)
  }, [])

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
        // 🔥 每次更新时重新获取最新的角色信息（包括头像）
        const character = characterService.getById(data.characterId)
        setListeningTogether({ ...data, character })

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

  // 删除歌曲
  const deleteSong = (e: React.MouseEvent, index: number) => {
    e.stopPropagation() // 阻止冒泡，避免触发播放

    if (!confirm('确定要删除这首歌吗？')) {
      return
    }

    const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
    customSongs.splice(index, 1)
    localStorage.setItem('customSongs', JSON.stringify(customSongs))

    // 如果删除的是当前播放的歌曲
    if (index === currentSongIndex) {
      if (customSongs.length > 0) {
        // 播放下一首（如果有的话）
        const nextIndex = index < customSongs.length ? index : 0
        musicPlayer.setCurrentSong(customSongs[nextIndex], nextIndex)
      } else {
        // 没有歌曲了，停止播放
        musicPlayer.pause()
      }
    } else if (index < currentSongIndex) {
      // 如果删除的歌曲在当前播放歌曲之前，需要调整索引
      musicPlayer.setCurrentSong(currentSong!, currentSongIndex - 1)
    }

    // 刷新播放列表
    window.location.reload()
  }

  // 唱片旋转动画
  useEffect(() => {
    let animationFrame: number
    if (isPlaying) {
      const rotate = () => {
        setRotation(prev => (prev + 0.3) % 360)
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

      <div className="h-screen flex flex-col relative overflow-hidden bg-gray-50 text-gray-900" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <StatusBar theme="light" />

        {/* 背景层 - 轻盈毛玻璃风格 */}
        <div className="absolute inset-0 top-0 z-0">
          {customBackground ? (
            backgroundType === 'video' ? (
              <video src={customBackground} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover opacity-30" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${customBackground})` }} />
            )
          ) : (
            // 默认使用歌曲封面作为背景
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 scale-110"
              style={{ backgroundImage: `url(${currentSong.cover})` }}
            />
          )}
          {/* 叠加高亮毛玻璃和渐变 */}
          <div className="absolute inset-0 backdrop-blur-[50px] bg-white/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/40 to-white/80" />
        </div>

        {/* 顶部导航栏 */}
        <div className="relative z-10 px-4 pt-2 pb-2 flex items-center justify-between flex-shrink-0">
          <button onClick={() => navigate('/', { replace: true })} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" transform="rotate(90 12 12)" />
            </svg>
          </button>

          {/* 顶部中间 - 一起听状态或应用名 */}
          <div className="flex flex-col items-center">
            {listeningTogether ? (
              <div className="flex flex-col items-center animate-fade-in">
                <span className="text-base font-medium text-gray-800">一起听</span>
              </div>
            ) : (
              <span className="text-base font-medium text-gray-800 opacity-90">Music</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/music-search')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <label className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full hover:bg-black/5 transition-colors">
              <input type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
          </div>
        </div>

        {/* 播放列表弹窗 */}
        {showPlaylist && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowPlaylist(false)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div className="relative w-full bg-white/90 backdrop-blur-xl rounded-t-3xl max-h-[70vh] overflow-hidden text-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">播放列表 <span className="text-sm font-normal text-gray-500">({playlist.length})</span></h2>
                  <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center">×</button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {playlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm">暂无歌曲</p>
                  </div>
                ) : (
                  playlist.map((song, index) => (
                    <div
                      key={song.id}
                      onClick={() => selectSong(index)}
                      className={`flex items-center gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-black/5 ${index === currentSongIndex ? 'text-red-500' : 'text-gray-900'
                        }`}
                    >
                      <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                        {index === currentSongIndex && isPlaying && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-0.5">
                            <div className="w-0.5 h-3 bg-red-500 rounded animate-music-bar-1"></div>
                            <div className="w-0.5 h-4 bg-red-500 rounded animate-music-bar-2"></div>
                            <div className="w-0.5 h-2 bg-red-500 rounded animate-music-bar-3"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${index === currentSongIndex ? 'text-red-500' : 'text-gray-900'}`}>{song.title}</div>
                        <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                      </div>
                      <button
                        onClick={(e) => deleteSong(e, index)}
                        className="p-2 hover:text-red-500 text-gray-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6 overflow-hidden">

          {/* 头像显示 - 两个头像连线 */}
          <div className="w-full flex items-center justify-center mb-2 relative h-14 flex-shrink-0">
            {listeningTogether ? (
              <div className="relative w-full max-w-[200px] flex items-center justify-between">
                {/* 左侧头像 (我) */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} alt="我" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">我</div>
                    )}
                  </div>
                </div>

                {/* 中间连接动画 */}
                <div className="absolute left-0 right-0 top-6 flex items-center justify-center px-12">
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500 to-transparent w-1/2 h-full animate-shimmer-slide"></div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                    <span className="text-[10px] text-gray-600 whitespace-nowrap font-mono">{listeningDuration}</span>
                  </div>
                </div>

                {/* 右侧头像 (对方) */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden">
                    {listeningTogether.character?.avatar ? (
                      <img src={listeningTogether.character.avatar} alt={listeningTogether.character.realName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {listeningTogether.character?.realName?.[0] || 'AI'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // 普通模式：只显示我的头像
              <div className="w-14 h-14 rounded-full border-2 border-white shadow-lg overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="我" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">我</div>
                )}
              </div>
            )}
          </div>

          {/* 唱片封面和歌词容器 */}
          <div className="w-full flex items-center justify-center flex-1 min-h-0 max-h-[340px] relative">

            {/* 唱片盘 */}
            <div
              className={`transition-all duration-500 ease-out ${showLyrics ? 'opacity-0 scale-90 pointer-events-none absolute' : 'opacity-100 scale-100'}`}
              onClick={() => setShowLyrics(true)}
            >
              <div className="relative w-56 h-56">
                {/* 唱片整体 - 黑胶唱片风格 */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isPlaying ? 'none' : 'transform 0.5s',
                    background: 'radial-gradient(circle at 30% 30%, #2a2a2a, #1a1a1a, #0a0a0a)',
                  }}
                >
                  {/* 唱片纹理 - 同心圆 */}
                  <div className="absolute inset-0 rounded-full" style={{
                    background: `repeating-radial-gradient(
                    circle at center,
                    transparent 0px,
                    transparent 2px,
                    rgba(255, 255, 255, 0.03) 2px,
                    rgba(255, 255, 255, 0.03) 4px
                  )`
                  }} />

                  {/* 专辑封面 - 居中小圆 */}
                  <div className="w-[55%] h-[55%] rounded-full overflow-hidden bg-gray-100 relative z-10 shadow-inner">
                    <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                  </div>

                  {/* 高光效果 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-20"></div>
                </div>
              </div>
            </div>

            {/* 歌词显示 */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${showLyrics ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
              onClick={() => setShowLyrics(false)}
            >
              <div className="w-full h-full flex items-center justify-center cursor-pointer">
                {parsedLyrics.length > 0 ? (
                  <div className="w-full h-[320px] overflow-hidden flex flex-col items-center justify-center mask-image-linear-gradient">
                    <div className="w-full text-center space-y-6 px-4">
                      {Array.from({ length: 5 }, (_, i) => {
                        const lyricIndex = currentLyricIndex - 2 + i
                        const line = parsedLyrics[lyricIndex] || ''
                        const isCurrent = i === 2
                        return (
                          <p key={i} className={`transition-all duration-700 font-serif tracking-widest ${isCurrent
                            ? 'text-gray-900 text-xl scale-105 drop-shadow-sm font-medium'
                            : 'text-gray-400/60 text-sm blur-[0.5px]'
                            }`}>
                            {line || '\u00A0'}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm">纯音乐，请欣赏</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部信息和控制区 */}
          <div className="w-full mt-4 space-y-4 px-2 pb-4 flex-shrink-0">
            {/* 歌曲信息 - 文艺排版 */}
            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <h2 className="text-2xl font-serif text-gray-900 tracking-wide leading-relaxed drop-shadow-sm">{currentSong.title}</h2>
              <div className="flex items-center gap-2">
                <span className="h-[1px] w-8 bg-gray-400/50"></span>
                <p className="text-gray-600 text-xs uppercase tracking-[0.3em] font-light">{currentSong.artist}</p>
                <span className="h-[1px] w-8 bg-gray-400/50"></span>
              </div>
            </div>

            {/* 进度条 - 极简线条 */}
            <div className="w-full">
              <div className="group relative w-full h-6 flex items-center cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                {/* 轨道 */}
                <div className="w-full h-[2px] bg-gray-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                  {/* 进度 */}
                  <div
                    className="h-full bg-gray-800/80 rounded-full relative transition-all duration-300"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity scale-0 group-hover:scale-100 duration-200"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400/80 font-serif tracking-widest -mt-1 px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || currentSong.duration)}</span>
              </div>
            </div>

            {/* 控制按钮 - 玻璃拟态 */}
            <div className="flex items-center justify-between">
              {/* 喜欢按钮 */}
              <button onClick={() => setIsLiked(!isLiked)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <svg className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <div className="flex items-center gap-6">
                <button onClick={playPrevious} className="w-12 h-12 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors hover:scale-105 active:scale-95">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-xl flex items-center justify-center text-gray-900 hover:bg-white/60 hover:scale-105 active:scale-95 transition-all duration-300 group">
                  {isPlaying ? (
                    <svg className="w-6 h-6 group-hover:text-gray-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-1 group-hover:text-gray-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button onClick={playNext} className="w-12 h-12 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors hover:scale-105 active:scale-95">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* 播放列表按钮 */}
              <button onClick={() => setShowPlaylist(!showPlaylist)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        @keyframes shimmer-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .animate-shimmer-slide {
            animation: shimmer-slide 2s infinite;
        }
        @keyframes music-bar-1 {
            0%, 100% { height: 40%; }
            50% { height: 80%; }
        }
        @keyframes music-bar-2 {
            0%, 100% { height: 60%; }
            50% { height: 100%; }
        }
        @keyframes music-bar-3 {
            0%, 100% { height: 30%; }
            50% { height: 70%; }
        }
        .animate-music-bar-1 { animation: music-bar-1 1s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar-2 0.8s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar-3 1.2s ease-in-out infinite; }
      `}</style>
    </>
  )
}

export default MusicPlayer
