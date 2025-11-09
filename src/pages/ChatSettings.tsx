/**
 * 聊天设置页面
 * 功能：消息条数控制、API设置等
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { blacklistManager } from '../utils/blacklistManager'
import { 
  setChatWallpaper, 
  createCustomWallpaper
} from '../utils/wallpaperManager'
import BubbleSettings from './ChatSettings/BubbleSettings'
import { clearMessages } from '../utils/simpleMessageManager'

interface ChatSettingsData {
  messageLimit: number  // 读取的消息条数
  momentsVisibleCount: number  // AI可见的朋友圈条数
  aiCanPostMoments: boolean  // AI是否可以主动发朋友圈
  autoMemorySummary: boolean  // 是否启用自动记忆总结
  memorySummaryInterval: number  // 每N轮对话自动生成总结
  groupChatSync: {
    enabled: boolean  // 是否启用群聊消息同步
    messageCount: number  // 同步消息条数
  }
  aiProactiveMessage: {
    enabled: boolean  // 是否启用AI主动发消息
    mode: 'fixed' | 'thinking'  // 模式：fixed=固定时间必发，thinking=AI思考是否发
    interval: number  // 时间间隔（分钟）
  }
}

const ChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 从localStorage读取设置
  const getSettings = (): ChatSettingsData => {
    const saved = localStorage.getItem(`chat_settings_${id}`)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        messageLimit: data.messageLimit ?? 50,
        momentsVisibleCount: data.momentsVisibleCount ?? 10,
        aiCanPostMoments: data.aiCanPostMoments ?? false,
        autoMemorySummary: data.autoMemorySummary ?? false,
        memorySummaryInterval: data.memorySummaryInterval ?? 30,
        groupChatSync: data.groupChatSync ?? {
          enabled: false,
          messageCount: 20
        },
        aiProactiveMessage: data.aiProactiveMessage ?? {
          enabled: false,
          mode: 'thinking',
          interval: 5
        }
      }
    }
    return {
      messageLimit: 50,
      momentsVisibleCount: 10,
      aiCanPostMoments: false,
      autoMemorySummary: false,
      memorySummaryInterval: 30,
      groupChatSync: {
        enabled: false,
        messageCount: 20
      },
      aiProactiveMessage: {
        enabled: false,
        mode: 'thinking',
        interval: 5
      }
    }
  }
  
  const [settings, setSettings] = useState<ChatSettingsData>(getSettings())
  const [saved, setSaved] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 检查拉黑状态
  useEffect(() => {
    if (id) {
      const blocked = blacklistManager.isBlockedByMe('user', id)
      setIsBlocked(blocked)
    }
  }, [id])
  
  // 保存设置
  const saveSettings = (newSettings: ChatSettingsData) => {
    localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
    setSettings(newSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  // 切换拉黑状态
  const toggleBlock = () => {
    if (!id) return
    const newBlockStatus = blacklistManager.toggleBlock('user', id)
    setIsBlocked(newBlockStatus)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  // 上传自定义壁纸
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！')
      return
    }
    
    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB！')
      return
    }
    
    // 读取图片并转换为base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const customWallpaper = createCustomWallpaper(imageUrl)
      setChatWallpaper(id, customWallpaper)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      alert('壁纸已设置！')
    }
    reader.readAsDataURL(file)
  }
  
  // 清空聊天记录
  const clearChatHistory = async () => {
    if (!id) return
    
    if (confirm('确定要清空所有聊天记录吗？\n此操作不可恢复！')) {
      try {
        await clearMessages(id)
        alert('聊天记录已清空！')
        // 触发消息更新事件
        window.dispatchEvent(new CustomEvent('messages-loaded', { detail: { chatId: id } }))
        navigate(`/chat/${id}`)
      } catch (error) {
        console.error('清空聊天记录失败:', error)
        alert('清空失败，请重试')
      }
    }
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 page-enter">
      {/* 头部 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/chat/${id}`)}
            className="text-gray-700 p-2 rounded-full active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            聊天设置
          </h1>
          <div className="w-10" />
        </div>
      </div>
      
      {/* 保存提示 */}
      {saved && (
        <div className="mx-4 mt-3 px-4 py-2 bg-green-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 text-green-700 text-sm text-center animate-in slide-in-from-top">
          设置已保存
        </div>
      )}
      
      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 拉黑设置 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">拉黑此角色</span>
            <button
              onClick={toggleBlock}
              className={`w-11 h-6 rounded-full relative transition-all ${
                isBlocked ? 'bg-red-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  isBlocked ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* AI 记忆 */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <div className="text-sm font-medium text-gray-900 mb-3">AI 记忆</div>
          
          <button
            onClick={() => navigate(`/chat/${id}/memory-viewer`)}
            className="w-full flex items-center justify-between py-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl"></span>
              <div className="text-left">
                <div className="text-sm text-gray-900">查看记忆</div>
                <div className="text-xs text-gray-400">查看 AI 记住的关于你的信息</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate(`/chat/${id}/memory-summary`)}
            className="w-full flex items-center justify-between py-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl"></span>
              <div className="text-left">
                <div className="text-sm text-gray-900">记忆总结</div>
                <div className="text-xs text-gray-400">AI 总结当前对话的重要信息</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* 自动总结设置 */}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-900">自动总结</div>
                <div className="text-xs text-gray-400">每隔一定轮数自动生成记忆总结</div>
              </div>
              <button
                onClick={() => {
                  const newSettings = { ...settings, autoMemorySummary: !settings.autoMemorySummary }
                  setSettings(newSettings)
                  localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.autoMemorySummary ? 'bg-[#07c160]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    settings.autoMemorySummary ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            {settings.autoMemorySummary && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">总结间隔</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.memorySummaryInterval}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30
                      const newSettings = { ...settings, memorySummaryInterval: value }
                      setSettings(newSettings)
                      localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                    }}
                    className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-lg"
                  />
                  <span className="text-sm text-gray-600">轮对话</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 群聊消息同步 */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="text-sm font-medium text-gray-900">群聊消息同步</div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">同步群聊消息</div>
              <div className="text-xs text-gray-400">让AI了解TA在群聊中的发言</div>
            </div>
            <button
              onClick={() => {
                const newSettings = { 
                  ...settings, 
                  groupChatSync: {
                    ...settings.groupChatSync,
                    enabled: !settings.groupChatSync.enabled
                  }
                }
                setSettings(newSettings)
                localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.groupChatSync.enabled ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  settings.groupChatSync.enabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          
          {settings.groupChatSync.enabled && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">同步消息条数</span>
                <span className="text-xs font-medium text-gray-900">{settings.groupChatSync.messageCount}条</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={settings.groupChatSync.messageCount}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value)
                  const newSettings = { 
                    ...settings, 
                    groupChatSync: {
                      ...settings.groupChatSync,
                      messageCount: newCount
                    }
                  }
                  setSettings(newSettings)
                  localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10条</span>
                <span>50条</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                AI将读取TA在群聊中的最近{settings.groupChatSync.messageCount}条发言
              </p>
            </div>
          )}
        </div>
        
        {/* AI主动发消息 */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="text-sm font-medium text-gray-900">AI主动发消息</div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">启用主动发消息</div>
              <div className="text-xs text-gray-400">AI会在你一段时间未回复时主动发消息</div>
            </div>
            <button
              onClick={() => {
                const newSettings = { 
                  ...settings, 
                  aiProactiveMessage: {
                    ...settings.aiProactiveMessage,
                    enabled: !settings.aiProactiveMessage.enabled
                  }
                }
                setSettings(newSettings)
                localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.aiProactiveMessage.enabled ? 'bg-[#07c160]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  settings.aiProactiveMessage.enabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          
          {settings.aiProactiveMessage.enabled && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {/* 模式选择 */}
              <div>
                <div className="text-xs text-gray-600 mb-2">发消息模式</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        aiProactiveMessage: {
                          ...settings.aiProactiveMessage,
                          mode: 'fixed' as const
                        }
                      }
                      setSettings(newSettings)
                      localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                    }}
                    className={`py-2 px-3 rounded-lg text-xs transition-all ${
                      settings.aiProactiveMessage.mode === 'fixed'
                        ? 'bg-[#07c160] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    固定时间
                  </button>
                  <button
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        aiProactiveMessage: {
                          ...settings.aiProactiveMessage,
                          mode: 'thinking' as const
                        }
                      }
                      setSettings(newSettings)
                      localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                    }}
                    className={`py-2 px-3 rounded-lg text-xs transition-all ${
                      settings.aiProactiveMessage.mode === 'thinking'
                        ? 'bg-[#07c160] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    AI思考
                  </button>
                </div>
              </div>
              
              {/* 时间间隔 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">
                    {settings.aiProactiveMessage.mode === 'fixed' ? '固定间隔' : '思考间隔'}
                  </span>
                  <span className="text-xs font-medium text-gray-900">{settings.aiProactiveMessage.interval}分钟</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.aiProactiveMessage.interval}
                  onChange={(e) => {
                    const newInterval = parseInt(e.target.value)
                    const newSettings = { 
                      ...settings, 
                      aiProactiveMessage: {
                        ...settings.aiProactiveMessage,
                        interval: newInterval
                      }
                    }
                    setSettings(newSettings)
                    localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#07c160]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1分钟</span>
                  <span>30分钟</span>
                </div>
              </div>
              
              {/* 说明文字 */}
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-2 text-green-600 text-xs">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {settings.aiProactiveMessage.mode === 'fixed' ? (
                      <span>固定模式：{settings.aiProactiveMessage.interval}分钟后AI必定发送消息</span>
                    ) : (
                      <span>思考模式：{settings.aiProactiveMessage.interval}分钟后AI会思考是否需要发消息（使用副API）</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 气泡设置 */}
        {id && (
          <BubbleSettings 
            chatId={id} 
            onSaved={() => {
              setSaved(true)
              setTimeout(() => setSaved(false), 2000)
            }} 
          />
        )}
        
        {/* 壁纸设置 */}
        <div className="bg-white rounded-2xl p-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <span className="text-sm text-gray-600">聊天壁纸</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        {/* 消息条数设置 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                消息条数
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI读取的历史消息数量
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-gray-900">
                {settings.messageLimit === 0 ? '无限' : settings.messageLimit}
              </div>
            </div>
          </div>
          
          {/* 滑块 */}
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={settings.messageLimit}
              onChange={(e) => saveSettings({ ...settings, messageLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[50, 200, 500].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, messageLimit: num })}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition-all active:scale-95 ${
                    settings.messageLimit === num
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {num}条
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* AI主动发朋友圈 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                AI主动发朋友圈
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                开启后AI可以在聊天中发布朋友圈
              </p>
            </div>
            <button
              onClick={() => saveSettings({ ...settings, aiCanPostMoments: !settings.aiCanPostMoments })}
              className={`w-11 h-6 bg-gray-200 rounded-full relative active:scale-95 transition-all ${
                settings.aiCanPostMoments ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform ${
                settings.aiCanPostMoments ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
          {settings.aiCanPostMoments && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-2 text-green-600 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>AI发送朋友圈后，其他AI角色可能会根据内容进行互动</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 朋友圈可见条数 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                朋友圈可见条数
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI可以看到用户发布的朋友圈数量
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-gray-900">
                {settings.momentsVisibleCount === 0 ? '无' : settings.momentsVisibleCount}
              </div>
            </div>
          </div>
          
          {/* 滑块 */}
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={settings.momentsVisibleCount}
              onChange={(e) => saveSettings({ ...settings, momentsVisibleCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[0, 10, 20, 50].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, momentsVisibleCount: num })}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs transition-all active:scale-95 ${
                    settings.momentsVisibleCount === num
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {num === 0 ? '不可见' : `${num}条`}
                </button>
              ))}
            </div>
          </div>
          
          {settings.momentsVisibleCount > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-2 text-green-600 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>朋友圈内容将加入对话上下文，会额外消耗 Token</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 清空聊天记录 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              清空聊天记录
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              删除所有历史消息，不可恢复
            </p>
          </div>
          
          <button
            onClick={clearChatHistory}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空所有消息
          </button>
          
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-2 text-red-600 text-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>此操作将永久删除所有聊天记录，包括视频通话记录，且无法恢复！</span>
            </div>
          </div>
        </div>
        
        {/* 底部间距 */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default ChatSettings
