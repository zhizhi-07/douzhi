// 角色数据管理服务
// 🔥 现在使用 IndexedDB 存储，解决 localStorage 配额限制

import * as CharacterManager from '../utils/characterManager'

export interface Character {
  id: string
  realName: string
  nickname?: string
  signature?: string
  personality?: string
  avatar?: string
  createdAt: string
  momentsVisibleCount?: number  // AI可见的朋友圈条数，默认10条
  currentActivity?: string  // 当前状态（如：在看电影、在上班、空闲）
  isPublicFigure?: boolean  // 是否为公众人物（网络上都认识的人）
  publicPersona?: string  // 网络人设描述（如：全网黑、网红、争议人物）
  pokeSuffix?: string  // 拍一拍后缀（如："的小脑袋"）
}

const STORAGE_KEY = 'characters' // 仅用于迁移旧数据

// 默认角色已移除，用户需要自行创建角色

// 内存缓存
let charactersCache: Character[] = [] // 初始为空数组

// 🔥 优化初始化：先同步加载localStorage作为快速缓存
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    charactersCache = JSON.parse(saved)
    console.log(`⚡ 已从 localStorage 同步加载 ${charactersCache.length} 个角色（临时缓存）`)
  }
} catch (e) {
  console.error('从 localStorage 加载失败:', e)
}

// 🔥 后台异步从 IndexedDB 加载（加超时保护）
Promise.race([
  CharacterManager.getAllCharacters(),
  new Promise<Character[]>((_, reject) => setTimeout(() => reject(new Error('超时')), 3000))
]).then(characters => {
  if (characters.length === 0) {
    // IndexedDB 是空的，用 localStorage 数据
    if (charactersCache.length > 0) {
      console.log(`📦 迁移 ${charactersCache.length} 个角色到 IndexedDB`)
      CharacterManager.saveAllCharacters(charactersCache)
      // 🔥 不删除 localStorage 备份！保留作为安全网
    }
  } else {
    // IndexedDB 有数据
    charactersCache = characters
    console.log(`✅ 已从 IndexedDB 加载 ${characters.length} 个角色`)
    // 🔥 同步更新 localStorage 备份
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    } catch {}
  }
}).catch(e => {
  console.warn('⚠️ IndexedDB 加载失败或超时，使用 localStorage 缓存:', e)
  // 🔥 关键：失败时保持 localStorage 数据，不清空
})

export const characterService = {
  // 获取所有角色（同步，使用缓存）
  getAll: (): Character[] => {
    // 🔥 直接返回缓存，无需复杂检查
    // 因为 charactersCache 现在始终有值（最少包含默认角色）
    return charactersCache
  },

  // 保存角色
  save: (character: Omit<Character, 'id' | 'createdAt'>): Character => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      ...character,
      createdAt: new Date().toISOString()
    }
    
    if (!charactersCache) charactersCache = []
    charactersCache.push(newCharacter)
    
    // 🔥 立即同步备份到 localStorage（防止刷新丢失）
    try {
      localStorage.setItem('characters', JSON.stringify(charactersCache))
      console.log('💾 角色已同步备份到 localStorage')
    } catch (e) {
      console.warn('localStorage 备份失败:', e)
    }
    
    // 后台异步保存到 IndexedDB
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('保存角色失败:', e)
    )
    
    return newCharacter
  },

  // 删除角色
  delete: (id: string): void => {
    if (!charactersCache) return
    charactersCache = charactersCache.filter(c => c.id !== id)
    
    // 🔥 立即同步备份
    try {
      localStorage.setItem('characters', JSON.stringify(charactersCache))
    } catch {}
    
    // 后台异步保存
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('删除角色失败:', e)
    )
  },

  // 更新角色
  update: (id: string, updates: Partial<Character>): Character | null => {
    if (!charactersCache) return null
    const index = charactersCache.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    charactersCache[index] = { ...charactersCache[index], ...updates }
    
    // 🔥 立即同步备份
    try {
      localStorage.setItem('characters', JSON.stringify(charactersCache))
    } catch {}
    
    // 后台异步保存
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('更新角色失败:', e)
    )
    
    return charactersCache[index]
  },

  // 根据ID获取角色
  getById: (id: string): Character | null => {
    const characters = characterService.getAll()
    return characters.find(c => c.id === id) || null
  }
}
