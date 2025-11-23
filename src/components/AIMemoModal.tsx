/**
 * AI备忘录弹窗
 * 摊开书本效果，左右双页布局
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
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'prev' | 'next' | null>(null)
  const [isExpanded, setIsExpanded] = useState(false) // 是否展开为双页模式

  // 调试日志
  useEffect(() => {
    console.log('📝 AIMemoModal 状态:', { isOpen, characterId, characterName, dates: allDates.length, memos: memos.length })
  }, [isOpen, characterId, characterName, allDates, memos])

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false)
    }
  }, [isOpen])

  // 加载备忘录数据
  useEffect(() => {
    if (!isOpen || !characterId) return

    const dates = getAllDates(characterId)
    
    // 示例数据
    if (dates.length === 0) {
      const today = new Date()
      const demoData = [
        today.toISOString().split('T')[0],
        new Date(today.getTime() - 86400000).toISOString().split('T')[0],
      ]
      setAllDates(demoData)
      setCurrentIndex(0)
      setMemos([])
    } else {
      setAllDates(dates)
      setCurrentIndex(0)
      const todayMemos = getMemosForDate(characterId, dates[0])
      setMemos(todayMemos)
    }
  }, [isOpen, characterId])

  // 加载指定日期的备忘录
  const loadMemosForDate = (dateIndex: number) => {
    if (dateIndex < 0 || dateIndex >= allDates.length) return
    const date = allDates[dateIndex]
    const dateMemos = getMemosForDate(characterId, date)
    setMemos(dateMemos)
    setCurrentIndex(dateIndex)
  }

  // 翻页
  const flipPage = (direction: 'prev' | 'next') => {
    if (isFlipping) return
    
    const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= allDates.length) return
    
    setIsFlipping(true)
    setFlipDirection(direction)
    
    setTimeout(() => {
      loadMemosForDate(nextIndex)
    }, 300)
    
    setTimeout(() => {
      setIsFlipping(false)
      setFlipDirection(null)
    }, 600)
  }

  // 格式化日期
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return null
    
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    const yesterdayStr = yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[date.getDay()]

    return {
      full: `${year}年${month}月${day}日`,
      simple: `${month}月${day}日`,
      week: `星期${weekDay}`,
      isToday: dateStr === todayStr,
      isYesterday: dateStr === yesterdayStr,
      lunar: '农历日期暂缺' // 这里可以接农历库
    }
  }

  if (!isOpen) return null

  const currentDate = allDates[currentIndex]
  const dateInfo = currentDate ? formatDateDisplay(currentDate) : null
  const canGoPrev = currentIndex < allDates.length - 1
  const canGoNext = currentIndex > 0
  
  // 手写字体
  const handwritingFont = "'KaiTi', 'STKaiti', 'DFKai-SB', 'BiauKai', 'Ma Shan Zheng', serif"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');

        .open-book-container {
          perspective: 2000px;
          transform-style: preserve-3d;
        }

        .book-spread {
          background-color: #fdfbf7;
          box-shadow: 
            0 20px 50px rgba(0,0,0,0.3),
            0 0 0 1px rgba(0,0,0,0.05); /* 细微边框 */
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* 中缝阴影 - 模拟书脊 */
        .book-spine-shadow {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 40px;
          margin-left: -20px;
          background: linear-gradient(to right, 
            rgba(0,0,0,0.02) 0%, 
            rgba(0,0,0,0.15) 45%, 
            rgba(0,0,0,0.25) 50%, 
            rgba(0,0,0,0.15) 55%, 
            rgba(0,0,0,0.02) 100%
          );
          z-index: 10;
          pointer-events: none;
        }
        
        /* 页面纹理 */
        .paper-texture {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.02) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
        }

        /* 左页翻动动画 */
        @keyframes flipLeftPage {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(-90deg); background: #e8e0d2; }
          100% { transform: rotateY(0deg); }
        }

        /* 右页翻动动画 */
        @keyframes flipRightPage {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); background: #e8e0d2; }
          100% { transform: rotateY(0deg); }
        }

        .flipping-left {
          animation: flipLeftPage 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: right center;
        }

        .flipping-right {
          animation: flipRightPage 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: left center;
        }

        /* 书签 */
        .bookmark {
          position: absolute;
          top: -10px;
          left: 40px;
          width: 24px;
          height: 100px;
          background: #8b4513;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
          z-index: 20;
          transform: rotate(-2deg);
        }
        .bookmark::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 20px;
          background: #fdfbf7;
          clip-path: polygon(0 100%, 50% 0, 100% 100%);
        }

        /* 文字样式 */
        .ink-text-title {
          background: linear-gradient(45deg, #2c2c2c, #4a4a4a);
          -webkit-background-clip: text;
          color: transparent;
          text-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center overflow-hidden"
        onClick={onClose}
      >
        {/* 书本容器 */}
        <div 
          className={`open-book-container relative transition-all duration-500 ease-in-out ${
            isExpanded ? 'w-[90vw] max-w-4xl aspect-[3/2]' : 'w-[400px] max-w-[90vw] aspect-[3/4] hover:scale-105 cursor-pointer'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (!isExpanded) setIsExpanded(true)
          }}
          style={{ isolation: 'isolate' }} // 防止混合模式穿透
        >
          {/* 强制不透明底板 - 绝对定位在最底层 */}
          <div 
            className="absolute inset-0 bg-[#fdfbf7] rounded-lg" 
            style={{ zIndex: -100, backgroundColor: '#fdfbf7' }} 
          />

          {/* 书本主体 - 左右两页 */}
          <div className="w-full h-full flex relative">
            
            {/* 左页 - 日期页 (仅在展开时显示) */}
            <div 
              className={`flex-1 h-full relative bg-[#fdfbf7] rounded-l-lg overflow-hidden shadow-[-10px_10px_20px_rgba(0,0,0,0.1)] paper-texture transition-all duration-500
                ${isFlipping && flipDirection === 'prev' ? 'flipping-left' : ''}
                ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute left-0 top-0 bottom-0 w-full -z-10 pointer-events-none'}
              `}
              style={{ 
                zIndex: 5, 
                backgroundColor: '#fdfbf7',
                background: '#fdfbf7',
                backfaceVisibility: 'hidden', // 防止背面透明
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* 强制背景色遮挡 */}
              <div className="absolute inset-0 bg-[#fdfbf7] -z-20" />

              {/* 书签 */}
              <div className="bookmark"></div>

              <div className="h-full p-8 md:p-12 flex flex-col relative bg-[#fdfbf7] z-10">
                {/* 装饰性边框 */}
                <div className="absolute inset-4 border-2 border-[#8b4513]/10 rounded-l-sm pointer-events-none"></div>
                
                {/* 左页内容 */}
                <div className="flex-1 flex flex-col items-center justify-center text-[#3e2723]">
                  <div className="mb-8 opacity-60">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  
                  <div className="text-center space-y-6">
                    <h2 
                      className="text-6xl md:text-7xl font-bold ink-text-title tracking-wider"
                      style={{ fontFamily: handwritingFont }}
                    >
                      {dateInfo?.simple.split('月')[1].replace('日', '') || '01'}
                    </h2>
                    <div className="w-12 h-1 bg-[#8b4513]/20 mx-auto rounded-full"></div>
                    <div 
                      className="text-2xl md:text-3xl font-serif tracking-[0.5em] ml-2 text-[#5d4037]"
                      style={{ fontFamily: handwritingFont }}
                    >
                      {dateInfo?.simple.split('月')[0] || '1'}月
                    </div>
                    <div 
                      className="text-lg text-[#8d6e63] mt-4 tracking-widest"
                      style={{ fontFamily: handwritingFont }}
                    >
                      {dateInfo?.week}
                    </div>
                  </div>

                  <div className="mt-auto pt-12 opacity-40 text-sm tracking-widest" style={{ fontFamily: handwritingFont }}>
                    {characterName} · 随笔集
                  </div>
                </div>

                {/* 左侧翻页按钮区 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    flipPage('prev')
                  }}
                  disabled={!canGoPrev || isFlipping}
                  className={`absolute inset-y-0 left-0 w-24 hover:bg-black/5 transition-all group flex items-center justify-start pl-4 ${
                    !canGoPrev ? 'hidden' : 'cursor-pointer'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8b4513]/10 flex items-center justify-center text-[#5d4037] opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* 中缝阴影 (仅在展开时显示) */}
            <div className={`book-spine-shadow transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* 右页 - 内容页 (单页模式下作为封面/主页显示) */}
            <div 
              className={`flex-1 h-full relative bg-[#fdfbf7] overflow-hidden shadow-[10px_10px_20px_rgba(0,0,0,0.1)] paper-texture
                ${isFlipping && flipDirection === 'next' ? 'flipping-right' : ''}
                ${isExpanded ? 'rounded-r-lg' : 'rounded-r-lg rounded-l-lg border-l-[12px] border-[#5d4037]'}
              `}
              style={{ 
                zIndex: 5, 
                backgroundColor: '#fdfbf7',
                background: '#fdfbf7',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* 强制背景色遮挡 */}
              <div className="absolute inset-0 bg-[#fdfbf7] -z-20" />

              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#5d4037]/10 text-[#8d6e63] hover:text-[#3e2723] transition-colors z-20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="h-full p-8 md:p-12 flex flex-col relative overflow-hidden bg-[#fdfbf7] z-10">
                 {/* 装饰性边框 */}
                 <div className={`absolute inset-4 border-2 border-[#8b4513]/10 pointer-events-none ${isExpanded ? 'rounded-r-sm' : 'rounded-sm'}`}></div>
                 
                 {/* 单页模式下的提示 */}
                 {!isExpanded && (
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8d6e63] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 flex flex-col items-center">
                     <div className="text-sm tracking-widest mb-2">点击展开</div>
                     <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                     </svg>
                   </div>
                 )}

                {/* 右页内容区 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                  {memos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#8d6e63]/50">
                      <div className="w-16 h-16 mb-6 opacity-30">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <p className="text-lg font-light tracking-widest" style={{ fontFamily: handwritingFont }}>
                        今日无言
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-12 py-4">
                      {/* 在单页模式下也显示日期标题 */}
                      {!isExpanded && (
                         <div className="text-center mb-8 pb-6 border-b border-[#8b4513]/10">
                           <div className="text-2xl font-bold text-[#3e2723] mb-2" style={{ fontFamily: handwritingFont }}>
                             {dateInfo?.simple}
                           </div>
                           <div className="text-sm text-[#8d6e63] tracking-widest">
                             {dateInfo?.week}
                           </div>
                         </div>
                      )}
                      
                      {memos.map((memo, index) => (
                        <div key={memo.id} className="relative">
                          <div className="flex gap-4">
                            <div className="mt-1 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border border-[#8b4513]/20 text-[#5d4037] text-sm font-serif">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div 
                                className="text-lg leading-loose text-[#3e2723] text-justify whitespace-pre-wrap"
                                style={{ 
                                  fontFamily: handwritingFont,
                                  lineHeight: '2.2'
                                }}
                              >
                                {memo.content}
                              </div>
                              <div className="flex justify-end items-center gap-2 opacity-50">
                                <div className="w-8 h-px bg-[#5d4037]"></div>
                                <span className="text-xs font-serif tracking-widest">
                                  {new Date(memo.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* 分隔符 */}
                          {index < memos.length - 1 && (
                            <div className="flex justify-center mt-10 opacity-20">
                              <div className="w-2 h-2 bg-[#5d4037] rounded-full mx-1"></div>
                              <div className="w-2 h-2 bg-[#5d4037] rounded-full mx-1"></div>
                              <div className="w-2 h-2 bg-[#5d4037] rounded-full mx-1"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 页码 */}
                <div className="absolute bottom-6 right-12 text-[#8d6e63] text-sm tracking-widest" style={{ fontFamily: handwritingFont }}>
                  第 {currentIndex + 1} 页
                </div>

                {/* 右侧翻页按钮区 - 仅在展开时可用 */}
                {isExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      flipPage('next')
                    }}
                    disabled={!canGoNext || isFlipping}
                    className={`absolute inset-y-0 right-0 w-24 hover:bg-black/5 transition-all group flex items-center justify-end pr-4 ${
                      !canGoNext ? 'hidden' : 'cursor-pointer'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#8b4513]/10 flex items-center justify-center text-[#5d4037] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* 底部层叠页效果 - 模拟厚度 */}
            <div className="absolute bottom-2 left-2 right-2 h-4 bg-white rounded-b-lg shadow-md -z-10 transform translate-y-1"></div>
            <div className="absolute bottom-2 left-3 right-3 h-4 bg-white rounded-b-lg shadow-md -z-20 transform translate-y-2"></div>

          </div>
        </div>
      </div>
    </>
  )
}

export default AIMemoModal
