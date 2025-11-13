/**
 * 字体设置页面
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

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
  
  // 保存的字体列表
  const [savedFonts, setSavedFonts] = useState<Array<{name: string, family: string, url: string}>>(() => {
    const saved = localStorage.getItem('saved_fonts')
    return saved ? JSON.parse(saved) : []
  })
  
  const [fontUrl, setFontUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 应用字体
  const applyFont = (fontFamily: string, fontUrl: string | null, fontName: string) => {
    const fontConfig = {
      family: fontFamily,
      url: fontUrl,
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
      }
    }
    
    // 应用到body
    document.body.style.fontFamily = fontFamily
    
    // 保存配置
    setCustomFont(fontConfig)
    localStorage.setItem('custom_font', JSON.stringify(fontConfig))
    
    // 触发事件通知其他组件
    window.dispatchEvent(new Event('fontChanged'))
    
    console.log('✅ 字体已应用:', fontConfig)
  }
  
  // 保存字体到列表
  const saveFontToList = (fontName: string, fontFamily: string, fontUrl: string) => {
    const newFont = { name: fontName, family: fontFamily, url: fontUrl }
    const updatedFonts = [...savedFonts, newFont]
    setSavedFonts(updatedFonts)
    localStorage.setItem('saved_fonts', JSON.stringify(updatedFonts))
  }
  
  // 从列表删除字体
  const deleteFontFromList = (index: number) => {
    const updatedFonts = savedFonts.filter((_, i) => i !== index)
    setSavedFonts(updatedFonts)
    localStorage.setItem('saved_fonts', JSON.stringify(updatedFonts))
  }
  
  // 选择保存的字体
  const handleSelectSavedFont = (font: typeof savedFonts[0]) => {
    applyFont(font.family, font.url, font.name)
  }
  
  // 重置为系统默认（喵小九的喵字体）
  const resetToDefault = () => {
    const defaultFamily = '"喵小九的喵", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    
    // 加载喵小九的喵字体
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: '喵小九的喵';
        src: url('/fonts/喵小九的喵.ttf');
      }
    `
    document.head.appendChild(style)
    
    document.body.style.fontFamily = defaultFamily
    setCustomFont({
      family: defaultFamily,
      url: '/fonts/喵小九的喵.ttf',
      name: '喵小九的喵'
    })
    localStorage.setItem('custom_font', JSON.stringify({
      family: defaultFamily,
      url: '/fonts/喵小九的喵.ttf',
      name: '喵小九的喵'
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
  
  // 页面加载时应用已保存的字体
  useEffect(() => {
    if (customFont && customFont.url) {
      // 判断是CSS链接还是字体文件
      if (customFont.url.includes('.css') || customFont.url.includes('fonts.googleapis.com')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = customFont.url
        document.head.appendChild(link)
      } else {
        const style = document.createElement('style')
        style.textContent = `
          @font-face {
            font-family: '${customFont.name}';
            src: url('${customFont.url}');
          }
        `
        document.head.appendChild(style)
      }
      document.body.style.fontFamily = customFont.family
    } else {
      // 如果没有自定义字体，使用喵小九的喵作为默认字体
      const style = document.createElement('style')
      style.textContent = `
        @font-face {
          font-family: '喵小九的喵';
          src: url('/fonts/喵小九的喵.ttf');
        }
      `
      document.head.appendChild(style)
      document.body.style.fontFamily = '"喵小九的喵", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 状态栏 + 导航栏一体 */}
      <div className="glass-effect border-b border-gray-200/50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/customize', { replace: true })
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">字体设置</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 当前字体 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">当前字体</div>
            {customFont && (
              <button
                onClick={resetToDefault}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
              >
                恢复默认
              </button>
            )}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {customFont ? customFont.name : '喵小九的喵（系统默认）'}
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-base" style={{ fontFamily: customFont?.family || '"喵小九的喵", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              床前明月光，疑是地上霜。
            </p>
            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: customFont?.family || '"喵小九的喵", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>


        {/* 已保存的字体 */}
        {savedFonts.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
            <div className="text-sm font-semibold text-gray-900 mb-3">📦 我的字体（{savedFonts.length}）</div>
            <div className="space-y-2">
              {savedFonts.map((font, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all flex items-center justify-between ${
                    customFont?.name === font.name
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSelectSavedFont(font)}
                  >
                    <div className="font-semibold text-gray-900">{font.name}</div>
                    <div className="text-sm text-gray-500 mt-1" style={{ fontFamily: font.family }}>
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
                    className="ml-3 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors text-xs"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传字体文件 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="text-sm font-semibold text-gray-900 mb-3">上传字体文件</div>
          <div className="text-xs text-gray-500 mb-3">
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
            className="w-full py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
          >
            选择字体文件
          </button>
        </div>

        {/* 从URL加载 */}
        <div className="glass-card rounded-2xl p-4 mb-4 backdrop-blur-md bg-white/80 border border-white/50">
          <div className="text-sm font-semibold text-gray-900 mb-3">从URL加载字体</div>
          <div className="text-xs text-gray-500 mb-3">
            输入字体文件的 CDN 链接
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={fontUrl}
              onChange={(e) => setFontUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLoadFromUrl}
              className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
            >
              加载
            </button>
          </div>
        </div>

        {/* 说明 */}
        <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/60 border border-white/50">
          <div className="text-xs text-gray-600">
            <p className="mb-2">💡 提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>字体会保存在本地，刷新后依然生效</li>
              <li>上传的字体文件会转换为 Base64 存储</li>
              <li>推荐使用字体 CDN 链接，节省存储空间</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FontCustomizer
