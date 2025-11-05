/**
 * 情侣空间快捷菜单
 */

interface CoupleSpaceQuickMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectPhoto: () => void
  onSelectMessage: () => void
  onSelectAnniversary: () => void
}

const CoupleSpaceQuickMenu = ({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectMessage,
  onSelectAnniversary
}: CoupleSpaceQuickMenuProps) => {
  if (!isOpen) return null

  const menuItems = [
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '相册',
      description: '分享照片到相册',
      onClick: onSelectPhoto
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: '留言',
      description: '发送留言到留言板',
      onClick: onSelectMessage
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '纪念日',
      description: '添加重要纪念日',
      onClick: onSelectAnniversary
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-xs glass-card rounded-3xl p-6 shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">情侣空间</h3>
        
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/30 hover:scale-[0.98] active:scale-[0.95] transition-all"
            >
              <div className="text-gray-700">{item.icon}</div>
              <div className="flex-1 text-left">
                <div className="text-base font-semibold text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{item.description}</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl glass-card border border-white/30 text-gray-700 font-medium hover:scale-[0.98] active:scale-[0.95] transition-all"
        >
          取消
        </button>
      </div>
    </div>
  )
}

export default CoupleSpaceQuickMenu
