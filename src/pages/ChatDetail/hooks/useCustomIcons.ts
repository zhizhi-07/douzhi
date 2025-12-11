/**
 * 自定义UI图标和装饰管理Hook
 */

import { useState, useEffect } from 'react'
import { getAllUIIcons } from '../../../utils/iconStorage'

export const useCustomIcons = () => {
  // 装饰图片状态
  const [chatDecorations, setChatDecorations] = useState({
    topBar: localStorage.getItem('chat_top_bar_image'),
    bottomBar: localStorage.getItem('chat_bottom_bar_image'),
    plusButton: localStorage.getItem('chat_plus_button_image'),
    emojiButton: localStorage.getItem('chat_emoji_button_image'),
    sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
    sendButtonActive: localStorage.getItem('chat_send_button_active_image')
  })
  
  // 自定义UI图标
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  
  // 顶栏底栏调整参数
  const [topBarScale, setTopBarScale] = useState(100)
  const [topBarX, setTopBarX] = useState(0)
  const [topBarY, setTopBarY] = useState(0)
  const [bottomBarScale, setBottomBarScale] = useState(100)
  const [bottomBarX, setBottomBarX] = useState(0)
  const [bottomBarY, setBottomBarY] = useState(0)
  
  // 监听装饰更新
  useEffect(() => {
    const handleDecorationUpdate = () => {
      setChatDecorations({
        topBar: localStorage.getItem('chat_top_bar_image'),
        bottomBar: localStorage.getItem('chat_bottom_bar_image'),
        plusButton: localStorage.getItem('chat_plus_button_image'),
        emojiButton: localStorage.getItem('chat_emoji_button_image'),
        sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
        sendButtonActive: localStorage.getItem('chat_send_button_active_image')
      })
    }
    window.addEventListener('globalDecorationUpdate', handleDecorationUpdate)
    return () => window.removeEventListener('globalDecorationUpdate', handleDecorationUpdate)
  }, [])

  // 加载自定义UI图标
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        // 优先从IndexedDB加载
        let icons = await getAllUIIcons()
        
        // 如果IndexedDB为空，从localStorage恢复
        if (Object.keys(icons).length === 0) {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            icons = JSON.parse(saved)
            console.log('📦 ChatDetail从localStorage恢复图标')
          }
        }
        
        // 全局设置：应用到所有界面
        if (icons['global-background']) {
          console.log('🌍 应用全局背景到聊天界面')
        }
        if (icons['global-topbar'] && !icons['chat-topbar-bg']) {
          icons['chat-topbar-bg'] = icons['global-topbar']
          console.log('🌍 应用全局顶栏到聊天界面')
        }
        
        setCustomIcons(icons)
        console.log('✅ ChatDetail加载自定义图标:', Object.keys(icons).length, '个')
      } catch (error) {
        console.error('❌ 加载自定义图标失败:', error)
        // 出错时从localStorage恢复
        try {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            setCustomIcons(JSON.parse(saved))
            console.log('✅ 从localStorage备份恢复')
          }
        } catch (err) {
          console.error('备份恢复失败:', err)
        }
      }
    }
    
    loadCustomIcons()
    
    // 加载调整参数（从iconAdjustParams读取）
    const loadAdjustParams = () => {
      try {
        const saved = localStorage.getItem('iconAdjustParams')
        if (saved) {
          const params = JSON.parse(saved)
          if (params['chat-topbar-bg']) {
            setTopBarScale(params['chat-topbar-bg'].scale || 100)
            setTopBarX(params['chat-topbar-bg'].x || 0)
            setTopBarY(params['chat-topbar-bg'].y || 0)
          }
          if (params['chat-bottombar-bg']) {
            setBottomBarScale(params['chat-bottombar-bg'].scale || 100)
            setBottomBarX(params['chat-bottombar-bg'].x || 0)
            setBottomBarY(params['chat-bottombar-bg'].y || 0)
          }
        }
      } catch (e) {
        console.error('加载调整参数失败:', e)
      }
    }
    loadAdjustParams()
    
    // 监听图标更新事件
    const handleIconsChange = () => {
      loadCustomIcons()
    }
    const handleAdjust = () => {
      loadAdjustParams()
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    window.addEventListener('iconAdjust', handleAdjust)
    
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
      window.removeEventListener('iconAdjust', handleAdjust)
    }
  }, [])

  return {
    chatDecorations,
    customIcons,
    topBarScale,
    topBarX,
    topBarY,
    bottomBarScale,
    bottomBarX,
    bottomBarY
  }
}
