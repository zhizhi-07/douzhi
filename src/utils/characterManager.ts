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
 * 🔥 备份角色到 IndexedDB，旧 localStorage 副本保留至提交成功
 */
async function backupCharacters(characters: Character[]): Promise<void> {
  const legacy = localStorage.getItem(BACKUP_KEY)
  try {
    await IDB.setItem(IDB.STORES.MISC, BACKUP_KEY, { characters, timestamp: Date.now() })
    if (localStorage.getItem(BACKUP_KEY) === legacy) localStorage.removeItem(BACKUP_KEY)
  } catch (error) {
    console.warn('角色主数据已保存，备份更新失败，旧备份已保留:', error)
  }
}

/**
 * 🔥 从 localStorage 恢复角色
 */
async function restoreCharactersFromBackup(): Promise<Character[] | null> {
  try {
    const saved = await IDB.getItem<{ characters: Character[] }>(IDB.STORES.MISC, BACKUP_KEY, true)
    if (Array.isArray(saved?.characters)) return saved.characters
    const raw = localStorage.getItem(BACKUP_KEY)
    const legacy = raw ? JSON.parse(raw) : null
    return Array.isArray(legacy?.characters) ? legacy.characters : null
  } catch (error) {
    console.warn('角色备份不可读，原数据已保留:', error)
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
    if (characters === null) {
      const restored = await restoreCharactersFromBackup()
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
    const restored = await restoreCharactersFromBackup()
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
    await backupCharacters(characters)
    
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
  await backupCharacters(saved)
}

/**
 * 更新角色
 */
export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
  await getAllCharacters()
  const saved = await IDB.updateItem<Character[]>(IDB.STORES.CHARACTERS, 'all', current => {
    if (!Array.isArray(current)) throw new Error('角色存储格式错误')
    return current.map(character => character.id === id ? { ...character, ...updates, id } : character)
  })
  characterCache = saved
  await backupCharacters(saved)
  return saved.find(character => character.id === id) || null
}

/**
 * 删除角色及其所有相关数据
 */
export async function deleteCharacter(id: string): Promise<void> {
  const messages = await import('./simpleMessageManager')
  await messages.flushCharacterMessages(id)
  characterCache = await IDB.deleteCharacterRecords(id)
  localStorage.removeItem(BACKUP_KEY)
  messages.forgetCharacterMessages(id)
  const legacyPrefixes = [`msg_backup_${id}`, `chat_messages_${id}`, `messages_${id}`]
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && legacyPrefixes.some(prefix => key === prefix || key.startsWith(`${prefix}_sub_`))) localStorage.removeItem(key)
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
