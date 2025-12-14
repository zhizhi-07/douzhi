// 角色数据管理服务
// 🔥 现在使用 IndexedDB 存储，解决 localStorage 配额限制

import * as CharacterManager from '../utils/characterManager'


export interface Character {
  id: string
  realName: string
  nickname?: string
  remark?: string  // 用户给角色设置的备注名（类似微信备注）
  signature?: string
  personality?: string
  avatar?: string
  createdAt: string
  momentsVisibleCount?: number  // AI可见的朋友圈条数，默认10条
  currentActivity?: string  // 当前状态（如：在看电影、在上班、空闲）
  isPublicFigure?: boolean  // 是否为公众人物（网络上都认识的人）
  publicPersona?: string  // 网络人设描述（如：全网黑、网红、争议人物）
  pokeSuffix?: string  // 拍一拍后缀（如："的小脑袋"）
  worldSetting?: string  // 世界观设定（自定义，如"古代仙侠世界，用传信玉佩联系"）
  languageStyle?: 'modern' | 'ancient' | 'noble' | 'fantasy' | 'auto'  // 语言风格
}

// 🔥 完全移除localStorage依赖，只用IndexedDB
// 原因：localStorage配额小（5MB），经常满导致角色丢失

// 内存缓存
let charactersCache: Character[] = []
let isLoaded = false
let loadPromise: Promise<void> | null = null

// 🔥 初始化：从IndexedDB加载角色
function initCharacters(): Promise<void> {
  if (loadPromise) return loadPromise
  
  loadPromise = (async () => {
    try {
      // 🔥 增加超时时间到 15 秒
      const characters = await Promise.race([
        CharacterManager.getAllCharacters(),
        new Promise<Character[]>((_, reject) => 
          setTimeout(() => reject(new Error('IndexedDB加载超时')), 15000)
        )
      ])
      
      charactersCache = characters || []
      isLoaded = true
      console.log(`✅ 已从 IndexedDB 加载 ${charactersCache.length} 个角色`)
      
      // 🔥 触发事件通知其他组件角色已加载
      window.dispatchEvent(new CustomEvent('characters-loaded', { 
        detail: { count: charactersCache.length } 
      }))
    } catch (e) {
      console.error('❌ IndexedDB 加载角色失败:', e)
      // 🔥 超时时返回空数组，不阻塞应用
      charactersCache = []
      isLoaded = true // 标记为已加载，避免无限等待
    }
  })()
  
  return loadPromise
}

// 立即开始加载
initCharacters()

export const characterService = {
  // 获取所有角色（同步，使用缓存）
  getAll: (): Character[] => {
    return charactersCache
  },
  
  // 🔥 新增：等待角色加载完成
  waitForLoad: (): Promise<void> => {
    return loadPromise || Promise.resolve()
  },
  
  // 🔥 新增：检查是否已加载
  isLoaded: (): boolean => {
    return isLoaded
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
    
    // 🔥 只保存到IndexedDB，不用localStorage
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('保存角色失败:', e)
    )
    
    return newCharacter
  },

  // 删除角色
  delete: (id: string): void => {
    if (!charactersCache) return
    charactersCache = charactersCache.filter(c => c.id !== id)
    
    // 🔥 只保存到IndexedDB
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
    
    // 🔥 只保存到IndexedDB
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('更新角色失败:', e)
    )
    
    // 🔥 如果更新了头像，同步更新情侣空间
    if (updates.avatar) {
      try {
        const relationData = localStorage.getItem('couple_space_relation')
        if (relationData) {
          const relation = JSON.parse(relationData)
          if (relation && relation.characterId === id && relation.status === 'active') {
            relation.characterAvatar = updates.avatar
            localStorage.setItem('couple_space_relation', JSON.stringify(relation))
            console.log('✅ [角色更新] 已同步更新情侣空间头像')
          }
        }
      } catch (e) {
        console.error('同步情侣空间头像失败:', e)
      }
    }
    
    return charactersCache[index]
  },

  // 根据ID获取角色
  getById: (id: string): Character | null => {
    const characters = characterService.getAll()
    return characters.find(c => c.id === id) || null
  }
}
