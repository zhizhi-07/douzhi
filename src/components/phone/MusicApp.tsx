import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MusicAppProps {
  content: AIPhoneContent
}

const MusicApp = ({ content }: MusicAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">音乐</h2>
        <p className="text-xs text-gray-500 mt-1">我的歌单</p>
      </div>
      
      {/* 歌曲列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {content.musicPlaylist.map((song, index) => (
          <div 
            key={index}
            className="bg-gradient-to-r from-red-100/60 to-pink-100/40 backdrop-blur-md rounded-xl p-4 border border-red-200/50 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400/40 to-pink-400/40 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{song.title}</div>
                <div className="text-sm text-gray-600 truncate">{song.artist}</div>
                {song.mood && (
                  <div className="text-xs text-gray-500 mt-1">心情: {song.mood}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MusicApp
