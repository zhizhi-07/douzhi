/**
 * 系统声音设置页面
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const SoundCustomizer = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  // 系统声音开关
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('system_sound_enabled')
    return saved !== 'false'
  })
  
  // 当前选择的音效
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('system_sound_type') || 'tap'
  })
  
  // 消息发送音效
  const [messageSendSound, setMessageSendSound] = useState(() => {
    return localStorage.getItem('message_send_sound') || 'send1'
  })
  
  // 消息通知音效
  const [messageNotifySound, setMessageNotifySound] = useState(() => {
    return localStorage.getItem('message_notify_sound') || 'notify1'
  })
  
  // 视频通话音效
  const [videoCallSound, setVideoCallSound] = useState(() => {
    return localStorage.getItem('video_call_sound') || 'call1'
  })
  
  // 自定义音效
  const [customSound, setCustomSound] = useState(() => {
    return localStorage.getItem('custom_sound') || ''
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 内置音效列表
  const sounds = [
    {
      id: 'tap',
      name: '轻触',
      description: '清脆的轻触声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    },
    {
      id: 'click',
      name: '点击',
      description: '经典按键音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
    },
    {
      id: 'pop',
      name: '弹出',
      description: '轻快的弹出音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'
    },
    {
      id: 'swoosh',
      name: '滑动',
      description: '流畅的滑动音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
    }
  ]
  
  // 消息发送音效
  const messageSendSounds = [
    {
      id: 'send1',
      name: '发送1',
      description: '轻快的发送音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    {
      id: 'send2',
      name: '发送2',
      description: '清脆的发送音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
    }
  ]
  
  // 消息通知音效
  const messageNotifySounds = [
    {
      id: 'notify1',
      name: '通知1',
      description: '温和的提示音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
    },
    {
      id: 'notify2',
      name: '通知2',
      description: '清新的提示音',
      url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3'
    }
  ]
  
  // 视频通话音效
  const videoCallSounds = [
    {
      id: 'call1',
      name: '通话1',
      description: '经典铃声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    {
      id: 'call2',
      name: '通话2',
      description: '现代铃声',
      url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
    }
  ]
  
  // 切换声音开关
  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('system_sound_enabled', String(newValue))
    
    // 如果打开，播放一个测试音
    if (newValue) {
      playTestSound()
    }
  }
  
  // 选择音效
  const selectSound = (soundId: string) => {
    setSelectedSound(soundId)
    localStorage.setItem('system_sound_type', soundId)
    
    // 播放测试音
    const sound = sounds.find(s => s.id === soundId)
    if (sound && soundEnabled) {
      playSound(sound.url)
    }
  }
  
  // 播放音效
  const playSound = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    const audio = new Audio(url)
    audio.volume = 0.3
    audio.play().catch(err => console.log('音效播放失败:', err))
    audioRef.current = audio
  }
  
  // 播放测试音
  const playTestSound = () => {
    const sound = sounds.find(s => s.id === selectedSound)
    if (sound) {
      playSound(sound.url)
    }
  }
  
  // 选择消息发送音效
  const selectMessageSendSound = (soundId: string) => {
    setMessageSendSound(soundId)
    localStorage.setItem('message_send_sound', soundId)
    
    const sound = messageSendSounds.find(s => s.id === soundId)
    if (sound) {
      playSound(sound.url)
    }
  }
  
  // 选择消息通知音效
  const selectMessageNotifySound = (soundId: string) => {
    setMessageNotifySound(soundId)
    localStorage.setItem('message_notify_sound', soundId)
    
    const sound = messageNotifySounds.find(s => s.id === soundId)
    if (sound) {
      playSound(sound.url)
    }
  }
  
  // 选择视频通话音效
  const selectVideoCallSound = (soundId: string) => {
    setVideoCallSound(soundId)
    localStorage.setItem('video_call_sound', soundId)
    
    const sound = videoCallSounds.find(s => s.id === soundId)
    if (sound) {
      playSound(sound.url)
    }
  }
  
  // 上传自定义音效
  const handleCustomSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('音频文件太大！请选择小于5MB的文件')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      setCustomSound(base64String)
      localStorage.setItem('custom_sound', base64String)
      playSound(base64String)
      console.log('✅ 自定义音效已保存')
    }
    reader.onerror = () => {
      alert('音频读取失败')
    }
    reader.readAsDataURL(file)
  }
  
  // 删除自定义音效
  const handleDeleteCustomSound = () => {
    if (confirm('确定要删除自定义音效吗？')) {
      setCustomSound('')
      localStorage.removeItem('custom_sound')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCustomSoundUpload}
        className="hidden"
      />
      
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            系统声音
          </h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 启用系统声音 */}
        <div className="mb-4">
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">启用系统声音</h3>
                <p className="text-xs text-gray-500 mt-1">为界面交互添加音效反馈</p>
              </div>
              <button
                onClick={toggleSound}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* 音效选择 */}
        {soundEnabled && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">选择音效</h2>
            <div className="space-y-2">
              {sounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => selectSound(sound.id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all backdrop-blur-md ${
                    selectedSound === sound.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white/80 border border-white/50 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{sound.name}</h3>
                        {selectedSound === sound.id && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            已选中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sound.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(sound.url)
                      }}
                      className="ml-3 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center active:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 消息发送音效 */}
        {soundEnabled && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">消息发送音效</h2>
            <div className="space-y-2">
              {messageSendSounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => selectMessageSendSound(sound.id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all backdrop-blur-md ${
                    messageSendSound === sound.id
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-white/80 border border-white/50 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{sound.name}</h3>
                        {messageSendSound === sound.id && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            已选中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sound.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(sound.url)
                      }}
                      className="ml-3 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center active:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 消息通知音效 */}
        {soundEnabled && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">消息通知音效</h2>
            <div className="space-y-2">
              {messageNotifySounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => selectMessageNotifySound(sound.id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all backdrop-blur-md ${
                    messageNotifySound === sound.id
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-white/80 border border-white/50 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{sound.name}</h3>
                        {messageNotifySound === sound.id && (
                          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                            已选中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sound.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(sound.url)
                      }}
                      className="ml-3 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center active:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 视频通话音效 */}
        {soundEnabled && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">视频通话音效</h2>
            <div className="space-y-2">
              {videoCallSounds.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => selectVideoCallSound(sound.id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all backdrop-blur-md ${
                    videoCallSound === sound.id
                      ? 'bg-orange-50 border-2 border-orange-500'
                      : 'bg-white/80 border border-white/50 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{sound.name}</h3>
                        {videoCallSound === sound.id && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            已选中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sound.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(sound.url)
                      }}
                      className="ml-3 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center active:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 自定义音效 */}
        {soundEnabled && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">自定义音效</h2>
            <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
              <p className="text-xs text-gray-500 mb-3">上传自己的音频文件作为音效</p>
              
              {customSound ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">自定义音效已上传</p>
                    </div>
                    <button
                      onClick={() => playSound(customSound)}
                      className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center active:opacity-80 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl active:opacity-80 transition-opacity font-medium text-sm"
                    >
                      更换音效
                    </button>
                    <button
                      onClick={handleDeleteCustomSound}
                      className="flex-1 px-4 py-2.5 glass-card text-gray-700 rounded-xl active:opacity-80 transition-opacity font-medium text-sm"
                    >
                      删除音效
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl active:opacity-80 transition-opacity font-medium text-sm"
                >
                  上传音效文件
                </button>
              )}
              
              <p className="text-xs text-gray-400 mt-2">支持 MP3、WAV 等音频格式，最大 5MB</p>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">使用说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 点击音效：界面按钮点击时播放</li>
            <li>• 消息发送：发送消息时播放</li>
            <li>• 消息通知：收到新消息时播放</li>
            <li>• 视频通话：发起/接听视频通话时播放</li>
            <li>• 自定义音效：上传你喜欢的音频文件</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SoundCustomizer
