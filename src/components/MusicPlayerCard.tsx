import { useState, useEffect } from 'react'

interface MusicPlayerCardProps {
  currentSong?: {
    title: string
    artist: string
    cover?: string
  }
  isPlaying: boolean
  onTogglePlay?: () => void
  onNext?: () => void
  onClick?: () => void
}

const MusicPlayerCard: React.FC<MusicPlayerCardProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onClick
}) => {
  // 无音乐时也显示唱片
  const displaySong = currentSong || {
    title: '暂无播放音乐',
    artist: '点击选择音乐',
    cover: undefined
  }

  // 获取装饰框和颜色
  const [frameImage, setFrameImage] = useState<string | null>(
    localStorage.getItem('music_frame_image') || null
  )
  const [frameScale, setFrameScale] = useState<number>(
    parseFloat(localStorage.getItem('music_frame_scale') || '1')
  )
  const [framePosition, setFramePosition] = useState<{x: number, y: number}>(() => {
    const saved = localStorage.getItem('music_frame_position')
    return saved ? JSON.parse(saved) : {x: 0, y: 0}
  })
  const [discColor, setDiscColor] = useState<string>(
    localStorage.getItem('music_disc_color') || '#1a1a1a'
  )
  const [coverBgImage, setCoverBgImage] = useState<string | null>(
    localStorage.getItem('music_cover_bg_image') || null
  )

  // 监听装饰框更新
  useEffect(() => {
    const handleUpdate = () => {
      setFrameImage(localStorage.getItem('music_frame_image') || null)
      setFrameScale(parseFloat(localStorage.getItem('music_frame_scale') || '1'))
      const saved = localStorage.getItem('music_frame_position')
      setFramePosition(saved ? JSON.parse(saved) : {x: 0, y: 0})
      setDiscColor(localStorage.getItem('music_disc_color') || '#1a1a1a')
      setCoverBgImage(localStorage.getItem('music_cover_bg_image') || null)
    }
    window.addEventListener('musicFrameUpdate', handleUpdate)
    return () => window.removeEventListener('musicFrameUpdate', handleUpdate)
  }, [])

  console.log('MusicPlayerCard - isPlaying:', isPlaying)

  return (
    <div 
      className="w-full h-full rounded-full relative cursor-pointer"
      onClick={onClick}
    >
      {/* 唱片主体 */}
      <div 
        className="w-full h-full rounded-full relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${discColor}, ${discColor}dd, ${discColor}aa)`,
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.5)
          `,
          animation: isPlaying ? 'spin-slow 3s linear infinite' : 'none',
          willChange: isPlaying ? 'transform' : 'auto'
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

        {/* 封面区域 */}
        <div 
          className="relative rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: '65%',
            height: '65%',
            backgroundColor: coverBgImage ? 'transparent' : '#ffffff',
            backgroundImage: coverBgImage ? `url(${coverBgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {displaySong.cover && (
            <img
              src={displaySong.cover}
              alt={displaySong.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 高光效果 */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* 装饰框 */}
      {frameImage && (
        <img 
          src={frameImage}
          alt="装饰框"
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${framePosition.x}px), calc(-50% + ${framePosition.y}px)) scale(${frameScale})`,
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      )}
    </div>
  )
}

export default MusicPlayerCard
