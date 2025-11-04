import { useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import MusicPlayerCard from '../components/MusicPlayerCard'
import { page1Apps, page2Apps, dockApps } from '../config/apps'
import { AppItem } from '../components/AppGrid'
import '../css/character-card.css'

const Desktop = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAppClick = (e: React.MouseEvent, app: AppItem) => {
    e.preventDefault()
    e.stopPropagation()
    if (app.onClick) {
      app.onClick()
    } else if (app.route) {
      navigate(app.route)
    }
  }

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  // 触摸结束
  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchEndY.current - touchStartY.current)
    const minSwipeDistance = 50

    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > diffY) {
      if (diffX > 0 && currentPage < 1) {
        setCurrentPage(1)
      } else if (diffX < 0 && currentPage > 0) {
        setCurrentPage(0)
      }
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#f5f7fa]" style={{ touchAction: 'pan-y pinch-zoom' }}>
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-gray-100/30" />
      
      {/* 内容容器 */}
      <div className="relative h-full flex flex-col">
        <div style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
          <StatusBar />
        </div>

        {/* 主要内容区域 - 整页滑动 */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {/* ========== 第一页 ========== */}
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto flex flex-col hide-scrollbar">
              {/* 大时间 */}
              <div className="p-6 mb-4 text-center">
                <div className="text-8xl font-bold text-gray-900 mb-2">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-lg font-semibold text-gray-600">
                  {currentTime.toLocaleDateString('zh-CN', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>

              {/* 音乐播放器卡片 */}
              <MusicPlayerCard
                isPlaying={false}
                onTogglePlay={() => console.log('toggle play')}
                onNext={() => console.log('next')}
                onClick={() => navigate('/music-player')}
              />

              {/* 第一页应用 */}
              <div className="grid grid-cols-4 gap-4 auto-rows-min">
                {page1Apps.map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  const isWechat = app.id === 'wechat-app'
                  
                  return (
                    <div
                      key={app.id}
                      onClick={(e) => handleAppClick(e, app)}
                      className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform ${isWechat ? 'col-span-2 row-span-2' : ''}`}
                    >
                      {isImageIcon ? (
                        <div className={`${isWechat ? 'w-36 h-36' : 'w-14 h-14'} flex items-center justify-center`}>
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`${isWechat ? 'w-36 h-36' : 'w-14 h-14'} ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { className: isWechat ? "w-16 h-16 text-gray-300" : "w-7 h-7 text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ========== 第二页 ========== */}
            <div className="min-w-full h-full px-4 overflow-y-auto flex flex-col hide-scrollbar" style={{ paddingTop: '20px', paddingBottom: '8px' }}>
              {/* 第二页应用 */}
              <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: '90px' }}>
                {page2Apps.map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  return (
                    <div
                      key={app.id}
                      onClick={(e) => handleAppClick(e, app)}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      {isImageIcon ? (
                        <div className="w-14 h-14">
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { className: "w-7 h-7 text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 页面指示器 */}
        <div className="flex justify-center gap-2 py-4">
          {[0, 1].map((index) => (
            <div
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentPage 
                  ? 'bg-gray-800 w-6' 
                  : 'bg-gray-400 w-2 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Dock 栏 */}
        <div className="pb-6 px-4">
          <div className="glass-effect rounded-3xl p-3 shadow-xl border border-white/30">
            <div className="grid grid-cols-4 gap-3">
              {dockApps.map((app) => {
                const isImageIcon = typeof app.icon === 'string'
                return (
                  <div
                    key={app.id}
                    onClick={(e) => handleAppClick(e, app)}
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    {isImageIcon ? (
                      <div className="w-14 h-14">
                        <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                        {React.createElement(app.icon as React.ComponentType<any>, { className: "w-7 h-7 text-gray-300" })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Desktop
