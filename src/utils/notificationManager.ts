// iOS通知管理器

export interface NotificationData {
  id: string
  title: string
  subtitle?: string
  message: string
  icon?: string
  onClick?: () => void
  duration?: number
}

type NotificationListener = (notification: NotificationData | null) => void

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set()
  private currentNotification: NotificationData | null = null

  // 显示通知
  show(notification: Omit<NotificationData, 'id'>) {
    const notificationWithId: NotificationData = {
      id: `notification_${Date.now()}`,
      ...notification
    }

    this.currentNotification = notificationWithId
    this.notifyListeners()

    return notificationWithId.id
  }

  // 关闭当前通知
  close() {
    this.currentNotification = null
    this.notifyListeners()
  }

  // 获取当前通知
  getCurrent(): NotificationData | null {
    return this.currentNotification
  }

  // 订阅通知变化
  subscribe(listener: NotificationListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentNotification))
  }
}

export const notificationManager = new NotificationManager()

// 便捷方法
export const showNotification = (
  title: string,
  message: string,
  options?: {
    subtitle?: string
    icon?: string
    onClick?: () => void
    duration?: number
  }
) => {
  return notificationManager.show({
    title,
    message,
    ...options
  })
}
