import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ContactIcon, ChatIcon, ImageIcon, MusicIcon, LocationIcon, ShoppingIcon, BrowserIcon, AlipayIcon, NotesIcon, CloseIcon, ForumIcon } from './Icons'
import { generateAIPhoneContent, AIPhoneContent } from '../utils/aiPhoneGenerator'
import ContactsApp from './phone/ContactsApp'
import WechatApp from './phone/WechatApp'
import BrowserApp from './phone/BrowserApp'
import TaobaoApp from './phone/TaobaoApp'
import AlipayApp from './phone/AlipayApp'
import PhotosApp from './phone/PhotosApp'
import NotesApp from './phone/NotesApp'
import MusicApp from './phone/MusicApp'
import MapsApp from './phone/MapsApp'
import ForumApp from './phone/ForumApp'

interface AIPhoneModalProps {
  onClose: () => void
  characterId: string
  characterName: string
  forceNew?: boolean
  historyContent?: AIPhoneContent
}

interface PhoneApp {
  id: string
  name: string
  IconComponent: React.ComponentType<{ size?: number; className?: string }>
  bgClass: string
  iconColor?: string
  onClick: () => void
}

const AIPhoneModal = ({ onClose, characterId, characterName, forceNew = true, historyContent }: AIPhoneModalProps) => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [phoneContent, setPhoneContent] = useState<AIPhoneContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      if (historyContent) {
        setPhoneContent(historyContent)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const content = await generateAIPhoneContent(characterId, characterName, forceNew)
        setPhoneContent(content)
      } catch (error) {
        console.error('加载手机内容失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [characterId, characterName, forceNew, historyContent])

  // 定义应用列表，区分 Dock 和 桌面
  const dockApps: PhoneApp[] = [
    { id: 'wechat', name: '微信', IconComponent: ChatIcon, bgClass: 'bg-[#07C160]', onClick: () => setSelectedApp('wechat') },
    { id: 'browser', name: 'Safari', IconComponent: BrowserIcon, bgClass: 'bg-blue-500', onClick: () => setSelectedApp('browser') },
    { id: 'music', name: '音乐', IconComponent: MusicIcon, bgClass: 'bg-[#FA233B]', onClick: () => setSelectedApp('music') },
    { id: 'contacts', name: '通讯录', IconComponent: ContactIcon, bgClass: 'bg-gray-400', onClick: () => setSelectedApp('contacts') },
  ]

  const gridApps: PhoneApp[] = [
    { id: 'alipay', name: '支付宝', IconComponent: AlipayIcon, bgClass: 'bg-[#1677FF]', onClick: () => setSelectedApp('alipay') },
    { id: 'taobao', name: '淘宝', IconComponent: ShoppingIcon, bgClass: 'bg-[#FF5000]', onClick: () => setSelectedApp('taobao') },
    { id: 'photos', name: '照片', IconComponent: ImageIcon, bgClass: 'bg-white', iconColor: 'text-pink-500', onClick: () => setSelectedApp('photos') },
    { id: 'notes', name: '备忘录', IconComponent: NotesIcon, bgClass: 'bg-[#FFD60A]', iconColor: 'text-white', onClick: () => setSelectedApp('notes') },
    { id: 'footprints', name: '地图', IconComponent: LocationIcon, bgClass: 'bg-green-500', onClick: () => setSelectedApp('footprints') },
    { id: 'forum', name: '论坛', IconComponent: ForumIcon, bgClass: 'bg-purple-500', onClick: () => setSelectedApp('forum') },
  ]

  const renderAppContent = (appId: string) => {
    if (!phoneContent) {
      return (
        <div className="w-full h-full bg-gray-50/50 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full mb-4"></div>
          <p className="text-gray-600 text-center font-medium">加载中...</p>
        </div>
      )
    }

    switch (appId) {
      case 'contacts': return <ContactsApp content={phoneContent} />
      case 'wechat': return <WechatApp content={phoneContent} />
      case 'browser': return <BrowserApp content={phoneContent} />
      case 'taobao': return <TaobaoApp content={phoneContent} />
      case 'alipay': return <AlipayApp content={phoneContent} />
      case 'photos': return <PhotosApp content={phoneContent} />
      case 'notes': return <NotesApp content={phoneContent} />
      case 'music': return <MusicApp content={phoneContent} />
      case 'footprints': return <MapsApp content={phoneContent} />
      case 'forum': return <ForumApp content={phoneContent} />
      default:
        return (
          <div className="w-full h-full bg-gray-50/50 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center">
            <p className="text-gray-600 text-center font-medium">未知应用</p>
          </div>
        )
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* 手机外壳 */}
      <div
        style={{ 
          width: '320px',
          height: '640px',
          backgroundColor: '#F5F5F5',
          borderRadius: '40px',
          border: '10px solid #E5E5E5',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-7 h-7 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/40 transition-all"
        >
          <CloseIcon size={14} />
        </button>

        {/* 主屏幕内容 */}
        <div className="w-full h-full relative" style={{ backgroundColor: '#F5F5F5' }}>
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-600">
              <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full mb-4"></div>
              <p className="text-sm font-medium">正在启动...</p>
            </div>
          ) : selectedApp ? (
            // 应用界面
            <div className="w-full h-full relative animate-fade-in overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
              {/* 底部 Home Indicator (应用内) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50"></div>

              {/* 返回桌面按钮 */}
              <button
                className="absolute top-3 left-3 z-50 w-7 h-7 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-gray-700 hover:bg-black/20 transition-all"
                onClick={() => setSelectedApp(null)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* 应用内容 */}
              {renderAppContent(selectedApp)}
            </div>
          ) : (
            // 桌面 (Home Screen)
            <div className="w-full h-full relative overflow-hidden">
              {/* 壁纸 */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621574539436-4b82935d27df?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />

              {/* 时间小组件 */}
              <div className="relative z-10 pt-20 px-6 mb-8 text-center">
                <div className="text-6xl font-thin text-white tracking-tight drop-shadow-lg">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-lg text-white/90 font-normal mt-1 drop-shadow-md">
                  {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
              </div>

              {/* 应用网格 */}
              <div className="relative z-10 flex flex-wrap justify-center gap-x-6 gap-y-6 px-5">
                {gridApps.map((app) => {
                  const Icon = app.IconComponent
                  return (
                    <div key={app.id} onClick={app.onClick} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform duration-200 w-[60px]">
                      <div className={`w-[60px] h-[60px] ${app.bgClass} rounded-[14px] flex items-center justify-center shadow-lg`}>
                        <Icon className={`w-8 h-8 ${app.iconColor || 'text-white'}`} />
                      </div>
                      <span className="text-[11px] text-white font-medium drop-shadow-md text-center leading-tight">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Dock 栏 */}
              <div className="absolute bottom-4 left-4 right-4 h-24 bg-white/20 backdrop-blur-2xl rounded-[26px] flex items-center justify-around px-2 border border-white/10 z-10">
                {dockApps.map((app) => {
                  const Icon = app.IconComponent
                  return (
                    <div key={app.id} onClick={app.onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform duration-200">
                      <div className={`w-[60px] h-[60px] ${app.bgClass} rounded-[14px] flex items-center justify-center shadow-lg`}>
                        <Icon className={`w-8 h-8 ${app.iconColor || 'text-white'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AIPhoneModal
