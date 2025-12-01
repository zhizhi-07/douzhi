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
import { compressAndConvertToBase64 } from '../utils/imageUtils'

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    try {
      // 压缩表情包（较小尺寸：400x400，质量0.8）
      const base64 = await compressAndConvertToBase64(file, 400, 400, 0.8)
      const dataUrl = `data:image/jpeg;base64,${base64}`
      setNewEmojiUrl(dataUrl)
    } catch (error) {
      console.error('压缩表情包图片失败:', error)
      alert('图片处理失败，请重试')
    }
  }

  const handleAddEmoji = async () => {
    if (!newEmojiUrl.trim()) {
      alert(uploadMode === 'url' ? '请输入图片URL' : '请选择图片文件')
      return
    }

    if (!newEmojiDesc.trim()) {
      alert('请输入描述，赋予图片以意义')
      return
    }

    try {
      await addEmoji({
        url: newEmojiUrl.trim(),
        name: newEmojiName.trim() || '未命名',
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
    if (confirm('确认要移除这张图片吗？')) {
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
    a.download = `collection_${Date.now()}.json`
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

      const confirmed = confirm(`准备收录 ${files.length} 张图片。\n\n将使用文件名作为默认描述。\n\n是否继续？`)
      if (!confirmed) return

      let successCount = 0
      let failCount = 0

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          failCount++
          continue
        }

        try {
          // 压缩表情包（较小尺寸：400x400，质量0.8）
          const base64 = await compressAndConvertToBase64(file, 400, 400, 0.8)
          const dataUrl = `data:image/jpeg;base64,${base64}`

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

      alert(`批量收录完成\n\n成功: ${successCount}\n失败: ${failCount}`)
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
    if (confirm('确定要清空所有收藏吗？此操作将无法挽回。')) {
      await clearAllEmojis()
      await loadEmojis()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      {/* 背景装饰 */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[80px] pointer-events-none" />

      <StatusBar />

      {/* 顶部导航栏 - 玻璃态 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800">表情管理</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:scale-105 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* 悬浮菜单 - 玻璃态 */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 z-50 overflow-hidden transform origin-top-right transition-all">
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowAddDialog(true)
                  }}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-700">新增图片</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    handleBatchImport()
                  }}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-700">批量导入</span>
                </button>
                <div className="h-px bg-slate-100 mx-4" />
                <button
                  onClick={() => {
                    setShowAddMenu(false)
                    handleImport()
                  }}
                  className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-700">恢复备份</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 统计与操作栏 - 悬浮卡片 */}
      <div className="px-6 mb-6 z-10">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-slate-800">{emojis.length}</span>
            <span className="text-xs text-slate-500 font-light">ITEMS</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={emojis.length === 0}
              className="px-4 py-1.5 rounded-full bg-white/50 hover:bg-white/80 text-slate-600 text-xs border border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              备份
            </button>
            <button
              onClick={handleClearAll}
              disabled={emojis.length === 0}
              className="px-4 py-1.5 rounded-full bg-white/50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs border border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      {/* 图片列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        {emojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/40">
              <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm font-light tracking-widest">暂无收藏</div>
            <div className="text-xs mt-2 opacity-60 font-light">点击右上角添加</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-white/40 backdrop-blur-sm shadow-sm border border-white/40 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <img
                  src={emoji.url}
                  alt={emoji.description}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <button
                  onClick={() => handleDeleteEmoji(emoji.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {emoji.useCount > 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] text-white font-light border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {emoji.useCount} 次引用
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加对话框 - 玻璃态 */}
      {showAddDialog && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-all"
            onClick={() => setShowAddDialog(false)}
          />
          <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-medium text-slate-800 mb-6 text-center tracking-wide">新添收藏</h2>

            <div className="space-y-5">
              {/* 切换器 */}
              <div className="flex bg-slate-100/50 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setUploadMode('url')
                    setNewEmojiUrl('')
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${uploadMode === 'url'
                      ? 'bg-white shadow-sm text-slate-800 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  网络链接
                </button>
                <button
                  onClick={() => {
                    setUploadMode('file')
                    setNewEmojiUrl('')
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${uploadMode === 'file'
                      ? 'bg-white shadow-sm text-slate-800 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  本地选取
                </button>
              </div>

              {/* 输入区域 */}
              {uploadMode === 'url' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 ml-1">图片链接</label>
                  <input
                    type="text"
                    value={newEmojiUrl}
                    onChange={(e) => setNewEmojiUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 ml-1">选取文件</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                    >
                      {newEmojiUrl ? (
                        <img src={newEmojiUrl} alt="预览" className="h-20 object-contain rounded-lg shadow-sm" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-slate-400">点击选择图片</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 ml-1">名称 (可选)</label>
                <input
                  type="text"
                  value={newEmojiName}
                  onChange={(e) => setNewEmojiName(e.target.value)}
                  placeholder="给它起个名字..."
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 ml-1">
                  描述与含义 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={newEmojiDesc}
                  onChange={(e) => setNewEmojiDesc(e.target.value)}
                  placeholder="描述这个图片的含义，帮助AI理解何时使用它..."
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddDialog(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAddEmoji}
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
              >
                确认收藏
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EmojiManagement
