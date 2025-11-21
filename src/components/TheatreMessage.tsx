import { Message } from '../types/chat'
import { useEffect, useRef } from 'react'

interface TheatreMessageProps {
  message: Message
}

export default function TheatreMessage({ message }: TheatreMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  console.log('🎭 [TheatreMessage] 渲染组件', {
    hasTheatre: !!message.theatre,
    templateName: message.theatre?.templateName,
    htmlLength: message.theatre?.htmlContent.length
  })
  
  useEffect(() => {
    if (!containerRef.current || !message.theatre?.templateId) return
    
    const templateId = message.theatre.templateId
    
    // ==================== 刮刮乐交互 ====================
    if (templateId === 'scratch_card') {
      const canvas = containerRef.current.querySelector('[data-scratch-canvas]') as HTMLCanvasElement
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // 绘制银灰色底层
      ctx.fillStyle = '#d4d4d4'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 添加细微纹理
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(${200 + Math.random() * 30}, ${200 + Math.random() * 30}, ${200 + Math.random() * 30}, 0.4)`
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
      }
      
      // 绘制重复的"刮奖处"圆形水印
      ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)'
      ctx.lineWidth = 2
      ctx.font = '14px SimHei, Microsoft YaHei'
      ctx.fillStyle = 'rgba(160, 160, 160, 0.25)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const rows = 3
      const cols = 4
      const radius = 30
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = (col + 0.5) * (canvas.width / cols)
          const y = (row + 0.5) * (canvas.height / rows)
          
          // 绘制圆圈
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.stroke()
          
          // 绘制文字
          ctx.fillText('刮奖处', x, y)
        }
      }
      
      let isScratching = false
      let scratchedPixels = 0
      const totalPixels = canvas.width * canvas.height
      
      const scratch = (x: number, y: number) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const canvasX = (x - rect.left) * scaleX
        const canvasY = (y - rect.top) * scaleY
        
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 20, 0, Math.PI * 2)
        ctx.fill()
        
        // 计算刮开面积
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let transparent = 0
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] === 0) transparent++
        }
        scratchedPixels = transparent
        
        // 刮开30%自动清除
        if (scratchedPixels / totalPixels > 0.3) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          canvas.style.pointerEvents = 'none'
        }
      }
      
      const handleMouseDown = (e: MouseEvent) => {
        isScratching = true
        scratch(e.clientX, e.clientY)
      }
      
      const handleMouseMove = (e: MouseEvent) => {
        if (isScratching) {
          scratch(e.clientX, e.clientY)
        }
      }
      
      const handleMouseUp = () => {
        isScratching = false
      }
      
      const handleTouchStart = (e: TouchEvent) => {
        isScratching = true
        const touch = e.touches[0]
        scratch(touch.clientX, touch.clientY)
      }
      
      const handleTouchMove = (e: TouchEvent) => {
        if (isScratching) {
          e.preventDefault()
          const touch = e.touches[0]
          scratch(touch.clientX, touch.clientY)
        }
      }
      
      const handleTouchEnd = () => {
        isScratching = false
      }
      
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)
      canvas.addEventListener('touchstart', handleTouchStart)
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvas.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
      }
    }
    
    // ==================== 购物车交互 ====================
    if (templateId === 'shopping_cart') {
      const container = containerRef.current.querySelector('[data-shopping-cart]')
      if (!container) return
      
      const prices = [
        parseFloat(message.theatre.htmlContent.match(/¥(\d+)/)?.[1] || '0'),
        parseFloat(message.theatre.htmlContent.match(/¥\d+.*?¥(\d+)/)?.[1] || '0'),
        parseFloat(message.theatre.htmlContent.match(/¥\d+.*?¥\d+.*?¥(\d+)/)?.[1] || '0')
      ]
      
      let selectedItems = new Set([1, 2, 3]) // 默认全选
      
      const updateTotal = () => {
        let total = 0
        selectedItems.forEach(i => {
          total += prices[i - 1] || 0
        })
        const totalEl = container.querySelector('[data-total]')
        const btnEl = container.querySelector('[data-checkout-btn]')
        if (totalEl) totalEl.textContent = `¥${total}`
        if (btnEl) btnEl.textContent = `结算 (${selectedItems.size}件)`
      }
      
      // 单个商品点击
      const items = container.querySelectorAll('[data-item]')
      items.forEach(item => {
        const id = parseInt(item.getAttribute('data-item') || '0')
        item.addEventListener('click', () => {
          const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
          if (!checkbox) return
          
          if (selectedItems.has(id)) {
            selectedItems.delete(id)
            checkbox.style.background = 'transparent'
            checkbox.style.borderColor = '#ddd'
            checkbox.textContent = ''
          } else {
            selectedItems.add(id)
            checkbox.style.background = '#ff6b6b'
            checkbox.style.borderColor = '#ff6b6b'
            checkbox.textContent = '✓'
            checkbox.style.color = 'white'
            checkbox.style.fontSize = '12px'
            checkbox.style.fontWeight = 'bold'
          }
          updateTotal()
        })
        
        // 初始状态
        const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
        if (checkbox && selectedItems.has(id)) {
          checkbox.style.background = '#ff6b6b'
          checkbox.style.borderColor = '#ff6b6b'
          checkbox.textContent = '✓'
          checkbox.style.color = 'white'
          checkbox.style.fontSize = '12px'
          checkbox.style.fontWeight = 'bold'
        }
      })
      
      // 全选按钮
      const selectAllBtn = container.querySelector('[data-select-all]')
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const allSelected = selectedItems.size === 3
          if (allSelected) {
            selectedItems.clear()
          } else {
            selectedItems = new Set([1, 2, 3])
          }
          
          items.forEach(item => {
            const id = parseInt(item.getAttribute('data-item') || '0')
            const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
            if (!checkbox) return
            
            if (selectedItems.has(id)) {
              checkbox.style.background = '#ff6b6b'
              checkbox.style.borderColor = '#ff6b6b'
              checkbox.textContent = '✓'
              checkbox.style.color = 'white'
              checkbox.style.fontSize = '12px'
              checkbox.style.fontWeight = 'bold'
            } else {
              checkbox.style.background = 'transparent'
              checkbox.style.borderColor = '#ddd'
              checkbox.textContent = ''
            }
          })
          updateTotal()
        })
      }
      
      // 结算按钮
      const checkoutBtn = container.querySelector('[data-checkout-btn]')
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (selectedItems.size === 0) {
            alert('请选择商品')
            return
          }
          checkoutBtn.textContent = '结算成功！'
          ;(checkoutBtn as HTMLElement).style.background = '#00b894'
          setTimeout(() => {
            if (checkoutBtn) {
              checkoutBtn.textContent = `结算 (${selectedItems.size}件)`
              ;(checkoutBtn as HTMLElement).style.background = '#ff6b6b'
            }
          }, 1500)
        })
      }
    }
    
    // ==================== 打卡交互 ====================
    if (templateId === 'check_in') {
      const container = containerRef.current
      const statusEl = container.querySelector('[data-status]')
      const timeEl = container.querySelector('[data-time]')
      
      if (container && !container.hasAttribute('data-interacted')) {
        container.style.cursor = 'pointer'
        container.addEventListener('click', () => {
          container.setAttribute('data-interacted', 'true')
          container.style.transform = 'scale(0.98)'
          setTimeout(() => {
            container.style.transform = 'scale(1)'
          }, 150)
          
          if (statusEl) {
            statusEl.textContent = '打卡成功'
            ;(statusEl.parentElement as HTMLElement).style.background = '#d5f4e6'
          }
          
          if (timeEl) {
            const now = new Date()
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const seconds = String(now.getSeconds()).padStart(2, '0')
            timeEl.textContent = `${hours}:${minutes}:${seconds}`
          }
        })
      }
    }
    
    // ==================== 音乐播放器交互 ====================
    if (templateId === 'music_player') {
      const container = containerRef.current
      const playBtn = container.querySelector('[data-play-btn]') as HTMLElement
      
      if (playBtn) {
        let isPlaying = false
        playBtn.addEventListener('click', () => {
          isPlaying = !isPlaying
          playBtn.textContent = isPlaying ? '⏸' : '▶'
          
          if (isPlaying) {
            playBtn.style.animation = 'pulse 1s infinite'
          } else {
            playBtn.style.animation = 'none'
          }
        })
      }
    }
    
    // ==================== 优惠券交互 ====================
    if (templateId === 'coupon') {
      const container = containerRef.current.querySelector('[data-coupon]')
      if (!container) return
      
      // 倒计时
      const expireDateStr = message.theatre.htmlContent.match(/过期日期.*?placeholder.*?"([^"]+)"/)?.[1] || '2025-12-31'
      const expireDate = new Date(expireDateStr).getTime()
      
      const updateCountdown = () => {
        const now = Date.now()
        const diff = expireDate - now
        
        if (diff <= 0) {
          const countdownEl = container.querySelector('[data-countdown]')
          if (countdownEl) countdownEl.textContent = '已过期'
          return
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        const daysEl = container.querySelector('[data-days]')
        const hoursEl = container.querySelector('[data-hours]')
        const minutesEl = container.querySelector('[data-minutes]')
        
        if (daysEl) daysEl.textContent = String(days)
        if (hoursEl) hoursEl.textContent = String(hours)
        if (minutesEl) minutesEl.textContent = String(minutes)
      }
      
      updateCountdown()
      const interval = setInterval(updateCountdown, 60000) // 每分钟更新
      
      // 使用按钮
      const useBtn = container.querySelector('[data-use-btn]') as HTMLElement
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          useBtn.textContent = '已使用'
          useBtn.style.color = '#999'
          setTimeout(() => {
            if (useBtn) {
              useBtn.textContent = '立即使用'
              useBtn.style.color = '#ff6b6b'
            }
          }, 2000)
        })
      }
      
      return () => clearInterval(interval)
    }
    
    // ==================== 菜单交互 ====================
    if (templateId === 'menu') {
      const container = containerRef.current.querySelector('[data-menu]')
      if (!container) return
      
      const prices = [
        parseFloat(message.theatre.htmlContent.match(/¥(\d+)</)?.[1] || '0'),
        parseFloat(message.theatre.htmlContent.match(/¥\d+.*?¥(\d+)</)?.[1] || '0'),
        parseFloat(message.theatre.htmlContent.match(/¥\d+.*?¥\d+.*?¥(\d+)</)?.[1] || '0')
      ]
      
      const quantities = [0, 0, 0]
      
      const updateTotal = () => {
        let total = 0
        quantities.forEach((qty, idx) => {
          total += prices[idx] * qty
        })
        const totalEl = container.querySelector('[data-total]')
        if (totalEl) totalEl.textContent = `¥${total}`
      }
      
      const menuItems = container.querySelectorAll('[data-menu-item]')
      menuItems.forEach((item, index) => {
        const itemEl = item as HTMLElement
        const qtyEl = item.querySelector(`[data-qty="${index + 1}"]`) as HTMLElement
        
        item.addEventListener('click', () => {
          quantities[index]++
          if (quantities[index] > 9) quantities[index] = 0
          
          qtyEl.textContent = String(quantities[index])
          
          if (quantities[index] > 0) {
            qtyEl.style.background = '#d32f2f'
            qtyEl.style.color = 'white'
            itemEl.style.borderColor = '#d32f2f'
          } else {
            qtyEl.style.background = '#f5f5f5'
            qtyEl.style.color = '#999'
            itemEl.style.borderColor = 'transparent'
          }
          
          updateTotal()
        })
      })
    }
    
    // ==================== 备忘录交互 ====================
    if (templateId === 'memo') {
      const container = containerRef.current.querySelector('[data-memo]')
      if (!container) return
      
      let completedCount = 0
      const totalCount = 3
      
      const updateProgress = () => {
        const progressBar = container.querySelector('[data-progress-bar]') as HTMLElement
        const progressText = container.querySelector('[data-progress-text]')
        
        if (progressBar) {
          const percentage = (completedCount / totalCount) * 100
          progressBar.style.width = `${percentage}%`
        }
        if (progressText) {
          progressText.textContent = `${completedCount}/${totalCount}`
        }
      }
      
      // 待办事项点击
      const todoItems = container.querySelectorAll('[data-todo-item]')
      todoItems.forEach(item => {
        const id = item.getAttribute('data-todo-item')
        let isCompleted = false
        
        item.addEventListener('click', () => {
          const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
          const text = item.querySelector(`[data-text="${id}"]`) as HTMLElement
          
          if (!checkbox || !text) return
          
          isCompleted = !isCompleted
          
          if (isCompleted) {
            completedCount++
            checkbox.style.background = '#f59e0b'
            checkbox.style.borderColor = '#f59e0b'
            checkbox.textContent = '✓'
            checkbox.style.color = 'white'
            checkbox.style.fontSize = '14px'
            checkbox.style.fontWeight = 'bold'
            text.style.textDecoration = 'line-through'
            text.style.color = '#9ca3af'
          } else {
            completedCount--
            checkbox.style.background = 'transparent'
            checkbox.style.borderColor = '#d1d5db'
            checkbox.textContent = ''
            text.style.textDecoration = 'none'
            text.style.color = '#374151'
          }
          
          updateProgress()
        })
      })
    }
  }, [message.theatre?.templateId, message.theatre?.htmlContent])
  
  if (!message.theatre) {
    console.warn('⚠️ [TheatreMessage] message.theatre 为空')
    return null
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        [data-item]:hover {
          background: #f0f0f0 !important;
        }
        [data-play-btn]:hover {
          transform: scale(1.1) !important;
        }
      `}</style>
      <div className="my-4 max-w-md" ref={containerRef}>
        <div 
          className="theatre-content"
          dangerouslySetInnerHTML={{ __html: message.theatre.htmlContent }}
        />
      </div>
    </>
  )
}
