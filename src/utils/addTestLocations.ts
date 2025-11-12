/**
 * 添加测试位置数据的工具函数
 */
import { locationService } from '../services/locationService'
import { characterService } from '../services/characterService'

export async function addTestLocations() {
  try {
    const characters = characterService.getAll()
    
    if (characters.length === 0) {
      console.log('⚠️ 没有角色数据，无法添加测试位置')
      return
    }

    // 测试位置数据 - 使用虚拟城市地名
    const testLocations: Array<{
      characterId: string
      characterName: string
      areaId: string
      areaName: string
      lat: number
      lng: number
      position: { x: number, y: number }
      activity: string
      timestamp: number
      source: 'system'
    }> = [
      {
        characterId: characters[0].id,
        characterName: characters[0].nickname || characters[0].realName,
        areaId: 'virtual_area_1',
        areaName: '星河广场',
        lat: 39.9045,
        lng: 116.4070,
        position: { x: 50, y: 50 },
        activity: '在咖啡厅看书',
        timestamp: Date.now(),
        source: 'system'
      }
    ]

    // 如果有更多角色，添加更多位置
    if (characters.length > 1) {
      testLocations.push({
        characterId: characters[1].id,
        characterName: characters[1].nickname || characters[1].realName,
        areaId: 'virtual_area_2',
        areaName: '中央公园',
        lat: 39.9005,
        lng: 116.4150,
        position: { x: 50, y: 50 },
        activity: '散步赏景',
        timestamp: Date.now(),
        source: 'system'
      })
    }

    if (characters.length > 2) {
      testLocations.push({
        characterId: characters[2].id,
        characterName: characters[2].nickname || characters[2].realName,
        areaId: 'virtual_area_3',
        areaName: '市图书馆',
        lat: 39.9120,
        lng: 116.4150,
        position: { x: 50, y: 50 },
        activity: '阅读学习',
        timestamp: Date.now(),
        source: 'system'
      })
    }

    // 添加位置记录
    for (const loc of testLocations) {
      await locationService.recordLocation(loc)
    }

    console.log('✅ 已添加', testLocations.length, '个测试位置')
    return testLocations.length
  } catch (error) {
    console.error('添加测试位置失败:', error)
    return 0
  }
}
