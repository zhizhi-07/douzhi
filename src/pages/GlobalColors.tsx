/**
 * 全局颜色设置页面
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'

const GlobalColors = () => {
  const navigate = useNavigate()
  const [knobColor, setKnobColor] = useState(localStorage.getItem('switch_knob_color') || '#ffffff')
  const [activeColor, setActiveColor] = useState(localStorage.getItem('switch_active_color') || '#475569')
  const [buttonColor, setButtonColor] = useState(localStorage.getItem('global_button_color') || '#ffffff')
  const [sliderThumbColor, setSliderThumbColor] = useState(localStorage.getItem('slider_thumb_color') || '#1e293b')

  // 页面加载时应用颜色
  useEffect(() => {
    document.documentElement.style.setProperty('--switch-knob-color', knobColor)
    document.documentElement.style.setProperty('--switch-active-color', activeColor)
    document.documentElement.style.setProperty('--global-button-color', buttonColor)
    document.documentElement.style.setProperty('--slider-thumb-color', sliderThumbColor)
  }, [])

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
    document.documentElement.style.setProperty('--global-button-color', color)
    localStorage.setItem('global_button_color', color)
  }

  const handleSliderThumbColorChange = (color: string) => {
    setSliderThumbColor(color)
    document.documentElement.style.setProperty('--slider-thumb-color', color)
    localStorage.setItem('slider_thumb_color', color)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 状态栏 + 导航栏 */}
      <div className="glass-effect border-b border-gray-200/50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/decoration', { replace: true })}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">全局颜色</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 按钮滑块颜色 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900 mb-1">按钮滑块颜色</h3>
            <p className="text-xs text-gray-500">开关按钮小圆点的颜色</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
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
            <div className="flex-1">
              <input
                type="text"
                value={knobColor}
                onChange={(e) => handleKnobColorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* 选中颜色 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900 mb-1">选中颜色</h3>
            <p className="text-xs text-gray-500">开关按钮选中状态的背景颜色</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
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
            <div className="flex-1">
              <input
                type="text"
                value={activeColor}
                onChange={(e) => handleActiveColorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="#475569"
              />
            </div>
          </div>
        </div>

        {/* 全局按钮颜色 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900 mb-1">全局按钮颜色</h3>
            <p className="text-xs text-gray-500">圆角矩形按钮的背景颜色</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
              style={{ backgroundColor: buttonColor }}
              onClick={() => document.getElementById('button-color-picker')?.click()}
            />
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="#475569"
              />
            </div>
          </div>
        </div>

        {/* 滑动圆圈颜色 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900 mb-1">滑动圆圈颜色</h3>
            <p className="text-xs text-gray-500">滑块上圆形拖动点的颜色</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-16 rounded-full border-2 border-gray-200 cursor-pointer shadow-sm"
              style={{ backgroundColor: sliderThumbColor }}
              onClick={() => document.getElementById('slider-thumb-color-picker')?.click()}
            />
            <input
              id="slider-thumb-color-picker"
              type="color"
              value={sliderThumbColor}
              onChange={(e) => handleSliderThumbColorChange(e.target.value)}
              className="hidden"
            />
            <div className="flex-1">
              <input
                type="text"
                value={sliderThumbColor}
                onChange={(e) => handleSliderThumbColorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="#1e293b"
              />
            </div>
          </div>
        </div>

        {/* 预览示例 */}
        <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
          <h3 className="text-base font-semibold text-gray-900 mb-3">预览</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">开关示例</span>
              <button
                className={`relative w-11 h-6 rounded-full transition-all bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 translate-x-5`}
                  style={{ backgroundColor: knobColor }}
                />
              </button>
            </div>
            <div>
              <span className="text-sm text-gray-700 block mb-2">按钮示例</span>
              <button
                className="px-4 py-2 rounded-full text-white text-sm"
                style={{ backgroundColor: buttonColor }}
              >
                示例按钮
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalColors
