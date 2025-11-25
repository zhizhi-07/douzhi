/**
 * AI随笔弹窗 - 文艺手账版
 * 适配移动端，采用单页信笺/手账风格
 */

import { useState, useEffect, useRef } from 'react'
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
  const handwritingFont = "'KaiTi', 'STKaiti', 'DFKai-SB', 'Ma Shan Zheng', serif"
  const serifFont = "'Noto Serif SC', 'Songti SC', 'SimSun', serif"

  // 调试日志
  useEffect(() => {
    // console.log('📝 AIMemoModal 状态:', { isOpen, characterId, characterName, dates: allDates.length, memos: memos.length })
  }, [isOpen, characterId, characterName, allDates, memos])

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

  // 格式化日期
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    return {
      year: date.getFullYear(),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      week: `星期${weekDays[date.getDay()]}`,
      fullDate: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  if (!isOpen) return null

  const currentDate = allDates[currentIndex]
  const dateInfo = currentDate ? formatDateDisplay(currentDate) : null
  const canGoPrev = currentIndex < allDates.length - 1 // 往过去翻
  const canGoNext = currentIndex > 0 // 往未来翻

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;700&display=swap');

        .memo-paper-texture {
          background-color: #fcfbf9;
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 20px 20px;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.05),
            inset 0 0 80px rgba(139, 69, 19, 0.05);
        }

        .memo-torn-edge {
          position: relative;
        }
        .memo-torn-edge::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 0;
          right: 0;
          height: 8px;
          background: radial-gradient(circle, transparent 4px, #fcfbf9 4px) repeat-x;
          background-size: 12px 8px;
          transform: rotate(180deg);
        }

        .memo-content-enter {
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s ease-out;
        }
        .memo-content-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease-out;
        }
        .memo-content-leave {
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease-in;
        }

        /* 垂直书写样式 */
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        
        /* 隐藏滚动条但保持滚动 */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        {/* 信笺卡片容器 */}
        <div 
          className="w-full max-w-md md:max-w-lg h-[85vh] relative flex flex-col shadow-2xl transition-transform duration-300 bg-[#fcfbf9]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 纸张主体 */}
          <div className="memo-paper-texture w-full h-full rounded-lg overflow-hidden flex flex-col relative bg-[#fcfbf9] z-10">
            
            {/* 顶部装饰条 */}
            <div className="h-2 w-full bg-[#8b4513]/10 border-b border-[#8b4513]/10"></div>
            
            {/* 头部信息 */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-start relative z-10">
              {/* 日期展示 - 邮戳风格 */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2 text-[#5d4037]">
                  <span className="text-5xl font-bold" style={{ fontFamily: serifFont }}>
                    {dateInfo?.day || '01'}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm tracking-widest uppercase border-b border-[#5d4037]/30 pb-0.5 mb-0.5">
                      {dateInfo?.year}.{dateInfo?.month}
                    </span>
                    <span className="text-sm font-serif text-[#8d6e63]">
                      {dateInfo?.week}
                    </span>
                  </div>
                </div>
              </div>

              {/* 关闭按钮 */}
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-[#8b4513]/5 flex items-center justify-center text-[#8d6e63] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 内容滚动区域 */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar relative">
              <div className={`
                ${animState === 'entering' ? 'memo-content-enter' : ''}
                ${animState === 'active' ? 'memo-content-active' : ''}
                ${animState === 'leaving' ? 'memo-content-leave' : ''}
              `}>
                {memos.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-[#8d6e63]/40 space-y-4">
                    <div className="w-12 h-12 border-2 border-current rounded-full flex items-center justify-center opacity-50">
                      <span className="text-xl font-serif">空</span>
                    </div>
                    <p className="font-serif tracking-widest text-sm">今日无随笔</p>
                  </div>
                ) : (
                  <div className="space-y-8 py-4">
                    {memos.map((memo, idx) => (
                      <div key={memo.id} className="relative group">
                        {/* 序号装饰 */}
                        <div className="absolute -left-3 top-1 w-1 h-16 bg-[#8b4513]/10 rounded-full opacity-50"></div>
                        
                        <div className="pl-4">
                          {/* 内容 */}
                          <div 
                            className="text-[#3e2723] text-lg leading-loose text-justify whitespace-pre-wrap"
                            style={{ 
                              fontFamily: handwritingFont,
                              lineHeight: '2.2' 
                            }}
                          >
                            {memo.content}
                          </div>
                          
                          {/* 时间戳 */}
                          <div className="mt-3 flex items-center justify-end gap-2 opacity-40">
                            <div className="h-px w-8 bg-[#5d4037]"></div>
                            <span className="text-xs font-serif tracking-wider text-[#5d4037]">
                              {new Date(memo.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        {/* 分隔装饰 */}
                        {idx < memos.length - 1 && (
                          <div className="my-8 flex justify-center opacity-20">
                            <span className="text-[#5d4037] tracking-[1em] text-xs">♦ ♦ ♦</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 底部落款 - 已移除 */}
                <div className="mt-12 mb-8"></div>
              </div>
            </div>

            {/* 底部导航栏 - 悬浮在纸张底部 */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/90 to-transparent flex items-center justify-between px-8 pb-2 z-20">
              <button
                onClick={() => changeDate('prev')}
                disabled={!canGoPrev}
                className={`flex items-center gap-1 text-[#5d4037] transition-all ${
                  canGoPrev ? 'opacity-60 hover:opacity-100 cursor-pointer hover:-translate-x-1' : 'opacity-20 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-serif hidden sm:inline">前一天</span>
              </button>

              <span className="text-xs text-[#8d6e63]/40 font-serif tracking-widest">
                {currentIndex + 1} / {allDates.length}
              </span>

              <button
                onClick={() => changeDate('next')}
                disabled={!canGoNext}
                className={`flex items-center gap-1 text-[#5d4037] transition-all ${
                  canGoNext ? 'opacity-60 hover:opacity-100 cursor-pointer hover:translate-x-1' : 'opacity-20 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-serif hidden sm:inline">后一天</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 装饰水印 */}
            <div className="absolute bottom-20 right-4 opacity-[0.03] pointer-events-none select-none">
              <svg width="150" height="150" viewBox="0 0 100 100" fill="currentColor" className="text-[#5d4037]">
                <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z"/>
                <path d="M50 20c-1.7 0-3 1.3-3 3v24H23c-1.7 0-3 1.3-3 3s1.3 3 3 3h27v24c0 1.7 1.3 3 3 3s3-1.3 3-3V53h24c1.7 0 3-1.3 3-3s-1.3-3-3-3H56V23c0-1.7-1.3-3-3-3z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIMemoModal
