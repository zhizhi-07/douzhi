import { useState } from 'react'
import { useMusicPlayer } from '../context/MusicPlayerContext'

interface MusicInviteSelectorProps {
  onClose: () => void
  onSend: (songTitle: string, songArtist: string, songCover?: string) => void
}

const MusicInviteSelector = ({ onClose, onSend }: MusicInviteSelectorProps) => {
  const { playlist } = useMusicPlayer()
  const [selectedTab, setSelectedTab] = useState<'library' | 'input'>('library')
  const [customTitle, setCustomTitle] = useState('')
  const [customArtist, setCustomArtist] = useState('')
  const [sending, setSending] = useState(false)

  const handleSelectFromLibrary = (e: React.MouseEvent, song: any) => {
    console.log('🎵 handleSelectFromLibrary被调用, sending状态:', sending)
    e.stopPropagation()
    if (sending) {
      console.log('🚫 已经在发送中，忽略')
      return
    }
    setSending(true)
    console.log('🎵 调用onSend:', song.title)
    onSend(song.title, song.artist, song.cover)
    onClose()
  }

  const handleSendCustom = () => {
    if (!customTitle.trim() || !customArtist.trim()) {
      alert('请输入歌曲名和歌手')
      return
    }
    onSend(customTitle.trim(), customArtist.trim())
    onClose()
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />

      {/* 选择器内容 */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* 顶部指示条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 标题 */}
        <div className="px-6 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">邀请一起听歌</h3>
          <p className="text-xs text-gray-500 mt-1">选择一首歌曲发送邀请</p>
        </div>

        {/* 选项卡 */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setSelectedTab('library')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'library'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            我的音乐库 ({playlist.length})
          </button>
          <button
            onClick={() => setSelectedTab('input')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'input'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            手动输入
          </button>
        </div>

        {/* 内容区域 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {selectedTab === 'library' ? (
            /* 音乐库列表 */
            <div className="px-4 py-2">
              {playlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎵</div>
                  <p className="text-gray-500 text-sm">音乐库为空</p>
                  <p className="text-gray-400 text-xs mt-1">请先上传歌曲或切换到手动输入</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {playlist.map((song) => (
                    <button
                      key={song.id}
                      onClick={(e) => handleSelectFromLibrary(e, song)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors ios-button"
                    >
                      {/* 封面 */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        {song.cover ? (
                          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* 歌曲信息 */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 truncate">{song.title}</div>
                        <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                      </div>

                      {/* 选择指示 */}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 手动输入表单 */
            <div className="px-6 py-6">
              <div className="space-y-4">
                {/* 歌曲名输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    歌曲名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="例如：晴天"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 歌手输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    歌手 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="例如：周杰伦"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 提示文字 */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      手动输入的歌曲会尝试从音乐库中匹配播放，如果找不到则使用默认封面
                    </p>
                  </div>
                </div>

                {/* 发送按钮 */}
                <button
                  onClick={handleSendCustom}
                  disabled={!customTitle.trim() || !customArtist.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium ios-button shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送邀请
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部安全区域 */}
        <div className="h-safe" />
      </div>
    </>
  )
}

export default MusicInviteSelector
