import React from 'react'
import { AppItem } from './AppGrid'

interface DesktopPageProps {
  children: React.ReactNode
  className?: string
}

const DesktopPage: React.FC<DesktopPageProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-w-full h-full px-4 overflow-y-auto flex flex-col hide-scrollbar ${className}`}>
      {children}
    </div>
  )
}

export default DesktopPage
