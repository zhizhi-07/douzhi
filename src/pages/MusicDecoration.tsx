import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const MusicDecoration = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [frameImage, setFrameImage] = useState<string | null>(
    localStorage.getItem('music_frame_image') || null
  )

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  const [scale, setScale] = useState<number>(
    parseFloat(localStorage.getItem('music_frame_scale') || '1')
  )
  const [position, setPosition] = useState<{x: number, y: number}>(() => {
    const saved = localStorage.getItem('music_frame_position')
    return saved ? JSON.parse(saved) : {x: 0, y: 0}
  })
  const [discColor, setDiscColor] = useState<string>(
    localStorage.getItem('music_disc_color') || '#1a1a1a'
  )
  const [coverBgImage, setCoverBgImage] = useState<string | null>(
    localStorage.getItem('music_cover_bg_image') || null
  )
  const [showColorPanel, setShowColorPanel] = useState(false)

  const handleDiscColorChange = (color: string) => {
    setDiscColor(color)
    localStorage.setItem('music_disc_color', color)
    window.dispatchEvent(new Event('musicFrameUpdate'))
  }

  const handleUploadCoverBg = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          localStorage.setItem('music_cover_bg_image', imageUrl)
          setCoverBgImage(imageUrl)
          window.dispatchEvent(new Event('musicFrameUpdate'))
          alert('封面背景已设置！')
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleRemoveCoverBg = () => {
    localStorage.removeItem('music_cover_bg_image')
    setCoverBgImage(null)
    window.dispatchEvent(new Event('musicFrameUpdate'))
    alert('封面背景已移除！')
  }

  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
    localStorage.setItem('music_frame_scale', newScale.toString())
    window.dispatchEvent(new Event('musicFrameUpdate'))
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...position, [axis]: value }
    setPosition(newPosition)
    localStorage.setItem('music_frame_position', JSON.stringify(newPosition))
    window.dispatchEvent(new Event('musicFrameUpdate'))
  }

  const handleUploadFrame = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          localStorage.setItem('music_frame_image', imageUrl)
          setFrameImage(imageUrl)
          window.dispatchEvent(new Event('musicFrameUpdate'))
          alert('装饰框已设置！')
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleRemoveFrame = () => {
    localStorage.removeItem('music_frame_image')
    setFrameImage(null)
    window.dispatchEvent(new Event('musicFrameUpdate'))
    alert('装饰框已移除！')
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* 合并的状态栏和导航栏 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <StatusBar />
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">音乐盘装饰</h1>
          <button
            onClick={() => setShowColorPanel(!showColorPanel)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 预览区域 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">预览效果</h2>
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              {/* 模拟音乐唱片 */}
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${discColor}, ${discColor}dd, ${discColor}aa)`,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div 
                    className="w-[65%] h-[65%] rounded-full overflow-hidden"
                    style={{ 
                      backgroundColor: coverBgImage ? 'transparent' : '#ffffff',
                      backgroundImage: coverBgImage ? `url(${coverBgImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </div>
              </div>
              
              {/* 装饰框预览 */}
              {frameImage && (
                <img 
                  src={frameImage}
                  alt="装饰框"
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* 调整控制 */}
        {frameImage && (
          <div className="mb-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">调整装饰</h2>
            
            {/* 缩放控制 */}
            <div>
              <label className="text-xs text-gray-600 mb-2 block">
                缩放: {scale.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="w-full accent-gray-800"
              />
            </div>

            {/* 水平位置 */}
            <div>
              <label className="text-xs text-gray-600 mb-2 block">
                水平位置: {position.x}px
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={position.x}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
                className="w-full accent-gray-800"
              />
            </div>

            {/* 垂直位置 */}
            <div>
              <label className="text-xs text-gray-600 mb-2 block">
                垂直位置: {position.y}px
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={position.y}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
                className="w-full accent-gray-800"
              />
            </div>

            {/* 重置按钮 */}
            <button
              onClick={() => {
                handleScaleChange(1)
                setPosition({x: 0, y: 0})
                localStorage.setItem('music_frame_position', JSON.stringify({x: 0, y: 0}))
                window.dispatchEvent(new Event('musicFrameUpdate'))
              }}
              className="w-full p-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:scale-95 transition-transform"
            >
              重置位置和缩放
            </button>
          </div>
        )}

        {/* 颜色自定义弹窗 */}
        {showColorPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowColorPanel(false)}>
            <div className="w-full bg-white rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">颜色自定义</h2>
              
              {/* 唱片外框颜色 */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  唱片外框颜色
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={discColor}
                    onChange={(e) => handleDiscColorChange(e.target.value)}
                    className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={discColor}
                    onChange={(e) => handleDiscColorChange(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>

              {/* 封面背景图片 */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  封面背景图片
                </label>
                <button
                  onClick={handleUploadCoverBg}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center gap-2 active:scale-95 transition-transform mb-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">上传封面背景</span>
                </button>
                {coverBgImage && (
                  <button
                    onClick={handleRemoveCoverBg}
                    className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium active:scale-95 transition-transform"
                  >
                    移除背景图片
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 上传图片 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">自定义装饰</h2>
          <button
            onClick={handleUploadFrame}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center gap-2 active:scale-95 transition-transform mb-3"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">上传装饰图片</p>
            <p className="text-xs text-gray-400">支持 PNG、JPG 格式，建议透明背景</p>
          </button>
          
          {frameImage && (
            <button
              onClick={handleRemoveFrame}
              className="w-full p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-medium active:scale-95 transition-transform"
            >
              移除装饰框
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MusicDecoration
