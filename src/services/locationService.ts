/**
 * AI位置追踪服务
 * 使用IndexedDB存储历史轨迹（支持大量数据）
 */

const DB_NAME = 'AILocationDB'
const DB_VERSION = 1
const STORE_LOCATIONS = 'locations' // 位置历史
const STORE_AREAS = 'areas' // 地图区域定义

export interface LocationRecord {
  id: string // 记录ID
  characterId: string
  characterName: string
  areaId: string // 所属区域ID
  areaName: string // 区域名称
  lat?: number // 纬度（真实地图坐标）
  lng?: number // 经度（真实地图坐标）
  position: {
    x: number // 区域内相对坐标 0-100
    y: number // 区域内相对坐标 0-100
  }
  activity?: string // 当前活动
  timestamp: number
  source: 'user' | 'ai' | 'system' // 位置来源
}

export interface MapArea {
  id: string
  name: string
  description?: string
  category: string // 类型：residential/commercial/park/school等
  color: string
  position: {
    x: number // 地图上的坐标 0-100
    y: number
  }
  size: {
    width: number
    height: number
  }
  worldBookEntryIds?: string[] // 关联的世界书条目
}

class LocationService {
  private db: IDBDatabase | null = null

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建位置历史表
        if (!db.objectStoreNames.contains(STORE_LOCATIONS)) {
          const locationStore = db.createObjectStore(STORE_LOCATIONS, { keyPath: 'id' })
          locationStore.createIndex('characterId', 'characterId', { unique: false })
          locationStore.createIndex('timestamp', 'timestamp', { unique: false })
          locationStore.createIndex('areaId', 'areaId', { unique: false })
        }

        // 创建区域定义表
        if (!db.objectStoreNames.contains(STORE_AREAS)) {
          db.createObjectStore(STORE_AREAS, { keyPath: 'id' })
        }
      }
    })
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // 记录位置
  async recordLocation(location: Omit<LocationRecord, 'id'>): Promise<LocationRecord> {
    const db = await this.ensureDB()
    const record: LocationRecord = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...location
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readwrite')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const request = store.add(record)

      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  // 获取AI当前位置（最新一条）
  async getCurrentLocation(characterId: string): Promise<LocationRecord | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readonly')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const index = store.index('characterId')
      const request = index.getAll(IDBKeyRange.only(characterId))

      request.onsuccess = () => {
        const records = request.result as LocationRecord[]
        if (records.length === 0) {
          resolve(null)
        } else {
          // 返回最新的记录
          const latest = records.sort((a, b) => b.timestamp - a.timestamp)[0]
          resolve(latest)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 获取AI的轨迹历史
  async getLocationHistory(
    characterId: string,
    options?: {
      startTime?: number
      endTime?: number
      limit?: number
    }
  ): Promise<LocationRecord[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readonly')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const index = store.index('characterId')
      const request = index.getAll(IDBKeyRange.only(characterId))

      request.onsuccess = () => {
        let records = request.result as LocationRecord[]
        
        // 过滤时间范围
        if (options?.startTime) {
          records = records.filter(r => r.timestamp >= options.startTime!)
        }
        if (options?.endTime) {
          records = records.filter(r => r.timestamp <= options.endTime!)
        }

        // 按时间排序
        records.sort((a, b) => b.timestamp - a.timestamp)

        // 限制数量
        if (options?.limit) {
          records = records.slice(0, options.limit)
        }

        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 获取所有AI的当前位置
  async getAllCurrentLocations(): Promise<Map<string, LocationRecord>> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readonly')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const request = store.getAll()

      request.onsuccess = () => {
        const records = request.result as LocationRecord[]
        const locationMap = new Map<string, LocationRecord>()

        // 对每个角色，只保留最新的位置
        records.forEach(record => {
          const existing = locationMap.get(record.characterId)
          if (!existing || record.timestamp > existing.timestamp) {
            locationMap.set(record.characterId, record)
          }
        })

        resolve(locationMap)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 保存区域定义
  async saveArea(area: MapArea): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_AREAS], 'readwrite')
      const store = transaction.objectStore(STORE_AREAS)
      const request = store.put(area)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 获取所有区域
  async getAllAreas(): Promise<MapArea[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_AREAS], 'readonly')
      const store = transaction.objectStore(STORE_AREAS)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as MapArea[])
      request.onerror = () => reject(request.error)
    })
  }

  // 根据世界书条目查找关联区域
  async getAreasByWorldBookEntry(entryId: string): Promise<MapArea[]> {
    const areas = await this.getAllAreas()
    return areas.filter(area => 
      area.worldBookEntryIds?.includes(entryId)
    )
  }

  // 删除历史记录（按时间范围）
  async deleteLocationHistory(characterId: string, beforeTimestamp: number): Promise<number> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readwrite')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const index = store.index('characterId')
      const request = index.openCursor(IDBKeyRange.only(characterId))
      
      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const record = cursor.value as LocationRecord
          if (record.timestamp < beforeTimestamp) {
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 获取区域内的所有AI
  async getAIsInArea(areaId: string): Promise<LocationRecord[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_LOCATIONS], 'readonly')
      const store = transaction.objectStore(STORE_LOCATIONS)
      const index = store.index('areaId')
      const request = index.getAll(IDBKeyRange.only(areaId))

      request.onsuccess = () => {
        const records = request.result as LocationRecord[]
        // 只保留每个AI的最新位置
        const latestMap = new Map<string, LocationRecord>()
        records.forEach(record => {
          const existing = latestMap.get(record.characterId)
          if (!existing || record.timestamp > existing.timestamp) {
            latestMap.set(record.characterId, record)
          }
        })
        resolve(Array.from(latestMap.values()))
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const locationService = new LocationService()

// 初始化默认区域（真实城市布局）
export async function initDefaultAreas(): Promise<void> {
  const areas = await locationService.getAllAreas()
  if (areas.length === 0) {
    const defaultAreas: MapArea[] = [
      // 北部住宅区群
      {
        id: 'area_north_residential_01',
        name: '北湖小区',
        description: '高档住宅小区，环境优美',
        category: 'residential',
        color: '#e0f2fe',
        position: { x: 5, y: 5 },
        size: { width: 15, height: 12 }
      },
      {
        id: 'area_north_residential_02',
        name: '枫林苑',
        description: '温馨社区，配套齐全',
        category: 'residential',
        color: '#dbeafe',
        position: { x: 22, y: 5 },
        size: { width: 13, height: 12 }
      },
      {
        id: 'area_north_school',
        name: '市立第一中学',
        description: '重点中学，教学质量优秀',
        category: 'school',
        color: '#fef3c7',
        position: { x: 37, y: 6 },
        size: { width: 12, height: 10 }
      },
      {
        id: 'area_north_park',
        name: '晨曦公园',
        description: '晨练散步的好去处',
        category: 'park',
        color: '#d1fae5',
        position: { x: 51, y: 5 },
        size: { width: 18, height: 13 }
      },
      {
        id: 'area_hospital',
        name: '市人民医院',
        description: '综合性三甲医院',
        category: 'hospital',
        color: '#fee2e2',
        position: { x: 71, y: 6 },
        size: { width: 14, height: 11 }
      },
      
      // 中部商业核心区
      {
        id: 'area_downtown_mall_01',
        name: '环球购物中心',
        description: '大型综合商场',
        category: 'commercial',
        color: '#fce7f3',
        position: { x: 8, y: 20 },
        size: { width: 16, height: 15 }
      },
      {
        id: 'area_downtown_office',
        name: '中央商务区',
        description: '写字楼林立的商务区',
        category: 'office',
        color: '#e9d5ff',
        position: { x: 26, y: 20 },
        size: { width: 18, height: 15 }
      },
      {
        id: 'area_downtown_hotel',
        name: '星辰酒店',
        description: '五星级酒店',
        category: 'hotel',
        color: '#fef3c7',
        position: { x: 46, y: 21 },
        size: { width: 11, height: 13 }
      },
      {
        id: 'area_downtown_mall_02',
        name: '天街购物广场',
        description: '时尚购物圣地',
        category: 'commercial',
        color: '#fbcfe8',
        position: { x: 59, y: 20 },
        size: { width: 15, height: 14 }
      },
      {
        id: 'area_theater',
        name: '文化艺术中心',
        description: '剧院、美术馆、音乐厅',
        category: 'culture',
        color: '#e0e7ff',
        position: { x: 76, y: 21 },
        size: { width: 13, height: 13 }
      },
      
      // 西部休闲娱乐区
      {
        id: 'area_central_park',
        name: '中央公园',
        description: '城市之肺，绿意盎然',
        category: 'park',
        color: '#bbf7d0',
        position: { x: 5, y: 38 },
        size: { width: 25, height: 22 }
      },
      {
        id: 'area_cafe_street',
        name: '文艺咖啡街',
        description: '网红咖啡店聚集地',
        category: 'cafe',
        color: '#fed7aa',
        position: { x: 32, y: 39 },
        size: { width: 14, height: 10 }
      },
      {
        id: 'area_bookstore',
        name: '时光书店',
        description: '24小时书店，文艺青年的天堂',
        category: 'culture',
        color: '#e0e7ff',
        position: { x: 32, y: 51 },
        size: { width: 14, height: 9 }
      },
      {
        id: 'area_cinema',
        name: '星空影城',
        description: 'IMAX影院',
        category: 'entertainment',
        color: '#fbcfe8',
        position: { x: 48, y: 38 },
        size: { width: 13, height: 11 }
      },
      {
        id: 'area_game_center',
        name: '电玩城',
        description: '游戏娱乐中心',
        category: 'entertainment',
        color: '#fce7f3',
        position: { x: 48, y: 51 },
        size: { width: 13, height: 9 }
      },
      {
        id: 'area_restaurant_street',
        name: '美食街',
        description: '各地美食汇聚',
        category: 'restaurant',
        color: '#ffedd5',
        position: { x: 63, y: 38 },
        size: { width: 12, height: 22 }
      },
      {
        id: 'area_gym',
        name: '活力健身中心',
        description: '专业健身房',
        category: 'sports',
        color: '#fef3c7',
        position: { x: 77, y: 38 },
        size: { width: 12, height: 10 }
      },
      {
        id: 'area_stadium',
        name: '市体育馆',
        description: '大型体育场馆',
        category: 'sports',
        color: '#fef9c3',
        position: { x: 77, y: 50 },
        size: { width: 12, height: 10 }
      },
      
      // 南部产业区
      {
        id: 'area_tech_park',
        name: '科技创新园',
        description: '高新技术企业聚集地',
        category: 'office',
        color: '#ddd6fe',
        position: { x: 6, y: 63 },
        size: { width: 20, height: 15 }
      },
      {
        id: 'area_university',
        name: '市立大学',
        description: '综合性大学',
        category: 'school',
        color: '#fef3c7',
        position: { x: 28, y: 63 },
        size: { width: 18, height: 15 }
      },
      {
        id: 'area_library',
        name: '市图书馆',
        description: '藏书百万的公共图书馆',
        category: 'culture',
        color: '#dfe9ff',
        position: { x: 48, y: 64 },
        size: { width: 13, height: 13 }
      },
      {
        id: 'area_museum',
        name: '市博物馆',
        description: '历史文化展览',
        category: 'culture',
        color: '#e0e7ff',
        position: { x: 63, y: 64 },
        size: { width: 12, height: 13 }
      },
      {
        id: 'area_south_residential',
        name: '阳光花园',
        description: '新建住宅区',
        category: 'residential',
        color: '#dbeafe',
        position: { x: 77, y: 63 },
        size: { width: 12, height: 15 }
      },
      
      // 东南部区域
      {
        id: 'area_train_station',
        name: '火车站',
        description: '城市交通枢纽',
        category: 'transport',
        color: '#e5e7eb',
        position: { x: 8, y: 80 },
        size: { width: 16, height: 12 }
      },
      {
        id: 'area_hotel_cluster',
        name: '酒店群',
        description: '多家连锁酒店',
        category: 'hotel',
        color: '#fef3c7',
        position: { x: 26, y: 81 },
        size: { width: 14, height: 11 }
      },
      {
        id: 'area_market',
        name: '农贸市场',
        description: '新鲜蔬菜水果',
        category: 'commercial',
        color: '#fce7f3',
        position: { x: 42, y: 80 },
        size: { width: 13, height: 12 }
      },
      {
        id: 'area_warehouse',
        name: '物流园区',
        description: '仓储物流中心',
        category: 'industrial',
        color: '#f3f4f6',
        position: { x: 57, y: 81 },
        size: { width: 15, height: 11 }
      },
      {
        id: 'area_factory',
        name: '工业园',
        description: '制造业基地',
        category: 'industrial',
        color: '#e5e7eb',
        position: { x: 74, y: 80 },
        size: { width: 15, height: 12 }
      }
    ]

    for (const area of defaultAreas) {
      await locationService.saveArea(area)
    }
    
    console.log('✅ 初始化真实城市地图布局，共', defaultAreas.length, '个区域')
  }
}
