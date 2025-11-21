/**
 * 系统声音设置页面
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAudio, getAudio } from '../utils/unifiedStorage'
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
  
  // 自定义音效状态
  const [customSound, setCustomSound] = useState('')
  const [customSendSound, setCustomSendSound] = useState('')
  const [customNotifySound, setCustomNotifySound] = useState('')
  const [customCallSound, setCustomCallSound] = useState('')
  
  useEffect(() => {
    const loadSounds = async () => {
      const savedSound = await getAudio('custom_sound')
      const savedSendSound = await getAudio('send_sound')
      const savedNotifySound = await getAudio('notify_sound')
      const savedCallSound = await getAudio('call_sound')
      
      if (savedSound) setCustomSound(savedSound)
      if (savedSendSound) setCustomSendSound(savedSendSound)
      if (savedNotifySound) setCustomNotifySound(savedNotifySound)
      if (savedCallSound) setCustomCallSound(savedCallSound)
    }
    loadSounds()
  }, [])
  
  // 文件输入引用
  const systemSoundInputRef = useRef<HTMLInputElement>(null)
  const sendSoundInputRef = useRef<HTMLInputElement>(null)
  const notifySoundInputRef = useRef<HTMLInputElement>(null)
  const callSoundInputRef = useRef<HTMLInputElement>(null)
  
  // 内置默认音效URL（柔和）
  const DEFAULT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
  
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
  
  // 播放音效
  const playSound = (url: string) => {
    const audio = new Audio(url)
    audio.volume = 0.3
    audio.play().catch(err => console.log('音效播放失败:', err))
  }
  
  // 播放测试音（使用自定义音效或默认柔和音效）
  const playTestSound = () => {
    const url = customSound || DEFAULT_SOUND_URL
    playSound(url)
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
    reader.onload = async () => {
      const base64String = reader.result as string
      setCustomSound(base64String)
      await saveAudio('custom_sound', base64String)
      playSound(base64String)
      console.log('✅ 自定义音效已保存到IndexedDB')
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
  
  // 上传发送音效
  const handleSendSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = async () => {
      const base64String = reader.result as string
      setCustomSendSound(base64String)
      await saveAudio('send_sound', base64String)
      playSound(base64String)
    }
    reader.readAsDataURL(file)
  }
  
  const handleDeleteSendSound = () => {
    if (confirm('确定要删除发送音效吗？')) {
      setCustomSendSound('')
      localStorage.removeItem('custom_send_sound')
    }
  }
  
  // 上传通知音效
  const handleNotifySoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = async () => {
      const base64String = reader.result as string
      setCustomNotifySound(base64String)
      await saveAudio('notify_sound', base64String)
      playSound(base64String)
    }
    reader.readAsDataURL(file)
  }
  
  const handleDeleteNotifySound = () => {
    if (confirm('确定要删除通知音效吗？')) {
      setCustomNotifySound('')
      localStorage.removeItem('custom_notify_sound')
    }
  }
  
  // 上传电话音效
  const handleCallSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = async () => {
      const base64String = reader.result as string
      setCustomCallSound(base64String)
      await saveAudio('call_sound', base64String)
      playSound(base64String)
    }
    reader.readAsDataURL(file)
  }
  
  const handleDeleteCallSound = () => {
    if (confirm('确定要删除电话音效吗？')) {
      setCustomCallSound('')
      localStorage.removeItem('custom_call_sound')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={systemSoundInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCustomSoundUpload}
        className="hidden"
      />
      <input
        ref={sendSoundInputRef}
        type="file"
        accept="audio/*"
        onChange={handleSendSoundUpload}
        className="hidden"
      />
      <input
        ref={notifySoundInputRef}
        type="file"
        accept="audio/*"
        onChange={handleNotifySoundUpload}
        className="hidden"
      />
      <input
        ref={callSoundInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCallSoundUpload}
        className="hidden"
      />
      
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors active:opacity-50"
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

        {/* 音效上传区域 - 2列网格 */}
        {soundEnabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* 系统音效 */}
              <div className="glass-card rounded-xl p-3 backdrop-blur-md bg-white/80 border border-white/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">系统音效</h3>
                <p className="text-xs text-gray-500 mb-3">点击按钮</p>
                
                {customSound ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">已上传</span>
                      <button
                        onClick={() => playSound(customSound)}
                        className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center active:opacity-80"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => systemSoundInputRef.current?.click()}
                        className="flex-1 px-2 py-1.5 bg-slate-700 text-white rounded-full text-xs shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteCustomSound}
                        className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => systemSoundInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 发送音效 */}
              <div className="glass-card rounded-xl p-3 backdrop-blur-md bg-white/80 border border-white/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">发送音效</h3>
                <p className="text-xs text-gray-500 mb-3">发送消息</p>
                
                {customSendSound ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">已上传</span>
                      <button
                        onClick={() => playSound(customSendSound)}
                        className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center active:opacity-80"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => sendSoundInputRef.current?.click()}
                        className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteSendSound}
                        className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => sendSoundInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-green-400 hover:bg-green-50 active:bg-green-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 通知音效 */}
              <div className="glass-card rounded-xl p-3 backdrop-blur-md bg-white/80 border border-white/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">通知音效</h3>
                <p className="text-xs text-gray-500 mb-3">收到消息</p>
                
                {customNotifySound ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">已上传</span>
                      <button
                        onClick={() => playSound(customNotifySound)}
                        className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center active:opacity-80"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => notifySoundInputRef.current?.click()}
                        className="flex-1 px-2 py-1.5 bg-purple-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteNotifySound}
                        className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => notifySoundInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-purple-400 hover:bg-purple-50 active:bg-purple-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 电话音效 */}
              <div className="glass-card rounded-xl p-3 backdrop-blur-md bg-white/80 border border-white/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">电话音效</h3>
                <p className="text-xs text-gray-500 mb-3">来电铃声</p>
                
                {customCallSound ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">已上传</span>
                      <button
                        onClick={() => playSound(customCallSound)}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center active:opacity-80"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => callSoundInputRef.current?.click()}
                        className="flex-1 px-2 py-1.5 bg-orange-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteCallSound}
                        className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-full text-xs active:opacity-80"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => callSoundInputRef.current?.click()}
                    className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-orange-400 hover:bg-orange-50 active:bg-orange-100 transition-colors"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 提示信息 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-gray-600 text-center">
                支持 MP3、WAV 等格式，最大 5MB<br/>
                未上传将使用默认音效
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SoundCustomizer
