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

export default function PublishMoment() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<MomentImage[]>([])
  const [location, setLocation] = useState('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showMentionSelect, setShowMentionSelect] = useState(false)
  const [mentions, setMentions] = useState<string[]>([])
  const [showPrivacySelect, setShowPrivacySelect] = useState(false)
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'selected'>('public')  // public=公开, private=仅自己, selected=部分可见
  const [visibleTo, setVisibleTo] = useState<string[]>([])  // 可见的人ID列表
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

  const handlePublish = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或选择图片')
      return
    }

    try {
      const newMoment = await publishMoment(
        currentUser,
        content.trim(),
        images,
        location.trim() || undefined,
        mentions.length > 0 ? mentions : undefined,
        privacy,
        visibleTo.length > 0 ? visibleTo : undefined
      )

      const momentText = content.trim() || '[纯图片]'
      const imagesText = images.length > 0 ? ` [${images.length}张图]` : ''
      const locationText = location.trim() ? ` 📍${location.trim()}` : ''
      const mentionsText = mentions.length > 0 ? ` @${mentions.join(' @')}` : ''

      allCharacters.forEach(char => {
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

            {/* 隐私设置 */}
            {showPrivacySelect && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <div className="text-xs text-slate-400 mb-3 font-medium tracking-widest uppercase">谁可以看</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => { setPrivacy('public'); setVisibleTo([]) }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${privacy === 'public'
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40'
                      }`}
                  >
                    🌐 公开
                  </button>
                  <button
                    onClick={() => setPrivacy('selected')}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${privacy === 'selected'
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40'
                      }`}
                  >
                    👥 部分可见
                  </button>
                  <button
                    onClick={() => { setPrivacy('private'); setVisibleTo([]) }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${privacy === 'private'
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40'
                      }`}
                  >
                    🔒 仅自己
                  </button>
                </div>
                {/* 部分可见时选择可见的人 */}
                {privacy === 'selected' && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-2">选择可见的人</div>
                    <div className="flex flex-wrap gap-2">
                      {allCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => {
                            if (visibleTo.includes(char.id)) {
                              setVisibleTo(prev => prev.filter(id => id !== char.id))
                            } else {
                              setVisibleTo(prev => [...prev, char.id])
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${visibleTo.includes(char.id)
                              ? 'bg-green-500 text-white shadow-md'
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
                    {visibleTo.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        已选 {visibleTo.length} 人可见
                      </div>
                    )}
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

          <button
            onClick={() => setShowPrivacySelect(!showPrivacySelect)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border shadow-sm active:scale-95 flex-shrink-0 ${showPrivacySelect || privacy !== 'public'
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/50 text-slate-600 hover:bg-white/80 border-white/40'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{privacy === 'public' ? '公开' : privacy === 'private' ? '仅自己' : '部分可见'}</span>
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
