/**
 * 朋友圈AI动作调度器
 * 持久化待执行的动作，防止页面刷新导致定时器丢失
 */

import type { AIAction } from '../../types/momentsAI'
import type { Moment } from '../../types/moments'
import { executeLikeAction, executeCommentAction, executeDMAction } from './actionExecutor'

interface ScheduledAction {
  id: string
  action: AIAction
  momentId: string
  executeAt: number // 执行时间戳
  // 移除 characters 和 allActions，减少存储空间占用
}

const STORAGE_KEY = 'moments_scheduled_actions'
const CHECK_INTERVAL = 1000 // 每秒检查一次

let checkTimer: number | null = null

/**
 * 获取所有待执行的动作
 */
function getScheduledActions(): ScheduledAction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const actions = JSON.parse(data)
    return Array.isArray(actions) ? actions : []
  } catch (error) {
    console.error('❌ 读取待执行动作失败:', error)
    return []
  }
}

/**
 * 保存待执行的动作
 */
function saveScheduledActions(actions: ScheduledAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions))
  } catch (error) {
    console.error('❌ 保存待执行动作失败:', error)
  }
}

/**
 * 添加待执行的动作
 */
export function scheduleAction(
  action: AIAction,
  moment: Moment,
  delaySeconds: number
): void {
  const executeAt = Date.now() + delaySeconds * 1000
  const scheduledAction: ScheduledAction = {
    id: `${action.characterId}_${moment.id}_${Date.now()}`,
    action,
    momentId: moment.id,
    executeAt
    // 不再存储 characters 和 allActions，减少存储空间
  }

  const actions = getScheduledActions()
  actions.push(scheduledAction)
  saveScheduledActions(actions)

  console.log(`⏰ 已调度动作: ${action.characterName} 将在 ${delaySeconds}秒后${getActionText(action.action)}`)
  
  // 确保检查器在运行
  startScheduler()
}

/**
 * 执行单个动作
 */
async function executeScheduledAction(scheduledAction: ScheduledAction): Promise<void> {
  const { action, momentId } = scheduledAction
  
  console.log(`\n${'▶️'.repeat(20)}`)
  console.log(`▶️  执行调度动作: ${action.characterName} ${getActionText(action.action)}`)
  console.log(`▶️  朋友圈ID: ${momentId}`)
  console.log(`${'▶️'.repeat(20)}`)

  // 获取朋友圈数据
  const { loadMoments } = await import('../momentsManager')
  const moments = loadMoments()
  const moment = moments.find(m => m.id === momentId)

  if (!moment) {
    console.error(`❌ 找不到朋友圈: ${momentId}`)
    return
  }

  // 重新获取角色数据（不从存储中读取，避免数据过大）
  const { characterService } = await import('../../services/characterService')
  const characters = characterService.getAll()

  // 检查是否是NPC
  const isNPC = action.characterId.startsWith('npc-')
  
  if (isNPC) {
    const npcParts = action.characterId.split('-')
    const npcName = npcParts.slice(2).join('-')
    
    const virtualCharacter = {
      id: action.characterId,
      realName: npcName,
      nickname: npcName,
      avatar: '👤'
    }
    
    switch (action.action) {
      case 'like':
        executeLikeAction(action, moment, virtualCharacter)
        break
      case 'comment':
        // 评论时不需要 allActions，actionExecutor 会自动处理
        executeCommentAction(action, moment, virtualCharacter, [])
        break
      case 'none':
        console.log(`👀 NPC ${npcName} 选择沉默`)
        break
      default:
        console.warn(`⚠️ NPC不支持此动作: ${action.action}`)
    }
    return
  }

  // 普通角色处理
  let character = characters.find((c: any) => c.id === action.characterId)
  
  if (!character) {
    character = characters.find((c: any) => 
      c.nickname === action.characterName || 
      c.realName === action.characterName
    )
  }
  
  if (!character) {
    console.error(`❌ 找不到角色: ID=${action.characterId}, Name=${action.characterName}`)
    return
  }
  
  console.log(`✅ 找到角色: ${character.nickname || character.realName} (ID: ${character.id})`)
  
  switch (action.action) {
    case 'like':
      executeLikeAction(action, moment, character)
      break
    case 'comment':
      // 评论时不需要 allActions，actionExecutor 会自动处理
      executeCommentAction(action, moment, character, [])
      break
    case 'dm':
      executeDMAction(action, character, moment)
      break
    case 'none':
      console.log(`👀 ${action.characterName} 选择沉默`)
      break
  }
}

/**
 * 检查并执行到期的动作
 */
async function checkAndExecuteActions(): Promise<void> {
  const actions = getScheduledActions()
  if (actions.length === 0) return

  const now = Date.now()
  const dueActions = actions.filter(a => a.executeAt <= now)
  const pendingActions = actions.filter(a => a.executeAt > now)

  if (dueActions.length > 0) {
    console.log(`\n⏰ 发现 ${dueActions.length} 个到期动作，开始执行...`)
    
    for (const action of dueActions) {
      try {
        await executeScheduledAction(action)
      } catch (error) {
        console.error(`❌ 执行动作失败:`, error)
      }
    }

    // 保存剩余的待执行动作
    saveScheduledActions(pendingActions)
    
    console.log(`✅ 已执行 ${dueActions.length} 个动作，剩余 ${pendingActions.length} 个`)
  }

  // 如果没有待执行的动作了，停止检查器
  if (pendingActions.length === 0) {
    stopScheduler()
  }
}

/**
 * 启动调度器
 */
export function startScheduler(): void {
  if (checkTimer) return // 已经在运行
  
  console.log('🚀 启动朋友圈动作调度器')
  checkTimer = window.setInterval(checkAndExecuteActions, CHECK_INTERVAL)
  
  // 立即检查一次
  checkAndExecuteActions()
}

/**
 * 停止调度器
 */
export function stopScheduler(): void {
  if (checkTimer !== null) {
    window.clearInterval(checkTimer)
    checkTimer = null
    console.log('⏸️ 停止朋友圈动作调度器')
  }
}

/**
 * 清除所有待执行的动作
 */
export function clearAllScheduledActions(): void {
  saveScheduledActions([])
  stopScheduler()
  console.log('🗑️ 已清除所有待执行的朋友圈动作')
}

/**
 * 获取待执行动作的数量
 */
export function getPendingActionsCount(): number {
  return getScheduledActions().length
}

/**
 * 获取动作类型文本
 */
function getActionText(actionType: string): string {
  switch (actionType) {
    case 'like': return '点赞'
    case 'comment': return '评论'
    case 'dm': return '私聊'
    case 'none': return '不互动'
    default: return actionType
  }
}
