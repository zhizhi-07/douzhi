/**
 * 聊天设置页面
 * 功能：消息条数控制、API设置等
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { blacklistManager } from '../utils/blacklistManager'
import { 
  getChatWallpaper, 
  setChatWallpaper, 
  createCustomWallpaper,
  type Wallpaper 
} from '../utils/wallpaperManager'
import BubbleSettings from './ChatSettings/BubbleSettings'

interface ChatSettingsData {
  messageLimit: number  // 读取的消息条数
  momentsVisibleCount: number  // AI可见的朋友圈条数
  aiCanPostMoments: boolean  // AI是否可以主动发朋友圈
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
        momentsVisibleCount: data.momentsVisibleCount ?? 10,  // 默认10条
        aiCanPostMoments: data.aiCanPostMoments ?? false  // 默认关闭
      }
    }
    return {
      messageLimit: 50,  // 默认50条
      momentsVisibleCount: 10,  // 默认10条朋友圈
      aiCanPostMoments: false  // 默认AI不能发朋友圈
    }
  }
  
  const [settings, setSettings] = useState<ChatSettingsData>(getSettings())
  const [saved, setSaved] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(() => 
    id ? getChatWallpaper(id) : { id: 'default', type: 'gradient', value: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)', name: '默认' }
  )
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
  
  // 选择壁纸
  const selectWallpaper = (wallpaper: Wallpaper) => {
    if (!id) return
    setCurrentWallpaper(wallpaper)
    setChatWallpaper(id, wallpaper)
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
      selectWallpaper(customWallpaper)
    }
    reader.readAsDataURL(file)
  }
  
  // 清空聊天记录
  const clearChatHistory = () => {
    if (!id) return
    
    if (confirm('确定要清空所有聊天记录吗？\n此操作不可恢复！')) {
      localStorage.removeItem(`chat_messages_${id}`)
      alert('聊天记录已清空！')
      navigate(`/chat/${id}`)
    }
  }
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 page-enter">
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* 拉黑设置 */}
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                拉黑此角色
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isBlocked ? 'AI会知道被拉黑，消息显示警告' : '拉黑后AI无法正常回复'}
              </p>
            </div>
            <button
              onClick={toggleBlock}
              className={`relative w-14 h-7 rounded-full transition-all ${
                isBlocked ? 'bg-red-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isBlocked ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {isBlocked && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>已拉黑，AI消息会显示红色感叹号</span>
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
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              聊天壁纸
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              上传自定义壁纸图片
            </p>
          </div>
          
          {/* 上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-pink-300 hover:bg-pink-400 active:bg-pink-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            上传壁纸
          </button>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {/* 当前壁纸预览 */}
          {currentWallpaper.type === 'custom' && (
            <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 text-pink-600 text-xs">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>已使用自定义壁纸</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 消息条数设置 */}
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
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
              <div className="text-2xl font-bold text-pink-400">
                {settings.messageLimit === 0 ? '无限' : settings.messageLimit}
              </div>
              <div className="text-xs text-gray-500">
                {settings.messageLimit === 0 ? '所有消息' : `约${Math.round(settings.messageLimit * 50)}T`}
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
              className="w-full h-2 bg-gray-200/60 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  rgb(251 207 232) 0%, 
                  rgb(251 207 232) ${(settings.messageLimit / 500) * 100}%, 
                  rgb(229 231 235 / 0.6) ${(settings.messageLimit / 500) * 100}%, 
                  rgb(229 231 235 / 0.6) 100%)`
              }}
            />
            
            {/* 刻度标签 */}
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>0</span>
              <span>125</span>
              <span>250</span>
              <span>375</span>
              <span>500</span>
            </div>
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[50, 200, 500].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, messageLimit: num })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    settings.messageLimit === num
                      ? 'bg-pink-200 text-pink-900 shadow-lg'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  {num}条
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* AI主动发朋友圈 */}
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
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
              className={`relative w-14 h-7 rounded-full transition-all ${
                settings.aiCanPostMoments ? 'bg-purple-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  settings.aiCanPostMoments ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {settings.aiCanPostMoments && (
            <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-2 text-purple-600 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>AI发送朋友圈后，其他AI角色可能会根据内容进行互动</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 朋友圈可见条数 */}
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
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
              <div className="text-2xl font-bold text-purple-400">
                {settings.momentsVisibleCount === 0 ? '无' : settings.momentsVisibleCount}
              </div>
              <div className="text-xs text-gray-500">
                {settings.momentsVisibleCount === 0 ? '不可见' : `最近${settings.momentsVisibleCount}条`}
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
              className="w-full h-2 bg-gray-200/60 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  rgb(216 180 254) 0%, 
                  rgb(216 180 254) ${(settings.momentsVisibleCount / 50) * 100}%, 
                  rgb(229 231 235 / 0.6) ${(settings.momentsVisibleCount / 50) * 100}%, 
                  rgb(229 231 235 / 0.6) 100%)`
              }}
            />
            
            {/* 刻度标签 */}
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
            </div>
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[0, 10, 20, 50].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, momentsVisibleCount: num })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    settings.momentsVisibleCount === num
                      ? 'bg-purple-200 text-purple-900 shadow-lg'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  {num === 0 ? '不可见' : `${num}条`}
                </button>
              ))}
            </div>
          </div>
          
          {settings.momentsVisibleCount > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-2 text-purple-600 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>朋友圈内容将加入对话上下文，会额外消耗 Token</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 清空聊天记录 */}
        <div className="glass-effect rounded-3xl p-6 border border-white/50 shadow-xl">
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
