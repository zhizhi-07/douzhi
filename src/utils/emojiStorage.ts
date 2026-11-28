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
  tag?: string  // 分类标签，如"可爱"、"小狗"等
}

const STORAGE_KEY = 'custom_emojis'
const USE_COUNTS_KEY = 'emoji_use_counts'
const REVISION_KEY = 'emoji_library_revision'
function notifyLibraryChanged() {
  try { localStorage.setItem(REVISION_KEY, `${Date.now()}_${Math.random()}`) } catch {}
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === REVISION_KEY || event.key === null) clearCache()
})
let loadPromise: Promise<Emoji[]> | null = null
let useCounts: Record<string, number> = {}
let countWrites: Promise<void> = Promise.resolve()

// 用于缓存数据，减少IndexedDB访问
let emojiCache: Emoji[] | null = null

// ID计数器，确保唯一性
let idCounter = 0

/**
 * 生成唯一ID
 */
function generateUniqueId(): number {
  idCounter++
  return Date.now() * 1000 + idCounter
}

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
async function loadEmojis(): Promise<Emoji[]> {
  try {
    // 如果有缓存，直接返回
    if (emojiCache !== null) {
      console.log('📦 从缓存读取表情包:', emojiCache.length, '个')
      return emojiCache
    }

    // 🔥 优先从 IndexedDB 读取（支持大文件）
    if (IDB.isIndexedDBAvailable()) {
      const data = await IDB.getItem<Emoji[]>(STORAGE_KEY)
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ 从IndexedDB读取表情包:', data.length, '个')
        emojiCache = data
        return emojiCache
      }
    }

    // 如果 IndexedDB 没有数据，尝试从 localStorage 迁移
    const lsData = localStorage.getItem(STORAGE_KEY)
    if (lsData) {
      try {
        const result = JSON.parse(lsData)
        if (Array.isArray(result) && result.length > 0) {
          console.log('📦 从localStorage迁移表情包:', result.length, '个')
          emojiCache = result
          
          // 迁移到 IndexedDB
          if (IDB.isIndexedDBAvailable()) {
            try {
              await IDB.setItem(STORAGE_KEY, result)
              console.log('✅ 已迁移到IndexedDB')
              // 迁移后清理localStorage释放空间
              localStorage.removeItem(STORAGE_KEY)
              console.log('🗑️ 已清理localStorage旧数据')
            } catch (err) {
              console.warn('⚠️ 迁移到IndexedDB失败:', err)
            }
          }
          
          return result
        }
      } catch (parseError) {
        console.error('❌ localStorage数据解析失败:', parseError)
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

/** Share the cold read among message bubbles and reuse decoded image strings on reopen. */
export function getEmojis(): Promise<Emoji[]> {
  if (loadPromise) return loadPromise
  if (emojiCache !== null) return Promise.resolve(emojiCache)
  loadPromise = loadEmojis().then(async emojis => {
    let storedCounts: unknown = null
    try {
      storedCounts = IDB.isIndexedDBAvailable() ? await IDB.getItem(USE_COUNTS_KEY) : JSON.parse(localStorage.getItem(USE_COUNTS_KEY) || '{}')
    } catch (error) { console.warn('使用次数无法读取，继续显示表情库:', error) }
    useCounts = storedCounts && typeof storedCounts === 'object' && !Array.isArray(storedCounts)
      ? Object.fromEntries(Object.entries(storedCounts).filter(([, count]) => Number.isSafeInteger(count) && Number(count) >= 0)) : {}
    emojiCache = emojis.map(emoji => useCounts[emoji.id] > emoji.useCount ? { ...emoji, useCount: useCounts[emoji.id] } : emoji)
    return emojiCache
  }).finally(() => { loadPromise = null })
  return loadPromise
}

/**
 * 保存表情包列表
 */
export async function saveEmojis(emojis: Emoji[]): Promise<boolean> {
  try {
    // 🔥 主要存储：IndexedDB（支持大文件）
    if (IDB.isIndexedDBAvailable()) {
      await IDB.setItem(STORAGE_KEY, emojis)
      console.log('✅ 表情包已保存到IndexedDB:', emojis.length, '个')
    } else {
      // IndexedDB 不可用，降级到 localStorage
      console.warn('⚠️ IndexedDB不可用，使用localStorage')
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emojis))
        console.log('✅ 表情包已保存到localStorage:', emojis.length, '个')
      } catch (lsError) {
        console.error('❌ localStorage保存失败:', lsError)
        if (lsError instanceof Error && lsError.name === 'QuotaExceededError') {
          throw new Error('存储空间不足，请尝试删除一些不常用的表情包。建议使用现代浏览器以获得更大存储空间')
        }
        throw lsError
      }
    }
    
    // 更新缓存
    emojiCache = emojis
    notifyLibraryChanged()
    
    return true
  } catch (error) {
    console.error('❌ 保存表情包失败:', error)
    
    // 如果是配额超出错误，给出更明确的提示
    if (error instanceof Error && error.message.includes('存储空间不足')) {
      throw error
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
    id: generateUniqueId(),
    addTime: new Date().toISOString(),
    useCount: 0
  }
  
  emojis.push(newEmoji)
  await saveEmojis(emojis)
  
  return newEmoji
}

/**
 * 批量添加表情包（带标签）
 */
export async function addEmojisWithTag(emojiDataList: Array<{url: string, name: string, description: string}>, tag: string): Promise<number> {
  const emojis = await getEmojis()
  const existingUrls = new Set(emojis.map(e => e.url))
  let addedCount = 0
  
  for (let i = 0; i < emojiDataList.length; i++) {
    const data = emojiDataList[i]
    // 跳过已存在的URL
    if (existingUrls.has(data.url)) continue
    
    const newEmoji: Emoji = {
      id: generateUniqueId(),
      url: data.url,
      name: data.name,
      description: data.description,
      addTime: new Date().toISOString(),
      useCount: 0,
      tag: tag || undefined
    }
    emojis.push(newEmoji)
    existingUrls.add(data.url)
    addedCount++
  }
  
  await saveEmojis(emojis)
  return addedCount
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<string[]> {
  const emojis = await getEmojis()
  const tags = new Set<string>()
  emojis.forEach(e => {
    if (e.tag) tags.add(e.tag)
  })
  return Array.from(tags).sort()
}

/**
 * 更新表情包标签
 */
export async function updateEmojiTag(id: number, tag: string | undefined): Promise<boolean> {
  try {
    const emojis = await getEmojis()
    const emoji = emojis.find(e => e.id === id)
    if (emoji) {
      emoji.tag = tag
      await saveEmojis(emojis)
      return true
    }
    return false
  } catch (error) {
    console.error('更新表情包标签失败:', error)
    return false
  }
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
 * 更新表情包
 */
export async function updateEmoji(id: number, updates: Partial<Pick<Emoji, 'name' | 'description' | 'url'>>): Promise<boolean> {
  try {
    const emojis = await getEmojis()
    const emoji = emojis.find(e => e.id === id)
    if (emoji) {
      if (updates.name !== undefined) emoji.name = updates.name
      if (updates.description !== undefined) emoji.description = updates.description
      if (updates.url !== undefined) emoji.url = updates.url
      await saveEmojis(emojis)
      return true
    }
    return false
  } catch (error) {
    console.error('更新表情包失败:', error)
    return false
  }
}

/**
 * 增加使用次数
 */
export function incrementUseCount(id: number): Promise<void> {
  // Serialize the metadata update as well as its write, so rapid taps retain every count.
  countWrites = countWrites.catch(() => {}).then(async () => {
    const emojis = await getEmojis()
    const emoji = emojis.find(item => item.id === id)
    if (!emoji) return
    const count = (emoji.useCount || 0) + 1
    emojiCache = emojis.map(item => item.id === id ? { ...item, useCount: count } : item)
    useCounts = { ...useCounts, [id]: count }
    // Never rewrite the library's base64/GIF payload for a tap.
    if (IDB.isIndexedDBAvailable()) await IDB.setItem(USE_COUNTS_KEY, useCounts)
    else localStorage.setItem(USE_COUNTS_KEY, JSON.stringify(useCounts))
  })
  return countWrites
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
    
    // 支持多种格式
    let emojisToImport: any[]
    
    if (Array.isArray(importData)) {
      // 格式1: 直接是数组 [{url, name, description}, ...]
      emojisToImport = importData
    } else if (importData.emojis && Array.isArray(importData.emojis)) {
      // 格式2: {emojis: [...]}
      emojisToImport = importData.emojis
    } else {
      return { success: false, count: 0, message: '导入文件格式不正确，需要数组或包含emojis字段的对象' }
    }
    
    // 转换为标准格式
    const standardEmojis: Emoji[] = emojisToImport.map((item, index) => ({
      id: item.id || generateUniqueId(),
      url: item.url || item.file || item.image || item.src || '',
      name: item.name || item.title || `表情${index + 1}`,
      description: item.description || item.desc || item.name || item.title || `表情${index + 1}`,
      addTime: item.addTime || new Date().toISOString(),
      useCount: item.useCount || 0,
      tag: item.tag || item.category || undefined  // 支持导入标签
    })).filter(e => e.url) // 过滤掉没有url的
    
    if (standardEmojis.length === 0) {
      return { success: false, count: 0, message: '没有找到有效的表情包数据' }
    }
    
    let finalEmojis: Emoji[]
    let actualImported = 0
    let originalCount = 0
    
    if (replaceMode) {
      finalEmojis = standardEmojis
      actualImported = finalEmojis.length
    } else {
      const currentEmojis = await getEmojis()
      originalCount = currentEmojis.length
      
      // 合并去重
      const mergedEmojis = [...currentEmojis, ...standardEmojis]
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
      await countWrites.catch(() => {})
      await IDB.removeItem(STORAGE_KEY)
      await IDB.removeItem(USE_COUNTS_KEY)
      console.log('已清空IndexedDB中的表情包')
    }

    // 同时清除localStorage（兼容性处理）
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(USE_COUNTS_KEY)
    useCounts = {}
    console.log('已清空localStorage中的表情包')
    
    // 清除缓存（设为null而不是空数组，下次会重新加载）
    emojiCache = null
    notifyLibraryChanged()
    
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
