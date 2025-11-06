/**
 * 表情包管理页面
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import {
  getEmojis,
  addEmoji,
  deleteEmoji,
  exportEmojis,
  importEmojis,
  clearAllEmojis,
  type Emoji
} from '../utils/emojiStorage'

const EmojiManagement = () => {
  const navigate = useNavigate()
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newEmojiUrl, setNewEmojiUrl] = useState('')
  const [newEmojiName, setNewEmojiName] = useState('')
  const [newEmojiDesc, setNewEmojiDesc] = useState('')

  useEffect(() => {
    loadEmojis()
  }, [])

  const loadEmojis = async () => {
    const loaded = await getEmojis()
    setEmojis(loaded)
  }

  const handleAddEmoji = async () => {
    if (!newEmojiUrl.trim()) {
      alert('请输入表情包图片URL')
      return
    }

    if (!newEmojiDesc.trim()) {
      alert('请输入表情包描述，让AI能理解这个表情的含义')
      return
    }

    try {
      await addEmoji({
        url: newEmojiUrl.trim(),
        name: newEmojiName.trim() || '表情包',
        description: newEmojiDesc.trim()
      })

      setNewEmojiUrl('')
      setNewEmojiName('')
      setNewEmojiDesc('')
      setShowAddDialog(false)
      await loadEmojis()
    } catch (error) {
      alert(`添加失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDeleteEmoji = async (id: number) => {
    if (confirm('确定要删除这个表情包吗？')) {
      await deleteEmoji(id)
      await loadEmojis()
    }
  }

  const handleExport = async () => {
    const data = await exportEmojis()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emojis_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const result = await importEmojis(event.target?.result as string, false)
          alert(result.message)
          if (result.success) {
            await loadEmojis()
          }
        } catch (error) {
          alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleClearAll = async () => {
    if (confirm('确定要清空所有表情包吗？此操作不可恢复！')) {
      await clearAllEmojis()
      await loadEmojis()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <StatusBar />
      
      {/* 标题栏 */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">表情包管理</h1>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="text-blue-500 text-2xl"
        >
          +
        </button>
      </div>

      {/* 统计信息 */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="text-sm text-gray-600">
          共 {emojis.length} 个表情包
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-white px-4 py-3 flex gap-2 border-b">
        <button
          onClick={handleImport}
          className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm"
        >
          导入
        </button>
        <button
          onClick={handleExport}
          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm"
          disabled={emojis.length === 0}
        >
          导出
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm"
          disabled={emojis.length === 0}
        >
          清空
        </button>
      </div>

      {/* 表情包列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {emojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" opacity="0.3"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <circle cx="9" cy="9" r="1"/>
              <circle cx="15" cy="9" r="1"/>
            </svg>
            <div>还没有表情包</div>
            <div className="text-sm mt-2">点击右上角 + 添加</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md border"
              >
                <img
                  src={emoji.url}
                  alt={emoji.description}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeleteEmoji(emoji.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                >
                  ×
                </button>
                {emoji.useCount > 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    使用 {emoji.useCount} 次
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加表情包对话框 */}
      {showAddDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowAddDialog(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-6 shadow-2xl max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-4">添加表情包</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">图片URL *</label>
                <input
                  type="text"
                  value={newEmojiUrl}
                  onChange={(e) => setNewEmojiUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">名称</label>
                <input
                  type="text"
                  value={newEmojiName}
                  onChange={(e) => setNewEmojiName(e.target.value)}
                  placeholder="表情包名称"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  表情包描述 *
                  <span className="text-xs text-gray-400 ml-2">(帮助AI理解表情含义)</span>
                </label>
                <textarea
                  value={newEmojiDesc}
                  onChange={(e) => setNewEmojiDesc(e.target.value)}
                  placeholder="例如：大笑、哭泣、尴尬、疑惑、点赞等...\n这个描述会AI理解何时使用这个表情"
                  className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddEmoji}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg"
              >
                添加
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EmojiManagement
