/**
 * 情侣空间内容管理工具
 */

import { savePhotoToDB, getAllPhotosFromDB, type PhotoRecord } from './couplePhotosDB'

export interface CoupleAlbumPhoto {
  id: string
  characterId: string
  characterName: string
  uploaderName?: string
  description: string
  imageUrl?: string
  timestamp: number
  createdAt: number
}

export interface CoupleMessage {
  id: string
  characterId: string
  characterName: string
  content: string
  timestamp: number
  createdAt: number
}

export interface CoupleAnniversary {
  id: string
  characterId: string
  characterName: string
  date: string // 格式：YYYY-MM-DD
  title: string
  description?: string
  timestamp: number
  createdAt: number
}

const STORAGE_KEYS = {
  ALBUM: 'couple_photos',
  MESSAGES: 'couple_messages',
  ANNIVERSARIES: 'couple_anniversaries'
}

// ==================== 相册功能 ====================

/**
 * 添加照片（新版：使用 IndexedDB 存储图片）
 */
export const addCouplePhoto = async (
  characterId: string,
  uploaderName: string,
  description: string,
  imageUrl?: string
): Promise<CoupleAlbumPhoto> => {
  const newPhoto: CoupleAlbumPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName: uploaderName,
    uploaderName,
    description,
    imageUrl,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  // 如果有图片，保存到 IndexedDB
  if (imageUrl) {
    try {
      const photoRecord: PhotoRecord = {
        id: newPhoto.id,
        characterId,
        characterName: uploaderName,
        uploaderName,
        description,
        imageData: imageUrl,
        timestamp: newPhoto.timestamp,
        createdAt: newPhoto.createdAt
      }
      await savePhotoToDB(photoRecord)
    } catch (error) {
      console.error('❌ 保存照片到 IndexedDB 失败:', error)
      // 降级：尝试存到 localStorage（可能会失败）
      try {
        const photos = getCouplePhotosSync()
        photos.unshift(newPhoto)
        localStorage.setItem(STORAGE_KEYS.ALBUM, JSON.stringify(photos))
      } catch (e) {
        console.error('❌ 降级保存到 localStorage 也失败:', e)
        throw new Error('存储空间不足，请删除一些旧照片')
      }
    }
  } else {
    // 没有图片，只保存元数据到 localStorage
    const photos = getCouplePhotosSync()
    photos.unshift(newPhoto)
    localStorage.setItem(STORAGE_KEYS.ALBUM, JSON.stringify(photos))
  }
  
  return newPhoto
}

/**
 * 获取照片（新版：从 IndexedDB 和 localStorage 合并）
 */
export const getCouplePhotos = async (characterId?: string): Promise<CoupleAlbumPhoto[]> => {
  try {
    // 1. 从 IndexedDB 获取有图片的照片
    let photosFromDB: CoupleAlbumPhoto[] = []
    try {
      const dbPhotos = await getAllPhotosFromDB()
      photosFromDB = dbPhotos.map(p => ({
        id: p.id,
        characterId: p.characterId,
        characterName: p.characterName,
        uploaderName: p.uploaderName,
        description: p.description,
        imageUrl: p.imageData,
        timestamp: p.timestamp,
        createdAt: p.createdAt
      }))
    } catch (error) {
      console.warn('⚠️ 从 IndexedDB 获取照片失败:', error)
    }

    // 2. 从 localStorage 获取旧的照片（兼容性）
    let photosFromLS: CoupleAlbumPhoto[] = []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALBUM)
      if (data) {
        photosFromLS = JSON.parse(data)
      }
    } catch (error) {
      console.warn('⚠️ 从 localStorage 获取照片失败:', error)
    }

    // 3. 合并去重（IndexedDB 优先）
    const dbPhotoIds = new Set(photosFromDB.map(p => p.id))
    const uniqueLSPhotos = photosFromLS.filter(p => !dbPhotoIds.has(p.id))
    
    let allPhotos = [...photosFromDB, ...uniqueLSPhotos]
    
    // 4. 按时间倒序排序
    allPhotos.sort((a, b) => b.timestamp - a.timestamp)

    // 5. 按角色过滤
    if (characterId) {
      allPhotos = allPhotos.filter(p => p.characterId === characterId)
    }
    
    return allPhotos
  } catch (error) {
    console.error('❌ 获取相册失败:', error)
    return []
  }
}

/**
 * 同步版本的 getCouplePhotos（用于不支持 async 的地方）
 */
export const getCouplePhotosSync = (characterId?: string): CoupleAlbumPhoto[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ALBUM)
    if (!data) return []
    
    const photos: CoupleAlbumPhoto[] = JSON.parse(data)
    
    if (characterId) {
      return photos.filter(p => p.characterId === characterId)
    }
    
    return photos
  } catch (error) {
    console.error('获取相册失败:', error)
    return []
  }
}

export const deleteCouplePhoto = async (photoId: string): Promise<boolean> => {
  try {
    // 1. 删除 localStorage 中的记录
    const photos = getCouplePhotosSync()
    const filtered = photos.filter((p: CoupleAlbumPhoto) => p.id !== photoId)
    localStorage.setItem(STORAGE_KEYS.ALBUM, JSON.stringify(filtered))
    
    // 2. 同时删除 IndexedDB 中的照片数据
    try {
      const { deletePhotoFromDB } = await import('./couplePhotosDB')
      await deletePhotoFromDB(photoId)
      console.log(`✅ 照片已从 IndexedDB 删除: ${photoId}`)
    } catch (dbError) {
      console.warn('⚠️ 从 IndexedDB 删除照片失败（可能不存在）:', dbError)
      // 不影响整体删除结果
    }
    
    return true
  } catch (error) {
    console.error('删除照片失败:', error)
    return false
  }
}

// ==================== 留言板功能 ====================

export const addCoupleMessage = (
  characterId: string,
  characterName: string,
  content: string
): CoupleMessage => {
  const messages = getCoupleMessages()
  
  const newMessage: CoupleMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName,
    content,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  messages.unshift(newMessage)
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  
  return newMessage
}

export const getCoupleMessages = (characterId?: string): CoupleMessage[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (!data) return []
    
    const messages: CoupleMessage[] = JSON.parse(data)
    
    if (characterId) {
      return messages.filter(m => m.characterId === characterId)
    }
    
    return messages
  } catch (error) {
    console.error('获取留言失败:', error)
    return []
  }
}

export const deleteCoupleMessage = (messageId: string): boolean => {
  try {
    const messages = getCoupleMessages()
    const filtered = messages.filter(m => m.id !== messageId)
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除留言失败:', error)
    return false
  }
}

// ==================== 纪念日功能 ====================

export const addCoupleAnniversary = (
  characterId: string,
  characterName: string,
  date: string,
  title: string,
  description?: string
): CoupleAnniversary => {
  const anniversaries = getCoupleAnniversaries()
  
  const newAnniversary: CoupleAnniversary = {
    id: `anniv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName,
    date,
    title,
    description,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  anniversaries.push(newAnniversary)
  anniversaries.sort((a, b) => b.createdAt - a.createdAt)
  
  localStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(anniversaries))
  
  return newAnniversary
}

export const getCoupleAnniversaries = (characterId?: string): CoupleAnniversary[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANNIVERSARIES)
    if (!data) return []
    
    const anniversaries: CoupleAnniversary[] = JSON.parse(data)
    
    if (characterId) {
      return anniversaries.filter(a => a.characterId === characterId)
    }
    
    return anniversaries
  } catch (error) {
    console.error('获取纪念日失败:', error)
    return []
  }
}

export const deleteCoupleAnniversary = (anniversaryId: string): boolean => {
  try {
    const anniversaries = getCoupleAnniversaries()
    const filtered = anniversaries.filter(a => a.id !== anniversaryId)
    localStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除纪念日失败:', error)
    return false
  }
}

// ==================== 工具函数 ====================

/**
 * 计算距离某个日期还有多少天
 */
export const getDaysUntil = (dateStr: string): number => {
  const targetDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  const diff = targetDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化日期显示
 */
export const formatAnniversaryDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-')
  return `${month}月${day}日`
}

/**
 * 获取情侣空间内容摘要（用于AI prompt）
 */
export const getCoupleSpaceContentSummary = (characterId: string): string => {
  const photos = getCouplePhotosSync(characterId)
  const messages = getCoupleMessages(characterId)
  const anniversaries = getCoupleAnniversaries(characterId)
  
  if (photos.length === 0 && messages.length === 0 && anniversaries.length === 0) {
    return ''
  }
  
  let summary = '\n\n## 情侣空间记录\n'
  
  // 所有相册照片（按时间倒序）
  if (photos.length > 0) {
    summary += '\n📸 相册：\n'
    photos.forEach((photo: CoupleAlbumPhoto) => {
      const datetime = new Date(photo.timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      summary += `  - ${datetime} ${photo.uploaderName || photo.characterName} 分享了照片：${photo.description}\n`
    })
  }
  
  // 所有留言（按时间倒序）
  if (messages.length > 0) {
    summary += '\n💌 留言板：\n'
    messages.forEach(msg => {
      const datetime = new Date(msg.timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      const author = msg.characterName === '我' ? '用户' : msg.characterName
      summary += `  - ${datetime} ${author} 留言：${msg.content}\n`
    })
  }
  
  // 所有纪念日
  if (anniversaries.length > 0) {
    summary += '\n🎂 纪念日：\n'
    anniversaries.forEach(ann => {
      const daysUntil = getDaysUntil(ann.date)
      const statusText = daysUntil < 0 ? `已过${Math.abs(daysUntil)}天` : daysUntil === 0 ? '就是今天' : `还有${daysUntil}天`
      summary += `  - ${ann.date} ${ann.title}（${statusText}）${ann.description ? ` - ${ann.description}` : ''}\n`
    })
  }
  
  return summary
}
