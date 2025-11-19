/**
 * 图标管理器
 * 用于获取和管理自定义应用图标
 */

interface IconConfig {
  appId: string
  appName: string
  defaultIcon: string
  customIcon?: string
}

// 应用ID映射（现在不需要映射了，因为ID已经对应）
const APP_ID_MAP: Record<string, string> = {}

/**
 * 获取应用的自定义图标
 * @param appId 应用ID
 * @returns 自定义图标的base64字符串，如果没有则返回null
 */
export const getCustomIcon = (appId: string): string | null => {
  try {
    const saved = localStorage.getItem('custom_icons')
    if (!saved) return null
    
    const configs: any[] = JSON.parse(saved)
    const mappedId = APP_ID_MAP[appId] || appId
    const config = configs.find(c => c.appId === mappedId)
    const iconData = config?.icon || config?.customIcon
    
    return iconData || null
  } catch (error) {
    console.error('获取自定义图标失败:', error)
    return null
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
