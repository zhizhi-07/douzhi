/**
 * AI备忘录查看器
 * 展示AI记录的备忘录，带纸张效果，可以翻页查看不同日期
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from './StatusBar'
import { getAllDates, getMemosForDate, type AIMemo } from '../utils/aiMemoManager'
import { characterService } from '../services/characterService'
import { getFromIndexedDB } from '../utils/unifiedStorage'

const AIMemoViewer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [characterName, setCharacterName] = useState('')
  const [allDates, setAllDates] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [memos, setMemos] = useState<AIMemo[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayMode, setDisplayMode] = useState<0 | 1 | 2>(0) // 0=完整显示, 1=隐藏文字, 2=隐藏卡片
  const [isBlankMode, setIsBlankMode] = useState(false) // 长按空白模式
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)
  const [isLongPress, setIsLongPress] = useState(false) // 标记是否是长按
  
  // 备忘录背景
  const [memoBg, setMemoBg] = useState('')

  // 加载角色信息和日期列表
  useEffect(() => {
    if (!id) return

    const char = characterService.getById(id)
    if (char) {
      setCharacterName(char.nickname || char.realName)
    }

    const dates = getAllDates(id)
    setAllDates(dates)

    if (dates.length > 0) {
      const todayMemos = getMemosForDate(id, dates[0])
      setMemos(todayMemos)
    }
  }, [id])

  // 加载备忘录背景
  useEffect(() => {
    const loadMemoBg = async () => {
      const bg = await getFromIndexedDB('IMAGES', 'memo_bg')
      console.log('📷 加载备忘录背景:', bg ? '有数据' : '无数据', typeof bg)
      if (bg) {
        if (typeof bg === 'string') {
          setMemoBg(bg)
        } else if (bg instanceof Blob) {
          // 兼容旧的 Blob 数据
          setMemoBg(URL.createObjectURL(bg))
        }
      }
    }
    loadMemoBg()

    const handleBgUpdate = async () => {
      const bg = await getFromIndexedDB('IMAGES', 'memo_bg')
      if (bg) {
        if (typeof bg === 'string') {
          setMemoBg(bg)
        } else if (bg instanceof Blob) {
          setMemoBg(URL.createObjectURL(bg))
        }
      } else {
        setMemoBg('')
      }
    }
    window.addEventListener('memoBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('memoBackgroundUpdate', handleBgUpdate)
  }, [])

  // 加载指定日期的备忘录
  const loadMemosForDate = (dateIndex: number) => {
    if (!id || dateIndex < 0 || dateIndex >= allDates.length) return
    const date = allDates[dateIndex]
    const dateMemos = getMemosForDate(id, date)
    setMemos(dateMemos)
    setCurrentIndex(dateIndex)
  }

  // 上一页（昨天）
  const handlePrevPage = () => {
    if (currentIndex >= allDates.length - 1 || isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      loadMemosForDate(currentIndex + 1)
      setIsAnimating(false)
    }, 300)
  }

  // 下一页（明天）
  const handleNextPage = () => {
    if (currentIndex <= 0 || isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      loadMemosForDate(currentIndex - 1)
      setIsAnimating(false)
    }, 300)
  }

  // 长按开始
  const handleLongPressStart = () => {
    setIsLongPress(false)
    const timer = setTimeout(() => {
      setIsLongPress(true)
      setIsBlankMode(prev => !prev)
    }, 800) // 长按800ms触发
    setLongPressTimer(timer)
  }

  // 长按结束/取消
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // 点击切换显示模式（非长按时触发）
  const handleClick = () => {
    // 如果是长按触发的，不处理点击
    if (isLongPress) {
      setIsLongPress(false)
      return
    }
    // 如果在空白模式，点击退出空白模式
    if (isBlankMode) {
      setIsBlankMode(false)
      return
    }
    // 循环切换：0(完整) -> 1(隐藏文字) -> 2(隐藏卡片) -> 0
    setDisplayMode(prev => ((prev + 1) % 3) as 0 | 1 | 2)
  }

  const currentDate = allDates[currentIndex]
  const canGoPrev = currentIndex < allDates.length - 1
  const canGoNext = currentIndex > 0

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')) {
      return '今天'
    } else if (dateStr === yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')) {
      return '昨天'
    } else {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekday = weekdays[date.getDay()]
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`
    }
  }

  return (
    <div 
      className="h-screen flex flex-col"
      style={{
        backgroundImage: memoBg ? `url(${memoBg})` : 'linear-gradient(to bottom right, rgb(255 251 235), rgb(255 247 237), rgb(254 249 195))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-10">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-amber-700 hover:text-amber-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">返回</span>
          </button>
          <h1 className="text-base font-semibold text-amber-900">{characterName}的备忘录</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* 主内容区 */}
      <div 
        className="flex-1 overflow-auto flex flex-col items-center p-2 sm:p-4 sm:justify-center"
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onClick={handleClick}
      >
        {isBlankMode ? (
          // 空白模式 - 只显示背景
          <div className="w-full h-full"></div>
        ) : allDates.length === 0 ? (
          // 空状态
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-amber-600 text-sm">还没有备忘录</p>
            <p className="text-amber-400 text-xs mt-2">AI会在觉得重要的时候记录备忘录</p>
          </div>
        ) : (
          // 备忘录内容
          <div className="w-full max-w-md mx-auto">
            {/* 日期标题 */}
            <div className={`mb-4 text-center transition-all duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="inline-block bg-white/70 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg font-semibold text-gray-800">
                  {formatDateDisplay(currentDate)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {memos.length}条
                </span>
              </div>
            </div>

            {/* 备忘录列表 - displayMode: 0=完整, 1=隐藏文字, 2=隐藏卡片 */}
            {displayMode < 2 && (
              <div className={`space-y-3 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                {memos.map((memo, index) => (
                  <div
                    key={memo.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      {/* displayMode=0时显示文字，displayMode=1时隐藏 */}
                      {displayMode === 0 && (
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {memo.content}
                          </p>
                          <div className="mt-1 text-xs text-gray-400">
                            {memo.time}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 底部导航 */}
            {allDates.length > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={!canGoPrev || isAnimating}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    canGoPrev
                      ? 'bg-white/80 text-gray-700 active:scale-95'
                      : 'bg-white/40 text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-xs text-gray-500 bg-white/60 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {allDates.length}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={!canGoNext || isAnimating}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    canGoNext
                      ? 'bg-white/80 text-gray-700 active:scale-95'
                      : 'bg-white/40 text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {!isBlankMode && allDates.length > 0 && (
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-amber-500">
            💡 点击切换显示模式 · 长按进入空白模式
          </p>
          <p className="text-[10px] text-amber-400 mt-1">
            {displayMode === 0 ? '完整显示' : displayMode === 1 ? '仅显示序号' : '仅显示日期'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AIMemoViewer
