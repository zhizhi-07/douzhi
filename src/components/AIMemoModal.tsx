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
    console.log('❌ AIMemoModal不渲染，isOpen=false')
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
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 笔记本容器 */}
        <div
          className="relative w-full max-w-lg notebook-page"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 便签纸主体 */}
          <div className="relative" style={{
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
          }}>
            {/* 回形针 */}
            <div className="absolute -top-8 right-8 w-12 h-24 z-10">
              <svg viewBox="0 0 24 48" fill="none" className="w-full h-full">
                <path d="M8 4 L8 36 C8 40, 12 44, 16 44 C20 44, 24 40, 24 36 L24 8" 
                  stroke="#c0c0c0" 
                  strokeWidth="2" 
                  fill="none"
                  strokeLinecap="round"
                />
                <path d="M10 8 L10 34 C10 36, 12 38, 14 38 C16 38, 18 36, 18 34 L18 12" 
                  stroke="#d0d0d0" 
                  strokeWidth="2" 
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            
            {/* 白色便签纸 */}
            <div 
              className="relative bg-white rounded-lg"
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              {/* 内容区 */}
              <div className="relative px-10 py-12 min-h-[450px] max-h-[65vh] overflow-y-auto">
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 标题 */}
                <div className="mb-10">
                  <div className="text-sm text-gray-400">
                    {allDates.length > 0 ? formatDateDisplay(currentDate) : '今天'}
                  </div>
                </div>

                {/* 随笔内容 */}
                {memos.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-300 text-sm">{characterName}还没有随笔哦</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {memos.map((memo) => (
                      <div key={memo.id} className="space-y-2">
                        {/* 内容 */}
                        <div 
                          className="text-gray-500 leading-loose whitespace-pre-wrap" 
                          style={{ 
                            fontSize: '13px',
                            lineHeight: '1.8',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {memo.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 底部装饰块 */}
              <div className="h-16 bg-gradient-to-t from-gray-50 to-transparent">
                <div className="flex items-center justify-between px-10 pt-6 pb-4">
                  <div className="text-[10px] text-gray-300 tracking-wider">
                    {currentDate || new Date().toISOString().split('T')[0]}
                  </div>
                  <div className="text-xs text-gray-300">
                    {currentIndex + 1} / {allDates.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 外侧翻页按钮 */}
          <button
            onClick={() => flipPage('prev')}
            disabled={!canGoPrev}
            className={`absolute -left-14 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white shadow-md transition-all ${
              canGoPrev ? 'hover:shadow-lg hover:scale-105' : 'opacity-20 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => flipPage('next')}
            disabled={!canGoNext}
            className={`absolute -right-14 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white shadow-md transition-all ${
              canGoNext ? 'hover:shadow-lg hover:scale-105' : 'opacity-20 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}

export default AIMemoModal
