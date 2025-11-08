import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react'

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

interface MusicPlayerContextType {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playlist: Song[]
  currentIndex: number
  setCurrentSong: (song: Song, index: number) => void
  setPlaylist: (songs: Song[]) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentSong, setCurrentSongState] = useState<Song | null>(null)
  const [playlist, setPlaylistState] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 初始化音频元素
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      
      // 监听时间更新
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      
      // 监听加载完成
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0)
      })
      
      // 监听播放结束
      audioRef.current.addEventListener('ended', () => {
        next()
      })
    }

    // 监听全局切歌事件
    const handleChangeSong = async (e: Event) => {
      const { songTitle, songArtist } = (e as CustomEvent).detail
      console.log('🎵 [全局] 收到切歌请求:', songTitle, songArtist)
      
      // 查找本地音乐库中是否有这首歌
      const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
      const foundSong = customSongs.find((song: Song) => 
        song.title === songTitle && song.artist === songArtist
      )
      
      if (foundSong) {
        // 找到了，直接播放
        const index = customSongs.indexOf(foundSong)
        setPlaylistState(customSongs)
        setCurrentSong(foundSong, index)
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true)
              console.log('✅ 已切换到:', songTitle)
            })
          }
        }, 100)
      } else {
        console.log('⚠️ 本地未找到歌曲，自动搜索:', songTitle, songArtist)
        // 没找到，自动搜索并播放
        try {
          const { searchOnlineMusic, getSongUrl } = await import('../services/musicApi')
          console.log('🔍 开始搜索:', `${songTitle} ${songArtist}`)
          const results = await searchOnlineMusic(`${songTitle} ${songArtist}`)
          console.log('🔍 搜索结果:', results)
          
          if (results && results.length > 0) {
            const song = results[0]
            console.log('📀 获取第一首歌曲:', song.name, song.artists)
            const audioUrl = await getSongUrl(song.id)
            console.log('🎵 获取播放链接:', audioUrl)
            
            const newSong: Song = {
              id: song.id,
              title: song.name,
              artist: song.artists,
              album: song.album || '',
              duration: song.duration,
              cover: song.cover,
              audioUrl: audioUrl || undefined
            }
            
            console.log('💾 保存到本地音乐库:', newSong)
            // 添加到本地音乐库
            customSongs.push(newSong)
            localStorage.setItem('customSongs', JSON.stringify(customSongs))
            
            // 播放
            console.log('🎶 准备播放...')
            setPlaylistState(customSongs)
            setCurrentSong(newSong, customSongs.length - 1)
            setTimeout(() => {
              if (audioRef.current && audioUrl) {
                console.log('▶️ 开始播放:', audioUrl)
                audioRef.current.play().then(() => {
                  setIsPlaying(true)
                  console.log('✅ 播放成功:', songTitle)
                }).catch(err => {
                  console.error('❌ 播放失败:', err)
                })
              } else {
                console.error('❌ audioRef或audioUrl不存在', { audioRef: !!audioRef.current, audioUrl })
              }
            }, 100)
          } else {
            console.log('❌ 未找到歌曲，搜索结果为空')
          }
        } catch (error) {
          console.error('❌ 搜索失败:', error)
        }
      }
    }
    
    window.addEventListener('change-song', handleChangeSong)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      window.removeEventListener('change-song', handleChangeSong)
    }
  }, [])

  // 设置当前歌曲
  const setCurrentSong = (song: Song, index: number) => {
    setCurrentSongState(song)
    setCurrentIndex(index)
    
    if (audioRef.current && song.audioUrl) {
      audioRef.current.src = song.audioUrl
      audioRef.current.load()
    }
  }

  // 设置播放列表
  const setPlaylist = (songs: Song[]) => {
    setPlaylistState(songs)
  }

  // 播放
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        console.error('播放失败:', err)
      })
    }
  }

  // 暂停
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // 切换播放/暂停
  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  // 下一曲
  const next = () => {
    if (playlist.length === 0) return
    const nextIndex = (currentIndex + 1) % playlist.length
    setCurrentSong(playlist[nextIndex], nextIndex)
    if (isPlaying) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
        }
      }, 100)
    }
  }

  // 上一曲
  const previous = () => {
    if (playlist.length === 0) return
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    setCurrentSong(playlist[prevIndex], prevIndex)
    if (isPlaying) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
        }
      }, 100)
    }
  }

  // 跳转
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // 设置音量
  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        playlist,
        currentIndex,
        setCurrentSong,
        setPlaylist,
        play,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  )
}

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  }
  return context
}
