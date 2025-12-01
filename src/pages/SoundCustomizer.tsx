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
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
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

      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customize')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">系统声音</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">SOUND EFFECTS</p>
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 启用系统声音 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-slate-800">启用系统声音</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-light">为界面交互添加音效反馈</p>
              </div>
              <button
                onClick={toggleSound}
                className={`relative w-11 h-6 rounded-full transition-all ${soundEnabled
                    ? 'bg-blue-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                    : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                  }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* 音效上传区域 - 2列网格 */}
          {soundEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* 系统音效 */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm hover:bg-white/60 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-800">系统音效</h3>
                    {customSound && (
                      <button
                        onClick={() => playSound(customSound)}
                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-light">点击按钮时的反馈音效</p>

                  {customSound ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => systemSoundInputRef.current?.click()}
                        className="flex-1 py-2 bg-white/50 border border-white/60 rounded-xl text-xs text-slate-600 hover:bg-white/80 transition-all"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteCustomSound}
                        className="flex-1 py-2 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-500 hover:bg-red-100/50 transition-all"
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => systemSoundInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>

                {/* 发送音效 */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm hover:bg-white/60 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-800">发送音效</h3>
                    {customSendSound && (
                      <button
                        onClick={() => playSound(customSendSound)}
                        className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-light">发送消息时的音效</p>

                  {customSendSound ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendSoundInputRef.current?.click()}
                        className="flex-1 py-2 bg-white/50 border border-white/60 rounded-xl text-xs text-slate-600 hover:bg-white/80 transition-all"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteSendSound}
                        className="flex-1 py-2 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-500 hover:bg-red-100/50 transition-all"
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => sendSoundInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>

                {/* 通知音效 */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm hover:bg-white/60 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-800">通知音效</h3>
                    {customNotifySound && (
                      <button
                        onClick={() => playSound(customNotifySound)}
                        className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-light">收到新消息时的提示音</p>

                  {customNotifySound ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => notifySoundInputRef.current?.click()}
                        className="flex-1 py-2 bg-white/50 border border-white/60 rounded-xl text-xs text-slate-600 hover:bg-white/80 transition-all"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteNotifySound}
                        className="flex-1 py-2 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-500 hover:bg-red-100/50 transition-all"
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => notifySoundInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/50 transition-all gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>

                {/* 电话音效 */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-sm hover:bg-white/60 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-800">电话音效</h3>
                    {customCallSound && (
                      <button
                        onClick={() => playSound(customCallSound)}
                        className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-light">来电时的铃声</p>

                  {customCallSound ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => callSoundInputRef.current?.click()}
                        className="flex-1 py-2 bg-white/50 border border-white/60 rounded-xl text-xs text-slate-600 hover:bg-white/80 transition-all"
                      >
                        更换
                      </button>
                      <button
                        onClick={handleDeleteCallSound}
                        className="flex-1 py-2 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-500 hover:bg-red-100/50 transition-all"
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => callSoundInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 transition-all gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 提示信息 */}
              <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50/50">
                <div className="text-xs text-slate-500 leading-relaxed text-center">
                  <p>支持 MP3、WAV 等格式，最大 5MB</p>
                  <p className="opacity-70 mt-1">未上传将使用默认音效</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SoundCustomizer
