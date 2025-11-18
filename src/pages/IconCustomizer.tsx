/**
 * 图标设置页面
 * 允许用户自定义应用图标
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { page1Apps, page2Apps, dockApps } from '../config/apps'
import React from 'react'

interface IconConfig {
  appId: string
  appName: string
  defaultIcon: React.ComponentType<any> | string
  customIcon?: string
}

const IconCustomizer = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  // 可自定义图标的应用列表
  const [iconConfigs, setIconConfigs] = useState<IconConfig[]>(() => {
    try {
      // 从apps.ts获取实际应用配置
      const allApps = [...page1Apps, ...page2Apps, ...dockApps]
      
      // 去重（有些应用在多个地方出现）
      const uniqueApps = allApps.filter((app, index, self) => 
        index === self.findIndex(a => a.id === app.id)
      )
      
      // 转换为IconConfig格式
      const correctApps = uniqueApps.map(app => ({
        appId: app.id,
        appName: app.name,
        defaultIcon: app.icon,
        customIcon: undefined
      }))
      
      // 检查localStorage中的数据
      const saved = localStorage.getItem('custom_icons')
      if (saved) {
        try {
          const savedConfigs = JSON.parse(saved)
          // 检查第一个应用ID是否正确
          if (savedConfigs[0]?.appId === 'wechat') {
            // 旧数据，清除
            console.log('🔧 检测到旧的图标数据，已清除')
            localStorage.removeItem('custom_icons')
            return correctApps
          }
          // 数据正确，使用保存的数据
          return savedConfigs
        } catch (e) {
          console.error('解析图标数据失败:', e)
          return correctApps
        }
      }
      
      return correctApps
    } catch (e) {
      console.error('初始化图标配置失败:', e)
      // 返回空数组防止白屏
      return []
    }
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  
  // 上传自定义图标
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>, appId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    
    // 限制文件大小为1MB
    if (file.size > 1 * 1024 * 1024) {
      alert('图片太大！请选择小于1MB的文件')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      
      // 🎬 如果是GIF，直接保存不压缩（保持动画效果）
      if (file.type === 'image/gif') {
        // 更新图标配置
        const updatedConfigs = iconConfigs.map(config => 
          config.appId === appId 
            ? { ...config, customIcon: base64 }
            : config
        )
        
        setIconConfigs(updatedConfigs)
        localStorage.setItem('custom_icons', JSON.stringify(updatedConfigs))
        
        // 触发事件通知其他组件
        window.dispatchEvent(new CustomEvent('iconChanged', { detail: { appId, icon: base64 } }))
        
        console.log('✅ GIF图标已更新:', appId)
        return
      }
      
      // 其他格式：压缩到128x128
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 128
        canvas.width = size
        canvas.height = size
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // 如果是PNG，保持透明背景
          if (file.type === 'image/png') {
            ctx.clearRect(0, 0, size, size)
          }
          
          ctx.drawImage(img, 0, 0, size, size)
          
          // 根据原文件类型选择输出格式
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const quality = file.type === 'image/png' ? 1.0 : 0.8
          const compressedBase64 = canvas.toDataURL(outputType, quality)
          
          // 更新图标配置
          const updatedConfigs = iconConfigs.map(config => 
            config.appId === appId 
              ? { ...config, customIcon: compressedBase64 }
              : config
          )
          
          setIconConfigs(updatedConfigs)
          localStorage.setItem('custom_icons', JSON.stringify(updatedConfigs))
          
          // 触发事件通知其他组件
          window.dispatchEvent(new CustomEvent('iconChanged', { detail: { appId, icon: compressedBase64 } }))
          
          console.log('✅ 图标已更新:', appId)
        }
      }
      img.src = base64
    }
    reader.onerror = () => {
      alert('图片读取失败')
    }
    reader.readAsDataURL(file)
  }
  
  // 恢复默认图标
  const resetIcon = (appId: string) => {
    if (confirm('确定要恢复默认图标吗？')) {
      const updatedConfigs = iconConfigs.map(config => 
        config.appId === appId 
          ? { ...config, customIcon: undefined }
          : config
      )
      
      setIconConfigs(updatedConfigs)
      localStorage.setItem('custom_icons', JSON.stringify(updatedConfigs))
      
      // 触发事件通知其他组件
      window.dispatchEvent(new CustomEvent('iconChanged', { detail: { appId, icon: null } }))
      
      console.log('✅ 图标已恢复默认:', appId)
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (selectedAppId) {
            handleIconUpload(e, selectedAppId)
          }
        }}
        className="hidden"
      />
      
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(-1)
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50 relative z-10"
            style={{ touchAction: 'manipulation' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            图标设置
          </h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 应用列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="glass-card rounded-2xl p-3 backdrop-blur-md bg-white/80 border border-white/50">
          {iconConfigs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>加载失败，请刷新重试</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                刷新页面
              </button>
            </div>
          ) : (
          <div className="space-y-2">
            {iconConfigs.map((config) => (
              <div
                key={config.appId}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {/* 图标预览 */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white border-2 border-gray-200 flex-shrink-0">
                  {(() => {
                    try {
                      if (config.customIcon) {
                        return <img src={config.customIcon} alt={config.appName} className="w-full h-full object-cover" />
                      } else if (typeof config.defaultIcon === 'string') {
                        return <img src={config.defaultIcon} alt={config.appName} className="w-full h-full object-cover" />
                      } else if (config.defaultIcon) {
                        return (
                          <div className="glass-card w-full h-full flex items-center justify-center">
                            {React.createElement(config.defaultIcon, { className: "w-7 h-7 text-gray-600" })}
                          </div>
                        )
                      } else {
                        return (
                          <div className="glass-card w-full h-full flex items-center justify-center">
                            <div className="w-7 h-7 bg-gray-300 rounded-lg"></div>
                          </div>
                        )
                      }
                    } catch (e) {
                      console.error('渲染图标失败:', config.appId, e)
                      return (
                        <div className="glass-card w-full h-full flex items-center justify-center">
                          <div className="w-7 h-7 bg-gray-300 rounded-lg"></div>
                        </div>
                      )
                    }
                  })()}
                </div>
                
                {/* 应用名称 */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{config.appName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {config.customIcon ? '已自定义' : '使用默认图标'}
                  </p>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAppId(config.appId)
                      fileInputRef.current?.click()
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium active:opacity-80 transition-opacity"
                  >
                    {config.customIcon ? '更换' : '上传'}
                  </button>
                  {config.customIcon && (
                    <button
                      onClick={() => resetIcon(config.appId)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium active:opacity-80 transition-opacity"
                    >
                      恢复
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-4 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">使用说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 点击"上传"按钮选择图片文件</li>
            <li>• 支持 JPG、PNG、GIF 等常见图片格式</li>
            <li>• 图片会自动压缩到128x128像素</li>
            <li>• 点击"恢复"按钮可恢复默认图标</li>
            <li>• 建议使用正方形的图片，效果更佳</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default IconCustomizer
