import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface PhotosAppProps {
  content: AIPhoneContent
}

const PhotosApp = ({ content }: PhotosAppProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  // 生成随机柔和背景色
  const getRandomColor = (index: number) => {
    const colors = [
      'bg-rose-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100',
      'bg-purple-100', 'bg-pink-100', 'bg-indigo-100', 'bg-orange-100'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans absolute inset-0">
      {/* 顶部标题栏 */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="w-10"></div> {/* 占位 */}
          <h1 className="text-[17px] font-semibold text-black">图库</h1>
          <button className="text-[17px] text-[#007AFF] font-normal">选择</button>
        </div>
      </div>

      {/* 照片网格 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="grid grid-cols-3 gap-[2px] mb-20">
          {content.photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square ${getRandomColor(index)} relative overflow-hidden group cursor-pointer`}
            >
              {/* 照片内容模拟 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transition-transform duration-200 active:scale-95">
                <p className="text-[11px] text-gray-600 text-center font-medium leading-relaxed line-clamp-4">
                  {photo.description}
                </p>
                <span className="text-[9px] text-gray-400 mt-1">{photo.time.split(' ')[0]}</span>
              </div>
            </div>
          ))}
          {/* 填充一些空白格子以模拟更多内容 */}
          {Array.from({ length: Math.max(0, 15 - content.photos.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-gray-50"></div>
          ))}
        </div>
      </div>

      {/* 照片详情弹窗 */}
      {selectedIndex !== null && (
        <div
          className="absolute inset-0 bg-black/90 z-30 flex flex-col animate-in fade-in duration-200"
          onClick={() => setSelectedIndex(null)}
        >
          {/* 顶部关闭按钮 */}
          <div className="p-4 flex justify-end">
            <button className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 照片内容 */}
          <div className="flex-1 flex flex-col items-center justify-center px-6" onClick={(e) => e.stopPropagation()}>
            <div className={`w-64 h-64 ${getRandomColor(selectedIndex)} rounded-2xl flex items-center justify-center p-6 mb-6`}>
              <p className="text-gray-700 text-center text-sm leading-relaxed">
                {content.photos[selectedIndex].description}
              </p>
            </div>

            {/* 照片信息 */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full max-w-[280px]">
              <div className="space-y-3">
                {/* 拍摄时间 */}
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/90 text-sm">{content.photos[selectedIndex].time}</span>
                </div>

                {/* 拍摄地点 */}
                {content.photos[selectedIndex].location && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white/90 text-sm">{content.photos[selectedIndex].location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部工具栏 */}
          <div className="p-4 flex justify-around">
            <button className="text-white/80 flex flex-col items-center gap-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-[10px]">share</span>
            </button>
            <button className="text-white/80 flex flex-col items-center gap-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-[10px]">like</span>
            </button>
            <button className="text-white/80 flex flex-col items-center gap-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-[10px]">delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 底部标签栏 */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-6 pt-2 px-6 flex justify-between items-center sticky bottom-0 z-20">
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-[#007AFF]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
            <path d="M4 18l4-5h3l4 5h5v-2l-5-6-4 5-3-4-4 6v1z" />
          </svg>
          <span className="text-[10px] text-[#007AFF] font-medium">图库</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-[10px] text-gray-500 font-medium">为你推荐</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
          <span className="text-[10px] text-gray-500 font-medium">相簿</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <span className="text-[10px] text-gray-500 font-medium">搜索</span>
        </div>
      </div>
    </div>
  )
}

export default PhotosApp
