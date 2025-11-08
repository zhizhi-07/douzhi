/**
 * 清理 localStorage 中的旧消息数据
 * 这些数据现在已经迁移到 IndexedDB
 */

export function cleanupOldMessages(): void {
  console.log('🧹 开始清理 localStorage 中的旧数据...')
  
  let cleanedCount = 0
  let freedSpace = 0
  
  // 遍历所有 localStorage 键
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    // 清理以 chat_messages_ 开头的键（旧的消息存储）
    if (key.startsWith('chat_messages_')) {
      const size = localStorage.getItem(key)?.length || 0
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
      console.log(`  🗑️ 标记删除旧消息: ${key} (${(size / 1024).toFixed(2)} KB)`)
    }
    
    // 清理以 chat_settings_ 开头的键（如果存在）
    if (key.startsWith('chat_settings_')) {
      const size = localStorage.getItem(key)?.length || 0
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
      console.log(`  🗑️ 标记删除旧设置: ${key} (${(size / 1024).toFixed(2)} KB)`)
    }
    
    // 清理以 group_messages_ 开头的键（旧的群聊消息存储）
    if (key.startsWith('group_messages_')) {
      const size = localStorage.getItem(key)?.length || 0
      freedSpace += size
      keysToRemove.push(key)
      cleanedCount++
      console.log(`  🗑️ 标记删除群聊消息: ${key} (${(size / 1024).toFixed(2)} KB)`)
    }
  }
  
  // 删除找到的键
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`  ✓ 已删除: ${key}`)
    } catch (e) {
      console.error(`  ✗ 删除失败: ${key}`, e)
    }
  })
  
  console.log(`✅ 清理完成！删除了 ${cleanedCount} 个旧数据键，释放约 ${(freedSpace / 1024 / 1024).toFixed(2)} MB 空间`)
  
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
 * 紧急清理 - 强制清理所有旧数据
 */
export function emergencyCleanup(): void {
  console.warn('🚨 执行紧急清理...')
  
  let totalCleaned = 0
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    // 清理所有 chat_messages_、chat_settings_ 和 group_messages_ 开头的键
    if (key.startsWith('chat_messages_') || key.startsWith('chat_settings_') || key.startsWith('group_messages_')) {
      const size = localStorage.getItem(key)?.length || 0
      totalCleaned += size
      keysToRemove.push(key)
    }
  }
  
  console.log(`找到 ${keysToRemove.length} 个旧数据键，总计 ${(totalCleaned / 1024 / 1024).toFixed(2)} MB`)
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })
  
  console.log(`✅ 紧急清理完成！释放了 ${(totalCleaned / 1024 / 1024).toFixed(2)} MB 空间`)
  printLocalStorageUsage()
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
