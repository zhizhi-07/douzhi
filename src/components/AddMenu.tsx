/**
 * 添加菜单组件（+号菜单）
 */

interface MenuItem {
  icon: JSX.Element
  label: string
  onClick: () => void
}

interface AddMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectRecall: () => void
  onSelectImage: () => void
  onSelectCamera: () => void
  onSelectTransfer: () => void
  onSelectIntimatePay: () => void
  onSelectCoupleSpaceInvite: () => void
  onSelectLocation: () => void
  onSelectVoice: () => void
  onSelectVideoCall: () => void
  onSelectMusicInvite: () => void
  onSelectAIMemo: () => void
  onSelectOffline: () => void
  hasCoupleSpaceActive?: boolean
}

const AddMenu = ({
  isOpen,
  onClose,
  onSelectRecall,
  onSelectImage,
  onSelectCamera,
  onSelectTransfer,
  onSelectIntimatePay,
  onSelectCoupleSpaceInvite,
  onSelectLocation,
  onSelectVoice,
  onSelectVideoCall,
  onSelectMusicInvite,
  onSelectAIMemo,
  onSelectOffline,
  hasCoupleSpaceActive = false
}: AddMenuProps) => {
  if (!isOpen) return null

  const menuItems: MenuItem[] = [
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      label: '重回',
      onClick: onSelectRecall
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      label: '相册',
      onClick: onSelectImage
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: '拍照',
      onClick: onSelectCamera
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      label: '转账',
      onClick: onSelectTransfer
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      label: '亲密付',
      onClick: onSelectIntimatePay
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: '位置',
      onClick: onSelectLocation
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
      label: '语音',
      onClick: onSelectVoice
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
      label: '视频通话',
      onClick: onSelectVideoCall
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
      label: '一起听',
      onClick: onSelectMusicInvite
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      label: '随笔',
      onClick: onSelectAIMemo
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      label: '线下',
      onClick: onSelectOffline
    },
  ]

  // 如果情侣空间未激活，添加邀请选项
  if (!hasCoupleSpaceActive) {
    menuItems.push({ 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      label: '情侣空间',
      onClick: onSelectCoupleSpaceInvite
    })
  }

  return (
    <>
      {/* 遮罩层 - 液态玻璃效果 + 淡入动画 */}
      <div
        className="fixed inset-0 glass-dark z-40 modal-overlay-enter"
        onClick={onClose}
        style={{
          willChange: 'opacity',
          transform: 'translateZ(0)' // 🚀 GPU加速
        }}
      />

      {/* 菜单面板 - 从底部滑入 */}
      <div
        className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl z-50 modal-slide-up pb-safe"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)' // 🚀 GPU加速
        }}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 菜单标题 */}
        <div className="px-5 py-3 border-b border-gray-200/50">
          <h3 className="text-base font-medium text-gray-800">选择功能</h3>
        </div>

        {/* 菜单项网格 - 瀑布流动画 */}
        <div className="grid grid-cols-4 gap-3 p-4 pb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/50 active:bg-white/70 transition-all btn-press-fast menu-item-enter"
              style={{
                animationDelay: `${index * 0.03}s`,
                willChange: 'transform, opacity'
              }}
            >
              <div className="text-gray-700">{item.icon}</div>
              <span className="text-xs text-gray-600 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default AddMenu
