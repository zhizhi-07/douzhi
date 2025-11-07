/**
 * 表情包选择面板
 */

import { useState, useEffect, useRef } from 'react'
import { getEmojis, incrementUseCount, addEmoji, importEmojis, clearCache } from '../utils/emojiStorage'
import type { Emoji } from '../utils/emojiStorage'

interface EmojiPanelProps {
  show: boolean
  onClose: () => void
  onSelect: (emoji: Emoji) => void
}

const EmojiPanel = ({ show, onClose, onSelect }: EmojiPanelProps) => {
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'frequent'>('all')
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showDescDialog, setShowDescDialog] = useState(false)
  const [pendingEmojiData, setPendingEmojiData] = useState<{url: string, name: string} | null>(null)
  const [emojiDescription, setEmojiDescription] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) {
      // 每次打开都强制重新加载
      loadEmojis(true)
    }
  }, [show])

  const loadEmojis = async (forceReload = false) => {
    if (forceReload) {
      // 清除缓存，强制从存储读取
      clearCache()
    }
    const loaded = await getEmojis()
    setEmojis(loaded)
    console.log('📦 表情包加载完成，共', loaded.length, '个')
  }

  const handleSelectEmoji = async (emoji: Emoji) => {
    onSelect(emoji)
    onClose()
    
    // 异步更新使用次数
    await incrementUseCount(emoji.id)
  }

  // 导入图片
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0] // 只处理第一个文件
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是图片文件`)
      if (imageInputRef.current) imageInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      const name = file.name.replace(/\.[^/.]+$/, '')
      
      // 保存待处理的表情包数据，显示描述输入对话框
      setPendingEmojiData({ url, name })
      setEmojiDescription('')
      setShowDescDialog(true)
    }
    reader.readAsDataURL(file)

    setShowImportMenu(false)
  }

  // 确认添加表情包
  const handleConfirmAddEmoji = async () => {
    if (!pendingEmojiData) return
    
    if (!emojiDescription.trim()) {
      alert('请输入表情包描述，让AI能理解这个表情的含义')
      return
    }

    try {
      const newEmoji = await addEmoji({
        url: pendingEmojiData.url,
        name: pendingEmojiData.name,
        description: emojiDescription.trim()
      })
      console.log('✅ 表情包添加成功:', newEmoji)
      
      // 重新加载表情包列表
      await loadEmojis()
      
      // 验证是否真的保存了
      const allEmojis = await getEmojis()
      console.log('📦 当前所有表情包数量:', allEmojis.length)
      
      // 清理状态
      setShowDescDialog(false)
      setPendingEmojiData(null)
      setEmojiDescription('')
      if (imageInputRef.current) imageInputRef.current.value = ''
      
      alert(`✅ 表情包添加成功！\n当前共有 ${allEmojis.length} 个表情包`)
    } catch (error) {
      console.error('❌ 添加表情包失败:', error)
      alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导入JSON
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      try {
        const result = await importEmojis(content, false)
        
        if (result.success) {
          alert(result.message)
          await loadEmojis()
        } else {
          alert(result.message)
        }
      } catch (error) {
        alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    reader.readAsText(file)

    setShowImportMenu(false)
    if (jsonInputRef.current) jsonInputRef.current.value = ''
  }

  const frequentEmojis = emojis
    .filter(e => e.useCount > 0)
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 12)

  const displayEmojis = activeTab === 'frequent' ? frequentEmojis : emojis

  if (!show) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* 表情包面板 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[60vh] flex flex-col shadow-2xl">
        {/* 顶部标签栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              全部表情
            </button>
            <button
              onClick={() => setActiveTab('frequent')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                activeTab === 'frequent'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              常用表情
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* 表情包网格 */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayEmojis.length === 0 && activeTab === 'frequent' ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <svg className="w-12 h-12 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <circle cx="9" cy="9" r="1"/>
                <circle cx="15" cy="9" r="1"/>
              </svg>
              <div className="text-sm">还没有常用表情包</div>
              <div className="text-xs text-gray-300 mt-1">多发几次表情包就会出现在这里</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {/* 添加按钮 */}
              <div
                onClick={() => setShowImportMenu(true)}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 active:scale-95 cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center"
              >
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              {displayEmojis.map((emoji) => (
                <div
                  key={emoji.id}
                  onClick={() => handleSelectEmoji(emoji)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md border border-gray-200 active:scale-95 cursor-pointer transition-transform"
                >
                  <img
                    src={emoji.url}
                    alt={emoji.description}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {activeTab === 'frequent' && emoji.useCount > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {emoji.useCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 导入菜单 */}
        {showImportMenu && (
          <>
            <div 
              className="fixed inset-0 z-50" 
              onClick={() => setShowImportMenu(false)}
            />
            <div className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <button
                onClick={() => {
                  imageInputRef.current?.click()
                  setShowImportMenu(false)
                }}
                className="w-full px-6 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">导入图片</span>
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={() => {
                  jsonInputRef.current?.click()
                  setShowImportMenu(false)
                }}
                className="w-full px-6 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">导入JSON</span>
              </button>
            </div>
          </>
        )}

        {/* 隐藏的文件输入 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageImport}
          className="hidden"
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonImport}
          className="hidden"
        />

        {/* 表情包描述输入对话框 */}
        {showDescDialog && pendingEmojiData && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => {
                setShowDescDialog(false)
                setPendingEmojiData(null)
                if (imageInputRef.current) imageInputRef.current.value = ''
              }}
            />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-3xl p-6 shadow-2xl max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4">添加表情包描述</h2>
              
              {/* 预览图片 */}
              <div className="mb-4 flex justify-center">
                <img
                  src={pendingEmojiData.url}
                  alt="预览"
                  className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  表情包描述 *
                  <span className="text-xs text-gray-400 ml-2">（帮助AI理解这个表情的含义）</span>
                </label>
                <textarea
                  value={emojiDescription}
                  onChange={(e) => setEmojiDescription(e.target.value)}
                  placeholder="例如：大笑、哭泣、尴尬、疑惑、点赞等...\n这个描述会帮助AI理解何时使用这个表情"
                  className="w-full px-3 py-2 border rounded-lg h-24 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDescDialog(false)
                    setPendingEmojiData(null)
                    if (imageInputRef.current) imageInputRef.current.value = ''
                  }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmAddEmoji}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg"
                >
                  添加
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default EmojiPanel
