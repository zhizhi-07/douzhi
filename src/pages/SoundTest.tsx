/**
 * 音效测试页面 - 快速测试所有点击音效
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const SoundTest = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

  // 可爱风格音效列表
  const sounds = [
    {
      id: 'soft',
      name: '柔和',
      description: '温柔舒适音（保留）',
      url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      color: 'bg-pink-400',
      emoji: '💗'
    },
    {
      id: 'bubble1',
      name: '小气泡',
      description: '可爱的小气泡声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3',
      color: 'bg-blue-400',
      emoji: '🫧'
    },
    {
      id: 'bubble2',
      name: '水滴泡泡',
      description: '清新水滴音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
      color: 'bg-cyan-400',
      emoji: '💧'
    },
    {
      id: 'plop',
      name: '啵啵音',
      description: '轻柔的啵啵声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
      color: 'bg-purple-400',
      emoji: '🎈'
    },
    {
      id: 'ding',
      name: '叮咚',
      description: '清脆的叮咚声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      color: 'bg-yellow-400',
      emoji: '🔔'
    },
    {
      id: 'chime',
      name: '铃铛音',
      description: '悦耳的铃铛声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3',
      color: 'bg-amber-400',
      emoji: '🎐'
    },
    {
      id: 'plink',
      name: '叮铃',
      description: '轻快的叮铃声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      color: 'bg-green-400',
      emoji: '✨'
    },
    {
      id: 'tinkle',
      name: '清脆铃',
      description: '清脆的铃音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
      color: 'bg-teal-400',
      emoji: '🌟'
    },
    {
      id: 'sparkle',
      name: '闪亮音',
      description: '像星星闪烁的声音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      color: 'bg-indigo-400',
      emoji: '⭐'
    },
    {
      id: 'bounce',
      name: '弹跳',
      description: '可爱的弹跳音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      color: 'bg-rose-400',
      emoji: '🏀'
    },
    {
      id: 'meow',
      name: '喵喵',
      description: '小猫咪的声音',
      url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c6705d9d.mp3',
      color: 'bg-orange-400',
      emoji: '🐱'
    },
    {
      id: 'chirp',
      name: '啾啾',
      description: '小鸟的叫声',
      url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3',
      color: 'bg-sky-400',
      emoji: '🐦'
    },
    {
      id: 'kiss',
      name: '啵一口',
      description: '亲亲的声音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      color: 'bg-red-400',
      emoji: '💋'
    },
    {
      id: 'heart',
      name: '爱心音',
      description: '充满爱意的音效',
      url: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
      color: 'bg-pink-500',
      emoji: '❤️'
    }
  ]

  // 当前选择的音效
  const [currentSound, setCurrentSound] = useState(() => {
    return localStorage.getItem('system_sound_type') || 'soft'
  })

  // 播放音效
  const playSound = (url: string) => {
    const audio = new Audio(url)
    audio.volume = 0.5
    audio.play().catch(err => {
      console.log('播放失败:', err)
    })
  }

  // 选择音效
  const selectSound = (id: string) => {
    setCurrentSound(id)
    localStorage.setItem('system_sound_type', id)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-500 text-base"
          >
            返回
          </button>
          <h1 className="flex-1 text-center text-lg font-medium">
            音效测试
          </h1>
          <div className="w-12"></div>
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 mx-4 mt-4 p-5 rounded-2xl shadow-sm border border-pink-100">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎀 可爱音效大作战 🎀</h2>
          <div className="text-sm text-gray-600 space-y-1.5">
            <p>💗 只保留了"柔和"音效</p>
            <p>🎵 新增13个超可爱音效供你选择</p>
            <p>✨ 点击试听，选择你最爱的那个！</p>
          </div>
        </div>
      </div>

      {/* 音效网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {sounds.map((sound) => (
            <div
              key={sound.id}
              className={`
                relative overflow-hidden rounded-2xl shadow-lg
                transform transition-all duration-300
                ${currentSound === sound.id ? 'scale-105 ring-4 ring-blue-400' : 'hover:scale-105'}
              `}
            >
              <div className={`${sound.color} p-6 h-full flex flex-col justify-between`}>
                {/* 选中标记 */}
                {currentSound === sound.id && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* 音效信息 */}
                <div className="text-white">
                  <div className="text-5xl mb-3">{sound.emoji}</div>
                  <h3 className="text-2xl font-bold mb-2">{sound.name}</h3>
                  <p className="text-sm opacity-90">{sound.description}</p>
                </div>

                {/* 按钮组 */}
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => playSound(sound.url)}
                    className="w-full bg-white bg-opacity-30 hover:bg-opacity-40 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    🎵 试听
                  </button>
                  <button
                    onClick={() => selectSound(sound.id)}
                    className={`
                      w-full font-medium py-3 px-4 rounded-xl transition-all duration-200
                      ${currentSound === sound.id
                        ? 'bg-white text-gray-800'
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white backdrop-blur-sm'
                      }
                    `}
                  >
                    {currentSound === sound.id ? '✅ 已选择' : '选择此音效'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="bg-white border-t p-4 space-y-3">
        <button
          onClick={() => {
            localStorage.setItem('system_sound_enabled', 'true')
            alert('✨ 音效已开启！现在点击任何按钮都会播放可爱的音效啦~ 💗')
          }}
          className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-4 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          🎵 开启可爱音效
        </button>
        <button
          onClick={() => {
            localStorage.setItem('system_sound_enabled', 'false')
            alert('🔇 音效已关闭')
          }}
          className="w-full bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-2xl hover:bg-gray-300 transition-all active:scale-95"
        >
          🔇 暂时关闭音效
        </button>
      </div>
    </div>
  )
}

export default SoundTest
