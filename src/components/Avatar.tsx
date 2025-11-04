/**
 * 头像组件
 * 统一的头像显示组件，避免代码重复
 */

interface AvatarProps {
  type: 'sent' | 'received'
  avatar?: string
  name: string
}

const Avatar = ({ type, avatar, name }: AvatarProps) => {
  if (type === 'sent') {
    // 用户头像
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    )
  }

  // AI头像
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )}
    </div>
  )
}

export default Avatar
