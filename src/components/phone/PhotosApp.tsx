import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface PhotosAppProps {
  content: AIPhoneContent
}

const PhotosApp = ({ content }: PhotosAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">图库</h1>
        </div>
      </div>
      
      {/* 相册分类 */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-blue-600">所有照片</span>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500">{content.photos.length}</span>
        </div>
      </div>
      
      {/* 照片网格 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="grid grid-cols-3 gap-1 p-1">
          {content.photos.map((photo, index) => (
            <div 
              key={index}
              className="aspect-square bg-gray-200 relative"
            >
              {/* 照片占位符 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <svg className="w-8 h-8 text-gray-400 mb-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[9px] text-gray-600 text-center leading-tight line-clamp-3 w-full">{photo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PhotosApp
