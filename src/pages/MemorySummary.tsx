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
    character?.personality
  )
  
  const [summary, setSummary] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  
  // 从 localStorage 加载自动生成的总结
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`memory_summary_${id}`)
      if (saved) {
        setSummary(saved)
        console.log('📝 已加载记忆总结')
      }
    }
  }, [id])
  
  /**
   * 手动生成记忆总结
   */
  const generateSummary = async () => {
    if (!id || isGenerating) return
    
    setIsGenerating(true)
    setError('')
    
    try {
      console.log('🔄 开始手动生成记忆总结...')
      
      // 读取聊天记录
      const allMessages = loadMessages(id)
      
      if (allMessages.length === 0) {
        setError('暂无聊天记录')
        return
      }
      
      // 提取最近 50 轮对话
      const userMessages = allMessages.filter(m => m.type === 'sent')
      const aiMessages = allMessages.filter(m => m.type === 'received')
      
      if (userMessages.length === 0 || aiMessages.length === 0) {
        setError('聊天记录不足，无法生成总结')
        return
      }
      
      // 获取最近的对话内容
      const recentUserMessages = userMessages.slice(-50)
      const recentAiMessages = aiMessages.slice(-50)
      
      const roundCount = Math.min(recentUserMessages.length, recentAiMessages.length)
      
      // 合并对话内容（包括视频通话）
      const userContent = recentUserMessages.map(m => {
        if (m.videoCallRecord) {
          const conversations = m.videoCallRecord.messages
            .map(msg => {
              const speaker = msg.type === 'user' ? '用户' : (msg.type === 'ai' ? character?.realName || 'AI' : '旁白')
              return `${speaker}: ${msg.content}`
            })
            .join('\n')
          return `[视频通话]\n${conversations}`
        }
        return m.content || ''
      }).join('\n')
      
      const aiContent = recentAiMessages.map(m => {
        if (m.videoCallRecord) {
          const conversations = m.videoCallRecord.messages
            .map(msg => {
              const speaker = msg.type === 'user' ? '用户' : (msg.type === 'ai' ? character?.realName || 'AI' : '旁白')
              return `${speaker}: ${msg.content}`
            })
            .join('\n')
          return `[视频通话]\n${conversations}`
        }
        return m.content || ''
      }).join('\n')
      
      // 调用记忆系统提取记忆和生成总结
      const result = await memorySystem.extractMemories(userContent, aiContent)
      
      if (result.summary && result.summary.trim()) {
        // 获取旧的总结
        const oldSummary = localStorage.getItem(`memory_summary_${id}`) || ''
        
        // 添加分隔符和新总结
        const separator = oldSummary ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
        const timestamp = new Date().toLocaleString('zh-CN')
        const newSummary = oldSummary + separator + `【手动总结 - ${timestamp}】\n基于最近 ${roundCount} 轮对话生成\n\n${result.summary}`
        
        setSummary(newSummary)
        localStorage.setItem(`memory_summary_${id}`, newSummary)
        console.log('✅ 手动总结已累积保存')
        console.log(`📊 总结历史长度: ${newSummary.length} 字符`)
      } else {
        console.log('ℹ️ 对话内容不足，无法生成总结')
        setError('对话内容太少，暂时无法生成总结。请继续聊天后再试。')
      }
    } catch (err) {
      console.error('❌ 手动生成总结失败:', err)
      setError(err instanceof Error ? err.message : '生成总结失败，请检查 API 设置')
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
          <h1 className="text-base font-medium text-gray-900">记忆总结</h1>
          <div className="w-6"></div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!summary && !isGenerating && (
          // 初始状态
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">AI 记忆总结</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              让 AI 分析你们的对话，总结出关于你的重要信息
            </p>
            <button
              onClick={generateSummary}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              生成记忆总结
            </button>
          </div>
        )}
        
        {isGenerating && (
          // 生成中
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500 mb-4"></div>
            <p className="text-sm text-gray-500">AI 正在分析对话...</p>
            <p className="text-xs text-gray-400 mt-2">这可能需要几秒钟</p>
          </div>
        )}
        
        {error && (
          // 错误提示
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-900 mb-1">生成失败</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        
        {summary && !isGenerating && (
          // 显示总结
          <div>
            {/* 总结内容 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                关于你的总结
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
            
            {/* 重新生成按钮 */}
            <div className="mt-4 flex flex-col items-center">
              <button
                onClick={generateSummary}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
              >
                重新生成总结
              </button>
              
              {/* 提示文字 */}
              <div className="mt-4 bg-blue-50 rounded-lg p-3 max-w-md">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">提示</span>：总结基于最近 50 轮对话生成，用 AI 的语气记录关于你的信息。如果发现遗漏或错误，可以在聊天中告诉 AI 正确的信息。
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
