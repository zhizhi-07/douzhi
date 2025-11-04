import React from 'react'

interface AppIconProps {
  id: string
  name: string
  icon: React.ComponentType<any> | string
  color: string
  size?: 'normal' | 'large'
  onClick: (e: React.MouseEvent) => void
}

const AppIcon: React.FC<AppIconProps> = ({ 
  id, 
  name, 
  icon, 
  color, 
  size = 'normal',
  onClick 
}) => {
  const isImageIcon = typeof icon === 'string'
  const isLarge = size === 'large'
  const iconSize = isLarge ? 64 : 28
  const containerSize = isLarge ? 'w-36 h-36' : 'w-14 h-14'

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform ${
        isLarge ? 'col-span-2 row-span-2' : ''
      }`}
    >
      {/* 图标容器 */}
      {isImageIcon ? (
        <div className={`${containerSize} flex items-center justify-center`}>
          <img 
            src={icon as string} 
            alt={name} 
            className="w-full h-full object-contain" 
          />
        </div>
      ) : (
        <div 
          className={`${containerSize} ${color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}
        >
          {React.createElement(icon as React.ComponentType<any>, { 
            size: iconSize, 
            className: "text-gray-300" 
          })}
        </div>
      )}
      
      {/* 应用名称 */}
      <span className="text-xs text-gray-700 text-center font-medium">
        {name}
      </span>
    </div>
  )
}

export default AppIcon
