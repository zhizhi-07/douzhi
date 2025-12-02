/**
 * 角色数据导出/导入工具
 * 导出角色的所有信息，包括：
 * - 角色基本信息
 * - 聊天记录
 * - AI随笔
 * - 记忆系统
 * - 朋友圈
 * - 世界书
 * - 聊天设置
 * - 表情包
 */

import { characterService } from '../services/characterService'
import { loadMessages } from './simpleMessageManager'
import { getAllMemos } from './aiMemoManager'
import { loadMoments } from './momentsManager'
import { lorebookManager } from './lorebookSystem'
import { getEmojis } from './emojiStorage'
import type { Character, Message } from '../types/chat'
import type { Moment } from '../types/moments'

// IndexedDB存储工具（用于气泡样式和壁纸）
const BUBBLE_DB_NAME = 'BubbleStyleDB'
const BUBBLE_STORE_NAME = 'styles'

const openBubbleDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BUBBLE_DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(BUBBLE_STORE_NAME)) {
        db.createObjectStore(BUBBLE_STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

const getFromIDB = async (key: string): Promise<string> => {
  try {
    const db = await openBubbleDB()
    return new Promise((resolve) => {
      const tx = db.transaction(BUBBLE_STORE_NAME, 'readonly')
      const store = tx.objectStore(BUBBLE_STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        db.close()
        resolve(request.result?.value || '')
      }
      request.onerror = () => { db.close(); resolve('') }
    })
  } catch {
    return ''
  }
}

const saveToIDB = async (key: string, value: string): Promise<boolean> => {
  try {
    const db = await openBubbleDB()
    return new Promise((resolve) => {
      const tx = db.transaction(BUBBLE_STORE_NAME, 'readwrite')
      const store = tx.objectStore(BUBBLE_STORE_NAME)
      store.put({ key, value })
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => { db.close(); resolve(false) }
    })
  } catch {
    return false
  }
}

/**
 * 导出的数据格式
 */
export interface ExportedCharacterData {
  version: string  // 导出格式版本
  exportDate: number  // 导出时间戳
  character: Character  // 角色基本信息
  chatSettings: any  // 聊天设置
  messages: Message[]  // 聊天记录
  memos: any[]  // AI随笔
  memories: any[]  // 记忆系统数据
  moments: Moment[]  // 朋友圈（该角色发的）
  lorebook: any  // 世界书
  emojis: any[]  // 表情包
  systemPrompt?: string  // 系统提示词
  coupleSpace?: any  // 情侣空间数据
  intimatePay?: any  // 亲密付数据
  listeningTogether?: any  // 一起听数据
  customSongs?: any[]  // 自定义歌曲列表
  musicBackground?: any  // 音乐播放器背景
  // 🔥 新增：气泡样式和壁纸
  bubbleStyles?: {
    userBubbleColor?: string
    aiBubbleColor?: string
    userTextColor?: string
    aiTextColor?: string
    userBubbleCSS?: string
    aiBubbleCSS?: string
  }
  wallpaper?: string  // 聊天壁纸
}

/**
 * 导出角色的所有数据
 */
export async function exportCharacterData(characterId: string): Promise<ExportedCharacterData> {
  console.log('📦 开始导出角色数据:', characterId)
  
  try {
    // 1. 获取角色基本信息
    const character = characterService.getById(characterId)
    if (!character) {
      throw new Error('角色不存在')
    }
    console.log('✅ 角色信息:', character.realName)
    
    // 2. 获取聊天设置
    const settingsKey = `chat_settings_${characterId}`
    const chatSettings = localStorage.getItem(settingsKey)
    const parsedSettings = chatSettings ? JSON.parse(chatSettings) : {}
    console.log('✅ 聊天设置:', parsedSettings)
    
    // 3. 获取聊天记录
    const messages = loadMessages(characterId)
    console.log('✅ 聊天记录:', messages.length, '条')
    
    // 4. 获取AI随笔
    const memos = getAllMemos(characterId)
    console.log('✅ AI随笔:', memos.length, '条')
    
    // 5. 获取记忆系统数据（从UnifiedMemoryDB）
    let memories: any[] = []
    try {
      const { unifiedMemoryService } = await import('../services/unifiedMemoryService')
      const allMemories = await unifiedMemoryService.getAllMemories()
      memories = allMemories.filter(m => m.characterId === characterId)
    } catch (e) {
      console.warn('获取记忆数据失败:', e)
    }
    console.log('✅ 记忆数据:', memories.length, '条')
    
    // 6. 获取朋友圈（该角色发的）
    const allMoments = loadMoments()
    const characterMoments = allMoments.filter(m => m.userId === characterId)
    console.log('✅ 朋友圈:', characterMoments.length, '条')
    
    // 7. 获取世界书
    const lorebooks = lorebookManager.getCharacterLorebooks(characterId)
    const lorebook = lorebooks.length > 0 ? lorebooks[0] : null
    console.log('✅ 世界书:', lorebook?.entries?.length || 0, '条')
    
    // 8. 获取表情包（当前所有表情包）
    const emojis = await getEmojis()
    console.log('✅ 表情包:', emojis.length, '个')
    
    // 9. 获取情侣空间数据（如果有）
    let coupleSpace = null
    try {
      const relationKey = 'couple_space_relation'
      const relationData = localStorage.getItem(relationKey)
      if (relationData) {
        const relation = JSON.parse(relationData)
        if (relation.characterId === characterId) {
          // 获取情侣空间的所有数据
          const photos = localStorage.getItem('couple_space_photos')
          const messages = localStorage.getItem('couple_space_messages')
          const anniversaries = localStorage.getItem('couple_space_anniversaries')
          
          coupleSpace = {
            relation,
            photos,
            messages,
            anniversaries
          }
          console.log('✅ 情侣空间数据')
        }
      }
    } catch (e) {
      console.warn('获取情侣空间数据失败:', e)
    }
    
    // 10. 获取亲密付数据
    let intimatePay = null
    try {
      const intimatePayKey = 'intimate_pay_relations'
      const intimatePayData = localStorage.getItem(intimatePayKey)
      if (intimatePayData) {
        const relations = JSON.parse(intimatePayData)
        intimatePay = relations.filter((r: any) => r.characterId === characterId)
        console.log('✅ 亲密付数据:', intimatePay.length, '条')
      }
    } catch (e) {
      console.warn('获取亲密付数据失败:', e)
    }
    
    // 11. 获取一起听数据
    let listeningTogether = null
    try {
      const listeningKey = 'listening_together'
      const listeningData = localStorage.getItem(listeningKey)
      if (listeningData) {
        const data = JSON.parse(listeningData)
        if (data.characterId === characterId) {
          listeningTogether = data
          console.log('✅ 一起听数据')
        }
      }
    } catch (e) {
      console.warn('获取一起听数据失败:', e)
    }
    
    // 12. 获取自定义歌曲列表
    let customSongs = null
    try {
      const songsData = localStorage.getItem('customSongs')
      if (songsData) {
        customSongs = JSON.parse(songsData)
        console.log('✅ 自定义歌曲:', customSongs.length, '首')
      }
    } catch (e) {
      console.warn('获取自定义歌曲失败:', e)
    }
    
    // 13. 获取音乐播放器背景
    let musicBackground = null
    try {
      const bgUrl = localStorage.getItem('musicPlayerBackground')
      const bgType = localStorage.getItem('musicPlayerBackgroundType')
      if (bgUrl) {
        musicBackground = { url: bgUrl, type: bgType }
        console.log('✅ 音乐播放器背景')
      }
    } catch (e) {
      console.warn('获取音乐背景失败:', e)
    }
    
    // 14. 获取气泡样式（从IndexedDB）
    let bubbleStyles: any = null
    try {
      const [userBubbleColor, aiBubbleColor, userTextColor, aiTextColor, userBubbleCSS, aiBubbleCSS] = await Promise.all([
        getFromIDB(`user_bubble_color_${characterId}`),
        getFromIDB(`ai_bubble_color_${characterId}`),
        getFromIDB(`user_text_color_${characterId}`),
        getFromIDB(`ai_text_color_${characterId}`),
        getFromIDB(`user_bubble_css_${characterId}`),
        getFromIDB(`ai_bubble_css_${characterId}`)
      ])
      
      if (userBubbleColor || aiBubbleColor || userTextColor || aiTextColor || userBubbleCSS || aiBubbleCSS) {
        bubbleStyles = {
          userBubbleColor,
          aiBubbleColor,
          userTextColor,
          aiTextColor,
          userBubbleCSS,
          aiBubbleCSS
        }
        console.log('✅ 气泡样式')
      }
    } catch (e) {
      console.warn('获取气泡样式失败:', e)
    }
    
    // 15. 获取聊天壁纸
    let wallpaper: string | undefined = undefined
    try {
      const wp = await getFromIDB(`wallpaper_${characterId}`)
      if (wp) {
        wallpaper = wp
        console.log('✅ 聊天壁纸')
      }
    } catch (e) {
      console.warn('获取壁纸失败:', e)
    }
    
    // 16. 构建导出数据
    const exportData: ExportedCharacterData = {
      version: '1.1.0',  // 版本升级
      exportDate: Date.now(),
      character,
      chatSettings: parsedSettings,
      messages,
      memos,
      memories,
      moments: characterMoments,
      lorebook: lorebook || { entries: [] },
      emojis,
      coupleSpace,
      intimatePay,
      listeningTogether,
      customSongs,
      musicBackground,
      bubbleStyles,
      wallpaper
    }
    
    console.log('✅ 数据导出完成')
    return exportData
    
  } catch (error) {
    console.error('❌ 导出失败:', error)
    throw error
  }
}

/**
 * 下载导出的数据为JSON文件
 */
export function downloadCharacterData(data: ExportedCharacterData) {
  const fileName = `${data.character.realName}_完整数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`
  
  // 使用安全的序列化方法，避免循环引用
  const seen = new WeakSet()
  const jsonStr = JSON.stringify(data, (_key, value) => {
    // 过滤掉可能导致循环引用的对象
    if (typeof value === 'object' && value !== null) {
      // 跳过 Window、Document 等全局对象
      if (value === window || value === document || value instanceof Window || value instanceof Document) {
        return undefined
      }
      // 检测循环引用
      if (seen.has(value)) {
        return undefined
      }
      seen.add(value)
    }
    return value
  }, 2)
  
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  
  URL.revokeObjectURL(url)
  console.log('✅ 文件已下载:', fileName)
}

/**
 * 导入角色数据
 */
export async function importCharacterData(jsonData: ExportedCharacterData): Promise<string> {
  console.log('📥 开始导入角色数据')
  
  try {
    // 1. 创建新角色（使用原真名 + 时间戳避免冲突）
    const timestamp = Date.now()
    const newCharacter: Character = {
      ...jsonData.character,
      id: `char_${timestamp}`,  // 新ID
      realName: jsonData.character.realName,  // 保持原真名
    }
    
    // 移除id让save方法自动生成
    const { id, ...characterData } = newCharacter
    const savedCharacter = characterService.save(characterData as any)
    console.log('✅ 角色已创建:', savedCharacter.id, savedCharacter.realName)
    
    const newId = savedCharacter.id
    const newRealName = savedCharacter.realName
    const newAvatar = savedCharacter.avatar
    
    // 2. 导入聊天设置
    if (jsonData.chatSettings) {
      const settingsKey = `chat_settings_${newId}`
      localStorage.setItem(settingsKey, JSON.stringify(jsonData.chatSettings))
      console.log('✅ 聊天设置已导入')
    }
    
    // 3. 导入聊天记录（更新角色ID）
    if (jsonData.messages && jsonData.messages.length > 0) {
      // 保存到 IndexedDB
      // 使用simpleMessageManager保存
      const { saveMessages } = await import('./simpleMessageManager')
      saveMessages(newId, jsonData.messages)
      console.log('✅ 聊天记录已导入:', jsonData.messages.length, '条')
    }
    
    // 4. 导入AI随笔
    if (jsonData.memos && jsonData.memos.length > 0) {
      const memosKey = `ai_memos_${newId}`
      localStorage.setItem(memosKey, JSON.stringify(jsonData.memos))
      console.log('✅ AI随笔已导入:', jsonData.memos.length, '条')
    }
    
    // 5. 导入记忆（到UnifiedMemoryDB，兼容旧格式）
    if (jsonData.memories && jsonData.memories.length > 0) {
      try {
        const { unifiedMemoryService } = await import('../services/unifiedMemoryService')
        for (const mem of jsonData.memories) {
          // 兼容旧格式：补全缺失字段
          await unifiedMemoryService.addMemory({
            domain: mem.domain || 'chat',
            title: mem.title || mem.summary?.substring(0, 20) || '记忆',
            summary: mem.summary || mem.content || '',
            importance: mem.importance || 'normal',
            timestamp: mem.timestamp || Date.now(),
            tags: mem.tags || [],
            emotionalTone: mem.emotionalTone || 'neutral',
            extractedBy: mem.extractedBy || 'manual',
            // 更新为新角色信息
            characterId: newId,
            characterName: newRealName,
            characterAvatar: newAvatar
          })
        }
        console.log('✅ 记忆已导入到UnifiedMemoryDB:', jsonData.memories.length, '条')
      } catch (e) {
        console.warn('记忆导入失败:', e)
      }
    }
    
    // 6. 导入朋友圈（更新userId）
    if (jsonData.moments && jsonData.moments.length > 0) {
      try {
        const { saveMoments } = await import('./momentsManager')
        const allMoments = loadMoments()
        const newMoments = jsonData.moments.map(m => ({
          ...m,
          id: `moment_${Date.now()}_${Math.random()}`,  // 新ID
          userId: newId,  // 新角色ID
          userName: newRealName,
          userAvatar: newAvatar || ''
        }))
        
        // 使用saveMoments保存到IndexedDB（避免localStorage超限）
        const updatedMoments = [...allMoments, ...newMoments]
        saveMoments(updatedMoments)
        console.log('✅ 朋友圈已导入:', newMoments.length, '条')
      } catch (e) {
        console.warn('朋友圈导入失败，但不影响其他数据:', e)
      }
    }
    
    // 7. 导入世界书
    if (jsonData.lorebook && jsonData.lorebook.entries && jsonData.lorebook.entries.length > 0) {
      // 保存世界书数据
      const lorebookKey = `lorebook_${newId}`
      localStorage.setItem(lorebookKey, JSON.stringify(jsonData.lorebook))
      console.log('✅ 世界书已导入:', jsonData.lorebook.entries.length, '条')
    }
    
    // 8. 导入表情包（如果有）
    if (jsonData.emojis && Array.isArray(jsonData.emojis) && jsonData.emojis.length > 0) {
      // 🔥 修复：使用 emojiStorage 的 API，自动使用 IndexedDB 避免 localStorage 配额问题
      const { getEmojis, saveEmojis } = await import('./emojiStorage')
      const existingEmojis = await getEmojis()
      
      // 只添加不存在的表情包（根据 description 去重）
      const newEmojis = jsonData.emojis.filter(e => 
        !existingEmojis.some(existing => existing.description === e.description)
      )
      
      if (newEmojis.length > 0) {
        // 保存表情包到 IndexedDB
        const updatedEmojis = [...existingEmojis, ...newEmojis]
        await saveEmojis(updatedEmojis)
        console.log('✅ 表情包已导入到IndexedDB:', newEmojis.length, '个新表情包')
      }
    }
    
    // 9. 导入自定义歌曲列表（如果有）
    if (jsonData.customSongs && Array.isArray(jsonData.customSongs) && jsonData.customSongs.length > 0) {
      try {
        const existingSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
        // 合并歌曲列表，根据 id 去重
        const newSongs = jsonData.customSongs.filter(song => 
          !existingSongs.some((existing: any) => existing.id === song.id)
        )
        if (newSongs.length > 0) {
          const updatedSongs = [...existingSongs, ...newSongs]
          localStorage.setItem('customSongs', JSON.stringify(updatedSongs))
          console.log('✅ 自定义歌曲已导入:', newSongs.length, '首')
        }
      } catch (e) {
        console.warn('自定义歌曲导入失败:', e)
      }
    }
    
    // 10. 导入音乐播放器背景（如果有）
    if (jsonData.musicBackground) {
      try {
        if (jsonData.musicBackground.url) {
          localStorage.setItem('musicPlayerBackground', jsonData.musicBackground.url)
          if (jsonData.musicBackground.type) {
            localStorage.setItem('musicPlayerBackgroundType', jsonData.musicBackground.type)
          }
          console.log('✅ 音乐播放器背景已导入')
        }
      } catch (e) {
        console.warn('音乐背景导入失败:', e)
      }
    }
    
    // 11. 导入气泡样式（如果有）
    if (jsonData.bubbleStyles) {
      try {
        const bs = jsonData.bubbleStyles
        const savePromises = []
        if (bs.userBubbleColor) savePromises.push(saveToIDB(`user_bubble_color_${newId}`, bs.userBubbleColor))
        if (bs.aiBubbleColor) savePromises.push(saveToIDB(`ai_bubble_color_${newId}`, bs.aiBubbleColor))
        if (bs.userTextColor) savePromises.push(saveToIDB(`user_text_color_${newId}`, bs.userTextColor))
        if (bs.aiTextColor) savePromises.push(saveToIDB(`ai_text_color_${newId}`, bs.aiTextColor))
        if (bs.userBubbleCSS) savePromises.push(saveToIDB(`user_bubble_css_${newId}`, bs.userBubbleCSS))
        if (bs.aiBubbleCSS) savePromises.push(saveToIDB(`ai_bubble_css_${newId}`, bs.aiBubbleCSS))
        await Promise.all(savePromises)
        console.log('✅ 气泡样式已导入')
      } catch (e) {
        console.warn('气泡样式导入失败:', e)
      }
    }
    
    // 12. 导入聊天壁纸（如果有）
    if (jsonData.wallpaper) {
      try {
        await saveToIDB(`wallpaper_${newId}`, jsonData.wallpaper)
        console.log('✅ 聊天壁纸已导入')
      } catch (e) {
        console.warn('壁纸导入失败:', e)
      }
    }
    
    // 注意：情侣空间、亲密付、一起听等数据不自动导入，因为涉及关系绑定
    // 用户可以手动重新建立这些关系
    
    console.log('✅ 数据导入完成')
    return newId
    
  } catch (error) {
    console.error('❌ 导入失败:', error)
    throw error
  }
}

/**
 * 从文件读取导入数据
 */
export function readImportFile(file: File): Promise<ExportedCharacterData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string
        const data = JSON.parse(jsonStr) as ExportedCharacterData
        
        // 验证数据格式
        if (!data.character || !data.version) {
          throw new Error('无效的数据格式')
        }
        
        console.log('✅ 文件读取成功:', data.character.realName)
        resolve(data)
      } catch (error) {
        console.error('❌ 文件解析失败:', error)
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}
