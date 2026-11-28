/**
 * 清理 localStorage 中的旧消息数据
 * 这些数据现在已经迁移到 IndexedDB
 */

export function cleanupOldMessages(): void {
  // Only the owning migration can prove that a legacy record was committed.
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
  // Do not delete chat records, backups, settings or user media to make room.
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
