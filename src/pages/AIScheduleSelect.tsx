import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'

const AIScheduleSelect = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCharacters = () => {
      try {
        const latestCharacters = characterService.getAll()
        const validCharacters = latestCharacters.filter((char: any) => {
          return char && typeof char === 'object' && char.id && char.realName
        })
        setCharacters(validCharacters)
      } catch (error) {
        console.error('加载角色失败:', error)
      }
    }
    
    const timer = setTimeout(() => {
      loadCharacters()
      setIsLoading(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  const handleCharacterSelect = (character: any) => {
    navigate(`/ai-schedule/${character.id}`)
  }

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] text-[#4A4A4A] flex flex-col relative overflow-hidden">
      {/* 装饰背景纹理 */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }} 
      />

      {/* 状态栏和导航栏 */}
      <div className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-sm">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-black/5 transition-colors"
          >
            <BackIcon size={20} className="text-[#5C5C5C]" />
          </button>
          <h1 className="text-lg tracking-wider text-[#2C2C2C]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            选择角色
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 标题装饰 */}
      <div className="text-center py-6">
        <div className="text-xs text-[#A0A0A0] tracking-[0.3em] mb-2">SCHEDULE</div>
        <div className="text-2xl text-[#2C2C2C]" style={{ fontFamily: '"Didot", "Bodoni MT", serif' }}>
          查看 TA 的一天
        </div>
        <div className="w-12 h-[1px] bg-[#D4D4D4] mx-auto mt-4"></div>
      </div>

      {/* 角色列表 */}
      <div className="flex-1 px-5 pb-20 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-sm text-[#8C8C8C]">加载中...</div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">📖</div>
            <div className="text-[#8C8C8C] mb-2">暂无角色</div>
            <div className="text-sm text-[#B0B0B0]">请先在微信中添加AI角色</div>
          </div>
        ) : (
          <div className="space-y-4">
            {characters.map((character: any) => {
              const characterName = character.realName || '未命名'
              const signature = character.signature || '这个人很神秘，没有签名'
              
              return (
                <button
                  key={character.id}
                  onClick={() => handleCharacterSelect(character)}
                  className="w-full group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-[#E8E4DF] shadow-sm hover:shadow-md hover:border-[#D4A373]/30 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      {/* 头像 */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F0EBE3] group-hover:border-[#D4A373]/50 transition-colors">
                          {character.avatar ? (
                            <img 
                              src={character.avatar} 
                              alt={characterName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#F5F0EA] to-[#E8E4DF] flex items-center justify-center">
                              <span className="text-2xl text-[#8C8C8C]">{characterName[0]}</span>
                            </div>
                          )}
                        </div>
                        {/* 在线状态点 */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#A8C686] rounded-full border-2 border-white"></div>
                      </div>
                      
                      {/* 信息 */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-base font-medium text-[#2C2C2C] mb-1 truncate">
                          {characterName}
                        </div>
                        <div className="text-sm text-[#8C8C8C] truncate italic">
                          "{signature}"
                        </div>
                      </div>
                      
                      {/* 箭头 */}
                      <div className="text-[#C0C0C0] group-hover:text-[#D4A373] group-hover:translate-x-1 transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部装饰 */}
      <div className="fixed bottom-6 left-0 right-0 text-center pointer-events-none">
        <div className="text-[10px] text-[#C0C0C0] tracking-[0.15em]">
          ✦ 轻触查看行程 ✦
        </div>
      </div>
    </div>
  )
}

export default AIScheduleSelect
