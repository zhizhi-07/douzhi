/**
 * 角色管理器 - 使用 IndexedDB 存储
 * 解决 localStorage 配额限制问题
 * 🔥 新增：localStorage 备份机制，防止数据丢失
 */

import type { Character } from '../services/characterService'
import * as IDB from './indexedDBManager'

// 内存缓存
let characterCache: Character[] | null = null

// 🔥 备份 key
const BACKUP_KEY = 'characters_backup'

/**
 * 🔥 备份角色到 localStorage
 */
function backupCharactersToLocalStorage(characters: Character[]): void {
  try {
    // 简化角色数据，移除大型字段以节省空间
    const simplified = characters.map(c => ({
      ...c,
      // 保留头像URL，但如果是base64则截断
      avatar: c.avatar?.startsWith('data:') ? c.avatar.substring(0, 100) + '...[truncated]' : c.avatar
    }))
    
    const backup = {
      characters: simplified,
      timestamp: Date.now()
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    console.log(`💾 [角色备份] 已备份 ${characters.length} 个角色到 localStorage`)
  } catch (e) {
    // localStorage 可能已满，静默失败
    console.warn('⚠️ [角色备份] 备份失败:', e)
  }
}

/**
 * 🔥 从 localStorage 恢复角色
 */
function restoreCharactersFromBackup(): Character[] | null {
  try {
    const backup = localStorage.getItem(BACKUP_KEY)
    if (!backup) return null
    
    const parsed = JSON.parse(backup)
    if (!parsed.characters || !Array.isArray(parsed.characters)) return null
    
    console.log(`🔄 [角色恢复] 从 localStorage 恢复 ${parsed.characters.length} 个角色`)
    return parsed.characters
  } catch (e) {
    console.warn('⚠️ [角色恢复] 恢复失败:', e)
    return null
  }
}

/**
 * 🔥 强制重新加载角色（清除缓存后从 IndexedDB 加载）
 */
export async function forceReloadCharacters(): Promise<Character[]> {
  console.log('🔄 [角色管理] 强制重新加载角色...')
  characterCache = null  // 清除缓存
  return getAllCharacters()
}

/**
 * 获取所有角色（异步）
 * 🔥 增强：如果 IndexedDB 为空，尝试从备份恢复
 */
export async function getAllCharacters(): Promise<Character[]> {
  // 优先使用缓存
  if (characterCache) {
    return characterCache
  }
  
  try {
    let characters = await IDB.getItem<Character[]>(IDB.STORES.CHARACTERS, 'all')
    
    // 🔥 如果 IndexedDB 为空，尝试从 localStorage 备份恢复
    if (!characters || characters.length === 0) {
      const restored = restoreCharactersFromBackup()
      if (restored && restored.length > 0) {
        console.log(`✅ [角色恢复] 从备份恢复了 ${restored.length} 个角色`)
        // 恢复到 IndexedDB
        await IDB.setItem(IDB.STORES.CHARACTERS, 'all', restored)
        characters = restored
      }
    }
    
    characterCache = characters || []
    return characterCache
  } catch (error) {
    console.error('读取角色失败:', error)
    
    // 🔥 IndexedDB 失败时，尝试从备份恢复
    const restored = restoreCharactersFromBackup()
    if (restored && restored.length > 0) {
      characterCache = restored
      return characterCache
    }
    
    return []
  }
}

/**
 * 保存所有角色（异步）
 * 🔥 同时备份到 localStorage
 * 🔥🔥🔥 关键修复：先更新缓存，再异步保存，防止竞态条件
 */
export async function saveAllCharacters(characters: Character[]): Promise<void> {
  // 🔥🔥🔥 关键：立即更新内存缓存，不等 IndexedDB
  characterCache = characters
  
  try {
    await IDB.setItem(IDB.STORES.CHARACTERS, 'all', characters)
    
    // 🔥 同时备份到 localStorage
    backupCharactersToLocalStorage(characters)
    
    console.log('✅ 角色数据已保存到 IndexedDB')
  } catch (error) {
    console.error('保存角色失败:', error)
    // 🔥 即使 IndexedDB 失败，缓存已更新，至少当前会话不会丢失数据
    // 同时尝试备份到 localStorage
    backupCharactersToLocalStorage(characters)
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
