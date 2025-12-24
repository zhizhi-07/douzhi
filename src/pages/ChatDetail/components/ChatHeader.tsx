/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../../../components/StatusBar'
import { playSystemSound } from '../../../utils/soundManager'
import { getAIStatus, AIStatus } from '../../../utils/aiStatusManager'
import { getUserAvatar } from '../../../utils/avatarStorage'
import * as IDB from '../../../utils/indexedDBManager'

interface ChatHeaderProps {
  characterName: string
  characterId?: string
  characterAvatar?: string
  isAiTyping?: boolean
  onBack?: () => void
  onMenuClick?: () => void
  onStatusClick?: () => void
  topBarImage?: string | null
  customIcons?: Record<string, string>
  topBarScale?: number
  topBarX?: number
  topBarY?: number
}

const ChatHeader = ({ characterName, characterId, characterAvatar, isAiTyping, onBack, onMenuClick, onStatusClick, topBarImage, customIcons = {}, topBarScale, topBarX, topBarY }: ChatHeaderProps) => {
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [aiAvatar, setAiAvatar] = useState<string | null>(null)

  // 从IndexedDB获取用户头像和角色头像
  useEffect(() => {
    getUserAvatar().then(avatar => {
      console.log('🖼️ [ChatHeader] 用户头像:', avatar ? '有' : '无')
      if (avatar) setUserAvatar(avatar)
    })
    
    // 获取角色头像：从IndexedDB获取完整角色数据（因为备份里的头像是截断的）
    console.log('🖼️ [ChatHeader] characterId:', characterId)
    
    if (characterId) {
      // 从IndexedDB获取完整角色数据
      IDB.getItem<Array<{id: string, avatar?: string}>>(IDB.STORES.CHARACTERS, 'all').then(characters => {
        if (characters) {
          const char = characters.find(c => c.id === characterId)
          console.log('🖼️ [ChatHeader] IndexedDB角色头像:', char?.avatar ? '有(' + char.avatar.length + '字符)' : '无')
          if (char?.avatar) {
            setAiAvatar(char.avatar)
          }
        }
      })
    }
  }, [characterId])
  
  // 读取自定义顶栏CSS
  const customTopBarStyle = (() => {
    try {
      const saved = localStorage.getItem('chat_custom_css')
      console.log('🎨 [ChatHeader] 读取CSS:', saved)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.custom?.topBar) {
          // 将CSS字符串转换为style对象
          const styleObj: Record<string, string> = {}
          data.custom.topBar.split(';').forEach((rule: string) => {
            const colonIndex = rule.indexOf(':')
            if (colonIndex > 0) {
              const key = rule.substring(0, colonIndex).trim()
              const value = rule.substring(colonIndex + 1).trim().replace(/!important/gi, '').trim()
              if (key && value) {
                // 转换CSS属性名为驼峰式
                const camelKey = key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
                styleObj[camelKey] = value
              }
            }
          })
          return Object.keys(styleObj).length > 0 ? styleObj : null
        }
      }
    } catch (e) {
      console.error('解析顶栏CSS失败:', e)
    }
    return null
  })()

  // 获取AI状态
  useEffect(() => {
    const updateStatus = () => {
      if (characterId) {
        const status = getAIStatus(characterId)
        setAiStatus(status)
      }
    }

    updateStatus()

    // 每10秒检查一次状态
    const interval = setInterval(updateStatus, 10000)

    // 监听状态更新事件
    const handleStatusUpdate = (e: CustomEvent) => {
      if (e.detail?.characterId === characterId) {
        updateStatus()
      }
    }
    window.addEventListener('aiStatusUpdated', handleStatusUpdate as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener('aiStatusUpdated', handleStatusUpdate as EventListener)
    }
  }, [characterId])

  const handleBack = () => {
    playSystemSound() // 🎵 统一使用通用点击音效
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={`chat-topbar relative rounded-b-[20px] ${customTopBarStyle ? '' : 'glass-effect'}`} style={customTopBarStyle || undefined}>
      {/* 顶栏装饰背景 */}
      {topBarImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 rounded-b-[20px] overflow-hidden"
          style={{
            backgroundImage: `url(${topBarImage})`,
            backgroundSize: `${topBarScale || 100}%`,
            backgroundPosition: `calc(50% + ${topBarX || 0}px) calc(50% + ${topBarY || 0}px)`
          }}
        />
      )}
      <div className="relative z-10">
        <StatusBar />
      </div>
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        {/* 左侧：返回按钮 */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleBack}
            className="text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full"
          >
            {customIcons['chat-back'] ? (
              <img src={customIcons['chat-back']} alt="返回" className="w-8 h-8 object-contain rounded-full" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* 中间：名字和状态居中 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center max-w-[60%]">
          {/* 头像区域 - 默认隐藏，CSS可控制显示和尺寸 */}
          <div className="chat-topbar-avatars hidden items-center gap-2 mb-1">
            {aiAvatar && (
              <img 
                src={aiAvatar} 
                alt={characterName}
                className="chat-topbar-avatar chat-topbar-avatar-ai rounded-full object-cover"
              />
            )}
            <span className="chat-topbar-wave text-gray-400 text-sm">—</span>
            {userAvatar && (
              <img 
                src={userAvatar} 
                alt="我"
                className="chat-topbar-avatar chat-topbar-avatar-user rounded-full object-cover"
              />
            )}
          </div>
          <h1 className="chat-topbar-name text-base font-semibold text-gray-900 whitespace-nowrap truncate max-w-full">
            {characterName}
          </h1>
          {/* 状态栏：绿色圆点 + 简短状态 - 可点击查看详情，CSS可通过chat-topbar-status隐藏 */}
          <button
            onClick={() => {
              playSystemSound()
              onStatusClick?.()
            }}
            className="chat-topbar-status flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 btn-press-fast touch-ripple-effect px-2 py-0.5 rounded-full hover:bg-gray-100/50 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="truncate max-w-[120px]">
              {isAiTyping ? '正在输入...' : (
                aiStatus?.location || '在线'
              )}
            </span>
          </button>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 状态图标 - 默认隐藏，CSS可控制显示和位置 */}
          <button
            onClick={() => {
              playSystemSound()
              onStatusClick?.()
            }}
            className="chat-topbar-status-btn hidden items-center text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
          </button>
          {/* 更多菜单按钮 */}
          <button
            onClick={() => {
              playSystemSound()
              onMenuClick?.()
            }}
            className="chat-topbar-more-btn text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full"
          >
            {customIcons['chat-more'] ? (
              <img src={customIcons['chat-more']} alt="更多" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
