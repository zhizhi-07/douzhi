import { useState, useEffect } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { getAllUIIcons } from '../../utils/iconStorage'
import LiveStream from './LiveStream'

interface WechatAppProps {
  content: AIPhoneContent
}

type WechatView = 'chat' | 'contacts' | 'discover' | 'me' | 'live'

const WechatApp = ({ content }: WechatAppProps) => {
  const [currentView, setCurrentView] = useState<WechatView>('chat')
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})

  // 加载自定义图标
  useEffect(() => {
    const loadIcons = async () => {
      const icons = await getAllUIIcons()
      setCustomIcons(icons)
    }
    loadIcons()

    // 监听图标变化
    const handleIconChange = async () => {
      const icons = await getAllUIIcons()
      setCustomIcons(icons)
    }
    window.addEventListener('iconChanged', handleIconChange)
    return () => window.removeEventListener('iconChanged', handleIconChange)
  }, [])

  // 底部导航栏组件
  const renderBottomNav = () => (
    <div className="bg-[#F7F7F7] border-t border-gray-200/80 px-2 py-1 flex items-center justify-around pb-4">
      <button
        className="flex flex-col items-center py-1 px-3"
        onClick={() => { setCurrentView('chat'); setSelectedChat(null); }}
      >
        {customIcons['nav-chat'] ? (
          <img src={customIcons['nav-chat']} alt="微信" className="w-6 h-6 object-contain" />
        ) : (
          <svg className={`w-6 h-6 ${currentView === 'chat' ? 'text-[#07C160]' : 'text-[#181818]'}`} fill={currentView === 'chat' ? 'currentColor' : 'none'} stroke={currentView === 'chat' ? 'none' : 'currentColor'} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'chat' ? 'text-[#07C160]' : 'text-[#181818]'} mt-0.5 font-medium`}>微信</span>
      </button>
      <button
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('contacts')}
      >
        {customIcons['nav-contacts'] ? (
          <img src={customIcons['nav-contacts']} alt="通讯录" className="w-6 h-6 object-contain" />
        ) : (
          <svg className={`w-6 h-6 ${currentView === 'contacts' ? 'text-[#07C160]' : 'text-[#181818]'}`} fill={currentView === 'contacts' ? 'currentColor' : 'none'} stroke={currentView === 'contacts' ? 'none' : 'currentColor'} strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'contacts' ? 'text-[#07C160]' : 'text-[#181818]'} mt-0.5 font-medium`}>通讯录</span>
      </button>
      <button
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('discover')}
      >
        {customIcons['nav-discover'] ? (
          <img src={customIcons['nav-discover']} alt="发现" className="w-6 h-6 object-contain" />
        ) : (
          <svg className={`w-6 h-6 ${currentView === 'discover' ? 'text-[#07C160]' : 'text-[#181818]'}`} fill={currentView === 'discover' ? 'currentColor' : 'none'} stroke={currentView === 'discover' ? 'none' : 'currentColor'} strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'discover' ? 'text-[#07C160]' : 'text-[#181818]'} mt-0.5 font-medium`}>发现</span>
      </button>
      <button
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('me')}
      >
        {customIcons['nav-me'] ? (
          <img src={customIcons['nav-me']} alt="我" className="w-6 h-6 object-contain" />
        ) : (
          <svg className={`w-6 h-6 ${currentView === 'me' ? 'text-[#07C160]' : 'text-[#181818]'}`} fill={currentView === 'me' ? 'currentColor' : 'none'} stroke={currentView === 'me' ? 'none' : 'currentColor'} strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'me' ? 'text-[#07C160]' : 'text-[#181818]'} mt-0.5 font-medium`}>我</span>
      </button>
    </div>
  )

  // 渲染聊天详情
  if (currentView === 'chat' && selectedChat !== null) {
    const chat = content.wechatChats[selectedChat]

    if (!chat || !chat.messages || chat.messages.length === 0) {
      return (
        <div className="w-full h-full bg-[#EDEDED] flex flex-col absolute inset-0">
          <div className="px-4 py-3 border-b border-gray-200/80 bg-[#EDEDED] flex items-center gap-3 sticky top-0 z-10">
            <button onClick={() => setSelectedChat(null)} className="text-black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="flex-1 text-center text-[17px] font-medium text-black">{chat?.name || '无效聊天'}</h2>
            <div className="w-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">暂无消息</p>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-[#EDEDED] flex flex-col absolute inset-0">
        <div
          className="px-4 py-3 border-b border-gray-200/80 bg-[#EDEDED] flex items-center gap-3 sticky top-0 z-10"
          style={customIcons['chat-topbar-bg'] ? {
            backgroundImage: `url(${customIcons['chat-topbar-bg']})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          <button onClick={() => setSelectedChat(null)} className="text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-[17px] font-medium text-black">{chat.name}</h2>
          <div className="w-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.messages
            .filter(message => message && message.content && message.content.trim())
            .map((message, index) => (
              <div key={index} className={`flex items-end gap-2 ${message.isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-9 h-9 rounded-md bg-gray-300 flex items-center justify-center flex-shrink-0 text-gray-600 font-medium text-xs">
                  {message.isSelf ? '我' : chat.name[0]}
                </div>
                <div className="max-w-[70%]">
                  <div className={`rounded-[4px] px-3 py-2.5 ${message.isSelf ? 'bg-[#95EC69] text-black' : 'bg-white text-black'} shadow-sm text-[15px] leading-relaxed`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  // 渲染直播页面
  if (currentView === 'live') {
    return <LiveStream onBack={() => setCurrentView('discover')} userName={content.characterName} />
  }

  // 渲染通讯录
  if (currentView === 'contacts') {
    return (
      <div className="w-full h-full bg-[#EDEDED] overflow-hidden flex flex-col absolute inset-0">
        <div className="bg-[#EDEDED] border-b border-gray-200/80 sticky top-0 z-10">
          <div className="px-4 pt-3 pb-3 flex justify-between items-center">
            <h1 className="text-[17px] font-medium text-black">通讯录</h1>
            <div className="w-6 h-6 flex items-center justify-center border border-black rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
          <div className="px-2 pb-2">
            <div className="bg-white rounded-md px-3 py-1.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span className="text-sm text-gray-400">搜索</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="bg-white">
            {/* 固定功能入口 */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 active:bg-gray-100">
              <div className="w-10 h-10 rounded-md bg-[#FA9D3B] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
              </div>
              <span className="text-[16px] text-black">新的朋友</span>
            </div>
            {content.contacts.map((contact, index) => (
              <div key={index} className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 active:bg-gray-100">
                <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <span className="text-base font-medium text-gray-600">{contact.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-normal text-[16px] text-black">{contact.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderBottomNav()}
      </div>
    )
  }

  // 渲染朋友圈（发现）
  if (currentView === 'discover') {
    return (
      <div className="w-full h-full bg-[#EDEDED] overflow-hidden flex flex-col absolute inset-0">
        <div className="bg-[#EDEDED] border-b border-gray-200/80 sticky top-0 z-10">
          <div className="px-4 pt-3 pb-3">
            <h1 className="text-[17px] font-medium text-black">发现</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white mt-0">
            <div className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moments_icon.svg/1024px-Moments_icon.svg.png" className="w-6 h-6" alt="朋友圈" />
                <span className="text-[16px] text-black">朋友圈</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="bg-white mt-2">
            <div className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#F6C543]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                </div>
                <span className="text-[16px] text-black">视频号</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div
              className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between cursor-pointer"
              onClick={() => setCurrentView('live')}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FA5151]" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
                </div>
                <span className="text-[16px] text-black">直播</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="bg-white mt-2">
            <div className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1485EE]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                </div>
                <span className="text-[16px] text-black">扫一扫</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FA5151]" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                </div>
                <span className="text-[16px] text-black">搜一搜</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        {renderBottomNav()}
      </div>
    )
  }

  // 渲染"我"页面
  if (currentView === 'me') {
    return (
      <div className="w-full h-full bg-[#EDEDED] overflow-hidden flex flex-col absolute inset-0">
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white pt-12 pb-8 px-6 mb-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[20px] font-semibold text-black mb-1">{content.characterName || '用户'}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">微信号: wxid_xxxxxx</div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white mt-2">
            <div className="px-4 py-3 border-b border-gray-100 active:bg-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#07C160]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" /></svg>
                </div>
                <span className="text-[16px] text-black">服务</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="bg-white mt-2">
            {[
              { label: '收藏', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', color: '#FA5151' },
              { label: '朋友圈', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', color: '#1485EE' },
              { label: '卡包', icon: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', color: '#1485EE' },
              { label: '表情', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z', color: '#F6C543' }
            ].map((item, index) => (
              <div key={index} className="px-4 py-3 border-b border-gray-100 active:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-6 h-6" style={{ color: item.color }} fill="currentColor" viewBox="0 0 24 24">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-[16px] text-black">{item.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          <div className="bg-white mt-2 mb-4">
            <div className="px-4 py-3 active:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1485EE]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" /></svg>
                </div>
                <span className="text-[16px] text-black">设置</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        {renderBottomNav()}
      </div>
    )
  }

  // 默认渲染微信聊天列表
  return (
    <div className="w-full h-full bg-[#EDEDED] overflow-hidden flex flex-col absolute inset-0">
      <div className="bg-[#EDEDED] border-b border-gray-200/80 sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3 flex justify-between items-center">
          <h1 className="text-[17px] font-medium text-black">微信</h1>
          <div className="w-6 h-6 flex items-center justify-center border border-black rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>
        <div className="px-2 pb-2">
          <div className="bg-white rounded-md px-3 py-1.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="text-sm text-gray-400">搜索</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {content.wechatChats
          .filter(chat => chat && chat.name && chat.name.trim())
          .map((chat, originalIndex) => {
            const actualIndex = content.wechatChats.findIndex(c => c === chat)
            return (
              <div key={actualIndex} onClick={() => setSelectedChat(actualIndex)} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <span className="text-lg font-medium text-gray-600">{chat.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-normal text-[16px] text-black truncate">{chat.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate flex-1">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-[#FA5151] text-white text-[10px] rounded-full flex-shrink-0 min-w-[16px] text-center">{chat.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
      {renderBottomNav()}
    </div>
  )
}

export default WechatApp
