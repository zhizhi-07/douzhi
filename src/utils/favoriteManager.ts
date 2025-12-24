/**
 * 收藏管理器
 * 用于管理用户收藏的聊天记录
 */

import type { Message } from '../types/chat'

export interface FavoriteItem {
  id: string  // 唯一ID
  chatId: string  // 来源聊天ID
  characterName: string  // 角色名称
  characterAvatar?: string  // 角色头像
  messages: Message[]  // 收藏的消息列表
  createdAt: number  // 收藏时间
  note?: string  // 备注
}

const STORAGE_KEY = 'chat_favorites'

/**
 * 获取所有收藏
 */
export const getFavorites = (): FavoriteItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('读取收藏失败:', e)
    return []
  }
}

/**
 * 保存收藏列表
 */
const saveFavorites = (favorites: FavoriteItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch (e) {
    console.error('保存收藏失败:', e)
  }
}

/**
 * 添加收藏
 */
export const addFavorite = (
  chatId: string,
  characterName: string,
  characterAvatar: string | undefined,
  messages: Message[],
  note?: string
): FavoriteItem => {
  const favorites = getFavorites()
  
  const newFavorite: FavoriteItem = {
    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chatId,
    characterName,
    characterAvatar,
    messages: messages.map(m => ({ ...m })), // 深拷贝消息
    createdAt: Date.now(),
    note
  }
  
  favorites.unshift(newFavorite) // 新的在前面
  saveFavorites(favorites)
  
  console.log(`⭐ 已收藏 ${messages.length} 条消息`)
  return newFavorite
}

/**
 * 删除收藏
 */
export const deleteFavorite = (favoriteId: string): boolean => {
  const favorites = getFavorites()
  const index = favorites.findIndex(f => f.id === favoriteId)
  
  if (index === -1) return false
  
  favorites.splice(index, 1)
  saveFavorites(favorites)
  
  console.log(`🗑️ 已删除收藏: ${favoriteId}`)
  return true
}

/**
 * 更新收藏备注
 */
export const updateFavoriteNote = (favoriteId: string, note: string): boolean => {
  const favorites = getFavorites()
  const favorite = favorites.find(f => f.id === favoriteId)
  
  if (!favorite) return false
  
  favorite.note = note
  saveFavorites(favorites)
  
  return true
}

/**
 * 获取收藏数量
 */
export const getFavoriteCount = (): number => {
  return getFavorites().length
}

/**
 * 格式化消息内容用于显示
 */
export const formatMessageContent = (message: Message): string => {
  if (message.content) return message.content
  if (message.voiceText) return `[语音] ${message.voiceText}`
  if (message.photoDescription) return `[图片] ${message.photoDescription}`
  if (message.location) return `[位置] ${message.location.name}`
  if (message.transfer) return `[转账] ¥${message.transfer.amount}`
  if (message.redPacket) return `[红包] ${message.redPacket.message || '恭喜发财'}`
  if (message.emoji) return `[表情] ${message.emoji.name}`
  if (message.theatre) return `[小剧场] ${message.theatre.templateName}`
  if (message.forwardedChat) return `[聊天记录]`
  if (message.intimatePay) return `[亲密付]`
  if (message.coupleSpaceInvite) return `[情侣空间邀请]`
  if (message.messageType === 'poke') return `[拍一拍]`
  if (message.messageType === 'system') return `[系统消息] ${message.content || ''}`
  if (message.messageType === 'busy') return `[忙碌]`
  return '[未知消息类型]'
}
