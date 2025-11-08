/**
 * localStorage 到 IndexedDB 迁移工具
 * 一次性迁移所有数据
 */

import * as IDB from './indexedDBManager'

const MIGRATION_KEY = 'indexeddb_migration_completed'
const MIGRATION_VERSION = '1.0'

/**
 * 检查是否需要迁移
 */
export function needsMigration(): boolean {
  const completed = localStorage.getItem(MIGRATION_KEY)
  return completed !== MIGRATION_VERSION
}

/**
 * 执行完整迁移
 */
export async function migrateAllData(): Promise<void> {
  console.log('🚀 开始迁移所有localStorage数据到IndexedDB...')
  
  try {
    const startTime = Date.now()
    let totalItems = 0

    // 1. 迁移聊天消息
    console.log('📨 迁移聊天消息...')
    const messageCount = await migrateMessages()
    totalItems += messageCount
    console.log(`✅ 已迁移 ${messageCount} 个聊天记录`)

    // 2. 迁移朋友圈
    console.log('📷 迁移朋友圈...')
    const momentsData = localStorage.getItem('moments')
    if (momentsData) {
      await IDB.setItem(IDB.STORES.MOMENTS, 'moments', JSON.parse(momentsData))
      totalItems++
    }
    console.log('✅ 朋友圈已迁移')

    // 3. 迁移角色数据
    console.log('👥 迁移角色数据...')
    const charactersData = localStorage.getItem('characters')
    if (charactersData) {
      await IDB.setItem(IDB.STORES.CHARACTERS, 'characters', JSON.parse(charactersData))
      totalItems++
    }
    console.log('✅ 角色数据已迁移')

    // 4. 迁移用户信息
    console.log('👤 迁移用户信息...')
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      await IDB.setItem(IDB.STORES.USER_INFO, 'userInfo', JSON.parse(userInfo))
      totalItems++
    }
    console.log('✅ 用户信息已迁移')

    // 5. 迁移钱包数据
    console.log('💰 迁移钱包数据...')
    await migrateWalletData()
    console.log('✅ 钱包数据已迁移')

    // 6. 迁移各种设置
    console.log('⚙️ 迁移设置数据...')
    const settingsCount = await migrateSettings()
    totalItems += settingsCount
    console.log(`✅ 已迁移 ${settingsCount} 项设置`)

    // 7. 迁移其他杂项数据
    console.log('📦 迁移其他数据...')
    const miscCount = await migrateMiscData()
    totalItems += miscCount
    console.log(`✅ 已迁移 ${miscCount} 项其他数据`)

    // 标记迁移完成
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION)
    
    const duration = Date.now() - startTime
    console.log(`🎉 迁移完成！共迁移 ${totalItems} 项数据，耗时 ${duration}ms`)
    console.log('💡 提示：localStorage数据已保留作为备份，如需清理请手动操作')

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  }
}

/**
 * 迁移聊天消息
 */
async function migrateMessages(): Promise<number> {
  let count = 0
  const messageItems: { key: string; value: any }[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('messages_')) {
      const value = localStorage.getItem(key)
      if (value) {
        messageItems.push({
          key: key.replace('messages_', ''), // 移除前缀，只保留chatId
          value: JSON.parse(value)
        })
        count++
      }
    }
  }

  if (messageItems.length > 0) {
    await IDB.setItems(IDB.STORES.MESSAGES, messageItems)
  }

  return count
}

/**
 * 迁移钱包数据
 */
async function migrateWalletData(): Promise<void> {
  const walletData: { key: string; value: any }[] = []

  // 余额
  const balance = localStorage.getItem('wallet_balance')
  if (balance) {
    walletData.push({ key: 'balance', value: balance })
  }

  // 交易记录
  const transactions = localStorage.getItem('wallet_transactions')
  if (transactions) {
    walletData.push({ key: 'transactions', value: JSON.parse(transactions) })
  }

  // 亲密付关系
  const intimatePay = localStorage.getItem('intimate_pay_relations')
  if (intimatePay) {
    walletData.push({ key: 'intimate_pay_relations', value: JSON.parse(intimatePay) })
  }

  if (walletData.length > 0) {
    await IDB.setItems(IDB.STORES.WALLET, walletData)
  }
}

/**
 * 迁移设置数据（壁纸、未读等）
 */
async function migrateSettings(): Promise<number> {
  let count = 0
  const settingsItems: { key: string; value: any }[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      // 壁纸
      if (key.startsWith('wallpaper_')) {
        const value = localStorage.getItem(key)
        if (value) {
          settingsItems.push({ key, value: JSON.parse(value) })
          count++
        }
      }
      // 未读消息
      else if (key === 'unread_counts') {
        const value = localStorage.getItem(key)
        if (value) {
          settingsItems.push({ key, value: JSON.parse(value) })
          count++
        }
      }
      // 已通知消息
      else if (key === 'notified_messages') {
        const value = localStorage.getItem(key)
        if (value) {
          settingsItems.push({ key, value: JSON.parse(value) })
          count++
        }
      }
      // 聊天列表
      else if (key === 'chatList') {
        const value = localStorage.getItem(key)
        if (value) {
          settingsItems.push({ key, value: JSON.parse(value) })
          count++
        }
      }
      // API设置
      else if (key === 'apiSettings') {
        const value = localStorage.getItem(key)
        if (value) {
          settingsItems.push({ key, value: JSON.parse(value) })
          count++
        }
      }
    }
  }

  if (settingsItems.length > 0) {
    await IDB.setItems(IDB.STORES.SETTINGS, settingsItems)
  }

  return count
}

/**
 * 迁移其他杂项数据
 */
async function migrateMiscData(): Promise<number> {
  let count = 0
  const miscItems: { key: string; value: any }[] = []

  // 需要迁移的其他键
  const keysToMigrate = [
    'blacklist',
    'couple_space_relations',
    'couple_space_privacy',
    'couple_space_photos',
    'couple_space_messages',
    'couple_space_anniversaries',
    'ai_interaction_memory',
    'lastMomentsCheckTime'
  ]

  keysToMigrate.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        miscItems.push({ key, value: JSON.parse(value) })
        count++
      } catch {
        // 如果不是JSON，直接存储字符串
        miscItems.push({ key, value })
        count++
      }
    }
  })

  if (miscItems.length > 0) {
    await IDB.setItems(IDB.STORES.MISC, miscItems)
  }

  return count
}

/**
 * 清理localStorage（可选，谨慎使用）
 */
export function cleanupLocalStorage(): void {
  console.warn('⚠️ 准备清理localStorage，请确保已完成迁移！')
  
  // 保留迁移标记
  const migrationFlag = localStorage.getItem(MIGRATION_KEY)
  
  // 清空localStorage
  localStorage.clear()
  
  // 恢复迁移标记
  if (migrationFlag) {
    localStorage.setItem(MIGRATION_KEY, migrationFlag)
  }
  
  console.log('✅ localStorage已清理')
}
