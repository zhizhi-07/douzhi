/**
 * 群聊添加菜单组件（+号菜单）
 * 群聊专用版本，只包含图片、语音、位置、转账等基础功能
 */

import { playSystemSound } from '../utils/soundManager'

interface MenuItem {
  icon: JSX.Element
  label: string
  onClick: () => void
  iconId: string
}

interface GroupAddMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: () => void
  onSelectCamera: () => void
  onSelectTransfer: () => void
  onSelectLocation: () => void
  onSelectVoice: () => void
  onSelectRedPacket?: () => void
  customIcons?: Record<string, string>
}

const GroupAddMenu = ({
  isOpen,
  onClose,
  onSelectImage,
  onSelectCamera,
  onSelectTransfer,
  onSelectLocation,
  onSelectVoice,
  onSelectRedPacket,
  customIcons = {}
}: GroupAddMenuProps) => {
  if (!isOpen) return null

  const menuItems: MenuItem[] = [
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
    ...(onSelectRedPacket ? [{
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      label: '红包',
      onClick: onSelectRedPacket,
      iconId: 'menu-red-packet'
    }] : [])
  ]

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 glass-dark z-40 modal-overlay-enter"
        onClick={() => {
          playSystemSound()
          onClose()
        }}
        style={{
          willChange: 'opacity',
          transform: 'translateZ(0)'
        }}
      />

      {/* 菜单面板 */}
      <div
        className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl z-50 modal-slide-up pb-safe"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)'
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

        {/* 菜单项网格 */}
        <div className="grid grid-cols-4 gap-3 p-4 pb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                playSystemSound()
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

export default GroupAddMenu
