import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './styles/animations.css'

// 生产环境移除StrictMode以避免重复渲染
const root = ReactDOM.createRoot(document.getElementById('root')!)

// 临时移除StrictMode排查消息保存问题
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
