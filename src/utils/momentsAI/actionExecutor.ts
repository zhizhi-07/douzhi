import { nextMessageId } from '../messageId'
/**
 * AI动作执行器
 * 负责执行AI导演编排的各种动作（点赞、评论、私聊）
 */

import type { AIAction } from '../../types/momentsAI'
import type { Moment } from '../../types/moments'
import { likeMoment, commentMoment } from '../momentsManager'
import { showNotification, incrementUnread } from '../simpleNotificationManager'
import { recordAIInteraction } from '../aiInteractionMemory'
import { addMessage } from '../simpleMessageManager'

// 全局计数器，确保同一毫秒内生成的ID也是唯一的

/**
 * 执行点赞动作
 */
export async function executeLikeAction(
  action: AIAction,
  moment: Moment,
  character: any
): Promise<void> {
  const avatar = character?.avatar || '🤖'
  
  await likeMoment(moment.id, {
    id: action.characterId,
    name: action.characterName,
    avatar
  })
  
  console.log(`👍 ${action.characterName} 点赞了！`)
  
  // 记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'like',
    targetId: moment.id,
    targetName: moment.userName,
    context: moment.content.substring(0, 50)
  })
  
  // 不在朋友圈界面时显示通知
  const isInMomentsPage = window.location.hash.includes('/moments')
  if (!isInMomentsPage) {
    showNotification(
      action.characterId,
      `${action.characterName} 赞了你的朋友圈`,
      moment.content.substring(0, 30),
      avatar
    )
  }
}

/**
 * 执行评论动作
 */
export async function executeCommentAction(
  action: AIAction,
  moment: Moment,
  character: any,
  _allActions: AIAction[]  // 保留用于API兼容性，当前版本未使用
): Promise<void> {
  const avatar = character?.avatar || '🤖'
  
  // 评论内容（不需要加@，因为显示时会显示"回复xxx"）
  let finalComment = action.commentContent || ''
  // 如果评论内容开头有@回复对象，去掉它（因为现在用replyTo字段）
  if (action.replyTo && finalComment.startsWith(`@${action.replyTo}`)) {
    finalComment = finalComment.replace(`@${action.replyTo}`, '').trim()
  }
  
  // 🔥 注意：AI的评论不应该触发新的互动编排，所以这里不会触发
  // commentMoment内部会检查user.id是否为'user'
  await commentMoment(moment.id, {
    id: action.characterId,
    name: action.characterName,
    avatar
  }, finalComment, action.replyTo)  // 传入回复谁
  
  console.log(`💬 ${action.characterName} 评论: ${finalComment}`)
  
  // 记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'comment',
    targetId: moment.id,
    targetName: moment.userName,
    content: finalComment,
    context: moment.content.substring(0, 50)
  })
  
  // 不在朋友圈界面时显示通知
  const isInMomentsPage = window.location.hash.includes('/moments')
  if (!isInMomentsPage) {
    showNotification(
      action.characterId,
      `${action.characterName} 评论了你的朋友圈`,
      finalComment,
      avatar
    )
  }
}

/**
 * 执行私聊动作
 */
export function executeDMAction(
  action: AIAction,
  character: any,
  moment?: Moment
): void {
  console.log(`📱 ${action.characterName} 准备发送私聊...`)
  console.log(`   角色ID: ${action.characterId}`)
  console.log(`   角色名: ${action.characterName}`)
  console.log(`   角色对象:`, character)
  
  const avatar = character?.avatar || '🤖'
  
  console.log(`💬 准备发送私聊消息到角色 ${action.characterId}`)
  
  const now = Date.now()
  const uniqueId = nextMessageId()
  
  // 🔥 构建AI可读内容，包含朋友圈上下文
  let aiReadableContent = action.dmContent
  if (moment) {
    const momentPreview = moment.content.length > 100 
      ? moment.content.substring(0, 100) + '...' 
      : moment.content
    aiReadableContent = `[系统提示：你看到用户发的朋友圈"${momentPreview}"后，主动私聊了TA]\n\n${action.dmContent}`
  }
  
  const dmMsg = {
    id: uniqueId,
    type: 'received' as const,
    content: action.dmContent,
    aiReadableContent: aiReadableContent,  // AI可见的内容包含朋友圈上下文
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: now,
    messageType: 'text' as const
  }
  
  try {
    // 🔥 使用 addMessage 保存到 IndexedDB（而不是 localStorage）
    addMessage(action.characterId, dmMsg)
    console.log(`💾 私聊消息已保存到IndexedDB: chatId=${action.characterId}, messageId=${dmMsg.id}`)
    console.log(`💬 消息内容:`, dmMsg)
  } catch (error) {
    console.error('❌ 保存私聊消息失败:', error)
    return
  }
  
  // 显示通知
  console.log(`🔔 准备触发通知...`)
  console.log(`   - chatId: ${action.characterId}`)
  console.log(`   - title: ${action.characterName}`)
  console.log(`   - message: ${action.dmContent}`)
  console.log(`   - avatar: ${avatar}`)
  
  showNotification(
    action.characterId,
    action.characterName,
    action.dmContent!,
    avatar
  )
  console.log(`✅ 通知已触发`)
  
  // 增加未读数
  console.log(`🔴 准备增加未读数...`)
  const beforeCount = localStorage.getItem('unread_counts')
  incrementUnread(action.characterId)
  const afterCount = localStorage.getItem('unread_counts')
  console.log(`   - 增加前: ${beforeCount}`)
  console.log(`   - 增加后: ${afterCount}`)
  console.log(`✅ 未读数已增加`)
  
  // 触发storage事件，让聊天列表刷新
  window.dispatchEvent(new Event('storage'))
  console.log(`✨ 已触发storage事件刷新`)
  
  // 触发自定义事件
  window.dispatchEvent(new CustomEvent('new-message', {
    detail: { chatId: action.characterId, message: dmMsg }
  }))
  console.log(`✨ 已触发new-message事件`)
  
  // 记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'dm',
    targetId: 'user',
    targetName: '用户',
    content: action.dmContent
  })
  
  console.log(`✅ ${action.characterName} 私聊完成: ${action.dmContent}`)
}
