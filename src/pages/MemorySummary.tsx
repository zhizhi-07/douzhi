/**
 * 记忆总结页面 - 完整版
 * 手动生成AI对用户的记忆总结
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { loadMessages } from '../utils/simpleMessageManager'
import { useMemory } from '../hooks/useMemory'
import { characterService } from '../services/characterService'

const MemorySummary = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const character = id ? characterService.getById(id) : undefined
  
  // 使用记忆系统
  const memorySystem = useMemory(
    id || '', 
    character?.realName, 
    character?.personality,
    '用户'
  )
  
  const [timeline, setTimeline] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  
  // 从 localStorage 加载时间线
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`memory_timeline_${id}`)
      if (saved) {
        setTimeline(saved)
        console.log('📅 已加载时间线记录')
      }
    }
  }, [id])
  
  /**
   * 生成记忆和时间线（同时进行）
   */
  const generateTimeline = async () => {
    if (!id || isGenerating) return
    
    setIsGenerating(true)
    setError('')
    
    try {
      console.log('🔄 开始生成记忆和时间线...')
      
      // 读取所有聊天记录
      const allMessages = loadMessages(id)
      
      if (allMessages.length === 0) {
        setError('暂无聊天记录')
        return
      }

      // 读取上次已经处理到的时间戳（增量处理，避免重复提取）
      const lastProcessedStr = localStorage.getItem(`memory_last_processed_ts_${id}`)
      const lastProcessedTs = lastProcessedStr ? parseInt(lastProcessedStr, 10) : 0

      // 本次需要处理的消息：只看上次标记之后的新消息
      const newMessages = allMessages.filter(m => {
        const ts = m.timestamp || 0
        return ts > lastProcessedTs
      })

      if (newMessages.length === 0) {
        setError('最近没有新的对话，无需更新记忆')
        console.log('📊 本次没有发现新的消息需要提取记忆')
        return
      }
      
      console.log(`📊 总消息数: ${allMessages.length}，本次增量处理: ${newMessages.length} 条`)
      
      // 1. 批量提取记忆（从对话中）
      console.log('🧠 开始提取记忆...')
      let extractedMemoriesCount = 0
      
      // 将消息分组为对话对（用户消息 + AI回复），只基于本次新增消息
      const conversationPairs: Array<{userMsg: string, aiMsg: string}> = []
      for (let i = 0; i < newMessages.length - 1; i++) {
        const msg1 = newMessages[i]
        const msg2 = newMessages[i + 1]
        
        // 确保是一对用户-AI对话
        if (msg1.type === 'sent' && msg2.type === 'received') {
          conversationPairs.push({
            userMsg: msg1.content || '',
            aiMsg: msg2.content || ''
          })
          i++ // 跳过下一条消息
        }
      }
      
      console.log(`📊 发现 ${conversationPairs.length} 组对话`)
      
      // 如果对话太多，只提取最近的部分（避免单次请求上下文过长）
      const MAX_PAIRS = 50 // 最多处理50组对话
      const pairsToProcess = conversationPairs.length > MAX_PAIRS 
        ? conversationPairs.slice(-MAX_PAIRS) // 取最近的50组
        : conversationPairs
      
      if (conversationPairs.length > MAX_PAIRS) {
        console.log(`⚠️ 对话过多，只处理最近的 ${MAX_PAIRS} 组`)
      }

      if (pairsToProcess.length === 0) {
        console.log('⚠️ 本次没有有效的用户-AI对话对可供提取记忆')
      } else {
        // 🔥 将对话对合并成两段批量文本，只调用一次记忆提取API
        const batchUserContent = pairsToProcess.map((pair, idx) => 
          `[对话${idx + 1}] ${pair.userMsg}`
        ).join('\n\n')

        const batchAiContent = pairsToProcess.map((pair, idx) => 
          `[对话${idx + 1}] ${pair.aiMsg}`
        ).join('\n\n')

        try {
          const result = await memorySystem.extractMemories(
            batchUserContent,
            batchAiContent
          )

          if (result.memories && result.memories.length > 0) {
            extractedMemoriesCount += result.memories.length
            console.log(`✅ 批量提取记忆成功，共提取 ${result.memories.length} 条记忆`)
          } else {
            console.log('ℹ️ 批量提取完成，但本次对话中没有值得记录的长期记忆')
          }
        } catch (err) {
          console.warn('⚠️ 批量记忆提取失败:', err)
        }
      }

      console.log(`✅ 记忆提取完成，共提取 ${extractedMemoriesCount} 条记忆`)
      
      // 2. 生成时间线（只基于本次新增的消息）
      console.log('📅 开始生成时间线（增量）...')
      const newTimeline = await memorySystem.generateTimeline(newMessages)
      
      if (newTimeline && newTimeline.trim()) {
        // 获取旧的时间线
        const oldTimeline = localStorage.getItem(`memory_timeline_${id}`) || ''
        
        // 添加分隔符和新时间线
        const separator = oldTimeline ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
        const timestamp = new Date().toLocaleString('zh-CN')
        const fullTimeline = oldTimeline + separator + `【记忆更新 - ${timestamp}】\n提取记忆: ${extractedMemoriesCount} 条\n\n${newTimeline}`
        
        // 🔥 强制更新UI状态
        setTimeline(fullTimeline)
        localStorage.setItem(`memory_timeline_${id}`, fullTimeline)
        
        // 🔥 添加延迟确保状态更新
        setTimeout(() => {
          setTimeline(fullTimeline)
          console.log('✅ 时间线已保存并更新UI')
          console.log(`📊 时间线长度: ${fullTimeline.length} 字符`)
        }, 100)
      } else {
        console.log('⚠️ 时间线生成失败，但记忆已提取')
        if (extractedMemoriesCount > 0) {
          setError(`已提取 ${extractedMemoriesCount} 条记忆，但时间线生成失败`)
        } else {
          setError('无法生成时间线和记忆，请检查API配置')
        }
      }
      
      // 显示成功提示
      if (extractedMemoriesCount > 0 || (newTimeline && newTimeline.trim())) {
        console.log(`🎉 完成！提取了 ${extractedMemoriesCount} 条记忆`)
      }

      // 更新“已处理到哪里”的时间戳标记
      const lastMsg = newMessages[newMessages.length - 1]
      const newLastTs = lastMsg.timestamp || Date.now()
      localStorage.setItem(`memory_last_processed_ts_${id}`, String(newLastTs))
      console.log('🧠 已更新 last_processed_timestamp 为', newLastTs)
    } catch (err) {
      console.error('❌ 生成失败:', err)
      setError(err instanceof Error ? err.message : '生成失败，请检查 API 设置')
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <StatusBar />
      <div className="bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">记忆</h1>
          <div className="w-6"></div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!timeline && !isGenerating && (
          // 初始状态
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">AI记忆生成</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              从聊天记录中提取记忆和时间线事件，让AI真正记住你
            </p>
            <button
              onClick={generateTimeline}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              生成记忆
            </button>
          </div>
        )}
        
        {isGenerating && (
          // 生成中
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500 mb-4"></div>
            <p className="text-sm text-gray-500">AI 正在提取记忆和生成时间线...</p>
            <p className="text-xs text-gray-400 mt-2">这可能需要一些时间，请耐心等待</p>
          </div>
        )}
        
        {error && (
          // 错误提示
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-900 mb-1">生成失败</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        
        {timeline && !isGenerating && (
          // 显示总结
          <div>
            {/* 时间线内容 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📅 互动时间线
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {timeline}
              </div>
            </div>
            
            {/* 重新生成按钮 */}
            <div className="mt-4 flex flex-col items-center">
              <button
                onClick={generateTimeline}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
              >
                更新记忆
              </button>
              
              {/* 提示文字 */}
              <div className="mt-4 bg-blue-50 rounded-lg p-3 max-w-md">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">提示</span>：点击生成会同时提取对话中的记忆信息（事实、偏好、事件等）和生成时间线事件记录。AI会自动分析并记住关于你的重要信息。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemorySummary
