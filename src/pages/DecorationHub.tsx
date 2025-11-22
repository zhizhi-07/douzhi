/**
 * 美化主入口页面
 * 包含音乐盘装饰和全局美化分组
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { playSystemSound } from '../utils/soundManager'

const DecorationHub = () => {
  const navigate = useNavigate()

  // 美化分组列表
  const decorationGroups = [
    {
      id: 'music',
      title: '音乐盒装饰',
      description: '自定义音乐播放器装饰框和颜色',
      icon: (
        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      route: '/decoration/music'
    },
    {
      id: 'global',
      title: '全局美化',
      description: '微信底栏、顶栏、聊天图标等全局美化',
      icon: (
        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      route: '/decoration/global'
    },
    {
      id: 'colors',
      title: '全局颜色',
      description: '自定义开关按钮和选中状态的颜色',
      icon: (
        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      route: '/decoration/colors'
    },
    {
      id: 'background',
      title: '背景设置',
      description: '自定义桌面、微信、随笔等界面背景',
      icon: (
        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      route: '/background-customizer'
    }
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 状态栏 + 导航栏 */}
      <div className="bg-white">
        <StatusBar />
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => {
              playSystemSound()
              navigate('/', { replace: true })
            }}
            className="p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="flex-1 text-center text-base font-medium text-gray-900">美化</h1>
          
          <div className="w-9"></div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* 美化设置卡片 */}
        <div className="glass-card rounded-[48px] overflow-hidden">
          {decorationGroups.map((group, index) => (
            <button
              key={group.id}
              onClick={() => {
                playSystemSound()
                navigate(group.route)
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors ${
                index !== decorationGroups.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 图标 */}
              <div className="w-14 h-14 rounded-[24px] bg-white flex items-center justify-center text-2xl flex-shrink-0">
                {group.icon}
              </div>
              
              {/* 文字区域 */}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">{group.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{group.description}</div>
              </div>
              
              {/* 箭头 */}
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DecorationHub
