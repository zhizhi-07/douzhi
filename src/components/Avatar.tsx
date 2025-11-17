/**
 * 头像组件
 * 统一的头像显示组件，避免代码重复
 * 支持自定义头像框
 */

import { getUserInfo } from '../utils/userUtils'
import { useState, useEffect } from 'react'

interface AvatarProps {
  type: 'sent' | 'received'
  avatar?: string
  name: string
  chatId?: string
}

const Avatar = ({ type, avatar, name, chatId }: AvatarProps) => {
  const [frameCSS, setFrameCSS] = useState('')
  const [shape, setShape] = useState('rounded')
  const [frameImage, setFrameImage] = useState('')
  const [frameSize, setFrameSize] = useState(120)
  const [frameOffsetX, setFrameOffsetX] = useState(0)
  const [frameOffsetY, setFrameOffsetY] = useState(0)

  // 加载头像框样式和形状
  useEffect(() => {
    if (!chatId) return

    const loadFrameStyle = () => {
      const key = type === 'sent' 
        ? `user_avatar_frame_${chatId}` 
        : `ai_avatar_frame_${chatId}`
      const css = localStorage.getItem(key) || ''
      const avatarShape = localStorage.getItem(`avatar_shape_${chatId}`) || 'rounded'
      const image = localStorage.getItem(`avatar_frame_image_${chatId}`) || ''
      const size = parseInt(localStorage.getItem(`avatar_frame_size_${chatId}`) || '120')
      const offsetX = parseInt(localStorage.getItem(`avatar_frame_offset_x_${chatId}`) || '0')
      const offsetY = parseInt(localStorage.getItem(`avatar_frame_offset_y_${chatId}`) || '0')
      
      setFrameCSS(css)
      setShape(avatarShape)
      setFrameImage(image)
      setFrameSize(size)
      setFrameOffsetX(offsetX)
      setFrameOffsetY(offsetY)
    }

    loadFrameStyle()

    // 监听头像框更新
    const handleFrameUpdate = () => {
      loadFrameStyle()
    }

    window.addEventListener('avatarFrameUpdate', handleFrameUpdate)
    return () => {
      window.removeEventListener('avatarFrameUpdate', handleFrameUpdate)
    }
  }, [chatId, type])
  
  // 根据形状选择className
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  if (type === 'sent') {
    // 用户头像 - 读取用户上传的头像
    const userInfo = getUserInfo()
    return (
      <>
        {frameCSS && <style>{`.avatar-frame-user-${chatId} { ${frameCSS} }`}</style>}
        <div className="relative overflow-visible">
          <div className={`avatar-frame-user-${chatId} w-8 h-8 ${shapeClass} bg-gray-300 flex items-center justify-center overflow-hidden`}>
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          {frameImage && (
            <img 
              src={frameImage} 
              alt="装饰框" 
              className="absolute top-1/2 left-1/2 pointer-events-none z-10"
              style={{
                width: `${32 * frameSize / 100}px`,
                height: `${32 * frameSize / 100}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </>
    )
  }

  // AI头像
  return (
    <>
      {frameCSS && <style>{`.avatar-frame-ai-${chatId} { ${frameCSS} }`}</style>}
      <div className="relative overflow-visible">
        <div className={`avatar-frame-ai-${chatId} w-8 h-8 ${shapeClass} bg-gray-200 flex items-center justify-center overflow-hidden`}>
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
        {frameImage && (
          <img 
            src={frameImage} 
            alt="装饰框" 
            className="absolute top-1/2 left-1/2 pointer-events-none z-10"
            style={{
              width: `${32 * frameSize / 100}px`,
              height: `${32 * frameSize / 100}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(-50%, -50%) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
              objectFit: 'contain'
            }}
          />
        )}
      </div>
    </>
  )
}

export default Avatar
