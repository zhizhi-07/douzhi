import { saveSong } from '../utils/musicStorage'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const UploadSong = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: ''
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [lyricsFile, setLyricsFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // 处理音频文件选择
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('请选择音频文件')
        return
      }
      setAudioFile(file)
      
      // 自动从文件名提取歌曲信息
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: fileName }))
      }
    }
  }

  // 处理封面文件选择
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      setCoverFile(file)
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    }
  }

  // 处理歌词文件选择
  const handleLyricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.lrc') && !file.type.startsWith('text/')) {
        alert('请选择LRC歌词文件或文本文件')
        return
      }
      setLyricsFile(file)
    }
  }

  // 处理上传
  const handleUpload = async () => {
    if (!audioFile || !formData.title || !formData.artist) {
      alert('请填写必填项并选择音频文件')
      return
    }

    setUploading(true)

    try {
      // 读取音频URL
      const audioUrl = URL.createObjectURL(audioFile)
      
      // 读取封面URL
      let coverUrl = coverPreview
      if (!coverUrl) {
        // 默认封面
        coverUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23667eea" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60" fill="%23fff"%3E🎵%3C/text%3E%3C/svg%3E'
      }
      
      // 读取歌词
      let lyrics = ''
      if (lyricsFile) {
        lyrics = await lyricsFile.text()
      }

      // 获取音频时长
      const audio = new Audio(audioUrl)
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', resolve, { once: true })
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); reject(new Error('无法读取音频，请选择有效文件')) }
        audio.load()
      })
      const duration = Math.floor(audio.duration)

      if (coverFile) {
        coverUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(coverFile)
        })
      }
      await saveSong({ title: formData.title, artist: formData.artist, album: formData.album || '未知专辑',
        duration, cover: coverUrl, audioBlob: audioFile, lyrics })
      URL.revokeObjectURL(audioUrl)

      alert('上传成功！')
      navigate('/music-player')
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/music-player', { replace: true })}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">上传歌曲</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 音频文件 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音频文件 <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
              />
              <div className="text-center">
                {audioFile ? (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{audioFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm text-gray-600">点击选择音频文件</p>
                    <p className="text-xs text-gray-400 mt-1">支持 MP3, WAV, FLAC 等格式</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* 歌曲信息 */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                歌曲名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：晴天"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                歌手 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                placeholder="例如：周杰伦"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专辑（可选）
              </label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                placeholder="例如：叶惠美"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 封面图片 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图片（可选）
            </label>
            <label className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">点击选择封面图片</p>
                  <p className="text-xs text-gray-400 mt-1">建议尺寸 300x300</p>
                </div>
              )}
            </label>
          </div>

          {/* 歌词文件 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              歌词文件（可选）
            </label>
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".lrc,text/*"
                onChange={handleLyricsChange}
                className="hidden"
              />
              <div className="text-center">
                {lyricsFile ? (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-1 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{lyricsFile.name}</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">点击选择LRC歌词文件</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* 上传按钮 */}
          <button
            onClick={handleUpload}
            disabled={!audioFile || !formData.title || !formData.artist || uploading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-4 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                上传中...
              </span>
            ) : (
              '上传歌曲'
            )}
          </button>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>提示：</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>歌曲文件会保存在浏览器本地存储中</li>
                  <li>LRC歌词格式：[mm:ss.xx]歌词内容</li>
                  <li>建议文件大小不超过10MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadSong
