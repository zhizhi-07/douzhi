import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { saveImage, getImage } from '../utils/unifiedStorage'

const MusicDecoration = () => {
  const navigate = useNavigate()
  const [frameImage, setFrameImage] = useState<string | null>(null)
  const [coverBgImage, setCoverBgImage] = useState<string | null>(null)

  const [scale, setScale] = useState<number>(
    parseFloat(localStorage.getItem('music_frame_scale') || '1')
  )
  const [position, setPosition] = useState<{ x: number, y: number }>(() => {
    const saved = localStorage.getItem('music_frame_position')
    return saved ? JSON.parse(saved) : { x: 0, y: 0 }
  })
  const [discColor, setDiscColor] = useState<string>(
    localStorage.getItem('music_disc_color') || '#1a1a1a'
  )
  const [showColorPanel, setShowColorPanel] = useState(false)

  // 从IndexedDB加载图片
  useEffect(() => {
    const loadImages = async () => {
      const frame = await getImage('music_frame_image')
      const coverBg = await getImage('music_cover_bg_image')
      if (frame) setFrameImage(frame)
      if (coverBg) setCoverBgImage(coverBg)
    }
    loadImages()
  }, [])

  const handleDiscColorChange = (color: string) => {
    setDiscColor(color)
    localStorage.setItem('music_disc_color', color)
    window.dispatchEvent(new Event('musicFrameUpdate'))
  }

  const handleUploadCoverBg = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await saveImage('music_cover_bg_image', file)
          const imageUrl = URL.createObjectURL(file)
          setCoverBgImage(imageUrl)
          window.dispatchEvent(new Event('musicFrameUpdate'))
          alert('封面背景已设置！')
        } catch (error) {
          console.error('保存封面背景失败:', error)
          alert('保存失败，请重试')
        }
      }
    }
    input.click()
  }

  const handleRemoveCoverBg = async () => {
    try {
      await saveImage('music_cover_bg_image', '')
      setCoverBgImage(null)
      window.dispatchEvent(new Event('musicFrameUpdate'))
      alert('封面背景已移除！')
    } catch (error) {
      console.error('移除封面背景失败:', error)
    }
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
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await saveImage('music_frame_image', file)
          const imageUrl = URL.createObjectURL(file)
          setFrameImage(imageUrl)
          window.dispatchEvent(new Event('musicFrameUpdate'))
          alert('装饰框已设置！')
        } catch (error) {
          console.error('保存装饰框失败:', error)
          alert('保存失败，请重试')
        }
      }
    }
    input.click()
  }

  const handleRemoveFrame = async () => {
    try {
      await saveImage('music_frame_image', '')
      setFrameImage(null)
      window.dispatchEvent(new Event('musicFrameUpdate'))
      alert('装饰框已移除！')
    } catch (error) {
      console.error('移除装饰框失败:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5] relative overflow-hidden font-sans">
      
      <StatusBar />

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/decoration', { replace: true })}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800">音乐盘装饰</h1>
          </div>
        </div>

        <button
          onClick={() => setShowColorPanel(!showColorPanel)}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95 ${showColorPanel
              ? 'bg-slate-800 text-white shadow-lg scale-105'
              : 'bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60'
            }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        {/* 预览区域 */}
        <div className="mb-8 flex justify-center py-8">
          <div className="relative w-72 h-72">
            {/* 模拟音乐唱片 */}
            <div
              className="w-full h-full rounded-full transition-all duration-500"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${discColor}, ${discColor}dd, ${discColor}aa)`,
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset'
              }}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center">
                <div
                  className="w-[65%] h-[65%] rounded-full overflow-hidden bg-white/10 backdrop-blur-sm shadow-inner"
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
                className="absolute pointer-events-none select-none"
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

        {/* 控制面板 */}
        <div className="space-y-6">
          {frameImage ? (
            <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest">调整装饰</h2>
                <button
                  onClick={() => {
                    handleScaleChange(1)
                    setPosition({ x: 0, y: 0 })
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-800 transition-colors px-3 py-1 rounded-full bg-white/50 hover:bg-white/80"
                >
                  重置默认
                </button>
              </div>

              {/* 缩放控制 */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500 font-light">
                  <span>缩放</span>
                  <span className="font-mono">{scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                />
              </div>

              {/* 位置控制 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500 font-light">
                    <span>水平</span>
                    <span className="font-mono">{position.x}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={position.x}
                    onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500 font-light">
                    <span>垂直</span>
                    <span className="font-mono">{position.y}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={position.y}
                    onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-10 border border-white/50 shadow-sm text-center">
              <p className="text-sm text-slate-500 font-light">暂无装饰框</p>
              <p className="text-xs text-slate-400 mt-2 opacity-60">上传图片以开始自定义</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleUploadFrame}
              className="py-4 px-6 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-full border border-white/60 text-slate-700 text-sm font-medium transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              上传装饰
            </button>

            {frameImage && (
              <button
                onClick={handleRemoveFrame}
                className="py-4 px-6 bg-red-50/50 hover:bg-red-50/80 backdrop-blur-sm rounded-full border border-red-100/50 text-red-600 text-sm font-medium transition-all shadow-sm active:scale-95"
              >
                移除装饰
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 颜色自定义弹窗 */}
      {showColorPanel && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-end" onClick={() => setShowColorPanel(false)}>
          <div className="w-full bg-white/80 backdrop-blur-xl rounded-t-[40px] p-8 space-y-8 border-t border-white/50 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-slate-800">个性化</h2>
              <button onClick={() => setShowColorPanel(false)} className="p-2 rounded-full hover:bg-slate-100/50 transition-colors">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 唱片外框颜色 */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">唱片颜色</label>
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm ring-4 ring-white">
                  <input
                    type="color"
                    value={discColor}
                    onChange={(e) => handleDiscColorChange(e.target.value)}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={discColor}
                    onChange={(e) => handleDiscColorChange(e.target.value)}
                    className="w-full px-5 py-3 rounded-full bg-white/50 border border-white/60 text-sm font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>
            </div>

            {/* 封面背景图片 */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">封面背景</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleUploadCoverBg}
                  className="p-4 rounded-[24px] border border-dashed border-slate-300 bg-white/30 hover:bg-white/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="text-sm text-slate-600">更换背景</span>
                </button>
                {coverBgImage && (
                  <button
                    onClick={handleRemoveCoverBg}
                    className="p-4 rounded-[24px] bg-red-50/50 hover:bg-red-50 border border-red-100 text-red-600 text-sm transition-all active:scale-95"
                  >
                    移除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicDecoration
