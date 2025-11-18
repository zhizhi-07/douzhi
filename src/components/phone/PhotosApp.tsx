import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface PhotosAppProps {
  content: AIPhoneContent
}

const PhotosApp = ({ content }: PhotosAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">相册</h2>
        <p className="text-xs text-gray-500 mt-1">{content.photos.length} 张照片</p>
      </div>
      
      {/* 照片列表 */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {content.photos.map((photo, index) => (
          <div 
            key={index}
            className="bg-gradient-to-br from-pink-100/60 to-purple-100/40 backdrop-blur-md rounded-2xl p-3 border border-pink-200/50 shadow-sm aspect-square flex flex-col justify-between"
          >
            <div className="flex-1 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">{photo.description}</p>
              {photo.location && (
                <p className="text-xs text-gray-500 mt-1">位置: {photo.location}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{photo.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhotosApp
