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
  // 匹配格式：朋友圈：内容
  // 支持换行符前后都可以，贪婪匹配整行内容
  const pattern = /^朋友圈[:：](.+)$/m
  const match = message.match(pattern)
  
  if (!match) {
    // 如果没匹配到独立一行的，尝试匹配行内的
    const inlinePattern = /朋友圈[:：]([^\n]+)/
    const inlineMatch = message.match(inlinePattern)
    if (inlineMatch) {
      const content = inlineMatch[1].trim()
      if (content) {
        const post: AIMomentsPost = {
          content,
          aiName,
          aiId,
          aiAvatar
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
  
  const post: AIMomentsPost = {
    content,
    aiName,
    aiId,
    aiAvatar
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
      createdAt: Date.now()
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
