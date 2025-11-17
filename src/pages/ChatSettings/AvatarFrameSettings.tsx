/**
 * 头像框设置组件
 */

import { useState } from 'react'

interface AvatarFrameSettingsProps {
  chatId: string
  onSaved: () => void
}

const AvatarFrameSettings = ({ chatId, onSaved }: AvatarFrameSettingsProps) => {
  // 从localStorage读取已保存的头像框设置
  const [userFrameCSS, setUserFrameCSS] = useState(() => 
    localStorage.getItem(`user_avatar_frame_${chatId}`) || ''
  )
  const [aiFrameCSS, setAiFrameCSS] = useState(() => 
    localStorage.getItem(`ai_avatar_frame_${chatId}`) || ''
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewUserCSS, setPreviewUserCSS] = useState(userFrameCSS)
  const [previewAiCSS, setPreviewAiCSS] = useState(aiFrameCSS)
  
  // 头像形状设置
  const [avatarShape, setAvatarShape] = useState(() => 
    localStorage.getItem(`avatar_shape_${chatId}`) || 'rounded'
  )
  
  // 头像框图片设置
  const [frameImage, setFrameImage] = useState(() => 
    localStorage.getItem(`avatar_frame_image_${chatId}`) || ''
  )
  const [frameSize, setFrameSize] = useState(() => {
    const saved = localStorage.getItem(`avatar_frame_size_${chatId}`)
    return saved ? parseInt(saved) : 150
  })
  const [frameOffsetX, setFrameOffsetX] = useState(() => 
    parseInt(localStorage.getItem(`avatar_frame_offset_x_${chatId}`) || '0')
  )
  const [frameOffsetY, setFrameOffsetY] = useState(() => 
    parseInt(localStorage.getItem(`avatar_frame_offset_y_${chatId}`) || '0')
  )

  // 预设头像框样式
  const presets = [
    {
      name: '霓虹发光',
      userCSS: `
        border: 2px solid #00ffff !important;
        box-shadow: 
          0 0 5px #00ffff,
          0 0 10px #00ffff,
          0 0 20px #00ffff,
          inset 0 0 10px rgba(0, 255, 255, 0.2) !important;
        animation: neon-pulse 2s ease-in-out infinite !important;
      `,
      aiCSS: `
        border: 2px solid #ff00ff !important;
        box-shadow: 
          0 0 5px #ff00ff,
          0 0 10px #ff00ff,
          0 0 20px #ff00ff,
          inset 0 0 10px rgba(255, 0, 255, 0.2) !important;
        animation: neon-pulse 2s ease-in-out infinite !important;
      `
    },
  ]

  // 应用预设
  const applyPreset = (preset: typeof presets[0]) => {
    setUserFrameCSS(preset.userCSS)
    setAiFrameCSS(preset.aiCSS)
    setPreviewUserCSS(preset.userCSS)
    setPreviewAiCSS(preset.aiCSS)
  }

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setFrameImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存头像框设置
  const saveFrameSettings = () => {
    localStorage.setItem(`user_avatar_frame_${chatId}`, userFrameCSS)
    localStorage.setItem(`ai_avatar_frame_${chatId}`, aiFrameCSS)
    localStorage.setItem(`avatar_shape_${chatId}`, avatarShape)
    localStorage.setItem(`avatar_frame_image_${chatId}`, frameImage)
    localStorage.setItem(`avatar_frame_size_${chatId}`, frameSize.toString())
    localStorage.setItem(`avatar_frame_offset_x_${chatId}`, frameOffsetX.toString())
    localStorage.setItem(`avatar_frame_offset_y_${chatId}`, frameOffsetY.toString())
    
    // 触发更新
    window.dispatchEvent(new Event('avatarFrameUpdate'))
    onSaved()
    alert('✅ 头像框已应用！')
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* 标题栏 */}
      <div 
        className="p-4 cursor-pointer active:bg-gray-50 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900">头像框</h2>
          <p className="text-xs text-gray-500 mt-0.5">自定义头像边框样式</p>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* 内容区域 */}
      {isExpanded && (
      <div className="px-6 pb-6 expand-animate">
      
      {/* 头像形状选择 */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-3">头像形状</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAvatarShape('rounded')}
            className={`p-3 rounded-lg border-2 transition-all ${
              avatarShape === 'rounded' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-white border-2 border-gray-300" />
              <span className="text-xs font-medium text-gray-700">圆角方形</span>
            </div>
          </button>
          <button
            onClick={() => setAvatarShape('circle')}
            className={`p-3 rounded-lg border-2 transition-all ${
              avatarShape === 'circle' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
              <span className="text-xs font-medium text-gray-700">圆形</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* 预设样式 */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-3">预设样式</div>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
            >
              <div className="text-xs font-medium text-gray-700 mb-2">{preset.name}</div>
              <div className="flex justify-center">
                <style>{`.preset-avatar-${index} { ${preset.userCSS} }`}</style>
                <div className={`preset-avatar-${index} w-10 h-10 rounded-lg bg-white border border-gray-200`} />
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* 图片装饰框 */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-3">图片装饰框</div>
        
        {/* 上传图片 */}
        <label className="block mb-3">
          <div className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-600">
              {frameImage ? '已上传图片，点击更换' : '点击上传头像框图片'}
            </span>
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        
        {frameImage && (
          <>
            {/* 实时预览窗口 */}
            <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-3 text-center">实时预览</div>
              <style>
                {`
                  @keyframes rainbow-rotate {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                  }
                  @keyframes neon-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                  }
                `}
              </style>
              <style>
                {`.preview-avatar-user { ${previewUserCSS} }`}
                {`.preview-avatar-ai { ${previewAiCSS} }`}
              </style>
              <div className="flex items-center justify-around overflow-visible" style={{ minHeight: '80px' }}>
                {/* 用户头像 */}
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">用户</div>
                  <div className="relative overflow-visible" style={{ width: '48px', height: '48px' }}>
                    <div className={`preview-avatar-user w-full h-full ${avatarShape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-white border-2 border-gray-300`} />
                    {frameImage && (
                      <img 
                        src={frameImage} 
                        alt="装饰框" 
                        className="absolute top-1/2 left-1/2 pointer-events-none z-10"
                        style={{
                          width: `${48 * frameSize / 100}px`,
                          height: `${48 * frameSize / 100}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                </div>
                
                {/* AI头像 */}
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">AI</div>
                  <div className="relative overflow-visible" style={{ width: '48px', height: '48px' }}>
                    <div className={`preview-avatar-ai w-full h-full ${avatarShape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-white border-2 border-gray-300`} />
                    {frameImage && (
                      <img 
                        src={frameImage} 
                        alt="装饰框" 
                        className="absolute top-1/2 left-1/2 pointer-events-none z-10"
                        style={{
                          width: `${48 * frameSize / 100}px`,
                          height: `${48 * frameSize / 100}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-center text-gray-500 mt-2">
                大小: {frameSize}% | X{frameOffsetX > 0 ? '+' : ''}{frameOffsetX}px, Y{frameOffsetY > 0 ? '+' : ''}{frameOffsetY}px
              </div>
            </div>

            {/* 大小调整 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">大小</span>
                <span className="text-xs text-gray-500">{frameSize}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={frameSize}
                onChange={(e) => setFrameSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 水平位置 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">水平位置</span>
                <span className="text-xs text-gray-500">{frameOffsetX}px</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={frameOffsetX}
                onChange={(e) => setFrameOffsetX(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 垂直位置 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">垂直位置</span>
                <span className="text-xs text-gray-500">{frameOffsetY}px</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={frameOffsetY}
                onChange={(e) => setFrameOffsetY(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 删除图片 */}
            <button
              onClick={() => setFrameImage('')}
              className="w-full py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              删除装饰框图片
            </button>
          </>
        )}
      </div>
      
      {/* 自定义CSS */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2">用户头像框CSS</div>
        <textarea
          value={userFrameCSS}
          onChange={(e) => {
            setUserFrameCSS(e.target.value)
            setPreviewUserCSS(e.target.value)
          }}
          placeholder="输入CSS样式，如：border: 2px solid #FFD700 !important;"
          className="w-full h-24 px-3 py-2 bg-gray-50 rounded-lg text-xs font-mono resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2">AI头像框CSS</div>
        <textarea
          value={aiFrameCSS}
          onChange={(e) => {
            setAiFrameCSS(e.target.value)
            setPreviewAiCSS(e.target.value)
          }}
          placeholder="输入CSS样式，如：border: 2px solid #87CEEB !important;"
          className="w-full h-24 px-3 py-2 bg-gray-50 rounded-lg text-xs font-mono resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      
      {/* 应用按钮 */}
      <button
        onClick={saveFrameSettings}
        className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-full active:scale-95 transition-all font-medium"
      >
        应用
      </button>
      </div>
      )}
    </div>
  )
}

export default AvatarFrameSettings
