import { useState, useEffect } from 'react'
import { ContactIcon, ChatIcon, ImageIcon, MusicIcon, LocationIcon, ShoppingIcon, BrowserIcon, AlipayIcon, NotesIcon, CloseIcon, ChevronLeftIcon, ForumIcon } from './Icons'
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
  forceNew?: boolean  // 是否强制生成新内容
  historyContent?: AIPhoneContent  // 历史记录内容
}

interface PhoneApp {
  id: string
  name: string
  IconComponent: React.ComponentType<{ size?: number; className?: string }>
  color: string
  onClick: () => void
}

const AIPhoneModal = ({ onClose, characterId, characterName, forceNew = true, historyContent }: AIPhoneModalProps) => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [phoneContent, setPhoneContent] = useState<AIPhoneContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 加载手机内容
  useEffect(() => {
    const loadContent = async () => {
      // 如果有历史记录内容，直接使用
      if (historyContent) {
        setPhoneContent(historyContent)
        setIsLoading(false)
        return
      }

      // 否则调用API生成
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

  // iOS应用图标
  const allApps: PhoneApp[] = [
    { id: 'contacts', name: '通讯录', IconComponent: ContactIcon, color: 'from-gray-400 to-gray-500', onClick: () => setSelectedApp('contacts') },
    { id: 'wechat', name: '微信', IconComponent: ChatIcon, color: 'from-green-400 to-green-500', onClick: () => setSelectedApp('wechat') },
    { id: 'browser', name: 'Safari', IconComponent: BrowserIcon, color: 'from-blue-400 to-blue-500', onClick: () => setSelectedApp('browser') },
    { id: 'taobao', name: '淘宝', IconComponent: ShoppingIcon, color: 'from-orange-400 to-orange-500', onClick: () => setSelectedApp('taobao') },
    { id: 'alipay', name: '支付宝', IconComponent: AlipayIcon, color: 'from-blue-500 to-blue-600', onClick: () => setSelectedApp('alipay') },
    { id: 'photos', name: '照片', IconComponent: ImageIcon, color: 'from-pink-400 to-pink-500', onClick: () => setSelectedApp('photos') },
    { id: 'notes', name: '备忘录', IconComponent: NotesIcon, color: 'from-yellow-400 to-yellow-500', onClick: () => setSelectedApp('notes') },
    { id: 'music', name: '音乐', IconComponent: MusicIcon, color: 'from-red-400 to-red-500', onClick: () => setSelectedApp('music') },
    { id: 'footprints', name: '地图', IconComponent: LocationIcon, color: 'from-green-500 to-green-600', onClick: () => setSelectedApp('footprints') },
    { id: 'forum', name: '论坛', IconComponent: ForumIcon, color: 'from-purple-400 to-pink-500', onClick: () => setSelectedApp('forum') },
  ]

  const renderAppContent = (appId: string) => {
    if (!phoneContent) {
      return (
        <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-3 border-gray-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 text-center font-medium">加载中...</p>
        </div>
      )
    }

    switch (appId) {
      case 'contacts':
        return <ContactsApp content={phoneContent} />
      case 'wechat':
        return <WechatApp content={phoneContent} onBack={() => setSelectedApp(null)} />
      case 'browser':
        return <BrowserApp content={phoneContent} />
      case 'taobao':
        return <TaobaoApp content={phoneContent} />
      case 'alipay':
        return <AlipayApp content={phoneContent} />
      case 'photos':
        return <PhotosApp content={phoneContent} />
      case 'notes':
        return <NotesApp content={phoneContent} />
      case 'music':
        return <MusicApp content={phoneContent} />
      case 'footprints':
        return <MapsApp content={phoneContent} />
      case 'forum':
        return <ForumApp content={phoneContent} />
      default:
        return (
          <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center">
            <p className="text-gray-600 text-center font-medium">未知应用</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 手机外壳 - iOS风格 */}
      <div className="relative w-full max-w-md h-[85vh] max-h-[850px] bg-white rounded-[3rem] shadow-2xl border-8 border-gray-900 overflow-hidden">
        {/* iOS状态栏 */}
        <div className="absolute top-0 left-0 right-0 h-11 bg-white flex items-center justify-between px-6 z-10">
          <div className="text-xs font-semibold text-gray-900">
            {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            </svg>
          </div>
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all"
        >
          <CloseIcon size={14} className="text-gray-700" />
        </button>

        {/* 应用内容区 */}
        <div className="absolute top-14 bottom-8 left-0 right-0">
          {isLoading ? (
            // 加载状态
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="animate-spin w-16 h-16 border-4 border-gray-300 border-t-gray-700 rounded-full mb-4"></div>
              <p className="text-gray-600 font-medium">正在生成{characterName}的手机内容...</p>
              <p className="text-xs text-gray-400 mt-2">根据聊天记录和性格定制中</p>
            </div>
          ) : selectedApp ? (
            // 显示应用内容
            <div className="w-full h-full relative">
              {/* 只在非微信应用时显示返回按钮，微信应用自己处理返回 */}
              {selectedApp !== 'wechat' && (
                <button
                  onClick={() => setSelectedApp(null)}
                  className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white/95 flex items-center justify-center transition-all shadow-lg backdrop-blur-md border border-white/50"
                >
                  <ChevronLeftIcon size={20} className="text-gray-700" />
                </button>
              )}
              {renderAppContent(selectedApp)}
            </div>
          ) : (
            // iOS桌面
            <div className="w-full h-full bg-gradient-to-b from-blue-50 to-white px-6 py-4 overflow-y-auto hide-scrollbar">
              {/* iOS时间和日期 */}
              <div className="text-center mb-8 mt-4">
                <div className="text-6xl font-light text-gray-900 mb-1">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('zh-CN', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>

              {/* iOS应用图标 - 4列布局 */}
              <div className="grid grid-cols-4 gap-6 px-2">
                {allApps.map((app) => {
                  const Icon = app.IconComponent
                  return (
                    <div
                      key={app.id}
                      onClick={app.onClick}
                      className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${app.color} rounded-[1.1rem] flex items-center justify-center shadow-md`}>
                        <Icon size={26} className="text-white" />
                      </div>
                      <span className="text-[10px] text-gray-900 text-center font-normal leading-tight">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* iOS Home Indicator */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="w-28 h-1 bg-gray-900 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default AIPhoneModal
