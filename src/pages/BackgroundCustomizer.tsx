/**
 * 背景设置页面
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { migrateFromLocalStorage } from '../utils/backgroundStorage'
import { saveImage, getImage, deleteFromIndexedDB, saveToIndexedDB } from '../utils/unifiedStorage'
import { saveUIIcon, getUIIcon, deleteUIIcon } from '../utils/iconStorage'

const BackgroundCustomizer = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  // 背景状态
  const [globalBg, setGlobalBg] = useState('')
  const [globalTopbar, setGlobalTopbar] = useState('')
  const [functionBg, setFunctionBg] = useState('')
  const [desktopBg, setDesktopBg] = useState('')
  const [musicBg, setMusicBg] = useState('')
  const [wechatBg, setWechatBg] = useState('')
  const [memoBg, setMemoBg] = useState('')
  const [bubble1Bg, setBubble1Bg] = useState('')
  const [bubble2Bg, setBubble2Bg] = useState('')
  
  // 加载背景
  useEffect(() => {
    const loadBackgrounds = async () => {
      // 先尝试迁移localStorage旧数据
      await migrateFromLocalStorage()
      
      // 加载全局背景
      const savedGlobalBg = await getUIIcon('global-background')
      const savedGlobalTopbar = await getUIIcon('global-topbar')
      
      // 加载所有背景
      const savedFunctionBg = await getImage('function_bg')
      const savedDesktopBg = await getImage('desktop_bg')
      const savedMusicBg = await getImage('music_bg')
      const savedWechatBg = await getImage('wechat_bg')
      const memo = await getImage('memo_bg')
      const bubble1 = await getImage('desktop_bubble1_bg')
      const bubble2 = await getImage('desktop_bubble2_bg')
      
      if (savedGlobalBg) setGlobalBg(savedGlobalBg)
      if (savedGlobalTopbar) setGlobalTopbar(savedGlobalTopbar)
      if (savedFunctionBg) setFunctionBg(savedFunctionBg)
      if (savedDesktopBg) setDesktopBg(savedDesktopBg)
      if (savedMusicBg) setMusicBg(savedMusicBg)
      if (savedWechatBg) setWechatBg(savedWechatBg)
      if (memo) setMemoBg(memo)
      if (bubble1) setBubble1Bg(bubble1)
      if (bubble2) setBubble2Bg(bubble2)
    }
    
    loadBackgrounds()
  }, [])
  
  const [desktopUploading, setDesktopUploading] = useState(false)
  const [musicUploading, setMusicUploading] = useState(false)
  const [wechatUploading, setWechatUploading] = useState(false)
  const [memoUploading, setMemoUploading] = useState(false)
  const [bubble1Uploading, setBubble1Uploading] = useState(false)
  const [bubble2Uploading, setBubble2Uploading] = useState(false)
  
  const desktopFileRef = useRef<HTMLInputElement>(null)
  const musicFileRef = useRef<HTMLInputElement>(null)
  const wechatFileRef = useRef<HTMLInputElement>(null)
  const memoFileRef = useRef<HTMLInputElement>(null)
  const bubble1FileRef = useRef<HTMLInputElement>(null)
  const bubble2FileRef = useRef<HTMLInputElement>(null)

  // 上传桌面背景
  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setDesktopUploading(true)

    try {
      // 🔥 使用压缩功能（1920x1080，质量0.75）
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.75)
      const base64String = `data:image/jpeg;base64,${base64}`
      
      setDesktopBg(base64String)
      await saveImage('desktop_bg', base64String)
      
      // 立即应用
      const desktopEl = document.querySelector('.desktop-background') as HTMLElement
      if (desktopEl) {
        desktopEl.style.backgroundImage = `url(${base64String})`
      }
      
      window.dispatchEvent(new Event('desktopBackgroundUpdate'))
      console.log('✅ 桌面背景已保存')
    } catch (error) {
      console.error('背景压缩失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setDesktopUploading(false)
    }
  }

  // 上传音乐背景
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setMusicUploading(true)

    try {
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.75)
      const base64String = `data:image/jpeg;base64,${base64}`
      
      setMusicBg(base64String)
      await saveImage('music_bg', base64String)
      window.dispatchEvent(new Event('musicBackgroundUpdate'))
      console.log('✅ 音乐背景已保存到IndexedDB')
    } catch (error) {
      console.error('背景压缩失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setMusicUploading(false)
    }
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
  const handleWechatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📤 开始上传微信背景:', file.name)

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setWechatUploading(true)

    try {
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.75)
      const base64String = `data:image/jpeg;base64,${base64}`
      
      console.log('📊 图片压缩完成，大小:', Math.round(base64String.length / 1024), 'KB')
      
      setWechatBg(base64String)
      console.log('📝 状态已更新')
      
      await saveImage('wechat_bg', base64String)
      console.log('💾 已保存到 IndexedDB')
      
      window.dispatchEvent(new Event('wechatBackgroundUpdate'))
      console.log('✅ 微信背景上传完成！事件已触发')
    } catch (error) {
      console.error('❌ 背景压缩失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setWechatUploading(false)
    }
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
      // 直接读取文件为DataURL，保留PNG透明
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setMemoBg(base64String)
        await saveToIndexedDB('IMAGES', 'memo_bg', base64String)
        window.dispatchEvent(new Event('memoBackgroundUpdate'))
        console.log('✅ 备忘录背景已保存到IndexedDB（base64）')
        setMemoUploading(false)
      }
      reader.onerror = () => {
        console.error('文件读取失败')
        alert('图片处理失败，请重试')
        setMemoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('背景处理失败:', error)
      alert('图片处理失败，请重试')
      setMemoUploading(false)
    }
  }

  // 删除备忘录背景
  const handleRemoveMemo = async () => {
    if (confirm('确定要删除备忘录背景吗？')) {
      try {
        await deleteFromIndexedDB('IMAGES', 'memo_bg')
        setMemoBg('')
        window.dispatchEvent(new Event('memoBackgroundUpdate'))
        console.log('✅ 备忘录背景已删除')
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  }

  // 上传气泡1背景
  const handleBubble1Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setBubble1Uploading(true)

    try {
      // 直接读取文件为DataURL，保留PNG透明
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setBubble1Bg(base64String)
        await saveImage('desktop_bubble1_bg', base64String)
        window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
        console.log('✅ 气泡1背景已保存到IndexedDB（保留透明通道）')
        setBubble1Uploading(false)
      }
      reader.onerror = () => {
        console.error('文件读取失败')
        alert('图片处理失败，请重试')
        setBubble1Uploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('背景处理失败:', error)
      alert('图片处理失败，请重试')
      setBubble1Uploading(false)
    }
  }

  // 上传气泡2背景
  const handleBubble2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setBubble2Uploading(true)

    try {
      // 直接读取文件为DataURL，保留PNG透明
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setBubble2Bg(base64String)
        await saveImage('desktop_bubble2_bg', base64String)
        window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
        console.log('✅ 气泡2背景已保存到IndexedDB（保留透明通道）')
        setBubble2Uploading(false)
      }
      reader.onerror = () => {
        console.error('文件读取失败')
        alert('图片处理失败，请重试')
        setBubble2Uploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('背景处理失败:', error)
      alert('图片处理失败，请重试')
      setBubble2Uploading(false)
    }
  }

  // 删除气泡1背景
  const handleRemoveBubble1 = async () => {
    if (confirm('确定要删除气泡1背景吗？')) {
      setBubble1Bg('')
      await deleteFromIndexedDB('IMAGES', 'desktop_bubble1_bg')
      window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
      console.log('✅ 气泡1背景已从IndexedDB删除')
    }
  }

  // 删除气泡2背景
  const handleRemoveBubble2 = async () => {
    if (confirm('确定要删除气泡2背景吗？')) {
      setBubble2Bg('')
      await deleteFromIndexedDB('IMAGES', 'desktop_bubble2_bg')
      window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
      console.log('✅ 气泡2背景已从IndexedDB删除')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
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
      <input
        ref={bubble1FileRef}
        type="file"
        accept="image/*"
        onChange={handleBubble1Upload}
        className="hidden"
      />
      <input
        ref={bubble2FileRef}
        type="file"
        accept="image/*"
        onChange={handleBubble2Upload}
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
        {/* 全局背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">全局背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50 mb-3">
            <p className="text-xs text-gray-500 mb-3">应用于所有界面的整体背景</p>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: globalBg ? `url(${globalBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: globalBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!globalBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = async (event) => {
                          const dataUrl = event.target?.result as string
                          setGlobalBg(dataUrl)
                          await saveUIIcon('global-background', dataUrl)
                          window.dispatchEvent(new Event('uiIconsChanged'))
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {globalBg ? '更换背景' : '上传背景'}
                </button>
                {globalBg && (
                  <button
                    onClick={async () => {
                      if (confirm('确定要删除全局背景吗？')) {
                        setGlobalBg('')
                        await deleteUIIcon('global-background')
                        window.dispatchEvent(new Event('uiIconsChanged'))
                      }
                    }}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">应用于所有界面的顶栏背景</p>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: globalTopbar ? `url(${globalTopbar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: globalTopbar ? 'transparent' : '#f5f7fa'
                }}
              >
                {!globalTopbar && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = async (event) => {
                          const dataUrl = event.target?.result as string
                          setGlobalTopbar(dataUrl)
                          await saveUIIcon('global-topbar', dataUrl)
                          window.dispatchEvent(new Event('uiIconsChanged'))
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {globalTopbar ? '更换顶栏' : '上传顶栏'}
                </button>
                {globalTopbar && (
                  <button
                    onClick={async () => {
                      if (confirm('确定要删除全局顶栏吗？')) {
                        setGlobalTopbar('')
                        await deleteUIIcon('global-topbar')
                        window.dispatchEvent(new Event('uiIconsChanged'))
                      }
                    }}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除顶栏
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 功能背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">功能背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">转账、发照片等功能弹窗的背景</p>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: functionBg ? `url(${functionBg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: functionBg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!functionBg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = async (event) => {
                          const dataUrl = event.target?.result as string
                          setFunctionBg(dataUrl)
                          await saveImage('function_bg', dataUrl)
                          console.log('✅ 功能背景已保存到IndexedDB (base64长度:', dataUrl.length, ')')
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {functionBg ? '更换背景' : '上传背景'}
                </button>
                {functionBg && (
                  <button
                    onClick={async () => {
                      if (confirm('确定要删除功能背景吗？')) {
                        setFunctionBg('')
                        await deleteFromIndexedDB('IMAGES', 'function_bg')
                      }
                    }}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {desktopUploading ? '上传中...' : desktopBg ? '更换背景' : '上传背景'}
                </button>
                {desktopBg && (
                  <button
                    onClick={handleRemoveDesktop}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
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
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {musicUploading ? '上传中...' : musicBg ? '更换背景' : '上传背景'}
                </button>
                {musicBg && (
                  <button
                    onClick={handleRemoveMusic}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
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
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {wechatUploading ? '上传中...' : wechatBg ? '更换背景' : '上传背景'}
                </button>
                {wechatBg && (
                  <button
                    onClick={handleRemoveWechat}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
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
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {memoUploading ? '上传中...' : memoBg ? '更换背景' : '上传背景'}
                </button>
                {memoBg && (
                  <button
                    onClick={handleRemoveMemo}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 桌面气泡背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">桌面气泡背景</h2>
          
          {/* 气泡1背景 */}
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50 mb-3">
            <p className="text-xs text-gray-500 mb-3">设置桌面第二页气泡1（右上）的背景</p>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: bubble1Bg ? `url(${bubble1Bg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: bubble1Bg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!bubble1Bg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => bubble1FileRef.current?.click()}
                  disabled={bubble1Uploading}
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {bubble1Uploading ? '上传中...' : bubble1Bg ? '更换背景' : '上传背景'}
                </button>
                {bubble1Bg && (
                  <button
                    onClick={handleRemoveBubble1}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 气泡2背景 */}
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置桌面第二页气泡2（左下）的背景</p>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: bubble2Bg ? `url(${bubble2Bg})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: bubble2Bg ? 'transparent' : '#f5f7fa'
                }}
              >
                {!bubble2Bg && (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => bubble2FileRef.current?.click()}
                  disabled={bubble2Uploading}
                  className="w-full px-4 py-2.5 glass-card rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium text-sm"
                >
                  {bubble2Uploading ? '上传中...' : bubble2Bg ? '更换背景' : '上传背景'}
                </button>
                {bubble2Bg && (
                  <button
                    onClick={handleRemoveBubble2}
                    className="w-full px-4 py-2.5 glass-card rounded-full active:opacity-80 transition-opacity font-medium text-sm"
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
            <li>• 桌面气泡背景会显示在桌面第二页的两个文字气泡中</li>
            <li>• 建议使用高质量图片，效果更佳</li>
            <li>• 图片会保存在IndexedDB大存储中</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BackgroundCustomizer
