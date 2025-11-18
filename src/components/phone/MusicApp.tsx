import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MusicAppProps {
  content: AIPhoneContent
}

const MusicApp = ({ content }: MusicAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">资资歌单</h1>
        </div>
      </div>
      
      {/* 歌曲列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white">
          {content.musicPlaylist.map((song, index) => (
            <div 
              key={index}
              className="px-4 py-3 border-b border-gray-200 active:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400 text-sm w-6 flex-shrink-0 text-center">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{song.title}</div>
                  <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                  {song.mood && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">💭 {song.mood}</div>
                  )}
                </div>
                <button className="p-2">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MusicApp
