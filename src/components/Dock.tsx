import React from 'react'
import { AppItem } from './AppGrid'

interface DockProps {
  apps: AppItem[]
  onAppClick: (e: React.MouseEvent, app: AppItem) => void
}

const Dock: React.FC<DockProps> = ({ apps, onAppClick }) => {
  return (
    <div className="pb-6 px-4">
      <div className="glass-effect rounded-3xl p-3 shadow-xl border border-white/30">
        <div className="grid grid-cols-3 gap-3">
          {apps.map((app) => {
            const isImageIcon = typeof app.icon === 'string'
            return (
              <div
                key={app.id}
                onClick={(e) => onAppClick(e, app)}
                className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
              >
                {isImageIcon ? (
                  <div className="w-14 h-14">
                    <img 
                      src={app.icon as string} 
                      alt={app.name} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                    {React.createElement(app.icon as React.ComponentType<any>, { 
                      size: 28, 
                      className: "text-gray-300" 
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dock
