/**
 * 壁纸管理器（使用IndexedDB存储图片）
 */

export interface Wallpaper {
  id: string
  type: 'gradient' | 'solid' | 'custom'
  value: string  // gradient: CSS渐变; solid: 颜色值; custom: IndexedDB key
  name: string
}

// 预设壁纸
export const presetWallpapers: Wallpaper[] = [
  {
    id: 'default',
    type: 'gradient',
    value: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)',
    name: '默认灰'
  },
  {
    id: 'blue',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    name: '紫蓝渐变'
  },
  {
    id: 'pink',
    type: 'gradient',
    value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    name: '粉红渐变'
  },
  {
    id: 'green',
    type: 'gradient',
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    name: '青绿渐变'
  },
  {
    id: 'orange',
    type: 'gradient',
    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    name: '橙黄渐变'
  },
  {
    id: 'night',
    type: 'gradient',
    value: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    name: '深色夜间'
  },
  {
    id: 'white',
    type: 'solid',
    value: '#ffffff',
    name: '纯白色'
  },
  {
    id: 'light-gray',
    type: 'solid',
    value: '#f5f5f5',
    name: '浅灰色'
  }
]

const WALLPAPER_KEY_PREFIX = 'chat_wallpaper_'
const WALLPAPER_IMAGE_PREFIX = 'wallpaper_img_'

/**
 * 清除聊天壁纸（恢复默认）
 */
export async function clearChatWallpaper(chatId: string): Promise<boolean> {
  try {
    // 删除localStorage中的壁纸元数据
    localStorage.removeItem(WALLPAPER_KEY_PREFIX + chatId)
    
    // 删除IndexedDB中的自定义图片
    const imageKey = WALLPAPER_IMAGE_PREFIX + chatId
    try {
      const { deleteFromIndexedDB } = await import('./unifiedStorage')
      await deleteFromIndexedDB('IMAGES', imageKey)
    } catch (e) {
      // 图片可能不存在，忽略错误
      console.log('清除壁纸图片:', e)
    }
    
    return true
  } catch (error) {
    console.error('清除壁纸失败:', error)
    return false
  }
}

/**
 * 检查是否有用户设置的聊天壁纸
 */
export function hasChatWallpaper(chatId: string): boolean {
  try {
    const saved = localStorage.getItem(WALLPAPER_KEY_PREFIX + chatId)
    return !!saved
  } catch {
    return false
  }
}

/**
 * 获取聊天壁纸
 */
export function getChatWallpaper(chatId: string): Wallpaper {
  try {
    const saved = localStorage.getItem(WALLPAPER_KEY_PREFIX + chatId)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('读取壁纸失败:', error)
  }
  return presetWallpapers[0] // 默认壁纸
}

/**
 * 设置聊天壁纸（图片保存到IndexedDB）
 */
export async function setChatWallpaper(chatId: string, wallpaper: Wallpaper): Promise<boolean> {
  try {
    // 如果是自定义图片，先保存图片到IndexedDB
    if (wallpaper.type === 'custom' && wallpaper.value.startsWith('data:')) {
      const imageKey = WALLPAPER_IMAGE_PREFIX + chatId
      const { saveImage } = await import('./unifiedStorage')
      await saveImage(imageKey, wallpaper.value)
      
      // 保存元数据时，value存储IndexedDB的key
      const metadata: Wallpaper = {
        ...wallpaper,
        value: imageKey
      }
      localStorage.setItem(WALLPAPER_KEY_PREFIX + chatId, JSON.stringify(metadata))
    } else {
      // 渐变和纯色直接保存到localStorage
      localStorage.setItem(WALLPAPER_KEY_PREFIX + chatId, JSON.stringify(wallpaper))
    }
    return true
  } catch (error) {
    console.error('保存壁纸失败:', error)
    return false
  }
}

/**
 * 获取壁纸图片URL（从IndexedDB）
 */
export async function getWallpaperImageUrl(chatId: string): Promise<string | null> {
  try {
    const wallpaper = getChatWallpaper(chatId)
    if (wallpaper.type === 'custom') {
      const { getImage } = await import('./unifiedStorage')
      return await getImage(wallpaper.value)
    }
  } catch (error) {
    console.error('获取壁纸图片失败:', error)
  }
  return null
}

/**
 * 创建自定义壁纸
 */
export function createCustomWallpaper(imageUrl: string): Wallpaper {
  return {
    id: 'custom_' + Date.now(),
    type: 'custom',
    value: imageUrl,
    name: '自定义图片'
  }
}

/**
 * 获取壁纸CSS样式
 */
export function getWallpaperStyle(wallpaper: Wallpaper): Record<string, string> {
  if (wallpaper.type === 'custom') {
    return {
      backgroundImage: `url(${wallpaper.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else if (wallpaper.type === 'gradient') {
    return {
      background: wallpaper.value
    }
  } else {
    return {
      backgroundColor: wallpaper.value
    }
  }
}
