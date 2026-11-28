import { loadAvatarFrameSettings } from '../utils/avatarFrameStorage'
/**
 * 头像组件
 * 统一的头像显示组件，避免代码重复
 * 支持自定义头像框
 */

import React, { useState, useEffect } from 'react'
import { getCurrentUserInfoWithAvatar } from '../utils/userUtils'

// 🔥 模块级缓存：避免每个 Avatar 实例都从 IndexedDB 读取头像
let cachedUserAvatar: string | undefined = undefined
let avatarCacheGeneration = 0
let avatarLoadPromise: Promise<string | undefined> | null = null

// 获取缓存的用户头像（带去重）
async function getCachedUserAvatar(): Promise<string | undefined> {
  if (cachedUserAvatar !== undefined) {
    return cachedUserAvatar
  }
  
  // 防止并发请求
  if (avatarLoadPromise) {
    return avatarLoadPromise
  }
  
  const generation = avatarCacheGeneration
  const promise = getCurrentUserInfoWithAvatar().then(info => {
    if (generation === avatarCacheGeneration) cachedUserAvatar = info.avatar
    return info.avatar
  }).finally(() => { if (avatarLoadPromise === promise) avatarLoadPromise = null })
  avatarLoadPromise = promise

  return avatarLoadPromise
}

// 清除缓存（切换账号/面具时调用）
function clearUserAvatarCache() {
  avatarCacheGeneration++
  cachedUserAvatar = undefined
  avatarLoadPromise = null
}

window.addEventListener('avatar-updated', clearUserAvatarCache)
window.addEventListener('accountSwitched', clearUserAvatarCache)
window.addEventListener('accountUpdated', clearUserAvatarCache)
window.addEventListener('user-info-updated', clearUserAvatarCache)

interface AvatarProps {
  type: 'sent' | 'received'
  avatar?: string
  name: string
  chatId?: string
  onPoke?: () => void  // 拍一拍回调
  size?: 'sm' | 'md' | 'lg' | 'xl' | number // 支持预设尺寸或自定义数值
}

const Avatar = ({ type, avatar, name, chatId, onPoke, size = 'md' }: AvatarProps) => {
  const [frameCSS, setFrameCSS] = useState('')
  const [shape, setShape] = useState('rounded')
  const [frameImage, setFrameImage] = useState('')
  const [frameSize, setFrameSize] = useState(120)
  const [frameOffsetX, setFrameOffsetX] = useState(0)
  const [frameOffsetY, setFrameOffsetY] = useState(0)
  const [avatarSizePercent, setAvatarSizePercent] = useState(100)
  const [hideAvatar, setHideAvatar] = useState(false)

  // 计算实际尺寸（应用用户设置的百分比）
  const basePxSize = typeof size === 'number' ? size : 
    size === 'sm' ? 24 : 
    size === 'md' ? 32 : 
    size === 'lg' ? 64 : 
    size === 'xl' ? 96 : 32
  
  // 应用头像大小百分比（只在有chatId时生效，即聊天页面）
  const pxSize = chatId ? Math.round(basePxSize * avatarSizePercent / 100) : basePxSize
  const sizeStyle = { width: `${pxSize}px`, height: `${pxSize}px` }

  // 加载头像框样式和形状
  useEffect(() => {
    if (!chatId) return

    let generation = 0
    const loadFrameStyle = async () => {
      const request = ++generation
      const values = await loadAvatarFrameSettings(chatId)
      if (request !== generation) return
      const readSetting = (key: string) => values[key] ?? null
      const prefix = type === 'sent' ? 'user' : 'ai'
      const cssKey = `${prefix}_avatar_frame_${chatId}`
      const css = readSetting(cssKey) || ''
      const avatarShape = readSetting(`avatar_shape_${chatId}`) || 'rounded'
      
      // 独立的头像框图片设置（用户和AI分开）
      const image = readSetting(`${prefix}_avatar_frame_image_${chatId}`) || readSetting(`avatar_frame_image_${chatId}`) || ''
      const size = parseInt(readSetting(`${prefix}_avatar_frame_size_${chatId}`) || readSetting(`avatar_frame_size_${chatId}`) || '120')
      const offsetX = parseInt(readSetting(`${prefix}_avatar_frame_offset_x_${chatId}`) || readSetting(`avatar_frame_offset_x_${chatId}`) || '0')
      const offsetY = parseInt(readSetting(`${prefix}_avatar_frame_offset_y_${chatId}`) || readSetting(`avatar_frame_offset_y_${chatId}`) || '0')
      const avatarSizeSaved = parseInt(readSetting(`avatar_size_${chatId}`) || '100')
      const hideAvatarSaved = readSetting(`hide_avatar_${chatId}`) === 'true'
      
      setFrameCSS(css)
      setShape(avatarShape)
      setFrameImage(image)
      setFrameSize(size)
      setFrameOffsetX(offsetX)
      setFrameOffsetY(offsetY)
      setAvatarSizePercent(avatarSizeSaved)
      setHideAvatar(hideAvatarSaved)
    }

    void loadFrameStyle().catch(console.error)

    // 监听头像框更新
    const handleFrameUpdate = () => {
      void loadFrameStyle().catch(console.error)
    }

    window.addEventListener('avatarFrameUpdate', handleFrameUpdate)
    return () => {
      generation++
      window.removeEventListener('avatarFrameUpdate', handleFrameUpdate)
    }
  }, [chatId, type])
  
  // 根据形状选择className
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  // 🔥 异步加载用户头像（支持面具）
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    if (type === 'sent') {
      let generation = 0
      let active = true
      const loadAvatar = async () => {
        const request = ++generation
        // 🎭 检查是否使用面具
        if (chatId) {
          const chatSettingsRaw = localStorage.getItem(`chat_settings_${chatId}`)
          if (chatSettingsRaw) {
            try {
              const parsed = JSON.parse(chatSettingsRaw)
              if (parsed.useMask && parsed.maskId) {
                // 使用面具头像
                const { getMasksWithAvatars } = await import('../utils/maskManager')
                const masks = await getMasksWithAvatars()
                const mask = masks.find(m => m.id === parsed.maskId)
                if (mask?.avatar) {
                  if (active && request === generation) setUserAvatar(mask.avatar)
                  return
                }
              }
            } catch (e) {
              console.error('[Avatar] 解析聊天设置失败:', e)
            }
          }
        }
        
        // 🔥 使用缓存获取用户头像，避免重复读取 IndexedDB
        const avatar = await getCachedUserAvatar()
        if (active && request === generation) setUserAvatar(avatar)
      }
      
      void loadAvatar().catch(console.error)
      
      // 监听账号切换事件和面具切换事件，清除缓存并重新加载头像
      const handleAvatarReload = () => {
        clearUserAvatarCache()  // 🔥 清除缓存
        void loadAvatar().catch(console.error)
      }
      window.addEventListener('avatar-updated', handleAvatarReload)
      window.addEventListener('user-info-updated', handleAvatarReload)
      window.addEventListener('accountSwitched', handleAvatarReload)
      window.addEventListener('accountUpdated', handleAvatarReload)
      window.addEventListener('maskSwitched', handleAvatarReload)
      window.addEventListener('maskUpdated', handleAvatarReload)
      return () => {
        active = false
        generation++
        window.removeEventListener('avatar-updated', handleAvatarReload)
        window.removeEventListener('user-info-updated', handleAvatarReload)
        window.removeEventListener('accountSwitched', handleAvatarReload)
        window.removeEventListener('accountUpdated', handleAvatarReload)
        window.removeEventListener('maskSwitched', handleAvatarReload)
        window.removeEventListener('maskUpdated', handleAvatarReload)
      }
    }
  }, [type, chatId])

  // 如果设置了隐藏头像，返回null
  if (hideAvatar && chatId) {
    return null
  }

  if (type === 'sent') {
    // 用户头像 - 从 IndexedDB 异步加载
    return (
      <>
        {frameCSS && chatId && <style>{`.avatar-frame-user-${chatId} { ${frameCSS} }`}</style>}
        <div className="relative overflow-visible">
          <div 
            className={`${chatId && frameCSS ? `avatar-frame-user-${chatId}` : ''} ${shapeClass} bg-gray-300 flex items-center justify-center ${frameCSS ? '' : 'overflow-hidden'}`}
            style={sizeStyle}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-3/5 h-3/5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          {frameImage && (
            <img 
              src={frameImage} 
              alt="装饰框" 
              className="absolute top-1/2 left-1/2 pointer-events-none z-10"
              style={{
                width: `${pxSize * frameSize / 100}px`,
                height: `${pxSize * frameSize / 100}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </>
    )
  }

  // AI头像
  return (
    <>
      {frameCSS && chatId && <style>{`.avatar-frame-ai-${chatId} { ${frameCSS} }`}</style>}
      <div className="relative overflow-visible" style={{ animation: 'none', transition: 'none' }}>
        <div 
          className={`${chatId && frameCSS ? `avatar-frame-ai-${chatId}` : ''} ${shapeClass} bg-gray-200 flex items-center justify-center ${frameCSS ? '' : 'overflow-hidden'} ${onPoke ? 'cursor-pointer' : ''}`}
          onDoubleClick={onPoke}
          style={{ ...sizeStyle, animation: 'none', transition: 'none' }}
        >
          {avatar ? (
            <img 
              src={avatar} 
              alt={name} 
              className="w-full h-full object-cover"
              style={{ animation: 'none', transition: 'none' }}  // 🔥 禁用动画
            />
          ) : (
            <svg className="w-3/5 h-3/5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
        {frameImage && (
          <img 
            src={frameImage} 
            alt="装饰框" 
            className="absolute top-1/2 left-1/2 pointer-events-none z-10"
            style={{
              width: `${pxSize * frameSize / 100}px`,
              height: `${pxSize * frameSize / 100}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
              objectFit: 'contain'
            }}
          />
        )}
      </div>
    </>
  )
}

// 🔥 使用 React.memo 避免不必要的重渲染
export default React.memo(Avatar, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.name === nextProps.name &&
    prevProps.chatId === nextProps.chatId &&
    prevProps.size === nextProps.size
  )
})
