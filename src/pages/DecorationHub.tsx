/**
 * 美化主入口页面
 * 包含音乐盘装饰和全局美化分组
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { playSystemSound } from '../utils/soundManager'

const DecorationHub = () => {
  const navigate = useNavigate()
  
  // 隐藏消息时间戳设置
  const [hideTimestamp, setHideTimestamp] = useState(() => {
    return localStorage.getItem('hide_message_timestamp') === 'true'
  })

  // 美化分组列表
  const groups = [
    {
      title: '界面装饰',
      enTitle: 'INTERFACE DECORATION',
      items: [
        {
          id: 'music',
          name: '音乐盒装饰',
          enName: 'Music Player',
          description: '播放器装饰框和颜色',
          route: '/decoration/music',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )
        },
        {
          id: 'global',
          name: '全局美化',
          enName: 'Global Decoration',
          description: '底栏、顶栏、聊天图标等',
          route: '/decoration/global',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          )
        }
      ]
    },
    {
      title: '颜色主题',
      enTitle: 'COLOR THEME',
      items: [
        {
          id: 'colors',
          name: '全局颜色',
          enName: 'Global Colors',
          description: '开关按钮和选中状态颜色',
          route: '/decoration/colors',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          )
        },
        {
          id: 'background',
          name: '背景设置',
          enName: 'Background',
          description: '桌面、微信、随笔等背景',
          route: '/background-customizer',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">

      <StatusBar />

      {/* 顶部导航栏 - 玻璃态 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSystemSound()
              navigate('/', { replace: true })
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">主题美化</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">THEME DECORATION</p>
          </div>
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* 快捷设置 */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3 px-1">
              <h2 className="text-sm font-medium text-slate-400 tracking-wider uppercase">QUICK SETTINGS</h2>
              <span className="text-xs text-slate-300 font-light">快捷设置</span>
            </div>
            
            {/* 隐藏时间戳开关 */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-slate-800 tracking-wide">隐藏消息时间</h3>
                    <p className="text-xs text-slate-500 font-light mt-0.5">隐藏每条消息气泡下方的时间戳</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playSystemSound()
                    const newValue = !hideTimestamp
                    setHideTimestamp(newValue)
                    localStorage.setItem('hide_message_timestamp', newValue.toString())
                    window.dispatchEvent(new Event('timestampVisibilityUpdate'))
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                    hideTimestamp ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    hideTimestamp ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              {/* 分组标题 */}
              <div className="flex items-baseline gap-3 px-1">
                <h2 className="text-sm font-medium text-slate-400 tracking-wider uppercase">{group.enTitle}</h2>
                <span className="text-xs text-slate-300 font-light">{group.title}</span>
              </div>

              {/* 卡片列表 */}
              <div className="grid grid-cols-1 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      playSystemSound()
                      navigate(item.route)
                    }}
                    className="group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300
                      bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md hover:bg-white/60"
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 图标容器 */}
                        <div className={`w-10 h-10 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shadow-sm`}>
                          {item.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-medium text-slate-800 tracking-wide">
                              {item.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 font-light mt-0.5 tracking-wide">
                            {item.enName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-light hidden sm:block">
                          {item.description}
                        </span>
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/30 text-slate-400 group-hover:bg-white/80 group-hover:text-slate-600 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default DecorationHub
