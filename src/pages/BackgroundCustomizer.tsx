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
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.75)
      const base64String = `data:image/jpeg;base64,${base64}`

      setDesktopBg(base64String)
      await saveImage('desktop_bg', base64String)

      const desktopEl = document.querySelector('.desktop-background') as HTMLElement
      if (desktopEl) {
        desktopEl.style.backgroundImage = `url(${base64String})`
      }

      window.dispatchEvent(new Event('desktopBackgroundUpdate'))
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
    }
  }

  // 删除音乐背景
  const handleRemoveMusic = async () => {
    if (confirm('确定要删除音乐背景吗？')) {
      setMusicBg('')
      await deleteFromIndexedDB('IMAGES', 'music_bg')
      window.dispatchEvent(new Event('musicBackgroundUpdate'))
    }
  }

  // 上传微信背景
  const handleWechatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setWechatUploading(true)

    try {
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.75)
      const base64String = `data:image/jpeg;base64,${base64}`

      setWechatBg(base64String)
      await saveImage('wechat_bg', base64String)
      window.dispatchEvent(new Event('wechatBackgroundUpdate'))
    } catch (error) {
      console.error('背景压缩失败:', error)
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
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setMemoBg(base64String)
        await saveToIndexedDB('IMAGES', 'memo_bg', base64String)
        window.dispatchEvent(new Event('memoBackgroundUpdate'))
        setMemoUploading(false)
      }
      reader.onerror = () => {
        alert('图片处理失败，请重试')
        setMemoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
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
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setBubble1Bg(base64String)
        await saveImage('desktop_bubble1_bg', base64String)
        window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
        setBubble1Uploading(false)
      }
      reader.onerror = () => {
        alert('图片处理失败，请重试')
        setBubble1Uploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
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
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        setBubble2Bg(base64String)
        await saveImage('desktop_bubble2_bg', base64String)
        window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
        setBubble2Uploading(false)
      }
      reader.onerror = () => {
        alert('图片处理失败，请重试')
        setBubble2Uploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
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
    }
  }

  // 删除气泡2背景
  const handleRemoveBubble2 = async () => {
    if (confirm('确定要删除气泡2背景吗？')) {
      setBubble2Bg('')
      await deleteFromIndexedDB('IMAGES', 'desktop_bubble2_bg')
      window.dispatchEvent(new Event('bubbleBackgroundUpdate'))
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5] relative overflow-hidden font-sans">

      {/* 隐藏的文件输入 */}
      <input ref={desktopFileRef} type="file" accept="image/*" onChange={handleDesktopUpload} className="hidden" />
      <input ref={musicFileRef} type="file" accept="image/*" onChange={handleMusicUpload} className="hidden" />
      <input ref={wechatFileRef} type="file" accept="image/*" onChange={handleWechatUpload} className="hidden" />
      <input ref={memoFileRef} type="file" accept="image/*" onChange={handleMemoUpload} className="hidden" />
      <input ref={bubble1FileRef} type="file" accept="image/*" onChange={handleBubble1Upload} className="hidden" />
      <input ref={bubble2FileRef} type="file" accept="image/*" onChange={handleBubble2Upload} className="hidden" />

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800">背景设置</h1>
          </div>
        </div>
      </div>

      {/* 背景设置列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide space-y-5">

        {/* 全局背景 */}
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">全局背景</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-100"
              style={{
                backgroundImage: globalBg ? `url(${globalBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!globalBg && <span className="text-xs text-slate-400">无背景</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
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
                className="py-3 bg-white/60 hover:bg-white/80 rounded-full text-xs font-medium text-slate-700 transition-all border border-white/60"
              >
                {globalBg ? '更换' : '上传'}
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
                  className="py-3 bg-red-50/50 hover:bg-red-50 rounded-full text-xs font-medium text-red-600 transition-all border border-red-100/50"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 桌面背景 */}
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">桌面背景</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-100"
              style={{
                backgroundImage: desktopBg ? `url(${desktopBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!desktopBg && <span className="text-xs text-slate-400">无背景</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <button
                onClick={() => desktopFileRef.current?.click()}
                disabled={desktopUploading}
                className="py-3 bg-white/60 hover:bg-white/80 rounded-full text-xs font-medium text-slate-700 transition-all border border-white/60"
              >
                {desktopUploading ? '上传中...' : desktopBg ? '更换' : '上传'}
              </button>
              {desktopBg && (
                <button
                  onClick={handleRemoveDesktop}
                  className="py-3 bg-red-50/50 hover:bg-red-50 rounded-full text-xs font-medium text-red-600 transition-all border border-red-100/50"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 微信背景 */}
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">微信背景</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-100"
              style={{
                backgroundImage: wechatBg ? `url(${wechatBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!wechatBg && <span className="text-xs text-slate-400">无背景</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <button
                onClick={() => wechatFileRef.current?.click()}
                disabled={wechatUploading}
                className="py-3 bg-white/60 hover:bg-white/80 rounded-full text-xs font-medium text-slate-700 transition-all border border-white/60"
              >
                {wechatUploading ? '上传中...' : wechatBg ? '更换' : '上传'}
              </button>
              {wechatBg && (
                <button
                  onClick={handleRemoveWechat}
                  className="py-3 bg-red-50/50 hover:bg-red-50 rounded-full text-xs font-medium text-red-600 transition-all border border-red-100/50"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 音乐背景 */}
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">音乐背景</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-100"
              style={{
                backgroundImage: musicBg ? `url(${musicBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!musicBg && <span className="text-xs text-slate-400">无背景</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <button
                onClick={() => musicFileRef.current?.click()}
                disabled={musicUploading}
                className="py-3 bg-white/60 hover:bg-white/80 rounded-full text-xs font-medium text-slate-700 transition-all border border-white/60"
              >
                {musicUploading ? '上传中...' : musicBg ? '更换' : '上传'}
              </button>
              {musicBg && (
                <button
                  onClick={handleRemoveMusic}
                  className="py-3 bg-red-50/50 hover:bg-red-50 rounded-full text-xs font-medium text-red-600 transition-all border border-red-100/50"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 备忘录背景 */}
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-sm">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-5">备忘录背景</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-[24px] overflow-hidden border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center bg-slate-100"
              style={{
                backgroundImage: memoBg ? `url(${memoBg})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!memoBg && <span className="text-xs text-slate-400">无背景</span>}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <button
                onClick={() => memoFileRef.current?.click()}
                disabled={memoUploading}
                className="py-3 bg-white/60 hover:bg-white/80 rounded-full text-xs font-medium text-slate-700 transition-all border border-white/60"
              >
                {memoUploading ? '上传中...' : memoBg ? '更换' : '上传'}
              </button>
              {memoBg && (
                <button
                  onClick={handleRemoveMemo}
                  className="py-3 bg-red-50/50 hover:bg-red-50 rounded-full text-xs font-medium text-red-600 transition-all border border-red-100/50"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default BackgroundCustomizer
