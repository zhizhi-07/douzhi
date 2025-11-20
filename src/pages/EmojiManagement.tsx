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
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setNewEmojiUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleAddEmoji = async () => {
    if (!newEmojiUrl.trim()) {
      alert(uploadMode === 'url' ? '请输入表情包图片URL' : '请选择图片文件')
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

  const handleBatchImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      const confirmed = confirm(`准备导入 ${files.length} 张图片作为表情包。\n\n每个表情包都需要描述，将使用文件名作为默认描述。\n\n继续吗？`)
      if (!confirmed) return

      let successCount = 0
      let failCount = 0

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          failCount++
          continue
        }

        try {
          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          // 使用文件名（去掉扩展名）作为描述
          const fileName = file.name.replace(/\.[^/.]+$/, '')
          
          await addEmoji({
            url: dataUrl,
            name: fileName,
            description: fileName
          })
          
          successCount++
        } catch (error) {
          console.error('导入失败:', file.name, error)
          failCount++
        }
      }

      alert(`批量导入完成！\n\n成功: ${successCount} 个\n失败: ${failCount} 个`)
      await loadEmojis()
    }
    input.click()
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
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="text-blue-500 text-2xl"
          >
            +
          </button>
          
          {/* 悬浮菜单 */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    handleBatchImport()
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">导入图片</div>
                    <div className="text-xs text-gray-500">批量导入表情包图片</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    handleImport()
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                >
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">导入JSON</div>
                    <div className="text-xs text-gray-500">导入备份的表情包数据</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
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
              {/* 上传方式切换 */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setUploadMode('url')
                    setNewEmojiUrl('')
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    uploadMode === 'url' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  URL链接
                </button>
                <button
                  onClick={() => {
                    setUploadMode('file')
                    setNewEmojiUrl('')
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    uploadMode === 'file' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  本地上传
                </button>
              </div>

              {/* URL 输入 */}
              {uploadMode === 'url' ? (
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
              ) : (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">选择图片 *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {newEmojiUrl && (
                    <div className="mt-2">
                      <img src={newEmojiUrl} alt="预览" className="w-20 h-20 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              )}
              
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
                className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddEmoji}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
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
