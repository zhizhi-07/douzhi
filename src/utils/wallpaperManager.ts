/**
 * 壁纸管理器
 */

export interface Wallpaper {
  id: string
  type: 'gradient' | 'solid' | 'custom'
  value: string  // gradient: CSS渐变; solid: 颜色值; custom: 图片URL
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
 * 设置聊天壁纸
 */
export function setChatWallpaper(chatId: string, wallpaper: Wallpaper): boolean {
  try {
    localStorage.setItem(WALLPAPER_KEY_PREFIX + chatId, JSON.stringify(wallpaper))
    return true
  } catch (error) {
    console.error('保存壁纸失败:', error)
    return false
  }
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
