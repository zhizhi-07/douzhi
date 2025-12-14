import { generateAIPhoneContent } from './aiPhoneGenerator'
import { showNotification } from './notificationManager'

// 后台生成任务状态
export interface BackgroundTask {
  characterId: string
  characterName: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  startTime: number
  error?: string
}

// 后台任务管理器
class BackgroundPhoneGenerator {
  private tasks: Map<string, BackgroundTask> = new Map()
  private listeners: Set<(tasks: BackgroundTask[]) => void> = new Set()

  // 开始后台生成任务
  startGeneration(characterId: string, characterName: string) {
    const task: BackgroundTask = {
      characterId,
      characterName,
      status: 'generating',
      startTime: Date.now()
    }

    this.tasks.set(characterId, task)
    this.notifyListeners()

    // 异步生成
    this.generate(characterId, characterName)
  }

  private async generate(characterId: string, characterName: string) {
    try {
      console.log(`开始后台生成 ${characterName} 的手机内容...`)
      
      // 调用生成函数
      await generateAIPhoneContent(characterId, characterName, true)
      
      // 更新任务状态
      const task = this.tasks.get(characterId)
      if (task) {
        task.status = 'completed'
        this.tasks.set(characterId, task)
        this.notifyListeners()
      }

      console.log(`${characterName} 的手机内容生成完成`)

      // 显示iOS通知
      showNotification(
        '查手机',
        `${characterName}的手机内容已生成完成，快去查看吧！`,
        {
          subtitle: '新消息',
          duration: 5000,
          onClick: () => {
            // 点击通知跳转到查手机页面
            const basePath = import.meta.env.BASE_URL || '/'
            window.location.href = `${basePath}ai-phone-select`.replace('//', '/')
          }
        }
      )

      // 3秒后移除任务
      setTimeout(() => {
        this.tasks.delete(characterId)
        this.notifyListeners()
      }, 3000)

    } catch (error: any) {
      console.error(`生成失败:`, error)
      
      const task = this.tasks.get(characterId)
      if (task) {
        task.status = 'failed'
        task.error = error.message
        this.tasks.set(characterId, task)
        this.notifyListeners()
      }

      // 🔥 显示失败通知，让用户知道出错了
      showNotification(
        '查手机',
        `${characterName}的手机内容生成失败：${error.message || '未知错误'}`,
        {
          subtitle: '生成失败',
          duration: 8000
        }
      )

      // 8秒后移除失败任务
      setTimeout(() => {
        this.tasks.delete(characterId)
        this.notifyListeners()
      }, 8000)
    }
  }

  // 获取所有任务
  getTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values())
  }

  // 获取特定任务
  getTask(characterId: string): BackgroundTask | undefined {
    return this.tasks.get(characterId)
  }

  // 是否有任务正在生成
  hasGeneratingTask(): boolean {
    return Array.from(this.tasks.values()).some(task => task.status === 'generating')
  }

  // 订阅任务变化
  subscribe(listener: (tasks: BackgroundTask[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const tasks = this.getTasks()
    this.listeners.forEach(listener => listener(tasks))
  }

  // 清除所有任务
  clearAll() {
    this.tasks.clear()
    this.notifyListeners()
  }
}

// 单例
export const backgroundGenerator = new BackgroundPhoneGenerator()
