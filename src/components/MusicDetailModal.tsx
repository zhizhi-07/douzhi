import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { searchOnlineMusic, getSongUrl, getLyric } from '../services/musicApi'

interface MusicDetailModalProps {
  songTitle: string
  songArtist: string
  songCover?: string
  isOpen: boolean
  onClose: () => void
}

const MusicDetailModal = ({
  songTitle,
  songArtist,
  songCover,
  isOpen,
  onClose
}: MusicDetailModalProps) => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  const [isClosing, setIsClosing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if (!isOpen && !isClosing) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* 弹窗内容 */}
      <div 
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 歌曲封面 */}
        <div className="relative h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400">
          {songCover ? (
            <img 
              src={songCover} 
              alt={songTitle} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-24 h-24 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* 歌曲信息 */}
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {songTitle}
          </h2>
          
          {/* 歌手 */}
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-lg">{songArtist}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                setIsSearching(true)
                try {
                  // 搜索歌曲
                  const query = `${songTitle} ${songArtist}`
                  console.log('搜索歌曲:', query)
                  const results = await searchOnlineMusic(query)
                  
                  if (results.length === 0) {
                    alert('未找到该歌曲，请尝试其他搜索方式')
                    setIsSearching(false)
                    return
                  }
                  
                  // 选择第一个结果
                  const song = results[0]
                  console.log('找到歌曲:', song)
                  
                  // 获取播放链接
                  const url = await getSongUrl(song.id)
                  if (!url) {
                    alert('无法获取播放链接，该歌曲可能暂时无法播放')
                    setIsSearching(false)
                    return
                  }
                  
                  // 获取歌词
                  const lyrics = await getLyric(song.id)
                  
                  // 创建播放对象
                  const playableSong = {
                    id: song.id,
                    title: song.name,
                    artist: song.artists,
                    album: song.album,
                    duration: song.duration,
                    cover: song.cover,
                    audioUrl: url,
                    lyrics: lyrics || undefined
                  }
                  
                  // 设置播放列表和当前歌曲
                  musicPlayer.setPlaylist([playableSong])
                  musicPlayer.setCurrentSong(playableSong, 0)
                  musicPlayer.play()
                  
                  console.log('开始播放:', playableSong.title)
                  
                  // 关闭弹窗
                  handleClose()
                  
                  // 跳转到播放器
                  setTimeout(() => {
                    navigate('/music-player')
                  }, 100)
                } catch (error) {
                  console.error('播放失败:', error)
                  alert('播放失败，请重试')
                } finally {
                  setIsSearching(false)
                }
              }}
              disabled={isSearching}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full py-3 px-6 font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  搜索中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  播放
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                // 复制歌曲信息
                const text = `${songTitle} - ${songArtist}`
                navigator.clipboard.writeText(text)
                alert('已复制歌曲信息')
              }}
              className="bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
            </button>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-gray-400 text-center mt-4">
            {isSearching ? '正在搜索歌曲...' : '点击播放按钮在线搜索并播放'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default MusicDetailModal
