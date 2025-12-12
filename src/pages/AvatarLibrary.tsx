/**
 * 头像库页面 - Redesigned
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { compressAndConvertToBase64 } from '../utils/imageUtils'
import {
  getDescriptionAvatars,
  addAvatarWithDescription,
  getTags,
  createTag,
  deleteTag,
  getAvatarsByTag,
  addAvatarToTag,
  deleteAvatar,
  getAvatarLibraryMode,
  setAvatarLibraryMode,
  type AvatarItem,
  type AvatarTag,
  type AvatarLibraryMode
} from '../utils/avatarLibraryService'

type ViewMode = 'description' | 'tag'

const AvatarLibrary = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('description')
  const [aiMode, setAiMode] = useState<AvatarLibraryMode>(getAvatarLibraryMode())
  const [descAvatars, setDescAvatars] = useState<AvatarItem[]>([])
  const [tags, setTags] = useState<AvatarTag[]>([])
  const [selectedTag, setSelectedTag] = useState<AvatarTag | null>(null)
  const [tagAvatars, setTagAvatars] = useState<AvatarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const [showAddDesc, setShowAddDesc] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'avatar' | 'tag', id: string, name?: string} | null>(null)

  // 滚动状态用于头部样式
  const [scrolled, setScrolled] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedTag) loadTagAvatars(selectedTag.id) }, [selectedTag])

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setScrolled(contentRef.current.scrollTop > 10)
      }
    }
    const ref = contentRef.current
    ref?.addEventListener('scroll', handleScroll)
    return () => ref?.removeEventListener('scroll', handleScroll)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [avatars, tagList] = await Promise.all([getDescriptionAvatars(), getTags()])
      setDescAvatars(avatars)
      setTags(tagList)
    } finally { setLoading(false) }
  }

  const loadTagAvatars = async (tagId: string) => {
    const avatars = await getAvatarsByTag(tagId)
    setTagAvatars(avatars)
  }

  const handleDescUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressAndConvertToBase64(file, 512, 512, 0.8)
      setPendingImage(`data:image/jpeg;base64,${base64}`)
      setShowAddDesc(true)
    } catch { alert('图片处理失败') }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmAddDesc = async () => {
    if (!pendingImage || !newDesc.trim()) return
    setUploading(true)
    try {
      await addAvatarWithDescription(pendingImage, newDesc.trim())
      await loadData()
      setShowAddDesc(false)
      setPendingImage(null)
      setNewDesc('')
    } finally { setUploading(false) }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      await createTag(newTagName.trim())
      await loadData()
      setShowAddTag(false)
      setNewTagName('')
    } catch { alert('标签已存在') }
  }

  const handleTagUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTag) return
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        try {
          const base64 = await compressAndConvertToBase64(file, 512, 512, 0.8)
          await addAvatarToTag(`data:image/jpeg;base64,${base64}`, selectedTag.id)
        } catch (err) { console.error('上传失败:', err) }
      }
      await loadTagAvatars(selectedTag.id)
    } finally {
      setUploading(false)
      if (multiFileInputRef.current) multiFileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'avatar') {
      await deleteAvatar(deleteConfirm.id)
      if (viewMode === 'description') await loadData()
      else if (selectedTag) await loadTagAvatars(selectedTag.id)
    } else {
      await deleteTag(deleteConfirm.id)
      setSelectedTag(null)
      setTagAvatars([])
      await loadData()
    }
    setDeleteConfirm(null)
  }

  const handleAiModeChange = (newMode: AvatarLibraryMode) => {
    setAiMode(newMode)
    setAvatarLibraryMode(newMode)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      <StatusBar />

      {/* 顶部导航栏 */}
      <div className={`z-20 px-4 py-3 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <button 
          onClick={() => {
            if (selectedTag) {
              setSelectedTag(null)
            } else {
              navigate(-1)
            }
          }} 
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-200 transition-colors"
        >
          <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-bold text-slate-800">
          {selectedTag ? selectedTag.name : '头像库'}
        </h1>

        <div className="relative">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)} 
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-200 transition-colors text-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden origin-top-right transform transition-all">
                {selectedTag ? (
                  <button onClick={() => { setShowAddMenu(false); multiFileInputRef.current?.click() }} className="w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </span>
                    批量上传头像
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setShowAddMenu(false); fileInputRef.current?.click() }} className="w-full px-5 py-3.5 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 border-b border-slate-100">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </span>
                      添加描述头像
                    </button>
                    <button onClick={() => { setShowAddMenu(false); setShowAddTag(true) }} className="w-full px-5 py-3.5 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                      <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      </span>
                      新建标签分类
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleDescUpload} className="hidden" />
      <input ref={multiFileInputRef} type="file" accept="image/*" multiple onChange={handleTagUpload} className="hidden" />

      {/* 主要内容区 */}
      <div ref={contentRef} className="flex-1 overflow-y-auto pb-24 px-4 scrollbar-hide">
        
        {!selectedTag && (
          <>
            {/* 模式切换 */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-6 flex">
              <button 
                onClick={() => setViewMode('description')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  viewMode === 'description' 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                描述匹配
              </button>
              <button 
                onClick={() => setViewMode('tag')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  viewMode === 'tag' 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                标签随机
              </button>
            </div>

            {/* AI优先模式提示 */}
            <div className="mb-6 flex items-center justify-between px-2">
              <div className="text-xs text-slate-500 font-medium">
                当前AI优先使用：
                <span className="text-slate-800 ml-1 font-bold">
                  {aiMode === 'description' ? '描述匹配模式' : '标签随机模式'}
                </span>
              </div>
              {viewMode !== aiMode && (
                <button 
                  onClick={() => handleAiModeChange(viewMode)}
                  className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold active:scale-95 transition-transform"
                >
                  设为优先
                </button>
              )}
            </div>
          </>
        )}

        {/* 列表内容 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">加载中...</p>
          </div>
        ) : (
          <>
            {viewMode === 'description' ? (
              descAvatars.length === 0 ? (
                <EmptyState 
                  icon={
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  text="暂无描述头像"
                  subText="点击右上角添加，让AI根据描述更换头像"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {descAvatars.map((avatar) => (
                    <div key={avatar.id} className="group relative bg-white rounded-2xl p-2 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                        <img src={avatar.imageData} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <button 
                          onClick={() => setDeleteConfirm({type: 'avatar', id: avatar.id})} 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div className="px-2 py-3">
                        <p className="text-sm font-medium text-slate-800 truncate">{avatar.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : !selectedTag ? (
              tags.length === 0 ? (
                <EmptyState 
                  icon={
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  }
                  text="暂无标签分类"
                  subText="创建标签，让AI在该标签内随机选择头像"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {tags.map((tag) => (
                    <div 
                      key={tag.id} 
                      onClick={() => setSelectedTag(tag)} 
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-95 transition-all duration-300 flex flex-col justify-between h-32 group hover:shadow-md hover:border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({type: 'tag', id: tag.id, name: tag.name}) }} 
                          className="w-8 h-8 -mr-2 -mt-2 rounded-full text-slate-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-0.5">{tag.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">点击查看详情</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // 标签详情视图
              <div>
                <div className="flex items-center justify-between mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedTag.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {tagAvatars.length} 张头像 · 随机使用
                    </p>
                  </div>
                  <button onClick={() => multiFileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all">
                    {uploading ? '上传中...' : '上传头像'}
                  </button>
                </div>

                {tagAvatars.length === 0 ? (
                  <EmptyState 
                    icon={
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    text="该标签暂无头像"
                    subText="上传一些图片作为此场景的备选头像"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {tagAvatars.map((avatar) => (
                      <div key={avatar.id} className="group relative rounded-2xl overflow-hidden shadow-sm bg-white aspect-square">
                        <img src={avatar.imageData} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setDeleteConfirm({type: 'avatar', id: avatar.id})}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>


      {/* Modals - redesigned */}
      {showAddDesc && (
        <Modal 
          title="添加描述头像" 
          onClose={() => { setShowAddDesc(false); setPendingImage(null); setNewDesc('') }}
        >
          {pendingImage && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-6 shadow-lg border-2 border-white">
              <img src={pendingImage} className="w-full h-full object-cover" />
            </div>
          )}
          <input 
            value={newDesc} 
            onChange={e => setNewDesc(e.target.value)} 
            placeholder="输入触发描述 (如: 开心, 生气, 睡觉)" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-800/20 mb-6 transition-all" 
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setShowAddDesc(false); setPendingImage(null); setNewDesc('') }}>
              取消
            </Button>
            <Button variant="primary" onClick={confirmAddDesc} disabled={uploading || !newDesc.trim()}>
              {uploading ? '保存中...' : '保存'}
            </Button>
          </div>
        </Modal>
      )}

      {showAddTag && (
        <Modal 
          title="创建新标签" 
          onClose={() => { setShowAddTag(false); setNewTagName('') }}
        >
          <input 
            value={newTagName} 
            onChange={e => setNewTagName(e.target.value)} 
            placeholder="输入标签名称 (如: 日常, 工作, 度假)" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-800/20 mb-6 transition-all" 
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setShowAddTag(false); setNewTagName('') }}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateTag} disabled={!newTagName.trim()}>
              创建
            </Button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal 
          title="确认删除" 
          onClose={() => setDeleteConfirm(null)}
        >
          <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed">
            {deleteConfirm.type === 'tag' 
              ? `确定要删除标签 "${deleteConfirm.name}" 吗？\n该标签下的所有头像也会被一并删除。` 
              : '确定要删除这张头像吗？此操作无法撤销。'}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// 辅助组件
const EmptyState = ({ icon, text, subText }: { icon: React.ReactNode, text: string, subText: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
      {icon}
    </div>
    <h3 className="text-slate-800 font-semibold mb-1">{text}</h3>
    <p className="text-slate-400 text-xs">{subText}</p>
  </div>
)

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
      <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">{title}</h3>
      {children}
    </div>
  </div>
)

const Button = ({ children, onClick, variant = 'primary', disabled = false }: { children: React.ReactNode, onClick: () => void, variant?: 'primary' | 'secondary' | 'danger', disabled?: boolean }) => {
  const baseStyles = "flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
  const variants = {
    primary: "bg-slate-800 text-white shadow-lg shadow-slate-200 hover:bg-slate-700",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    danger: "bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600"
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </button>
  )
}

export default AvatarLibrary
