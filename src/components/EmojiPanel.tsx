/**
 * 表情包选择面板
 */

import { useState, useEffect, useRef } from 'react'
import { getEmojis, incrementUseCount, addEmoji, clearCache, getAllTags, addEmojisWithTag } from '../utils/emojiStorage'
import { emitEmojiSizeChange } from './EmojiContentRenderer'
import type { Emoji } from '../utils/emojiStorage'

const LAST_TAB_KEY = 'emoji_panel_last_tab'
const EMOJI_SIZE_KEY = 'ai_emoji_size' // 表情包大小设置

interface EmojiPanelProps {
  show: boolean
  onClose: () => void
  onSelect: (emoji: Emoji) => void
}

const EmojiPanel = ({ show, onClose, onSelect }: EmojiPanelProps) => {
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>(() => {
    // 从localStorage读取上次选择的标签
    return localStorage.getItem(LAST_TAB_KEY) || 'all'
  })
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showDescDialog, setShowDescDialog] = useState(false)
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false)
  const [pendingEmojiData, setPendingEmojiData] = useState<{url: string, name: string} | null>(null)
  const [pendingBatchEmojis, setPendingBatchEmojis] = useState<Array<{url: string, name: string}>>([])
  const [emojiDescription, setEmojiDescription] = useState('')
  const [singleEmojiTag, setSingleEmojiTag] = useState('')
  const [batchTag, setBatchTag] = useState('')
  const [batchDescription, setBatchDescription] = useState('')
  const [showSizeSlider, setShowSizeSlider] = useState(false)
  const [emojiSize, setEmojiSize] = useState(() => {
    const saved = localStorage.getItem(EMOJI_SIZE_KEY)
    return saved ? parseInt(saved, 10) : 80 // 默认80px
  })
  const [showJsonTagDialog, setShowJsonTagDialog] = useState(false)
  const [pendingJsonEmojis, setPendingJsonEmojis] = useState<Array<{url: string, name: string, description: string}>>([])  
  const [jsonTag, setJsonTag] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const batchImageInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) {
      // 每次打开都强制重新加载
      loadEmojis(true)
    }
  }, [show])

  // 记住用户选择的标签
  useEffect(() => {
    localStorage.setItem(LAST_TAB_KEY, activeTab)
  }, [activeTab])

  const loadEmojis = async (forceReload = false) => {
    if (forceReload) {
      // 清除缓存，强制从存储读取
      clearCache()
    }
    const loaded = await getEmojis()
    setEmojis(loaded)
    // 加载所有标签
    const loadedTags = await getAllTags()
    setTags(loadedTags)
    console.log('📦 表情包加载完成，共', loaded.length, '个，标签:', loadedTags)
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
      setSingleEmojiTag('')
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
      const tag = singleEmojiTag.trim() || undefined
      
      // 使用带标签的添加方式
      if (tag) {
        await addEmojisWithTag([{
          url: pendingEmojiData.url,
          name: pendingEmojiData.name,
          description: emojiDescription.trim()
        }], tag)
      } else {
        await addEmoji({
          url: pendingEmojiData.url,
          name: pendingEmojiData.name,
          description: emojiDescription.trim()
        })
      }
      console.log('✅ 表情包添加成功')
      
      // 重新加载表情包列表
      await loadEmojis(true)
      
      // 如果有标签，切换到该标签
      if (tag) {
        setActiveTab(tag)
      }
      
      // 清理状态
      setShowDescDialog(false)
      setPendingEmojiData(null)
      setEmojiDescription('')
      setSingleEmojiTag('')
      if (imageInputRef.current) imageInputRef.current.value = ''
      
      const allEmojis = await getEmojis()
      alert(`✅ 表情包添加成功${tag ? `到 "${tag}" 分类` : ''}！\n当前共有 ${allEmojis.length} 个表情包`)
    } catch (error) {
      console.error('❌ 添加表情包失败:', error)
      alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导入JSON - 先解析，再让用户选择标签
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      try {
        const parsed = JSON.parse(content)
        let emojiList: Array<{url: string, name: string, description: string}> = []
        
        if (Array.isArray(parsed)) {
          emojiList = parsed.filter(item => item.url).map(item => ({
            url: item.url,
            name: item.name || '',
            description: item.description || item.name || ''
          }))
        } else if (parsed.emojis && Array.isArray(parsed.emojis)) {
          emojiList = parsed.emojis.filter((item: any) => item.url).map((item: any) => ({
            url: item.url,
            name: item.name || '',
            description: item.description || item.name || ''
          }))
        }
        
        if (emojiList.length === 0) {
          alert('JSON文件中没有找到有效的表情包数据')
          return
        }
        
        // 保存解析结果，显示标签选择对话框
        setPendingJsonEmojis(emojiList)
        setJsonTag('')
        setShowJsonTagDialog(true)
      } catch (error) {
        alert(`JSON解析失败：${error instanceof Error ? error.message : '格式错误'}`)
      }
    }
    reader.readAsText(file)

    setShowImportMenu(false)
    if (jsonInputRef.current) jsonInputRef.current.value = ''
  }

  // 确认JSON导入（带标签）
  const handleConfirmJsonImport = async () => {
    if (pendingJsonEmojis.length === 0) return
    
    try {
      const tag = jsonTag.trim() || undefined
      const addedCount = await addEmojisWithTag(
        pendingJsonEmojis,
        tag || ''
      )
      
      console.log('✅ JSON导入成功:', addedCount, '个')
      await loadEmojis(true)
      
      // 如果有标签，切换到该标签
      if (tag) {
        setActiveTab(tag)
      }
      
      // 清理状态
      setShowJsonTagDialog(false)
      setPendingJsonEmojis([])
      setJsonTag('')
      
      alert(`✅ 成功导入 ${addedCount} 个表情包${tag ? `到 "${tag}" 分类` : ''}！`)
    } catch (error) {
      console.error('❌ JSON导入失败:', error)
      alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const frequentEmojis = emojis
    .filter(e => e.useCount > 0)
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 12)

  // 根据当前选中的标签过滤表情包
  const getDisplayEmojis = () => {
    if (activeTab === 'frequent') return frequentEmojis
    if (activeTab === 'all') return emojis
    // 按标签过滤
    return emojis.filter(e => e.tag === activeTab)
  }
  const displayEmojis = getDisplayEmojis()

  // 批量导入图片处理
  const handleBatchImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      alert('没有选择有效的图片文件')
      return
    }

    // 读取所有图片
    const readPromises = imageFiles.map(file => {
      return new Promise<{url: string, name: string}>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          resolve({
            url: event.target?.result as string,
            name: file.name.replace(/\.[^/.]+$/, '')
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readPromises).then(results => {
      setPendingBatchEmojis(results)
      setBatchTag('')
      setBatchDescription('')
      setShowBatchImportDialog(true)
    }).catch(err => {
      console.error('读取图片失败:', err)
      alert('读取图片失败')
    })

    setShowImportMenu(false)
  }

  // 确认批量导入
  const handleConfirmBatchImport = async () => {
    if (pendingBatchEmojis.length === 0) return
    
    if (!batchTag.trim()) {
      alert('请输入标签分类')
      return
    }
    if (!batchDescription.trim()) {
      alert('请输入表情包描述')
      return
    }

    try {
      // 为每个表情包添加相同的描述
      const emojisWithDesc = pendingBatchEmojis.map(e => ({
        ...e,
        description: batchDescription.trim()
      }))
      
      const addedCount = await addEmojisWithTag(emojisWithDesc, batchTag.trim())
      console.log('✅ 批量导入成功:', addedCount, '个')
      
      await loadEmojis(true)
      
      // 切换到新导入的标签
      setActiveTab(batchTag.trim())
      
      // 清理状态
      setShowBatchImportDialog(false)
      setPendingBatchEmojis([])
      setBatchTag('')
      setBatchDescription('')
      if (batchImageInputRef.current) batchImageInputRef.current.value = ''
      
      alert(`✅ 成功导入 ${addedCount} 个表情包到 "${batchTag.trim()}" 分类！`)
    } catch (error) {
      console.error('❌ 批量导入失败:', error)
      alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 大小调整滑块 - 独立显示，不依赖面板是否打开
  if (showSizeSlider && !show) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-4 shadow-2xl border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 whitespace-nowrap">表情包大小</span>
          <input
            type="range"
            min="40"
            max="200"
            value={emojiSize}
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10)
              setEmojiSize(newSize)
              localStorage.setItem(EMOJI_SIZE_KEY, String(newSize))
              emitEmojiSizeChange(newSize) // 🔥 触发实时更新
            }}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-sm font-medium text-purple-600 w-14 text-right">{emojiSize}px</span>
          <button
            onClick={() => setShowSizeSlider(false)}
            className="ml-2 px-3 py-1 bg-purple-500 text-white text-sm rounded-lg"
          >
            完成
          </button>
        </div>
      </div>
    )
  }

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
          <div className="flex gap-2 overflow-x-auto flex-1 mr-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'all'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab('frequent')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'frequent'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              常用
            </button>
            {/* 自定义标签 */}
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTab(tag)}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tag
                    ? 'text-blue-500 border-blue-500'
                    : 'text-gray-400 border-transparent'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center flex-shrink-0"
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
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {emoji.useCount}
                    </div>
                  )}
                  {/* 描述文字 - 叠加在图片底部 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center">
                    <span className="text-[10px] text-white line-clamp-1">{emoji.description || emoji.name}</span>
                  </div>
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
                <span className="text-sm font-medium">导入单张图片</span>
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={() => {
                  setShowImportMenu(false)
                  setShowSizeSlider(true)
                  onClose() // 关闭表情包面板，让用户能看到聊天
                }}
                className="w-full px-6 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-sm font-medium">调整表情包大小</span>
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
          onChange={handleImageImport}
          className="hidden"
        />
        <input
          ref={batchImageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleBatchImageImport}
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
                  placeholder="例如：大笑、哭泣、尴尬、疑惑、点赞等..."
                  className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
                  autoFocus
                />
              </div>

              {/* 标签选择 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  分类标签
                  <span className="text-xs text-gray-400 ml-2">（可选）</span>
                </label>
                <input
                  type="text"
                  value={singleEmojiTag}
                  onChange={(e) => setSingleEmojiTag(e.target.value)}
                  placeholder="输入或选择标签"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSingleEmojiTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          singleEmojiTag === tag
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDescDialog(false)
                    setPendingEmojiData(null)
                    if (imageInputRef.current) imageInputRef.current.value = ''
                  }}
                  className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmAddEmoji}
                  className="flex-1 py-2 bg-slate-700 text-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
                >
                  添加
                </button>
              </div>
            </div>
          </>
        )}


        {/* JSON导入标签选择对话框 */}
        {showJsonTagDialog && pendingJsonEmojis.length > 0 && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => {
                setShowJsonTagDialog(false)
                setPendingJsonEmojis([])
              }}
            />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-3xl p-6 shadow-2xl max-w-md mx-auto max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">导入JSON表情包</h2>
              
              {/* 预览数量 */}
              <div className="mb-4 p-3 bg-green-50 rounded-xl">
                <div className="text-sm text-green-700">
                  ✅ 已解析 <span className="font-bold">{pendingJsonEmojis.length}</span> 个表情包
                </div>
              </div>
              
              {/* 标签输入 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  分类标签
                  <span className="text-xs text-gray-400 ml-2">（可选，留空则不分类）</span>
                </label>
                <input
                  type="text"
                  value={jsonTag}
                  onChange={(e) => setJsonTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                {/* 已有标签快捷选择 */}
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setJsonTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          jsonTag === tag
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJsonTagDialog(false)
                    setPendingJsonEmojis([])
                    setJsonTag('')
                  }}
                  className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmJsonImport}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium"
                >
                  导入
                </button>
              </div>
            </div>
          </>
        )}

        {/* 批量导入对话框 */}
        {showBatchImportDialog && pendingBatchEmojis.length > 0 && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => {
                setShowBatchImportDialog(false)
                setPendingBatchEmojis([])
                if (batchImageInputRef.current) batchImageInputRef.current.value = ''
              }}
            />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-3xl p-6 shadow-2xl max-w-md mx-auto max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">批量导入表情包</h2>
              
              {/* 预览图片网格 */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">已选择 {pendingBatchEmojis.length} 张图片</div>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                  {pendingBatchEmojis.slice(0, 10).map((emoji, idx) => (
                    <img
                      key={idx}
                      src={emoji.url}
                      alt={emoji.name}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                  {pendingBatchEmojis.length > 10 && (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{pendingBatchEmojis.length - 10}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 标签输入 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  分类标签 *
                  <span className="text-xs text-gray-400 ml-2">（如：可爱、小狗、搞笑等）</span>
                </label>
                <input
                  type="text"
                  value={batchTag}
                  onChange={(e) => setBatchTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                {/* 已有标签快捷选择 */}
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setBatchTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          batchTag === tag
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 描述输入 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  表情包描述 *
                  <span className="text-xs text-gray-400 ml-2">（同一批次的表情包使用相同描述）</span>
                </label>
                <textarea
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="例如：可爱的小狗表情、搞笑表情等..."
                  className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBatchImportDialog(false)
                    setPendingBatchEmojis([])
                    setBatchTag('')
                    setBatchDescription('')
                    if (batchImageInputRef.current) batchImageInputRef.current.value = ''
                  }}
                  className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmBatchImport}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
                >
                  导入
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
