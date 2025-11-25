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
    <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-4 flex flex-col items-center">
        
        {/* 顶部提示 */}
        <div className="text-[10px] text-gray-400 mb-3 font-medium tracking-wide uppercase">
          {isSent ? 'INVITATION SENT' : 'MUSIC INVITATION'}
        </div>

        {/* 专辑封面 */}
        <div className="relative w-32 h-32 mb-3 rounded-lg overflow-hidden shadow-md bg-gray-50">
            {songCover ? (
                <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                </div>
            )}
        </div>

        {/* 歌曲信息 */}
        <h3 className="text-gray-900 font-bold text-base truncate w-full text-center px-2 mb-0.5">
          {songTitle}
        </h3>
        <p className="text-gray-500 text-xs truncate w-full text-center px-4 mb-4">
          {songArtist}
        </p>

        {/* 邀请信息 */}
        <div className="text-xs text-gray-600 mb-4 bg-gray-50 px-3 py-1.5 rounded-full">
             <span className="font-semibold text-gray-900">{inviterName}</span>
             <span> {isSent ? '正在等待...' : '邀请你一起听'}</span>
        </div>

        {/* 操作区域 */}
        <div className="w-full">
            {currentStatus === 'pending' && (
                isSent ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
                        <div className="w-3 h-3 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                        等待加入...
                    </div>
                ) : (
                    <div className="flex gap-2 w-full px-1">
                        <button 
                            onClick={handleReject}
                            className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                            拒绝
                        </button>
                        <button 
                            onClick={handleAccept}
                            className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-black hover:opacity-80 transition-opacity"
                        >
                            接受
                        </button>
                    </div>
                )
            )}

            {currentStatus === 'accepted' && (
                <div className="w-full py-2 text-green-600 text-xs font-medium flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    连接成功
                </div>
            )}

            {currentStatus === 'rejected' && (
                <div className="w-full py-2 text-gray-400 text-xs font-medium text-center">
                    已拒绝
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default MusicInviteCard
