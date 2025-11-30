import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface BrowserAppProps {
  content: AIPhoneContent
}

const BrowserApp = ({ content }: BrowserAppProps) => {
  const favorites = [
    { name: 'Google', color: 'bg-blue-500', letter: 'G' },
    { name: 'Apple', color: 'bg-black', letter: 'A' },
    { name: 'Bing', color: 'bg-teal-600', letter: 'B' },
    { name: 'Wiki', color: 'bg-gray-500', letter: 'W' },
  ]

  return (
    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1621574539436-4b82935d27df?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center flex flex-col font-sans relative absolute inset-0">
      {/* 背景遮罩，让文字更清晰 */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

      {/* 内容区域 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-12 pb-32">
        {/* 收藏夹 */}
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-black mb-4">个人收藏</h2>
          <div className="grid grid-cols-4 gap-4">
            {favorites.map((fav, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className={`w-[60px] h-[60px] ${fav.color} rounded-[14px] flex items-center justify-center shadow-sm text-white text-2xl font-medium`}>
                  {fav.letter}
                </div>
                <span className="text-[11px] text-gray-800 text-center">{fav.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 经常访问 (使用历史记录) */}
        <div>
          <h2 className="text-[22px] font-bold text-black mb-4">经常访问</h2>
          <div className="bg-white/60 backdrop-blur-md rounded-[14px] overflow-hidden">
            {content.browserHistory.map((item, index) => (
              <div
                key={index}
                className={`px-4 py-3 flex items-center gap-3 active:bg-gray-200/50 transition-colors ${index !== content.browserHistory.length - 1 ? 'border-b border-gray-200/50' : ''}`}
              >
                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold text-sm">
                  {item.title[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-black truncate">{item.title}</div>
                  <div className="text-[12px] text-gray-500 truncate">{item.url}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部地址栏和工具栏 */}
      <div className="relative z-20 bg-[#F9F9F9]/90 backdrop-blur-xl border-t border-gray-300/50 pb-6 pt-2 px-4">
        {/* 地址栏 */}
        <div className="bg-white rounded-[12px] h-[44px] shadow-sm flex items-center px-3 gap-2 mb-3 border border-gray-200/50">
          <div className="text-[13px] text-black font-medium">大小</div>
          <div className="flex-1 text-center flex items-center justify-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
            <span className="text-[15px] text-black">google.com</span>
          </div>
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        {/* 底部导航图标 */}
        <div className="flex items-center justify-between px-2">
          <svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <svg className="w-6 h-6 text-[#007AFF] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <svg className="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default BrowserApp
