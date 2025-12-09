/**
 * 群聊自定义图标和装饰Hook
 * 与私聊保持同步
 */

import { useState, useEffect } from 'react'
import { getAllUIIcons } from '../../../utils/iconStorage'

interface ChatDecorations {
  topBar: string | null
  bottomBar: string | null
  plusButton: string | null
  emojiButton: string | null
  sendButtonNormal: string | null
  sendButtonActive: string | null
}

interface TopBarAdjust {
  scale: number
  x: number
  y: number
}

export const useGroupCustomIcons = () => {
  // 装饰图片状态
  const [chatDecorations, setChatDecorations] = useState<ChatDecorations>({
    topBar: localStorage.getItem('chat_top_bar_image'),
    bottomBar: localStorage.getItem('chat_bottom_bar_image'),
    plusButton: localStorage.getItem('chat_plus_button_image'),
    emojiButton: localStorage.getItem('chat_emoji_button_image'),
    sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
    sendButtonActive: localStorage.getItem('chat_send_button_active_image')
  })
  
  // 自定义UI图标
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  
  // 顶栏调整参数
  const [topBarAdjust, setTopBarAdjust] = useState<TopBarAdjust>({
    scale: 100,
    x: 0,
    y: 0
  })

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
    window.addEventListener('decoration-updated', handleDecorationUpdate)
    return () => window.removeEventListener('decoration-updated', handleDecorationUpdate)
  }, [])

  // 加载自定义UI图标
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        let icons = await getAllUIIcons()
        if (Object.keys(icons).length === 0) {
          try {
            const saved = localStorage.getItem('ui_custom_icons')
            if (saved) {
              icons = JSON.parse(saved)
            }
          } catch (err) {
            console.error('从localStorage恢复图标失败:', err)
          }
        }
        
        // 全局设置：应用到群聊界面（与私聊同步）
        if (icons['global-topbar']) {
          if (!icons['chat-topbar-bg']) {
            icons['chat-topbar-bg'] = icons['global-topbar']
            console.log('🌍 应用全局顶栏到群聊界面')
          }
        }
        
        setCustomIcons(icons)
        console.log('✅ GroupChatDetail加载自定义图标:', Object.keys(icons).length, '个')
      } catch (error) {
        console.error('❌ 加载自定义图标失败:', error)
      }
    }
    
    // 加载顶栏调整参数
    const loadAdjustParams = () => {
      const tScale = localStorage.getItem('chat-topbar-bg-scale')
      const tX = localStorage.getItem('chat-topbar-bg-x')
      const tY = localStorage.getItem('chat-topbar-bg-y')
      
      setTopBarAdjust({
        scale: tScale ? parseInt(tScale) : 100,
        x: tX ? parseInt(tX) : 0,
        y: tY ? parseInt(tY) : 0
      })
    }
    
    loadCustomIcons()
    loadAdjustParams()
    
    const handleIconsChange = () => {
      loadCustomIcons()
      loadAdjustParams()
    }
    const handleAdjust = () => {
      loadAdjustParams()
    }
    
    window.addEventListener('ui-icons-changed', handleIconsChange)
    window.addEventListener('uiIconsChanged', handleIconsChange)
    window.addEventListener('iconAdjust', handleAdjust)
    window.addEventListener('globalDecorationUpdate', handleIconsChange)
    
    return () => {
      window.removeEventListener('ui-icons-changed', handleIconsChange)
      window.removeEventListener('uiIconsChanged', handleIconsChange)
      window.removeEventListener('iconAdjust', handleAdjust)
      window.removeEventListener('globalDecorationUpdate', handleIconsChange)
    }
  }, [])

  return {
    chatDecorations,
    customIcons,
    topBarAdjust
  }
}
