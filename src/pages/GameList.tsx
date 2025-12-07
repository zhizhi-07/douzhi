/**
 * 小游戏列表 - 沉浸式设计
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

interface GameItem {
  id: string
  name: string
  icon: string
  description: string
  path: string
  bgImage: string
  tags: string[]
  playerCount: string
  comingSoon?: boolean
}

const GameList = () => {
  const navigate = useNavigate()

  const games: GameItem[] = [
    {
      id: 'werewolf',
      name: '狼人杀',
      icon: '🐺',
      description: '暗黑哥特风，沉浸式体验。天黑请闭眼...',
      path: '/werewolf',
      bgImage: 'linear-gradient(135deg, #2C3E50 0%, #000000 100%)',
      tags: ['推理', '角色扮演', '语音'],
      playerCount: '6人'
    },
    {
      id: 'landlord',
      name: '斗地主',
      icon: '🃏',
      description: '三人对战，智勇双全。与AI角色一决高下！',
      path: '/landlord',
      bgImage: 'linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)',
      tags: ['策略', '卡牌', '多人'],
      playerCount: '3人'
    },
    {
      id: 'poker',
      name: '德州扑克',
      icon: '🎰',
      description: '心理博弈，胆识过人。体验拉斯维加斯的刺激。',
      path: '/poker',
      bgImage: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      tags: ['博弈', '竞技'],
      playerCount: '2-8人',
      comingSoon: true
    },
    {
      id: 'blackjack',
      name: '21点',
      icon: '🎴',
      description: '运筹帷幄，决胜千里。最经典的赌场游戏。',
      path: '/blackjack',
      bgImage: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
      tags: ['休闲', '运气'],
      playerCount: '2人',
      comingSoon: true
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f7] text-gray-900 font-sans">
      {/* 顶部栏 - 极简白底黑字 */}
      <div className="bg-white shadow-sm z-10">
        <StatusBar theme="light" />
        <div className="flex items-center justify-between px-5 py-3">
          <button 
            onClick={() => navigate('/discover')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">游戏大厅</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* 内容区域 - 干净的列表 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">热门游戏</h2>
          <p className="text-gray-500 text-xs">今日在线人数：12,302</p>
        </div>

        <div className="grid gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => !game.comingSoon && navigate(game.path)}
              disabled={game.comingSoon}
              className="w-full bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform flex items-center gap-4 border border-gray-100"
            >
              {/* 图标容器 - 简单的纯色背景 */}
              <div 
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-inner
                  ${game.id === 'landlord' ? 'bg-orange-50 text-orange-500' : 
                    game.id === 'poker' ? 'bg-blue-50 text-blue-500' : 
                    'bg-purple-50 text-purple-500'}`}
              >
                {game.icon}
              </div>

              {/* 文字信息 */}
              <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{game.name}</h3>
                  {game.comingSoon ? (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      待上线
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {game.playerCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {game.description}
                </p>
                
                {/* 标签 - 极简文字 */}
                <div className="flex gap-2 mt-2">
                  {!game.comingSoon && game.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400 border border-gray-100 px-1.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 箭头 */}
              {!game.comingSoon && (
                <div className="text-gray-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>


  )
}

export default GameList
