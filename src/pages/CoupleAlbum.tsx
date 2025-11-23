/**
 * 情侣空间 - 相册
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import FlipPhotoCard from '../components/FlipPhotoCard'
import { getCouplePhotos, addCouplePhoto, type CoupleAlbumPhoto } from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'

const CoupleAlbum = () => {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<CoupleAlbumPhoto[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [photoDescription, setPhotoDescription] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = () => {
    const allPhotos = getCouplePhotos()
    setPhotos(allPhotos)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setImageFile(file)

    // 预览图片
    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    if (!selectedImage) {
      alert('请选择照片')
      return
    }

    if (!photoDescription.trim()) {
      alert('请输入文案')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    addCouplePhoto(
      relation.characterId,
      '我',
      photoDescription.trim(),
      selectedImage  // 传入base64图片
    )

    // 重置状态
    setPhotoDescription('')
    setSelectedImage(null)
    setImageFile(null)
    setShowUploadModal(false)
    loadPhotos()
    alert('照片已上传！')
  }

  const handleCancelUpload = () => {
    setPhotoDescription('')
    setSelectedImage(null)
    setImageFile(null)
    setShowUploadModal(false)
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate('/couple-space')}
            className="text-blue-500 ios-button"
          >
            返回
          </button>
          <h1 className="text-lg font-semibold text-gray-900">相册</h1>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="text-blue-500 ios-button"
          >
            上传
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        {photos.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="glass-card rounded-3xl p-8 text-center space-y-6 shadow-xl border border-white/20">
                <div className="w-24 h-24 mx-auto rounded-full glass-card flex items-center justify-center shadow-lg border border-white/30">
                  <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无照片</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    在聊天中让AI用 [相册:描述] 分享照片
                    <br />
                    记录每一个甜蜜时刻
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 照片列表 */
          <div className="grid grid-cols-2 gap-4 pb-6">
            {photos.map(photo => {
              const uploadTime = new Date(photo.timestamp)
              const timeString = uploadTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div key={photo.id} className="space-y-2">
                  {/* 照片显示 */}
                  <div className="flex justify-center">
                    {photo.imageUrl ? (
                      /* 真实照片 */
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg">
                        <img 
                          src={photo.imageUrl} 
                          alt={photo.description}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      /* 占位符卡片（兼容旧数据） */
                      <FlipPhotoCard 
                        description={photo.description}
                        messageId={photo.timestamp}
                      />
                    )}
                  </div>
                  
                  {/* 发布者和时间 */}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-gray-700">
                      {photo.uploaderName || photo.characterName}
                    </span>
                    <span className="text-xs text-gray-500">{timeString}</span>
                  </div>
                  
                  {/* 文案 */}
                  {photo.description && photo.description !== '（无文案）' && (
                    <div className="glass-card rounded-xl p-3 border border-white/20">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {photo.description}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 上传照片弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">上传照片</h3>
            
            {/* 图片选择区域 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">选择照片</label>
              {selectedImage ? (
                <div className="relative">
                  <img 
                    src={selectedImage} 
                    alt="预览" 
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null)
                      setImageFile(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white ios-button"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-500">点击选择照片</span>
                    <span className="text-xs text-gray-400 mt-1">支持JPG、PNG，最大5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 文案输入 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">文案</label>
              <textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="写下你想说的话..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelUpload}
                className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedImage || !photoDescription.trim()}
                className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoupleAlbum
