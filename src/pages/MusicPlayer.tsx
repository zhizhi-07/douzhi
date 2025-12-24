import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import StatusBar from '../components/StatusBar'
import { getImage } from '../utils/unifiedStorage'
import '../css/music-player.css'
import DynamicIsland from '../components/DynamicIsland'
import { characterService } from '../services/characterService'
import { getUserInfoWithAvatar } from '../utils/userUtils'
import { getAllUIIcons } from '../utils/iconStorage'
import { Shuffle, Repeat, Repeat1, ListOrdered, Upload, Music, FileText, Image, X } from 'lucide-react'
import { getAllSongs, saveSong, deleteSong as deleteStoredSong, migrateFromLocalStorage, Song } from '../utils/musicStorage'

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
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    artist: '',
    audioFile: null as File | null,
    lyricsFile: null as File | null,
    coverFile: null as File | null,
    audioPreview: '',
    coverPreview: '',
    audioUrl: '' // 链接上传
  })
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const audioInputRef = useRef<HTMLInputElement>(null)
  const lyricsInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // 加载用户头像
  useEffect(() => {
    const loadUserAvatar = async () => {
      const userInfo = await getUserInfoWithAvatar()
      if (userInfo.avatar) setUserAvatar(userInfo.avatar)
    }
    loadUserAvatar()
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
      const bg = await getImage('music_bg')
      if (bg) {
        setCustomBackground(bg)
      } else {
        try {
          const icons = await getAllUIIcons()
          if (icons['menu-music']) setCustomBackground(icons['menu-music'])
        } catch (error) {
          console.error(error)
        }
      }
    }
    loadMusicBg()
    const handleBgUpdate = async () => {
      const bg = await getImage('music_bg')
      setCustomBackground(bg || '')
    }
    window.addEventListener('musicBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('musicBackgroundUpdate', handleBgUpdate)
  }, [])

  // 检查一起听状态
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
    const updateDuration = () => {
      const listeningData = localStorage.getItem('listening_together')
      if (listeningData) {
        const data = JSON.parse(listeningData)
        const character = characterService.getById(data.characterId)
        setListeningTogether({ ...data, character })
        const startTime = data.startTime || Date.now()
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const hours = Math.floor(elapsed / 3600)
        const minutes = Math.floor((elapsed % 3600) / 60)
        const seconds = elapsed % 60
        if (hours > 0) setListeningDuration(`${hours}小时${minutes}分钟`)
        else if (minutes > 0) setListeningDuration(`${minutes}分${seconds}秒`)
        else setListeningDuration(`${seconds}秒`)
      }
    }
    updateDuration()
    const durationTimer = setInterval(updateDuration, 1000)

    // 监听切歌
    const handleChangeSong = async (e: Event) => {
      const { songTitle, songArtist } = (e as CustomEvent).detail
      loadListeningState()
      const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
      const foundSong = customSongs.find((song: any) => song.title === songTitle && song.artist === songArtist)
      if (foundSong) {
        const index = customSongs.indexOf(foundSong)
        musicPlayer.setCurrentSong(foundSong, index)
        musicPlayer.play()
      } else {
        navigate(`/music-search?q=${encodeURIComponent(songTitle + ' ' + songArtist)}`)
      }
    }
    window.addEventListener('change-song', handleChangeSong)
    return () => {
      clearInterval(durationTimer)
      window.removeEventListener('change-song', handleChangeSong)
    }
  }, [musicPlayer, navigate])

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomBackground(url)
      setBackgroundType(file.type.startsWith('video/') ? 'video' : 'image')
      localStorage.setItem('musicPlayerBackground', url)
      localStorage.setItem('musicPlayerBackgroundType', file.type.startsWith('video/') ? 'video' : 'image')
    }
  }

  useEffect(() => {
    const savedBg = localStorage.getItem('musicPlayerBackground')
    const savedType = localStorage.getItem('musicPlayerBackgroundType') as 'image' | 'video'
    if (savedBg) {
      setCustomBackground(savedBg)
      setBackgroundType(savedType || 'image')
    }
  }, [])

  const [playlist, setPlaylist] = useState<Song[]>([])

  // 加载歌曲列表（从 IndexedDB + 链接歌曲）
  useEffect(() => {
    const loadSongs = async () => {
      // 先迁移旧数据
      await migrateFromLocalStorage()
      // 加载 IndexedDB 歌曲
      const songs = await getAllSongs()
      // 加载链接歌曲
      const urlSongs = JSON.parse(localStorage.getItem('customSongs_url') || '[]')
      const allSongs = [...songs, ...urlSongs]
      setPlaylist(allSongs)
      if (allSongs.length > 0 && !musicPlayer.currentSong) {
        musicPlayer.setPlaylist(allSongs)
        musicPlayer.setCurrentSong(allSongs[0], 0)
      }
    }
    loadSongs()
  }, [])

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

  const parseLyricsWithTime = (lyricsText?: string): Array<{ time: number; text: string }> => {
    if (!lyricsText) return []
    const parsed = lyricsText.split('\n').map(line => {
      // 支持多种格式: [01:23.45], [01:23.456], [01:23:45], [01:23]
      const match = line.match(/\[(\d+):(\d+)(?:[.:](\d+))?\](.*)/)
      if (match) {
        const minutes = parseInt(match[1])
        const seconds = parseInt(match[2])
        const ms = match[3] ? parseInt(match[3]) : 0
        // 处理毫秒：如果是2位就院10，3位就除100
        const milliseconds = match[3] ? (match[3].length === 2 ? ms * 10 : ms) : 0
        const text = match[4].trim()
        const time = minutes * 60 + seconds + milliseconds / 1000
        return { time, text }
      }
      return null
    }).filter((item): item is { time: number; text: string } => item !== null && item.text.trim() !== '')
    return parsed.sort((a, b) => a.time - b.time)
  }

  const lyricsWithTime = currentSong?.lyrics ? parseLyricsWithTime(currentSong.lyrics) : []
  const parsedLyrics = lyricsWithTime.map(item => item.text)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = () => musicPlayer.togglePlay()
  const playPrevious = () => musicPlayer.previous()
  const playNext = () => musicPlayer.next()
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => musicPlayer.seek(parseFloat(e.target.value))
  const selectSong = (index: number) => {
    musicPlayer.setCurrentSong(playlist[index], index)
    // 等待音频加载后再播放
    setTimeout(() => {
      musicPlayer.play()
    }, 100)
    setShowPlaylist(false)
  }

  const handleDeleteSong = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    if (!confirm('确定要删除这首歌吗？')) return
    const songToDelete = playlist[index]
    
    // 判断是IndexedDB歌曲还是URL歌曲
    const urlSongs = JSON.parse(localStorage.getItem('customSongs_url') || '[]')
    const isUrlSong = urlSongs.some((s: any) => s.id === songToDelete.id)
    
    if (isUrlSong) {
      // 从 localStorage 删除
      const newUrlSongs = urlSongs.filter((s: any) => s.id !== songToDelete.id)
      localStorage.setItem('customSongs_url', JSON.stringify(newUrlSongs))
    } else {
      // 从 IndexedDB 删除
      await deleteStoredSong(songToDelete.id)
    }
    
    const newPlaylist = playlist.filter((_, i) => i !== index)
    setPlaylist(newPlaylist)
    if (index === currentSongIndex) {
      if (newPlaylist.length > 0) {
        const nextIndex = index < newPlaylist.length ? index : 0
        musicPlayer.setCurrentSong(newPlaylist[nextIndex], nextIndex)
      } else {
        musicPlayer.pause()
      }
    } else if (index < currentSongIndex) {
      musicPlayer.setCurrentSong(currentSong!, currentSongIndex - 1)
    }
    musicPlayer.setPlaylist(newPlaylist)
  }

  // 处理上传歌曲
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      // 尝试从文件名提取歌名和歌手
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      const parts = fileName.split(' - ')
      setUploadForm(prev => ({
        ...prev,
        audioFile: file,
        audioPreview: url,
        title: prev.title || (parts.length > 1 ? parts[0] : fileName),
        artist: prev.artist || (parts.length > 1 ? parts[1] : '')
      }))
    }
  }

  const handleLyricsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, lyricsFile: file }))
    }
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUploadForm(prev => ({ ...prev, coverFile: file, coverPreview: url }))
    }
  }

  const handleUploadSong = async () => {
    // 文件上传模式
    if (uploadMode === 'file') {
      if (!uploadForm.audioFile || !uploadForm.title.trim()) {
        alert('请上传歌曲文件并填写歌名')
        return
      }
    } else {
      // 链接上传模式
      if (!uploadForm.audioUrl.trim() || !uploadForm.title.trim()) {
        alert('请填写音频链接和歌名')
        return
      }
    }

    // 读取歌词文件为文本
    const readFileAsText = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })
    }

    // 读取封面为base64（封面图片小，用base64没问题）
    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    try {
      let lyricsText = ''
      let coverBase64 = ''

      if (uploadForm.lyricsFile) {
        lyricsText = await readFileAsText(uploadForm.lyricsFile)
      }

      if (uploadForm.coverFile) {
        coverBase64 = await readFileAsBase64(uploadForm.coverFile)
      }

      const songId = Date.now()
      const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23667" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60" fill="%23fff"%3E🎵%3C/text%3E%3C/svg%3E'

      if (uploadMode === 'file' && uploadForm.audioFile) {
        // 文件上传 - 保存到 IndexedDB
        const audioUrl = URL.createObjectURL(uploadForm.audioFile)
        const audio = new Audio(audioUrl)
        await new Promise(resolve => {
          audio.onloadedmetadata = resolve
        })

        await saveSong({
          id: songId,
          title: uploadForm.title.trim(),
          artist: uploadForm.artist.trim() || '未知歌手',
          album: '',
          duration: audio.duration,
          cover: coverBase64 || defaultCover,
          audioBlob: uploadForm.audioFile,
          lyrics: lyricsText
        })
      } else {
        // 链接上传 - 保存到 localStorage（链接不占空间）
        const audio = new Audio(uploadForm.audioUrl.trim())
        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = resolve
          audio.onerror = () => reject(new Error('无法加载音频链接'))
          setTimeout(() => reject(new Error('加载超时')), 10000)
        })

        const customSongs = JSON.parse(localStorage.getItem('customSongs_url') || '[]')
        customSongs.push({
          id: songId,
          title: uploadForm.title.trim(),
          artist: uploadForm.artist.trim() || '未知歌手',
          album: '',
          duration: audio.duration,
          cover: coverBase64 || defaultCover,
          audioUrl: uploadForm.audioUrl.trim(),
          lyrics: lyricsText
        })
        localStorage.setItem('customSongs_url', JSON.stringify(customSongs))
      }

      // 重新加载歌曲列表
      const songs = await getAllSongs()
      // 合并链接歌曲
      const urlSongs = JSON.parse(localStorage.getItem('customSongs_url') || '[]')
      const allSongs = [...songs, ...urlSongs]
      setPlaylist(allSongs)
      musicPlayer.setPlaylist(allSongs)

      // 重置表单
      setUploadForm({
        title: '',
        artist: '',
        audioFile: null,
        lyricsFile: null,
        coverFile: null,
        audioPreview: '',
        coverPreview: '',
        audioUrl: ''
      })
      setShowUploadModal(false)

      alert('上传成功！')
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    }
  }

  useEffect(() => {
    if (lyricsWithTime.length > 0) {
      let index = 0
      for (let i = 0; i < lyricsWithTime.length; i++) {
        if (currentTime >= lyricsWithTime[i].time) index = i
        else break
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

      <div className="h-screen flex flex-col relative overflow-hidden text-gray-800 font-sans soft-page-enter" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <StatusBar theme="dark" />

        {/* 顶部导航 */}
        <div className="relative z-10 px-4 pt-3 pb-2 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" transform="rotate(90 12 12)" /></svg>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-base font-medium text-gray-800">
              {currentSong.title}
            </span>
            <span className="text-xs text-gray-500">{currentSong.artist}</span>
          </div>
          <button onClick={() => navigate('/music-search')} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>

        {/* 播放列表弹窗 */}
        {showPlaylist && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowPlaylist(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
            <div className="relative w-full bg-gray-900/90 backdrop-blur-2xl rounded-t-[20px] max-h-[70vh] overflow-hidden text-white shadow-2xl transform transition-transform duration-300 ease-out p-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-6" />
              <div className="px-6 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">播放列表 <span className="text-sm font-normal text-white/50 ml-1">({playlist.length})</span></h2>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-100px)] px-2 pb-8">
                {playlist.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => selectSong(index)}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${index === currentSongIndex ? 'bg-white/10 text-red-500' : 'hover:bg-white/5 text-white'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-[15px] truncate ${index === currentSongIndex ? 'text-red-400' : 'text-white'}`}>{song.title}</div>
                      <div className="text-[12px] text-white/40 truncate mt-0.5">{song.artist}</div>
                    </div>
                    <button onClick={(e) => handleDeleteSong(e, index)} className="p-2 text-white/20 hover:text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 核心显示区：唱片 / 歌词 */}
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden" onClick={() => setShowLyrics(!showLyrics)}>

          {/* 中间容器 */}
          <div className="flex-1 flex flex-col items-center justify-center relative w-full min-h-0">

            {/* 1. 唱片视图 */}
            <div className={`relative flex-1 w-full flex flex-col items-center justify-center transition-opacity duration-500 ${showLyrics ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>

              {/* 黑胶盘 */}
              <div className="relative">
                {/* 🔥 阴影层：固定不旋转 */}
                <div className="absolute inset-0 w-[220px] h-[220px] rounded-full" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)' }} />
                {/* 旋转的唱片 */}
                <div className={`w-[220px] h-[220px] rounded-full vinyl-disc flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                  {/* 纹理层 */}
                  <div className="absolute inset-0 rounded-full vinyl-texture" />
                  {/* 封面 */}
                  <div className="w-[150px] h-[150px] rounded-full overflow-hidden border-[5px] border-[#181818]">
                    <img src={currentSong.cover} className="w-full h-full object-cover" alt="cover" />
                  </div>
                </div>
              </div>

              {/* 一起听 - 胶囊悬浮显示 */}
              {listeningTogether && (
                <div className="mt-20 flex items-center justify-center animate-fade-in-up">
                  <div className="flex items-center gap-[-8px] bg-black/20 backdrop-blur-md pl-1 pr-3 py-1.5 rounded-full border border-white/10">
                    <div className="flex items-center -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white/80 shadow-lg overflow-hidden relative z-10">
                        <img src={userAvatar} alt="Me" className="w-full h-full object-cover bg-gray-300" />
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-white/80 shadow-lg overflow-hidden relative z-0">
                        <img src={listeningTogether.character?.avatar} alt="Ta" className="w-full h-full object-cover bg-gray-300" />
                      </div>
                    </div>
                    <div className="ml-5 flex flex-col items-start justify-center">
                      <span className="text-[10px] text-white/60 leading-none mb-1">一起听</span>
                      <span className="text-xs font-bold text-white leading-none font-mono tracking-wide">{listeningDuration}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        const data = listeningTogether
                        localStorage.removeItem('listening_together')
                        setListeningTogether(null)
                        setListeningDuration('')
                        // 派发结束一起听事件，通知聊天系统
                        window.dispatchEvent(new CustomEvent('end-listening-together', {
                          detail: {
                            characterId: data?.characterId,
                            songTitle: data?.songTitle,
                            songArtist: data?.songArtist,
                            duration: listeningDuration
                          }
                        }))
                      }}
                      className="ml-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. 歌词视图 */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showLyrics ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full h-[80%] overflow-y-auto px-8 text-center scroll-smooth lyric-mask">
                <div className="py-[50%] space-y-6">
                  {parsedLyrics.length > 0 ? (
                    parsedLyrics.map((line, i) => {
                      const isCurrent = i === currentLyricIndex
                      return (
                        <p key={i} className={`transition-all duration-300 ${isCurrent ? 'text-gray-800 text-lg font-bold' : 'text-gray-400 text-sm'}`}>
                          {line}
                        </p>
                      )
                    })
                  ) : (
                    <p className="text-gray-400">暂无歌词</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 底部操作区 */}
        <div className="relative z-10 px-6 pb-8 space-y-6">

          {/* 功能按钮行：喜欢 / 下载 / 评论 / 更多 */}
          <div className="flex items-center justify-between px-8">
            <button onClick={() => setIsLiked(!isLiked)} className={`${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}>
              <svg className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
            <button onClick={() => setShowUploadModal(true)} className="text-gray-500 hover:text-gray-700">
              <Upload className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentSong.duration)}</span>
            </div>
            <div className="relative h-1 w-full bg-gray-200 rounded-full group cursor-pointer">
              <input
                type="range" min="0" max={duration} value={currentTime} onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="absolute top-0 left-0 h-full bg-gray-800 rounded-full" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-10">
            <button 
              className={`relative p-2 rounded-full hover:bg-black/5 transition-colors ${musicPlayer.playMode === 'repeat-all' ? 'text-gray-800' : musicPlayer.playMode === 'shuffle' ? 'text-green-600' : musicPlayer.playMode === 'repeat-one' ? 'text-blue-600' : 'text-gray-400'}`}
              onClick={() => musicPlayer.togglePlayMode()}
              title={musicPlayer.playMode === 'repeat-all' ? '列表循环' : musicPlayer.playMode === 'repeat-one' ? '单曲循环' : musicPlayer.playMode === 'shuffle' ? '随机播放' : '顺序播放'}
            >
              {musicPlayer.playMode === 'shuffle' ? (
                <Shuffle className="w-6 h-6" strokeWidth={2} />
              ) : musicPlayer.playMode === 'repeat-one' ? (
                <Repeat1 className="w-6 h-6" strokeWidth={2} />
              ) : musicPlayer.playMode === 'sequence' ? (
                <ListOrdered className="w-6 h-6" strokeWidth={2} />
              ) : (
                <Repeat className="w-6 h-6" strokeWidth={2} />
              )}
            </button>
            <button className="text-gray-700 hover:text-gray-900" onClick={playPrevious}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors" onClick={togglePlay}>
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button className="text-gray-700 hover:text-gray-900" onClick={playNext}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowPlaylist(true)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* 上传歌曲弹窗 */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowUploadModal(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div 
              className="relative w-full bg-white rounded-t-[20px] max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
              
              {/* 标题栏 */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => setShowUploadModal(false)} className="text-gray-400">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold">上传歌曲</h2>
                <button 
                  onClick={handleUploadSong}
                  className="text-blue-500 font-medium"
                >
                  完成
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-80px)]">
                {/* 上传模式切换 */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploadMode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    本地文件
                  </button>
                  <button
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploadMode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    链接上传
                  </button>
                </div>

                {/* 歌曲来源 */}
                {uploadMode === 'file' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      歌曲文件 <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center gap-3 ${
                        uploadForm.audioFile 
                          ? 'border-green-300 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      <Music className="w-6 h-6" />
                      <span className="text-sm">
                        {uploadForm.audioFile ? uploadForm.audioFile.name : '点击选择音频文件'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      音频链接 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.audioUrl}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                      placeholder="请输入音频直链 (mp3/m4a/wav等)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">支持 mp3、m4a、wav 等格式的直链</p>
                  </div>
                )}

                {/* 歌名输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    歌名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="请输入歌名"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                {/* 歌手输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">歌手</label>
                  <input
                    type="text"
                    value={uploadForm.artist}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, artist: e.target.value }))}
                    placeholder="请输入歌手名"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                {/* 封面上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">封面图片（可选）</label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors ${
                      uploadForm.coverFile 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {uploadForm.coverPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={uploadForm.coverPreview} alt="封面预览" className="w-16 h-16 rounded-lg object-cover" />
                        <span className="text-sm text-green-700">已选择封面</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 text-gray-500">
                        <Image className="w-6 h-6" />
                        <span className="text-sm">点击选择封面图片</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* 歌词上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">歌词文件（可选，.lrc格式）</label>
                  <input
                    ref={lyricsInputRef}
                    type="file"
                    accept=".lrc,.txt"
                    onChange={handleLyricsSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => lyricsInputRef.current?.click()}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center gap-3 ${
                      uploadForm.lyricsFile 
                        ? 'border-green-300 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">
                      {uploadForm.lyricsFile ? uploadForm.lyricsFile.name : '点击选择歌词文件'}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center pt-2">
                  支持 MP3、WAV、FLAC 等常见音频格式<br/>
                  歌词支持 .lrc 格式（带时间轴）
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default MusicPlayer
