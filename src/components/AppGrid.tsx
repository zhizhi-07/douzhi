import React from 'react'
import AppIcon from './AppIcon'

export interface AppItem {
  id: string
  name: string
  icon: React.ComponentType<any> | string
  color: string
  route?: string
  onClick?: () => void
}

interface AppGridProps {
  apps: AppItem[]
  largeAppId?: string // 指定哪个应用显示为大图标
  onAppClick: (e: React.MouseEvent, app: AppItem) => void
}

const AppGrid: React.FC<AppGridProps> = ({ apps, largeAppId, onAppClick }) => {
  return (
    <div className="grid grid-cols-4 gap-4 auto-rows-min">
      {apps.map((app) => (
        <AppIcon
          key={app.id}
          id={app.id}
          name={app.name}
          icon={app.icon}
          color={app.color}
          size={app.id === largeAppId ? 'large' : 'normal'}
          onClick={(e) => onAppClick(e, app)}
        />
      ))}
    </div>
  )
}

export default AppGrid
