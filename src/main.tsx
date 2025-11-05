import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 生产环境移除StrictMode以避免重复渲染
const root = ReactDOM.createRoot(document.getElementById('root')!)

if (import.meta.env.PROD) {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}
