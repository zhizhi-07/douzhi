/**
 * 角色管理器 - 使用 IndexedDB 存储
 * 解决 localStorage 配额限制问题
 */

import type { Character } from '../services/characterService'
import * as IDB from './indexedDBManager'

// 内存缓存
let characterCache: Character[] | null = null

/**
 * 获取所有角色（异步）
 */
export async function getAllCharacters(): Promise<Character[]> {
  // 优先使用缓存
  if (characterCache) {
    return characterCache
  }
  
  try {
    const characters = await IDB.getItem<Character[]>(IDB.STORES.CHARACTERS, 'all')
    characterCache = characters || []
    return characterCache
  } catch (error) {
    console.error('读取角色失败:', error)
    return []
  }
}

/**
 * 保存所有角色（异步）
 */
export async function saveAllCharacters(characters: Character[]): Promise<void> {
  try {
    await IDB.setItem(IDB.STORES.CHARACTERS, 'all', characters)
    characterCache = characters
    console.log('✅ 角色数据已保存到 IndexedDB')
  } catch (error) {
    console.error('保存角色失败:', error)
    throw error
  }
}

/**
 * 添加角色
 */
export async function addCharacter(character: Character): Promise<void> {
  const characters = await getAllCharacters()
  characters.push(character)
  await saveAllCharacters(characters)
}

/**
 * 更新角色
 */
export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
  const characters = await getAllCharacters()
  const index = characters.findIndex(c => c.id === id)
  
  if (index === -1) return null
  
  characters[index] = { ...characters[index], ...updates }
  await saveAllCharacters(characters)
  
  return characters[index]
}

/**
 * 删除角色及其所有相关数据
 */
export async function deleteCharacter(id: string): Promise<void> {
  // 1. 删除角色本身
  const characters = await getAllCharacters()
  const filtered = characters.filter(c => c.id !== id)
  await saveAllCharacters(filtered)
  
  // 2. 删除聊天记录（IndexedDB）
  try {
    await IDB.removeItem(IDB.STORES.MESSAGES, id)
    console.log(`✅ 已删除角色 ${id} 的聊天记录`)
  } catch (error) {
    console.error('删除聊天记录失败:', error)
  }
  
  // 3. 删除聊天列表中的条目
  try {
    const chatList = await IDB.getItem<any[]>(IDB.STORES.SETTINGS, 'chat_list') || []
    const filteredChatList = chatList.filter(chat => chat.id !== id)
    await IDB.setItem(IDB.STORES.SETTINGS, 'chat_list', filteredChatList)
    console.log(`✅ 已从聊天列表中移除角色 ${id}`)
  } catch (error) {
    console.error('更新聊天列表失败:', error)
  }
  
  // 4. 删除 localStorage 中的相关数据
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key === `chat_settings_${id}` ||
      key === `user_bubble_color_${id}` ||
      key === `ai_bubble_color_${id}` ||
      key === `user_text_color_${id}` ||
      key === `ai_text_color_${id}` ||
      key === `user_bubble_css_${id}` ||
      key === `ai_bubble_css_${id}` ||
      key === `wallpaper_${id}` ||
      key === `lorebook_${id}`
    )) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log(`✅ 已删除 localStorage 键: ${key}`)
  })
  
  // 5. 触发事件通知聊天列表刷新
  window.dispatchEvent(new Event('character-deleted'))
  window.dispatchEvent(new Event('storage'))
  
  console.log(`✅ 角色 ${id} 及其所有相关数据已完全删除`)
}

/**
 * 根据ID获取角色
 */
export async function getCharacterById(id: string): Promise<Character | null> {
  const characters = await getAllCharacters()
  return characters.find(c => c.id === id) || null
}

/**
 * 清除缓存（用于强制重新加载）
 */
export function clearCache(): void {
  characterCache = null
}
