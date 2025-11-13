/**
 * 底部导航栏组件
 * 微信风格的底部导航，带动画和音效
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { playSystemSound } from '../utils/soundManager'
import { useState } from 'react'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.pathname)

  const handleNavClick = (path: string) => {
    playSystemSound() // 🎵 播放点击音效
    setActiveTab(path)
    navigate(path)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  return (
    <div className="pb-3 px-4">
      <div className="glass-card rounded-[48px] shadow-lg">
        <div className="grid grid-cols-4 h-14 px-2">
          {/* 微信 */}
          <button 
            onClick={() => handleNavClick('/wechat')} 
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/wechat') ? 'text-green-600' : 'text-gray-500'
            } btn-press-fast`}
          >
            <svg 
              className={`w-6 h-6 mb-0.5 transition-transform ${
                isActive('/wechat') ? 'nav-icon-active' : ''
              }`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className={`text-xs ${isActive('/wechat') ? 'font-medium' : ''}`}>微信</span>
          </button>

          {/* 通讯录 */}
          <button 
            onClick={() => handleNavClick('/contacts')} 
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/contacts') ? 'text-green-600' : 'text-gray-500'
            } btn-press-fast`}
          >
            <svg 
              className={`w-6 h-6 mb-0.5 transition-transform ${
                isActive('/contacts') ? 'nav-icon-active' : ''
              }`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span className={`text-xs ${isActive('/contacts') ? 'font-medium' : ''}`}>通讯录</span>
          </button>

          {/* 发现 */}
          <button 
            onClick={() => handleNavClick('/discover')} 
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/discover') ? 'text-green-600' : 'text-gray-500'
            } btn-press-fast`}
          >
            <svg 
              className={`w-6 h-6 mb-0.5 transition-transform ${
                isActive('/discover') ? 'nav-icon-active' : ''
              }`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"/>
            </svg>
            <span className={`text-xs ${isActive('/discover') ? 'font-medium' : ''}`}>发现</span>
          </button>

          {/* 我 */}
          <button 
            onClick={() => handleNavClick('/me')} 
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/me') ? 'text-green-600' : 'text-gray-500'
            } btn-press-fast`}
          >
            <svg 
              className={`w-6 h-6 mb-0.5 transition-transform ${
                isActive('/me') ? 'nav-icon-active' : ''
              }`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className={`text-xs ${isActive('/me') ? 'font-medium' : ''}`}>我</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BottomNav

