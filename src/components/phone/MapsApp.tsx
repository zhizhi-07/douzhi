import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MapsAppProps {
  content: AIPhoneContent
}

const MapsApp = ({ content }: MapsAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">今日足迹</h1>
          <p className="text-sm text-gray-500 mt-0.5">记录TA的一天</p>
        </div>
      </div>
      
      {/* 足迹时间线 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="relative">
          {/* 时间线竖线 */}
          <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gray-300"></div>
          
          {/* 足迹列表 */}
          <div className="space-y-4">
            {content.footprints.map((footprint, index) => (
              <div key={index} className="relative pl-12">
                {/* 时间点 */}
                <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-gray-200 backdrop-blur-md border-2 border-white flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-gray-700">{footprint.time}</span>
                </div>
                
                {/* 内容卡片 */}
                <div className="bg-white backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-base">{footprint.location}</div>
                      <div className="text-xs text-gray-600 mt-1">{footprint.address}</div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">时长:</span>
                          <span className="text-gray-700">停留 {footprint.duration}</span>
                        </div>
                        
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500">活动:</span>
                          <span className="text-gray-700 flex-1">{footprint.activity}</span>
                        </div>
                        
                        {footprint.mood && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">心情:</span>
                            <span className="text-gray-600">{footprint.mood}</span>
                          </div>
                        )}
                        
                        {footprint.companion && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">同行:</span>
                            <span className="text-gray-600">和 {footprint.companion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapsApp
