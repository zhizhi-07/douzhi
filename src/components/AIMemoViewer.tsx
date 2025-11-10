/**
 * AI备忘录查看器
 * 展示AI记录的备忘录，带纸张效果，可以翻页查看不同日期
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBar from './StatusBar'
import { getAllDates, getMemosForDate, type AIMemo } from '../utils/aiMemoManager'
import { characterService } from '../services/characterService'

const AIMemoViewer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [characterName, setCharacterName] = useState('')
  const [allDates, setAllDates] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [memos, setMemos] = useState<AIMemo[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

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
    <div className="h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col">
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
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4">
        {allDates.length === 0 ? (
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
          // 备忘录纸张
          <div className="relative w-full max-w-md">
            {/* 翻页按钮 - 左 */}
            <button
              onClick={handlePrevPage}
              disabled={!canGoPrev || isAnimating}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canGoPrev
                  ? 'bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 纸张主体 */}
            <div
              className={`bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-2xl p-6 min-h-[500px] border-4 border-amber-200 relative transition-all duration-300 ${
                isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
              }`}
              style={{
                backgroundImage: `repeating-linear-gradient(transparent, transparent 35px, #f59e0b15 35px, #f59e0b15 36px)`,
              }}
            >
              {/* 纸张顶部装饰线 */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-amber-100/50 to-transparent rounded-t-lg"></div>

              {/* 日期标题 */}
              <div className="relative mb-6 text-center">
                <div className="text-2xl font-bold text-amber-900 mb-1">
                  {formatDateDisplay(currentDate)}
                </div>
                <div className="text-sm text-amber-600">{currentDate}</div>
                <div className="text-xs text-amber-500 mt-1">
                  共 {memos.length} 条备忘录
                </div>
              </div>

              {/* 备忘录列表 */}
              <div className="space-y-4 relative">
                {memos.map((memo, index) => (
                  <div
                    key={memo.id}
                    className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border-l-4 border-amber-400 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {memo.content}
                        </p>
                        <div className="mt-2 text-xs text-amber-600">
                          {memo.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 纸张底部装饰 */}
              <div className="absolute bottom-4 right-4 text-amber-400 text-xs opacity-50">
                📝 {characterName}
              </div>
            </div>

            {/* 翻页按钮 - 右 */}
            <button
              onClick={handleNextPage}
              disabled={!canGoNext || isAnimating}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canGoNext
                  ? 'bg-amber-500 text-white shadow-lg hover:bg-amber-600 hover:scale-110'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 页码指示 */}
            <div className="text-center mt-4 text-sm text-amber-600">
              {currentIndex + 1} / {allDates.length}
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {allDates.length > 0 && (
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-amber-500">
            💡 向左翻页查看昨天，向右翻页查看明天
          </p>
        </div>
      )}
    </div>
  )
}

export default AIMemoViewer
