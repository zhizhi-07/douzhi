/**
 * 发布朋友圈页面
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { publishMoment } from '../utils/momentsManager'
import { triggerAIMomentsInteraction } from '../utils/momentsAI'
import { getUserInfo } from '../utils/userUtils'
import type { MomentImage } from '../types/moments'

export default function PublishMoment() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<MomentImage[]>([])
  const [location, setLocation] = useState('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 获取当前用户信息
  const userInfo = getUserInfo()
  const currentUser = {
    id: 'user',
    name: userInfo.nickname || userInfo.realName,
    avatar: userInfo.avatar || undefined
  }
  
  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    // 限制最多9张图片
    if (images.length + files.length > 9) {
      alert('最多只能选择9张图片')
      return
    }
    
    Array.from(files).forEach((file) => {
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setImages(prev => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            url
          }
        ])
      }
      reader.readAsDataURL(file)
    })
  }
  
  // 删除图片
  const handleDeleteImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }
  
  // 发布
  const handlePublish = () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或选择图片')
      return
    }
    
    const newMoment = publishMoment(
      currentUser,
      content.trim(),
      images,
      location.trim() || undefined
    )
    
    // 触发AI角色查看和互动
    triggerAIMomentsInteraction(newMoment)
    
    navigate('/moments')
  }
  
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 头部 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/moments')}
            className="text-gray-700"
          >
            取消
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            发朋友圈
          </h1>
          <button 
            onClick={handlePublish}
            className="text-blue-600 font-medium"
          >
            发表
          </button>
        </div>
      </div>
      
      {/* 内容输入 */}
      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="这一刻的想法..."
          className="w-full min-h-[200px] p-4 glass-card rounded-2xl focus:outline-none resize-none text-gray-800"
          autoFocus
        />
        
        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {images.map((image) => (
              <div key={image.id} className="relative aspect-square">
                <img
                  src={image.url}
                  alt="预览"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square glass-card rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/60 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 位置输入 */}
        {showLocationInput && (
          <div className="mt-4">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入位置"
              className="w-full px-4 py-3 glass-card rounded-2xl focus:outline-none"
            />
          </div>
        )}
      </div>
      
      {/* 底部工具栏 */}
      <div className="glass-effect border-t border-gray-200/30 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-700 hover:bg-white/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">图片</span>
          </button>
          
          <button
            onClick={() => setShowLocationInput(!showLocationInput)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
              showLocationInput ? 'bg-blue-50 text-blue-600' : 'glass-card text-gray-700 hover:bg-white/60'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>位置</span>
          </button>
        </div>
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  )
}
