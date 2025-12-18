import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Utensils, Gamepad2, Bath, Moon, Heart, Zap, Sparkles, Send, X, Trash2, MessageCircle, Info, Cookie, Milk, Beef } from 'lucide-react'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'
import { addMessage } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface PetData {
  status: 'none' | 'naming' | 'waitingAI' | 'waitingConfirm' | 'egg' | 'hatched'
  name: string
  gender?: '男' | '女'
  userProposal: string
  userGender?: '男' | '女'
  aiProposal: string
  aiGender?: '男' | '女'
  hunger: number
  happiness: number
  energy: number
  cleanliness: number
  level: number
  exp: number
  createdAt?: number
  birthday?: string // 生日字符串
}

const DEFAULT_PET: PetData = {
  status: 'none',
  name: '',
  userProposal: '',
  aiProposal: '',
  hunger: 80,
  happiness: 80,
  energy: 90,
  cleanliness: 85,
  level: 1,
  exp: 0
}

// 模拟食物数据
const FOOD_ITEMS = [
  { id: 1, name: '小饼干', icon: '🍪', hunger: 10, color: 'bg-orange-100' },
  { id: 2, name: '热牛奶', icon: '🥛', hunger: 15, color: 'bg-blue-50' },
  { id: 3, name: '美味肉排', icon: '🥩', hunger: 30, color: 'bg-red-50' },
]

// -----------------------------------------------------------------------------
// SVG Components
// -----------------------------------------------------------------------------

const EggSVG = ({ className, gender }: { className?: string; gender?: '男' | '女' }) => (
  <svg viewBox="0 0 200 240" className={className}>
    <defs>
      <radialGradient id={`eggGrad-${gender || 'default'}`} cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor={gender === '女' ? '#fff0f5' : gender === '男' ? '#f0f5ff' : '#fff9f0'} />
        <stop offset="100%" stopColor={gender === '女' ? '#fce4ec' : gender === '男' ? '#e3f2fd' : '#f3e5d8'} />
      </radialGradient>
    </defs>
    <path 
      d="M100 20 C 160 20, 190 100, 190 150 C 190 210, 150 235, 100 235 C 50 235, 10 210, 10 150 C 10 100, 40 20, 100 20 Z" 
      fill={`url(#eggGrad-${gender || 'default'})`}
      stroke={gender === '女' ? '#f8bbd0' : gender === '男' ? '#90caf9' : '#d7ccc8'}
      strokeWidth="2"
    />
    <ellipse cx="70" cy="80" rx="20" ry="30" fill="white" fillOpacity="0.5" transform="rotate(-20 70 80)" />
    <circle cx="140" cy="180" r="6" fill={gender === '女' ? '#f8bbd0' : gender === '男' ? '#90caf9' : '#d7ccc8'} opacity="0.4" />
    <circle cx="55" cy="140" r="8" fill={gender === '女' ? '#f8bbd0' : gender === '男' ? '#90caf9' : '#d7ccc8'} opacity="0.3" />
  </svg>
)

const PetSVG = ({ mood, className }: { mood: string; className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    <ellipse cx="100" cy="185" rx="55" ry="8" fill="#000" opacity="0.08" />
    <circle cx="100" cy="110" r="60" fill="#fff" stroke="#8b7355" strokeWidth="3" />
    <path d="M55 70 Q 30 15, 70 50 Z" fill="#fff" stroke="#8b7355" strokeWidth="3" />
    <path d="M145 70 Q 170 15, 130 50 Z" fill="#fff" stroke="#8b7355" strokeWidth="3" />
    <path d="M58 62 Q 42 32, 66 52 Z" fill="#ffcdd2" opacity="0.5" />
    <path d="M142 62 Q 158 32, 134 52 Z" fill="#ffcdd2" opacity="0.5" />
    {mood === 'happy' ? (
      <>
        <path d="M78 100 Q88 90, 98 100" fill="none" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M102 100 Q112 90, 122 100" fill="none" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ) : mood === 'eating' ? (
      <>
        <path d="M80 98 L92 98" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M108 98 L120 98" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ) : mood === 'sleeping' ? (
      <>
        <path d="M78 102 Q88 108, 98 102" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
        <path d="M102 102 Q112 108, 122 102" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="85" cy="100" r="5" fill="#5d4037" />
        <circle cx="115" cy="100" r="5" fill="#5d4037" />
      </>
    )}
    {mood === 'eating' ? (
      <circle cx="100" cy="118" r="8" fill="#ffab91" />
    ) : (
      <path d="M95 115 Q100 120, 105 115" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
    )}
    <circle cx="72" cy="112" r="6" fill="#ffcdd2" opacity="0.45" />
    <circle cx="128" cy="112" r="6" fill="#ffcdd2" opacity="0.45" />
  </svg>
)

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

const CouplePet = () => {
  const navigate = useNavigate()
  const [pet, setPet] = useState<PetData>(DEFAULT_PET)
  const [nameInput, setNameInput] = useState('')
  const [genderInput, setGenderInput] = useState<'男' | '女'>('男')
  const [mood, setMood] = useState<'normal' | 'happy' | 'eating' | 'sleeping'>('normal')
  const [characterId, setCharacterId] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showFoodMenu, setShowFoodMenu] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const saved = localStorage.getItem('couple_pet_data')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (!parsed.birthday && parsed.createdAt) {
        parsed.birthday = new Date(parsed.createdAt).toLocaleDateString('zh-CN')
      }
      setPet(parsed)
    }
    const relation = getCoupleSpaceRelation()
    if (relation) {
      setCharacterId(relation.characterId)
      setCharacterName(relation.characterName)
    }
  }

  const savePet = (newPet: PetData) => {
    setPet(newPet)
    localStorage.setItem('couple_pet_data', JSON.stringify(newPet))
  }

  // 弃养宠物
  const handleAbandon = () => {
    if (window.confirm('确定要弃养这只宠物吗？弃养后无法找回，所有数据将被清空。')) {
      savePet(DEFAULT_PET)
      setShowProfile(false)
    }
  }

  // 发送领养卡片到聊天
  const handleSendAdoptionCard = () => {
    if (!nameInput.trim() || !characterId) return

    const newPet: PetData = {
      ...pet,
      status: 'waitingAI',
      userProposal: nameInput.trim(),
      userGender: genderInput
    }
    savePet(newPet)

    // 构造消息并保存到聊天记录
    const now = Date.now()
    const genderText = genderInput === '女' ? '女宝宝' : '男宝宝'
    const adoptionMessage: Message = {
      id: now,
      type: 'sent',
      content: `[领养宠物]`,
      timestamp: now,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      aiReadableContent: `[宠物领养申请] 我想和你一起领养一只宠物！我选择的是${genderText}，取名「${nameInput.trim()}」。你可以选择：
1. 接受领养 - 使用 [接受领养:你想的名字:性别] 格式回复，比如 [接受领养:小花:女] 或 [接受领养:小黑:男]
2. 拒绝领养 - 使用 [拒绝领养] 回复`,
      petAdoption: {
        userProposal: nameInput.trim(),
        userGender: genderInput,
        status: 'pending'
      }
    } as Message & { petAdoption: any }

    // 使用正确的消息管理器保存消息
    addMessage(characterId, adoptionMessage)

    // 跳转到聊天页面
    navigate(`/chat/${characterId}`)
  }

  // ---------------------------------------------------------------------------
  // Render: 宠物档案模态框
  // ---------------------------------------------------------------------------
  const renderProfileModal = () => {
    if (!showProfile) return null

    const ageDays = pet.createdAt 
      ? Math.floor((Date.now() - pet.createdAt) / (1000 * 60 * 60 * 24)) + 1 
      : 1

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
        
        <div className="relative w-full max-w-[320px] bg-[#fdfbf7] rounded-2xl shadow-2xl border border-[#e0dcd5] overflow-hidden animate-bounce-slow">
          {/* Header */}
          <div className="h-14 bg-[#8b7355] flex items-center justify-between px-4 relative">
             <div className="flex items-center gap-2 text-white z-10">
               <Info size={18} />
               <span className="font-serif font-bold tracking-widest">宠物档案</span>
             </div>
             <button 
               onClick={() => setShowProfile(false)}
               className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
             >
               <X size={16} />
             </button>
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* ID Card Header */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-24 bg-gray-100 rounded-lg border-2 border-[#d7ccc8] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
                {pet.status === 'egg' ? (
                  <EggSVG className="w-16 h-20" gender={pet.gender} />
                ) : (
                  <PetSVG mood="normal" className="w-16 h-16" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xl font-bold text-[#5d4037] font-serif">{pet.name}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    pet.gender === '女' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>
                    {pet.gender === '女' ? '♀ MM' : '♂ GG'}
                  </span>
                  <span className="text-xs text-[#8b7355] bg-[#efebe9] px-1.5 py-0.5 rounded">
                    Lv.{pet.level}
                  </span>
                </div>
                <div className="text-xs text-[#bcaaa4] mt-1">
                  ID: {Date.now().toString().slice(-8)}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#fff8e1] p-3 rounded-xl border border-[#ffe0b2]">
                <div className="text-[10px] text-[#ffb74d] font-bold mb-1">年龄 / Age</div>
                <div className="text-sm font-bold text-[#f57c00]">{ageDays} 天</div>
              </div>
              <div className="bg-[#e3f2fd] p-3 rounded-xl border border-[#bbdefb]">
                <div className="text-[10px] text-[#64b5f6] font-bold mb-1">生日 / Birthday</div>
                <div className="text-sm font-bold text-[#1976d2]">{pet.birthday || '未知'}</div>
              </div>
              <div className="bg-[#f3e5f5] p-3 rounded-xl border border-[#e1bee7]">
                <div className="text-[10px] text-[#ba68c8] font-bold mb-1">主人 / Owner</div>
                <div className="text-sm font-bold text-[#7b1fa2]">我 & {characterName || 'TA'}</div>
              </div>
              <div className="bg-[#e0f2f1] p-3 rounded-xl border border-[#b2dfdb]">
                <div className="text-[10px] text-[#4db6ac] font-bold mb-1">状态 / Status</div>
                <div className="text-sm font-bold text-[#00796b]">
                  {pet.status === 'egg' ? '孵化中' : '健康成长'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#f0ebe5]">
              <button
                onClick={handleAbandon}
                className="w-full py-3 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>弃养宠物</span>
              </button>
              <p className="text-[10px] text-center text-[#d7ccc8] mt-2">
                注意：弃养后数据将无法恢复
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: 食物菜单（拖拽喂食骨架）
  // ---------------------------------------------------------------------------
  const renderFoodMenu = () => {
    if (!showFoodMenu) return null

    return (
      <div className="absolute bottom-[80px] left-4 right-4 z-40 animate-bounce-slow">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#f0ebe5]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-[#5d4037]">选择食物喂食</h3>
            <button onClick={() => setShowFoodMenu(false)} className="text-[#bcaaa4] hover:text-[#8b7355]">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {FOOD_ITEMS.map(item => (
              <div 
                key={item.id}
                className={`flex-shrink-0 w-16 h-20 ${item.color} rounded-xl border border-black/5 flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('foodId', item.id.toString())
                  // 简单的触觉反馈
                  if (navigator.vibrate) navigator.vibrate(10)
                }}
                onClick={() => {
                  // 点击也可以喂食（兼容非拖拽）
                  handleFeed()
                }}
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="text-[10px] font-bold text-[#5d4037]">{item.name}</div>
                <div className="text-[9px] text-[#8d6e63]">+{item.hunger}</div>
              </div>
            ))}
          </div>
          <div className="text-center text-[10px] text-[#bcaaa4] mt-2">
            按住食物拖拽给{pet.name}
          </div>
        </div>
      </div>
    )
  }

  // 互动操作
  const handleFeed = () => {
    if (mood === 'sleeping' || pet.status !== 'egg') return
    setMood('eating')
    const newPet = { ...pet, hunger: Math.min(100, pet.hunger + 20), exp: pet.exp + 5 }
    savePet(newPet)
    setTimeout(() => setMood('happy'), 1500)
    setTimeout(() => setMood('normal'), 4000)
  }

  const handlePlay = () => {
    if (mood === 'sleeping' || pet.status !== 'egg') return
    setMood('happy')
    const newPet = { ...pet, happiness: Math.min(100, pet.happiness + 15), energy: Math.max(0, pet.energy - 10), exp: pet.exp + 10 }
    savePet(newPet)
    setTimeout(() => setMood('normal'), 3000)
  }

  const handleClean = () => {
    if (mood === 'sleeping' || pet.status !== 'egg') return
    setMood('happy')
    const newPet = { ...pet, cleanliness: 100, exp: pet.exp + 5 }
    savePet(newPet)
    setTimeout(() => setMood('normal'), 2000)
  }

  const handleSleep = () => {
    if (pet.status !== 'egg') return
    if (mood === 'sleeping') {
      setMood('normal')
    } else {
      setMood('sleeping')
      const newPet = { ...pet, energy: 100 }
      savePet(newPet)
    }
  }

  // ---------------------------------------------------------------------------
  // Render: 空状态 - 还没有宠物
  // ---------------------------------------------------------------------------
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      {/* 空巢穴插图 */}
      <div className="w-48 h-48 mb-8 relative">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* 巢穴 */}
          <ellipse cx="100" cy="160" rx="80" ry="30" fill="#d7ccc8" />
          <ellipse cx="100" cy="155" rx="70" ry="25" fill="#efebe9" />
          {/* 草/枝条装饰 */}
          <path d="M40 150 Q50 130, 45 110" stroke="#a1887f" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M160 150 Q150 125, 158 105" stroke="#a1887f" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 155 Q65 140, 72 125" stroke="#8d6e63" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M130 155 Q138 138, 132 120" stroke="#8d6e63" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* 问号 */}
          <text x="100" y="100" textAnchor="middle" fontSize="48" fill="#bcaaa4" fontWeight="bold">?</text>
        </svg>
      </div>

      <h2 className="text-xl font-bold text-[#5d4037] mb-2">暂时还没有宠物</h2>
      <p className="text-[#8b7355] text-sm text-center mb-8">和{characterName || 'TA'}一起领养一只可爱的小宠物吧</p>

      <button
        onClick={() => savePet({ ...pet, status: 'naming' })}
        className="px-8 py-3 bg-[#5d4037] text-white rounded-full font-bold shadow-lg hover:bg-[#4a332a] active:scale-95 transition-all flex items-center gap-2"
      >
        <Sparkles size={18} />
        去领养
      </button>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Render: 取名阶段
  // ---------------------------------------------------------------------------
  const renderNamingState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-[#5d4037] mb-6 font-serif">居民身份登记</h2>

      {/* ID Card Form */}
      <div className="w-full max-w-[320px] bg-[#fdfbf7] rounded-xl shadow-xl border border-[#e0dcd5] overflow-hidden relative">
         {/* Texture */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '12px 12px' }} 
         />

         {/* Header */}
         <div className="h-12 bg-[#8b7355] flex items-center justify-between px-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
            </div>
            <div className="flex items-center gap-2 z-10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <span className="text-white font-serif tracking-widest text-sm font-bold">宠物居民申请表</span>
            </div>
            <div className="text-[10px] text-white/60 font-mono tracking-wider z-10">APPLICATION</div>
         </div>

         {/* Content */}
         <div className="p-5">
            <div className="flex gap-4">
               {/* Photo Frame */}
               <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="relative w-20 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
                    <div className="w-16 h-20 relative z-10 flex items-center justify-center">
                       <EggSVG className="w-full h-auto drop-shadow-md" gender={genderInput} />
                    </div>
                    {/* Gender Badge */}
                    <div className={`absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold rounded-tl-md transition-colors ${
                      genderInput === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {genderInput === '女' ? '♀' : '♂'}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-[#f0ebe5] rounded text-[10px] text-[#8b7355] font-mono">
                    待审核
                  </div>
               </div>

               {/* Fields */}
               <div className="flex-1 space-y-4 pt-1">
                  {/* Name Input */}
                  <div>
                    <div className="text-[10px] text-[#bcaaa4] mb-1">拟定姓名 / Name</div>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="输入名字"
                      maxLength={10}
                      className="w-full text-base font-bold text-[#5d4037] bg-transparent border-b border-[#8b7355] pb-1 outline-none focus:border-blue-500 placeholder:text-[#d7ccc8] transition-colors font-serif"
                    />
                  </div>

                  {/* Gender Selection */}
                  <div>
                    <div className="text-[10px] text-[#bcaaa4] mb-1.5">性别 / Gender</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGenderInput('男')}
                        className={`flex-1 py-1 rounded border text-xs font-bold transition-all ${
                          genderInput === '男' 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'border-[#e0dcd5] text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        ♂ 男
                      </button>
                      <button
                        onClick={() => setGenderInput('女')}
                        className={`flex-1 py-1 rounded border text-xs font-bold transition-all ${
                          genderInput === '女' 
                            ? 'bg-pink-50 border-pink-200 text-pink-600' 
                            : 'border-[#e0dcd5] text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        ♀ 女
                      </button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 border-t border-[#f0ebe5] pt-4">
               <div className="flex items-center justify-between text-[10px] text-[#bcaaa4] mb-4">
                 <span>申请人: 我</span>
                 <span>审批人: {characterName || 'TA'}</span>
               </div>

               <button
                  onClick={handleSendAdoptionCard}
                  disabled={!nameInput.trim() || !characterId}
                  className="w-full py-3 bg-[#5d4037] text-white rounded-lg text-sm font-bold hover:bg-[#4a332a] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>提交申请</span>
                  <Send size={14} />
                </button>
            </div>
         </div>
      </div>

      <p className="text-[10px] text-[#bcaaa4] mt-6 text-center max-w-xs">
        提交后将生成正式的领养申请卡片，需等待{characterName || 'TA'}签署确认生效。
      </p>
    </div>
  )

  // 重新发送领养卡片
  const handleResendAdoptionCard = () => {
    if (!characterId || !pet.userProposal) return

    const now = Date.now()
    const userGender = (pet as any).userGender || genderInput
    const genderText = userGender === '女' ? '女宝宝' : '男宝宝'
    const adoptionMessage: Message = {
      id: now,
      type: 'sent',
      content: `[领养宠物]`,
      timestamp: now,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      aiReadableContent: `[宠物领养申请] 我想和你一起领养一只宠物！我选择的是${genderText}，取名「${pet.userProposal}」。你可以选择：
1. 接受领养 - 使用 [接受领养:你想的名字:性别] 格式回复，比如 [接受领养:小花:女] 或 [接受领养:小黑:男]
2. 拒绝领养 - 使用 [拒绝领养] 回复`,
      petAdoption: {
        userProposal: pet.userProposal,
        userGender: userGender,
        status: 'pending'
      }
    } as Message & { petAdoption: any }

    addMessage(characterId, adoptionMessage)
    navigate(`/chat/${characterId}`)
  }

  // ---------------------------------------------------------------------------
  // Render: 等待AI回复
  // ---------------------------------------------------------------------------
  const renderWaitingState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      {/* 标题 */}
      <h2 className="text-xl font-bold text-[#5d4037] mb-6 font-serif">申请审核中</h2>

      {/* ID Card Form (Read Only) */}
      <div className="w-full max-w-[320px] bg-[#fdfbf7] rounded-xl shadow-xl border border-[#e0dcd5] overflow-hidden relative">
         {/* Texture */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '12px 12px' }} 
         />

         {/* Header */}
         <div className="h-12 bg-[#8b7355] flex items-center justify-between px-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
            </div>
            <div className="flex items-center gap-2 z-10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <span className="text-white font-serif tracking-widest text-sm font-bold">宠物居民申请表</span>
            </div>
            <div className="text-[10px] text-white/60 font-mono tracking-wider z-10">PENDING</div>
         </div>

         {/* Content */}
         <div className="p-5">
            <div className="flex gap-4">
               {/* Photo Frame */}
               <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="relative w-20 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
                    <div className="w-16 h-20 relative z-10 flex items-center justify-center">
                       <EggSVG className="w-full h-auto drop-shadow-md opacity-80" gender={pet.userGender} />
                    </div>
                    {/* Gender Badge */}
                    <div className={`absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold rounded-tl-md transition-colors ${
                      pet.userGender === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {pet.userGender === '女' ? '♀' : '♂'}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-[#f0ebe5] rounded text-[10px] text-[#8b7355] font-mono animate-pulse">
                    审核中...
                  </div>
               </div>

               {/* Fields */}
               <div className="flex-1 space-y-4 pt-1">
                  {/* Name Display */}
                  <div>
                    <div className="text-[10px] text-[#bcaaa4] mb-1">拟定姓名 / Name</div>
                    <div className="text-base font-bold text-[#5d4037] border-b border-dashed border-[#d7ccc8] pb-1 font-serif">
                      {pet.userProposal}
                    </div>
                  </div>

                  {/* Gender Display */}
                  <div>
                    <div className="text-[10px] text-[#bcaaa4] mb-1.5">性别 / Gender</div>
                    <div className="flex gap-2">
                      <div className={`flex-1 py-1 rounded border text-xs font-bold text-center ${
                        pet.userGender === '男' 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-gray-50 border-transparent text-gray-300'
                      }`}>
                        ♂ 男
                      </div>
                      <div className={`flex-1 py-1 rounded border text-xs font-bold text-center ${
                        pet.userGender === '女' 
                          ? 'bg-pink-50 border-pink-200 text-pink-600' 
                          : 'bg-gray-50 border-transparent text-gray-300'
                      }`}>
                        ♀ 女
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 border-t border-[#f0ebe5] pt-4 flex flex-col gap-3">
               <div className="bg-[#fff3e0] rounded-lg p-3 text-xs text-[#e65100] border border-[#ffe0b2] flex items-start gap-2">
                 <span className="mt-0.5 text-base">⏳</span>
                 <span>申请已提交，请前往聊天页面等待{characterName || 'TA'}的签署确认。</span>
               </div>

               <button
                  onClick={() => navigate(`/chat/${characterId}`)}
                  className="w-full py-2.5 bg-white border border-[#5d4037] text-[#5d4037] rounded-lg text-sm font-bold hover:bg-[#f8f5f2] active:scale-[0.98] transition-all"
                >
                  去聊天查看进度
                </button>
                
                <div className="flex justify-center gap-4 text-xs text-[#bcaaa4]">
                  <button onClick={handleResendAdoptionCard} className="hover:text-[#8b7355] underline">
                    重新发送
                  </button>
                  <button onClick={() => savePet({ ...DEFAULT_PET })} className="hover:text-[#8b7355] underline">
                    取消申请
                  </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Render: 确认阶段 (AI已回复)
  // ---------------------------------------------------------------------------
  const renderConfirmState = () => {
    const namesMatch = pet.userProposal === pet.aiProposal
    const [finalName, setFinalName] = useState(pet.aiProposal || pet.userProposal)
    const [finalGender, setFinalGender] = useState<'男' | '女'>((pet.aiGender as any) || pet.userGender || '男')

    const handleConfirmAdoption = () => {
      const newPet: PetData = {
        ...pet,
        status: 'egg',
        name: finalName,
        gender: finalGender,
        createdAt: Date.now()
      }
      savePet(newPet)
      
      // Update chat message status
      import('../utils/simpleMessageManager').then(({ loadMessages, saveMessages }) => {
        const messages = loadMessages(characterId)
        // Find the adoption message
        const updatedMessages = messages.map((m: any) => {
          if (m.petAdoption && (m.petAdoption.status === 'pending' || m.petAdoption.status === 'accepted')) {
            return { ...m, petAdoption: { ...m.petAdoption, status: 'confirmed' } }
          }
          return m
        })
        saveMessages(characterId, updatedMessages)
      })
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-bold text-[#5d4037] mb-6 font-serif">审核通过</h2>

        <div className="w-full max-w-[320px] bg-[#fdfbf7] rounded-xl shadow-xl border border-[#e0dcd5] overflow-hidden relative">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '12px 12px' }} 
           />

           <div className="h-12 bg-[#8b7355] flex items-center justify-between px-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" 
                   style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
              </div>
              <div className="flex items-center gap-2 z-10">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <span className="text-white font-serif tracking-widest text-sm font-bold">宠物居民登记表</span>
              </div>
              <div className="text-[10px] text-white/60 font-mono tracking-wider z-10">APPROVED</div>
           </div>

           <div className="p-5">
              <div className="flex gap-4">
                 <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="relative w-20 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
                      <div className="w-16 h-20 relative z-10 flex items-center justify-center">
                         <EggSVG className="w-full h-auto drop-shadow-md" gender={finalGender} />
                      </div>
                      <div className={`absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold rounded-tl-md transition-colors ${
                        finalGender === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {finalGender === '女' ? '♀' : '♂'}
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-[#e8f5e9] text-[#2e7d32] rounded text-[10px] font-mono font-bold">
                      已批准
                    </div>
                 </div>

                 <div className="flex-1 space-y-4 pt-1">
                    <div>
                      <div className="text-[10px] text-[#bcaaa4] mb-1">最终姓名 / Name</div>
                      {namesMatch ? (
                        <div className="text-lg font-serif font-bold text-[#5d4037] flex items-center gap-2">
                          {finalName}
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">心有灵犀</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={finalName}
                          onChange={(e) => setFinalName(e.target.value)}
                          className="w-full text-base font-bold text-[#5d4037] bg-transparent border-b border-[#8b7355] pb-1 outline-none focus:border-blue-500 font-serif"
                          maxLength={10}
                        />
                      )}
                    </div>

                    {!namesMatch && (
                      <div>
                        <div className="text-[10px] text-[#bcaaa4] mb-1.5">最终性别 / Gender</div>
                        <div className="flex gap-2">
                          <button onClick={() => setFinalGender('男')} className={`flex-1 py-1 rounded border text-xs font-bold ${finalGender === '男' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400'}`}>♂ 男</button>
                          <button onClick={() => setFinalGender('女')} className={`flex-1 py-1 rounded border text-xs font-bold ${finalGender === '女' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'border-gray-200 text-gray-400'}`}>♀ 女</button>
                        </div>
                      </div>
                    )}
                    
                    {pet.aiProposal && !namesMatch && (
                      <div className="text-[10px] text-[#8b7355] bg-[#fff8e1] p-2 rounded">
                        {characterName || 'TA'}提议：{pet.aiProposal} ({pet.aiGender || '未知'})
                      </div>
                    )}
                 </div>
              </div>

              <div className="mt-6 border-t border-[#f0ebe5] pt-4">
                 <button
                    onClick={handleConfirmAdoption}
                    className="w-full py-3 bg-[#5d4037] text-white rounded-lg text-sm font-bold hover:bg-[#4a332a] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>确认并制证</span>
                    <Sparkles size={14} className="text-yellow-200" />
                  </button>
              </div>
           </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: 蛋/宠物阶段
  // ---------------------------------------------------------------------------
  const renderEggState = () => (
    <div 
      className="flex-1 flex flex-col relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const foodId = e.dataTransfer.getData('foodId')
        if (foodId) {
          handleFeed()
          // 播放吃东西音效或动画反馈
          if (navigator.vibrate) navigator.vibrate(50)
        }
      }}
    >
      {/* 背景纹理 */}
      <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />

      {/* 聊天悬浮按钮 */}
      <button
        onClick={() => navigate(`/chat/${characterId}`)}
        className="absolute right-4 top-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full shadow-lg border border-[#f0ebe5] flex items-center justify-center text-[#8b7355] hover:bg-white active:scale-90 transition-all"
      >
        <MessageCircle size={20} />
      </button>

      {/* 主区域 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-8">
        {/* 名字标签 (点击查看档案) */}
        <button 
          onClick={() => setShowProfile(true)}
          className="mb-6 flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
        >
          <div className="bg-[#5d4037] text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-md flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Lv.{pet.level}</span>
            <span className="w-px h-3 bg-white/30"></span>
            <span>{pet.name || '小蛋蛋'}</span>
            <Info size={12} className="text-white/60 ml-1" />
          </div>
        </button>

        {/* 蛋/宠物 */}
        <div className="mb-8 w-48 h-56 animate-float transition-all duration-500"
          style={{ transform: showFoodMenu ? 'scale(0.9) translateY(-20px)' : undefined }}
        >
          {pet.status === 'egg' ? (
            <EggSVG className="w-full h-full drop-shadow-xl" gender={pet.gender} />
          ) : (
            <PetSVG mood={mood} className="w-full h-full drop-shadow-xl" />
          )}
        </div>

        {/* 状态条 */}
        <div className="w-full px-10 grid grid-cols-2 gap-x-6 gap-y-3 max-w-sm">
          <div className="flex items-center gap-2">
            <Utensils size={16} className="text-[#8b7355]" />
            <div className="flex-1 h-2 bg-[#e6e1db] rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pet.hunger}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-[#8b7355]" />
            <div className="flex-1 h-2 bg-[#e6e1db] rounded-full overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full transition-all" style={{ width: `${pet.happiness}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#8b7355]" />
            <div className="flex-1 h-2 bg-[#e6e1db] rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pet.energy}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#8b7355]" />
            <div className="flex-1 h-2 bg-[#e6e1db] rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${pet.cleanliness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="pb-[calc(16px+env(safe-area-inset-bottom))] px-6 z-20">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-[#f0ebe5] flex justify-between items-center px-4 relative">
          
          <button 
            onClick={() => setShowFoodMenu(!showFoodMenu)} 
            className={`flex flex-col items-center gap-1 group active:scale-95 transition-all ${showFoodMenu ? 'scale-110' : ''}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${showFoodMenu ? 'bg-orange-100 text-orange-500' : 'bg-orange-50 text-orange-400 group-hover:bg-orange-100'}`}>
              <Utensils size={20} />
            </div>
            <span className="text-[10px] font-bold text-[#8b7355]">喂食</span>
          </button>

          <button onClick={handlePlay} className="flex flex-col items-center gap-1 group active:scale-95 transition-all">
            <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-400 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
              <Gamepad2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-[#8b7355]">玩耍</span>
          </button>

          <button onClick={handleClean} className="flex flex-col items-center gap-1 group active:scale-95 transition-all">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-400 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <Bath size={20} />
            </div>
            <span className="text-[10px] font-bold text-[#8b7355]">洗澡</span>
          </button>

          <button onClick={handleSleep} className="flex flex-col items-center gap-1 group active:scale-95 transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              mood === 'sleeping' ? 'bg-indigo-500 text-white shadow-inner' : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100'
            }`}>
              <Moon size={20} />
            </div>
            <span className="text-[10px] font-bold text-[#8b7355]">{mood === 'sleeping' ? '唤醒' : '睡觉'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-screen w-full bg-[#fffbf5] relative flex flex-col font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="pt-[env(safe-area-inset-top)] shrink-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#8b7355] hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-[#8b7355] font-bold text-lg">
            {pet.status === 'none' || pet.status === 'naming' ? '领养中心' : '我的宠物'}
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      {pet.status === 'none' && renderEmptyState()}
      {pet.status === 'naming' && renderNamingState()}
      {pet.status === 'waitingAI' && renderWaitingState()}
      {pet.status === 'waitingConfirm' && renderConfirmState()}
      {(pet.status === 'egg' || pet.status === 'hatched') && renderEggState()}

      {/* Modals & Overlays */}
      {renderProfileModal()}
      {renderFoodMenu()}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default CouplePet
