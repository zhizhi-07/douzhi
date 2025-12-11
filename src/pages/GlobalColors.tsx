/**
 * Global Colors Settings Page
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'

// Helper to determine text color (black or white) based on background brightness
const getContrastColor = (hexColor: string) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.substr(1, 2), 16)
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)

  // Calculate brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000

  // Return black or white
  return (yiq >= 128) ? '#1a1a1a' : '#ffffff'
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const GlobalColors = () => {
  const navigate = useNavigate()
  const [knobColor, setKnobColor] = useState(localStorage.getItem('switch_knob_color') || '#ffffff')
  const [activeColor, setActiveColor] = useState(localStorage.getItem('switch_active_color') || '#475569')
  const [buttonColor, setButtonColor] = useState(localStorage.getItem('global_button_color') || '#475569')
  const [sliderThumbColor, setSliderThumbColor] = useState(localStorage.getItem('slider_thumb_color') || '#1e293b')
  const [desktopTimeColor, setDesktopTimeColor] = useState(localStorage.getItem('desktop_time_color') || '#FFFFFF')

  // Apply colors on load
  useEffect(() => {
    document.documentElement.style.setProperty('--switch-knob-color', knobColor)
    document.documentElement.style.setProperty('--switch-active-color', activeColor)

    // Handle button color with glass effect
    const buttonRgba = hexToRgba(buttonColor, 0.25)
    document.documentElement.style.setProperty('--global-button-color', buttonRgba)
    const textColor = getContrastColor(buttonColor)
    document.documentElement.style.setProperty('--global-button-text-color', textColor)

    document.documentElement.style.setProperty('--slider-thumb-color', sliderThumbColor)
  }, [buttonColor, knobColor, activeColor, sliderThumbColor])

  const handleKnobColorChange = (color: string) => {
    setKnobColor(color)
    document.documentElement.style.setProperty('--switch-knob-color', color)
    localStorage.setItem('switch_knob_color', color)
  }

  const handleActiveColorChange = (color: string) => {
    setActiveColor(color)
    document.documentElement.style.setProperty('--switch-active-color', color)
    localStorage.setItem('switch_active_color', color)
  }

  const handleButtonColorChange = (color: string) => {
    setButtonColor(color)
    // Apply glass effect - 25% opacity with backdrop blur
    const buttonRgba = hexToRgba(color, 0.25)
    document.documentElement.style.setProperty('--global-button-color', buttonRgba)
    localStorage.setItem('global_button_color', color)

    // Automatically update text color for contrast
    const textColor = getContrastColor(color)
    document.documentElement.style.setProperty('--global-button-text-color', textColor)
  }

  const handleSliderThumbColorChange = (color: string) => {
    setSliderThumbColor(color)
    document.documentElement.style.setProperty('--slider-thumb-color', color)
    localStorage.setItem('slider_thumb_color', color)
  }

  const handleDesktopTimeColorChange = (color: string) => {
    setDesktopTimeColor(color)
    localStorage.setItem('desktop_time_color', color)
    window.dispatchEvent(new Event('desktopTimeColorUpdate'))
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      <StatusBar />

      {/* Top Navigation */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/decoration')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">全局颜色</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">GLOBAL COLORS</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 桌面时间颜色 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-medium text-slate-800">桌面时间颜色</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-light">桌面上显示的时间文字颜色</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer">
                <div
                  className="w-14 h-14 rounded-2xl border border-white/50 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: desktopTimeColor }}
                  onClick={() => document.getElementById('time-color-picker')?.click()}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-slate-600 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <input
                id="time-color-picker"
                type="color"
                value={desktopTimeColor}
                onChange={(e) => handleDesktopTimeColorChange(e.target.value)}
                className="hidden"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={desktopTimeColor}
                  onChange={(e) => handleDesktopTimeColorChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all uppercase"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* Global Button Color */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-medium text-slate-800">按钮颜色</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-light">主要操作按钮的颜色</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer">
                <div
                  className="w-14 h-14 rounded-2xl border border-white/50 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105 backdrop-blur-md"
                  style={{ backgroundColor: hexToRgba(buttonColor, 0.25) }}
                  onClick={() => document.getElementById('button-color-picker')?.click()}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <input
                id="button-color-picker"
                type="color"
                value={buttonColor}
                onChange={(e) => handleButtonColorChange(e.target.value)}
                className="hidden"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={buttonColor}
                  onChange={(e) => handleButtonColorChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all uppercase"
                  placeholder="#475569"
                />
              </div>
            </div>
          </div>

          {/* Switch Colors */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-medium text-slate-800">开关颜色</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-light">开关按钮的颜色设置</p>
            </div>

            <div className="space-y-6">
              {/* 开关背景色 */}
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">背景色（激活时）</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl border border-white shadow-sm cursor-pointer ring-1 ring-black/5 hover:scale-105 transition-transform"
                    style={{ backgroundColor: activeColor }}
                    onClick={() => document.getElementById('active-color-picker')?.click()}
                  />
                  <input
                    id="active-color-picker"
                    type="color"
                    value={activeColor}
                    onChange={(e) => handleActiveColorChange(e.target.value)}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={activeColor}
                    onChange={(e) => handleActiveColorChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/50 border border-white/60 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all uppercase"
                    placeholder="#475569"
                  />
                </div>
              </div>

              {/* 开关圆点色 */}
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">圆点色（小圆球）</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl border border-white shadow-sm cursor-pointer ring-1 ring-black/5 hover:scale-105 transition-transform"
                    style={{ backgroundColor: knobColor }}
                    onClick={() => document.getElementById('knob-color-picker')?.click()}
                  />
                  <input
                    id="knob-color-picker"
                    type="color"
                    value={knobColor}
                    onChange={(e) => handleKnobColorChange(e.target.value)}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={knobColor}
                    onChange={(e) => handleKnobColorChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/50 border border-white/60 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all uppercase"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">实时预览</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm text-slate-700 font-medium">开关组件</span>
                <button
                  className={`relative w-12 h-7 rounded-full transition-all shadow-inner`}
                  style={{ backgroundColor: activeColor }}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-sm transition-all duration-200 translate-x-5`}
                    style={{ backgroundColor: knobColor }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-2 border-t border-slate-100">
                <span className="text-sm text-slate-700 font-medium">主要按钮</span>
                <button
                  className="px-6 py-2.5 rounded-xl text-sm shadow-sm active:scale-95 transition-all font-medium tracking-wide hover:shadow-md backdrop-blur-md border border-white/30"
                  style={{
                    backgroundColor: hexToRgba(buttonColor, 0.25),
                    color: getContrastColor(buttonColor),
                  }}
                >
                  确认操作
                </button>
              </div>
              <div className="p-2 border-t border-slate-100">
                <span className="text-sm text-slate-700 font-medium block mb-3">滑块组件</span>
                <div className="relative h-1.5 bg-slate-200 rounded-full">
                  <div className="absolute top-0 left-0 h-full w-1/2 bg-slate-300 rounded-full" />
                  <div
                    className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: sliderThumbColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalColors
