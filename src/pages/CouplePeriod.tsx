import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getPeriodData, 
  savePeriodData, 
  addPeriodRecord, 
  updatePeriodSettings, 
  getDayStatus,
  type PeriodData 
} from '../utils/couplePeriodUtils'

// Icons (Consistent with CoupleSpace/MessageBoard)
const Icons = {
  Back: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Drop: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2C8.5 6.5 5 11 5 15c0 3.87 3.13 7 7 7s7-3.13 7-7c0-4-3.5-8.5-7-13z" />
    </svg>
  ),
  ChevronLeft: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

// 环形图组件 - 适配屏幕比例
const CycleRing = ({ 
  data, 
  todayCycleDay, 
  settings 
}: { 
  data: PeriodData, 
  todayCycleDay: number,
  settings: { cycleLength: number, duration: number } 
}) => {
  // Use viewBox to scale nicely
  const size = 320 
  const center = size / 2
  const radius = 120
  const strokeWidth = 22
  const circumference = 2 * Math.PI * radius
  
  const anglePerDay = 360 / settings.cycleLength
  
  const segments = []
  for (let i = 0; i < settings.cycleLength; i++) {
    const dayIndex = i + 1
    // Color Palette matching Couple Space (Warm/Earthy)
    let color = '#f5efe6' // Safe/Default (Beige)
    
    if (dayIndex <= settings.duration) {
      color = '#ffb7b2' // Period (Soft Red)
    } else if (dayIndex === settings.cycleLength - 14) {
      color = '#ff8a65' // Ovulation (Coral)
    } else if (dayIndex >= settings.cycleLength - 19 && dayIndex <= settings.cycleLength - 10) {
      color = '#ffe0b2' // Fertile (Orange-ish)
    }
    
    // Start from top (-90deg)
    const startAngle = (i * anglePerDay) - 90
    const gap = 2.5
    
    const dashLength = (circumference / settings.cycleLength) - gap
    const dashArray = `${dashLength} ${circumference - dashLength}`
    
    const isToday = todayCycleDay === dayIndex
    
    segments.push(
      <circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={isToday ? strokeWidth + 6 : strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${startAngle}, ${center}, ${center})`}
        className="transition-all duration-500 ease-out"
        style={{ 
          filter: isToday ? 'drop-shadow(0 0 4px rgba(255,183,178,0.5))' : 'none',
          opacity: isToday ? 1 : 0.8
        }}
      />
    )
    
    if (isToday) {
      const angleInRad = (startAngle + anglePerDay/2) * (Math.PI / 180)
      const indicatorR = radius + 35
      const ix = center + indicatorR * Math.cos(angleInRad)
      const iy = center + indicatorR * Math.sin(angleInRad)
      
      segments.push(
        <g key="today-indicator">
          <circle cx={ix} cy={iy} r={18} fill="#5d4037" className="animate-pulse-slow shadow-lg" />
          <text x={ix} y={iy} dy="1" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">
            今
          </text>
        </g>
      )
    }
  }

  return (
    <div className="w-full aspect-square max-w-[360px] max-h-[360px] relative flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        {segments}
        {/* Center Text */}
        <foreignObject x={center - 80} y={center - 80} width={160} height={160}>
          <div className="h-full w-full flex flex-col items-center justify-center text-center">
            <div className="text-xs text-[#8b7355] tracking-widest mb-1 opacity-80">周期第</div>
            <div className="text-6xl font-bold text-[#5d4037] font-serif mb-1">
              {todayCycleDay > 0 ? todayCycleDay : '-'}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold mt-1
              ${todayCycleDay <= settings.duration ? 'bg-[#ffb7b2] text-white' : 
                todayCycleDay === settings.cycleLength - 14 ? 'bg-[#ff8a65] text-white' :
                (todayCycleDay >= settings.cycleLength - 19 && todayCycleDay <= settings.cycleLength - 10) ? 'bg-[#ffe0b2] text-[#5d4037]' :
                'bg-[#f5efe6] text-[#8b7355]'}`}
            >
               {todayCycleDay <= settings.duration ? '经期中' : 
                todayCycleDay === settings.cycleLength - 14 ? '排卵日' :
                (todayCycleDay >= settings.cycleLength - 19 && todayCycleDay <= settings.cycleLength - 10) ? '易孕期' :
                '安全期'}
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}

const CouplePeriod = () => {
  const navigate = useNavigate()
  const [periodData, setPeriodData] = useState<PeriodData>({ records: [], settings: { cycleLength: 28, duration: 5 } })
  const [viewMode, setViewMode] = useState<'ring' | 'calendar'>('ring')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  
  // Calculate today's cycle day
  const todayCycleDay = useMemo(() => {
    if (periodData.records.length === 0) return 0
    const lastRecord = periodData.records[0]
    const lastStart = new Date(lastRecord.startDate)
    const today = new Date()
    today.setHours(0,0,0,0)
    lastStart.setHours(0,0,0,0)
    const diffTime = today.getTime() - lastStart.getTime()
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return 0
    return (diffDays % periodData.settings.cycleLength) + 1
  }, [periodData])

  useEffect(() => {
    const data = getPeriodData()
    setPeriodData(data)
  }, [])

  const handleRecordStart = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const existing = periodData.records.find(r => r.startDate === todayStr)
    if (existing) {
      alert('今天已经记录了经期开始')
      return
    }
    addPeriodRecord(todayStr)
    setPeriodData(getPeriodData())
    alert('已记录经期开始')
  }

  const handleSaveSettings = (cycleLength: number, duration: number) => {
    updatePeriodSettings({ cycleLength, duration })
    setPeriodData(getPeriodData())
    setShowSettings(false)
  }

  // Calendar logic
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Adjust for Monday start (0=Sun -> 6, 1=Mon -> 0)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6
    
    for (let i = 0; i < startDayOfWeek; i++) days.push({ day: null })
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const status = getDayStatus(dateStr, periodData)
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      days.push({ day: i, dateStr, status, isToday })
    }
    return days
  }, [currentDate, periodData])

  return (
    <div className="h-screen w-full bg-[#fffbf5] flex flex-col font-sans overflow-hidden text-[#5d4037]">
      {/* Consistent Background Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08]" 
        style={{ 
          backgroundImage: 'radial-gradient(#8b7355 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }}
      />

      {/* Top Bar */}
      <div className="relative z-20 shrink-0 bg-[#fffbf5]">
        <StatusBar />
        <div className="px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8b7355] hover:bg-[#f5efe6] transition-all"
          >
            <Icons.Back className="w-6 h-6" />
          </button>
          
          <div className="flex bg-[#f5efe6] p-1 rounded-full">
             <button 
               onClick={() => setViewMode('ring')}
               className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'ring' ? 'bg-[#5d4037] text-white shadow-md' : 'text-[#8b7355]/70'}`}
             >
               周期
             </button>
             <button 
               onClick={() => setViewMode('calendar')}
               className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-[#5d4037] text-white shadow-md' : 'text-[#8b7355]/70'}`}
             >
               日历
             </button>
          </div>

          <button 
            onClick={() => setShowSettings(true)} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8b7355] hover:bg-[#f5efe6] transition-all"
          >
            <Icons.Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Flex Column to fill height */}
      <div className="flex-1 overflow-hidden relative z-10">
        {viewMode === 'ring' ? (
          <div className="h-full flex flex-col items-center animate-fade-in overflow-y-auto">
            <div className="w-full max-w-sm my-auto px-6 py-4 flex flex-col gap-6 items-center">
              {/* Cycle Ring (Centered) */}
              <div className="w-full flex justify-center">
                <CycleRing 
                  data={periodData} 
                  todayCycleDay={todayCycleDay} 
                  settings={periodData.settings} 
                />
              </div>
              
              {/* Info Cards & Actions */}
              <div className="w-full flex flex-col gap-5">
                 <div className="flex gap-4">
                    <div 
                      className="flex-1 bg-white p-4 flex flex-col items-center justify-center gap-1 transition-all"
                      style={{ 
                        borderRadius: '24px',
                        boxShadow: '0 0 0 1.5px rgba(139,115,85,0.08), 0 2px 8px rgba(139,115,85,0.06)'
                      }}
                    >
                       <span className="text-xs text-[#8b7355]/80">距离下次经期</span>
                       <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold text-[#5d4037]">{periodData.settings.cycleLength - todayCycleDay + 1}</span>
                         <span className="text-xs text-[#5d4037]">天</span>
                       </div>
                    </div>
                    <div 
                      className="flex-1 bg-white p-4 flex flex-col items-center justify-center gap-1 transition-all"
                      style={{ 
                        borderRadius: '24px',
                        boxShadow: '0 0 0 1.5px rgba(139,115,85,0.08), 0 2px 8px rgba(139,115,85,0.06)'
                      }}
                    >
                       <span className="text-xs text-[#8b7355]/80">预测易孕期</span>
                       <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold text-[#5d4037]">{periodData.settings.cycleLength - 19}</span>
                         <span className="text-xs text-[#5d4037]">天后</span>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleRecordStart}
                   className="w-full py-4 bg-[#ffb7b2] text-white font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-[#ffab91]"
                   style={{
                     borderRadius: '24px',
                     boxShadow: '0 4px 12px rgba(255,183,178,0.4)'
                   }}
                 >
                   <Icons.Drop className="w-6 h-6" />
                   <span>大姨妈来了</span>
                 </button>
                 
                 <div className="text-center text-xs text-[#8b7355]/40 leading-relaxed">
                   关爱自己，多喝热水 ❤️
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col p-4 pb-safe animate-fade-in">
            {/* Calendar Container */}
            <div 
              className="bg-white p-5 flex flex-col flex-1 overflow-hidden mb-4"
              style={{ 
                borderRadius: '32px',
                boxShadow: '0 0 0 1.5px rgba(139,115,85,0.08), 0 4px 20px rgba(139,115,85,0.08)'
              }}
            >
               {/* Calendar Header */}
               <div className="flex items-center justify-between mb-4 shrink-0">
                 <button onClick={handlePrevMonth} className="p-2 text-[#8b7355] hover:bg-[#f5efe6] rounded-full transition-colors">
                   <Icons.ChevronLeft className="w-5 h-5" />
                 </button>
                 <div className="flex flex-col items-center">
                   <span className="text-xl font-bold text-[#5d4037]">
                     {currentDate.getMonth() + 1}月
                   </span>
                   <span className="text-xs text-[#8b7355]">{currentDate.getFullYear()}年</span>
                 </div>
                 <button onClick={handleNextMonth} className="p-2 text-[#8b7355] hover:bg-[#f5efe6] rounded-full transition-colors">
                   <Icons.ChevronRight className="w-5 h-5" />
                 </button>
               </div>
               
               {/* Week Header */}
               <div className="grid grid-cols-7 mb-2 shrink-0">
                 {['一', '二', '三', '四', '五', '六', '日'].map(w => (
                   <div key={w} className="text-center text-xs text-[#8b7355] font-bold py-2">
                     {w}
                   </div>
                 ))}
               </div>
               
               {/* Days Grid - Scrollable */}
               <div className="flex-1 overflow-y-auto no-scrollbar">
                 <div className="grid grid-cols-7 gap-y-1 gap-x-1 auto-rows-fr">
                   {calendarDays.map((item, idx) => (
                     <div key={idx} className="flex flex-col items-center justify-center min-h-[48px] relative aspect-square">
                       {item.day && (
                         <div 
                           className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-all relative
                           ${item.isToday ? 'bg-[#ffca28] text-[#5d4037] font-bold z-20 shadow-md' : 'text-[#5d4037]'}
                           ${!item.isToday && item.status?.type === 'period' ? 'bg-[#ffb7b2] text-white' : ''}
                           ${!item.isToday && item.status?.type === 'ovulation' ? 'bg-[#ff8a65] text-white' : ''}
                           ${!item.isToday && item.status?.type === 'fertile' ? 'bg-[#ffe0b2]/60' : ''}
                           `}
                           style={{ borderRadius: '14px' }}
                         >
                           {item.day}
                           {/* Indicators */}
                           {!item.isToday && item.status?.type === 'period' && (
                             <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full opacity-70"></div>
                           )}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
               
               {/* Legend */}
               <div className="flex justify-center flex-wrap gap-4 mt-4 pt-4 border-t border-[#f5efe6] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffb7b2]"></div>
                    <span className="text-xs text-[#8b7355]">经期</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff8a65]"></div>
                    <span className="text-xs text-[#8b7355]">排卵</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffe0b2]"></div>
                    <span className="text-xs text-[#8b7355]">易孕</span>
                  </div>
               </div>
            </div>
            
            <button 
               onClick={handleRecordStart}
               className="w-full py-4 bg-white text-[#5d4037] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-[#f5efe6]"
               style={{ 
                 borderRadius: '24px',
                 boxShadow: '0 0 0 1.5px rgba(139,115,85,0.08), 0 2px 8px rgba(139,115,85,0.06)'
               }}>
               <Icons.Drop className="w-5 h-5 text-[#ffb7b2]" />
               <span>记今天</span>
             </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#5d4037]/20 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
          <div className="relative w-full bg-[#fffbf5] rounded-t-[32px] p-6 animate-slide-up shadow-[0_-10px_40px_rgba(139,115,85,0.15)] pb-10">
            <div className="w-12 h-1.5 bg-[#e0d6cc] rounded-full mx-auto mb-8"></div>
            <h3 className="text-xl font-bold text-[#5d4037] mb-8 text-center font-serif">周期设置</h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4 px-2">
                  <label className="text-base text-[#8b7355] font-bold">经期持续</label>
                  <span className="text-sm bg-[#ffb7b2] text-white px-3 py-1 rounded-full font-bold">{periodData.settings.duration} 天</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-1">
                  {[3,4,5,6,7,8,9,10].map(num => (
                    <button
                      key={num}
                      onClick={() => handleSaveSettings(periodData.settings.cycleLength, num)}
                      className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-lg transition-all
                        ${periodData.settings.duration === num 
                          ? 'bg-[#5d4037] text-white shadow-lg scale-105' 
                          : 'bg-white border border-[#fff] text-[#8b7355] hover:bg-[#f5efe6]'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 px-2">
                  <label className="text-base text-[#8b7355] font-bold">周期长度</label>
                  <span className="text-sm bg-[#ffe0b2] text-[#5d4037] px-3 py-1 rounded-full font-bold">{periodData.settings.cycleLength} 天</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-1">
                  {[24,25,26,27,28,29,30,31,32,33,34,35].map(num => (
                    <button
                      key={num}
                      onClick={() => handleSaveSettings(num, periodData.settings.duration)}
                      className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-lg transition-all
                        ${periodData.settings.cycleLength === num 
                          ? 'bg-[#5d4037] text-white shadow-lg scale-105' 
                          : 'bg-white border border-[#fff] text-[#8b7355] hover:bg-[#f5efe6]'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-10 py-4 bg-[#5d4037] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all hover:bg-[#4e342e]"
            >
              保存设置
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  )
}

export default CouplePeriod
