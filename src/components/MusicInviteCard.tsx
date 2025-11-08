import { useState, useEffect } from 'react'

interface MusicInviteCardProps {
  inviterName: string
  songTitle: string
  songArtist: string
  songCover?: string
  onAccept?: () => void
  onReject?: () => void
  status?: 'pending' | 'accepted' | 'rejected'
  isSent?: boolean // 是否是用户发送的邀请
}

const MusicInviteCard = ({
  inviterName,
  songTitle,
  songArtist,
  songCover,
  onAccept,
  onReject,
  status = 'pending',
  isSent = false
}: MusicInviteCardProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)

  // 同步外部status prop的变化
  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const handleAccept = () => {
    console.log('🎵 MusicInviteCard: 用户点击接受')
    // 先调用回调，让父组件处理跳转等逻辑
    onAccept?.()
    // 延迟更新状态，确保跳转先执行
    setTimeout(() => {
      setCurrentStatus('accepted')
    }, 100)
  }

  const handleReject = () => {
    console.log('🎵 MusicInviteCard: 用户点击拒绝')
    setCurrentStatus('rejected')
    onReject?.()
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-lg shadow-md overflow-hidden max-w-[220px] border border-white/20">
      {/* 卡片头部 */}
      <div className="bg-white/60 backdrop-blur-md px-3 py-2 flex items-center gap-1.5 border-b border-gray-100/50">
        <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <span className="text-gray-800 font-medium text-xs">一起听邀请</span>
      </div>

      {/* 卡片内容 */}
      <div className="p-3">
        {/* 邀请信息 */}
        <div className="text-xs text-gray-700 mb-2">
          <span className="font-medium text-gray-900">{inviterName}</span> 邀请你一起听歌
        </div>

        {/* 歌曲信息 */}
        <div className="flex items-center gap-2 mb-3 bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-gray-100/50">
          {/* 封面 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {songCover ? (
              <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>

          {/* 歌曲详情 */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">{songTitle}</div>
            <div className="text-[10px] text-gray-500 truncate">{songArtist}</div>
          </div>

          {/* 音乐波纹动画 */}
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
        </div>

        {/* 按钮区域 */}
        {currentStatus === 'pending' && (
          isSent ? (
            // 用户发送的邀请 - 显示等待状态
            <div className="text-center py-1.5 text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              等待对方接受...
            </div>
          ) : (
            // 接收到的邀请 - 显示按钮
            <div className="flex gap-1.5">
              <button
                onClick={handleReject}
                className="flex-1 px-3 py-1.5 bg-white/50 backdrop-blur-sm text-gray-700 rounded-full text-xs font-medium ios-button hover:bg-white/70 transition-all border border-gray-200/50"
              >
                拒绝
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-3 py-1.5 bg-white backdrop-blur-xl text-gray-900 rounded-full text-xs font-medium ios-button shadow-md hover:shadow-lg transition-all border border-gray-300/50"
              >
                接受
              </button>
            </div>
          )
        )}

        {currentStatus === 'accepted' && (
          <div className="text-center py-1.5 text-xs text-green-600 font-medium flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            已接受邀请
          </div>
        )}

        {currentStatus === 'rejected' && (
          <div className="text-center py-1.5 text-xs text-gray-500 font-medium">
            已拒绝
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicInviteCard
