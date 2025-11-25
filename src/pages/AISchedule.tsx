import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import { playSystemSound } from '../utils/soundManager'
import { characterService } from '../services/characterService'
import StatusBar from '../components/StatusBar'
import { getTodaySchedule, type ScheduleItem } from '../utils/aiScheduleHistory'
import { generatePersonalizedSchedule } from '../services/aiScheduleService'


const AISchedule = () => {
  const navigate = useNavigate()
  const { characterId } = useParams<{ characterId: string }>()
  const [character, setCharacter] = useState<any>(null)
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  
  useEffect(() => {
    const loadCharacter = () => {
      if (!characterId) {
        navigate('/ai-schedule-select')
        return
      }
      
      const char = characterService.getById(characterId)
      if (char) {
        setCharacter(char)
        setItems(getTodaySchedule(characterId))
      }
      setIsLoading(false)
    }
    
    const timer = setTimeout(loadCharacter, 200)
    return () => clearTimeout(timer)
  }, [characterId, navigate])
  
  const handleBack = () => {
    playSystemSound()
    navigate(-1)
  }

  const handleGenerateSchedule = async () => {
    if (!character || !characterId || isGenerating) return
    
    try {
      setIsGenerating(true)
      playSystemSound()
      
      const generatedItems = await generatePersonalizedSchedule({
        characterId,
        character,
        userName: '用户'
      })
      
      setItems(generatedItems)
    } catch (error) {
      console.error('生成AI行程失败:', error)
      // 可以添加错误提示
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const characterName = character?.realName || '未命名'

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] text-[#4A4A4A] flex flex-col relative overflow-hidden">
      {/* 装饰背景纹理 */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }} 
      />

      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-sm">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <div 
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 transition-colors cursor-pointer"
            onClick={handleBack}
          >
            <BackIcon className="text-[#5C5C5C]" size={22} />
          </div>
          <h1 className="text-base tracking-wider text-[#2C2C2C]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            {characterName} 的一天
          </h1>
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              isGenerating ? 'bg-[#D4A373]/10' : 'active:bg-black/5'
            }`}
            title={isGenerating ? "AI正在生成中..." : "AI生成个性化行程"}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#5C5C5C]">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 px-5 py-4 overflow-y-auto pb-20">
        
        {/* 角色信息卡片 */}
        <div className="mb-8 flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-[#E8E4DF]">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#F0EBE3] flex-shrink-0">
            {character?.avatar ? (
              <img src={character.avatar} alt={characterName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#F5F0EA] to-[#E8E4DF] flex items-center justify-center">
                <span className="text-xl text-[#8C8C8C]">{characterName[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-[#2C2C2C]">{characterName}</div>
            <div className="text-xs text-[#A0A0A0] mt-1 truncate italic">
              "{character?.signature || '今天也是美好的一天'}"
            </div>
          </div>
        </div>

        {/* 日期标题 */}
        <div className="mb-8 text-center">
          <div className="text-xs text-[#A0A0A0] tracking-[0.3em] mb-1">TODAY</div>
          <div className="text-2xl text-[#2C2C2C]" style={{ fontFamily: '"Didot", "Bodoni MT", serif' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </div>
          <div className="w-8 h-[1px] bg-[#D4D4D4] mx-auto mt-3"></div>
        </div>

        {/* 时间轴列表 */}
        <div className="relative max-w-md mx-auto">
          {/* 垂直连接线 */}
          <div className="absolute left-[55px] top-3 bottom-3 w-[1px] bg-[#E8E4DF]"></div>

          {items.map((item) => (
            <div key={item.id} className="relative flex mb-10 group last:mb-0">
              {/* 左侧时间 */}
              <div className="w-[55px] pr-3 pt-0.5 text-right flex-shrink-0">
                <span className={`text-xs font-medium tracking-wide ${
                  item.type === 'past' ? 'text-[#B0B0B0]' : 
                  item.type === 'current' ? 'text-[#D4A373]' : 'text-[#6B6B6B]'
                }`} style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {item.time}
                </span>
              </div>

              {/* 中间节点 */}
              <div className="absolute left-[55px] top-1.5 -translate-x-1/2 z-10">
                <div className={`w-2.5 h-2.5 rounded-full border-[1.5px] transition-all duration-300 ${
                  item.type === 'current' 
                    ? 'bg-[#D4A373] border-[#D4A373] shadow-[0_0_0_3px_rgba(212,163,115,0.15)]' 
                    : item.type === 'past' 
                      ? 'bg-[#D4D4D4] border-[#D4D4D4]'
                      : 'bg-[#FDFBF7] border-[#8C8C8C]'
                }`}></div>
              </div>

              {/* 右侧内容 */}
              <div className="flex-1 pl-5">
                <div className={`transition-all duration-300 ${item.type === 'current' ? 'translate-x-0.5' : ''}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className={`text-sm font-medium ${
                      item.type === 'past' ? 'text-[#A0A0A0]' : 'text-[#2C2C2C]'
                    }`}>
                      {item.title}
                    </h3>
                    {item.isReal && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373] opacity-80"></div>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${
                    item.type === 'past' ? 'text-[#B8B8B8]' : 'text-[#7A7A7A]'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部装饰 */}
        <div className="mt-12 text-center">
          <div className="text-[10px] text-[#C0C0C0] tracking-[0.15em]">
            — ✦ —
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISchedule
