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

  // 设置项分组
  const groups = [
    {
      title: '视觉外观',
      enTitle: 'VISUAL APPEARANCE',
      items: [
        {
          id: 'statusbar',
          name: '状态栏',
          enName: 'Status Bar',
          description: '自定义顶部状态栏样式',
          route: '/statusbar-customize',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ),
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          id: 'font',
          name: '字体排印',
          enName: 'Typography',
          description: '调整系统字体与阅读体验',
          route: '/font-customizer',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          ),
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50'
        },
        {
          id: 'screen',
          name: '屏幕显示',
          enName: 'Display',
          description: '边框与显示区域调整',
          route: '/screen-settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50'
        }
      ]
    },
    {
      title: '听觉体验',
      enTitle: 'AUDITORY EXPERIENCE',
      items: [
        {
          id: 'voice',
          name: '语音合成',
          enName: 'Voice Synthesis',
          description: '配置 AI 语音生成模型',
          route: '/voice-settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ),
          color: 'text-rose-600',
          bgColor: 'bg-rose-50'
        },
        {
          id: 'sound',
          name: '系统音效',
          enName: 'System Sound',
          description: '交互反馈与提示音',
          route: '/sound-customizer',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ),
          color: 'text-amber-600',
          bgColor: 'bg-amber-50'
        }
      ]
    },
    {
      title: '数据管理',
      enTitle: 'DATA MANAGEMENT',
      items: [
        {
          id: 'data',
          name: '存储维护',
          enName: 'Storage',
          description: '备份、恢复与清理',
          route: '/data-manager',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          ),
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50'
        }
      ]
    },
    {
      title: '账号管理',
      enTitle: 'ACCOUNT MANAGEMENT',
      items: [
        {
          id: 'cloud-account',
          name: '云端账号',
          enName: 'Cloud Account',
          description: '登录状态与云端数据',
          route: '/cloud-account',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          ),
          color: 'text-sky-600',
          bgColor: 'bg-sky-50'
        }
      ]
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">

      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 - 玻璃态 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">系统设置</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">CUSTOMIZATION</p>
          </div>
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-8">

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
                      if (item.route) {
                        playSystemSound()
                        navigate(item.route)
                      }
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

export default Customize
