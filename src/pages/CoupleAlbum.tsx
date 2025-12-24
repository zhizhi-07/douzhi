/**
 * 情侣空间 - 相册
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { getCouplePhotos, addCouplePhoto, deleteCouplePhoto, type CoupleAlbumPhoto } from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'
import { compressImage } from '../utils/imageCompression'

// Common icons (brown style)
const Icons = {
  Back: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Empty: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Manage: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

const CoupleAlbum = () => {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<CoupleAlbumPhoto[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [photoDescription, setPhotoDescription] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [isManageMode, setIsManageMode] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const allPhotos = await getCouplePhotos()
      setPhotos(allPhotos)
    } catch (error) {
      console.error('❌ 加载相册失败:', error)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setImageFile(file)

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeKB: 500
      })
      setSelectedImage(compressed)
    } catch (error) {
      console.error('❌ 图片压缩失败:', error)
      alert('图片处理失败，请重试')
    }
  }

  const handleUpload = async () => {
    if (!selectedImage) {
      alert('请选择照片')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    try {
      await addCouplePhoto(
        relation.characterId,
        '我',
        photoDescription.trim() || '（无文案）',
        selectedImage
      )

      setPhotoDescription('')
      setSelectedImage(null)
      setImageFile(null)
      setShowUploadModal(false)
      await loadPhotos()
      alert('照片已上传！')
    } catch (error) {
      console.error('❌ 上传失败:', error)
      alert(error instanceof Error ? error.message : '上传失败，请重试')
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return
    
    try {
      const success = await deleteCouplePhoto(photoId)
      if (success) {
        await loadPhotos()
      }
    } catch (error) {
      console.error('❌ 删除照片失败:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#fffbf5] font-sans text-[#5d4037]">
      {/* Header */}
      <div className="bg-[#fffbf5] z-10">
        <StatusBar />
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate('/couple-space')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] active:bg-[#e6dfd5] transition-colors text-[#8b7355]"
          >
            <Icons.Back className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-bold tracking-wider text-[#5d4037]">恋爱相册</h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsManageMode(!isManageMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] active:bg-[#e6dfd5] transition-colors ${isManageMode ? 'text-[#ff6b6b]' : 'text-[#8b7355]'}`}
            >
              <Icons.Manage className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] active:bg-[#e6dfd5] transition-colors text-[#8b7355]"
            >
              <Icons.Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-10">
        {photos.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-[60vh] text-[#c9b8a8] gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#c9b8a8] flex items-center justify-center bg-[#fff8f0]">
              <Icons.Empty className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-[#8b7355] mb-1">暂无照片</h2>
              <p className="text-sm">点击右上角上传甜蜜瞬间</p>
            </div>
          </div>
        ) : (
          /* Photo Grid - Polaroid Style */
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, idx) => {
              const rotation = (idx % 4 === 0 || idx % 4 === 3) ? -1 : 1
              const randomRot = rotation * ((idx % 3) + 1)
              
              return (
                <div 
                  key={photo.id} 
                  className="bg-white p-3 pb-8 shadow-md transform transition-all hover:scale-[1.02] hover:z-10 hover:rotate-0 relative group"
                  style={{ transform: `rotate(${randomRot}deg)` }}
                >
                  {/* Tape */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 backdrop-blur-sm border border-gray-200/50 shadow-sm opacity-60"></div>
                  
                  {/* Photo */}
                  <div className="aspect-square bg-gray-100 mb-3 overflow-hidden">
                    {photo.imageUrl ? (
                      <img src={photo.imageUrl} className="w-full h-full object-cover" alt="photo" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#c9b8a8]">
                        <Icons.Empty className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  {/* Caption */}
                  <div className="text-center">
                    <p className="font-serif text-sm text-[#5d4037] truncate px-1">
                      {photo.description || 'Sweet Memory'}
                    </p>
                    <p className="text-[10px] text-[#8b7355]/60 mt-1 font-mono">
                      {new Date(photo.timestamp).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  
                  {/* Delete Button (Manage Mode) */}
                  {isManageMode && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePhoto(photo.id)
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-[#ff6b6b] text-white rounded-full flex items-center justify-center shadow-md z-20"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div 
            className="absolute inset-0 bg-[#5d4037]/20 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[#fffbf5] rounded-3xl p-6 shadow-xl border-2 border-[#8b7355]/10 animate-slide-up">
            <h3 className="text-lg font-bold text-[#5d4037] mb-4 text-center tracking-wide">上传照片</h3>
            
            {/* Image Preview */}
            <div className="mb-4">
               {selectedImage ? (
                 <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden border-2 border-[#8b7355]/10">
                   <img src={selectedImage} className="w-full h-full object-cover" alt="preview" />
                   <button 
                     onClick={() => {
                       setSelectedImage(null)
                       setImageFile(null)
                     }}
                     className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center"
                   >
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>
               ) : (
                 <label className="flex flex-col items-center justify-center w-full aspect-square bg-[#fff] rounded-2xl border-2 border-dashed border-[#c9b8a8] cursor-pointer hover:bg-[#fcfcfc] transition-colors">
                    <div className="w-14 h-14 rounded-full bg-[#f5efe6] flex items-center justify-center text-[#8b7355] mb-2">
                      <Icons.Plus className="w-8 h-8" />
                    </div>
                    <span className="text-sm text-[#8b7355] font-medium">点击选择照片</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                 </label>
               )}
            </div>

            {/* Description Input */}
            <div className="mb-6 relative">
              <div className="absolute inset-0 border-2 border-[#8b7355]/10 rounded-2xl pointer-events-none"></div>
              <textarea
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="写下此刻的感受..."
                className="w-full px-4 py-3 bg-[#fff] rounded-2xl resize-none text-sm text-[#5d4037] placeholder-[#c9b8a8] focus:outline-none focus:ring-2 focus:ring-[#8b7355]/20 min-h-[80px] leading-relaxed"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#f5efe6] text-[#8b7355] font-bold text-sm hover:bg-[#e6dfd5] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedImage}
                className="flex-1 py-3 rounded-xl bg-[#8b7355] text-white font-bold text-sm shadow-md shadow-[#8b7355]/20 hover:bg-[#6d5a43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
