// 角色数据管理服务

export interface Character {
  id: string
  realName: string
  nickname?: string
  signature?: string
  personality?: string
  world: string
  avatar?: string
  createdAt: string
}

const STORAGE_KEY = 'characters'

export const characterService = {
  // 获取所有角色
  getAll: (): Character[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('读取角色列表失败:', error)
      return []
    }
  },

  // 保存角色
  save: (character: Omit<Character, 'id' | 'createdAt'>): Character => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      ...character,
      createdAt: new Date().toISOString()
    }
    
    const characters = characterService.getAll()
    characters.push(newCharacter)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    return newCharacter
  },

  // 删除角色
  delete: (id: string): void => {
    const characters = characterService.getAll()
    const filtered = characters.filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },

  // 更新角色
  update: (id: string, updates: Partial<Character>): Character | null => {
    const characters = characterService.getAll()
    const index = characters.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    characters[index] = { ...characters[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    
    return characters[index]
  },

  // 根据ID获取角色
  getById: (id: string): Character | null => {
    const characters = characterService.getAll()
    return characters.find(c => c.id === id) || null
  }
}
