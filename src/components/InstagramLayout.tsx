import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react'
import StatusBar from './StatusBar'

interface InstagramLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  headerTitle?: string
  showTabBar?: boolean
}

const InstagramLayout = ({ 
  children, 
  showHeader = true, 
  headerTitle = 'Forum',
  showTabBar = true 
}: InstagramLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { icon: Home, path: '/instagram', label: '主页' },
    { icon: Search, path: '/instagram/search', label: '搜索' },
    { icon: PlusSquare, path: '/instagram/create', label: '发布' },
    { icon: Heart, path: '/instagram/activity', label: '活动' },
    { icon: User, path: '/instagram/profile', label: '我' }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="h-screen flex flex-col bg-white" data-instagram>
      {/* 顶部标题栏（包含状态栏） */}
      {showHeader && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <StatusBar />
          <div className="px-4 pb-4 flex items-center justify-between">
            <button 
              onClick={() => {
                // 如果在主页，返回桌面；否则返回上一页
                if (location.pathname === '/instagram') {
                  navigate('/')
                } else {
                  navigate(-1)
                }
              }}
              className="w-11 h-11 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {headerTitle}
            </h1>
            <div className="w-11" />
          </div>
        </div>
      )}

      {/* 可滚动的内容区域 */}
      <div className={`flex-1 overflow-y-auto ${showTabBar ? 'pb-16' : ''}`}>
        {children}
      </div>

      {/* 底部Tab导航 */}
      {showTabBar && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100">
          <div className="flex items-center justify-around py-2">
            {tabs.map(({ icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="p-2 active:opacity-60 transition-opacity"
              >
                <Icon 
                  className={`w-6 h-6 ${
                    isActive(path) ? 'text-black' : 'text-gray-400'
                  }`}
                  fill={isActive(path) ? 'currentColor' : 'none'}
                  strokeWidth={isActive(path) ? 0 : 2}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InstagramLayout
