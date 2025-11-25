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
    <div className="bg-white border-t border-gray-200 px-2 py-1 flex items-center justify-around">
      <button 
        className="flex flex-col items-center py-1 px-3"
        onClick={() => { setCurrentView('chat'); setSelectedChat(null); }}
      >
        {customIcons['nav-chat'] ? (
          <img src={customIcons['nav-chat']} alt="微信" className="w-5 h-5 object-contain" />
        ) : (
          <svg className={`w-5 h-5 ${currentView === 'chat' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 000 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0020 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'chat' ? 'text-green-500' : 'text-gray-400'} mt-0.5`}>微信</span>
      </button>
      <button 
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('contacts')}
      >
        {customIcons['nav-contacts'] ? (
          <img src={customIcons['nav-contacts']} alt="通讯录" className="w-5 h-5 object-contain" />
        ) : (
          <svg className={`w-5 h-5 ${currentView === 'contacts' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'contacts' ? 'text-green-500' : 'text-gray-400'} mt-0.5`}>通讯录</span>
      </button>
      <button 
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('discover')}
      >
        {customIcons['nav-discover'] ? (
          <img src={customIcons['nav-discover']} alt="发现" className="w-5 h-5 object-contain" />
        ) : (
          <svg className={`w-5 h-5 ${currentView === 'discover' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
            <circle cx="12" cy="12" r="1"/>
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'discover' ? 'text-green-500' : 'text-gray-400'} mt-0.5`}>发现</span>
      </button>
      <button 
        className="flex flex-col items-center py-1 px-3"
        onClick={() => setCurrentView('me')}
      >
        {customIcons['nav-me'] ? (
          <img src={customIcons['nav-me']} alt="我" className="w-5 h-5 object-contain" />
        ) : (
          <svg className={`w-5 h-5 ${currentView === 'me' ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
        <span className={`text-[10px] ${currentView === 'me' ? 'text-green-500' : 'text-gray-400'} mt-0.5`}>我</span>
      </button>
    </div>
  )

  // 渲染聊天详情
  if (currentView === 'chat' && selectedChat !== null) {
    const chat = content.wechatChats[selectedChat]
    
    // 验证聊天数据完整性，防止显示混乱内容
    if (!chat || !chat.messages || chat.messages.length === 0) {
      return (
        <div className="w-full h-full bg-gray-50/50 backdrop-blur-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="text-blue-500 text-sm">返回</button>
            <h2 className="flex-1 text-center text-base font-semibold text-gray-800">{chat?.name || '无效聊天'}</h2>
            <div className="w-8"></div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-center">暂无消息</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="w-full h-full bg-gray-50/50 backdrop-blur-xl overflow-hidden flex flex-col">
        <div 
          className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3"
          style={customIcons['chat-topbar-bg'] ? {
            backgroundImage: `url(${customIcons['chat-topbar-bg']})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          <button onClick={() => setSelectedChat(null)} className="text-blue-500 text-sm">返回</button>
          <h2 className="flex-1 text-center text-base font-semibold text-gray-800">{chat.name}</h2>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.messages
            .filter(message => message && message.content && message.content.trim()) // 过滤无效消息
            .map((message, index) => (
            <div key={index} className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${message.isSelf ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2 ${message.isSelf ? 'bg-green-500 text-white' : 'bg-white text-gray-800'} shadow-sm`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className={`text-xs text-gray-500 mt-1 px-2 ${message.isSelf ? 'text-right' : 'text-left'}`}>{message.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染直播页面
  if (currentView === 'live') {
    console.log('正在渲染直播页面，characterName:', content.characterName);
    try {
      return <LiveStream onBack={() => setCurrentView('discover')} userName={content.characterName} />
    } catch (error) {
      console.error('LiveStream组件渲染错误:', error);
      return (
        <div className="w-full h-full bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">直播功能暂时不可用</p>
            <button 
              onClick={() => setCurrentView('discover')}
              className="text-blue-500 underline"
            >
              返回发现页
            </button>
          </div>
        </div>
      )
    }
  }

  // 渲染通讯录
  if (currentView === 'contacts') {
    return (
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 pt-3 pb-2">
            <h1 className="text-2xl font-bold text-gray-900">通讯录</h1>
          </div>
          <div className="px-4 pb-3">
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span className="text-sm text-gray-400">搜索</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white">
            {content.contacts.map((contact, index) => (
              <div key={index} className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 active:bg-gray-100">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-medium text-gray-700">{contact.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-500">{contact.relation}</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
      <div className="w-full h-full bg-white overflow-hidden flex flex-col" style={{ pointerEvents: 'auto' }}>
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 pt-3 pb-2">
            <h1 className="text-2xl font-bold text-gray-900">发现</h1>
          </div>
          
          {/* 测试按钮 */}
          <div className="px-4 pb-2">
            <button 
              onClick={() => {
                alert('测试按钮工作正常！');
                setCurrentView('live');
              }}
              style={{ 
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              测试直播按钮
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white" style={{ pointerEvents: 'auto' }}>
            <div className="px-4 py-3 border-b border-gray-200 active:bg-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                      <circle cx="12" cy="12" r="1"/>
                    </svg>
                  </div>
                  <span className="text-gray-900 font-medium">朋友圈</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="h-2 bg-gray-50"></div>
            
            <div 
              className="px-4 py-3 border-b border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
              style={{ 
                pointerEvents: 'auto !important' as any, 
                cursor: 'pointer !important' as any,
                opacity: 1,
                userSelect: 'none'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('直播按钮被点击');
                setCurrentView('live');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.cursor = 'pointer';
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                  </div>
                  <span className="text-gray-900 font-medium">直播</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-200 active:bg-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-gray-900 font-medium">扫一扫</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 active:bg-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-900 font-medium">搜一搜</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
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
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 pt-3 pb-2">
            <h1 className="text-2xl font-bold text-gray-900">我</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white p-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">{content.characterName || '用户'}</div>
                <div className="text-sm text-gray-500 mt-0.5">微信号: user_id</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="bg-white mt-2">
            {[
              { label: '服务', icon: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z' },
              { label: '收藏', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
              { label: '朋友圈', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
              { label: '卡包', icon: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' },
              { label: '表情', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z' }
            ].map((item, index) => (
              <div key={index} className="px-4 py-3 border-b border-gray-100 active:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} />
                  </svg>
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
          <div className="bg-white mt-2">
            <div className="px-4 py-3 active:bg-gray-50 flex items-center justify-between">
              <span className="text-gray-900">设置</span>
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
    <div className="w-full h-full bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">微信</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
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
          .filter(chat => chat && chat.name && chat.name.trim()) // 过滤无效聊天
          .map((chat, originalIndex) => {
            // 找到原始索引，用于正确定位聊天
            const actualIndex = content.wechatChats.findIndex(c => c === chat)
            return (
              <div key={actualIndex} onClick={() => setSelectedChat(actualIndex)} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-medium text-gray-700">{chat.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 truncate">{chat.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-500 text-white text-xs rounded-full flex-shrink-0">{chat.unread}</span>
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
