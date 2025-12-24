/**
 * 朋友圈分组管理器
 * 管理朋友圈的可见分组，类似微信的"谁可以看"分组功能
 */

// 分组类型定义
export interface MomentsGroup {
  id: string
  name: string
  characterIds: string[]  // 分组内的角色ID列表
  createdAt: number
  color?: string  // 可选的分组颜色标识
}

const STORAGE_KEY = 'moments_groups'

/**
 * 加载所有分组
 */
export function loadMomentsGroups(): MomentsGroup[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('加载朋友圈分组失败:', error)
  }
  return []
}

/**
 * 保存分组
 */
export function saveMomentsGroups(groups: MomentsGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
    // 触发更新事件
    window.dispatchEvent(new CustomEvent('moments-groups-updated'))
  } catch (error) {
    console.error('保存朋友圈分组失败:', error)
  }
}

/**
 * 从所有圈子中移除指定角色（角色只能属于一个圈子）
 */
function removeCharacterFromAllGroups(groups: MomentsGroup[], characterIds: string[]): MomentsGroup[] {
  return groups.map(group => ({
    ...group,
    characterIds: group.characterIds.filter(id => !characterIds.includes(id))
  }))
}

/**
 * 创建新分组
 */
export function createMomentsGroup(name: string, characterIds: string[], color?: string): MomentsGroup {
  let groups = loadMomentsGroups()
  
  // 角色只能属于一个圈子，先从其他圈子移除
  groups = removeCharacterFromAllGroups(groups, characterIds)
  
  const newGroup: MomentsGroup = {
    id: Date.now().toString(),
    name,
    characterIds,
    createdAt: Date.now(),
    color
  }
  
  groups.push(newGroup)
  saveMomentsGroups(groups)
  
  console.log(`✅ 创建朋友圈分组: ${name}, 包含 ${characterIds.length} 人`)
  return newGroup
}

/**
 * 更新分组
 */
export function updateMomentsGroup(groupId: string, updates: Partial<Omit<MomentsGroup, 'id' | 'createdAt'>>): boolean {
  let groups = loadMomentsGroups()
  const index = groups.findIndex(g => g.id === groupId)
  
  if (index === -1) {
    console.error('分组不存在:', groupId)
    return false
  }
  
  // 如果更新了成员，先从其他圈子移除这些角色
  if (updates.characterIds) {
    groups = groups.map((g, i) => {
      if (i === index) return g  // 跳过当前圈子
      return {
        ...g,
        characterIds: g.characterIds.filter(id => !updates.characterIds!.includes(id))
      }
    })
  }
  
  groups[index] = {
    ...groups[index],
    ...updates
  }
  
  saveMomentsGroups(groups)
  console.log(`✅ 更新朋友圈分组: ${groups[index].name}`)
  return true
}

/**
 * 删除分组
 */
export function deleteMomentsGroup(groupId: string): boolean {
  const groups = loadMomentsGroups()
  const filtered = groups.filter(g => g.id !== groupId)
  
  if (filtered.length === groups.length) {
    console.error('分组不存在:', groupId)
    return false
  }
  
  saveMomentsGroups(filtered)
  console.log(`🗑️ 删除朋友圈分组: ${groupId}`)
  return true
}

/**
 * 获取单个分组
 */
export function getMomentsGroup(groupId: string): MomentsGroup | null {
  const groups = loadMomentsGroups()
  return groups.find(g => g.id === groupId) || null
}

/**
 * 获取角色所属的圈子
 */
export function getCharacterGroup(characterId: string): MomentsGroup | null {
  const groups = loadMomentsGroups()
  return groups.find(g => g.characterIds.includes(characterId)) || null
}

/**
 * 预设分组颜色
 */
export const GROUP_COLORS = [
  '#FF6B6B',  // 红
  '#4ECDC4',  // 青
  '#45B7D1',  // 蓝
  '#96CEB4',  // 绿
  '#FFEAA7',  // 黄
  '#DDA0DD',  // 紫
  '#F8B500',  // 橙
  '#95E1D3',  // 薄荷
]

/**
 * 获取下一个可用颜色
 */
export function getNextGroupColor(): string {
  const groups = loadMomentsGroups()
  const usedColors = groups.map(g => g.color).filter(Boolean)
  
  for (const color of GROUP_COLORS) {
    if (!usedColors.includes(color)) {
      return color
    }
  }
  
  // 如果颜色都用完了，随机返回一个
  return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)]
}
