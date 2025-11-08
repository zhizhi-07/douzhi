/**
 * AI动作执行器
 * 负责执行AI导演编排的各种动作（点赞、评论、私聊）
 */

import type { AIAction } from '../../types/momentsAI'
import type { Moment } from '../../types/moments'
import { likeMoment, commentMoment } from '../momentsManager'
import { showNotification, incrementUnread } from '../simpleNotificationManager'
import { recordAIInteraction } from '../aiInteractionMemory'

// 全局计数器，确保同一毫秒内生成的ID也是唯一的
let messageIdCounter = 0

/**
 * 执行点赞动作
 */
export function executeLikeAction(
  action: AIAction,
  moment: Moment,
  character: any
): void {
  const avatar = character?.avatar || '🤖'
  
  likeMoment(moment.id, {
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
export function executeCommentAction(
  action: AIAction,
  moment: Moment,
  character: any,
  _allActions: AIAction[]  // 保留用于API兼容性，当前版本未使用
): void {
  const avatar = character?.avatar || '🤖'
  
  // 如果是回复别人的评论，在评论内容前加上 @回复对象
  let finalComment = action.commentContent || ''
  if (action.replyTo) {
    // 检查评论内容是否已经包含@回复对象的名字
    const hasCorrectMention = finalComment.includes(`@${action.replyTo}`)
    
    if (!hasCorrectMention) {
      // AI没有自己加@，我们来加
      finalComment = `@${action.replyTo} ${action.commentContent}`
    }
    // 如果已经包含正确的@，说明AI导演已经自己加了，直接使用
  }
  
  commentMoment(moment.id, {
    id: action.characterId,
    name: action.characterName,
    avatar
  }, finalComment)
  
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
  character: any
): void {
  console.log(`📱 ${action.characterName} 准备发送私聊...`)
  console.log(`   角色ID: ${action.characterId}`)
  console.log(`   角色名: ${action.characterName}`)
  console.log(`   角色对象:`, character)
  
  const avatar = character?.avatar || '🤖'
  const messagesKey = `chat_messages_${action.characterId}`
  
  console.log(`📂 读取消息key: ${messagesKey}`)
  const savedMessages = localStorage.getItem(messagesKey)
  const messages = savedMessages ? JSON.parse(savedMessages) : []
  console.log(`📚 当前消息数: ${messages.length}`)
  console.log(`📝 最近3条消息:`, messages.slice(-3))
  
  const now = Date.now()
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  const dmMsg = {
    id: uniqueId,
    type: 'received' as const,
    content: action.dmContent,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: now,
    messageType: 'text' as const
  }
  
  messages.push(dmMsg)
  
  try {
    localStorage.setItem(messagesKey, JSON.stringify(messages))
    console.log(`💾 私聊消息已保存到localStorage: ${messagesKey}`)
    console.log(`📝 保存后消息数: ${messages.length}`)
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
