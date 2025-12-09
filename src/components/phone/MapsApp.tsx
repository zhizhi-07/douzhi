import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MapsAppProps {
  content: AIPhoneContent
}

const MapsApp = ({ content }: MapsAppProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  return (
    <div className="w-full h-full relative font-sans overflow-hidden absolute inset-0">
      {/* 地图背景 */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2674&auto=format&fit=crop')] bg-cover bg-center opacity-80"></div>

      {/* 地图上的标记点 (模拟) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-md mt-1 text-[10px] font-medium text-gray-700">
          当前位置
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-lg shadow-sm flex items-center justify-center text-blue-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>
        <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-lg shadow-sm flex items-center justify-center text-blue-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* 底部抽屉 (模拟) */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-white rounded-t-[20px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col z-20">
        {/* 把手 */}
        <div className="w-full h-6 flex items-center justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 pb-4">
          <div className="bg-[#F2F2F7] rounded-[10px] h-10 flex items-center px-3 gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[17px] text-gray-500">搜索地图</span>
          </div>
        </div>

        {/* 列表内容 */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <h2 className="text-[20px] font-bold text-black mb-3">我的足迹</h2>
          <div className="space-y-2">
            {content.footprints.map((footprint, index) => (
              <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                {/* 主行 - 可点击 */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer active:bg-gray-100 transition-colors"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-semibold text-black truncate">{footprint.location}</h3>
                      <span className="text-[12px] text-gray-400 flex-shrink-0 ml-2">{footprint.time}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 truncate">{footprint.address}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{footprint.activity}</p>
                  </div>
                  {/* 展开箭头 */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-1 ${expandedIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 展开详情 */}
                {expandedIndex === index && (
                  <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-lg p-3 ml-11 space-y-2">
                      {/* 停留时长 */}
                      {footprint.duration && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[12px] text-gray-600">停留 {footprint.duration}</span>
                        </div>
                      )}

                      {/* 心情 */}
                      {footprint.mood && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-[12px] text-gray-600">心情: {footprint.mood}</span>
                        </div>
                      )}

                      {/* 同行人 */}
                      {footprint.companion && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-[12px] text-gray-600">同行: {footprint.companion}</span>
                        </div>
                      )}

                      {/* 如果没有额外信息，显示提示 */}
                      {!footprint.duration && !footprint.mood && !footprint.companion && (
                        <p className="text-[12px] text-gray-400">暂无更多详情</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapsApp
