/**
 * 发布朋友圈页面 - 文艺/高级/玻璃态风格
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { publishMoment } from '../utils/momentsManager'
import { triggerAIMomentsInteraction } from '../utils/momentsAI'
import { getUserInfo } from '../utils/userUtils'
import type { MomentImage } from '../types/moments'
import { characterService } from '../services/characterService'
import { compressAndConvertToBase64 } from '../utils/imageUtils'
import { loadMessages, saveMessages } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'
import { loadMomentsGroups, type MomentsGroup } from '../utils/momentsGroupManager'

export default function PublishMoment() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<MomentImage[]>([])
  const [location, setLocation] = useState('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showMentionSelect, setShowMentionSelect] = useState(false)
  const [mentions, setMentions] = useState<string[]>([])
  // 从localStorage读取预选的圈子ID
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    // 优先读取专门传过来的ID（如果有的话）
    const savedForPublish = localStorage.getItem('publish_moment_circle_id')
    if (savedForPublish) {
      localStorage.removeItem('publish_moment_circle_id')  // 读取后清除
      return savedForPublish
    }
    // 否则读取当前全局选中的圈子
    return localStorage.getItem('moments_selected_circle') || ''
  })
  const [groups, setGroups] = useState<MomentsGroup[]>(loadMomentsGroups())
  const [showGroupSelect, setShowGroupSelect] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allCharacters = characterService.getAll()
  const userInfo = getUserInfo()
  const currentUser = {
    id: 'user',
    name: userInfo.nickname || userInfo.realName,
    avatar: userInfo.avatar || '👤'
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (images.length + files.length > 9) {
      alert('最多只能选择9张图片')
      return
    }

    Array.from(files).forEach(async (file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }

      try {
        const base64 = await compressAndConvertToBase64(file)
        const url = `data:image/jpeg;base64,${base64}`
        setImages(prev => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            url
          }
        ])
      } catch (error) {
        console.error('压缩图片失败:', error)
        alert('图片处理失败，请重试')
      }
    })
  }

  const handleDeleteImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  // 圈子选择处理
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId)
    // 同步更新朋友圈的圈子选择状态，这样返回后能看到发布的动态
    if (groupId) {
      localStorage.setItem('moments_selected_circle', groupId)
    } else {
      localStorage.removeItem('moments_selected_circle')
    }
    setShowGroupSelect(false)
  }

  const handlePublish = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或选择图片')
      return
    }

    try {
      // 简化：选了圈子就只对圈子里的人可见，没选就公开
      let finalVisibleTo: string[] = []
      let finalGroupId: string | undefined = undefined
      let finalPrivacy: 'public' | 'private' | 'selected' | 'group' = 'public'
      
      if (selectedGroupId) {
        const group = groups.find(g => g.id === selectedGroupId)
        if (group) {
          finalVisibleTo = group.characterIds
          finalGroupId = selectedGroupId
          finalPrivacy = 'group'
        }
      }
      
      const newMoment = await publishMoment(
        currentUser,
        content.trim(),
        images,
        location.trim() || undefined,
        mentions.length > 0 ? mentions : undefined,
        finalPrivacy,
        finalVisibleTo.length > 0 ? finalVisibleTo : undefined,
        finalGroupId
      )

      const momentText = content.trim() || '[纯图片]'
      const imagesText = images.length > 0 ? ` [${images.length}张图]` : ''
      const locationText = location.trim() ? ` 📍${location.trim()}` : ''
      const mentionsText = mentions.length > 0 ? ` @${mentions.join(' @')}` : ''

      // 只通知可见的角色
      const visibleCharacters = finalVisibleTo.length > 0
        ? allCharacters.filter(c => finalVisibleTo.includes(c.id))
        : allCharacters
      
      visibleCharacters.forEach(char => {
        const chatId = char.id
        const messages = loadMessages(chatId)
        const momentMsg: Message = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: `【用户发朋友圈】${momentText}${imagesText}${locationText}${mentionsText}`,
          aiOnly: true,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
        messages.push(momentMsg)
        saveMessages(chatId, messages)
      })
      
      console.log(`📱 朋友圈可见范围: ${finalVisibleTo.length > 0 ? `${visibleCharacters.length}人` : '所有人'}`)

      triggerAIMomentsInteraction(newMoment)
      navigate('/moments')
    } catch (error) {
      console.error('发布朋友圈失败:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">
      {/* 状态栏 */}
      <StatusBar />

      {/* 头部 */}
      <div className="relative z-10 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/moments')}
          className="text-slate-500 hover:text-slate-700 transition-colors text-sm font-light tracking-wide"
        >
          取消
        </button>
        <h1 className="text-lg font-medium text-slate-800 tracking-wide">
          发布动态
        </h1>
        <button
          onClick={handlePublish}
          className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-medium active:scale-95 transition-all hover:bg-slate-700 shadow-sm"
        >
          发表
        </button>
      </div>

      {/* 内容输入区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm min-h-[400px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享这一刻的想法..."
            className="w-full min-h-[150px] bg-transparent border-none focus:outline-none resize-none text-slate-700 placeholder-slate-400 text-base font-light leading-relaxed tracking-wide"
            autoFocus
          />

          {/* 图片预览 */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {images.map((image) => (
              <div key={image.id} className="relative aspect-square group">
                <img
                  src={image.url}
                  alt="预览"
                  className="w-full h-full object-cover rounded-[20px] shadow-sm"
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[20px] border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white/30 hover:bg-white/50 transition-all flex items-center justify-center text-slate-400"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* 附加选项 */}
          <div className="mt-8 space-y-4">
            {/* 位置输入 */}
            {showLocationInput && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 bg-white/50 rounded-2xl px-4 py-3 border border-white/40">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="所在位置"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* @提到人 */}
            {showMentionSelect && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <div className="text-xs text-slate-400 mb-3 font-medium tracking-widest uppercase">提到谁</div>
                <div className="flex flex-wrap gap-2">
                  {allCharacters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        const name = char.realName
                        if (mentions.includes(name)) {
                          setMentions(prev => prev.filter(m => m !== name))
                        } else {
                          setMentions(prev => [...prev, name])
                        }
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${mentions.includes(char.realName)
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40'
                        }`}
                    >
                      {char.avatar?.startsWith('data:') || char.avatar?.startsWith('http') ? (
                        <img src={char.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span>{char.avatar || '👤'}</span>
                      )}
                      {char.realName}
                    </button>
                  ))}
                </div>
                {mentions.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500 font-medium">
                    已选择: @{mentions.join(' @')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="bg-white/60 backdrop-blur-xl border-t border-white/50 p-4 pb-8">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/50 hover:bg-white/80 rounded-full text-slate-600 transition-all border border-white/40 shadow-sm active:scale-95 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">图片</span>
          </button>

          {/* 圈子按钮 */}
          <button
            onClick={() => {
              setGroups(loadMomentsGroups())
              setShowGroupSelect(true)
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border shadow-sm active:scale-95 flex-shrink-0 ${selectedGroupId
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white/50 text-slate-600 hover:bg-white/80 border-white/40'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name || '圈子' : '圈子'}</span>
          </button>

          <button
            onClick={() => setShowLocationInput(!showLocationInput)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border shadow-sm active:scale-95 flex-shrink-0 ${showLocationInput
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/50 text-slate-600 hover:bg-white/80 border-white/40'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>位置</span>
          </button>

          <button
            onClick={() => setShowMentionSelect(!showMentionSelect)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border shadow-sm active:scale-95 flex-shrink-0 ${showMentionSelect || mentions.length > 0
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/50 text-slate-600 hover:bg-white/80 border-white/40'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <span>提醒</span>
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

      {/* 圈子选择弹窗 */}
      {showGroupSelect && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowGroupSelect(false)}
          />
          <div className="relative w-full max-h-[60vh] bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">选择圈子</h3>
                <button
                  onClick={() => setShowGroupSelect(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">选择后只有圈子里的人能看到这条朋友圈</p>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(60vh-80px)] p-4 space-y-2">
              <div className="space-y-2">
                {/* 公开选项 */}
                <button
                  onClick={() => handleGroupSelect('')}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${!selectedGroupId
                      ? 'bg-slate-800 text-white shadow-md transform scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                    }`}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="text-sm font-semibold">公开</div>
                    <div className={`text-xs ${!selectedGroupId ? 'text-slate-300' : 'text-slate-400'}`}>所有人可见</div>
                  </div>
                  {!selectedGroupId && (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="h-px bg-slate-100 my-2" />

                {/* 圈子列表 */}
                {groups.length > 0 ? (
                  groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${selectedGroupId === group.id
                          ? 'bg-slate-800 text-white shadow-md transform scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border border-slate-100'
                        }`}
                    >
                      <div className="flex-1 flex flex-col items-start gap-0.5 min-w-0">
                        <div className={`text-sm font-semibold ${selectedGroupId === group.id ? 'text-white' : 'text-slate-700'}`}>
                          {group.name}
                        </div>
                        <div className={`text-xs truncate w-full text-left ${selectedGroupId === group.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {group.characterIds.map(id => {
                            const char = allCharacters.find(c => c.id === id)
                            return char?.realName || id
                          }).join('、')}
                        </div>
                      </div>
                      {selectedGroupId === group.id && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">暂无圈子</p>
                    <p className="text-xs mt-1">请先在朋友圈页面创建圈子</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
