import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface PhotosAppProps {
  content: AIPhoneContent
}

const PhotosApp = ({ content }: PhotosAppProps) => {
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
