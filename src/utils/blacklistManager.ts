/**
 * 拉黑系统管理器
 * 参考：汁汁/宝贝项目的拉黑功能
 */

export interface BlockStatus {
  blockedByMe: boolean      // 我拉黑了对方
  blockedByTarget: boolean  // 对方拉黑了我
}

class BlacklistManager {
  private storageKey = 'blacklist_user'
  private timestampKey = 'blacklist_timestamp'

  /**
   * 获取用户的拉黑列表
   */
  private getBlacklist(userId: string): string[] {
    try {
      const data = localStorage.getItem(`${this.storageKey}_${userId}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取拉黑列表失败:', error)
      return []
    }
  }

  /**
   * 保存用户的拉黑列表
   */
  private saveBlacklist(userId: string, blacklist: string[]): void {
    try {
      localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(blacklist))
      console.log('✅ 拉黑列表已保存:', blacklist)
    } catch (error) {
      console.error('保存拉黑列表失败:', error)
    }
  }

  /**
   * 获取拉黑时间戳
   */
  getBlockTimestamp(userId: string, targetId: string): number | null {
    try {
      const data = localStorage.getItem(`${this.timestampKey}_${userId}_${targetId}`)
      return data ? parseInt(data) : null
    } catch {
      return null
    }
  }

  /**
   * 拉黑用户
   * @param userId 当前用户ID
   * @param targetId 要拉黑的目标ID（使用characterId）
   */
  blockUser(userId: string, targetId: string): void {
    const blacklist = this.getBlacklist(userId)
    if (!blacklist.includes(targetId)) {
      blacklist.push(targetId)
      this.saveBlacklist(userId, blacklist)
      // 记录拉黑时间戳
      localStorage.setItem(`${this.timestampKey}_${userId}_${targetId}`, Date.now().toString())
      console.log('✅ 已拉黑，characterId:', targetId)
    }
  }

  /**
   * 取消拉黑用户
   * @param userId 当前用户ID
   * @param targetId 要取消拉黑的目标ID
   */
  unblockUser(userId: string, targetId: string): void {
    const blacklist = this.getBlacklist(userId)
    const newBlacklist = blacklist.filter(id => id !== targetId)
    this.saveBlacklist(userId, newBlacklist)
    // 清除拉黑时间戳
    localStorage.removeItem(`${this.timestampKey}_${userId}_${targetId}`)
    console.log('✅ 已取消拉黑')
  }

  /**
   * 切换拉黑状态
   * @param userId 当前用户ID
   * @param targetId 目标ID
   * @returns 新的拉黑状态
   */
  toggleBlock(userId: string, targetId: string): boolean {
    const status = this.getBlockStatus(userId, targetId)
    if (status.blockedByMe) {
      this.unblockUser(userId, targetId)
      return false
    } else {
      this.blockUser(userId, targetId)
      return true
    }
  }

  /**
   * 获取拉黑状态
   * @param userId 当前用户ID
   * @param targetId 目标ID
   * @returns 拉黑状态对象
   */
  getBlockStatus(userId: string, targetId: string): BlockStatus {
    const myBlacklist = this.getBlacklist(userId)
    const targetBlacklist = this.getBlacklist(targetId)

    return {
      blockedByMe: myBlacklist.includes(targetId),
      blockedByTarget: targetBlacklist.includes(userId)
    }
  }

  /**
   * 检查是否被拉黑
   * @param userId 当前用户ID
   * @param targetId 目标ID
   * @returns 是否被我拉黑
   */
  isBlockedByMe(userId: string, targetId: string): boolean {
    return this.getBlockStatus(userId, targetId).blockedByMe
  }

  /**
   * 清除所有拉黑数据（用于调试）
   */
  clearAll(userId: string): void {
    localStorage.removeItem(`${this.storageKey}_${userId}`)
    console.log('✅ 已清除所有拉黑数据')
  }
}

// 导出单例
export const blacklistManager = new BlacklistManager()

// 挂载到全局对象（用于调试和其他模块访问）
if (typeof window !== 'undefined') {
  (window as any).blacklistManager = blacklistManager
}
