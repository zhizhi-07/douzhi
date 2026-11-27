/**
 * 角色管理器 - 使用 IndexedDB 存储
 * 解决 localStorage 配额限制问题
 * 🔥 新增：localStorage 备份机制，防止数据丢失
 */

import type { Character } from '../services/characterService'
import * as IDB from './indexedDBManager'
import { getCoupleSpaceRelation, endCoupleSpaceRelation, removeFamilyMember, isMemberInFamily } from './coupleSpaceUtils'

// 内存缓存
let characterCache: Character[] | null = null

// 🔥 备份 key
const BACKUP_KEY = 'characters_backup'

/**
 * 🔥 备份角色到 localStorage
 */
function backupCharactersToLocalStorage(characters: Character[]): void {
  try {
    // 保留完整头像；空间不足时报告备份失败，不生成损坏的截断URL。
    const backup = {
      characters,
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
 * 事务提交后才更新缓存，避免把未落盘角色显示为已保存。
 */
export async function saveAllCharacters(characters: Character[]): Promise<void> {
  try {
    await IDB.setItem(IDB.STORES.CHARACTERS, 'all', characters)
    characterCache = characters
    
    // 🔥 同时备份到 localStorage
    backupCharactersToLocalStorage(characters)
    
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
  const saved = await IDB.updateItem<Character[]>(IDB.STORES.CHARACTERS, 'all', current => {
    if (current !== null && !Array.isArray(current)) throw new Error('角色存储格式错误，请先恢复备份')
    const characters = current || []
    if (characters.some(existing => existing.id === character.id)) throw new Error('角色ID重复')
    return [...characters, character]
  })
  characterCache = saved
  backupCharactersToLocalStorage(saved)
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
  
  // 5. 清理情侣空间关系（如果该角色有关联的情侣空间）
  try {
    const relation = getCoupleSpaceRelation()
    if (relation) {
      // 检查是否是主角色
      if (relation.characterId === id) {
        await endCoupleSpaceRelation()
        console.log(`✅ 已清理角色 ${id} 的情侣空间关系`)
      } 
      // 检查是否在多成员列表中
      else if (isMemberInFamily(id)) {
        await removeFamilyMember(id)
        console.log(`✅ 已从情侣空间移除成员 ${id}`)
      }
    }
  } catch (error) {
    console.error('清理情侣空间关系失败:', error)
  }
  
  // 6. 触发事件通知聊天列表刷新
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
