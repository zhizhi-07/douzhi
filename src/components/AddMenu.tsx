/**
 * 添加菜单组件（+号菜单）
 */

import { playSystemSound } from '../utils/soundManager'

interface MenuItem {
  icon: JSX.Element
  label: string
  onClick: () => void
  iconId: string
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
  onSelectPaymentRequest: () => void
  onSelectShopping: () => void
  onSelectPost: () => void
  onSelectFormatCorrector: () => void
  customIcons?: Record<string, string>
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
  onSelectPaymentRequest,
  onSelectShopping,
  onSelectPost,
  onSelectFormatCorrector,
  customIcons = {}
}: AddMenuProps) => {
  if (!isOpen) return null

  // 调试：查看传入的自定义图标
  console.log('AddMenu收到的customIcons:', Object.keys(customIcons).length, '个')

  const menuItems: MenuItem[] = [
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      label: '重回',
      onClick: onSelectRecall,
      iconId: 'menu-recall'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      label: '相册',
      onClick: onSelectImage,
      iconId: 'menu-photo'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: '拍照',
      onClick: onSelectCamera,
      iconId: 'menu-camera'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      label: '转账',
      onClick: onSelectTransfer,
      iconId: 'menu-transfer'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      label: '亲密付',
      onClick: onSelectIntimatePay,
      iconId: 'menu-pay'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      label: '外卖',
      onClick: onSelectPaymentRequest,
      iconId: 'menu-food'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: '位置',
      onClick: onSelectLocation,
      iconId: 'menu-location'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
      label: '语音',
      onClick: onSelectVoice,
      iconId: 'menu-voice'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
      label: '视频通话',
      onClick: onSelectVideoCall,
      iconId: 'menu-video'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
      label: '音乐',
      onClick: onSelectMusicInvite,
      iconId: 'menu-music'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      label: '随笔',
      onClick: onSelectAIMemo,
      iconId: 'menu-memo'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      label: '线下',
      onClick: onSelectOffline,
      iconId: 'menu-offline'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
      label: '网购',
      onClick: onSelectShopping,
      iconId: 'menu-shop'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
      label: '帖子',
      onClick: onSelectPost,
      iconId: 'menu-post'
    },
    { 
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: '修正',
      onClick: onSelectFormatCorrector,
      iconId: 'menu-fix'
    },
  ]

  // 情侣空间选项 - 始终显示
  menuItems.push({ 
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    label: '情侣空间',
    onClick: onSelectCoupleSpaceInvite,
    iconId: 'menu-couple'
  })

  return (
    <>
      {/* 遮罩层 - 液态玻璃效果 + 淡入动画 */}
      <div
        className="fixed inset-0 glass-dark z-40 modal-overlay-enter"
        onClick={() => {
          playSystemSound() // 🎵 统一使用通用点击音效
          onClose()
        }}
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

        {/* 菜单项网格 - 瀑布流动画 + 可滚动 */}
        <div className="grid grid-cols-4 gap-3 p-4 pb-6 max-h-[50vh] overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                playSystemSound() // 🎵 统一使用通用点击音效
                item.onClick()
                onClose()
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/50 active:bg-white/70 transition-all btn-press-fast menu-item-enter"
              style={{
                animationDelay: `${index * 0.03}s`,
                willChange: 'transform, opacity'
              }}
            >
              <div className="text-gray-600 transform group-active:scale-95 transition-transform">
                {customIcons[item.iconId] ? (
                  <img src={customIcons[item.iconId]} alt={item.label} className="w-12 h-12 object-contain" />
                ) : (
                  item.icon
                )}
              </div>
              <span className="text-xs text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default AddMenu
