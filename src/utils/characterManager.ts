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
 * 删除角色
 */
export async function deleteCharacter(id: string): Promise<void> {
  const characters = await getAllCharacters()
  const filtered = characters.filter(c => c.id !== id)
  await saveAllCharacters(filtered)
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
