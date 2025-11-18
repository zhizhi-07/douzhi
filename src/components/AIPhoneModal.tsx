import { useState, useEffect } from 'react'
import { ContactIcon, ChatIcon, ImageIcon, MusicIcon, LocationIcon, ShoppingIcon, BrowserIcon, AlipayIcon, NotesIcon, CloseIcon, ChevronLeftIcon } from './Icons'
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

  // 所有应用（单页显示）
  const allApps: PhoneApp[] = [
    { id: 'contacts', name: '通讯录', IconComponent: ContactIcon, color: 'from-gray-300/50 to-gray-400/50', onClick: () => setSelectedApp('contacts') },
    { id: 'wechat', name: '微信', IconComponent: ChatIcon, color: 'from-green-300/50 to-green-400/50', onClick: () => setSelectedApp('wechat') },
    { id: 'browser', name: '浏览器', IconComponent: BrowserIcon, color: 'from-blue-300/50 to-blue-400/50', onClick: () => setSelectedApp('browser') },
    { id: 'taobao', name: '淘宝', IconComponent: ShoppingIcon, color: 'from-orange-300/50 to-orange-400/50', onClick: () => setSelectedApp('taobao') },
    { id: 'alipay', name: '支付宝', IconComponent: AlipayIcon, color: 'from-blue-400/50 to-blue-500/50', onClick: () => setSelectedApp('alipay') },
    { id: 'photos', name: '相册', IconComponent: ImageIcon, color: 'from-pink-300/50 to-pink-400/50', onClick: () => setSelectedApp('photos') },
    { id: 'notes', name: '备忘录', IconComponent: NotesIcon, color: 'from-yellow-300/50 to-yellow-400/50', onClick: () => setSelectedApp('notes') },
    { id: 'music', name: '音乐', IconComponent: MusicIcon, color: 'from-red-300/50 to-red-400/50', onClick: () => setSelectedApp('music') },
    { id: 'footprints', name: '足迹', IconComponent: LocationIcon, color: 'from-green-400/50 to-green-500/50', onClick: () => setSelectedApp('footprints') },
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

      {/* 手机外壳 - 白色液态玻璃 */}
      <div className="relative w-full max-w-md h-[80vh] max-h-[800px] bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden">
        {/* 顶部状态栏 */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-white/40 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-6 z-10">
          <div className="text-sm font-medium text-gray-800">
            {characterName}的手机
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-all shadow-sm"
          >
            <CloseIcon size={18} className="text-gray-700" />
          </button>
        </div>

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
            // 显示桌面 - 使用项目桌面风格
            <div className="w-full h-full px-4 py-2 overflow-y-auto hide-scrollbar flex flex-col">
              {/* 大时间 */}
              <div className="p-6 mb-4 text-center">
                <div className="text-7xl font-bold text-gray-900 mb-2">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-base font-semibold text-gray-600">
                  {currentTime.toLocaleDateString('zh-CN', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>

              {/* 应用图标网格 - 4列布局 */}
              <div className="grid grid-cols-4 gap-4 auto-rows-min">
                {allApps.map((app) => {
                  const Icon = app.IconComponent
                  return (
                    <div
                      key={app.id}
                      onClick={app.onClick}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                        <Icon size={28} className="text-gray-300" />
                      </div>
                      <span className="text-xs text-gray-700 text-center font-medium">
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
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-30"></div>
        </div>
      </div>
    </div>
  )
}

export default AIPhoneModal
