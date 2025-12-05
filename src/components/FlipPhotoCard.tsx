import { useState } from 'react'
import photoPlaceholder from '../assets/photo-placeholder.webp'

interface FlipPhotoCardProps {
  description: string
  messageId: number
  photoBase64?: string  // 真实图片的base64编码
}

const FlipPhotoCard = ({ description, photoBase64 }: FlipPhotoCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  // 如果有真实图片base64，使用真实图片；否则使用占位图
  // photoBase64 可能是完整的 data URL 或纯 base64
  const imageSrc = photoBase64
    ? (photoBase64.startsWith('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`)
    : photoPlaceholder

  // 判断是否是真实照片（有photoBase64且不是占位图）
  const isRealPhoto = photoBase64 && photoBase64.length > 100

  const handleClick = () => {
    if (isRealPhoto) {
      // 真实照片：放大查看
      setShowFullImage(true)
    } else {
      // 描述照片：翻转看描述
      setIsFlipped(!isFlipped)
    }
  }

  return (
    <>
    <div
      className="relative max-w-[180px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={handleClick}
    >
      <div
        className={`relative w-full transition-transform duration-700 ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 正面 - 真实图片（保持原始比例） */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-lg"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <img
            src={imageSrc}
            alt="照片"
            className="w-full h-auto"
          />
        </div>

        {/* 背面 - 文字描述（只在非真实照片时显示） */}
        {!isRealPhoto && (
          <div
            className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-lg bg-white p-4 overflow-y-auto flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words text-center">
              {description}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 全屏查看大图 */}
    {showFullImage && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setShowFullImage(false)}
      >
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <img
            src={imageSrc}
            alt="照片"
            className="w-full h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white text-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={() => setShowFullImage(false)}
          >
            ×
          </button>
        </div>
      </div>
    )}
    </>
  )
}

export default FlipPhotoCard
