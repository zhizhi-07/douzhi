/**
 * 朋友圈AI系统类型定义
 * 统一管理所有AI相关的类型
 */

/**
 * AI动作类型
 */
export type AIActionType = 'like' | 'comment' | 'dm' | 'none'

/**
 * AI导演编排的单个动作
 */
export interface AIAction {
  characterId: string
  characterName: string
  action: AIActionType
  delay: number  // 延迟秒数
  reason: string  // 编排理由
  commentContent?: string  // 评论内容
  dmContent?: string  // 私聊内容
  replyTo?: string  // 回复对象
}

/**
 * AI导演编排的完整场景
 */
export interface AIScene {
  scene: string  // 场景描述
  dramatic_analysis?: string  // 戏剧分析
  actions: AIAction[]  // 动作列表
}

/**
 * 角色信息（供AI分析用）
 */
export interface CharacterInfo {
  id: string
  name: string
  personality: string
  chatCount: number
  recentChat: string
}
