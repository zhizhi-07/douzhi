/**
 * 存储迁移工具
 * 将localStorage中的表情包数据迁移到IndexedDB
 */

import * as IDB from './indexedDBStorage'
import type { Emoji } from './emojiStorage'

const STORAGE_KEY = 'custom_emojis'

/**
 * 检查是否需要迁移数据
 */
export async function needsMigration(): Promise<boolean> {
  try {
    // 检查localStorage中是否有数据
    const localData = localStorage.getItem(STORAGE_KEY)
    if (!localData) {
      return false
    }

    // 检查IndexedDB中是否已有数据
    if (IDB.isIndexedDBAvailable()) {
      const idbData = await IDB.getItem<Emoji[]>(STORAGE_KEY)
      return !idbData || idbData.length === 0
    }

    return false
  } catch (error) {
    console.error('检查迁移需求时出错:', error)
    return false
  }
}

/**
 * 执行数据迁移
 */
export async function migrateToIndexedDB(): Promise<{ success: boolean; message: string }> {
  try {
    // 从localStorage读取数据
    const localData = localStorage.getItem(STORAGE_KEY)
    if (!localData) {
      return { success: false, message: '没有需要迁移的数据' }
    }

    const emojis: Emoji[] = JSON.parse(localData)

    // 保存到IndexedDB
    if (IDB.isIndexedDBAvailable()) {
      await IDB.setItem(STORAGE_KEY, emojis)
      console.log(`成功迁移 ${emojis.length} 个表情包到IndexedDB`)
      return {
        success: true,
        message: `成功迁移 ${emojis.length} 个表情包到新存储系统`
      }
    } else {
      return { success: false, message: 'IndexedDB不可用' }
    }
  } catch (error) {
    console.error('迁移数据时出错:', error)
    return {
      success: false,
      message: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 自动执行迁移（如果需要）
 */
export async function autoMigrate(): Promise<void> {
  const needs = await needsMigration()
  if (needs) {
    const result = await migrateToIndexedDB()
    if (result.success) {
      console.log('✅ 自动迁移完成:', result.message)
    } else {
      console.warn('⚠️ 自动迁移失败:', result.message)
    }
  }
}
