import { useRef, useMemo, useCallback } from 'react'
import { memoryManager } from '../utils/memorySystem'

// Hook 用于在聊天中自动提取和使用记忆
export const useMemory = (characterId: string, characterName?: string, characterPersonality?: string, userName?: string) => {
  const memorySystem = useRef(memoryManager.getSystem(characterId))

  // 从对话中提取记忆和总结（异步）
  const extractMemories = useCallback(async (userMessage: string, aiResponse: string) => {
    return await memorySystem.current.extractMemoriesFromConversation(
      userMessage, 
      aiResponse, 
      characterName, 
      characterPersonality,
      userName
    )
  }, [characterName, characterPersonality, userName])

  // 从角色描述中提取初始记忆（异步）
  const extractInitialMemories = useCallback(async (characterDescription: string) => {
    return await memorySystem.current.extractInitialMemories(characterDescription)
  }, [])

  // 获取相关记忆用于生成回复
  const getRelevantMemories = useCallback((context: string, limit: number = 5) => {
    return memorySystem.current.getRelevantMemories(context, limit)
  }, [])

  // 生成记忆摘要用于 AI 提示词
  const getMemorySummary = useCallback(() => {
    return memorySystem.current.generateMemorySummary()
  }, [])

  // 手动添加记忆
  const addMemory = useCallback((
    type: 'fact' | 'event' | 'preference' | 'emotion' | 'relationship',
    content: string,
    importance: number = 5
  ) => {
    return memorySystem.current.addMemory(type, content, importance)
  }, [])

  // 搜索记忆
  const searchMemories = useCallback((keyword: string) => {
    return memorySystem.current.searchMemories({ keyword })
  }, [])

  // 获取统计信息
  const getStatistics = useCallback(() => {
    return memorySystem.current.getStatistics()
  }, [])

  // 生成时间线事件记录
  const generateTimeline = useCallback(async (messages: any[]) => {
    return await memorySystem.current.generateTimelineFromMessages(
      messages,
      characterName,
      userName
    )
  }, [characterName, userName])

  return useMemo(() => ({
    extractMemories,
    extractInitialMemories,
    getRelevantMemories,
    getMemorySummary,
    addMemory,
    searchMemories,
    getStatistics,
    generateTimeline
  }), [extractMemories, extractInitialMemories, getRelevantMemories, getMemorySummary, addMemory, searchMemories, getStatistics, generateTimeline])
}
