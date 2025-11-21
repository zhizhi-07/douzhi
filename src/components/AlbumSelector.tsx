/**
 * 相册选择器组件
 * 支持多选上传真实图片文件
 */

import { useRef, useEffect } from 'react'
import { compressAndConvertToBase64 } from '../utils/imageUtils'

interface AlbumSelectorProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (photos: Array<{ base64: string, name: string }>) => void
}

const AlbumSelector = ({ isOpen, onClose, onConfirm }: AlbumSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 打开时自动触发文件选择
  useEffect(() => {
    if (isOpen && fileInputRef.current) {
      // 延迟一点点，确保组件已完全渲染
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      // 用户取消选择，关闭弹窗
      onClose()
      return
    }

    const newPhotos = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        try {
          // 使用压缩版本，大幅减少存储空间（最大1200x1200，质量0.7）
          const base64 = await compressAndConvertToBase64(file)
          newPhotos.push({
            base64: base64,
            name: file.name
          })
        } catch (error) {
          console.error('读取图片失败:', error)
        }
      }
    }
    
    // 清空input，允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // 选择完文件后直接发送，不需要预览
    if (newPhotos.length > 0) {
      onConfirm(newPhotos)
    }
    onClose()
  }

  return (
    <>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  )
}

export default AlbumSelector
