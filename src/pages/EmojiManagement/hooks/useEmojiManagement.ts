/**
 * 表情包管理 - 核心逻辑 Hook
 */

import { useState, useEffect } from 'react'
import {
  getEmojis,
  addEmoji,
  deleteEmoji,
  updateEmoji,
  clearAllEmojis,
  type Emoji
} from '../../../utils/emojiStorage'
import { compressAndConvertToBase64 } from '../../../utils/imageUtils'

export const useEmojiManagement = () => {
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [newEmojiUrl, setNewEmojiUrl] = useState('')
  const [newEmojiName, setNewEmojiName] = useState('')
  const [newEmojiDesc, setNewEmojiDesc] = useState('')
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false)
  const [batchImportText, setBatchImportText] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEmojis, setSelectedEmojis] = useState<Set<number>>(new Set())
  const [editingEmoji, setEditingEmoji] = useState<Emoji | null>(null)
  const [editDesc, setEditDesc] = useState('')

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

  const toggleSelectEmoji = (id: number) => {
    setSelectedEmojis(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleBatchDelete = async () => {
    if (selectedEmojis.size === 0) {
      alert('请先选择要删除的表情包')
      return
    }
    if (confirm(`确认要删除选中的 ${selectedEmojis.size} 个表情包吗？`)) {
      for (const id of selectedEmojis) {
        await deleteEmoji(id)
      }
      setSelectedEmojis(new Set())
      await loadEmojis()
    }
  }

  const openEditDescDialog = (emoji: Emoji) => {
    setEditingEmoji(emoji)
    setEditDesc(emoji.description)
  }

  const handleSaveDesc = async () => {
    if (!editingEmoji) return
    await updateEmoji(editingEmoji.id, { description: editDesc.trim() || editingEmoji.name })
    setEditingEmoji(null)
    setEditDesc('')
    await loadEmojis()
  }

  const exitEditMode = () => {
    setIsEditMode(false)
    setSelectedEmojis(new Set())
  }

  const handleBatchImportFromUrl = async () => {
    const lines = batchImportText.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      alert('请输入表情包列表')
      return
    }

    let successCount = 0
    let failCount = 0

    for (const line of lines) {
      const match = line.match(/^(.+?)[：:]\s*(https?:\/\/.+)$/)
      if (!match) {
        failCount++
        continue
      }

      const name = match[1].trim()
      const url = match[2].trim()

      try {
        await addEmoji({
          url,
          name,
          description: name
        })
        successCount++
      } catch (error) {
        console.error('导入失败:', name, error)
        failCount++
      }
    }

    alert(`批量导入完成\n\n成功: ${successCount}\n失败: ${failCount}`)
    setBatchImportText('')
    setShowBatchImportDialog(false)
    await loadEmojis()
  }

  const handleImportTxt = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        setBatchImportText(text)
        setShowBatchImportDialog(true)
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

  return {
    // 状态
    emojis,
    showAddDialog,
    setShowAddDialog,
    showAddMenu,
    setShowAddMenu,
    uploadMode,
    setUploadMode,
    newEmojiUrl,
    setNewEmojiUrl,
    newEmojiName,
    setNewEmojiName,
    newEmojiDesc,
    setNewEmojiDesc,
    showBatchImportDialog,
    setShowBatchImportDialog,
    batchImportText,
    setBatchImportText,
    isEditMode,
    setIsEditMode,
    selectedEmojis,
    editingEmoji,
    setEditingEmoji,
    editDesc,
    setEditDesc,
    // 方法
    handleFileUpload,
    handleAddEmoji,
    handleDeleteEmoji,
    toggleSelectEmoji,
    handleBatchDelete,
    openEditDescDialog,
    handleSaveDesc,
    exitEditMode,
    handleBatchImportFromUrl,
    handleImportTxt,
    handleClearAll,
  }
}
