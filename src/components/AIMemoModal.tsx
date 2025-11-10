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
      {/* CSS动画定义 */}
      <style>{`
        @keyframes pullPaper {
          0% {
            transform: translateY(100%) scale(0.8) rotate(-8deg);
            opacity: 0;
          }
          60% {
            transform: translateY(-10px) scale(1.02) rotate(2deg);
          }
          100% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 便签纸容器 */}
        <div
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 便签纸主体 */}
          <div className="relative">
            {/* 纸张堆叠效果 - 随意摆放 */}
            <div 
              className="absolute inset-0 bg-[#d9d2c2] rounded-[4px] opacity-70"
              style={{ transform: 'translate(8px, 6px) rotate(-1.5deg)' }}
            ></div>
            <div 
              className="absolute inset-0 bg-[#c4b8a0] rounded-[4px] opacity-50"
              style={{ transform: 'translate(4px, 10px) rotate(0.8deg)' }}
            ></div>
            
            {/* 主纸张 */}
            <div 
              className="relative rounded-[4px]"
              style={{
                backgroundColor: '#fffef7',
                backgroundImage: `
                  repeating-linear-gradient(
                    white 0px,
                    white 31px,
                    #d3d3d3 31px,
                    #d3d3d3 32px,
                    white 32px
                  )
                `,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.1)'
              }}
            >
              {/* 透明胶带装饰 */}
              <div 
                className="absolute -top-3 right-16 w-16 h-10 bg-white/20"
                style={{
                  transform: 'rotate(15deg)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)',
                  backdropFilter: 'blur(1px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '2px'
                }}
              ></div>

              {/* 便签纸内容区 */}
              <div className="px-10 py-12 min-h-[500px] max-h-[70vh] overflow-y-auto">
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200/30 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 日期标题 */}
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gray-700 mb-1">
                    {allDates.length > 0 ? formatDateDisplay(currentDate) : '今天'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {allDates.length > 0 ? `${currentDate} · ${memos.length} 条随笔` : '还没写随笔'}
                  </div>
                </div>

                {/* 随笔列表或空状态 */}
                {memos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 font-medium mb-2">这一页还是空白的</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {memos.map((memo) => (
                      <div key={memo.id}>
                        {/* 时间 */}
                        <div className="text-xs text-gray-400 mb-1">{memo.time}</div>
                        
                        {/* 内容 */}
                        <div 
                          className="text-gray-700 leading-[40px] whitespace-pre-wrap" 
                          style={{ 
                            fontFamily: '"Segoe Print", "Comic Sans MS", "Ma Shan Zheng", "Zhi Mang Xing", cursive',
                            fontSize: '15px',
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

              {/* 底部翻页区域 */}
              <div className="px-8 pb-5 pt-4">
                <div className="flex items-center justify-center gap-8 mb-3">
                  {/* 昨天箭头 */}
                  <button
                    onClick={() => flipPage('prev')}
                    disabled={!canGoPrev}
                    className={`p-1.5 transition-all ${
                      canGoPrev
                        ? 'text-amber-600 hover:text-amber-800 active:scale-90'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="昨天"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* 页码 */}
                  <div className="text-sm text-amber-700 font-medium min-w-[60px] text-center">
                    {currentIndex + 1} / {allDates.length}
                  </div>

                  {/* 明天箭头 */}
                  <button
                    onClick={() => flipPage('next')}
                    disabled={!canGoNext}
                    className={`p-1.5 transition-all ${
                      canGoNext
                        ? 'text-amber-600 hover:text-amber-800 active:scale-90'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="明天"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* 签名 */}
                <div className="text-center text-xs text-amber-600/60" style={{ fontFamily: 'cursive' }}>
                  ✍️ {characterName} 的小本子
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
