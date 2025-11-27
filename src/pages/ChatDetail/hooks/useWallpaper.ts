/**
 * 壁纸管理Hook
 */

import { useState, useEffect } from 'react'
import { getChatWallpaper, getWallpaperStyle } from '../../../utils/wallpaperManager'

export const useWallpaper = (chatId: string | undefined) => {
  const [wallpaper, setWallpaper] = useState(() =>
    chatId ? getChatWallpaper(chatId) : null
  )
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState<string | null>(null)

  // 监听壁纸变化
  useEffect(() => {
    if (!chatId) return
    
    const checkWallpaper = async () => {
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
  const wallpaperStyle = (() => {
    if (!wallpaper) return { backgroundColor: '#f5f7fa' }
    
    if (wallpaper.type === 'custom' && wallpaperImageUrl) {
      return {
        backgroundImage: `url(${wallpaperImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    
    return getWallpaperStyle(wallpaper)
  })()

  return {
    wallpaper,
    wallpaperImageUrl,
    wallpaperStyle
  }
}
