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
   * 生成时间线事件记录
   */
  const generateTimeline = async () => {
    if (!id || isGenerating) return
    
    setIsGenerating(true)
    setError('')
    
    try {
      console.log('🔄 开始生成时间线事件记录...')
      
      // 读取所有聊天记录
      const allMessages = loadMessages(id)
      
      if (allMessages.length === 0) {
        setError('暂无聊天记录')
        return
      }
      
      console.log(`📊 总消息数: ${allMessages.length}`)
      
      // 调用时间线生成方法
      const newTimeline = await memorySystem.generateTimeline(allMessages)
      
      if (newTimeline && newTimeline.trim()) {
        // 获取旧的时间线
        const oldTimeline = localStorage.getItem(`memory_timeline_${id}`) || ''
        
        // 添加分隔符和新时间线
        const separator = oldTimeline ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
        const timestamp = new Date().toLocaleString('zh-CN')
        const fullTimeline = oldTimeline + separator + `【时间线更新 - ${timestamp}】\n\n${newTimeline}`
        
        setTimeline(fullTimeline)
        localStorage.setItem(`memory_timeline_${id}`, fullTimeline)
        console.log('✅ 时间线已保存')
        console.log(`📊 时间线长度: ${fullTimeline.length} 字符`)
      } else {
        console.log('ℹ️ 无法生成时间线')
        setError('无法生成时间线，请检查API配置')
      }
    } catch (err) {
      console.error('❌ 生成时间线失败:', err)
      setError(err instanceof Error ? err.message : '生成时间线失败，请检查 API 设置')
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
          <h1 className="text-base font-medium text-gray-900">时间线</h1>
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
            <h2 className="text-xl font-medium text-gray-900 mb-2">时间线事件记录</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              记录你们互动的时间线，包括聊天、视频通话、线下剧情等
            </p>
            <button
              onClick={generateTimeline}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              生成时间线
            </button>
          </div>
        )}
        
        {isGenerating && (
          // 生成中
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500 mb-4"></div>
            <p className="text-sm text-gray-500">AI 正在生成时间线...</p>
            <p className="text-xs text-gray-400 mt-2">这可能需要一些时间</p>
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
                更新时间线
              </button>
              
              {/* 提示文字 */}
              <div className="mt-4 bg-blue-50 rounded-lg p-3 max-w-md">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">提示</span>：时间线记录你们的互动事件，包括普通聊天、视频通话、线下剧情等。每个时间段（30分钟）会生成一条事件描述。
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
