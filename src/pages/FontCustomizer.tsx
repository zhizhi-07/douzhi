/**
 * 字体设置页面
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

// IndexedDB 操作函数
const DB_NAME = 'FontStorage'
const STORE_NAME = 'fonts'

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' })
      }
    }
  })
}

const saveFontToDB = async (font: { name: string; family: string; url: string }) => {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(font)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const getAllFontsFromDB = async (): Promise<Array<{ name: string; family: string; url: string }>> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

const deleteFontFromDB = async (name: string) => {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(name)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const getFontFromDB = async (name: string): Promise<{ name: string; family: string; url: string } | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(name)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

const FontCustomizer = () => {
  const navigate = useNavigate()
  const [showStatusBar, setShowStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

  // 当前字体设置
  const [customFont, setCustomFont] = useState(() => {
    const saved = localStorage.getItem('custom_font')
    return saved ? JSON.parse(saved) : null
  })

  // 保存的字体列表（从 IndexedDB 加载）
  const [savedFonts, setSavedFonts] = useState<Array<{ name: string, family: string, url: string }>>([])
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const [fontUrl, setFontUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 应用字体
  const applyFont = (fontFamily: string, fontUrl: string | null, fontName: string) => {
    const fontConfig = {
      family: fontFamily,
      url: null as string | null, // localStorage只存元信息，不存base64
      name: fontName
    }

    // 如果有URL，加载字体
    if (fontUrl) {
      // 判断是CSS链接还是字体文件
      if (fontUrl.includes('.css') || fontUrl.includes('fonts.googleapis.com')) {
        // CSS链接，使用link标签
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = fontUrl
        document.head.appendChild(link)
        fontConfig.url = fontUrl // CDN链接可以存
      } else {
        // 字体文件，使用@font-face
        const style = document.createElement('style')
        style.textContent = `
          @font-face {
            font-family: '${fontName}';
            src: url('${fontUrl}');
          }
        `
        document.head.appendChild(style)
        // base64数据不存到localStorage，只存fontName引用
      }
    }

    // 设置 CSS 变量，让全局字体生效
    document.documentElement.style.setProperty('--global-font-family', fontFamily)

    // 保存配置到localStorage（只存元信息）
    setCustomFont(fontConfig)
    localStorage.setItem('custom_font', JSON.stringify(fontConfig))

    // 触发事件通知其他组件
    window.dispatchEvent(new Event('fontChanged'))

    console.log('✅ 字体已应用:', fontConfig)
  }

  // 保存字体到列表（存到 IndexedDB）
  const saveFontToList = async (fontName: string, fontFamily: string, fontUrl: string) => {
    const newFont = { name: fontName, family: fontFamily, url: fontUrl }
    await saveFontToDB(newFont)
    setSavedFonts(prev => [...prev.filter(f => f.name !== fontName), newFont])
  }

  // 从列表删除字体（从 IndexedDB 删除）
  const deleteFontFromList = async (index: number) => {
    const fontToDelete = savedFonts[index]
    if (fontToDelete) {
      await deleteFontFromDB(fontToDelete.name)
      setSavedFonts(prev => prev.filter((_, i) => i !== index))
    }
  }

  // 选择保存的字体
  const handleSelectSavedFont = async (font: typeof savedFonts[0]) => {
    // 从IndexedDB加载完整字体数据（包含base64）
    const fullFont = await getFontFromDB(font.name)
    if (fullFont) {
      applyFont(fullFont.family, fullFont.url, fullFont.name)
    } else {
      applyFont(font.family, font.url, font.name)
    }
  }

  // 重置为系统默认（经典衬线字体）
  const resetToDefault = () => {
    const defaultFamily = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'

    document.documentElement.style.setProperty('--global-font-family', defaultFamily)
    setCustomFont({
      family: defaultFamily,
      url: null,
      name: '经典衬线'
    })
    localStorage.setItem('custom_font', JSON.stringify({
      family: defaultFamily,
      url: null,
      name: '经典衬线'
    }))
    window.dispatchEvent(new Event('fontChanged'))
  }

  // 上传字体文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      const validTypes = ['.ttf', '.otf', '.woff', '.woff2']
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

      if (!validTypes.includes(fileExt)) {
        alert('仅支持 TTF、OTF、WOFF、WOFF2 格式的字体文件')
        return
      }

      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('字体文件太大！请选择小于5MB的文件')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const fontName = file.name.replace(/\.[^/.]+$/, '')
        const fontFamily = `"${fontName}", sans-serif`

        // 应用字体
        applyFont(fontFamily, dataUrl, fontName)
        // 保存到列表
        saveFontToList(fontName, fontFamily, dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  // 从URL加载字体
  const handleLoadFromUrl = () => {
    if (!fontUrl.trim()) {
      alert('请输入字体URL')
      return
    }

    const fontName = 'CustomFont' + Date.now()
    const fontFamily = `"${fontName}", sans-serif`

    // 应用字体
    applyFont(fontFamily, fontUrl, fontName)
    // 保存到列表
    saveFontToList(fontName, fontFamily, fontUrl)
    setFontUrl('')
  }

  // 页面加载时从 IndexedDB 加载字体列表
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fonts = await getAllFontsFromDB()
        setSavedFonts(fonts)
        setFontsLoaded(true)
      } catch (err) {
        console.error('加载字体列表失败:', err)
        setFontsLoaded(true)
      }
    }
    loadFonts()
  }, [])

  // 页面加载时应用已保存的字体
  useEffect(() => {
    const applyCurrentFont = async () => {
      if (customFont && customFont.name && customFont.name !== '经典衬线') {
        // 尝试从IndexedDB加载完整字体数据
        const fullFont = await getFontFromDB(customFont.name)
        const fontUrl = fullFont?.url || customFont.url
        
        if (fontUrl) {
          // 判断是CSS链接还是字体文件
          if (fontUrl.includes('.css') || fontUrl.includes('fonts.googleapis.com')) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = fontUrl
            document.head.appendChild(link)
          } else {
            const style = document.createElement('style')
            style.textContent = `
              @font-face {
                font-family: '${customFont.name}';
                src: url('${fontUrl}');
              }
            `
            document.head.appendChild(style)
          }
        }
        document.documentElement.style.setProperty('--global-font-family', customFont.family)
      } else if (!customFont) {
        // 如果没有自定义字体，使用经典衬线作为默认字体，并更新状态
        const defaultFontConfig = {
          family: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          url: null,
          name: '经典衬线'
        }

        document.documentElement.style.setProperty('--global-font-family', defaultFontConfig.family)

        // 🔥 更新状态，让页面显示当前使用的默认字体
        setCustomFont(defaultFontConfig)
        localStorage.setItem('custom_font', JSON.stringify(defaultFontConfig))
      }
    }
    applyCurrentFont()
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customize')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">字体设置</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">TYPOGRAPHY</p>
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 当前字体 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">当前字体</div>
              {customFont && (
                <button
                  onClick={resetToDefault}
                  className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-700 transition-all"
                >
                  恢复默认
                </button>
              )}
            </div>
            <div className="text-lg font-medium text-slate-800 mb-4">
              {customFont ? customFont.name : '经典衬线（系统默认）'}
            </div>
            <div className="p-4 bg-white/50 rounded-xl border border-white/60">
              <p className="text-lg mb-2 text-slate-800" style={{ fontFamily: customFont?.family || 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                床前明月光，疑是地上霜。
              </p>
              <p className="text-base text-slate-600" style={{ fontFamily: customFont?.family || 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>


          {/* 已保存的字体 */}
          {savedFonts.length > 0 && (
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">📦 我的字体（{savedFonts.length}）</div>
              <div className="space-y-3">
                {savedFonts.map((font, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl transition-all flex items-center justify-between border ${customFont?.name === font.name
                        ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100'
                        : 'bg-white/50 border-white/60 hover:bg-white/80'
                      }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSelectSavedFont(font)}
                    >
                      <div className="font-medium text-slate-800">{font.name}</div>
                      <div className="text-sm text-slate-500 mt-1" style={{ fontFamily: font.family }}>
                        示例文字 Sample Text
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`确定要删除字体"${font.name}"吗？`)) {
                          deleteFontFromList(index)
                        }
                      }}
                      className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传字体文件 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">上传字体文件</div>
            <div className="text-xs text-slate-400 mb-4 font-light">
              支持 TTF、OTF、WOFF、WOFF2 格式，最大 5MB
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-white/50 hover:bg-white/80 border border-white/60 rounded-xl text-slate-700 transition-all font-medium shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              选择字体文件
            </button>
          </div>

          {/* 从URL加载 */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">从URL加载字体</div>
            <div className="text-xs text-slate-400 mb-4 font-light">
              输入字体文件的 CDN 链接
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={fontUrl}
                onChange={(e) => setFontUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all placeholder:text-slate-400"
              />
              <button
                onClick={handleLoadFromUrl}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium whitespace-nowrap shadow-md"
              >
                加载
              </button>
            </div>
          </div>

          {/* 说明 */}
          <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50/50">
            <div className="text-xs text-slate-500 leading-relaxed">
              <p className="mb-2 font-medium">💡 提示：</p>
              <ul className="list-disc list-inside space-y-1 opacity-80">
                <li>字体会保存在本地，刷新后依然生效</li>
                <li>上传的字体文件会转换为 Base64 存储</li>
                <li>推荐使用字体 CDN 链接，节省存储空间</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FontCustomizer
