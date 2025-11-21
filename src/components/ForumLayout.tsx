import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from './StatusBar'
import { getAllUIIcons } from '../utils/iconStorage'

interface ForumLayoutProps {
  children: React.ReactNode
}

const ForumLayout = ({ children }: ForumLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [iconRefresh, setIconRefresh] = useState(0)
  
  // 加载自定义图标
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        let icons = await getAllUIIcons()
        if (Object.keys(icons).length === 0) {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            icons = JSON.parse(saved)
            console.log('📦 ForumLayout: 从localStorage恢复图标')
          }
        }
        setCustomIcons(icons)
        console.log('✅ ForumLayout: 加载自定义图标:', Object.keys(icons).length, '个', icons)
      } catch (error) {
        console.error('❌ ForumLayout: 加载自定义图标失败:', error)
      }
    }
    
    loadCustomIcons()
    
    const handleIconsChange = () => {
      console.log('📡 ForumLayout: 收到图标更新事件，强制刷新')
      setIconRefresh(prev => prev + 1)
      loadCustomIcons()
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
    }
  }, [iconRefresh])
  
  // 根据当前路径确定活动标签
  const getActiveTab = () => {
    if (location.pathname === '/forum') return '推荐'
    if (location.pathname.startsWith('/forum/topics')) return '话题'
    if (location.pathname.startsWith('/forum/messages')) return '私信'
    if (location.pathname.startsWith('/forum/profile')) return '主页'
    return '推荐'
  }

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case '推荐':
        navigate('/forum')
        break
      case '话题':
        navigate('/forum/topics')
        break
      case '私信':
        navigate('/forum/messages')
        break
      case '主页':
        navigate('/forum/profile')
        break
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* 顶部固定区域：状态栏、导航、搜索、标签 */}
      <div className="sticky top-0 z-10 flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <StatusBar />
        
        {/* 导航栏 */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-black/5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {customIcons['chat-back'] ? (
              <img src={customIcons['chat-back']} alt="返回" className="w-5 h-5 object-cover" />
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800">论坛</h1>
          <div className="w-9" />
        </div>

        {/* 搜索栏 */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="搜索帖子、话题..." 
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 分类导航 */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-3">
            {['推荐', '话题', '私信', '主页'].map((item) => (
              <button
                key={item}
                onClick={() => handleTabClick(item)}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  getActiveTab() === item 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* 底部发帖按钮 */}
      <div className="fixed bottom-6 right-6">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-gray-700 font-medium text-lg shadow-lg border border-gray-200"
        >
          {customIcons['chat-add-btn'] ? (
            <img src={customIcons['chat-add-btn']} alt="发帖" className="w-6 h-6 object-cover" />
          ) : (
            '+'
          )}
        </button>
      </div>
    </div>
  )
}

export default ForumLayout
