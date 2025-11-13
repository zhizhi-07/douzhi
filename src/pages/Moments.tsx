/**
 * 朋友圈页面 - 微信风格
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { loadMoments, likeMoment, unlikeMoment, commentMoment, deleteMoment } from '../utils/momentsManager'
import { getUserInfo } from '../utils/userUtils'
import { playLikeSound } from '../utils/soundManager'
import type { Moment } from '../types/moments'

export default function Moments() {
  const navigate = useNavigate()
  const [moments, setMoments] = useState<Moment[]>([])
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [replyToUser, setReplyToUser] = useState('')
  const [coverImage, setCoverImage] = useState<string>(() => {
    return localStorage.getItem('moments_cover_image') || ''
  })
  
  // 获取当前用户信息
  const userInfo = getUserInfo()
  const currentUser = {
    id: 'user',
    name: userInfo.nickname || userInfo.realName,
    avatar: userInfo.avatar
  }
  
  useEffect(() => {
    setMoments(loadMoments())
    
    // 监听朋友圈数据变化，实时刷新
    const handleMomentsUpdate = () => {
      setMoments(loadMoments())
    }
    
    window.addEventListener('moments-updated', handleMomentsUpdate)
    window.addEventListener('storage', handleMomentsUpdate)
    
    return () => {
      window.removeEventListener('moments-updated', handleMomentsUpdate)
      window.removeEventListener('storage', handleMomentsUpdate)
    }
  }, [])
  
  const refresh = () => {
    setMoments(loadMoments())
  }
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 3) return `${days}天前`
    
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  
  const handleLike = (momentId: string) => {
    playLikeSound() // 🎵 播放点赞音效
    const moment = moments.find(m => m.id === momentId)
    if (!moment) return

    const hasLiked = moment.likes.some(like => like.userId === currentUser.id)

    if (hasLiked) {
      unlikeMoment(momentId, currentUser.id)
    } else {
      likeMoment(momentId, currentUser)
    }

    refresh()
  }
  
  const handleCommentSubmit = (momentId: string) => {
    if (!commentText.trim()) return
    
    commentMoment(momentId, currentUser, commentText.trim())
    setCommentText('')
    setShowCommentInput(null)
    setReplyToUser('')
    refresh()
  }
  
  const handleDelete = (momentId: string) => {
    if (confirm('确定删除这条朋友圈吗？')) {
      deleteMoment(momentId)
      refresh()
    }
  }
  
  const handleCoverUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageData = event.target?.result as string
          setCoverImage(imageData)
          localStorage.setItem('moments_cover_image', imageData)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }
  
  // 检查是否已点赞
  const hasLiked = (moment: Moment) => {
    return moment.likes.some(like => like.userId === currentUser.id)
  }
  
  return (
    <div className="h-screen flex flex-col bg-white page-fade-in">
      {/* 头部导航栏 */}
      <div className="glass-effect z-50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/discover')}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/publish-moment')}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 可滚动区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 顶部封面区域 */}
        <div className="relative h-80 bg-white overflow-hidden">
          <div 
            className="absolute inset-0 bg-gray-100 cursor-pointer group"
            onClick={handleCoverUpload}
          >
            {coverImage ? (
              <img 
                src={coverImage} 
                alt="封面" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  点击上传封面图片
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* 用户信息 */}
          <div className="absolute bottom-6 left-4 right-4 flex items-end justify-end gap-4">
            <div className="flex flex-col items-end text-right">
              <h2 className="text-white font-semibold text-base drop-shadow-lg mb-1">
                {currentUser.name}
              </h2>
              {userInfo.signature && (
                <p className="text-white/90 text-xs drop-shadow-lg">
                  {userInfo.signature}
                </p>
              )}
            </div>
            <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center shadow-2xl overflow-hidden border-2 border-white/50 flex-shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="用户头像" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* 朋友圈动态列表 */}
        <div className="bg-white pb-20">
          {moments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">暂无动态</p>
              <p className="text-xs mt-2 text-gray-300">点击右上角相机发布第一条朋友圈</p>
            </div>
          ) : (
          <div>
            {moments.map((moment, index) => (
              <div
                key={moment.id}
                className="bg-white border-b border-gray-100 p-4 hover:bg-gray-50/50 transition-colors card-enter"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  {/* 用户头像 */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                    {moment.userAvatar && moment.userAvatar.startsWith('data:') ? (
                      <img src={moment.userAvatar} alt={moment.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-lg">{moment.userAvatar || '👤'}</div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {/* 用户名 */}
                    <h3 className="font-semibold text-blue-600 mb-1">{moment.userName.length > 12 ? moment.userName.slice(0, 12) + '...' : moment.userName}</h3>
                    
                    {/* 动态内容 */}
                    <p className="text-gray-800 leading-relaxed mb-2">
                      {moment.content}
                      {moment.mentions && moment.mentions.length > 0 && (
                        <span className="text-blue-600"> @{moment.mentions.join(' @')}</span>
                      )}
                    </p>
                    
                    {/* 图片 */}
                    {moment.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {moment.images.map((image) => (
                          <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
                            <img 
                              src={image.url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 位置和时间 */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span>{formatTime(moment.createdAt)}</span>
                      {moment.location && (
                        <>
                          <span>·</span>
                          <span>{moment.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 更多按钮 */}
                  {moment.userId === currentUser.id && (
                    <button 
                      onClick={() => handleDelete(moment.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* 点赞和评论区域 */}
                {(moment.likes.length > 0 || moment.comments.length > 0) && (
                  <div className="ml-[60px] bg-gray-50 rounded-lg p-3 space-y-2">
                    {/* 点赞列表 */}
                    {moment.likes.length > 0 && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 fill-current mt-0.5" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 text-sm">
                          <span className="text-blue-600">
                            {moment.likes.map(like => like.userName.length > 8 ? like.userName.slice(0, 8) + '...' : like.userName).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {moment.likes.length > 0 && moment.comments.length > 0 && (
                      <div className="border-t border-gray-200/60" />
                    )}
                    
                    {/* 评论列表 */}
                    {moment.comments.length > 0 && (
                      <div className="space-y-2">
                        {moment.comments.map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <span className="text-blue-600 font-medium">{comment.userName.length > 8 ? comment.userName.slice(0, 8) + '...' : comment.userName}：</span>
                            <span className="text-gray-700">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 操作栏 */}
                <div className="flex items-center justify-end gap-4 mt-3 ml-[60px]">
                  <button 
                    onClick={() => handleLike(moment.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-all ${
                      hasLiked(moment) ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${hasLiked(moment) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-xs">赞</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowCommentInput(showCommentInput === moment.id ? null : moment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 active:scale-95 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs">评论</span>
                  </button>
                </div>

                {/* 评论输入框 */}
                {showCommentInput === moment.id && (
                  <div className="mt-3 ml-[60px]">
                    <div className="glass-card rounded-xl p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="说点什么..."
                          className="flex-1 bg-transparent outline-none text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCommentSubmit(moment.id)
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleCommentSubmit(moment.id)}
                          className="px-4 py-1 rounded-lg glass-effect text-blue-600 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                          disabled={!commentText.trim()}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
