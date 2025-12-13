/**
 * 头像框设置组件
 */

import { useState } from 'react'
import { compressAndConvertToBase64, fileToBase64 } from '../../utils/imageUtils'

interface AvatarFrameSettingsProps {
  chatId: string
  onSaved: () => void
}

const AvatarFrameSettings = ({ chatId, onSaved }: AvatarFrameSettingsProps) => {
  // 基础状态
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'user' | 'ai'>('user')
  
  // CSS框样式
  const [userFrameCSS, setUserFrameCSS] = useState(() => 
    localStorage.getItem(`user_avatar_frame_${chatId}`) || ''
  )
  const [aiFrameCSS, setAiFrameCSS] = useState(() => 
    localStorage.getItem(`ai_avatar_frame_${chatId}`) || ''
  )
  const [previewUserCSS, setPreviewUserCSS] = useState(userFrameCSS)
  const [previewAiCSS, setPreviewAiCSS] = useState(aiFrameCSS)
  
  // 通用设置
  const [avatarShape, setAvatarShape] = useState(() => 
    localStorage.getItem(`avatar_shape_${chatId}`) || 'rounded'
  )
  const [avatarSize, setAvatarSize] = useState(() => {
    const saved = localStorage.getItem(`avatar_size_${chatId}`)
    return saved ? parseInt(saved) : 100
  })
  const [hideAvatar, setHideAvatar] = useState(() => 
    localStorage.getItem(`hide_avatar_${chatId}`) === 'true'
  )
  
  // 全局主题色
  const globalActiveColor = localStorage.getItem('switch_active_color') || '#475569'
  
  // 用户头像框图片
  const [userFrameImage, setUserFrameImage] = useState(() => 
    localStorage.getItem(`user_avatar_frame_image_${chatId}`) || localStorage.getItem(`avatar_frame_image_${chatId}`) || ''
  )
  const [userFrameSize, setUserFrameSize] = useState(() => {
    const saved = localStorage.getItem(`user_avatar_frame_size_${chatId}`) || localStorage.getItem(`avatar_frame_size_${chatId}`)
    return saved ? parseInt(saved) : 150
  })
  const [userFrameOffsetX, setUserFrameOffsetX] = useState(() => 
    parseInt(localStorage.getItem(`user_avatar_frame_offset_x_${chatId}`) || localStorage.getItem(`avatar_frame_offset_x_${chatId}`) || '0')
  )
  const [userFrameOffsetY, setUserFrameOffsetY] = useState(() => 
    parseInt(localStorage.getItem(`user_avatar_frame_offset_y_${chatId}`) || localStorage.getItem(`avatar_frame_offset_y_${chatId}`) || '0')
  )
  
  // AI头像框图片
  const [aiFrameImage, setAiFrameImage] = useState(() => 
    localStorage.getItem(`ai_avatar_frame_image_${chatId}`) || localStorage.getItem(`avatar_frame_image_${chatId}`) || ''
  )
  const [aiFrameSize, setAiFrameSize] = useState(() => {
    const saved = localStorage.getItem(`ai_avatar_frame_size_${chatId}`) || localStorage.getItem(`avatar_frame_size_${chatId}`)
    return saved ? parseInt(saved) : 150
  })
  const [aiFrameOffsetX, setAiFrameOffsetX] = useState(() => 
    parseInt(localStorage.getItem(`ai_avatar_frame_offset_x_${chatId}`) || localStorage.getItem(`avatar_frame_offset_x_${chatId}`) || '0')
  )
  const [aiFrameOffsetY, setAiFrameOffsetY] = useState(() => 
    parseInt(localStorage.getItem(`ai_avatar_frame_offset_y_${chatId}`) || localStorage.getItem(`avatar_frame_offset_y_${chatId}`) || '0')
  )

  // 处理图片上传（支持GIF动图）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'user' | 'ai') => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const isGif = file.type === 'image/gif'
        let imageUrl: string
        
        if (isGif) {
          const base64 = await fileToBase64(file)
          imageUrl = `data:image/gif;base64,${base64}`
        } else {
          const base64 = await compressAndConvertToBase64(file, 600, 600, 0.8)
          imageUrl = `data:image/jpeg;base64,${base64}`
        }
        
        if (target === 'user') {
          setUserFrameImage(imageUrl)
        } else {
          setAiFrameImage(imageUrl)
        }
      } catch (error) {
        console.error('处理头像框图片失败:', error)
        alert('图片处理失败，请重试')
      }
    }
  }

  // 保存设置
  const saveFrameSettings = () => {
    localStorage.setItem(`user_avatar_frame_${chatId}`, userFrameCSS)
    localStorage.setItem(`ai_avatar_frame_${chatId}`, aiFrameCSS)
    localStorage.setItem(`avatar_shape_${chatId}`, avatarShape)
    localStorage.setItem(`avatar_size_${chatId}`, avatarSize.toString())
    localStorage.setItem(`hide_avatar_${chatId}`, hideAvatar.toString())
    
    localStorage.setItem(`user_avatar_frame_image_${chatId}`, userFrameImage)
    localStorage.setItem(`user_avatar_frame_size_${chatId}`, userFrameSize.toString())
    localStorage.setItem(`user_avatar_frame_offset_x_${chatId}`, userFrameOffsetX.toString())
    localStorage.setItem(`user_avatar_frame_offset_y_${chatId}`, userFrameOffsetY.toString())
    
    localStorage.setItem(`ai_avatar_frame_image_${chatId}`, aiFrameImage)
    localStorage.setItem(`ai_avatar_frame_size_${chatId}`, aiFrameSize.toString())
    localStorage.setItem(`ai_avatar_frame_offset_x_${chatId}`, aiFrameOffsetX.toString())
    localStorage.setItem(`ai_avatar_frame_offset_y_${chatId}`, aiFrameOffsetY.toString())
    
    window.dispatchEvent(new Event('avatarFrameUpdate'))
    onSaved()
    alert('✅ 头像框已应用！')
  }

  // 渲染参数滑块组件
  const renderSlider = (label: string, value: number, onChange: (val: number) => void, min: number, max: number, unit = '') => (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs font-medium text-gray-500 w-12 text-right">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer hover:bg-gray-200 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.15)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-100 hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
      />
      <span className="text-xs font-mono text-gray-400 w-10">{value}{unit}</span>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
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
      <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
        {/* Tab导航 */}
        <div className="flex p-1 mx-5 mt-4 bg-gray-100/80 rounded-xl">
          {(['user', 'ai', 'general'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'user' ? '用户头像框' : tab === 'ai' ? 'AI头像框' : '通用设置'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* 通用设置 Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* 隐藏头像开关 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-900">隐藏头像</div>
                  <div className="text-xs text-gray-500 mt-0.5">聊天时不显示头像</div>
                </div>
                <button
                  onClick={() => setHideAvatar(!hideAvatar)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: hideAvatar ? globalActiveColor : '#d1d5db' }}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hideAvatar ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full bg-blue-500"></span>
                  头像形状
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAvatarShape('rounded')}
                    className={`group relative p-4 rounded-xl transition-all border ${
                      avatarShape === 'rounded' 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                        avatarShape === 'rounded' ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'
                      }`} />
                      <span className="text-xs font-medium">圆角方形</span>
                    </div>
                    {avatarShape === 'rounded' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>
                  <button
                    onClick={() => setAvatarShape('circle')}
                    className={`group relative p-4 rounded-xl transition-all border ${
                      avatarShape === 'circle' 
                        ? 'bg-gray-900 border-gray-900 text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-full border-2 transition-colors ${
                        avatarShape === 'circle' ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'
                      }`} />
                      <span className="text-xs font-medium">圆形</span>
                    </div>
                    {avatarShape === 'circle' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full bg-purple-500"></span>
                  显示大小
                </span>
                <div className="px-3 py-4 bg-gray-50 rounded-xl border border-gray-100">
                  {renderSlider('缩放', avatarSize, setAvatarSize, 80, 150, '%')}
                </div>
              </div>
            </div>
          )}

          {/* 用户/AI 头像框 Tab */}
          {(activeTab === 'user' || activeTab === 'ai') && (() => {
            const isUser = activeTab === 'user'
            const frameImage = isUser ? userFrameImage : aiFrameImage
            const setFrameImage = isUser ? setUserFrameImage : setAiFrameImage
            const frameSize = isUser ? userFrameSize : aiFrameSize
            const setFrameSize = isUser ? setUserFrameSize : setAiFrameSize
            const frameOffsetX = isUser ? userFrameOffsetX : aiFrameOffsetX
            const setFrameOffsetX = isUser ? setUserFrameOffsetX : setAiFrameOffsetX
            const frameOffsetY = isUser ? userFrameOffsetY : aiFrameOffsetY
            const setFrameOffsetY = isUser ? setUserFrameOffsetY : setAiFrameOffsetY
            const frameCSS = isUser ? userFrameCSS : aiFrameCSS
            const setFrameCSS = isUser ? setUserFrameCSS : setAiFrameCSS
            const previewCSS = isUser ? previewUserCSS : previewAiCSS
            const setPreviewCSS = isUser ? setPreviewUserCSS : setPreviewAiCSS

            return (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* 预览与上传区域 */}
                <div className="flex gap-4">
                  {/* 左侧预览 */}
                  <div className="flex-shrink-0 w-24 flex flex-col items-center gap-2">
                    <div className="relative w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-visible">
                      {/* 预览样式注入 */}
                      <style>
                        {`.preview-avatar-${activeTab} { ${previewCSS} }`}
                      </style>
                      
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <div className={`preview-avatar-${activeTab} w-full h-full ${avatarShape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-white border-2 border-gray-200 shadow-sm transition-all`} />
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
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-gray-900/10 text-gray-600 rounded">预览</span>
                    </div>
                  </div>

                  {/* 右侧上传 */}
                  <div className="flex-1 min-w-0">
                    <label className={`flex flex-col items-center justify-center w-full h-20 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                      frameImage 
                        ? 'border-gray-200 bg-gray-50 hover:border-gray-300' 
                        : 'border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`p-1.5 rounded-full transition-colors ${frameImage ? 'bg-white text-gray-400' : 'bg-blue-100 text-blue-500'}`}>
                          {frameImage ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${frameImage ? 'text-gray-500' : 'text-blue-600'}`}>
                          {frameImage ? '点击更换图片' : '上传装饰图片'}
                        </span>
                      </div>
                      <input type="file" accept="image/*,.gif" onChange={(e) => handleImageUpload(e, activeTab)} className="hidden" />
                    </label>
                    {frameImage && (
                      <button 
                        onClick={() => setFrameImage('')} 
                        className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-colors ml-auto"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        移除图片
                      </button>
                    )}
                    {/* URL输入 */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={frameImage.startsWith('data:') ? '' : frameImage}
                        onChange={(e) => setFrameImage(e.target.value.trim())}
                        placeholder="或输入图床URL（支持http/https）"
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* 参数调整 */}
                {frameImage && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-1 h-3 rounded-full bg-green-500"></span>
                      位置与大小
                    </span>
                    <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                      {renderSlider('大小', frameSize, setFrameSize, 50, 300, '%')}
                      {renderSlider('水平 X', frameOffsetX, setFrameOffsetX, -50, 50, 'px')}
                      {renderSlider('垂直 Y', frameOffsetY, setFrameOffsetY, -50, 50, 'px')}
                    </div>
                  </div>
                )}

                {/* CSS 编辑器 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-1 h-3 rounded-full bg-orange-500"></span>
                      CSS 样式
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">高级</span>
                  </div>
                  <textarea
                    value={frameCSS}
                    onChange={(e) => {
                      setFrameCSS(e.target.value)
                      setPreviewCSS(e.target.value)
                    }}
                    placeholder="border: 3px solid #FFD700; box-shadow: ..."
                    className="w-full h-20 px-3 py-2 bg-gray-50 rounded-xl text-xs font-mono text-gray-600 resize-none border border-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            )
          })()}
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 pb-5 pt-2 flex items-center justify-end gap-3 border-t border-gray-50 mt-2 bg-gray-50/30">
          <button
            onClick={() => {
              // 重置当前Tab的设置
              if (confirm('确定要重置当前页面的设置吗？')) {
                if (activeTab === 'general') {
                  setAvatarShape('rounded')
                  setAvatarSize(100)
                  setHideAvatar(false)
                } else if (activeTab === 'user') {
                  setUserFrameImage('')
                  setUserFrameSize(150)
                  setUserFrameOffsetX(0)
                  setUserFrameOffsetY(0)
                  setUserFrameCSS('')
                } else {
                  setAiFrameImage('')
                  setAiFrameSize(150)
                  setAiFrameOffsetX(0)
                  setAiFrameOffsetY(0)
                  setAiFrameCSS('')
                }
              }
            }}
            className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
          <button
            onClick={saveFrameSettings}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg shadow-lg shadow-gray-900/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            应用更改
          </button>
        </div>
      </div>
      )}
    </div>
  )
}

export default AvatarFrameSettings
