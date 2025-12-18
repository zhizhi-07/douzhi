/**
 * 添加/编辑线下记录对话框
 */

import { useState, useEffect } from 'react'
import { Message } from '../../../types/chat'

interface OfflineRecordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, summary: string, timestamp: number) => void
  onDelete?: (messageId: number) => void
  editingMessage?: Message | null
}

const OfflineRecordDialog: React.FC<OfflineRecordDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMessage
}) => {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 编辑模式：填充现有数据
  useEffect(() => {
    if (editingMessage?.offlineSummary) {
      setTitle(editingMessage.offlineSummary.title)
      setSummary(editingMessage.offlineSummary.summary)
      
      // 设置时间
      const date = new Date(editingMessage.timestamp)
      setSelectedDate(date.toISOString().split('T')[0])
      setSelectedTime(date.toTimeString().slice(0, 5))
    } else {
      // 新建模式：默认当前时间
      const now = new Date()
      setSelectedDate(now.toISOString().split('T')[0])
      setSelectedTime(now.toTimeString().slice(0, 5))
    }
  }, [editingMessage, isOpen])

  // AI 自动生成标题和标签
  const handleGenerateTitleAndTags = async () => {
    if (!summary.trim()) {
      alert('请先输入经历内容')
      return
    }

    setIsGenerating(true)
    try {
      const { memoryManager } = await import('../../../utils/memorySystem')
      const memorySystem = memoryManager.getSystem('offline-temp')
      
      // 调用记忆提取 API
      const result = await memorySystem.extractMemoriesFromConversation(
        summary.trim(),
        '',
        'AI',
        '',
        '用户'
      )

      // 填充标题和标签
      if (result.title) {
        setTitle(result.title)
      }
      if (result.tags && result.tags.length > 0) {
        setTags(result.tags.join(', '))
      }

      console.log('✅ AI 生成标题:', result.title)
      console.log('✅ AI 生成标签:', result.tags)
    } catch (error) {
      console.error('❌ AI 生成失败:', error)
      alert('AI 生成失败，请检查副 API 配置')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }
    if (!summary.trim()) {
      alert('请输入内容')
      return
    }

    // 组合日期和时间
    const timestamp = new Date(`${selectedDate}T${selectedTime}`).getTime()
    
    onSave(title.trim(), summary.trim(), timestamp)
    
    // 🔥 保存后清空表单，但不关闭对话框
    setTitle('')
    setSummary('')
    setTags('')
    
    // 重置时间为当前时间
    const now = new Date()
    setSelectedDate(now.toISOString().split('T')[0])
    setSelectedTime(now.toTimeString().slice(0, 5))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(80vh-env(safe-area-inset-bottom))] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingMessage ? '编辑线下经历' : '添加线下经历'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 标题 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                标题
              </label>
              <button
                onClick={handleGenerateTitleAndTags}
                disabled={isGenerating || !summary.trim()}
                className="text-xs px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    生成中...
                  </span>
                ) : (
                  '✨ AI生成'
                )}
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这段记忆起个名字..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              maxLength={50}
            />
            <div className="text-xs text-gray-400 mt-1">{title.length}/50</div>
          </div>

          {/* 时间选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              发生时间
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              经历内容
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="描述这段时间发生了什么...&#10;&#10;例如：我们一起去了电影院，看了一部科幻片。散场后在附近的咖啡店聊了很久，讨论了电影的情节和人生的意义。"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={8}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1">{summary.length}/500</div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：重要对话, 剧情转折, 感情发展"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* 提示 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-amber-800 leading-relaxed">
                <div className="font-medium mb-1">💡 使用说明</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>这段经历会插入到聊天记录中</li>
                  <li>AI会读取并理解这段经历</li>
                  <li>按时间顺序与其他消息混合显示</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-200 flex gap-3">
          {/* 🔥 编辑模式下显示删除按钮 */}
          {editingMessage && onDelete && (
            <button
              onClick={() => {
                if (confirm('确定要删除这条线下记录吗？')) {
                  onDelete(editingMessage.id)
                }
              }}
              className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors font-medium"
            >
              删除
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md font-medium"
          >
            {editingMessage ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfflineRecordDialog
