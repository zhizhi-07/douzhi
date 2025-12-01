/**
 * 微信底部导航栏 - 共享组件
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAllUIIcons } from '../utils/iconStorage'

interface WechatTabBarProps {
  customIcons?: Record<string, string>
}

const WechatTabBar = ({ customIcons: propIcons }: WechatTabBarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})

  // 加载图标
  useEffect(() => {
    const loadIcons = async () => {
      const icons = await getAllUIIcons()
      setCustomIcons(icons)
    }
    loadIcons()
  }, [])

  // 当传入的 propIcons 变化时更新
  useEffect(() => {
    if (propIcons && Object.keys(propIcons).length > 0) {
      setCustomIcons(propIcons)
    }
  }, [propIcons])

  // 监听图标更新事件
  useEffect(() => {
    const handleIconsChange = async () => {
      const icons = await getAllUIIcons()
      setCustomIcons(icons)
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    window.addEventListener('storage', (e) => {
      if (e.key === 'ui_custom_icons') {
        handleIconsChange()
      }
    })
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
    }
  }, [])

  // 读取调整参数
  const bottombarScale = parseInt(localStorage.getItem('bottombar_scale') || '100')
  const bottombarX = parseInt(localStorage.getItem('bottombar_x') || '0')
  const bottombarY = parseInt(localStorage.getItem('bottombar_y') || '0')

  // 判断当前激活的标签
  const isActive = (path: string) => location.pathname === path

  const tabs = [
    { path: '/wechat', label: '微信', iconKey: 'nav-chat', icon: (
      <svg className="w-6 h-6 mb-1 stroke-[1.5]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    )},
    { path: '/contacts', label: '通讯录', iconKey: 'nav-contacts', icon: (
      <svg className="w-6 h-6 mb-1 stroke-[1.5]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z" />
      </svg>
    )},
    { path: '/discover', label: '发现', iconKey: 'nav-discover', icon: (
      <svg className="w-6 h-6 mb-1 stroke-[1.5]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    )},
    { path: '/me', label: '我', iconKey: 'nav-me', icon: (
      <svg className="w-6 h-6 mb-1 stroke-[1.5]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )}
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
      <div
        className="mx-4 mb-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg"
        style={customIcons['main-bottombar-bg'] ? {
          backgroundImage: `url(${customIcons['main-bottombar-bg']})`,
          backgroundSize: `${bottombarScale}%`,
          backgroundPosition: `calc(50% + ${bottombarX}px) calc(50% + ${bottombarY}px)`
        } : {}}
      >
        <div className="grid grid-cols-4 h-16 px-2 items-center">
          {tabs.map(tab => {
            const active = isActive(tab.path)
            return (
              <button
                key={tab.path}
                onClick={() => !active && navigate(tab.path)}
                className={`flex flex-col items-center justify-center active:scale-95 transition-transform ${
                  active ? 'text-[#2C2C2C]' : 'text-[#8C8C8C] hover:text-[#5A5A5A]'
                }`}
              >
                {customIcons[tab.iconKey] ? (
                  <img 
                    src={customIcons[tab.iconKey]} 
                    alt={tab.label} 
                    className={`w-6 h-6 mb-1 object-contain ${active ? '' : 'opacity-60 hover:opacity-100'}`}
                  />
                ) : (
                  tab.icon
                )}
                <span className={`text-[10px] ${active ? 'font-medium' : ''}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WechatTabBar
