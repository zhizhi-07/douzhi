/**
 * 情侣空间 - 留言板 (心情日记)
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCoupleMessages, 
  addCoupleMessage, 
  deleteCoupleMessage,
  type CoupleMessage 
} from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation, getFamilyMembers, getCoupleSpaceMode, type CoupleSpaceRelation, type FamilyMember } from '../utils/coupleSpaceUtils'
import { getUserInfo, getCurrentUserName } from '../utils/userUtils'
import { loadMessages as loadChatMessages, saveMessages as saveChatMessages } from '../utils/simpleMessageManager'

// Common icons (brown style)
const Icons = {
  Back: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trend: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Edit: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

// Mood Image Map - 使用public文件夹图片(已在index.html预加载)
const MOODS = [
  { id: 'happy', image: '/moods/开心.png', label: '开心' },
  { id: 'love', image: '/moods/心动.png', label: '心动' },
  { id: 'awkward', image: '/moods/无语尴尬.png', label: '无语' },
  { id: 'calm', image: '/moods/平静.png', label: '平静' },
  { id: 'sad', image: '/moods/伤心.png', label: '难过' },
  { id: 'angry', image: '/moods/生气.png', label: '生气' },
]

const CoupleMessageBoard = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<CoupleMessage[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [selectedMood, setSelectedMood] = useState('happy')
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedMessage, setSelectedMessage] = useState<CoupleMessage | null>(null) // For detail view
  const [showAllRecords, setShowAllRecords] = useState(false) // For all records view
  const userInfo = getUserInfo()

  useEffect(() => {
    loadMessages()
    setRelation(getCoupleSpaceRelation())
    setMembers(getFamilyMembers())
  }, [])

  // 根据角色名获取头像
  const getMemberAvatar = (characterName: string): string | undefined => {
    if (characterName === '我') return userInfo.avatar
    const member = members.find(m => m.characterName === characterName)
    return member?.characterAvatar
  }

  const loadMessages = () => {
    const all = getCoupleMessages()
    // Sort by timestamp desc
    all.sort((a, b) => b.timestamp - a.timestamp)
    setMessages(all)
  }

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Adjust for Monday start (0=Sun, 1=Mon)
    // We want Mon=0, Sun=6
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6 // Sunday becomes 6
    
    const days = []
    
    // Empty slots for start
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handleAdd = () => {
    if (!messageContent.trim()) {
      alert('请输入内容')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    const moodLabel = MOODS.find(m => m.id === selectedMood)?.label || '平静'

    addCoupleMessage(
      relation.characterId,
      '我',
      messageContent.trim(),
      selectedMood
    )

    // 添加系统消息到聊天记录，让AI知道用户更新了心情
    const mode = getCoupleSpaceMode()
    const userName = getCurrentUserName()
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const timestamp = Date.now()
    
    if (mode === 'shared') {
      // 公共模式：通知所有成员
      const allMembers = getFamilyMembers()
      allMembers.forEach(member => {
        const chatMessages = loadChatMessages(member.characterId)
        const systemMsg = {
          id: timestamp,
          type: 'system' as const,
          content: `${userName}更新了心情日记（${moodLabel}）`,
          aiReadableContent: `（情侣空间通知）${userName}刚刚更新了心情日记，心情是${moodLabel}，内容是：${messageContent.trim()}`,
          time: timeStr,
          timestamp,
          messageType: 'system' as const
        }
        saveChatMessages(member.characterId, [...chatMessages, systemMsg])
      })
    } else {
      // 独立模式：只通知当前角色
      const chatMessages = loadChatMessages(relation.characterId)
      const systemMsg = {
        id: timestamp,
        type: 'system' as const,
        content: `${userName}更新了心情日记（${moodLabel}）`,
        aiReadableContent: `${userName}刚刚更新了心情日记，心情是${moodLabel}，内容是：${messageContent.trim()}`,
        time: timeStr,
        timestamp,
        messageType: 'system' as const
      }
      saveChatMessages(relation.characterId, [...chatMessages, systemMsg])
    }

    setMessageContent('')
    setSelectedMood('happy')
    setShowAddModal(false)
    loadMessages()
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这篇日记吗？')) {
      deleteCoupleMessage(id)
      setSelectedMessage(null)
      loadMessages()
    }
  }

  // Render Calendar Cell - 公共模式显示所有成员心情，独立模式显示用户+当前AI
  const renderCalendarDay = (date: Date | null, idx: number) => {
    // 即使是空日期也要占位
    if (!date) return <div key={`empty-${idx}`} className="w-full min-h-[110px]" />

    const dayMessages = messages.filter(m => {
      const mDate = new Date(m.timestamp)
      return mDate.getDate() === date.getDate() && 
             mDate.getMonth() === date.getMonth() && 
             mDate.getFullYear() === date.getFullYear()
    })

    const mode = getCoupleSpaceMode()
    
    // 用户的消息（每天只取最新一条）
    const userMsg = dayMessages.find(m => m.characterName === '我')
    const userMood = userMsg ? MOODS.find(m => m.id === userMsg.mood) || MOODS[0] : null
    
    // 公共模式：每个成员每天只显示一条心情（按人数延伸）
    // 独立模式：只显示当前AI的
    let aiMessages: CoupleMessage[] = []
    if (mode === 'shared') {
      // 按成员分组，每人只取最新一条
      const memberMap = new Map<string, CoupleMessage>()
      dayMessages.filter(m => m.characterName !== '我').forEach(m => {
        if (!memberMap.has(m.characterName)) {
          memberMap.set(m.characterName, m)
        }
      })
      aiMessages = Array.from(memberMap.values())
    } else {
      // 独立模式只取第一个AI的
      const firstAi = dayMessages.find(m => m.characterName !== '我')
      if (firstAi) aiMessages = [firstAi]
    }

    const hasContent = userMsg || aiMessages.length > 0
    const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()

    return (
      <div 
        key={date.toISOString()} 
        className="w-full min-h-[110px] flex flex-col items-center py-1 relative cursor-pointer group"
        onClick={() => {
          if (userMsg) setSelectedMessage(userMsg)
          else if (aiMessages[0]) setSelectedMessage(aiMessages[0])
        }}
      >
        {/* 椭圆心情容器 (包含日期和心情) - 宽宽圆圆的样子 */}
        {hasContent ? (
          <div 
            className={`flex flex-col items-center px-3 py-2 transition-all duration-300
              ${isToday ? 'bg-white' : 'bg-white/90'}
            `}
            style={{ 
               borderRadius: '24px',
               boxShadow: isToday 
                 ? '0 0 0 2px #ffe082, 0 4px 12px rgba(255,224,130,0.4)' 
                 : '0 0 0 1.5px rgba(139,115,85,0.08), 0 2px 8px rgba(139,115,85,0.06)',
            }}
          >
            {/* 黄色日期数字背景 - 横向椭圆 */}
            <div className={`px-2.5 py-0.5 flex items-center justify-center text-[11px] font-bold mb-1
               ${isToday ? 'bg-[#ffca28] text-[#5d4037]' : 'bg-[#ffe082]/80 text-[#5d4037]'}
            `}
            style={{ borderRadius: '10px' }}
            >
              {date.getDate()}
            </div>

            {/* 心情图标列表 - 支持多人 */}
            <div className="flex flex-col items-center gap-0.5">
              {/* 用户心情 */}
              {userMood?.image && (
                <img 
                  src={userMood.image} 
                  alt={userMood.label} 
                  className="w-9 h-9 object-contain cursor-pointer hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (userMsg) setSelectedMessage(userMsg)
                  }}
                />
              )}
              
              {/* 所有AI成员的心情 */}
              {aiMessages.map((aiMsg) => {
                const aiMood = MOODS.find(m => m.id === aiMsg.mood) || MOODS[0]
                return aiMood?.image ? (
                  <img 
                    key={aiMsg.id}
                    src={aiMood.image} 
                    alt={aiMood.label} 
                    title={aiMsg.characterName}
                    className="w-9 h-9 object-contain cursor-pointer hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMessage(aiMsg)
                    }}
                  />
                ) : null
              })}
            </div>
          </div>
        ) : (
          /* 无内容时的日期显示 */
          <div className={`px-2 py-0.5 flex items-center justify-center text-xs font-medium mt-1
             ${isToday ? 'bg-[#ffca28] text-[#5d4037] font-bold shadow-sm' : 'text-[#8b7355]/30'}
          `}
          style={{ borderRadius: '10px' }}
          >
            {date.getDate()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#fffbf5] font-sans text-[#5d4037] overflow-hidden">
      {/* Detail Modal / Overlay */}
      {selectedMessage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div 
            className="absolute inset-0"
            onClick={() => setSelectedMessage(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-[#5d4037]/10 animate-slide-up overflow-hidden max-h-[80vh] flex flex-col">
            {/* Paper Texture Background */}
            <div className="absolute inset-0 pointer-events-none opacity-50" 
                 style={{ backgroundImage: 'radial-gradient(#5d4037 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Header: Date & Mood */}
            <div className="relative z-10 flex justify-between items-start mb-6 border-b-2 border-[#5d4037] pb-4">
              <div>
                <div className="text-4xl font-bold text-[#5d4037]">
                  {new Date(selectedMessage.timestamp).getDate().toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-[#8b7355] mt-1">
                  {new Date(selectedMessage.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', year: 'numeric' })}
                  {' '}
                  {['周日','周一','周二','周三','周四','周五','周六'][new Date(selectedMessage.timestamp).getDay()]}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                {(() => {
                  const mood = MOODS.find(m => m.id === selectedMessage.mood) || MOODS[0]
                  return (
                    <>
                      <img src={mood.image} alt={mood.label} className="w-16 h-16 object-contain" />
                      <div className="mt-2 px-3 py-0.5 bg-[#e3f2fd] rounded-full text-xs font-bold text-[#1565c0]">
                        {mood.label}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-y-auto mb-4">
              <p className="text-base text-[#5d4037] leading-loose whitespace-pre-wrap font-medium">
                {selectedMessage.content}
              </p>
              
              <div className="mt-6 flex items-center gap-2">
                <span className="text-sm text-[#8b7355] font-bold">#心情日记</span>
              </div>
            </div>

            {/* Footer: User Info & Actions */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#eee]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
                   {getMemberAvatar(selectedMessage.characterName) ? (
                      <img src={getMemberAvatar(selectedMessage.characterName)} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {selectedMessage.characterName?.charAt(0)}
                      </div>
                   )}
                </div>
                <span className="text-xs font-bold text-[#8b7355]">
                  {selectedMessage.characterName}
                </span>
              </div>
              
              <button 
                onClick={() => handleDelete(selectedMessage.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Icons.Trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Header */}
      <div className="bg-[#fffbf5] z-10 shrink-0">
        <StatusBar />
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate('/couple-space')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] active:bg-[#e6dfd5] transition-colors text-[#8b7355]"
          >
            <Icons.Back className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#5d4037]">{currentDate.getMonth() + 1}月</span>
            <span className="text-[10px] text-[#8b7355]">{currentDate.getFullYear()}年</span>
          </div>
          
          <button 
            onClick={() => setShowAllRecords(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] transition-colors text-[#8b7355]"
          >
            <Icons.Trend className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Calendar Grid - Full Screen Layout */}
      <div className="flex-1 flex flex-col bg-[#fffbf5] relative overflow-hidden">
        {/* Dot Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08]" 
          style={{ 
            backgroundImage: 'radial-gradient(#8b7355 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px' 
          }}
        />

        {/* Week Days Header */}
        <div className="grid grid-cols-7 mb-0 bg-[#fffbf5]/90 backdrop-blur-sm pt-4 pb-2 z-10 sticky top-0">
          {['一','二','三','四','五','六','日'].map(d => (
            <div key={d} className="text-center text-sm text-[#8b7355] font-bold tracking-widest">{d}</div>
          ))}
        </div>

        {/* Days Grid - Scrollable & Full Height */}
        <div className="flex-1 overflow-y-auto px-2 pb-24 z-0 no-scrollbar">
          <div className="grid grid-cols-7 auto-rows-fr min-h-full gap-2">
            {getCalendarDays().map((date, idx) => renderCalendarDay(date, idx))}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="absolute bottom-8 right-6 z-30">
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-[#ffe082] rounded-[20px] shadow-lg flex items-center justify-center text-[#5d4037] border-2 border-white transform hover:scale-105 active:scale-95 transition-all"
        >
          <Icons.Edit className="w-7 h-7" />
        </button>
      </div>

      {/* Add Mood Diary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-[#fffbf5] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-[#e0e0e0] rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-lg font-bold text-[#5d4037] mb-6 text-center">记录心情</h3>
            
            {/* Mood Selector */}
            <div className="grid grid-cols-6 gap-2 mb-6">
              {MOODS.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex flex-col items-center gap-1 transition-all ${selectedMood === mood.id ? 'transform scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  <img 
                    src={mood.image} 
                    alt={mood.label} 
                    className={`w-12 h-12 object-contain rounded-full ${selectedMood === mood.id ? 'ring-2 ring-[#5d4037] ring-offset-2' : ''}`}
                  />
                  <span className={`text-[10px] font-bold ${selectedMood === mood.id ? 'text-[#5d4037]' : 'text-gray-400'}`}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Content Input */}
            <div className="mb-6 relative">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="今天发生了什么有趣的事..."
                className="w-full px-4 py-4 bg-white rounded-2xl resize-none text-sm text-[#5d4037] placeholder-[#c9b8a8] focus:outline-none border-2 border-[#f5efe6] focus:border-[#ffe082] min-h-[150px] leading-relaxed"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleAdd}
              className="w-full py-3.5 rounded-2xl bg-[#5d4037] text-white font-bold text-sm shadow-lg hover:bg-[#4a332a] active:scale-[0.98] transition-all"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {/* All Records Modal */}
      {showAllRecords && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#fffbf5] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-[#f5efe6]">
            <button 
              onClick={() => setShowAllRecords(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5efe6] transition-colors text-[#8b7355]"
            >
              <Icons.Back className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-[#5d4037]">心情记录</span>
            <div className="w-10" />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8b7355]/50">
                <span className="text-5xl mb-4">📔</span>
                <span className="text-sm">还没有心情记录</span>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => {
                  const mood = MOODS.find(m => m.id === msg.mood) || MOODS[3]
                  const date = new Date(msg.timestamp)
                  return (
                    <div 
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg)
                        setShowAllRecords(false)
                      }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-[#f5efe6] active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <img src={mood.image} alt={mood.label} className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[#5d4037]">{msg.characterName}</span>
                            <span className="text-xs text-[#8b7355]">
                              {date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-[#5d4037] line-clamp-2">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default CoupleMessageBoard
