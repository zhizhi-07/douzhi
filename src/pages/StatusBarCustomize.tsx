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
    window.dispatchEvent(new Event('statusBarChanged'))
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
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customize')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">状态栏设置</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">STATUS BAR</p>
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 显示状态栏 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-800 font-medium mb-0.5">显示状态栏</div>
                <div className="text-xs text-slate-500 font-light">显示顶部时间、信号和电池信息</div>
              </div>
              <button
                onClick={toggleStatusBar}
                className={`relative w-11 h-6 rounded-full transition-all ${showStatusBar
                    ? 'bg-blue-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                    : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${showStatusBar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* 专注模式 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-slate-800 font-medium mb-0.5">专注模式</div>
                <div className="text-xs text-slate-500 font-light">在状态栏显示自定义图标和文字</div>
              </div>
              <button
                onClick={handleToggleFocusMode}
                className={`relative w-11 h-6 rounded-full transition-all ${focusMode
                    ? 'bg-blue-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                    : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${focusMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* 专注模式自定义 */}
            {focusMode && (
              <div className="space-y-4 pt-4 border-t border-slate-200/50">
                {/* 图标上传 */}
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-2 block uppercase tracking-wider">图标</label>
                  <input
                    ref={focusModeIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFocusModeIconUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    {focusModeIcon && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/60 shadow-sm flex items-center justify-center bg-white/50">
                        <img src={focusModeIcon} alt="图标" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() => focusModeIconInputRef.current?.click()}
                      className="flex-1 px-4 py-2.5 bg-white/50 hover:bg-white/70 border border-white/60 text-slate-600 rounded-xl text-sm transition-all shadow-sm"
                    >
                      {focusModeIcon ? '更换图标' : '上传图标'}
                    </button>
                    {focusModeIcon && (
                      <button
                        onClick={() => {
                          setFocusModeIcon('')
                          updateFocusMode({ icon: '' })
                        }}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-sm transition-all shadow-sm"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>

                {/* 名称 */}
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-2 block uppercase tracking-wider">名称</label>
                  <input
                    type="text"
                    value={focusModeName}
                    onChange={(e) => {
                      setFocusModeName(e.target.value)
                      updateFocusMode({ name: e.target.value })
                    }}
                    placeholder="请输入模式名称"
                    className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 显示背景开关 */}
                <div className="flex items-center justify-between py-1">
                  <label className="text-sm text-slate-700">显示背景色</label>
                  <button
                    onClick={() => {
                      const newValue = !focusModeShowBg
                      setFocusModeShowBg(newValue)
                      updateFocusMode({ showBg: newValue })
                    }}
                    className={`relative w-11 h-6 rounded-full transition-all ${focusModeShowBg ? 'bg-blue-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${focusModeShowBg ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* 背景颜色选择 */}
                {focusModeShowBg && (
                  <div>
                    <label className="text-xs text-slate-500 font-medium mb-2 block uppercase tracking-wider">背景颜色</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={focusModeColor}
                          onChange={(e) => {
                            setFocusModeColor(e.target.value)
                            updateFocusMode({ color: e.target.value })
                          }}
                          className="w-12 h-10 rounded-xl border border-white/60 cursor-pointer opacity-0 absolute inset-0 z-10"
                        />
                        <div
                          className="w-12 h-10 rounded-xl border border-white/60 shadow-sm"
                          style={{ backgroundColor: focusModeColor }}
                        />
                      </div>
                      <input
                        type="text"
                        value={focusModeColor}
                        onChange={(e) => {
                          setFocusModeColor(e.target.value)
                          updateFocusMode({ color: e.target.value })
                        }}
                        className="flex-1 px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all font-mono"
                        placeholder="#9333ea"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 时间显示 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="text-slate-800 font-medium mb-4">时间显示</div>

            {/* 显示背景色开关 */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-700">显示背景色</div>
              <button
                onClick={handleToggleTimeBackground}
                className={`relative w-11 h-6 rounded-full transition-all ${timeBackgroundEnabled
                    ? 'bg-blue-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                    : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${timeBackgroundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* 背景颜色选择 */}
            {timeBackgroundEnabled && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-700 w-16">背景颜色</div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="relative">
                    <input
                      id="color-picker"
                      type="color"
                      value={timeBackgroundColor}
                      onChange={(e) => handleTimeColorChange(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-white/60 cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div
                      className="w-10 h-10 rounded-xl border border-white/60 shadow-sm"
                      style={{ backgroundColor: timeBackgroundColor }}
                    />
                  </div>
                  <input
                    type="text"
                    value={timeBackgroundColor}
                    onChange={(e) => handleTimeColorChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all font-mono"
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
