import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft, Quote } from 'lucide-react'

const Calendar = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bgImage, setBgImage] = useState<string>('')

  // 每日一句
  const quotes = [
    "生活不是等待暴风雨过去，而是学会在雨中跳舞。",
    "保持热爱，奔赴山海。",
    "星光不问赶路人，时光不负有心人。",
    "愿你眼中总有光芒，活成自己想要的模样。",
    "温柔是黑暗世界里的一束光。",
    "凡是过去，皆为序章。",
    "且将新火试新茶，诗酒趁年华。",
    "世界变得友善是因为你的温柔。",
    "日日是好日。",
    "万物皆有裂痕，那是光照进来的地方。"
  ]
  const [dailyQuote, setDailyQuote] = useState('')

  useEffect(() => {
    // 每天随机一句
    const today = new Date().getDate()
    const quoteIndex = today % quotes.length
    setDailyQuote(quotes[quoteIndex])
    
    // 尝试加载自定义背景
    const loadBg = async () => {
        try {
            const { getImage } = await import('../utils/unifiedStorage')
            const bg = await getImage('calendar_bg')
            if (bg) setBgImage(bg)
        } catch (e) {
            console.error('Failed to load calendar bg', e)
        }
    }
    loadBg()
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  // 填充空白天数
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // 填充日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear()
  }

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const chnWeekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A4A4A] relative overflow-y-auto overflow-x-hidden font-sans pb-10 soft-page-enter">
      {/* 背景图 */}
      {bgImage && (
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* 顶部导航 */}
      <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="text-lg font-medium tracking-widest">CALENDAR</div>
        <div className="w-10"></div> {/* 占位 */}
      </div>

      <div className="relative z-10 px-6">
        {/* 年月显示 */}
        <div className="mb-8 flex items-end justify-between">
            <div>
                <div className="text-6xl font-light text-[#2C2C2C] leading-none mb-2">
                    {currentDate.getMonth() + 1}
                </div>
                <div className="text-xl tracking-[0.3em] text-gray-500 font-light uppercase">
                    {currentDate.toLocaleString('default', { month: 'long' })}
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-3xl font-light text-gray-400 tracking-widest">
                    {currentDate.getFullYear()}
                </div>
                <div className="flex gap-4 mt-2">
                    <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* 星期头 */}
        <div className="grid grid-cols-7 mb-4">
            {weekDays.map((day, i) => (
                <div key={day} className="text-center flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-wider text-gray-400">{day}</span>
                    <span className="text-[10px] text-gray-300 mt-0.5">{chnWeekDays[i]}</span>
                </div>
            ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 mb-12">
            {days.map((day, index) => (
                <div key={index} className="aspect-square flex items-center justify-center relative">
                    {day && (
                        <button
                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                                ${isToday(day) ? 'bg-[#2C2C2C] text-white shadow-lg scale-110' : ''}
                                ${!isToday(day) && isSelected(day) ? 'border border-[#2C2C2C] text-[#2C2C2C]' : ''}
                                ${!isToday(day) && !isSelected(day) ? 'text-gray-600 hover:bg-gray-100' : ''}
                            `}
                        >
                            {day}
                        </button>
                    )}
                </div>
            ))}
        </div>

        {/* 每日一句 / 文艺卡片 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/40 mt-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Quote size={64} />
            </div>
            <div className="relative z-10">
                <div className="text-xs font-bold tracking-widest text-gray-400 mb-3 uppercase">Daily Inspiration</div>
                <p className="text-gray-700 text-lg font-serif leading-relaxed italic">
                    "{dailyQuote}"
                </p>
                <div className="mt-4 flex items-center gap-2">
                    <div className="h-[1px] w-8 bg-gray-300"></div>
                    <div className="text-[10px] text-gray-400 tracking-widest">DOUZHI CALENDAR</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar
