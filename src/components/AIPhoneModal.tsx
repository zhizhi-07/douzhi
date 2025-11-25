import { useState, useEffect } from 'react'
import { ContactIcon, ChatIcon, ImageIcon, MusicIcon, LocationIcon, ShoppingIcon, BrowserIcon, AlipayIcon, NotesIcon, CloseIcon, ChevronLeftIcon, ForumIcon } from './Icons'
import { generateAIPhoneContent, AIPhoneContent } from '../utils/aiPhoneGenerator'
import StatusBar from './StatusBar'
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

  // iOS应用图标 - iOS经典配色
  const allApps: PhoneApp[] = [
    { id: 'contacts', name: '通讯录', IconComponent: ContactIcon, color: 'from-gray-400 to-gray-500', onClick: () => setSelectedApp('contacts') },
    { id: 'wechat', name: '微信', IconComponent: ChatIcon, color: 'from-green-400 to-green-500', onClick: () => setSelectedApp('wechat') },
    { id: 'browser', name: 'Safari', IconComponent: BrowserIcon, color: 'from-blue-400 to-blue-500', onClick: () => setSelectedApp('browser') },
    { id: 'taobao', name: '淘宝', IconComponent: ShoppingIcon, color: 'from-orange-400 to-red-500', onClick: () => setSelectedApp('taobao') },
    { id: 'alipay', name: '支付宝', IconComponent: AlipayIcon, color: 'from-blue-400 to-blue-600', onClick: () => setSelectedApp('alipay') },
    { id: 'photos', name: '照片', IconComponent: ImageIcon, color: 'from-pink-400 to-purple-500', onClick: () => setSelectedApp('photos') },
    { id: 'notes', name: '备忘录', IconComponent: NotesIcon, color: 'from-yellow-300 to-yellow-400', onClick: () => setSelectedApp('notes') },
    { id: 'music', name: '音乐', IconComponent: MusicIcon, color: 'from-red-400 to-pink-500', onClick: () => setSelectedApp('music') },
    { id: 'footprints', name: '地图', IconComponent: LocationIcon, color: 'from-blue-400 to-purple-500', onClick: () => setSelectedApp('footprints') },
    { id: 'forum', name: '论坛', IconComponent: ForumIcon, color: 'from-purple-400 to-pink-500', onClick: () => setSelectedApp('forum') },
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
      case 'contacts':
        return <ContactsApp content={phoneContent} />
      case 'wechat':
        return <WechatApp content={phoneContent} />
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
          <div className="w-full h-full bg-gray-50/50 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center">
            <p className="text-gray-600 text-center font-medium">未知应用</p>
          </div>
        )
    }
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none'
      }}
    >
      {/* 手机外壳 - 强制不透明 */}
      <div 
        className="relative w-full max-w-md h-[85vh] max-h-[850px] rounded-[3rem] shadow-2xl border-8 border-gray-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#ffffff',
          opacity: 1,
          filter: 'none'
        }}
      >
        {/* 使用现有的StatusBar组件 */}
        <div className="absolute top-0 left-0 right-0 z-10" style={{ backgroundColor: '#ffffff' }}>
          <StatusBar />
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all"
        >
          <CloseIcon size={14} className="text-gray-600" />
        </button>

        {/* 应用内容区 - 强制不透明 */}
        <div className="absolute top-11 bottom-8 left-0 right-0" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
          {isLoading ? (
            // 加载状态
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="animate-spin w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full mb-4"></div>
              <p className="text-gray-600 font-medium">正在生成{characterName}的手机内容...</p>
              <p className="text-xs text-gray-400 mt-2">根据聊天记录和性格定制中</p>
            </div>
          ) : selectedApp ? (
            // 显示应用内容
            <div className="w-full h-full relative">
              {/* 返回桌面按钮 */}
              <button
                onClick={() => setSelectedApp(null)}
                className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shadow-md border border-gray-200"
              >
                <ChevronLeftIcon size={20} className="text-gray-600" />
              </button>
              {renderAppContent(selectedApp)}
            </div>
          ) : (
            // iOS桌面 - 强制不透明背景
            <div 
              className="w-full h-full px-6 py-4 overflow-y-auto hide-scrollbar"
              style={{ 
                backgroundColor: '#f9fafb',
                backgroundImage: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
                opacity: 1,
                filter: 'none'
              }}
            >
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
                      <div className={`w-14 h-14 bg-gradient-to-br ${app.color} rounded-[1.1rem] flex items-center justify-center shadow-sm`}>
                        {/* 统一使用 className 控制内部图标大小，避免个别图标显得过大 */}
                        <Icon className="w-6 h-6 text-white" />
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
          <div className="w-28 h-1 bg-gray-800 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default AIPhoneModal
