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
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSystemSound()
              navigate('/customize')
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">屏幕设置</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">SCREEN LAYOUT</p>
          </div>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 顶部边距调整 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-slate-800">顶部边距</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-light">调整顶部黑边（负值向上延伸）</p>
              </div>
              <span className="text-sm font-mono bg-white/60 border border-white/60 px-3 py-1 rounded-lg text-slate-600 min-w-[3rem] text-center">
                {topOffset}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={topOffset}
              onChange={(e) => setTopOffset(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>-100</span>
              <button
                onClick={() => setTopOffset(0)}
                className="text-blue-500 hover:text-blue-600 font-sans"
              >重置</button>
              <span>+100</span>
            </div>
          </div>

          {/* 底部边距调整 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-slate-800">底部边距</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-light">调整底部黑边（负值向下延伸）</p>
              </div>
              <span className="text-sm font-mono bg-white/60 border border-white/60 px-3 py-1 rounded-lg text-slate-600 min-w-[3rem] text-center">
                {bottomOffset}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={bottomOffset}
              onChange={(e) => setBottomOffset(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>-100</span>
              <button
                onClick={() => setBottomOffset(0)}
                className="text-blue-500 hover:text-blue-600 font-sans"
              >重置</button>
              <span>+100</span>
            </div>
          </div>

          {/* 快捷预设 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">快捷预设</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setTopOffset(0); setBottomOffset(0); playSystemSound() }}
                className="p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-all text-left group"
              >
                <div className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">默认</div>
                <div className="text-xs text-slate-400 mt-0.5">无调整</div>
              </button>
              <button
                onClick={() => { setTopOffset(-20); setBottomOffset(-34); playSystemSound() }}
                className="p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-all text-left group"
              >
                <div className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">iPhone 长屏</div>
                <div className="text-xs text-slate-400 mt-0.5">上-20 下-34</div>
              </button>
              <button
                onClick={() => { setTopOffset(-10); setBottomOffset(-20); playSystemSound() }}
                className="p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-all text-left group"
              >
                <div className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">iPhone 常规</div>
                <div className="text-xs text-slate-400 mt-0.5">上-10 下-20</div>
              </button>
              <button
                onClick={() => { setTopOffset(0); setBottomOffset(-10); playSystemSound() }}
                className="p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 transition-all text-left group"
              >
                <div className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors">轻微调整</div>
                <div className="text-xs text-slate-400 mt-0.5">上0 下-10</div>
              </button>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-blue-800/80 leading-relaxed">
                <p className="font-medium mb-1 text-blue-900">使用说明</p>
                <ul className="space-y-1 opacity-80">
                  <li>• 如果屏幕上下有黑边，尝试调整为<strong>负值</strong></li>
                  <li>• 边框模式适合电脑端预览或截图</li>
                  <li>• 修改后返回桌面查看效果</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ScreenSettings
