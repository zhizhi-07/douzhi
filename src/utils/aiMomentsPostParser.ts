/**
 * AI发朋友圈指令解析器
 * 解析AI在聊天中发送的朋友圈发布指令
 */

import { saveMoments, loadMoments } from './momentsManager'

/**
 * AI朋友圈发布指令
 */
export interface AIMomentsPost {
  content: string  // 朋友圈内容
  aiName: string  // AI角色名称
  aiId: string    // AI角色ID
  aiAvatar: string  // AI角色头像
  visibleTo?: string[]  // 仅谁可见（用户名列表）
  mentions?: string[]   // @提到了谁（用户名列表）
}

/**
 * AI朋友圈删除指令
 */
export interface AIMomentsDelete {
  momentId: string  // 要删除的朋友圈ID（从AI的描述中查找）
  aiId: string     // AI角色ID
  aiName: string   // AI角色名称
}

/**
 * 解析AI消息中的朋友圈发布指令
 * @param message AI的消息内容
 * @param aiName AI角色名称
 * @param aiId AI角色ID
 * @param aiAvatar AI角色头像
 * @returns 解析出的朋友圈发布指令和清理后的消息内容
 */
export function parseAIMomentsPost(
  message: string,
  aiName: string,
  aiId: string,
  aiAvatar: string
): { post: AIMomentsPost | null, cleanedMessage: string } {
  // 匹配格式：朋友圈：内容[|仅xx可见][|@xx @yy]
  // 支持换行符前后都可以，贪婪匹配整行内容
  const pattern = /^朋友圈[:：](.+?)(?:\|(.+?))?$/m
  const match = message.match(pattern)
  
  if (!match) {
    // 如果没匹配到独立一行的，尝试匹配行内的
    const inlinePattern = /朋友圈[:：]([^\n]+)/
    const inlineMatch = message.match(inlinePattern)
    if (inlineMatch) {
      const fullMatch = inlineMatch[1].trim()
      // 解析内容和可选参数
      const parts = fullMatch.split('|')
      const content = parts[0].trim()
      
      if (content) {
        let visibleTo: string[] | undefined
        let mentions: string[] | undefined
        
        // 解析后续部分
        const extraInfo = parts.slice(1).join('|')
        if (extraInfo) {
          // 解析"仅xx可见"
          const visibleMatch = extraInfo.match(/仅([^@|]+)可见/)
          if (visibleMatch) {
            const names = visibleMatch[1].split(/[,，、\s]+/).map(n => n.trim()).filter(Boolean)
            if (names.length > 0) {
              visibleTo = names
            }
          }
          
          // 解析"@xx @yy"
          const mentionMatches = extraInfo.matchAll(/@([^@,，、\s|]+)/g)
          const mentionsList = Array.from(mentionMatches, m => m[1].trim()).filter(Boolean)
          if (mentionsList.length > 0) {
            mentions = mentionsList
          }
        }
        
        const post: AIMomentsPost = {
          content,
          aiName,
          aiId,
          aiAvatar,
          visibleTo,
          mentions
        }
        
        const cleanedMessage = message.replace(inlineMatch[0], '').trim()
        
        console.log('📱 [parseAIMomentsPost] 解析结果（行内）:', {
          原始消息: message,
          匹配到: inlineMatch[0],
          朋友圈内容: content,
          清理后消息: cleanedMessage
        })
        
        return { post, cleanedMessage }
      }
    }
    return { post: null, cleanedMessage: message }
  }
  
  // 匹配到独立一行的朋友圈指令
  const content = match[1].trim()
  
  if (!content) {
    return { post: null, cleanedMessage: message }
  }
  
  // 解析可选参数（仅xx可见、@xx）
  const extraInfo = match[2] ? match[2].trim() : ''
  let visibleTo: string[] | undefined
  let mentions: string[] | undefined
  
  if (extraInfo) {
    // 解析"仅xx可见"
    const visibleMatch = extraInfo.match(/仅([^@|]+)可见/)
    if (visibleMatch) {
      const names = visibleMatch[1].split(/[,，、\s]+/).map(n => n.trim()).filter(Boolean)
      if (names.length > 0) {
        visibleTo = names
      }
    }
    
    // 解析"@xx @yy"
    const mentionMatches = extraInfo.matchAll(/@([^@,，、\s|]+)/g)
    const mentionsList = Array.from(mentionMatches, m => m[1].trim()).filter(Boolean)
    if (mentionsList.length > 0) {
      mentions = mentionsList
    }
  }
  
  const post: AIMomentsPost = {
    content,
    aiName,
    aiId,
    aiAvatar,
    visibleTo,
    mentions
  }
  
  // 从消息中移除朋友圈指令
  // 如果朋友圈指令后面有换行，也一起删除
  let cleanedMessage = message.replace(match[0], '')
  
  // 清理可能留下的多余换行符
  cleanedMessage = cleanedMessage.replace(/^\n+/, '').replace(/\n+$/, '').trim()
  
  console.log('📱 [parseAIMomentsPost] 解析结果:', {
    原始消息: message,
    匹配到: match[0],
    朋友圈内容: content,
    清理后消息: cleanedMessage
  })
  
  return { post, cleanedMessage }
}

/**
 * 执行AI发朋友圈操作
 * @param post 朋友圈发布指令
 * @returns 是否成功发布
 */
export function executeAIMomentsPost(post: AIMomentsPost): boolean {
  console.log('🚀 [AI发朋友圈] 开始发布朋友圈...', post)
  
  try {
    // 获取现有朋友圈列表
    const moments = loadMoments()
    console.log(`📚 [AI发朋友圈] 当前朋友圈数量: ${moments.length}`)
    
    // 创建新的朋友圈
    const newMoment = {
      id: Date.now().toString(),
      userId: post.aiId,
      userName: post.aiName,
      userAvatar: post.aiAvatar,
      content: post.content,
      images: [],
      likes: [],
      comments: [],
      createdAt: Date.now(),
      visibleTo: post.visibleTo,
      mentions: post.mentions
    }
    
    console.log('📱 [AI发朋友圈] 创建新朋友圈对象:', newMoment)
    
    // 添加到列表开头（最新的在前面）
    moments.unshift(newMoment)
    console.log(`📚 [AI发朋友圈] 添加后朋友圈数量: ${moments.length}`)
    
    // 保存更新后的朋友圈列表
    saveMoments(moments)
    console.log('💾 [AI发朋友圈] 已保存到localStorage')
    
    // 触发朋友圈更新事件
    window.dispatchEvent(new Event('storage'))
    console.log('🔔 [AI发朋友圈] 已触发storage更新事件')
    
    console.log(`✅ [AI发朋友圈] ${post.aiName} 发布了朋友圈: ${post.content}`)
    
    return true
  } catch (error) {
    console.error('❌ [AI发朋友圈] 发布失败:', error)
    return false
  }
}

/**
 * 解析AI消息中的删除朋友圈指令
 * @param message AI的消息内容
 * @param aiId AI角色ID
 * @param aiName AI角色名称
 * @returns 解析出的删除指令和清理后的消息内容
 */
export function parseAIMomentsDelete(
  message: string,
  aiId: string,
  aiName: string
): { deleteCmd: AIMomentsDelete | null, cleanedMessage: string } {
  // 匹配格式：删除朋友圈：朋友圈内容描述
  const pattern = /删除朋友圈[:：](.+?)(?:\n|$)/
  const match = message.match(pattern)
  
  if (!match) {
    return { deleteCmd: null, cleanedMessage: message }
  }
  
  const description = match[1].trim()
  
  if (!description) {
    return { deleteCmd: null, cleanedMessage: message }
  }
  
  // 查找AI自己的朋友圈
  const moments = loadMoments()
  const myMoments = moments.filter(m => m.userId === aiId && !m.isDeleted)
  
  console.log(`🔍 [AI删除朋友圈] 查找AI的朋友圈...`, {
    aiId,
    aiName,
    描述: description,
    AI的朋友圈数量: myMoments.length
  })
  
  // 简单匹配：找到内容包含描述关键词的朋友圈
  const targetMoment = myMoments.find(m => 
    m.content.includes(description) || description.includes(m.content.substring(0, 20))
  )
  
  if (!targetMoment) {
    console.warn(`⚠️ [AI删除朋友圈] 未找到匹配的朋友圈`)
    return { deleteCmd: null, cleanedMessage: message }
  }
  
  const deleteCmd: AIMomentsDelete = {
    momentId: targetMoment.id,
    aiId,
    aiName
  }
  
  // 从消息中移除删除指令
  const cleanedMessage = message.replace(match[0], '').trim()
  
  console.log('🗑️ [parseAIMomentsDelete] 解析结果:', {
    原始消息: message,
    匹配到: match[0],
    朋友圈ID: targetMoment.id,
    朋友圈内容: targetMoment.content,
    清理后消息: cleanedMessage
  })
  
  return { deleteCmd, cleanedMessage }
}

/**
 * 执行AI删除朋友圈操作
 * @param deleteCmd 删除指令
 * @returns 删除的朋友圈内容（用于系统消息）
 */
export function executeAIMomentsDelete(deleteCmd: AIMomentsDelete): string | null {
  console.log('🗑️ [AI删除朋友圈] 开始删除...', deleteCmd)
  
  try {
    const moments = loadMoments()
    const moment = moments.find(m => m.id === deleteCmd.momentId)
    
    if (!moment) {
      console.error('❌ [AI删除朋友圈] 朋友圈不存在')
      return null
    }
    
    // 标记为已删除
    moment.isDeleted = true
    moment.deletedAt = Date.now()
    
    // 保存
    saveMoments(moments)
    console.log('💾 [AI删除朋友圈] 已标记为删除')
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    console.log('🔔 [AI删除朋友圈] 已触发storage更新事件')
    
    console.log(`✅ [AI删除朋友圈] ${deleteCmd.aiName} 删除了朋友圈: ${moment.content}`)
    
    // 返回被删除的内容
    return moment.content
  } catch (error) {
    console.error('❌ [AI删除朋友圈] 删除失败:', error)
    return null
  }
}
