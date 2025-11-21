/**
 * 背景设置页面
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { getBackground, saveBackground, deleteBackground, migrateFromLocalStorage } from '../utils/backgroundStorage'
import { saveImage, getImage, deleteFromIndexedDB } from '../utils/unifiedStorage'

const BackgroundCustomizer = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  // 背景状态
  const [desktopBg, setDesktopBg] = useState('')
  const [musicBg, setMusicBg] = useState('')
  const [wechatBg, setWechatBg] = useState('')
  const [memoBg, setMemoBg] = useState('')
  
  // 加载背景
  useEffect(() => {
    const loadBackgrounds = async () => {
      // 先尝试迁移localStorage旧数据
      await migrateFromLocalStorage()
      
      // 加载所有背景
      const savedDesktopBg = await getImage('desktop_bg')
      const savedMusicBg = await getImage('music_bg')
      const savedWechatBg = await getImage('wechat_bg')
      const memo = await getBackground('memo')
      
      if (savedDesktopBg) setDesktopBg(savedDesktopBg)
      if (savedMusicBg) setMusicBg(savedMusicBg)
      if (savedWechatBg) setWechatBg(savedWechatBg)
      if (memo) setMemoBg(memo)
    }
    
    loadBackgrounds()
  }, [])
  
  const [desktopUploading, setDesktopUploading] = useState(false)
  const [musicUploading, setMusicUploading] = useState(false)
  const [wechatUploading, setWechatUploading] = useState(false)
  const [memoUploading, setMemoUploading] = useState(false)
  
  const desktopFileRef = useRef<HTMLInputElement>(null)
  const musicFileRef = useRef<HTMLInputElement>(null)
  const wechatFileRef = useRef<HTMLInputElement>(null)
  const memoFileRef = useRef<HTMLInputElement>(null)

  // 上传桌面背景
  const handleDesktopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setDesktopUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64String = reader.result as string
      setDesktopBg(base64String)
      await saveImage('desktop_bg', base64String)
      setDesktopUploading(false)
      
      // 立即应用
      const desktopEl = document.querySelector('.desktop-background') as HTMLElement
      if (desktopEl) {
        desktopEl.style.backgroundImage = `url(${base64String})`
      }
      
      window.dispatchEvent(new Event('desktopBackgroundUpdate'))
      console.log('✅ 桌面背景已保存')
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setDesktopUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 上传音乐背景
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setMusicUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64String = reader.result as string
      setMusicBg(base64String)
      await saveImage('music_bg', base64String)
      setMusicUploading(false)
      window.dispatchEvent(new Event('musicBackgroundUpdate'))
      console.log('✅ 音乐背景已保存到IndexedDB')
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setMusicUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 删除桌面背景
  const handleRemoveDesktop = async () => {
    if (confirm('确定要删除桌面背景吗？')) {
      setDesktopBg('')
      await deleteFromIndexedDB('IMAGES', 'desktop_bg')
      
      const desktopEl = document.querySelector('.desktop-background') as HTMLElement
      if (desktopEl) {
        desktopEl.style.backgroundImage = ''
      }
      
      window.dispatchEvent(new Event('desktopBackgroundUpdate'))
      console.log('✅ 桌面背景已从 IndexedDB 删除')
    }
  }

  // 删除音乐背景
  const handleRemoveMusic = async () => {
    if (confirm('确定要删除音乐背景吗？')) {
      setMusicBg('')
      await deleteFromIndexedDB('IMAGES', 'music_bg')
      window.dispatchEvent(new Event('musicBackgroundUpdate'))
      console.log('✅ 音乐背景已从 IndexedDB 删除')
    }
  }

  // 上传微信背景
  const handleWechatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📤 开始上传微信背景:', file.name)

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setWechatUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64String = reader.result as string
      console.log('📊 图片读取完成，大小:', Math.round(base64String.length / 1024), 'KB')
      
      setWechatBg(base64String)
      console.log('📝 状态已更新')
      
      await saveImage('wechat_bg', base64String)
      console.log('💾 已保存到 IndexedDB')
      
      setWechatUploading(false)
      window.dispatchEvent(new Event('wechatBackgroundUpdate'))
      console.log('✅ 微信背景上传完成！事件已触发')
    }
    reader.onerror = () => {
      console.error('❌ 图片读取失败')
      alert('图片读取失败')
      setWechatUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 删除微信背景
  const handleRemoveWechat = async () => {
    if (confirm('确定要删除微信背景吗？')) {
      setWechatBg('')
      await deleteFromIndexedDB('IMAGES', 'wechat_bg')
      window.dispatchEvent(new Event('wechatBackgroundUpdate'))
      console.log('✅ 微信背景已从 IndexedDB 删除')
    }
  }

  // 上传备忘录背景
  const handleMemoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setMemoUploading(true)

    try {
      const url = await saveBackground('memo', file)
      setMemoBg(url)
      window.dispatchEvent(new Event('memoBackgroundUpdate'))
      console.log('✅ 备忘录背景已保存到IndexedDB')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setMemoUploading(false)
    }
  }

  // 删除备忘录背景
  const handleRemoveMemo = async () => {
    if (confirm('确定要删除备忘录背景吗？')) {
      try {
        await deleteBackground('memo')
        setMemoBg('')
        window.dispatchEvent(new Event('memoBackgroundUpdate'))
        console.log('✅ 备忘录背景已删除')
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={desktopFileRef}
        type="file"
        accept="image/*"
        onChange={handleDesktopUpload}
        className="hidden"
      />
      <input
        ref={musicFileRef}
        type="file"
        accept="image/*"
        onChange={handleMusicUpload}
        className="hidden"
      />
      <input
        ref={wechatFileRef}
        type="file"
        accept="image/*"
        onChange={handleWechatUpload}
        className="hidden"
      />
      <input
        ref={memoFileRef}
        type="file"
        accept="image/*"
        onChange={handleMemoUpload}
        className="hidden"
      />
      
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            背景设置
          </h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 背景设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 桌面背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">桌面背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置Desktop页面的整体背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: desktopBg ? `url(${desktopBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: desktopBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!desktopBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => desktopFileRef.current?.click()}
                  disabled={desktopUploading}
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {desktopUploading ? '上传中...' : desktopBg ? '更换背景' : '上传背景'}
                </button>
                {desktopBg && (
                  <button
                    onClick={handleRemoveDesktop}
                    className="w-full px-4 py-2.5 bg-red-500 text-white rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 音乐背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">音乐背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置音乐播放器的背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: musicBg ? `url(${musicBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: musicBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!musicBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => musicFileRef.current?.click()}
                  disabled={musicUploading}
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {musicUploading ? '上传中...' : musicBg ? '更换背景' : '上传背景'}
                </button>
                {musicBg && (
                  <button
                    onClick={handleRemoveMusic}
                    className="w-full px-4 py-2.5 bg-red-500 text-white rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 微信背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">微信背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置微信、通讯录、发现、我 这四个页面的背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: wechatBg ? `url(${wechatBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: wechatBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!wechatBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => wechatFileRef.current?.click()}
                  disabled={wechatUploading}
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {wechatUploading ? '上传中...' : wechatBg ? '更换背景' : '上传背景'}
                </button>
                {wechatBg && (
                  <button
                    onClick={handleRemoveWechat}
                    className="w-full px-4 py-2.5 bg-red-500 text-white rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 备忘录背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">备忘录背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置AI备忘录页面的背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: memoBg ? `url(${memoBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: memoBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!memoBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => memoFileRef.current?.click()}
                  disabled={memoUploading}
                  className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {memoUploading ? '上传中...' : memoBg ? '更换背景' : '上传背景'}
                </button>
                {memoBg && (
                  <button
                    onClick={handleRemoveMemo}
                    className="w-full px-4 py-2.5 bg-red-500 text-white rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">使用说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 桌面背景会显示在Desktop页面的整体背景</li>
            <li>• 音乐背景会显示在音乐播放器卡片内</li>
            <li>• 微信背景会显示在微信、通讯录、发现、我 四个页面</li>
            <li>• 备忘录背景会显示在AI备忘录页面</li>
            <li>• 建议使用高质量图片，效果更佳</li>
            <li>• 图片会保存在本地存储中</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BackgroundCustomizer
