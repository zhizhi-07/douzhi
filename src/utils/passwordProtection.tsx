/**
 * 密码保护工具
 * 用于保护敏感功能（角色卡查看、世界书上传等）
 */

import { createRoot } from 'react-dom/client'
import PasswordVerification from '../components/PasswordVerification'

const STORAGE_KEY = 'admin_verified'

/**
 * 检查是否已验证
 */
export function isVerified(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * 清除验证状态（用于测试或重置）
 */
export function clearVerification(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 显示密码验证弹窗
 * @returns Promise<boolean> 验证是否成功
 */
export function promptPassword(): Promise<boolean> {
  // 如果已验证，直接返回 true
  if (isVerified()) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    // 创建容器
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    // 清理函数
    const cleanup = () => {
      root.unmount()
      document.body.removeChild(container)
    }

    // 验证成功回调
    const handleVerified = () => {
      cleanup()
      resolve(true)
    }

    // 取消回调
    const handleCancel = () => {
      cleanup()
      resolve(false)
    }

    // 渲染组件
    root.render(
      <PasswordVerification 
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    )
  })
}
