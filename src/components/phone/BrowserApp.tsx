import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface BrowserAppProps {
  content: AIPhoneContent
}

const BrowserApp = ({ content }: BrowserAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 地址栏 */}
      <div className="px-4 py-3 border-b border-white/30 bg-white/20">
        <div className="bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <span>搜索或输入网址</span>
        </div>
      </div>
      
      {/* 浏览历史 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">最近访问</h3>
        <div className="space-y-2">
          {content.browserHistory.map((item, index) => (
            <div 
              key={index}
              className="bg-white/50 backdrop-blur-md rounded-xl p-3 border border-white/50 shadow-sm"
            >
              <div className="font-medium text-gray-800 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500 truncate">{item.url}</div>
              {item.reason && (
                <div className="text-xs text-gray-600 mt-1 italic">搜索原因: {item.reason}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BrowserApp
