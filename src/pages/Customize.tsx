/**
 * 系统设置页面
 * 包含美化设置、数据管理等功能
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { playSystemSound } from '../utils/soundManager'

const Customize = () => {
  const navigate = useNavigate()
  const [showStatusBar, setShowStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

  // 设置项列表
  const settingItems: Array<{
    id: string
    name: string
    description: string
    route: string
    badge?: string
  }> = [
    {
      id: 'voice',
      name: '语音设置',
      description: '配置MiniMax等语音API',
      route: '/voice-settings',
      badge: 'NEW'
    },
    {
      id: 'statusbar',
      name: '状态栏设置',
      description: '自定义状态栏样式和专注模式',
      route: '/statusbar-customize'
    },
    {
      id: 'font',
      name: '字体设置',
      description: '自定义字体样式',
      route: '/font-customizer'
    },
    {
      id: 'sound',
      name: '系统声音',
      description: '点击音效和提示音',
      route: '/sound-customizer'
    },
    {
      id: 'data',
      name: '数据管理',
      description: '导出、导入、清除数据',
      route: '/data-manager'
    }
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* 状态栏 + 导航栏一体 */}
      <div className="glass-effect border-b border-gray-200/50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/', { replace: true })
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">系统设置</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {settingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.route) {
                  playSystemSound()
                  navigate(item.route)
                }
              }}
              className="glass-card rounded-xl p-4 cursor-pointer shadow-[0_2px_12px_rgba(148,163,184,0.1)] hover:shadow-[0_4px_16px_rgba(148,163,184,0.15)] transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-700">{item.name}</h3>
                    {item.badge && (
                      <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <svg 
                  className="w-5 h-5 text-slate-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500 text-center">
          自定义你的专属界面风格
        </p>
      </div>
    </div>
  )
}

export default Customize
