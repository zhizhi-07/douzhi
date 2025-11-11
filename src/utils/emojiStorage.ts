/**
 * 表情包存储工具
 * 使用IndexedDB存储表情包数据，支持更大的存储空间
 */

import * as IDB from './indexedDBStorage'

export interface Emoji {
  id: number
  url: string
  name: string
  description: string
  addTime: string
  useCount: number
}

const STORAGE_KEY = 'custom_emojis'

// 用于缓存数据，减少IndexedDB访问
let emojiCache: Emoji[] | null = null

/**
 * 清除缓存，强制下次从存储重新读取
 */
export function clearCache(): void {
  emojiCache = null
  console.log('🗑️ 表情包缓存已清除')
}

/**
 * 获取所有表情包
 */
export async function getEmojis(): Promise<Emoji[]> {
  try {
    // 如果有缓存，直接返回
    if (emojiCache !== null) {
      console.log('📦 从缓存读取表情包:', emojiCache.length, '个')
      return emojiCache
    }

    // 🔥 优先从 localStorage 读取（因为它是同步保存的，最可靠）
    const lsData = localStorage.getItem(STORAGE_KEY)
    if (lsData) {
      try {
        const result = JSON.parse(lsData)
        if (Array.isArray(result) && result.length > 0) {
          console.log('✅ 从localStorage读取表情包:', result.length, '个')
          emojiCache = result
          
          // 异步同步到 IndexedDB（作为备份）
          if (IDB.isIndexedDBAvailable()) {
            Promise.resolve().then(async () => {
              try {
                await IDB.setItem(STORAGE_KEY, result)
                console.log('✅ 已同步到IndexedDB备份')
              } catch (err) {
                console.warn('⚠️ 同步到IndexedDB失败:', err)
              }
            })
          }
          
          return result
        }
      } catch (parseError) {
        console.error('❌ localStorage数据解析失败:', parseError)
      }
    }

    // 如果 localStorage 没有数据，尝试从 IndexedDB 恢复
    if (IDB.isIndexedDBAvailable()) {
      const data = await IDB.getItem<Emoji[]>(STORAGE_KEY)
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ 从IndexedDB恢复表情包:', data.length, '个')
        emojiCache = data
        
        // 恢复到 localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          console.log('✅ 已恢复到localStorage')
        } catch (err) {
          console.warn('⚠️ 恢复到localStorage失败:', err)
        }
        
        return emojiCache
      }
    }

    console.log('📭 没有找到任何表情包数据')
    emojiCache = []
    return []
  } catch (error) {
    console.error('❌ 读取表情包失败:', error)
    return []
  }
}

/**
 * 保存表情包列表
 */
export async function saveEmojis(emojis: Emoji[]): Promise<boolean> {
  try {
    // 🔥 关键修复：先同步保存到 localStorage，确保数据不会丢失
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emojis))
      console.log('✅ 表情包已同步保存到localStorage:', emojis.length, '个')
    } catch (lsError) {
      console.error('❌ localStorage保存失败:', lsError)
      // localStorage 是主要的持久化存储，如果失败就抛出错误
      if (lsError instanceof Error && lsError.name === 'QuotaExceededError') {
        throw new Error('存储空间不足，请尝试删除一些不常用的表情包')
      }
      throw lsError
    }
    
    // 更新缓存（在 localStorage 保存成功后立即更新）
    emojiCache = emojis
    
    // 然后异步保存到 IndexedDB（作为额外的备份）
    if (IDB.isIndexedDBAvailable()) {
      // 使用 Promise.resolve().then() 让 IndexedDB 写入在下一个事件循环中执行
      // 这样即使用户立即关闭页面，localStorage 的数据也已经保存了
      Promise.resolve().then(async () => {
        try {
          await IDB.setItem(STORAGE_KEY, emojis)
          console.log('✅ 表情包已异步备份到IndexedDB:', emojis.length, '个')
        } catch (idbError) {
          console.warn('⚠️ IndexedDB备份失败（不影响使用）:', idbError)
        }
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ 保存表情包失败:', error)
    
    // 如果是配额超出错误，给出更明确的提示
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('存储空间不足，请尝试删除一些不常用的表情包')
    }
    
    return false
  }
}

/**
 * 添加表情包
 */
export async function addEmoji(emoji: Omit<Emoji, 'id' | 'addTime' | 'useCount'>): Promise<Emoji> {
  const emojis = await getEmojis()
  const newEmoji: Emoji = {
    ...emoji,
    id: Date.now(),
    addTime: new Date().toISOString(),
    useCount: 0
  }
  
  emojis.push(newEmoji)
  await saveEmojis(emojis)
  
  return newEmoji
}

/**
 * 删除表情包
 */
export async function deleteEmoji(id: number): Promise<boolean> {
  try {
    const emojis = await getEmojis()
    const filtered = emojis.filter(e => e.id !== id)
    await saveEmojis(filtered)
    return true
  } catch (error) {
    console.error('删除表情包失败:', error)
    return false
  }
}

/**
 * 增加使用次数
 */
export async function incrementUseCount(id: number): Promise<void> {
  try {
    const emojis = await getEmojis()
    const emoji = emojis.find(e => e.id === id)
    if (emoji) {
      emoji.useCount = (emoji.useCount || 0) + 1
      await saveEmojis(emojis)
    }
  } catch (error) {
    console.error('更新使用次数失败:', error)
  }
}

/**
 * 导出表情包数据
 */
export async function exportEmojis(): Promise<string> {
  const emojis = await getEmojis()
  const exportData = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    count: emojis.length,
    emojis: emojis
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 导入表情包数据
 */
export async function importEmojis(
  jsonData: string,
  replaceMode: boolean = false
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const importData = JSON.parse(jsonData)
    
    if (!importData.emojis || !Array.isArray(importData.emojis)) {
      return { success: false, count: 0, message: '导入文件格式不正确' }
    }
    
    let finalEmojis: Emoji[]
    let actualImported = 0
    let originalCount = 0
    
    if (replaceMode) {
      finalEmojis = importData.emojis
      actualImported = finalEmojis.length
    } else {
      const currentEmojis = await getEmojis()
      originalCount = currentEmojis.length
      
      // 合并去重
      const mergedEmojis = [...currentEmojis, ...importData.emojis]
      const uniqueEmojis: Emoji[] = []
      const urlSet = new Set<string>()
      
      mergedEmojis.forEach(emoji => {
        if (!urlSet.has(emoji.url)) {
          urlSet.add(emoji.url)
          uniqueEmojis.push(emoji)
        }
      })
      
      finalEmojis = uniqueEmojis
      actualImported = finalEmojis.length - originalCount
    }
    
    const saved = await saveEmojis(finalEmojis)
    
    if (saved) {
      const modeText = replaceMode ? '替换导入' : '追加导入'
      return {
        success: true,
        count: actualImported,
        message: `✅ 成功${modeText} ${actualImported} 个表情包！\n\n${replaceMode ? '' : `原有: ${originalCount} 个\n`}总计: ${finalEmojis.length} 个`
      }
    } else {
      return { success: false, count: 0, message: '保存失败' }
    }
  } catch (error) {
    console.error('导入错误:', error)
    return {
      success: false,
      count: 0,
      message: `导入失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 清空所有表情包
 */
export async function clearAllEmojis(): Promise<boolean> {
  try {
    // 尝试从IndexedDB删除
    if (IDB.isIndexedDBAvailable()) {
      await IDB.removeItem(STORAGE_KEY)
      console.log('已清空IndexedDB中的表情包')
    }

    // 同时清除localStorage（兼容性处理）
    localStorage.removeItem(STORAGE_KEY)
    console.log('已清空localStorage中的表情包')
    
    // 清除缓存（设为null而不是空数组，下次会重新加载）
    emojiCache = null
    
    return true
  } catch (error) {
    console.error('清空表情包失败:', error)
    return false
  }
}

/**
 * 获取存储使用情况统计（仅供参考）
 */
export async function getStorageInfo(): Promise<{ count: number; estimatedSize: string }> {
  try {
    const emojis = await getEmojis()
    const jsonString = JSON.stringify(emojis)
    const sizeInBytes = new Blob([jsonString]).size
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
    
    return {
      count: emojis.length,
      estimatedSize: `${sizeInMB} MB`
    }
  } catch (error) {
    console.error('获取存储信息失败:', error)
    return { count: 0, estimatedSize: '0 MB' }
  }
}
