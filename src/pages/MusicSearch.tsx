import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { searchOnlineMusic, getSongUrl, getLyric, OnlineSong } from '../services/musicApi'

interface LocalSong {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  audioUrl?: string
  lyrics?: string
}

const MusicSearch = () => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [localResults, setLocalResults] = useState<LocalSong[]>([])
  const [onlineResults, setOnlineResults] = useState<OnlineSong[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local')
  const [showHistory, setShowHistory] = useState(true)

  // 加载搜索历史
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('musicSearchHistory') || '[]')
    setSearchHistory(history)
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('musicSearchHistory', JSON.stringify(newHistory))
  }

  // 搜索本地歌曲
  const searchLocal = (query: string) => {
    if (!query.trim()) {
      setLocalResults([])
      return
    }

    const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
    const keyword = query.toLowerCase()
    const results = customSongs.filter((song: LocalSong) => {
      return song.title.toLowerCase().includes(keyword) || 
             song.artist.toLowerCase().includes(keyword) ||
             song.album.toLowerCase().includes(keyword)
    })
    
    setLocalResults(results)
  }

  // 搜索在线歌曲
  const searchOnline = async (query: string) => {
    if (!query.trim()) {
      setOnlineResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchOnlineMusic(query)
      setOnlineResults(results)
    } catch (error) {
      console.error('在线搜索失败:', error)
      setOnlineResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 执行搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setShowHistory(false)
    saveSearchHistory(searchQuery)
    
    searchLocal(searchQuery)
    await searchOnline(searchQuery)
  }

  // 播放本地歌曲
  const playLocalSong = (song: LocalSong, index: number) => {
    musicPlayer.setPlaylist(localResults)
    musicPlayer.setCurrentSong(song, index)
    musicPlayer.play()
    
    setTimeout(() => {
      navigate('/music-player')
    }, 100)
  }

  // 播放在线歌曲
  const playOnlineSong = async (song: OnlineSong, index: number) => {
    try {
      if (song.fee === 1 || song.fee === 4) {
        alert('该歌曲为付费歌曲，无法在线播放')
        return
      }

      const url = await getSongUrl(song.id)
      if (!url) {
        alert('无法获取播放链接，可能是版权限制')
        return
      }

      const lyrics = await getLyric(song.id)

      const playerSong = {
        id: song.id,
        title: song.name,
        artist: song.artists,
        album: song.album,
        duration: song.duration,
        cover: song.cover,
        audioUrl: url,
        lyrics: lyrics || undefined
      }

      musicPlayer.setCurrentSong(playerSong, index)
      musicPlayer.play()
      
      setTimeout(() => {
        navigate('/music-player')
      }, 100)
    } catch (error) {
      console.error('播放失败:', error)
      alert('播放失败，请重试')
    }
  }

  // 添加在线歌曲到本地
  const addToLocal = async (song: OnlineSong) => {
    try {
      const url = await getSongUrl(song.id)
      const lyrics = await getLyric(song.id)

      if (!url) {
        alert('无法获取歌曲链接')
        return
      }

      const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
      const newSong = {
        id: Date.now(),
        title: song.name,
        artist: song.artists,
        album: song.album,
        duration: song.duration,
        cover: song.cover,
        audioUrl: url,
        lyrics: lyrics || undefined,
        isOnline: true
      }

      customSongs.push(newSong)
      localStorage.setItem('customSongs', JSON.stringify(customSongs))
      
      alert('已添加到播放列表')
    } catch (error) {
      console.error('添加失败:', error)
      alert('添加失败，请重试')
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 清除搜索历史
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('musicSearchHistory')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-nowrap">
          <button onClick={() => navigate('/music-player', { replace: true })} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 搜索框 */}
          <div className="flex-1 min-w-0 flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索歌曲、歌手"
              className="flex-1 min-w-0 bg-transparent outline-none text-gray-900 placeholder-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setLocalResults([])
                  setOnlineResults([])
                  setShowHistory(true)
                }}
                className="ml-2 flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          
          <button onClick={handleSearch} className="text-red-500 font-medium px-2 py-2 flex-shrink-0 whitespace-nowrap">
            搜索
          </button>
        </div>
      </div>

      {/* 搜索历史 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">搜索历史</h3>
            <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-gray-600">清除</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(item)
                  handleSearch()
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm hover:bg-gray-200"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 标签切换 */}
      {!showHistory && (
        <div className="bg-white border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === 'local' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500'
              }`}
            >
              本地歌曲 ({localResults.length})
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === 'online' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500'
              }`}
            >
              在线歌曲 ({onlineResults.length})
            </button>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div>
              <p className="text-gray-500 text-sm">搜索中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 本地歌曲结果 */}
            {activeTab === 'local' && (
              <div className="bg-white">
                {localResults.length > 0 ? (
                  localResults.map((song, index) => (
                    <div
                      key={song.id}
                      onClick={() => playLocalSong(song, index)}
                      className="flex items-center gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                    >
                      <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{song.title}</div>
                        <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                      </div>
                      <div className="text-xs text-gray-400">{formatTime(song.duration)}</div>
                    </div>
                  ))
                ) : searchQuery && !showHistory ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm">未找到本地歌曲</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* 在线歌曲结果 */}
            {activeTab === 'online' && (
              <div className="bg-white">
                {onlineResults.length > 0 ? (
                  onlineResults.map((song, index) => (
                    <div key={song.id} className="flex items-center gap-3 p-4 border-b border-gray-50">
                      <img src={song.cover} alt={song.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0" onClick={() => playOnlineSong(song, index)}>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 truncate">{song.name}</div>
                          {song.fee === 1 && <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">VIP</span>}
                          {song.fee === 4 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">付费</span>}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{song.artists}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToLocal(song)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : searchQuery && !showHistory ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">未找到在线歌曲</p>
                    <p className="text-xs mt-1">请检查网络连接或尝试其他关键词</p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MusicSearch
