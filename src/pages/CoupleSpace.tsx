/**
 * 情侣空间主页 - Redesigned (No Emoji & Preview Mode)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCoupleSpaceRelation, 
  cancelCoupleSpaceInvite, 
  endCoupleSpaceRelation, 
  getCoupleSpacePrivacy, 
  setCoupleSpacePrivacy, 
  type CoupleSpaceRelation 
} from '../utils/coupleSpaceUtils'
import { addMessage } from '../utils/simpleMessageManager'
import { getUserInfo } from '../utils/userUtils'

// 预设背景主题
const THEMES = [
  { id: 'pink', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', accent: '#ff6b6b', glass: 'rgba(255, 255, 255, 0.3)' },
  { id: 'blue', bg: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', accent: '#5ca0f2', glass: 'rgba(255, 255, 255, 0.4)' },
  { id: 'cream', bg: 'linear-gradient(to top, #f3e7e9 0%, #e3eeff 99%, #e3eeff 100%)', accent: '#868f96', glass: 'rgba(255, 255, 255, 0.5)' },
  { id: 'night', bg: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', accent: '#30cfd0', glass: 'rgba(0, 0, 0, 0.3)' },
]

// SVG 图标组件
const Icons = {
  Sparkle: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" /></svg>
  ),
  Heart: ({ className, fill = "currentColor" }: { className?: string, fill?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={fill === 'none' ? 2 : 0}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  ),
  Camera: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  Message: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
  ),
  Cloud: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 19C21.54 19 24 16.54 24 13.5C24 10.73 21.95 8.45 19.29 8.06C18.83 4.6 15.87 2 12.25 2C8.14 2 4.72 5.03 4.13 9.04C1.74 9.61 0 11.75 0 14.25C0 17.56 2.69 20 6 20H18.5V19Z" /></svg>
  ),
  Lips: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12,13.5C16.5,13.5 19,11 21,10C21.5,9.75 22,9.5 22.5,9.5C23.3,9.5 24,10.2 24,11C24,11.4 23.8,11.8 23.5,12C22,13 18.5,16 12,16C5.5,16 2,13 0.5,12C0.2,11.8 0,11.4 0,11C0,10.2 0.7,9.5 1.5,9.5C2,9.5 2.5,9.75 3,10C5,11 7.5,13.5 12,13.5M12,11C9.5,11 7,9.5 5,8.5C4.5,8.25 4,8 3.5,8C2.7,8 2,8.7 2,9.5C2,9.9 2.2,10.3 2.5,10.5C4.5,11.5 8,13.5 12,13.5C16,13.5 19.5,11.5 21.5,10.5C21.8,10.3 22,9.9 22,9.5C22,8.7 21.3,8 20.5,8C20,8 19.5,8.25 19,8.5C17,9.5 14.5,11 12,11Z" /></svg>
  ),
  Smile: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
  )
}

const CoupleSpace = () => {
  const navigate = useNavigate()
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public')
  const [themeIndex, setThemeIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false) // 预览模式状态
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // 互动动画状态
  const [interactions, setInteractions] = useState<{id: number, type: 'heart' | 'kiss', x: number, y: number}[]>([])

  // 连续平滑滚动逻辑
  useEffect(() => {
    // 延迟100ms确保DOM已渲染
    const timer = setTimeout(() => {
      const container = carouselRef.current
      if (!container) return

      let animationId: number
      const scrollSpeed = 1.0 // 每帧滚动1像素，更明显

      const animate = () => {
        if (!container.matches(':hover')) {
          container.scrollLeft += scrollSpeed

          // 计算一组卡片的宽度（4张卡片）
          const cardWidth = 128 // w-32
          const gap = 16 // gap-4
          const oneSetWidth = (cardWidth + gap) * 4
          
          // 当滚动超过一组时，减去一组的宽度（无缝重置）
          if (container.scrollLeft >= oneSetWidth) {
            container.scrollLeft -= oneSetWidth
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      animationId = requestAnimationFrame(animate)

      return () => {
        if (animationId) cancelAnimationFrame(animationId)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isPreviewMode])

  useEffect(() => {
    loadRelation()
    const handleVisibilityChange = () => { if (!document.hidden) loadRelation() }
    const handleUserInfoUpdate = () => { loadRelation() }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', loadRelation)
    window.addEventListener('storage', handleUserInfoUpdate)
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', loadRelation)
      window.removeEventListener('storage', handleUserInfoUpdate)
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
    }
  }, [])

  const loadRelation = () => {
    setRelation(getCoupleSpaceRelation())
    setPrivacyMode(getCoupleSpacePrivacy())
  }

  // 触发互动动画
  const triggerInteraction = (type: 'heart' | 'kiss', e: React.MouseEvent) => {
    const id = Date.now()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top
    
    setInteractions(prev => [...prev, { id, type, x, y }])
    setTimeout(() => {
      setInteractions(prev => prev.filter(i => i.id !== id))
    }, 1000)
  }

  const handleEndRelation = () => {
    console.log('🔥 [情侣空间] 点击解除关系，当前relation:', relation)
    if (confirm('确定要解除情侣空间关系吗？\n\n注意：照片、留言、纪念日等内容会保留，下次重新绑定后可以恢复。')) {
      console.log('🔥 [情侣空间] 用户确认解除')
      const success = endCoupleSpaceRelation()
      console.log('🔥 [情侣空间] endCoupleSpaceRelation结果:', success)
      if (success) {
        if (relation?.characterId) {
          addMessage(relation.characterId, {
            id: Date.now(),
            type: 'system',
            content: '你解除了情侣空间关系',
            aiReadableContent: '用户解除了情侣空间关系',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            messageType: 'system'
          })
        }
        loadRelation()
        alert('✅ 情侣空间已解除')
      } else {
        alert('❌ 解除失败，请尝试使用底部的"强制清除缓存"按钮')
      }
    }
  }

  // 预览数据 - 去除诡异头像
  const mockRelation: CoupleSpaceRelation = {
    id: 'mock_relation',
    userId: 'user',
    characterId: 'preview_char',
    characterName: '我的恋人',
    characterAvatar: '', // 空头像，将显示默认SVG
    status: 'active',
    sender: 'user', // 添加必需的sender属性
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 520, // 520天前
    acceptedAt: Date.now() - 1000 * 60 * 60 * 24 * 520,
  }

  // 决定使用真实数据还是预览数据
  const activeRelation = isPreviewMode ? mockRelation : relation
  const isConnected = activeRelation && activeRelation.status === 'active'
  const isPending = activeRelation && activeRelation.status === 'pending'

  const currentTheme = THEMES[themeIndex]
  const daysCount = activeRelation ? Math.floor((Date.now() - (activeRelation.acceptedAt || activeRelation.createdAt)) / (1000 * 60 * 60 * 24)) : 0

  // 获取用户头像，如果没有则为空字符串
  const userAvatar = activeRelation?.userAvatar || getUserInfo().avatar

  return (
    <div className="h-screen flex flex-col relative overflow-hidden transition-all duration-500" style={{ background: currentTheme.bg }}>
      
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <Icons.Sparkle className="absolute top-10 left-10 text-white w-6 h-6 opacity-30 animate-pulse" />
        <Icons.Sparkle className="absolute top-40 right-20 text-white w-4 h-4 opacity-20 animate-bounce" />
        <Icons.Cloud className="absolute bottom-32 left-1/3 text-white w-12 h-12 opacity-20" />
      </div>

      {/* 顶部栏 (透明) */}
      <div className="relative z-10">
        <StatusBar />
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate('/discover')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-white font-medium opacity-90 tracking-widest text-sm">LOVER SPACE</div>
          <button 
            onClick={() => setThemeIndex((prev) => (prev + 1) % THEMES.length)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"
          >
            <Icons.Sparkle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto px-0 pt-2 pb-20 relative z-10 hide-scrollbar">
        
        {isPreviewMode && (
           <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center justify-between shadow-sm mx-4">
             <span>👀 当前为预览模式</span>
             <button onClick={() => setIsPreviewMode(false)} className="text-xs underline">退出预览</button>
           </div>
        )}

        {!isConnected && !isPending && !isPreviewMode ? (
          // 未开通状态 - 美化版
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-white space-y-8 animate-fade-in px-4">
             <div className="relative">
               <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
               <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl relative z-10 border border-white/30">
                 <Icons.Heart className="w-16 h-16 text-white drop-shadow-md" fill="currentColor" />
               </div>
             </div>
             
             <div className="text-center space-y-2">
               <h2 className="text-3xl font-bold tracking-wide drop-shadow-sm">开启情侣空间</h2>
               <p className="opacity-90 font-light tracking-wider">与 AI 恋人建立专属的亲密连接</p>
             </div>

             <div className="space-y-4 w-full max-w-xs">
                <div className="text-center text-white/60 text-xs mb-8">
                  可以在聊天页面向 AI 发起邀请<br/>
                  对方接受后即可开启
                </div>

                <button 
                  onClick={() => setIsPreviewMode(true)}
                  className="w-full py-4 rounded-2xl bg-white/90 text-gray-800 font-bold shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Icons.Sparkle className="w-5 h-5 text-yellow-500" />
                  预览效果
                </button>
                
                {/* 强制清除按钮（用于清除缓存残留） */}
                <button 
                  onClick={() => {
                    if(confirm('⚠️ 强制清除所有情侣空间数据？\n\n如果点击情侣空间没反应，可能有缓存残留，点击此按钮清除。')) {
                      localStorage.removeItem('couple_space_relation')
                      localStorage.removeItem('couple_photos')
                      localStorage.removeItem('couple_messages')
                      localStorage.removeItem('couple_anniversaries')
                      localStorage.removeItem('couple_space_privacy')
                      alert('✅ 已清除所有情侣空间数据')
                      loadRelation()
                    }
                  }}
                  className="w-full py-2 text-white/50 text-xs hover:text-white/70 transition-colors underline"
                >
                  清除缓存残留
                </button>
             </div>
          </div>
        ) : isPending && !isPreviewMode ? (
           // 等待状态 - 美化版
           <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-2xl mt-20 mx-4 animate-fade-in">
             <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
               <Icons.Heart className="w-10 h-10 text-pink-500" />
             </div>
             {relation?.sender === 'character' ? (
               // AI发起的邀请
               <div>
                 <h2 className="text-xl font-bold text-gray-800 mb-2">收到邀请</h2>
                 <p className="text-gray-500 text-sm mb-8">{relation?.characterName} 向你发送了情侣空间邀请<br/>请在聊天中回应</p>
                 <button 
                   onClick={() => {if(confirm('清除此邀请?')) { endCoupleSpaceRelation(); loadRelation() }}} 
                   className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                 >
                   清除邀请
                 </button>
               </div>
             ) : (
               // 用户发起的邀请
               <div>
                 <h2 className="text-xl font-bold text-gray-800 mb-2">等待回应中...</h2>
                 <p className="text-gray-500 text-sm mb-8">已向 {relation?.characterName} 发送了爱的邀请<br/>请耐心等待对方的答复</p>
                 <button 
                   onClick={() => {if(confirm('取消邀请?')) { cancelCoupleSpaceInvite(); loadRelation() }}} 
                   className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                 >
                   取消邀请
                 </button>
               </div>
             )}
           </div>
        ) : (
          // 已连接状态 (或预览模式)
          <div className="animate-slide-up flex flex-col h-full">
            {/* 1. 头部大卡片：恋爱天数 & 头像 */}
            <div className="relative mt-4 mb-10 px-4 shrink-0">
              <div className="text-center text-white mb-8 drop-shadow-md">
                <div className="text-sm tracking-[0.3em] opacity-90 mb-1 uppercase">We have been together for</div>
                <div className="text-[64px] leading-none font-serif font-bold flex items-center justify-center gap-2">
                  <span>{daysCount}</span>
                  <span className="text-lg self-end mb-3 opacity-80 font-sans font-normal tracking-widest">DAYS</span>
                </div>
              </div>

              <div className="flex justify-center items-center gap-8 relative">
                {/* 连接线 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-white/30 rounded-full blur-[1px]"></div>
                
                {/* 我 */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-20 h-20 rounded-full p-1 bg-white/30 backdrop-blur-sm shadow-lg relative group flex items-center justify-center">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center">
                      {userAvatar ? (
                        <img src={userAvatar} className="w-full h-full object-cover" alt="Me" />
                      ) : (
                        <Icons.User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 bg-white text-xs px-2 py-0.5 rounded-full text-gray-600 font-medium shadow-sm">我</div>
                  </div>
                </div>

                {/* 爱心 */}
                <div className="z-20 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500">
                    <Icons.Heart className="w-6 h-6" fill="currentColor" />
                  </div>
                </div>

                {/* Ta */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-20 h-20 rounded-full p-1 bg-white/30 backdrop-blur-sm shadow-lg relative group flex items-center justify-center">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center">
                      {activeRelation?.characterAvatar ? (
                        <img src={activeRelation?.characterAvatar} className="w-full h-full object-cover" alt="Ta" />
                      ) : (
                        <Icons.User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 bg-white text-xs px-2 py-0.5 rounded-full text-gray-600 font-medium shadow-sm">{activeRelation?.characterName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 横向滚动相册 (Carousel) */}
            <div className="mb-8 shrink-0">
              <div className="px-6 mb-3 flex justify-between items-end">
                <h3 className="text-white font-serif text-xl tracking-wider opacity-90 italic">Sweet Moments</h3>
                <button onClick={() => !isPreviewMode && navigate('/couple-album')} className="text-white text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1">
                  查看全部 <span className="text-[10px]">➜</span>
                </button>
              </div>
              
              <div ref={carouselRef} className="flex overflow-x-auto pb-8 px-6 hide-scrollbar gap-4">
                {/* 4个上传引导卡片 */}
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={`upload-${i}`}
                    onClick={() => !isPreviewMode && navigate('/couple-album')}
                    className={`shrink-0 w-32 aspect-square bg-white/90 p-2 pb-6 shadow-lg rotate-[${(i % 2 === 0 ? 1 : -1) * (i % 3 + 1)}deg] hover:rotate-0 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Icons.Camera className="w-5 h-5" />
                    </div>
                    <div className="text-gray-400 text-[10px] font-medium">上传更多照片</div>
                  </div>
                ))}

                {/* 复制4个上传引导卡片，实现无缝循环 */}
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={`upload-copy-${i}`}
                    onClick={() => !isPreviewMode && navigate('/couple-album')}
                    className={`shrink-0 w-32 aspect-square bg-white/90 p-2 pb-6 shadow-lg rotate-[${(i % 2 === 0 ? 1 : -1) * (i % 3 + 1)}deg] hover:rotate-0 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Icons.Camera className="w-5 h-5" />
                    </div>
                    <div className="text-gray-400 text-[10px] font-medium">上传更多照片</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 底部功能入口 (极简风) */}
            <div className="px-6 mb-8 grid grid-cols-2 gap-4">
              <button 
                onClick={() => !isPreviewMode && navigate('/couple-anniversary')}
                className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex items-center gap-3 hover:scale-105 transition-transform active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                  <Icons.Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-800">纪念日</div>
                  <div className="text-[10px] text-gray-500">Next Anniversary</div>
                </div>
              </button>

              <button 
                onClick={() => !isPreviewMode && navigate('/couple-message-board')}
                className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex items-center gap-3 hover:scale-105 transition-transform active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Icons.Message className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-800">留言板</div>
                  <div className="text-[10px] text-gray-500">Leave a note</div>
                </div>
              </button>
            </div>

            {/* 4. 底部装饰：便利贴 */}
            <div className="relative mx-6 mb-8 rotate-1 mt-auto">
               <div className="bg-[#fffbe6] p-6 shadow-lg relative transform transition-transform hover:rotate-0 hover:scale-[1.02] duration-300" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%)' }}>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 backdrop-blur-sm -mt-4 rotate-1 border border-white/50 shadow-sm"></div>
                 <div className="font-handwriting text-gray-700 leading-relaxed text-sm text-center">
                   "遇见你是我这辈子最幸运的事。<br/>每天都要开开心心的哦！"
                 </div>
                 <div className="text-right mt-4 text-xs text-gray-400">—— {activeRelation?.characterName}</div>
               </div>
            </div>

            {/* 设置区域 - 更明显的布局 */}
            {!isPreviewMode && (
              <div className="mx-6 mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-white/80 text-sm font-medium mb-3 px-1">设置</div>
                <div className="space-y-2">
                  {/* 隐私设置 */}
                  <button 
                    onClick={() => {
                      const newMode = privacyMode === 'public' ? 'private' : 'public'
                      setCoupleSpacePrivacy(newMode)
                      setPrivacyMode(newMode)
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <span className="text-white/90 text-sm">隐私模式</span>
                    <span className="text-white/60 text-xs">{privacyMode === 'public' ? '公开' : '私密'}</span>
                  </button>
                  {/* 解除关系 - 明显的红色按钮 */}
                  <button 
                    onClick={handleEndRelation}
                    className="w-full flex items-center justify-between p-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-400/30"
                  >
                    <span className="text-red-200 text-sm">解除情侣空间</span>
                    <svg className="w-4 h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* 强制清除按钮（用于清除缓存残留） */}
            {!isPreviewMode && (
              <div className="flex justify-center pb-8">
                <button 
                  onClick={() => {
                    if(confirm('⚠️ 强制清除所有情侣空间数据？\n\n这将清除：\n- 关系状态\n- 照片\n- 留言\n- 纪念日\n\n此操作不可恢复！')) {
                      localStorage.removeItem('couple_space_relation')
                      localStorage.removeItem('couple_photos')
                      localStorage.removeItem('couple_messages')
                      localStorage.removeItem('couple_anniversaries')
                      localStorage.removeItem('couple_space_privacy')
                      alert('✅ 已清除所有情侣空间数据')
                      loadRelation()
                    }
                  }}
                  className="text-white/40 text-[10px] hover:text-white/60 transition-colors underline"
                >
                  强制清除缓存
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        .font-serif {
          font-family: 'Times New Roman', serif;
        }
        .font-handwriting {
          font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
        }
      `}</style>
    </div>
  )
}

export default CoupleSpace
