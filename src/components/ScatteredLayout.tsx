import React, { useMemo } from 'react'
import { AppItem } from './AppGrid'
import { getCustomIcon } from '../utils/iconManager'

interface ScatteredLayoutProps {
  apps: AppItem[]
  onAppClick: (e: React.MouseEvent, app: AppItem) => void
  iconRefresh: number
}

interface Position {
  top: string
  left: string
}

const ScatteredLayout: React.FC<ScatteredLayoutProps> = ({ apps, onAppClick, iconRefresh }) => {
  // 生成固定的随机位置（基于app.id，确保每次渲染位置一致）
  const positions = useMemo(() => {
    const generatePosition = (index: number, total: number): Position => {
      // 使用固定的种子算法，确保相同的index总是得到相同的位置
      const seed = index * 2654435761 // 使用质数作为种子
      const random1 = ((seed % 1000) / 1000)
      const random2 = (((seed * 7) % 1000) / 1000)
      
      // 分区布局：将屏幕分为多个区域，避免图标重叠
      const cols = 3
      const rows = Math.ceil(total / cols)
      const col = index % cols
      const row = Math.floor(index / rows)
      
      // 在每个区域内随机偏移
      const baseLeft = (col / cols) * 100
      const baseTop = (row / rows) * 100
      
      const offsetLeft = random1 * (100 / cols) * 0.8 // 80%的区域宽度
      const offsetTop = random2 * (100 / rows) * 0.8 // 80%的区域高度
      
      return {
        left: `${Math.min(85, baseLeft + offsetLeft)}%`,
        top: `${Math.min(85, baseTop + offsetTop)}%`
      }
    }
    
    return apps.map((_, index) => generatePosition(index, apps.length))
  }, [apps.length]) // 只依赖apps数量，位置保持稳定

  return (
    <div className="relative w-full h-full">
      {apps.map((app, index) => {
        const isImageIcon = typeof app.icon === 'string'
        const customIcon = getCustomIcon(app.id)
        const position = positions[index]
        
        return (
          <div
            key={`${app.id}-${iconRefresh}`}
            onClick={(e) => onAppClick(e, app)}
            className="absolute flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-300 hover:scale-105"
            style={{
              top: position.top,
              left: position.left,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* 图标容器 - 液态玻璃风格 */}
            {customIcon ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/30">
                <img src={customIcon} alt={app.name} className="w-full h-full object-cover" />
              </div>
            ) : isImageIcon ? (
              <div className="w-14 h-14 flex items-center justify-center">
                <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div 
                className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {React.createElement(app.icon as React.ComponentType<any>, { 
                  className: "w-7 h-7 text-gray-300" 
                })}
              </div>
            )}
            
            {/* 应用名称 */}
            <span 
              className="text-xs text-gray-700 text-center font-medium px-2 py-1 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {app.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default ScatteredLayout
