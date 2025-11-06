/**
 * 聊天气泡样式管理 Hook
 */

import { useState, useEffect } from 'react'

export const useChatBubbles = (chatId: string | undefined) => {
  // 用户气泡 CSS
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`user_bubble_css_${chatId}`) || 
           localStorage.getItem('user_bubble_css') || 
           ''
  })
  
  // AI 气泡 CSS
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`ai_bubble_css_${chatId}`) || 
           localStorage.getItem('ai_bubble_css') || 
           ''
  })
  
  // 监听 localStorage 变化，实时更新气泡样式
  useEffect(() => {
    if (!chatId) return
    
    const handleStorageChange = () => {
      // 优先使用单聊设置，其次是全局设置
      const userCSS = localStorage.getItem(`user_bubble_css_${chatId}`) || 
                      localStorage.getItem('user_bubble_css') || ''
      const aiCSS = localStorage.getItem(`ai_bubble_css_${chatId}`) || 
                    localStorage.getItem('ai_bubble_css') || ''
      
      console.log('🎨 [气泡样式更新]', { userCSS: userCSS.substring(0, 50), aiCSS: aiCSS.substring(0, 50) })
      setUserBubbleCSS(userCSS)
      setAiBubbleCSS(aiCSS)
    }
    
    // 监听storage事件（其他窗口）
    window.addEventListener('storage', handleStorageChange)
    // 监听自定义事件（同一窗口）
    window.addEventListener('bubbleStyleUpdate', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bubbleStyleUpdate', handleStorageChange)
    }
  }, [chatId])
  
  // 应用CSS到页面
  useEffect(() => {
    const styleId = 'chat-bubble-style'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    
    const fullCSS = userBubbleCSS + '\n' + aiBubbleCSS
    styleElement.textContent = fullCSS
    
    console.log('💅 [气泡CSS应用]', {
      长度: fullCSS.length,
      预览: fullCSS.substring(0, 200)
    })
    
    return () => {
      // 组件卸载时不要删除style标签，避免切换页面时样式消失
    }
  }, [userBubbleCSS, aiBubbleCSS])
  
  return {
    userBubbleCSS,
    aiBubbleCSS
  }
}
