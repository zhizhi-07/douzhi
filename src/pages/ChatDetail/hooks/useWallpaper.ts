/**
 * 壁纸管理Hook
 */

import { useState, useEffect } from 'react'
import { getChatWallpaper, hasChatWallpaper } from '../../../utils/wallpaperManager'

export const useWallpaper = (chatId: string | undefined) => {
  // 🔥 是否有用户设置的聊天壁纸（用于决定是否覆盖全局壁纸）
  const [hasCustomWallpaper, setHasCustomWallpaper] = useState(() =>
    chatId ? hasChatWallpaper(chatId) : false
  )
  const [wallpaper, setWallpaper] = useState(() =>
    chatId ? getChatWallpaper(chatId) : null
  )
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState<string | null>(null)

  // 监听壁纸变化
  useEffect(() => {
    if (!chatId) return
    
    const checkWallpaper = async () => {
      // 🔥 检查是否有用户设置的壁纸
      const hasWallpaper = hasChatWallpaper(chatId)
      setHasCustomWallpaper(hasWallpaper)
      
      const wp = getChatWallpaper(chatId)
      setWallpaper(wp)
      
      // 如果是自定义壁纸，从IndexedDB加载图片
      if (wp && wp.type === 'custom') {
        const { getWallpaperImageUrl } = await import('../../../utils/wallpaperManager')
        const imageUrl = await getWallpaperImageUrl(chatId)
        setWallpaperImageUrl(imageUrl)
      } else {
        setWallpaperImageUrl(null)
      }
    }
    
    // 监听 storage 事件（其他标签页的修改）
    window.addEventListener('storage', checkWallpaper)
    
    // 监听自定义事件（当前标签页的修改）
    const handleWallpaperChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ chatId: string }>
      if (customEvent.detail.chatId === chatId) {
        checkWallpaper()
      }
    }
    window.addEventListener('chatWallpaperChanged', handleWallpaperChange)
    
    checkWallpaper()
    
    return () => {
      window.removeEventListener('storage', checkWallpaper)
      window.removeEventListener('chatWallpaperChanged', handleWallpaperChange)
    }
  }, [chatId])

  // 壁纸样式
  // 🔥 只有用户设置了聊天壁纸时才覆盖全局背景，否则让全局背景透过来
  const wallpaperStyle = (() => {
    // 如果没有用户设置的壁纸，返回空样式，让全局壁纸透过来
    if (!hasCustomWallpaper) {
      return {}
    }
    
    // 有用户设置的壁纸，需要覆盖全局背景
    const baseOverride = {
      position: 'relative' as const,
      zIndex: 1,
      isolation: 'isolate' as const,
    }
    
    const baseStyle = {
      ...baseOverride,
      backgroundColor: '#f5f7fa'
    }
    
    if (!wallpaper) return baseStyle
    
    // 自定义壁纸（图片）
    if (wallpaper.type === 'custom') {
      if (wallpaperImageUrl) {
        return {
          ...baseOverride,
          backgroundImage: `url(${wallpaperImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      } else {
        // 图片还在加载中
        return baseStyle
      }
    }
    
    // 预设壁纸（渐变或纯色）
    if (wallpaper.type === 'gradient') {
      return {
        ...baseOverride,
        background: wallpaper.value
      }
    } else if (wallpaper.type === 'solid') {
      return {
        ...baseOverride,
        backgroundColor: wallpaper.value
      }
    }
    
    return baseStyle
  })()

  return {
    wallpaper,
    wallpaperImageUrl,
    wallpaperStyle,
    hasCustomWallpaper  // 🔥 返回是否有自定义壁纸
  }
}
