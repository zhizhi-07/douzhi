/**
 * 状态栏美化设置页面
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const StatusBarCustomize = () => {
  const navigate = useNavigate()
  const [showStatusBar, setShowStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  const toggleStatusBar = () => {
    const newValue = !showStatusBar
    setShowStatusBar(newValue)
    localStorage.setItem('show_status_bar', String(newValue))
  }
  
  // 专注模式相关状态
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem('focus_mode')
    return saved ? JSON.parse(saved) : null
  })
  const [focusModeIcon, setFocusModeIcon] = useState(focusMode?.icon || '')
  const [focusModeName, setFocusModeName] = useState(focusMode?.name || '')
  const [focusModeColor, setFocusModeColor] = useState(focusMode?.color || '#9333ea')
  const [focusModeShowBg, setFocusModeShowBg] = useState(focusMode?.showBg !== false)
  const focusModeIconInputRef = useRef<HTMLInputElement>(null)
  
  // 时间显示背景色
  const [timeBackgroundEnabled, setTimeBackgroundEnabled] = useState(() => {
    const saved = localStorage.getItem('time_background_enabled')
    return saved === 'true'
  })
  
  const [timeBackgroundColor, setTimeBackgroundColor] = useState(() => {
    return localStorage.getItem('time_background_color') || '#22c55e'
  })

  // 保存专注模式设置
  const handleToggleFocusMode = () => {
    if (focusMode) {
      setFocusMode(null)
      localStorage.removeItem('focus_mode')
      setFocusModeIcon('')
      setFocusModeName('')
      window.dispatchEvent(new Event('focusModeChanged'))
    } else {
      const newMode = {
        icon: focusModeIcon,
        name: focusModeName,
        color: focusModeColor,
        showBg: focusModeShowBg
      }
      setFocusMode(newMode)
      localStorage.setItem('focus_mode', JSON.stringify(newMode))
      window.dispatchEvent(new Event('focusModeChanged'))
    }
  }

  // 更新专注模式配置
  const updateFocusMode = (updates: any) => {
    if (focusMode) {
      const newMode = { ...focusMode, ...updates }
      setFocusMode(newMode)
      localStorage.setItem('focus_mode', JSON.stringify(newMode))
      window.dispatchEvent(new Event('focusModeChanged'))
    }
  }

  // 图标上传
  const handleFocusModeIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件大小（限制1MB）
      if (file.size > 1024 * 1024) {
        alert('图片太大！请选择小于1MB的图片')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        
        // 压缩图片
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // 设置最大尺寸（图标只需要小尺寸）
          const maxSize = 64
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          // 转换为base64，压缩质量0.7
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          
          setFocusModeIcon(compressedDataUrl)
          
          // 上传图标后立即创建/更新并保存
          const newMode = {
            icon: compressedDataUrl,
            name: focusModeName || '专注',
            color: focusModeColor,
            showBg: focusModeShowBg
          }
          
          setFocusMode(newMode)
          localStorage.setItem('focus_mode', JSON.stringify(newMode))
          
          // 触发自定义事件通知StatusBar
          window.dispatchEvent(new Event('focusModeChanged'))
          
          console.log('✅ 专注模式已保存（压缩后）:', newMode)
        }
        
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存时间背景色设置
  const handleToggleTimeBackground = () => {
    const newValue = !timeBackgroundEnabled
    setTimeBackgroundEnabled(newValue)
    localStorage.setItem('time_background_enabled', String(newValue))
    window.dispatchEvent(new Event('timeSettingChanged'))
  }

  const handleTimeColorChange = (color: string) => {
    setTimeBackgroundColor(color)
    localStorage.setItem('time_background_color', color)
    window.dispatchEvent(new Event('timeSettingChanged'))
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 状态栏 + 导航栏一体 */}
      <div className="glass-effect border-b border-gray-200/50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/customize', { replace: true })
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">状态栏设置</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="glass-card rounded-2xl m-4 overflow-hidden backdrop-blur-md bg-white/80 border border-white/50">
          
          {/* 显示状态栏 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="flex-1">
              <div className="text-gray-900 font-medium mb-0.5">显示状态栏</div>
              <div className="text-xs text-gray-500">显示顶部时间、信号和电池信息</div>
            </div>
            <button
              onClick={toggleStatusBar}
              className={`relative w-11 h-6 rounded-full transition-all ${
                showStatusBar 
                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                  : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  showStatusBar ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 专注模式 */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-gray-900 font-medium mb-0.5">专注模式</div>
                <div className="text-xs text-gray-500">在状态栏显示自定义图标和文字</div>
              </div>
              <button
                onClick={handleToggleFocusMode}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  focusMode 
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                    : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 glass-card rounded-full shadow-md transition-transform duration-300 ${
                    focusMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
            
            {/* 专注模式自定义 */}
            {focusMode && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                {/* 图标上传 */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">图标</label>
                  <input
                    ref={focusModeIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFocusModeIconUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    {focusModeIcon && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                        <img src={focusModeIcon} alt="图标" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() => focusModeIconInputRef.current?.click()}
                      className="flex-1 px-3 py-2 glass-card text-gray-700 rounded-lg text-xs"
                    >
                      {focusModeIcon ? '更换图标' : '上传图标'}
                    </button>
                    {focusModeIcon && (
                      <button
                        onClick={() => {
                          setFocusModeIcon('')
                          updateFocusMode({ icon: '' })
                        }}
                        className="px-3 py-2 glass-card text-red-600 rounded-lg text-xs"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 名称 */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">名称</label>
                  <input
                    type="text"
                    value={focusModeName}
                    onChange={(e) => {
                      setFocusModeName(e.target.value)
                      updateFocusMode({ name: e.target.value })
                    }}
                    placeholder="请输入模式名称"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                
                {/* 显示背景开关 */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">显示背景色</label>
                  <button
                    onClick={() => {
                      const newValue = !focusModeShowBg
                      setFocusModeShowBg(newValue)
                      updateFocusMode({ showBg: newValue })
                    }}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                      focusModeShowBg ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                        focusModeShowBg ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                {/* 背景颜色选择 */}
                {focusModeShowBg && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">背景颜色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={focusModeColor}
                        onChange={(e) => {
                          setFocusModeColor(e.target.value)
                          updateFocusMode({ color: e.target.value })
                        }}
                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={focusModeColor}
                        onChange={(e) => {
                          setFocusModeColor(e.target.value)
                          updateFocusMode({ color: e.target.value })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        placeholder="#9333ea"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 时间显示 */}
          <div className="px-4 py-4">
            <div className="text-gray-900 font-medium mb-4">时间显示</div>
            
            {/* 显示背景色开关 */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-700">显示背景色</div>
              <button
                onClick={handleToggleTimeBackground}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  timeBackgroundEnabled 
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                    : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                    timeBackgroundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {/* 背景颜色选择 */}
            {timeBackgroundEnabled && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">背景颜色</div>
                <div className="flex-1 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    style={{ backgroundColor: timeBackgroundColor }}
                    onClick={() => document.getElementById('color-picker')?.click()}
                  />
                  <input
                    id="color-picker"
                    type="color"
                    value={timeBackgroundColor}
                    onChange={(e) => handleTimeColorChange(e.target.value)}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={timeBackgroundColor}
                    onChange={(e) => handleTimeColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusBarCustomize
