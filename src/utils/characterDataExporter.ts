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
    
    // 5. 获取记忆系统数据
    const memoryKey = `memories_${characterId}`
    const memoriesData = localStorage.getItem(memoryKey)
    const memories = memoriesData ? JSON.parse(memoriesData) : []
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
    
    // 12. 构建导出数据
    const exportData: ExportedCharacterData = {
      version: '1.0.0',
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
      listeningTogether
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
  const jsonStr = JSON.stringify(data, null, 2)
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
    
    // 5. 导入记忆
    if (jsonData.memories && jsonData.memories.length > 0) {
      const memoryKey = `memories_${newId}`
      localStorage.setItem(memoryKey, JSON.stringify(jsonData.memories))
      console.log('✅ 记忆已导入:', jsonData.memories.length, '条')
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
          userAvatar: newAvatar
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
    
    // 8. 导入表情包（合并到现有表情包）
    if (jsonData.emojis && jsonData.emojis.length > 0) {
      const existingEmojis = await getEmojis()
      // 过滤掉重复的表情包（根据description）
      const newEmojis = jsonData.emojis.filter(e => 
        !existingEmojis.some(existing => existing.description === e.description)
      )
      if (newEmojis.length > 0) {
        // 保存表情包
        const updatedEmojis = [...existingEmojis, ...newEmojis]
        localStorage.setItem('emojis', JSON.stringify(updatedEmojis))
        console.log('✅ 表情包已导入:', newEmojis.length, '个新表情包')
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
