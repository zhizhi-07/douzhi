/**
 * AI备忘录弹窗
 * 便签纸效果，可以翻页查看不同日期
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
  
  // 调试日志
  useEffect(() => {
    console.log('📝 AIMemoModal 状态:', { isOpen, characterId, characterName, dates: allDates.length, memos: memos.length })
  }, [isOpen, characterId, characterName, allDates, memos])

  // 加载备忘录数据，如果为空则生成示例日期用于测试翻页
  useEffect(() => {
    if (!isOpen || !characterId) return

    const dates = getAllDates(characterId)
    
    // 如果没有备忘录，生成几个示例日期用于测试翻页效果
    if (dates.length === 0) {
      const today = new Date()
      const demoData = [
        today.toISOString().split('T')[0],
        new Date(today.getTime() - 86400000).toISOString().split('T')[0],
        new Date(today.getTime() - 172800000).toISOString().split('T')[0]
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
    const nextIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= allDates.length) return
    
    loadMemosForDate(nextIndex)
  }

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    const yesterdayStr = yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

    if (dateStr === todayStr) {
      return '今天'
    } else if (dateStr === yesterdayStr) {
      return '昨天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  if (!isOpen) {
    return null
  }

  console.log('✅ AIMemoModal开始渲染，isOpen=true')

  const currentDate = allDates[currentIndex]
  const canGoPrev = currentIndex < allDates.length - 1
  const canGoNext = currentIndex > 0

  return (
    <>
      {/* CSS样式定义 */}
      <style>{`
        @keyframes notebookIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .notebook-page {
          animation: notebookIn 0.3s ease-out;
        }
        
        /* 纸张纹理 */
        .paper-texture {
          background-image: 
            linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        /* 卷页阴影 */
        .page-curl {
          background: linear-gradient(225deg, 
            rgba(0,0,0,0) 45%, 
            rgba(0,0,0,0.05) 50%, 
            rgba(0,0,0,0.1) 56%, 
            rgba(0,0,0,0.15) 62%, 
            rgba(0,0,0,0.2) 80%, 
            rgba(0,0,0,0.25) 100%
          );
        }
        
        /* 螺旋装订金属圈 */
        .spiral-ring {
          background: linear-gradient(135deg, #999 0%, #ccc 25%, #eee 50%, #ccc 75%, #999 100%);
          box-shadow: 
            inset -1px -1px 2px rgba(0,0,0,0.3),
            inset 1px 1px 2px rgba(255,255,255,0.8),
            0 2px 4px rgba(0,0,0,0.2);
        }
        
        /* 翻页动画 */
        .page-flip-left {
          animation: flipLeft 0.6s ease-in-out;
          transform-origin: left center;
        }
        
        .page-flip-right {
          animation: flipRight 0.6s ease-in-out;
          transform-origin: right center;
        }
        
        @keyframes flipLeft {
          0% {
            transform: perspective(1200px) rotateY(0deg);
          }
          50% {
            transform: perspective(1200px) rotateY(-90deg);
            opacity: 0.3;
          }
          100% {
            transform: perspective(1200px) rotateY(0deg);
          }
        }
        
        @keyframes flipRight {
          0% {
            transform: perspective(1200px) rotateY(0deg);
          }
          50% {
            transform: perspective(1200px) rotateY(90deg);
            opacity: 0.3;
          }
          100% {
            transform: perspective(1200px) rotateY(0deg);
          }
        }
      `}</style>

      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 书本容器 */}
        <div
          className="relative w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
          style={{
            perspective: '2000px'
          }}
        >
          {/* 书本主体 */}
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
              transformStyle: 'preserve-3d',
              transform: 'rotateY(-5deg)'
            }}
          >
            {/* 书页 */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(to right, #f9f7f1 0%, #fefdfb 3%, #fefdfb 97%, #f5f3ed 100%)',
                borderRadius: '0 8px 8px 0',
                boxShadow: `
                  inset 4px 0 8px rgba(0,0,0,0.1),
                  0 0 0 1px rgba(139,69,19,0.2),
                  8px 0 16px rgba(0,0,0,0.15)
                `,
                borderLeft: '3px solid #8b4513'
              }}
            >
              {/* 内容区 - 书页内容 */}
              <div className="relative px-12 py-14 min-h-[500px] max-h-[70vh] overflow-y-auto">
                {/* 纸张纹理叠加 */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                    backgroundSize: '100px 100px'
                  }}
                ></div>

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100/50 transition-all text-amber-600/60 hover:text-amber-800 z-10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 书页顶部装饰线 */}
                <div className="absolute top-8 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"></div>

                {/* 标题 - 书本风格 */}
                <div className="mb-12 text-center relative">
                  <div
                    className="text-lg font-serif text-amber-900/80 tracking-wider"
                    style={{
                      fontFamily: "'Noto Serif SC', 'STSong', serif",
                      letterSpacing: '0.2em'
                    }}
                  >
                    {allDates.length > 0 ? formatDateDisplay(currentDate) : '今天'}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="w-8 h-px bg-amber-400/40"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40"></div>
                    <div className="w-8 h-px bg-amber-400/40"></div>
                  </div>
                </div>

                {/* 随笔内容 - 书本排版 */}
                {memos.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="text-amber-300/60 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p
                      className="text-amber-600/50 text-sm font-serif"
                      style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                    >
                      {characterName}还没有随笔哦
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {memos.map((memo, index) => (
                      <div key={memo.id} className="relative">
                        {/* 段落首字装饰 */}
                        <div className="flex gap-4">
                          <div
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-300 text-amber-800 font-serif text-sm shadow-sm"
                            style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            {/* 内容 - 书本排版 */}
                            <div
                              className="text-gray-700 leading-loose whitespace-pre-wrap text-justify"
                              style={{
                                fontSize: '14px',
                                lineHeight: '2',
                                letterSpacing: '0.05em',
                                fontFamily: "'Noto Serif SC', 'STSong', serif",
                                textIndent: '2em'
                              }}
                            >
                              {memo.content}
                            </div>
                            {/* 时间戳 - 优雅样式 */}
                            <div className="mt-3 text-right">
                              <span
                                className="text-amber-600/60 text-xs font-serif italic"
                                style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                              >
                                —— {new Date(memo.timestamp).toLocaleTimeString('zh-CN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* 分隔装饰 */}
                        {index < memos.length - 1 && (
                          <div className="mt-6 flex items-center justify-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-amber-300/30"></div>
                            <div className="w-1 h-1 rounded-full bg-amber-300/30"></div>
                            <div className="w-1 h-1 rounded-full bg-amber-300/30"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 书页底部装饰 */}
                <div className="absolute bottom-8 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"></div>
              </div>
              
              {/* 底部页码 - 书本风格 */}
              <div className="relative px-12 pb-8 pt-4">
                <div className="flex items-center justify-center gap-3">
                  {/* 上一页 */}
                  <button
                    onClick={() => flipPage('prev')}
                    disabled={!canGoPrev}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      canGoPrev
                        ? 'hover:bg-amber-100/50 text-amber-700/70 hover:text-amber-800'
                        : 'opacity-20 cursor-not-allowed text-amber-400'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span
                      className="text-xs font-serif"
                      style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                    >
                      前一天
                    </span>
                  </button>

                  {/* 页码显示 */}
                  <div
                    className="flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-100/40 via-amber-50/40 to-amber-100/40 border border-amber-200/50 shadow-sm"
                    style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                  >
                    <span className="text-sm text-amber-800 font-medium">{currentIndex + 1}</span>
                    <span className="text-amber-400/60 text-xs">/</span>
                    <span className="text-sm text-amber-600/60">{allDates.length}</span>
                  </div>

                  {/* 下一页 */}
                  <button
                    onClick={() => flipPage('next')}
                    disabled={!canGoNext}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      canGoNext
                        ? 'hover:bg-amber-100/50 text-amber-700/70 hover:text-amber-800'
                        : 'opacity-20 cursor-not-allowed text-amber-400'
                    }`}
                  >
                    <span
                      className="text-xs font-serif"
                      style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
                    >
                      后一天
                    </span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIMemoModal
