/**
 * 聊天气泡样式管理 Hook
 * 使用IndexedDB存储，解决localStorage空间不足问题
 */

import { useState, useEffect } from 'react'

// IndexedDB工具函数
const DB_NAME = 'BubbleStyleDB'
const STORE_NAME = 'styles'

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

const getFromIDB = async (key: string): Promise<string> => {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        db.close()
        resolve(request.result?.value || '')
      }
      request.onerror = () => { db.close(); resolve('') }
    })
  } catch {
    return ''
  }
}

export const useChatBubbles = (chatId: string | undefined) => {
  const [userBubbleCSS, setUserBubbleCSS] = useState('')
  const [aiBubbleCSS, setAiBubbleCSS] = useState('')
  
  // 从IndexedDB加载CSS
  const loadCSS = async () => {
    if (!chatId) return
    const [userCSS, aiCSS] = await Promise.all([
      getFromIDB(`user_bubble_css_${chatId}`),
      getFromIDB(`ai_bubble_css_${chatId}`)
    ])
    setUserBubbleCSS(userCSS)
    setAiBubbleCSS(aiCSS)
  }
  
  // 初始加载
  useEffect(() => {
    loadCSS()
  }, [chatId])
  
  // 监听更新事件
  useEffect(() => {
    if (!chatId) return
    
    const handleStyleUpdate = () => {
      loadCSS()
    }
    
    window.addEventListener('bubbleStyleUpdate', handleStyleUpdate)
    
    return () => {
      window.removeEventListener('bubbleStyleUpdate', handleStyleUpdate)
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
