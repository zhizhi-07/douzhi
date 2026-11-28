import { canViewMoment } from './momentVisibility'
/**
 * 朋友圈互动指令解析器
 * 解析AI在聊天中发送的朋友圈互动指令（评论、点赞等）
 */

import { updateMoments } from './momentsManager'
import { addMomentsNews } from './momentsNewsManager'

/**
 * 朋友圈互动指令类型
 */
export interface MomentsInteraction {
  type: 'comment' | 'like' | 'reply'
  momentIndex: number  // 朋友圈序号（从1开始）
  content?: string  // 评论内容
  replyTo?: string  // 回复给谁
  aiName: string  // AI角色名称
  aiId: string  // AI角色ID
}

/**
 * 解析AI消息中的朋友圈互动指令
 * @param message AI的消息内容
 * @param aiName AI角色名称
 * @param aiId AI角色ID
 * @returns 解析出的互动指令数组和清理后的消息内容
 */
export function parseMomentsInteractions(
  message: string,
  aiName: string,
  aiId: string
): { interactions: MomentsInteraction[], cleanedMessage: string } {
  const interactions: MomentsInteraction[] = []
  let cleanedMessage = message

  // 正则表达式匹配不同的指令格式
  // 支持方括号包裹的格式：[评论01 内容] 或 评论01 内容
  const patterns = [
    // 回复评论（优先匹配，因为更具体）：[评论01回复张三 内容] 或 评论01回复张三 内容
    {
      regex: /\[?评论(\d+)回复([^\s\]]+?)\s+([^\]]+?)\]?(?=\n|评论\d+|点赞\d+|\[评论|\[点赞|$)/g,
      type: 'reply' as const
    },
    // 评论：[评论01 内容] 或 评论01 内容
    {
      regex: /\[?评论(\d+)\s+([^\]]+?)\]?(?=\n|评论\d+|点赞\d+|\[评论|\[点赞|$)/g,
      type: 'comment' as const
    },
    // 点赞：[点赞02] 或 点赞02
    {
      regex: /\[?点赞(\d+)\]?(?:\s|$)/g,
      type: 'like' as const
    }
  ]

  // 匹配所有指令
  for (const pattern of patterns) {
    let match
    while ((match = pattern.regex.exec(message)) !== null) {
      const momentIndex = parseInt(match[1])

      if (pattern.type === 'comment') {
        interactions.push({
          type: 'comment',
          momentIndex,
          content: match[2].trim(),
          aiName,
          aiId
        })
        // 从消息中移除这个指令
        cleanedMessage = cleanedMessage.replace(match[0], '')
      } else if (pattern.type === 'like') {
        interactions.push({
          type: 'like',
          momentIndex,
          aiName,
          aiId
        })
        // 从消息中移除这个指令
        cleanedMessage = cleanedMessage.replace(match[0], '')
      } else if (pattern.type === 'reply') {
        interactions.push({
          type: 'reply',
          momentIndex,
          content: match[3].trim(),
          replyTo: match[2].trim(),
          aiName,
          aiId
        })
        // 从消息中移除这个指令
        cleanedMessage = cleanedMessage.replace(match[0], '')
      }
    }
  }

  // 清理多余的空行
  cleanedMessage = cleanedMessage.replace(/\n{3,}/g, '\n\n').trim()

  return { interactions, cleanedMessage }
}

/**
 * 互动执行结果
 */
export interface InteractionResult {
  success: boolean
  type: 'like' | 'comment' | 'reply'
  aiName: string
  momentContent: string  // 朋友圈内容（截取前20字符）
  commentContent?: string  // 评论内容
  replyTo?: string  // 回复给谁
  message: string  // 用于控制台输出的消息
}

/**
 * 执行朋友圈互动操作
 * @param interactions 互动指令数组
 * @returns 执行结果数组
 */
export async function executeMomentsInteractions(interactions: MomentsInteraction[], snapshotIds: string[] = []): Promise<InteractionResult[]> {
  if (interactions.length === 0) {
    return []
  }

  const results: InteractionResult[] = []
  const news: Parameters<typeof addMomentsNews>[0][] = []
  await updateMoments(moments => {

  for (const interaction of interactions) {
    // 朋友圈序号从1开始，数组索引从0开始
    const momentIndex = interaction.momentIndex - 1

    if (momentIndex < 0 || momentIndex >= (snapshotIds ? snapshotIds.length : moments.length)) {
      results.push({
        success: false,
        type: interaction.type,
        aiName: interaction.aiName,
        momentContent: '',
        message: `❌ 朋友圈 ${interaction.momentIndex} 不存在`
      })
      continue
    }

    const moment = snapshotIds ? moments.find(m => m.id === snapshotIds[momentIndex]) : moments[momentIndex]
    if (!moment || !canViewMoment(moment, interaction.aiId)) continue
    const momentContentPreview = moment.content.substring(0, 20) + (moment.content.length > 20 ? '...' : '')

    switch (interaction.type) {
      case 'like':
        // 检查是否已点赞
        const alreadyLiked = moment.likes.some(like => like.userId === interaction.aiId)
        if (alreadyLiked) {
          results.push({
            success: false,
            type: 'like',
            aiName: interaction.aiName,
            momentContent: momentContentPreview,
            message: `✅ ${interaction.aiName} 已经点赞过第 ${interaction.momentIndex} 条朋友圈了`
          })
        } else {
          moment.likes.push({
            id: crypto.randomUUID(),
            userId: interaction.aiId,
            userName: interaction.aiName,
            userAvatar: '🤖'  // AI默认头像
          })
          results.push({
            success: true,
            type: 'like',
            aiName: interaction.aiName,
            momentContent: momentContentPreview,
            message: `👍 ${interaction.aiName} 点赞了第 ${interaction.momentIndex} 条朋友圈`
          })
          // 添加速报
          news.push({
            type: 'like',
            actorId: interaction.aiId,
            actorName: interaction.aiName,
            targetId: moment.userId,
            targetName: moment.userName,
            momentContent: momentContentPreview
          })
        }
        break

      case 'comment':
        if (!interaction.content) {
          results.push({
            success: false,
            type: 'comment',
            aiName: interaction.aiName,
            momentContent: momentContentPreview,
            message: `❌ 评论内容不能为空`
          })
          continue
        }
        moment.comments.push({
          id: crypto.randomUUID(),
          userId: interaction.aiId,
          userName: interaction.aiName,
          userAvatar: '🤖',  // AI默认头像
          content: interaction.content,
          createdAt: Date.now()
        })
        results.push({
          success: true,
          type: 'comment',
          aiName: interaction.aiName,
          momentContent: momentContentPreview,
          commentContent: interaction.content,
          message: `💬 ${interaction.aiName} 评论了第 ${interaction.momentIndex} 条朋友圈：${interaction.content}`
        })
        // 添加速报
        news.push({
          type: 'comment',
          actorId: interaction.aiId,
          actorName: interaction.aiName,
          targetId: moment.userId,
          targetName: moment.userName,
          content: interaction.content,
          momentContent: momentContentPreview
        })
        break

      case 'reply':
        if (!interaction.content || !interaction.replyTo) {
          results.push({
            success: false,
            type: 'reply',
            aiName: interaction.aiName,
            momentContent: momentContentPreview,
            message: `❌ 回复内容和回复对象不能为空`
          })
          continue
        }
        moment.comments.push({
          id: crypto.randomUUID(),
          userId: interaction.aiId,
          userName: interaction.aiName,
          userAvatar: '🤖',  // AI默认头像
          content: interaction.content,
          createdAt: Date.now(),
          replyTo: interaction.replyTo  // 🔥 添加回复对象
        })
        results.push({
          success: true,
          type: 'reply',
          aiName: interaction.aiName,
          momentContent: momentContentPreview,
          commentContent: interaction.content,
          replyTo: interaction.replyTo,
          message: `💬 ${interaction.aiName} 回复了 ${interaction.replyTo}（第 ${interaction.momentIndex} 条）：${interaction.content}`
        })
        // 添加速报
        news.push({
          type: 'reply',
          actorId: interaction.aiId,
          actorName: interaction.aiName,
          targetId: moment.userId,
          targetName: moment.userName,
          content: interaction.content,
          replyTo: interaction.replyTo,
          momentContent: momentContentPreview
        })
        break
    }
  }

  // 保存更新后的朋友圈
    return moments
  })
  news.forEach(addMomentsNews)

  // 触发朋友圈更新事件
  window.dispatchEvent(new Event('storage'))

  return results
}
