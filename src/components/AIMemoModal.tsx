/**
 * AI随笔弹窗 - Lace Notes 风格
 * 极简、柔软、蕾丝日记本风格
 */

import { useState, useEffect } from 'react'
import { getAllDates, getMemosForDate, type AIMemo } from '../utils/aiMemoManager'

interface AIMemoModalProps {
  isOpen: boolean
  onClose: () => void
  characterId: string
  characterName: string
}

const AIMemoModal = ({ isOpen, onClose, characterId, characterName }: AIMemoModalProps) => {
  const [allDates, setAllDates] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [memos, setMemos] = useState<AIMemo[]>([])
  const [animState, setAnimState] = useState<'entering' | 'active' | 'leaving'>('active')

  // 字体定义
  const serifFont = "'Noto Serif SC', 'Songti SC', 'SimSun', serif"

  // 加载数据
  useEffect(() => {
    if (!isOpen || !characterId) return

    const dates = getAllDates(characterId)

    if (dates.length === 0) {
      // 空状态演示数据
      const today = new Date()
      setAllDates([today.toISOString().split('T')[0]])
      setCurrentIndex(0)
      setMemos([])
    } else {
      setAllDates(dates)
      setCurrentIndex(0)
      const todayMemos = getMemosForDate(characterId, dates[0])
      setMemos(todayMemos)
    }
  }, [isOpen, characterId])

  // 切换日期动画处理
  const changeDate = (direction: 'prev' | 'next') => {
    if (animState !== 'active') return

    const newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1
    if (newIndex < 0 || newIndex >= allDates.length) return

    setAnimState('leaving')

    setTimeout(() => {
      const date = allDates[newIndex]
      const dateMemos = getMemosForDate(characterId, date)
      setMemos(dateMemos)
      setCurrentIndex(newIndex)
      setAnimState('entering')

      setTimeout(() => {
        setAnimState('active')
      }, 50)
    }, 300)
  }

  if (!isOpen) return null

  const currentDate = allDates[currentIndex]
  const canGoPrev = currentIndex < allDates.length - 1
  const canGoNext = currentIndex > 0

  // 装饰符号列表
  const symbols = ['†', '♡', '☆', '☁', '☾', '♪']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500&display=swap');

        .lace-modal-enter {
          opacity: 0;
          transform: scale(0.98) translateY(5px);
        }
        .lace-modal-active {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        
        .paperclip {
          position: absolute;
          top: -15px;
          right: 40px;
          width: 20px;
          height: 60px;
          border: 2px solid #b0b0b0;
          border-radius: 10px;
          border-bottom: none;
          z-index: 30;
          box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .paperclip::after {
          content: '';
          position: absolute;
          top: 10px;
          right: -2px;
          width: 20px;
          height: 40px;
          border: 2px solid #b0b0b0;
          border-radius: 10px;
          border-top: none;
          z-index: 30;
        }

        .content-fade-enter {
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.4s ease-out;
        }
        .content-fade-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease-out;
        }
        .content-fade-leave {
          opacity: 0;
          transform: translateY(-5px);
          transition: all 0.3s ease-in;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* 修复移动端触摸滚动 */
        .touch-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          touch-action: pan-y;
        }

        /* 柔光背景效果 */
        .soft-glow {
          position: absolute;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      {/* 背景遮罩 - 极淡的灰色 */}
      <div
        className="fixed inset-0 bg-[#f0f0f0]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 卡片主体 */}
        <div
          className="relative w-full max-w-[360px] aspect-[3/5] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 lace-modal-active flex flex-col overflow-hidden border border-white/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 装饰：柔光 */}
          <div className="soft-glow top-[-20px] left-[-20px]"></div>
          <div className="soft-glow bottom-[-20px] right-[-20px]"></div>

          {/* 内容区域 */}
          <div className="flex-1 flex flex-col px-8 py-10 relative z-10" style={{ minHeight: 0 }}>

            {/* 顶部标题 */}
            <div className="text-center mb-6">
              <h2 className="text-sm text-gray-500 tracking-wide">
                {characterName}的随笔
              </h2>
            </div>

            {/* 滚动内容区 */}
            <div className="flex-1 overflow-y-auto no-scrollbar touch-scroll" style={{ minHeight: 0 }}>
              <div className={`space-y-8 ${animState === 'entering' ? 'content-fade-enter' :
                  animState === 'leaving' ? 'content-fade-leave' : 'content-fade-active'
                }`}>
                {memos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-300 space-y-3">
                    <span className="text-xl opacity-30">☁</span>
                    <p className="font-serif text-xs tracking-widest opacity-50">Empty Heart</p>
                  </div>
                ) : (
                  memos.map((memo, idx) => (
                    <div key={memo.id} className="group">
                      {/* 装饰符号 + 内容 */}
                      <div className="flex gap-2 items-start">
                        <span className="text-xs text-gray-400 mt-1 font-serif select-none">
                          {symbols[idx % symbols.length]}
                        </span>
                        <div className="flex-1 space-y-2">
                          <div
                            className="text-[#555] text-sm leading-relaxed text-justify font-serif tracking-wide"
                            style={{ fontFamily: serifFont }}
                          >
                            「 {memo.content} 」
                          </div>
                          <div className="text-[10px] text-gray-400 pl-1">
                            {new Date(memo.timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 底部装饰与导航 */}
            <div className="mt-auto pt-6 flex flex-col items-center gap-4">
              
              {/* 装饰文字 */}
              <div className="text-[10px] text-gray-300 font-serif tracking-widest opacity-60">
                ☆ Moments ☆ Written in the heart
              </div>

              {/* 导航按钮 - 增大触摸区域 */}
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => changeDate('prev')}
                  onTouchEnd={(e) => { e.preventDefault(); if (canGoPrev) changeDate('prev') }}
                  disabled={!canGoPrev}
                  className={`p-4 -ml-2 transition-all active:scale-90 active:bg-gray-100 rounded-full ${!canGoPrev ? 'opacity-20' : 'opacity-60'}`}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="text-[10px] text-gray-400 font-serif tracking-[0.2em]">
                  {currentDate ? currentDate.replace(/-/g, '.') : ''}
                  {allDates.length > 1 && ` (${currentIndex + 1}/${allDates.length})`}
                </span>

                <button
                  onClick={() => changeDate('next')}
                  onTouchEnd={(e) => { e.preventDefault(); if (canGoNext) changeDate('next') }}
                  disabled={!canGoNext}
                  className={`p-4 -mr-2 transition-all active:scale-90 active:bg-gray-100 rounded-full ${!canGoNext ? 'opacity-20' : 'opacity-60'}`}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

          {/* 关闭按钮 - 极其隐蔽/极简 */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors z-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        </div>
      </div>
    </>
  )
}

export default AIMemoModal
