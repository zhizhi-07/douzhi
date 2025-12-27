/**
 * 朋友圈页面 - 文艺/高级/玻璃态风格
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import EmojiContentRenderer from '../components/EmojiContentRenderer'
import { loadMoments, likeMoment, unlikeMoment, commentMoment, deleteMoment } from '../utils/momentsManager'
import { saveBackground, getBackground } from '../utils/backgroundStorage'
import { getUserInfo, getUserInfoWithAvatar } from '../utils/userUtils'
import { playLikeSound } from '../utils/soundManager'
import type { Moment } from '../types/moments'
import { loadMomentsGroups, createMomentsGroup, deleteMomentsGroup, updateMomentsGroup, getNextGroupColor, type MomentsGroup } from '../utils/momentsGroupManager'
import { characterService } from '../services/characterService'

export default function Moments() {
  const navigate = useNavigate()
  const [moments, setMoments] = useState<Moment[]>([])
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<string>('')
  const [coverImage, setCoverImage] = useState<string>('')
  const [showCircleManager, setShowCircleManager] = useState(false)
  const [groups, setGroups] = useState<MomentsGroup[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([])
  const [editingGroup, setEditingGroup] = useState<MomentsGroup | null>(null)
  // 从localStorage读取选中的圈子，持久化保存
  const [selectedCircleId, setSelectedCircleId] = useState<string>(() => {
    return localStorage.getItem('moments_selected_circle') || ''
  })
  const allCharacters = characterService.getAll()
  
  // 选中圈子变化时保存到localStorage
  const handleSelectCircle = (circleId: string) => {
    setSelectedCircleId(circleId)
    if (circleId) {
      localStorage.setItem('moments_selected_circle', circleId)
    } else {
      localStorage.removeItem('moments_selected_circle')
    }
  }

  // 获取当前用户信息
  const userInfo = getUserInfo()
  const [userAvatar, setUserAvatar] = useState<string>('')
  const currentUser = {
    id: 'user',
    name: userInfo.nickname || userInfo.realName,
    avatar: userAvatar || '👤'
  }

  useEffect(() => {
    const loadedMoments = loadMoments()
    setMoments(loadedMoments)
    
    // 🔥 初始化加载圈子列表（修复白屏问题）
    setGroups(loadMomentsGroups())

    // 异步加载用户头像
    const loadUserAvatar = async () => {
      const fullUserInfo = await getUserInfoWithAvatar()
      if (fullUserInfo.avatar) {
        setUserAvatar(fullUserInfo.avatar)
      }
    }
    loadUserAvatar()
    
    // 从IndexedDB加载封面图片
    getBackground('moments_cover').then(savedCover => {
      if (savedCover) {
        setCoverImage(savedCover)
      }
    })

    const handleMomentsUpdate = () => {
      const updatedMoments = loadMoments()
      setMoments(updatedMoments)
    }

    const handleUserInfoUpdate = () => { loadUserAvatar() }

    window.addEventListener('moments-updated', handleMomentsUpdate)
    window.addEventListener('storage', handleMomentsUpdate)
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)

    return () => {
      window.removeEventListener('moments-updated', handleMomentsUpdate)
      window.removeEventListener('storage', handleMomentsUpdate)
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
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

  const handleLike = async (momentId: string) => {
    playLikeSound()
    const moment = moments.find(m => m.id === momentId)
    if (!moment) return

    const hasLiked = moment.likes.some(like => like.userId === currentUser.id)

    if (hasLiked) {
      await unlikeMoment(momentId, currentUser.id)
    } else {
      await likeMoment(momentId, currentUser)
    }

    refresh()

    if (moment.userId && moment.userId !== currentUser.id) {
      import('../services/memoryExtractor').then(({ recordInteraction }) => {
        recordInteraction(moment.userId, moment.userName)
      })
    }
  }

  const handleCommentSubmit = async (momentId: string) => {
    if (!commentText.trim()) return

    await commentMoment(momentId, currentUser, commentText.trim(), replyTo || undefined)
    setCommentText('')
    setReplyTo('')
    setShowCommentInput(null)
    refresh()

    const moment = moments.find(m => m.id === momentId)
    if (moment && moment.userId && moment.userId !== currentUser.id) {
      import('../services/memoryExtractor').then(({ recordInteraction }) => {
        recordInteraction(moment.userId, moment.userName)
      })
    }
  }

  const handleReplyComment = (momentId: string, userName: string) => {
    setReplyTo(userName)
    setShowCommentInput(momentId)
  }

  const handleDelete = async (momentId: string) => {
    if (confirm('确定删除这条朋友圈吗？')) {
      await deleteMoment(momentId)
      refresh()
    }
  }

  const handleCoverUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // 保存到IndexedDB
        const url = await saveBackground('moments_cover', file)
        setCoverImage(url)
      }
    }
    input.click()
  }

  const hasLiked = (moment: Moment) => {
    return moment.likes.some(like => like.userId === currentUser.id)
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">
      {/* 背景装饰 */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* 顶部导航栏 - 悬浮 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <StatusBar />
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/discover')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* 右侧按钮组 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // 把选中的圈子ID传给发布页面
                if (selectedCircleId) {
                  localStorage.setItem('publish_moment_circle_id', selectedCircleId)
                } else {
                  localStorage.removeItem('publish_moment_circle_id')
                }
                navigate('/publish-moment')
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* 圈子按钮 */}
            <button
              onClick={() => {
                setGroups(loadMomentsGroups())
                setShowCircleManager(true)
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm active:scale-95 ${selectedCircleId ? 'bg-slate-600 text-white' : 'bg-black/20 text-white hover:bg-black/30'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 可滚动区域 */}
      <div className="flex-1 overflow-y-auto z-0 scrollbar-hide">
        {/* 顶部封面区域 */}
        <div className="relative h-[360px] w-full">
          <div
            className="absolute inset-0 bg-slate-200 cursor-pointer group overflow-hidden"
            onClick={handleCoverUpload}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="封面"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <div className="text-slate-400 text-sm font-light tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                  点击更换封面
                </div>
              </div>
            )}

          </div>

          {/* 用户信息 */}
          <div className="absolute bottom-[-30px] right-6 flex items-end gap-5 z-10">
            <div className="flex flex-col items-end text-right mb-8">
              <h2 className="text-white font-medium text-xl drop-shadow-md tracking-wide">
                {currentUser.name}
              </h2>
              {userInfo.signature && (
                <p className="text-white/90 text-xs font-light tracking-wider mt-1 drop-shadow-md max-w-[200px] truncate">
                  {userInfo.signature}
                </p>
              )}
            </div>
            <div className="w-20 h-20 rounded-[24px] bg-white p-1 shadow-xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-100">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="用户头像" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 朋友圈动态列表 */}
        <div className="px-6 pt-16 pb-24 space-y-6">
                    {(() => {
            // 根据圈子筛选朋友圈
            const selectedGroup = groups.find(g => g.id === selectedCircleId)
            const filteredMoments = moments.filter(m => {
              if (m.isDeleted) return false
              if (!selectedCircleId) return true  // 没选圈子，显示全部
              // 选了圈子，只显示圈子成员发的朋友圈
              return selectedGroup?.characterIds.includes(m.userId) || m.userId === 'user'
            })
            
            return filteredMoments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-slate-400 font-light tracking-widest text-sm">暂无动态</p>
              <p className="text-[10px] text-slate-300 mt-2 font-light">{selectedCircleId ? '该圈子暂无动态' : '记录生活的第一刻'}</p>
            </div>
          ) : (
            filteredMoments.map((moment, index) => (
              <div
                key={moment.id}
                className="pb-4 border-b border-slate-200/50 last:border-b-0"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  {/* 用户头像 - 用户自己的朋友圈显示最新头像 */}
                  <div className="w-12 h-12 rounded-[18px] bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-white/50">
                    {(moment.userId === currentUser.id || moment.userId === 'user') ? (
                      // 用户自己的朋友圈：显示最新头像
                      userAvatar ? (
                        <img src={userAvatar} alt={moment.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-lg">👤</div>
                      )
                    ) : (
                      // 其他人的朋友圈：显示发布时的头像
                      moment.userAvatar && moment.userAvatar.startsWith('data:') ? (
                        <img src={moment.userAvatar} alt={moment.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-lg">{moment.userAvatar || '👤'}</div>
                      )
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 用户名 */}
                    <h3 className="text-base font-medium text-slate-800 mb-1 tracking-wide">{moment.userName}</h3>

                    {/* 动态内容 */}
                    <p className="text-slate-600 text-sm font-light leading-relaxed mb-3 tracking-wide">
                      {moment.content}
                      {moment.mentions && moment.mentions.length > 0 && (
                        <span className="text-indigo-500 font-medium"> @{moment.mentions.join(' @')}</span>
                      )}
                    </p>

                    {/* 图片 */}
                    {moment.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${moment.images.length === 1 ? 'grid-cols-1 max-w-[60%]' : 'grid-cols-3'}`}>
                        {moment.images.map((image) => (
                          <div key={image.id} className="aspect-square rounded-[16px] overflow-hidden bg-slate-100 cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                            <img
                              src={image.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 底部信息栏 */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-light tracking-wider">
                        <span>{formatTime(moment.createdAt)}</span>
                        {moment.location && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{moment.location}</span>
                          </>
                        )}
                        {/* 所有朋友圈都可以删除（用户自己的和AI的） */}
                        <button
                          onClick={() => handleDelete(moment.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors ml-2"
                        >
                          删除
                        </button>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLike(moment.id)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-90 ${hasLiked(moment)
                            ? 'bg-red-50 text-red-500 shadow-sm'
                            : 'bg-white/50 text-slate-400 hover:bg-white/80'
                            }`}
                        >
                          <svg className={`w-4 h-4 ${hasLiked(moment) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => setShowCommentInput(showCommentInput === moment.id ? null : moment.id)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-90 ${showCommentInput === moment.id
                            ? 'bg-indigo-50 text-indigo-500 shadow-sm'
                            : 'bg-white/50 text-slate-400 hover:bg-white/80'
                            }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 点赞和评论区域 */}
                {(moment.likes.length > 0 || moment.comments.length > 0) && (
                  <div className="mt-4 ml-[64px] bg-white/30 rounded-[20px] p-4 space-y-3 border border-white/40">
                    {/* 点赞列表 */}
                    {moment.likes.length > 0 && (
                      <div className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 text-red-400 fill-current mt-1" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 text-xs leading-relaxed text-slate-600 font-light">
                          {moment.likes.map((like, i) => (
                            <span key={like.userId}>
                              {i > 0 && ', '}
                              <span className="font-medium text-slate-700">{like.userName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {moment.likes.length > 0 && moment.comments.length > 0 && (
                      <div className="border-t border-white/30" />
                    )}

                    {/* 评论列表 */}
                    {moment.comments.length > 0 && (
                      <div className="space-y-2">
                        {moment.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="text-xs leading-relaxed cursor-pointer hover:bg-white/40 -mx-2 px-2 py-1 rounded-lg transition-colors"
                            onClick={() => handleReplyComment(moment.id, comment.userName)}
                          >
                            <span className="text-slate-700 font-medium">{comment.userName}</span>
                            {comment.replyTo && (
                              <>
                                <span className="text-slate-400 mx-1">回复</span>
                                <span className="text-slate-700 font-medium">{comment.replyTo}</span>
                              </>
                            )}
                            <span className="text-slate-500 font-light ml-1">
                              <EmojiContentRenderer content={comment.content} emojiSize={16} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 评论输入框 */}
                {showCommentInput === moment.id && (
                  <div className="mt-4 ml-[64px] animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-2 flex items-center gap-2 border border-white/50 shadow-sm">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={replyTo ? `回复 ${replyTo}` : "写下你的想法..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 px-3 font-light"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentSubmit(moment.id)
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleCommentSubmit(moment.id)}
                        disabled={!commentText.trim()}
                        className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-xs font-medium active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )
          })()}
        </div>
      </div>

      {/* 圈子弹窗 */}
      {showCircleManager && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCircleManager(false)}
          />
          <div className="relative w-full max-h-[70vh] bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingGroup ? '编辑圈子' : '选择圈子'}
                </h3>
                <button
                  onClick={() => {
                    setShowCircleManager(false)
                    setEditingGroup(null)
                    setNewGroupName('')
                    setNewGroupMembers([])
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">选择圈子筛选朋友圈，只看圈子内成员的动态</p>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-4 space-y-3">
              {/* 选择圈子区域 */}
              {!editingGroup && (
                <div className="space-y-2">
                  {/* 全部（取消筛选） */}
                  <button
                    onClick={() => {
                      handleSelectCircle('')
                      setShowCircleManager(false)
                    }}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${!selectedCircleId
                        ? 'bg-slate-800 text-white shadow-md transform scale-[1.02]'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="text-sm font-semibold">全部朋友圈</div>
                      <div className={`text-xs ${!selectedCircleId ? 'text-slate-300' : 'text-slate-400'}`}>查看所有人的动态</div>
                    </div>
                    {!selectedCircleId && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="h-px bg-slate-100 my-2" />

                  {/* 圈子列表 */}
                  {groups.map(group => (
                    <div 
                      key={group.id}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all group ${selectedCircleId === group.id
                          ? 'bg-slate-800 text-white shadow-md transform scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border border-slate-100'
                        }`}
                    >
                      <button
                        onClick={() => {
                          handleSelectCircle(group.id)
                          setShowCircleManager(false)
                        }}
                        className="flex-1 flex flex-col items-start gap-0.5 min-w-0"
                      >
                        <div className={`text-sm font-semibold ${selectedCircleId === group.id ? 'text-white' : 'text-slate-700'}`}>
                          {group.name}
                        </div>
                        <div className={`text-xs truncate w-full text-left ${selectedCircleId === group.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {group.characterIds.map(id => {
                            const char = allCharacters.find(c => c.id === id)
                            return char?.realName || id
                          }).join('、')}
                        </div>
                      </button>

                      <div className="flex items-center gap-3 pl-3">
                        {selectedCircleId === group.id && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-l border-slate-100 pl-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingGroup(group)
                              setNewGroupName(group.name)
                              setNewGroupMembers([...group.characterIds])
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${selectedCircleId === group.id 
                              ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`删除圈子"${group.name}"？`)) {
                                deleteMomentsGroup(group.id)
                                setGroups(loadMomentsGroups())
                                if (selectedCircleId === group.id) handleSelectCircle('')
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${selectedCircleId === group.id 
                              ? 'text-slate-300 hover:text-red-300 hover:bg-slate-700' 
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 新建圈子入口 */}
                  <button
                    onClick={() => {
                      setEditingGroup({ id: 'new', name: '', characterIds: [], createdAt: 0 })
                      setNewGroupName('')
                      setNewGroupMembers([])
                    }}
                    className="w-full p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-all mt-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">新建圈子</span>
                  </button>
                </div>
              )}

              {/* 编辑/创建圈子表单 */}
              {editingGroup && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="圈子名称"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    autoFocus
                  />
                  <div className="text-xs text-slate-400">选择成员</div>
                  <div className="flex flex-wrap gap-2">
                    {allCharacters.map(char => (
                      <button
                        key={char.id}
                        onClick={() => {
                          if (newGroupMembers.includes(char.id)) {
                            setNewGroupMembers(prev => prev.filter(id => id !== char.id))
                          } else {
                            setNewGroupMembers(prev => [...prev, char.id])
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${newGroupMembers.includes(char.id)
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                          }`}
                      >
                        {char.realName}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingGroup(null)
                        setNewGroupName('')
                        setNewGroupMembers([])
                      }}
                      className="flex-1 py-2.5 text-sm text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (!newGroupName.trim()) return alert('请输入圈子名称')
                        if (newGroupMembers.length === 0) return alert('请选择成员')
                        
                        if (editingGroup.id === 'new') {
                          createMomentsGroup(newGroupName.trim(), newGroupMembers, getNextGroupColor())
                        } else {
                          updateMomentsGroup(editingGroup.id, { name: newGroupName.trim(), characterIds: newGroupMembers })
                        }
                        
                        setGroups(loadMomentsGroups())
                        setEditingGroup(null)
                        setNewGroupName('')
                        setNewGroupMembers([])
                      }}
                      className="flex-1 py-2.5 text-sm text-white bg-slate-800 rounded-xl active:scale-95 hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
