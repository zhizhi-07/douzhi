/**
 * 屏幕设置页面
 * 调整屏幕边距以适配不同iOS设备
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { playSystemSound } from '../utils/soundManager'

const ScreenSettings = () => {
  const navigate = useNavigate()
  
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

  // 顶部边距调整（可以为负值）
  const [topOffset, setTopOffset] = useState(() => {
    return parseInt(localStorage.getItem('screen_top_offset') || '0')
  })
  
  // 底部边距调整（可以为负值）
  const [bottomOffset, setBottomOffset] = useState(() => {
    return parseInt(localStorage.getItem('screen_bottom_offset') || '0')
  })

  // 保存设置
  useEffect(() => {
    localStorage.setItem('screen_top_offset', String(topOffset))
    localStorage.setItem('screen_bottom_offset', String(bottomOffset))
    
    // 触发全局事件，让App重新渲染
    window.dispatchEvent(new CustomEvent('screenSettingsChanged'))
  }, [topOffset, bottomOffset])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 状态栏 + 导航栏 */}
      <div className="glass-effect border-b border-gray-200/50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              playSystemSound()
              navigate(-1)
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">屏幕设置</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 顶部边距调整 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-medium text-gray-900">顶部边距</h3>
              <p className="text-sm text-gray-500">调整顶部黑边（负值向上延伸）</p>
            </div>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{topOffset}px</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={topOffset}
            onChange={(e) => setTopOffset(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer global-slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-100</span>
            <button 
              onClick={() => setTopOffset(0)}
              className="text-blue-500 hover:underline"
            >重置</button>
            <span>+100</span>
          </div>
        </div>

        {/* 底部边距调整 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-medium text-gray-900">底部边距</h3>
              <p className="text-sm text-gray-500">调整底部黑边（负值向下延伸）</p>
            </div>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{bottomOffset}px</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={bottomOffset}
            onChange={(e) => setBottomOffset(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer global-slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-100</span>
            <button 
              onClick={() => setBottomOffset(0)}
              className="text-blue-500 hover:underline"
            >重置</button>
            <span>+100</span>
          </div>
        </div>

        {/* 快捷预设 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-medium text-gray-900 mb-3">快捷预设</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTopOffset(0); setBottomOffset(0); playSystemSound() }}
              className="p-3 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <div className="font-medium">默认</div>
              <div className="text-xs opacity-70">无调整</div>
            </button>
            <button
              onClick={() => { setTopOffset(-20); setBottomOffset(-34); playSystemSound() }}
              className="p-3 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <div className="font-medium">iPhone 长屏</div>
              <div className="text-xs opacity-70">上-20 下-34</div>
            </button>
            <button
              onClick={() => { setTopOffset(-10); setBottomOffset(-20); playSystemSound() }}
              className="p-3 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <div className="font-medium">iPhone 常规</div>
              <div className="text-xs opacity-70">上-10 下-20</div>
            </button>
            <button
              onClick={() => { setTopOffset(0); setBottomOffset(-10); playSystemSound() }}
              className="p-3 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <div className="font-medium">轻微调整</div>
              <div className="text-xs opacity-70">上0 下-10</div>
            </button>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">使用说明</p>
              <ul className="mt-1 space-y-1 text-blue-600">
                <li>• 如果屏幕上下有黑边，尝试调整为<strong>负值</strong></li>
                <li>• 边框模式适合电脑端预览或截图</li>
                <li>• 修改后返回桌面查看效果</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ScreenSettings
