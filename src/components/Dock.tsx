import React from 'react'
import { AppItem } from './AppGrid'

interface DockProps {
  apps: AppItem[]
  onAppClick: (e: React.MouseEvent, app: AppItem) => void
}

const Dock: React.FC<DockProps> = ({ apps, onAppClick }) => {
  return (
    <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
      <div 
        className="rounded-3xl p-3"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
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
