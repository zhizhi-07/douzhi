/**
 * 图标管理器
 * 用于获取和管理自定义应用图标
 */

import { getDesktopIcon } from './iconStorage'

interface IconConfig {
  appId: string
  appName: string
  defaultIcon: string
  customIcon?: string
}

// 应用ID映射（现在不需要映射了，因为ID已经对应）
const APP_ID_MAP: Record<string, string> = {}

// 缓存IndexedDB中的图标
let iconCache: Record<string, string> = {}

/**
 * 获取应用的自定义图标（同步版本，用于向后兼容）
 * @param appId 应用ID
 * @returns 自定义图标的base64字符串，如果没有则返回null
 */
export const getCustomIcon = (appId: string): string | null => {
  try {
    // 优先从缓存读取
    if (iconCache[appId]) {
      return iconCache[appId]
    }
    
    // 从 localStorage 读取（旧数据）
    const saved = localStorage.getItem('custom_icons')
    if (saved) {
      const configs: any[] = JSON.parse(saved)
      const mappedId = APP_ID_MAP[appId] || appId
      const config = configs.find(c => c.appId === mappedId)
      const iconData = config?.icon || config?.customIcon
      
      if (iconData) {
        iconCache[appId] = iconData
        return iconData
      }
    }
    
    // 从sessionStorage缓存读取
    const preloaded = sessionStorage.getItem('__preloaded_icons__')
    if (preloaded) {
      const icons = JSON.parse(preloaded)
      if (icons[appId]) {
        iconCache[appId] = icons[appId]
        return icons[appId]
      }
    }
    
    return null
  } catch (error) {
    console.error('获取自定义图标失败:', error)
    return null
  }
}

/**
 * 异步获取应用的自定义图标（从IndexedDB）
 * @param appId 应用ID
 * @returns 自定义图标的base64字符串，如果没有则返回null
 */
export const getCustomIconAsync = async (appId: string): Promise<string | null> => {
  try {
    // 优先从缓存读取
    if (iconCache[appId]) {
      return iconCache[appId]
    }
    
    // 从 IndexedDB 读取
    const icon = await getDesktopIcon(appId)
    if (icon) {
      iconCache[appId] = icon
      console.log(`✅ 从IndexedDB获取桌面图标: ${appId}`)
      return icon
    }
    
    // 回退到同步方法
    return getCustomIcon(appId)
  } catch (error) {
    console.error('异步获取自定义图标失败:', error)
    return getCustomIcon(appId)
  }
}

/**
 * 预加载所有桌面图标到缓存
 */
export const preloadDesktopIcons = async (): Promise<void> => {
  try {
    const { getAllDesktopIcons } = await import('./iconStorage')
    const icons = await getAllDesktopIcons()
    icons.forEach(item => {
      if (item.icon) {
        iconCache[item.appId] = item.icon
      }
    })
    console.log(`✅ 预加载了 ${icons.length} 个桌面图标到缓存`)
  } catch (error) {
    console.error('预加载桌面图标失败:', error)
  }
}

/**
 * 检查应用是否有自定义图标
 * @param appId 应用ID
 * @returns 是否有自定义图标
 */
export const hasCustomIcon = (appId: string): boolean => {
  return getCustomIcon(appId) !== null
}
