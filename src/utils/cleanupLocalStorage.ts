/**
 * 清理 localStorage 中的旧消息数据
 * 这些数据现在已经迁移到 IndexedDB
 */

export function cleanupOldMessages(): void {
  console.log('🧹 开始清理 localStorage 中的旧数据...')
  
  let cleanedCount = 0
  let freedSpace = 0
  
  // 🔥 核心数据键（绝对不能删）
  const criticalKeys = [
    'api_settings', 'user_info', 'characters', 'chat_list', 
    'app_settings', 'user_accounts', 'current_account'
  ]
  
  // 遍历所有 localStorage 键
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    // 跳过核心数据
    if (criticalKeys.some(k => key.includes(k))) continue
    
    const value = localStorage.getItem(key) || ''
    const size = value.length * 2 // UTF-16
    
    // 清理以 chat_messages_ 开头的键（旧的消息存储）
    if (key.startsWith('chat_messages_')) {
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
    }
    
    // 清理以 group_messages_ 开头的键（旧的群聊消息存储）
    if (key.startsWith('group_messages_')) {
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
    }
    
    // 🔥 清理过大的 msg_backup_（超过100KB的备份）
    if (key.startsWith('msg_backup_') && size > 100 * 1024) {
      console.log(`  🗑️ 清理过大备份: ${key} (${(size / 1024).toFixed(1)}KB)`)
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
    }
  }
  
  // 删除找到的键
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      // 静默失败
    }
  })
  
  if (cleanedCount > 0) {
    console.log(`✅ 清理完成！删除了 ${cleanedCount} 个旧数据键，释放约 ${(freedSpace / 1024 / 1024).toFixed(2)} MB 空间`)
  }
  
  // 打印清理后的使用情况
  printLocalStorageUsage()
}

/**
 * 获取 localStorage 使用情况
 */
export function getLocalStorageUsage(): { total: number; items: Array<{ key: string; size: number }> } {
  let total = 0
  const items: Array<{ key: string; size: number }> = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    const size = localStorage.getItem(key)?.length || 0
    total += size
    
    if (size > 10000) { // 只记录大于 10KB 的项
      items.push({ key, size })
    }
  }
  
  // 按大小排序
  items.sort((a, b) => b.size - a.size)
  
  return { total, items }
}

/**
 * 打印 localStorage 使用情况
 */
export function printLocalStorageUsage(): void {
  const { total, items } = getLocalStorageUsage()
  
  console.log('📊 localStorage 使用情况:')
  console.log(`总计: ${(total / 1024 / 1024).toFixed(2)} MB`)
  console.log('\n大文件（>10KB）:')
  
  items.forEach(item => {
    console.log(`  ${item.key}: ${(item.size / 1024).toFixed(2)} KB`)
  })
}

/**
 * 紧急清理 - 强制清理所有非核心数据
 */
export function emergencyCleanup(): void {
  console.warn('🚨 执行紧急清理...')
  
  // 🔥 核心数据键（绝对不能删）
  const criticalKeys = [
    'api_settings', 'user_info', 'characters', 'chat_list', 
    'app_settings', 'user_accounts', 'current_account'
  ]
  
  let totalCleaned = 0
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    // 跳过核心数据
    if (criticalKeys.some(k => key.includes(k))) continue
    
    const value = localStorage.getItem(key) || ''
    const size = value.length * 2
    
    // 清理旧消息、大文件
    // 🔥🔥🔥 关键修复：不再删除 msg_backup_！这是数据恢复的最后手段
    if (key.startsWith('chat_messages_') || 
        key.startsWith('group_messages_') ||
        (size > 200 * 1024 && !key.startsWith('msg_backup_'))) { // 超过200KB的清理，但不删除消息备份
      totalCleaned += size
      keysToRemove.push(key)
    }
  }
  
  console.log(`找到 ${keysToRemove.length} 个可清理项，总计 ${(totalCleaned / 1024 / 1024).toFixed(2)} MB`)
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })
  
  console.log(`✅ 紧急清理完成！释放了 ${(totalCleaned / 1024 / 1024).toFixed(2)} MB 空间`)
  printLocalStorageUsage()
}

/**
 * 🔥 检查存储空间并在不足时自动清理
 * 返回 true 表示空间充足，false 表示空间不足
 */
export function checkAndCleanStorage(): boolean {
  const { total } = getLocalStorageUsage()
  const usedMB = total / 1024 / 1024
  const limitMB = 4.5 // localStorage 限制约 5MB，留点余量
  
  console.log(`📊 [存储检查] 已用: ${usedMB.toFixed(2)}MB / ${limitMB}MB`)
  
  if (usedMB > limitMB) {
    console.warn(`⚠️ [存储空间不足] 正在自动清理...`)
    emergencyCleanup()
    
    // 清理后再检查
    const { total: newTotal } = getLocalStorageUsage()
    const newUsedMB = newTotal / 1024 / 1024
    
    if (newUsedMB > limitMB) {
      console.error(`❌ [存储空间严重不足] 清理后仍有 ${newUsedMB.toFixed(2)}MB`)
      // 弹窗警告用户
      setTimeout(() => {
        alert('⚠️ 存储空间不足！\n\n建议：\n1. 去 设置 → 数据管理 → 导出数据 备份\n2. 清理不需要的聊天记录\n3. 或使用 "空间清理" 功能')
      }, 1000)
      return false
    }
    
    console.log(`✅ [存储检查] 清理后: ${newUsedMB.toFixed(2)}MB`)
  }
  
  return true
}


// 暴露到全局，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).debugLocalStorage = {
    usage: printLocalStorageUsage,
    cleanup: cleanupOldMessages,
    emergency: emergencyCleanup
  }
  console.log('💡 提示：可以在控制台使用以下命令：')
  console.log('  - window.debugLocalStorage.usage() // 查看使用情况')
  console.log('  - window.debugLocalStorage.cleanup() // 清理旧数据')
  console.log('  - window.debugLocalStorage.emergency() // 紧急清理')
}
