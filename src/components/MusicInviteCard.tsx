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
    onAccept?.()
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
    <div className="w-52 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-3">
        {/* 横向布局：封面 + 信息 */}
        <div className="flex gap-3">
          {/* 专辑封面 - 缩小 */}
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(0,0,0,0.05)' }}>
            {songCover ? (
              <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-40">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* 歌曲信息 */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-sm truncate">{songTitle}</h3>
            <p className="text-xs opacity-60 truncate">{songArtist}</p>
            <p className="text-xs opacity-50 mt-1">
              {isSent ? `${inviterName} 正在等待...` : `${inviterName} 邀请你一起听`}
            </p>
          </div>
        </div>

        {/* 操作区域 */}
        {currentStatus === 'pending' && !isSent && (
          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleReject}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium opacity-60 hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.05)' }}
            >
              拒绝
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white bg-black hover:opacity-80 transition-opacity"
            >
              接受
            </button>
          </div>
        )}

        {currentStatus === 'pending' && isSent && (
          <div className="flex items-center justify-center gap-2 text-xs opacity-50 mt-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            等待中...
          </div>
        )}

        {currentStatus === 'accepted' && (
          <div className="mt-2 text-xs font-medium flex items-center justify-center gap-1 opacity-70">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            已连接
          </div>
        )}

        {currentStatus === 'rejected' && (
          <div className="mt-2 text-xs font-medium text-center opacity-50">已拒绝</div>
        )}
      </div>
    </div>
  )
}

export default MusicInviteCard
