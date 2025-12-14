import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MusicPlayerProvider } from './context/MusicPlayerContext'
import './index.css'
import './styles/animations.css'
import './styles/bubble-default.css'
import 'leaflet/dist/leaflet.css'
// 🔥 立即加载清理工具
import './utils/cleanupLocalStorage'

// 🔒 禁用所有console输出（防止内存溢出 + 保护敏感信息）
// 🔥 开发环境也禁用，因为2140个console.log会导致Out of Memory
const noop = () => {}
console.log = noop
console.info = noop
console.debug = noop
console.group = noop
console.groupEnd = noop
console.table = noop
// 保留 warn 和 error 用于调试关键问题
// console.warn = noop
// console.error = noop

// 🍎 iOS Safari 全屏适配
function setVH() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// 初始设置
setVH()

// 监听窗口大小变化（包括Safari地址栏显示/隐藏）
window.addEventListener('resize', setVH)
window.addEventListener('orientationchange', setVH)

// 生产环境移除StrictMode以避免重复渲染
const root = ReactDOM.createRoot(document.getElementById('root')!)

// 临时移除StrictMode排查消息保存问题
root.render(
  <BrowserRouter>
    <MusicPlayerProvider>
      <App />
    </MusicPlayerProvider>
  </BrowserRouter>
)
