/**
 * 紧急清理 localStorage 空间
 * 只清理非核心数据，保护聊天记录
 */

export function emergencyCleanup() {
  console.log('🚨 开始紧急清理 localStorage...')
  
  let totalFreed = 0
  const safeToDelete: string[] = []
  
  // 1. 清理表白墙数据（占用2.4MB）
  const topicAdmins = localStorage.getItem('topic_admins_校园表白墙')
  if (topicAdmins) {
    const size = new Blob([topicAdmins]).size
    localStorage.removeItem('topic_admins_校园表白墙')
    totalFreed += size
    safeToDelete.push(`topic_admins_校园表白墙 (${(size/1024).toFixed(1)}KB)`)
  }
  
  // 2. 清理朋友圈封面图片（占用225KB）
  const coverImage = localStorage.getItem('moments_cover_image')
  if (coverImage) {
    const size = new Blob([coverImage]).size
    localStorage.removeItem('moments_cover_image')
    totalFreed += size
    safeToDelete.push(`moments_cover_image (${(size/1024).toFixed(1)}KB)`)
  }
  
  // 3. 清理表情包库（占用11KB）
  const memeLibrary = localStorage.getItem('meme_library_data')
  if (memeLibrary) {
    const size = new Blob([memeLibrary]).size
    localStorage.removeItem('meme_library_data')
    totalFreed += size
    safeToDelete.push(`meme_library_data (${(size/1024).toFixed(1)}KB)`)
  }
  
  // 🔥🔥🔥 关键修复：不再删除消息备份！
  // 消息备份是数据恢复的最后手段，绝对不能删除
  // 之前的逻辑会删除7天前的备份和超过100KB的备份，导致用户数据丢失
  console.log('⚠️ [emergencyCleanup] 跳过消息备份清理，保护用户数据')
  
  // 6. 清理壁纸缓存
  const wallpaperKeys = Object.keys(localStorage).filter(key => 
    key.includes('wallpaper') || key.includes('background_image')
  )
  for (const key of wallpaperKeys) {
    const data = localStorage.getItem(key)
    if (data && data.length > 50000) { // 超过50KB的壁纸
      const size = new Blob([data]).size
      localStorage.removeItem(key)
      totalFreed += size
      safeToDelete.push(`${key} (${(size/1024).toFixed(1)}KB) - 壁纸缓存`)
    }
  }
  
  console.log('✅ 清理完成！')
  console.log(`释放空间: ${(totalFreed/1024/1024).toFixed(2)}MB`)
  console.log('已删除项目:')
  safeToDelete.forEach(item => console.log(`  - ${item}`))
  
  // 显示当前使用情况
  const currentUsage = new Blob(Object.values(localStorage)).size
  console.log(`当前使用: ${(currentUsage/1024/1024).toFixed(2)}MB / ~5MB`)
  
  return {
    freedSpace: totalFreed,
    deletedItems: safeToDelete,
    currentUsage
  }
}

// 立即执行清理
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup
  
  // 自动检测并清理
  const checkStorage = () => {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
    } catch (e) {
      if (e instanceof DOMException && e.code === 22) {
        console.log('⚠️ 检测到 localStorage 空间不足，自动清理...')
        emergencyCleanup()
      }
    }
  }
  
  // 页面加载时检查
  checkStorage()
  
  // 定期检查（每5分钟）
  setInterval(checkStorage, 5 * 60 * 1000)
}
