import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCheckInStats, 
  doCheckIn, 
  getCheckIns, 
  DAILY_TASKS, 
  type CheckInStats, 
  type CheckInRecord 
} from '../utils/coupleSpaceCheckInUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'
import { addMessage } from '../utils/simpleMessageManager'
import { callZhizhiApi } from '../services/zhizhiapi'
import type { Message } from '../types/chat'

// Icons
const Icons = {
  Back: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Check: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Fire: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  Share: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  )
}

// Styles for shaking animation
const shakeKeyframes = `
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
@keyframes drop {
  0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
  60% { transform: translateY(20px) rotate(5deg); opacity: 1; }
  80% { transform: translateY(-10px) rotate(-2deg); }
  100% { transform: translateY(0) rotate(0deg); }
}
`

const CoupleCheckIn = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<CheckInStats>({ totalDays: 0, currentStreak: 0 })
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null)
  const [historyRecords, setHistoryRecords] = useState<CheckInRecord[]>([])
  
  // Animation & Interaction states
  const [isShaking, setIsShaking] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [fortuneText, setFortuneText] = useState('')
  const [loadingFortune, setLoadingFortune] = useState(false)
  
  const [characterAvatar, setCharacterAvatar] = useState('')

  useEffect(() => {
    loadData()
    loadHistory()
    loadCharacter()
  }, [])

  const loadCharacter = () => {
    const rel = getCoupleSpaceRelation()
    if (rel?.characterAvatar) {
      setCharacterAvatar(rel.characterAvatar)
    }
  }

  const loadData = async () => {
    const s = await getCheckInStats()
    setStats(s)
    
    // Check if checked in today
    const today = new Date().toISOString().split('T')[0]
    if (s.lastCheckInDate === today) {
      const records = await getCheckIns()
      const todayRec = records.find(r => r.date === today)
      if (todayRec) {
        setTodayRecord(todayRec)
        // If loaded existing record, maybe show it? 
        // For now, we just show the "Checked In" state
      }
    }
  }

  const loadHistory = async () => {
    const records = await getCheckIns()
    // Sort by date descending
    const sorted = records.sort((a, b) => b.timestamp - a.timestamp)
    setHistoryRecords(sorted)
  }

  const handleStickClick = async () => {
    if (todayRecord || isShaking || loadingFortune) return

    setIsShaking(true)
    setLoadingFortune(true)

    try {
      // 1. Generate Fortune Text using zhizhiapi
      const prompt = `为情侣生成一个今天晚上的浪漫或有趣的活动建议。
格式必须严格为：“今日一夜：[活动内容]”。
活动内容要新颖、具体、有趣，适合情侣互动。
例如：
今日一夜：一起窝在沙发上看一部恐怖电影
今日一夜：互相给对方化一个搞怪的妆容
今日一夜：一起做一顿丰盛的晚餐
只返回这一句内容，不要其他废话。`

      const aiContent = await callZhizhiApi([
        { role: 'user', content: prompt }
      ], { temperature: 0.8 })

      const finalContent = aiContent.trim() || '今日一夜：一起数星星'
      
      // 2. Wait for animation a bit
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. Save Record
      const { record, stats: newStats } = await doCheckIn(undefined, undefined, {
        content: finalContent,
        type: 'task'
      })

      setStats(newStats)
      setTodayRecord(record)
      setFortuneText(finalContent)
      
      // 4. Stop shaking and show result
      setIsShaking(false)
      setLoadingFortune(false)
      setShowResult(true)

      // 5. Reload history
      loadHistory()

      // 6. Send system message
      const rel = getCoupleSpaceRelation()
      if (rel && rel.characterId) {
        const sysMsg: Message = {
          id: Date.now(),
          type: 'system',
          content: '已完成今日情侣打卡',
          aiReadableContent: `[系统消息] 用户完成了今日情侣打卡，连续打卡 ${newStats.currentStreak} 天。${finalContent}`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        addMessage(rel.characterId, sysMsg)
      }

    } catch (e) {
      console.error(e)
      setIsShaking(false)
      setLoadingFortune(false)
      alert('打卡失败，请重试')
    }
  }

  const handleShare = () => {
    const rel = getCoupleSpaceRelation()
    if (rel && rel.characterId && todayRecord) {
      const fortuneContent = todayRecord.customFortuneContent || DAILY_TASKS.find(t => t.id === todayRecord.fortuneId)?.content || '未知运势'
      
      const msg: Message = {
        id: Date.now(),
        type: 'sent',
        content: '[情侣打卡]',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'checkIn',
        checkIn: {
          streak: stats.currentStreak,
          fortune: fortuneContent,
          fortuneType: todayRecord.customFortuneType || 'task',
          level: '上上签' // 默认上上签，或者根据逻辑判断
        }
      }
      addMessage(rel.characterId, msg)
      setShowResult(false)
      navigate(`/chat/${rel.characterId}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] pb-10 relative overflow-hidden">
      <style>{shakeKeyframes}</style>
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fffbf5]/90 backdrop-blur-sm border-b border-[#ebdccb]">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#8b7355]">
          <Icons.Back className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
           {characterAvatar && (
             <div className="w-6 h-6 rounded-full overflow-hidden border border-[#8b7355]/30">
               <img src={characterAvatar} alt="partner" className="w-full h-full object-cover" />
             </div>
           )}
           <span className="text-lg font-bold text-[#8b7355]">情侣打卡</span>
        </div>
        <div className="w-10" />
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebdccb] flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-400">
               <Icons.Fire className="w-6 h-6" />
             </div>
             <span className="text-2xl font-bold text-[#8b7355]">{stats.currentStreak}</span>
             <span className="text-xs text-gray-400">连续打卡</span>
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div className="flex flex-col items-center gap-1">
             <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-400">
               <Icons.Clock className="w-5 h-5" />
             </div>
             <span className="text-2xl font-bold text-[#8b7355]">{stats.totalDays}</span>
             <span className="text-xs text-gray-400">累计天数</span>
          </div>
        </div>

        {/* Fortune Stick Container */}
        <div className="relative h-80 flex items-center justify-center">
          {!todayRecord && !showResult ? (
            <div 
              className={`relative cursor-pointer transition-transform ${isShaking ? 'animate-[shake_0.5s_infinite]' : 'hover:scale-105'}`}
              onClick={handleStickClick}
            >
               {/* 签筒筒身 */}
               <div className="w-32 h-48 bg-gradient-to-b from-[#8b5a2b] to-[#5d3a1a] rounded-b-3xl rounded-t-lg relative z-10 shadow-xl border-t-4 border-[#a67c52] flex items-center justify-center">
                 <div className="w-24 h-40 border-2 border-[#a67c52]/30 rounded-b-2xl absolute bottom-2"></div>
                 <span className="text-[#e8dccb] font-serif text-2xl writing-vertical-rl tracking-widest opacity-80 select-none">
                   {loadingFortune ? '求签中...' : '点击抽签'}
                 </span>
               </div>
               
               {/* 签子顶部（未摇出） */}
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-12 flex justify-center gap-1 z-0 overflow-hidden">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-3 h-16 bg-[#d4b595] rounded-t-sm border border-[#8b5a2b] transform origin-bottom" 
                        style={{ 
                          transform: `rotate(${(i - 2) * 5}deg) translateY(${isShaking ? Math.random() * 10 : 0}px)`,
                          transition: 'transform 0.1s'
                        }} 
                   />
                 ))}
               </div>
            </div>
          ) : (
            <div className="animate-[drop_0.6s_ease-out_forwards] flex flex-col items-center">
               {/* 掉落的签子 */}
               <div className="bg-[#fff9f0] border-2 border-[#8b5a2b] rounded-lg p-6 shadow-xl max-w-xs w-full relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#d32f2f] rounded-full shadow-md flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                   吉
                 </div>
                 
                 <div className="border border-[#ebdccb] rounded p-4 text-center mt-2">
                   <h3 className="text-[#8b5a2b] font-serif font-bold text-xl mb-3">上上签</h3>
                   <p className="text-[#5d4037] text-lg font-medium leading-relaxed">
                     {todayRecord?.customFortuneContent || fortuneText || DAILY_TASKS.find(t => t.id === todayRecord?.fortuneId)?.content}
                   </p>
                 </div>

                 <div className="mt-4 flex gap-2">
                    <button 
                      onClick={handleShare}
                      className="flex-1 bg-[#8b5a2b] text-white py-2 rounded-lg font-medium text-sm hover:bg-[#704822] transition-colors flex items-center justify-center gap-1"
                    >
                      <Icons.Share className="w-4 h-4" />
                      分享给TA
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Check-in History List */}
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-sm font-bold text-[#8b7355] ml-1">打卡记录</h3>
          
          <div className="flex flex-col gap-3">
            {historyRecords.length > 0 ? (
              historyRecords.map((record) => {
                const taskContent = record.customFortuneContent || DAILY_TASKS.find(t => t.id === record.fortuneId)?.content
                const date = new Date(record.date)
                const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
                
                return (
                  <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#ebdccb]/50 flex items-center gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-[#fffbf5] rounded-lg border border-[#ebdccb] text-[#8b7355]">
                      <span className="text-xs font-medium">{dateStr}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full">
                          {record.customFortuneType === 'task' ? '今日一夜' : '任务'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-[#5d4037] truncate">
                        {taskContent || '完成打卡'}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                还没有打卡记录，快开始吧！
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoupleCheckIn
