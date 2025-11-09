import { useState } from 'react'
import photoPlaceholder from '../assets/photo-placeholder.webp'

interface FlipPhotoCardProps {
  description: string
  messageId: number
  photoBase64?: string  // 真实图片的base64编码
}

const FlipPhotoCard = ({ description, photoBase64 }: FlipPhotoCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  
  // 如果有真实图片base64，使用真实图片；否则使用占位图
  const imageSrc = photoBase64 
    ? `data:image/jpeg;base64,${photoBase64}` 
    : photoPlaceholder

  return (
    <div 
      className="relative w-[200px] h-[200px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
        style={{ 
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 正面 - 真实图片 */}
        <div 
          className="absolute w-full h-full rounded-2xl overflow-hidden shadow-lg"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <img 
            src={imageSrc}
            alt="照片"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* 背面 - 文字描述 */}
        <div 
          className="absolute w-full h-full rounded-2xl shadow-lg bg-white p-4 overflow-y-auto flex items-center justify-center"
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
      </div>
    </div>
  )
}

export default FlipPhotoCard
