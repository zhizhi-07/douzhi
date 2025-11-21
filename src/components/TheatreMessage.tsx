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
      
      // 创建精致的银色渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#e8e8e8')
      gradient.addColorStop(0.5, '#c0c0c0')
      gradient.addColorStop(1, '#d8d8d8')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 添加金属质感纹理
      for (let i = 0; i < 150; i++) {
        const alpha = Math.random() * 0.15
        ctx.fillStyle = `rgba(${220 + Math.random() * 35}, ${220 + Math.random() * 35}, ${220 + Math.random() * 35}, ${alpha})`
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, Math.random() * 3)
      }
      
      // 绘制精致的"刮奖处"圆形水印
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.25)'
      ctx.lineWidth = 2.5
      ctx.font = 'bold 15px SimHei, Microsoft YaHei'
      ctx.fillStyle = 'rgba(140, 140, 140, 0.2)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const rows = 3
      const cols = 4
      const radius = 32
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = (col + 0.5) * (canvas.width / cols)
          const y = (row + 0.5) * (canvas.height / rows)
          
          // 绘制圆圈和光晕
          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
          
          // 绘制文字
          ctx.fillText('刮奖处', x, y)
        }
      }
      
      let isScratching = false
      let scratchedPixels = 0
      const totalPixels = canvas.width * canvas.height
      const particles: Array<{x: number, y: number, vx: number, vy: number, life: number}> = []
      
      const scratch = (x: number, y: number) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const canvasX = (x - rect.left) * scaleX
        const canvasY = (y - rect.top) * scaleY
        
        // 创建粒子效果
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: canvasX,
            y: canvasY,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1
          })
        }
        
        ctx.globalCompositeOperation = 'destination-out'
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 22, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        
        // 计算刮开面积
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let transparent = 0
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] === 0) transparent++
        }
        scratchedPixels = transparent
        
        // 刮开30%自动清除并显示庆祝效果
        if (scratchedPixels / totalPixels > 0.3) {
          canvas.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          canvas.style.opacity = '0'
          setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            canvas.style.pointerEvents = 'none'
          }, 800)
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
        const totalEl = container.querySelector('[data-total]') as HTMLElement
        const btnEl = container.querySelector('[data-checkout-btn]') as HTMLElement
        if (totalEl) {
          totalEl.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          totalEl.style.transform = 'scale(1.15)'
          totalEl.textContent = `¥${total}`
          setTimeout(() => {
            totalEl.style.transform = 'scale(1)'
          }, 300)
        }
        if (btnEl) btnEl.textContent = `结算 (${selectedItems.size}件)`
      }
      
      // 单个商品点击
      const items = container.querySelectorAll('[data-item]')
      items.forEach(item => {
        const id = parseInt(item.getAttribute('data-item') || '0')
        const itemEl = item as HTMLElement
        itemEl.style.cursor = 'pointer'
        itemEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        
        item.addEventListener('click', (e) => {
          const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
          if (!checkbox) return
          
          // 创建波纹效果
          const ripple = document.createElement('span')
          const rect = itemEl.getBoundingClientRect()
          const size = Math.max(rect.width, rect.height)
          const x = (e as MouseEvent).clientX - rect.left - size / 2
          const y = (e as MouseEvent).clientY - rect.top - size / 2
          
          ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 107, 107, 0.3);
            left: ${x}px;
            top: ${y}px;
            animation: ripple 0.6s ease-out;
            pointer-events: none;
          `
          itemEl.style.position = 'relative'
          itemEl.appendChild(ripple)
          setTimeout(() => ripple.remove(), 600)
          
          checkbox.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          
          if (selectedItems.has(id)) {
            selectedItems.delete(id)
            checkbox.style.background = 'transparent'
            checkbox.style.borderColor = '#ddd'
            checkbox.style.transform = 'scale(0.8)'
            checkbox.textContent = ''
            itemEl.style.opacity = '0.6'
          } else {
            selectedItems.add(id)
            checkbox.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8787)'
            checkbox.style.borderColor = '#ff6b6b'
            checkbox.style.transform = 'scale(1)'
            checkbox.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)'
            checkbox.textContent = '✓'
            checkbox.style.color = 'white'
            checkbox.style.fontSize = '12px'
            checkbox.style.fontWeight = 'bold'
            itemEl.style.opacity = '1'
          }
          updateTotal()
        })
        
        // 初始状态
        const checkbox = item.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
        if (checkbox && selectedItems.has(id)) {
          checkbox.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          checkbox.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8787)'
          checkbox.style.borderColor = '#ff6b6b'
          checkbox.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)'
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
      const checkoutBtn = container.querySelector('[data-checkout-btn]') as HTMLElement
      if (checkoutBtn) {
        checkoutBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)'
        checkoutBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        checkoutBtn.style.cursor = 'pointer'
        checkoutBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'
        
        checkoutBtn.addEventListener('mouseenter', () => {
          checkoutBtn.style.transform = 'translateY(-2px)'
          checkoutBtn.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)'
        })
        
        checkoutBtn.addEventListener('mouseleave', () => {
          checkoutBtn.style.transform = 'translateY(0)'
          checkoutBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'
        })
        
        checkoutBtn.addEventListener('click', () => {
          if (selectedItems.size === 0) {
            checkoutBtn.style.animation = 'shake 0.5s'
            setTimeout(() => {
              checkoutBtn.style.animation = 'none'
            }, 500)
            return
          }
          
          checkoutBtn.style.transform = 'scale(0.95)'
          setTimeout(() => {
            checkoutBtn.style.transform = 'scale(1)'
            checkoutBtn.textContent = '结算成功！'
            checkoutBtn.style.background = 'linear-gradient(135deg, #00b894, #00d2b0)'
            checkoutBtn.style.boxShadow = '0 4px 12px rgba(0, 184, 148, 0.4)'
            
            // 成功粒子效果
            for (let i = 0; i < 15; i++) {
              const particle = document.createElement('div')
              particle.textContent = '✨'
              particle.style.cssText = `
                position: fixed;
                font-size: 20px;
                pointer-events: none;
                animation: burst 1s ease-out forwards;
              `
              particle.style.left = `${checkoutBtn.getBoundingClientRect().left + Math.random() * checkoutBtn.offsetWidth}px`
              particle.style.top = `${checkoutBtn.getBoundingClientRect().top + Math.random() * checkoutBtn.offsetHeight}px`
              
              document.body.appendChild(particle)
              setTimeout(() => particle.remove(), 1000)
            }
            
            setTimeout(() => {
              if (checkoutBtn) {
                checkoutBtn.textContent = `结算 (${selectedItems.size}件)`
                checkoutBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)'
                checkoutBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'
              }
            }, 2000)
          }, 150)
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
    
    // ==================== 倒计时交互 ====================
    if (templateId === 'countdown') {
      const container = containerRef.current
      let targetDate: number
      
      try {
        const dateStr = message.theatre.htmlContent.match(/目标日期.*?(\d{4}-\d{2}-\d{2})/)?.[1]
        if (dateStr) {
          targetDate = new Date(dateStr).getTime()
          
          const updateCountdown = () => {
            const now = Date.now()
            const diff = targetDate - now
            const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
            
            const daysEl = container.querySelector('div[style*="font-size: 72px"]') as HTMLElement
            if (daysEl && daysEl.textContent !== String(days)) {
              daysEl.style.transition = 'transform 0.3s'
              daysEl.style.transform = 'scale(1.2)'
              setTimeout(() => {
                daysEl.textContent = String(days)
                daysEl.style.transform = 'scale(1)'
              }, 150)
            }
          }
          
          updateCountdown()
          const interval = setInterval(updateCountdown, 1000 * 60 * 60)
          return () => clearInterval(interval)
        }
      } catch (e) {
        console.error('倒计时解析失败:', e)
      }
    }
    
    // ==================== 生日贺卡交互 ====================
    if (templateId === 'birthday_card') {
      const container = containerRef.current
      const candles = container.querySelectorAll('div[style*="background: #e74c3c"]')
      
      candles.forEach((candle, index) => {
        const flame = candle.querySelector('div[style*="background: #f39c12"]') as HTMLElement
        if (!flame) return
        
        // 创建火焰渐变效果
        flame.style.background = 'linear-gradient(to top, #f39c12, #e67e22, #f1c40f)'
        flame.style.boxShadow = `
          0 0 20px rgba(241, 196, 15, 0.8),
          0 0 40px rgba(243, 156, 18, 0.6),
          0 0 60px rgba(230, 126, 34, 0.4)
        `
        flame.style.filter = 'blur(1px)'
        
        let isLit = true
        
        candle.addEventListener('click', () => {
          const candleEl = candle as HTMLElement
          candleEl.style.cursor = 'pointer'
          
          if (isLit) {
            // 吹灭动画
            flame.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            flame.style.opacity = '0'
            flame.style.transform = 'scale(0.5) translateY(-20px)'
            flame.style.filter = 'blur(8px)'
            
            // 创建烟雾效果
            for (let i = 0; i < 5; i++) {
              const smoke = document.createElement('div')
              smoke.style.cssText = `
                position: absolute;
                top: 0;
                left: 50%;
                width: 8px;
                height: 8px;
                background: rgba(150, 150, 150, 0.6);
                border-radius: 50%;
                transform: translate(-50%, 0);
                animation: smokeRise ${1 + i * 0.2}s ease-out forwards;
                pointer-events: none;
              `
              
              if (i === 0) {
                const style = document.createElement('style')
                style.textContent = `
                  @keyframes smokeRise {
                    to {
                      transform: translate(-50%, -40px) scale(1.5);
                      opacity: 0;
                    }
                  }
                `
                container.appendChild(style)
              }
              
              const candleParent = candle.parentElement as HTMLElement
              candleParent.style.position = 'relative'
              candleParent.appendChild(smoke)
              setTimeout(() => smoke.remove(), 1200)
            }
            
            isLit = false
          } else {
            // 点燃动画
            flame.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            flame.style.opacity = '1'
            flame.style.transform = 'scale(1) translateY(0)'
            flame.style.filter = 'blur(1px)'
            
            // 点燃火花效果
            for (let i = 0; i < 8; i++) {
              const spark = document.createElement('div')
              spark.textContent = '✨'
              spark.style.cssText = `
                position: absolute;
                top: 0;
                left: 50%;
                font-size: 12px;
                transform: translate(-50%, 0);
                animation: sparkBurst ${0.6 + i * 0.1}s ease-out forwards;
                pointer-events: none;
              `
              spark.style.setProperty('--angle', `${i * 45}deg`)
              
              if (i === 0) {
                const style = document.createElement('style')
                style.textContent = `
                  @keyframes sparkBurst {
                    to {
                      transform: translate(-50%, 0) 
                                 translateX(calc(cos(var(--angle)) * 30px))
                                 translateY(calc(sin(var(--angle)) * 30px));
                      opacity: 0;
                    }
                  }
                `
                container.appendChild(style)
              }
              
              const candleParent = candle.parentElement as HTMLElement
              candleParent.appendChild(spark)
              setTimeout(() => spark.remove(), 700)
            }
            
            isLit = true
          }
        })
        
        // 初始真实火焰闪烁动画
        flame.style.animation = `flicker ${0.8 + index * 0.2}s infinite`
        flame.style.transformOrigin = 'bottom center'
      })
    }
    
    // ==================== 通话记录交互 ====================
    if (templateId === 'call_log') {
      const container = containerRef.current
      const records = container.querySelectorAll('div[style*="border-left: 3px"]')
      
      records.forEach(record => {
        const content = record.querySelector('div[style*="font-size: 13px"]') as HTMLElement
        if (!content) return
        
        let isExpanded = true
        const originalHeight = content.offsetHeight
        content.style.maxHeight = originalHeight + 'px'
        content.style.overflow = 'hidden'
        content.style.transition = 'max-height 0.3s'
        
        record.addEventListener('click', () => {
          if (isExpanded) {
            content.style.maxHeight = '0px'
            isExpanded = false
          } else {
            content.style.maxHeight = originalHeight + 'px'
            isExpanded = true
          }
        })
      })
    }
    
    // ==================== 朋友圈动态交互 ====================
    if (templateId === 'moments_post') {
      const container = containerRef.current
      const posts = container.querySelectorAll('div[style*="background: white"][style*="padding: 14px"]')
      
      posts.forEach(post => {
        const likeArea = post.querySelector('div[style*="赞"]') as HTMLElement
        if (!likeArea) return
        
        let hasLiked = false
        
        post.addEventListener('dblclick', () => {
          if (!hasLiked) {
            const currentLikes = likeArea.textContent || ''
            const newLikes = currentLikes.includes('赞 ') ? currentLikes + '、我' : '赞 我'
            likeArea.textContent = newLikes
            hasLiked = true
            
            const postEl = post as HTMLElement
            postEl.style.transform = 'scale(0.98)'
            setTimeout(() => {
              postEl.style.transform = 'scale(1)'
            }, 100)
          }
        })
        
        ;(post as HTMLElement).style.transition = 'transform 0.2s'
      })
    }
    
    // ==================== 课程表高亮交互 ====================
    if (templateId === 'class_schedule') {
      const container = containerRef.current
      const classes = container.querySelectorAll('div[style*="padding: 10px"]')
      
      const now = new Date()
      const hour = now.getHours()
      
      let currentClassIndex = -1
      if (hour >= 8 && hour < 9) currentClassIndex = 0
      else if (hour >= 9 && hour < 10) currentClassIndex = 1
      else if (hour >= 10 && hour < 11) currentClassIndex = 2
      else if (hour >= 11 && hour < 12) currentClassIndex = 3
      else if (hour >= 14 && hour < 15) currentClassIndex = 4
      else if (hour >= 15 && hour < 16) currentClassIndex = 5
      else if (hour >= 18 && hour < 19) currentClassIndex = 6
      else if (hour >= 19 && hour < 20) currentClassIndex = 7
      
      if (currentClassIndex >= 0 && classes[currentClassIndex]) {
        const currentClass = classes[currentClassIndex] as HTMLElement
        currentClass.style.animation = 'pulse 2s infinite'
        currentClass.style.boxShadow = '0 0 0 3px rgba(108, 92, 231, 0.3)'
      }
    }
    
    // ==================== 结婚证/离婚证翻页交互 ====================
    if (templateId === 'marriage_certificate' || templateId === 'divorce_certificate') {
      const container = containerRef.current
      const book = container.querySelector('div[style*="display: flex"]') as HTMLElement
      if (!book) return
      
      let isFlipped = false
      book.style.cursor = 'pointer'
      book.style.transition = 'transform 0.8s'
      book.style.transformStyle = 'preserve-3d'
      
      container.addEventListener('click', () => {
        isFlipped = !isFlipped
        if (isFlipped) {
          book.style.transform = 'rotateY(15deg) scale(1.05)'
        } else {
          book.style.transform = 'rotateY(0deg) scale(1)'
        }
      })
    }
    
    // ==================== 名片扫描动画 ====================
    if (templateId === 'business_card') {
      const container = containerRef.current
      container.style.position = 'relative'
      let scanCount = 0
      
      container.addEventListener('click', () => {
        scanCount++
        const scanLine = document.createElement('div')
        scanLine.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          animation: scan 1.5s ease-out;
          pointer-events: none;
          z-index: 10;
        `
        
        const style = document.createElement('style')
        style.textContent = `
          @keyframes scan {
            0% { top: 0; opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `
        container.appendChild(style)
        container.appendChild(scanLine)
        
        setTimeout(() => {
          scanLine.remove()
          style.remove()
        }, 1500)
        
        if (scanCount === 3) {
          container.style.animation = 'shake 0.5s'
          setTimeout(() => {
            container.style.animation = 'none'
          }, 500)
        }
      })
    }
    
    // ==================== 电影票/演唱会票二维码扫描 ====================
    if (templateId === 'movie_ticket' || templateId === 'concert_ticket' || templateId === 'boarding_pass') {
      const container = containerRef.current
      const qrcode = container.querySelector('div[style*="background: #000"], div[style*="background: white"]') as HTMLElement
      
      if (qrcode) {
        qrcode.style.cursor = 'pointer'
        qrcode.addEventListener('click', () => {
          qrcode.style.animation = 'pulse 0.5s'
          setTimeout(() => {
            qrcode.style.animation = 'none'
          }, 500)
        })
      }
    }
    
    // ==================== 闹钟开关交互 ====================
    if (templateId === 'alarm_clock') {
      const container = containerRef.current
      const alarms = container.querySelectorAll('div[style*="padding"]')
      
      alarms.forEach(alarm => {
        const switchBtn = document.createElement('div')
        switchBtn.style.cssText = `
          width: 40px;
          height: 22px;
          background: #ccc;
          border-radius: 11px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        `
        
        const switchCircle = document.createElement('div')
        switchCircle.style.cssText = `
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.3s;
        `
        
        switchBtn.appendChild(switchCircle)
        
        let isOn = Math.random() > 0.5
        if (isOn) {
          switchBtn.style.background = '#00b894'
          switchCircle.style.left = '20px'
        }
        
        switchBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          isOn = !isOn
          if (isOn) {
            switchBtn.style.background = '#00b894'
            switchCircle.style.left = '20px'
          } else {
            switchBtn.style.background = '#ccc'
            switchCircle.style.left = '2px'
          }
        })
        
        alarm.appendChild(switchBtn)
      })
    }
    
    // ==================== 小票打印动画 ====================
    if (templateId === 'receipt') {
      const container = containerRef.current
      container.style.position = 'relative'
      const receipt = container.querySelector('[data-receipt]') as HTMLElement
      if (!receipt) return
      
      receipt.style.cursor = 'pointer'
      let printCount = 0
      
      receipt.addEventListener('dblclick', () => {
        printCount++
        receipt.style.animation = 'shake 0.3s'
        
        setTimeout(() => {
          receipt.style.animation = 'none'
        }, 300)
        
        if (printCount >= 3) {
          const printMsg = document.createElement('div')
          printMsg.textContent = '正在打印...'
          printMsg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
          `
          container.appendChild(printMsg)
          
          setTimeout(() => {
            printMsg.remove()
            printCount = 0
          }, 2000)
        }
      })
    }
    
    // ==================== 日记翻页动画 ====================
    if (templateId === 'diary') {
      const container = containerRef.current
      const diary = container.querySelector('div[style*="background: #f9f6f0"]') as HTMLElement
      if (!diary) return
      
      diary.style.cursor = 'pointer'
      diary.style.transition = 'transform 0.3s'
      
      diary.addEventListener('mouseenter', () => {
        diary.style.transform = 'rotateZ(-1deg) translateY(-2px)'
        diary.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
      })
      
      diary.addEventListener('mouseleave', () => {
        diary.style.transform = 'rotateZ(0deg) translateY(0)'
        diary.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
      })
    }
    
    // ==================== 明信片邮戳动画 ====================
    if (templateId === 'postcard') {
      const container = containerRef.current
      const stamp = container.querySelector('div[style*="border: 3px solid"]') as HTMLElement
      if (!stamp) return
      
      stamp.style.cursor = 'pointer'
      stamp.style.transition = 'transform 0.3s'
      
      stamp.addEventListener('click', () => {
        stamp.style.animation = 'shake 0.5s'
        setTimeout(() => {
          stamp.style.animation = 'none'
        }, 500)
      })
    }
    
    // ==================== 证书印章动画 ====================
    if (templateId === 'certificate') {
      const container = containerRef.current
      const seal = container.querySelector('div[style*="border: 2px solid #e74c3c"]') as HTMLElement
      if (!seal) return
      
      seal.style.cursor = 'pointer'
      seal.style.transition = 'all 0.3s'
      let stampCount = 0
      
      seal.addEventListener('click', () => {
        stampCount++
        seal.style.transform = 'scale(1.1) rotate(5deg)'
        seal.style.borderColor = '#ff0000'
        seal.style.color = '#ff0000'
        
        setTimeout(() => {
          seal.style.transform = 'scale(1) rotate(0deg)'
          if (stampCount >= 3) {
            seal.style.opacity = '1'
            seal.style.filter = 'drop-shadow(0 0 8px rgba(231, 76, 60, 0.6))'
          }
        }, 200)
      })
    }
    
    // ==================== 火车票验票动画 ====================
    if (templateId === 'train_ticket') {
      const container = containerRef.current
      const ticket = container.querySelector('div[style*="border: 3px solid #003d82"]') as HTMLElement
      if (!ticket) return
      
      ticket.style.cursor = 'pointer'
      let checkCount = 0
      
      ticket.addEventListener('click', () => {
        checkCount++
        ticket.style.animation = 'pulse 0.5s'
        
        if (checkCount === 3) {
          const checkMark = document.createElement('div')
          checkMark.textContent = '已检票'
          checkMark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-size: 48px;
            font-weight: bold;
            color: #00b894;
            opacity: 0.3;
            pointer-events: none;
            z-index: 5;
          `
          container.style.position = 'relative'
          container.appendChild(checkMark)
        }
        
        setTimeout(() => {
          ticket.style.animation = 'none'
        }, 500)
      })
    }
    
    // ==================== 短信验证码复制动画 ====================
    if (templateId === 'sms_screenshot') {
      const container = containerRef.current
      const content = container.querySelector('div[style*="background: #f8f9fa"]') as HTMLElement
      if (!content) return
      
      content.style.cursor = 'pointer'
      content.addEventListener('click', () => {
        const codeMatch = content.textContent?.match(/\d{4,6}/)
        if (codeMatch) {
          const code = codeMatch[0]
          navigator.clipboard.writeText(code).then(() => {
            const toast = document.createElement('div')
            toast.textContent = '验证码已复制'
            toast.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 12px;
              z-index: 9999;
            `
            document.body.appendChild(toast)
            
            setTimeout(() => {
              toast.remove()
            }, 2000)
          })
        }
        
        content.style.animation = 'pulse 0.3s'
        setTimeout(() => {
          content.style.animation = 'none'
        }, 300)
      })
    }
    
    // ==================== 停车票倒计时动画 ====================
    if (templateId === 'parking_ticket') {
      const container = containerRef.current
      const timeElements = container.querySelectorAll('div[style*="font-size: 13px"]')
      
      let exitTime: Date | null = null
      timeElements.forEach(el => {
        const text = el.textContent || ''
        if (text.includes('出场时间')) {
          const timeStr = text.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/)?.[0]
          if (timeStr) {
            exitTime = new Date(timeStr)
          }
        }
      })
      
      if (exitTime) {
        const updateTimer = () => {
          const now = new Date()
          const diff = exitTime!.getTime() - now.getTime()
          if (diff > 0) {
            const minutes = Math.floor(diff / 1000 / 60)
            const feeEl = container.querySelector('div[style*="font-size: 26px"]') as HTMLElement
            if (feeEl && minutes < 15) {
              feeEl.style.animation = 'pulse 1s infinite'
              feeEl.style.color = '#e74c3c'
            }
          }
        }
        
        updateTimer()
        const interval = setInterval(updateTimer, 60000)
        return () => clearInterval(interval)
      }
    }
    
    // ==================== 挂号单叫号动画 ====================
    if (templateId === 'hospital_registration') {
      const container = containerRef.current
      const numberEl = container.querySelector('div[style*="font-size: 32px"]') as HTMLElement
      if (!numberEl) return
      
      numberEl.style.cursor = 'pointer'
      let callCount = 0
      
      numberEl.addEventListener('click', () => {
        callCount++
        numberEl.style.animation = 'pulse 0.5s'
        numberEl.style.transform = 'scale(1.2)'
        
        if (callCount === 3) {
          const callMsg = document.createElement('div')
          callMsg.textContent = '请患者就诊'
          callMsg.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #00b894;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            animation: pulse 1s infinite;
          `
          container.style.position = 'relative'
          container.appendChild(callMsg)
          
          setTimeout(() => {
            callMsg.remove()
            callCount = 0
          }, 3000)
        }
        
        setTimeout(() => {
          numberEl.style.animation = 'none'
          numberEl.style.transform = 'scale(1)'
        }, 500)
      })
    }
    
    // ==================== 请假条批准动画 ====================
    if (templateId === 'leave_request') {
      const container = containerRef.current
      const seal = container.querySelector('div[style*="border: 2px solid #e74c3c"]') as HTMLElement
      if (!seal) return
      
      seal.style.cursor = 'pointer'
      seal.style.transition = 'all 0.3s'
      
      seal.addEventListener('click', () => {
        seal.style.transform = 'scale(1.2) rotate(360deg)'
        seal.style.borderWidth = '3px'
        seal.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'
        
        setTimeout(() => {
          seal.style.transform = 'scale(1) rotate(0deg)'
          const approved = document.createElement('div')
          approved.textContent = '已批准'
          approved.style.cssText = `
            position: absolute;
            top: 50%;
            right: 20%;
            transform: translate(50%, -50%) rotate(-15deg);
            font-size: 36px;
            font-weight: bold;
            color: #e74c3c;
            opacity: 0.5;
            pointer-events: none;
          `
          container.style.position = 'relative'
          container.appendChild(approved)
        }, 300)
      })
    }
    
    // ==================== 诊断书处方动画 ====================
    if (templateId === 'diagnosis') {
      const container = containerRef.current
      const diagnosis = container.querySelector('div[style*="background: #fff5f5"]') as HTMLElement
      if (!diagnosis) return
      
      diagnosis.style.cursor = 'pointer'
      diagnosis.style.transition = 'all 0.3s'
      
      diagnosis.addEventListener('click', () => {
        diagnosis.style.background = '#fff9f0'
        diagnosis.style.borderColor = '#f39c12'
        diagnosis.style.transform = 'scale(1.05)'
        
        setTimeout(() => {
          diagnosis.style.transform = 'scale(1)'
        }, 300)
      })
    }
    
    // ==================== 步数排行榜动画 ====================
    if (templateId === 'step_ranking') {
      const container = containerRef.current
      const myRank = container.querySelector('div[style*="font-weight: bold"]') as HTMLElement
      
      if (myRank) {
        myRank.style.animation = 'pulse 2s infinite'
        myRank.style.cursor = 'pointer'
        
        myRank.addEventListener('click', () => {
          myRank.style.transform = 'scale(1.1)'
          setTimeout(() => {
            myRank.style.transform = 'scale(1)'
          }, 200)
        })
      }
    }
    
    // ==================== 屏幕时间统计动画 ====================
    if (templateId === 'screen_time') {
      const container = containerRef.current
      const apps = container.querySelectorAll('div[style*="padding"]')
      
      apps.forEach((app, index) => {
        const appEl = app as HTMLElement
        appEl.style.cursor = 'pointer'
        appEl.style.transition = 'all 0.3s'
        
        appEl.addEventListener('mouseenter', () => {
          appEl.style.transform = 'translateX(5px)'
          appEl.style.backgroundColor = '#f0f0f0'
        })
        
        appEl.addEventListener('mouseleave', () => {
          appEl.style.transform = 'translateX(0)'
          appEl.style.backgroundColor = 'transparent'
        })
      })
    }
    
    // ==================== MBTI测试结果动画 ====================
    if (templateId === 'mbti_test') {
      const container = containerRef.current
      const resultType = container.querySelector('div[style*="font-size: 32px"]') as HTMLElement
      
      if (resultType) {
        resultType.style.cursor = 'pointer'
        let clickCount = 0
        
        resultType.addEventListener('click', () => {
          clickCount++
          const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a']
          const color = colors[clickCount % colors.length]
          
          resultType.style.color = color
          resultType.style.transform = 'rotate(360deg) scale(1.2)'
          
          setTimeout(() => {
            resultType.style.transform = 'rotate(0deg) scale(1)'
          }, 500)
        })
      }
    }
    
    // ==================== 学生证翻卡动画 ====================
    if (templateId === 'student_card') {
      const container = containerRef.current
      const card = container.querySelector('div[style*="background"]') as HTMLElement
      if (!card) return
      
      card.style.cursor = 'pointer'
      card.style.transition = 'transform 0.6s'
      card.style.transformStyle = 'preserve-3d'
      let isFlipped = false
      
      card.addEventListener('click', () => {
        isFlipped = !isFlipped
        if (isFlipped) {
          card.style.transform = 'rotateY(180deg)'
        } else {
          card.style.transform = 'rotateY(0deg)'
        }
      })
    }
    
    // ==================== 会员卡扫码动画 ====================
    if (templateId === 'vip_card') {
      const container = containerRef.current
      const cardNumber = container.querySelector('div[style*="font-family: "]') as HTMLElement
      
      if (cardNumber) {
        cardNumber.style.cursor = 'pointer'
        
        cardNumber.addEventListener('click', () => {
          const scanEffect = document.createElement('div')
          scanEffect.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: linear-gradient(180deg, transparent 40%, rgba(0,255,0,0.3) 50%, transparent 60%);
            animation: scanDown 1s ease-out;
            pointer-events: none;
          `
          
          const style = document.createElement('style')
          style.textContent = `
            @keyframes scanDown {
              from { top: -100%; }
              to { top: 100%; }
            }
          `
          
          container.style.position = 'relative'
          container.appendChild(style)
          container.appendChild(scanEffect)
          
          setTimeout(() => {
            scanEffect.remove()
            style.remove()
          }, 1000)
        })
      }
    }
    
    // ==================== 砍价进度条动画 ====================
    if (templateId === 'bargain') {
      const container = containerRef.current
      const helpBtn = container.querySelector('button, div[style*="cursor: pointer"]') as HTMLElement
      
      if (helpBtn) {
        let helped = false
        helpBtn.addEventListener('click', () => {
          if (!helped) {
            helped = true
            helpBtn.textContent = '已帮砍'
            helpBtn.style.background = '#00b894'
            helpBtn.style.animation = 'pulse 0.5s'
            
            const priceEl = container.querySelector('div[style*="font-size: 32px"]') as HTMLElement
            if (priceEl) {
              const currentPrice = parseFloat(priceEl.textContent?.replace(/[^0-9.]/g, '') || '0')
              const newPrice = (currentPrice - Math.random() * 5).toFixed(2)
              priceEl.textContent = `¥${newPrice}`
              priceEl.style.animation = 'shake 0.5s'
            }
          }
        })
      }
    }
    
    // ==================== 拼团倒计时动画 ====================
    if (templateId === 'group_buy') {
      const container = containerRef.current
      const timeLeft = container.querySelector('div[style*="剩余"]') as HTMLElement
      
      if (timeLeft && timeLeft.textContent) {
        const updateTime = () => {
          const match = timeLeft.textContent?.match(/(\d+):(\d+):(\d+)/)
          if (match) {
            let [_, h, m, s] = match.map(Number)
            s--
            if (s < 0) {
              s = 59
              m--
              if (m < 0) {
                m = 59
                h--
              }
            }
            
            if (h >= 0) {
              timeLeft.textContent = `剩余 ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
              
              if (h === 0 && m < 5) {
                timeLeft.style.color = '#e74c3c'
                timeLeft.style.animation = 'pulse 1s infinite'
              }
            }
          }
        }
        
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
      }
    }
    
    // ==================== 外卖评价星级交互 ====================
    if (templateId === 'delivery_review') {
      const container = containerRef.current
      const stars = container.querySelectorAll('span, div')
      
      let rating = 0
      stars.forEach((star, index) => {
        const starEl = star as HTMLElement
        if (starEl.textContent?.includes('★') || starEl.textContent?.includes('星')) {
          starEl.style.cursor = 'pointer'
          
          starEl.addEventListener('click', () => {
            rating = index + 1
            starEl.style.transform = 'scale(1.3)'
            starEl.style.color = '#ffd700'
            
            setTimeout(() => {
              starEl.style.transform = 'scale(1)'
            }, 300)
          })
        }
      })
    }
    
    // ==================== 导航路线动画 ====================
    if (templateId === 'navigation') {
      const container = containerRef.current
      const route = container.querySelector('svg, div[style*="path"]') as HTMLElement
      
      if (route) {
        let progress = 0
        const animateRoute = () => {
          progress += 2
          if (progress > 100) progress = 0
          
          route.style.strokeDasharray = `${progress} ${100 - progress}`
          requestAnimationFrame(animateRoute)
        }
        
        animateRoute()
      }
    }
    
    // ==================== 物流跟踪时间轴动画 ====================
    if (templateId === 'logistics_tracking') {
      const container = containerRef.current
      const records = container.querySelectorAll('div[style*="padding"]')
      
      records.forEach((record, index) => {
        const recordEl = record as HTMLElement
        recordEl.style.opacity = '0'
        recordEl.style.transform = 'translateX(-20px)'
        recordEl.style.transition = 'all 0.5s'
        
        setTimeout(() => {
          recordEl.style.opacity = '1'
          recordEl.style.transform = 'translateX(0)'
        }, index * 200)
      })
    }
    
    // ==================== 排行榜滚动高亮 ====================
    if (templateId === 'leaderboard') {
      const container = containerRef.current
      const ranks = container.querySelectorAll('div[style*="padding"]')
      
      let currentHighlight = 0
      const highlightNext = () => {
        ranks.forEach((rank, i) => {
          const rankEl = rank as HTMLElement
          if (i === currentHighlight) {
            rankEl.style.backgroundColor = '#fff9e6'
            rankEl.style.transform = 'translateX(5px)'
          } else {
            rankEl.style.backgroundColor = 'transparent'
            rankEl.style.transform = 'translateX(0)'
          }
          rankEl.style.transition = 'all 0.3s'
        })
        
        currentHighlight = (currentHighlight + 1) % ranks.length
      }
      
      const interval = setInterval(highlightNext, 2000)
      return () => clearInterval(interval)
    }
    
    // ==================== 睡眠报告动画 ====================
    if (templateId === 'sleep_report') {
      const container = containerRef.current
      const score = container.querySelector('div[style*="font-size: 48px"]') as HTMLElement
      
      if (score) {
        let currentScore = 0
        const targetScore = parseInt(score.textContent || '0')
        
        const animateScore = () => {
          if (currentScore < targetScore) {
            currentScore += 2
            score.textContent = String(Math.min(currentScore, targetScore))
            requestAnimationFrame(animateScore)
          }
        }
        
        animateScore()
      }
    }
    
    // ==================== 体检报告交互 ====================
    if (templateId === 'health_checkup') {
      const container = containerRef.current
      const items = container.querySelectorAll('div[style*="padding"]')
      
      items.forEach(item => {
        const itemEl = item as HTMLElement
        itemEl.style.cursor = 'pointer'
        itemEl.style.transition = 'all 0.3s'
        
        itemEl.addEventListener('click', () => {
          itemEl.style.backgroundColor = '#e8f5e9'
          itemEl.style.borderLeft = '4px solid #00b894'
          
          setTimeout(() => {
            itemEl.style.backgroundColor = 'transparent'
            itemEl.style.borderLeft = 'none'
          }, 1000)
        })
      })
    }
    
    // ==================== 年度账单翻页动画 ====================
    if (templateId === 'yearly_bill') {
      const container = containerRef.current
      const totalAmount = container.querySelector('div[style*="font-size: 36px"]') as HTMLElement
      
      if (totalAmount) {
        totalAmount.style.cursor = 'pointer'
        
        totalAmount.addEventListener('click', () => {
          totalAmount.style.transform = 'scale(1.2) rotate(5deg)'
          totalAmount.style.color = '#e74c3c'
          
          setTimeout(() => {
            totalAmount.style.transform = 'scale(1) rotate(0deg)'
            totalAmount.style.color = 'inherit'
          }, 500)
        })
      }
    }
    
    // ==================== 时间胶囊开启动画 ====================
    if (templateId === 'time_capsule') {
      const container = containerRef.current
      const capsule = container.querySelector('div[style*="background"]') as HTMLElement
      if (!capsule) return
      
      capsule.style.cursor = 'pointer'
      let isOpened = false
      
      capsule.addEventListener('click', () => {
        if (!isOpened) {
          isOpened = true
          capsule.style.animation = 'shake 0.5s'
          
          setTimeout(() => {
            capsule.style.transform = 'scale(1.1)'
            capsule.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)'
            
            const openMsg = document.createElement('div')
            openMsg.textContent = '已开启'
            openMsg.style.cssText = `
              position: absolute;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, #ffd700, #ffed4e);
              color: #000;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
            `
            container.style.position = 'relative'
            container.appendChild(openMsg)
          }, 500)
        }
      })
    }
    
    // ==================== 树洞点赞评论动画 ====================
    if (templateId === 'confession_wall') {
      const container = containerRef.current
      const likeBtn = container.querySelector('div[style*="点赞"]') as HTMLElement
      const commentBtn = container.querySelector('div[style*="评论"]') as HTMLElement
      
      if (likeBtn) {
        let likeCount = parseInt(likeBtn.textContent?.match(/\d+/)?.[0] || '0')
        likeBtn.style.cursor = 'pointer'
        
        likeBtn.addEventListener('click', () => {
          likeCount++
          likeBtn.textContent = `点赞 ${likeCount}`
          likeBtn.style.transform = 'scale(1.3)'
          likeBtn.style.color = '#e74c3c'
          
          setTimeout(() => {
            likeBtn.style.transform = 'scale(1)'
          }, 300)
        })
      }
      
      if (commentBtn) {
        let commentCount = parseInt(commentBtn.textContent?.match(/\d+/)?.[0] || '0')
        commentBtn.style.cursor = 'pointer'
        
        commentBtn.addEventListener('click', () => {
          commentCount++
          commentBtn.textContent = `评论 ${commentCount}`
          commentBtn.style.animation = 'pulse 0.5s'
        })
      }
    }
    
    // ==================== 表白墙心跳动画 ====================
    if (templateId === 'confession_board') {
      const container = containerRef.current
      const heart = document.createElement('div')
      heart.textContent = '♥'
      heart.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 48px;
        color: #ff6b9d;
        animation: heartBeat 1.5s infinite;
        cursor: pointer;
      `
      
      const style = document.createElement('style')
      style.textContent = `
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          10%, 30% { transform: scale(1.2); }
          20%, 40% { transform: scale(1.1); }
        }
      `
      
      container.style.position = 'relative'
      container.appendChild(style)
      container.appendChild(heart)
      
      heart.addEventListener('click', () => {
        heart.style.transform = 'scale(1.5)'
        setTimeout(() => {
          heart.style.transform = 'scale(1)'
        }, 300)
      })
    }
    
    // ==================== 直播打赏特效 ====================
    if (templateId === 'live_donation') {
      const container = containerRef.current
      const giftBtn = container.querySelector('button, div[style*="cursor: pointer"]') as HTMLElement
      
      if (giftBtn) {
        giftBtn.addEventListener('click', () => {
          for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div')
            particle.textContent = '💎'
            particle.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              font-size: 24px;
              pointer-events: none;
              animation: burst 1s ease-out forwards;
            `
            particle.style.setProperty('--angle', `${Math.random() * 360}deg`)
            
            const style = document.createElement('style')
            style.textContent = `
              @keyframes burst {
                to {
                  transform: translate(
                    calc(cos(var(--angle)) * 100px),
                    calc(sin(var(--angle)) * 100px)
                  );
                  opacity: 0;
                }
              }
            `
            
            container.style.position = 'relative'
            container.appendChild(style)
            container.appendChild(particle)
            
            setTimeout(() => {
              particle.remove()
              style.remove()
            }, 1000)
          }
        })
      }
    }
    
    // ==================== 退款申请进度动画 ====================
    if (templateId === 'refund_request') {
      const container = containerRef.current
      const status = container.querySelector('div[style*="状态"]') as HTMLElement
      
      if (status && status.textContent?.includes('审核中')) {
        status.style.animation = 'pulse 1.5s infinite'
        
        setTimeout(() => {
          status.textContent = '已同意'
          status.style.color = '#00b894'
          status.style.animation = 'none'
          status.style.transform = 'scale(1.2)'
          
          setTimeout(() => {
            status.style.transform = 'scale(1)'
          }, 300)
        }, 5000)
      }
    }
    
    // ==================== 充话费倒计时 ====================
    if (templateId === 'phone_recharge') {
      const container = containerRef.current
      const status = container.querySelector('div[style*="充值成功"], div[style*="状态"]') as HTMLElement
      
      if (status) {
        let dots = 0
        const interval = setInterval(() => {
          dots = (dots + 1) % 4
          status.textContent = '充值中' + '.'.repeat(dots)
          
          if (dots === 0) {
            status.textContent = '充值成功'
            status.style.color = '#00b894'
            status.style.fontWeight = 'bold'
            clearInterval(interval)
          }
        }, 500)
      }
    }
    
    // ==================== 好友列表在线状态闪烁 ====================
    if (templateId === 'friend_list') {
      const container = containerRef.current
      const onlineFriends = container.querySelectorAll('div[style*="在线"]')
      
      onlineFriends.forEach(friend => {
        const friendEl = friend as HTMLElement
        const indicator = document.createElement('div')
        indicator.style.cssText = `
          width: 8px;
          height: 8px;
          background: #00b894;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          animation: blink 2s infinite;
        `
        
        const style = document.createElement('style')
        style.textContent = `
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `
        
        friendEl.insertBefore(style, friendEl.firstChild)
        friendEl.insertBefore(indicator, friendEl.firstChild)
      })
    }
    
    // ==================== 评论区热评高亮 ====================
    if (templateId === 'comment_section') {
      const container = containerRef.current
      const comments = container.querySelectorAll('div[style*="padding"]')
      
      comments.forEach((comment, index) => {
        const commentEl = comment as HTMLElement
        const likes = parseInt(commentEl.textContent?.match(/(\d+)\s*赞/)?.[1] || '0')
        
        if (likes > 100) {
          commentEl.style.background = 'linear-gradient(90deg, #fff9e6 0%, transparent 100%)'
          commentEl.style.borderLeft = '3px solid #ffd700'
        }
        
        commentEl.style.cursor = 'pointer'
        commentEl.style.transition = 'all 0.3s'
        
        commentEl.addEventListener('mouseenter', () => {
          commentEl.style.transform = 'translateX(10px)'
          commentEl.style.backgroundColor = '#f8f9fa'
        })
        
        commentEl.addEventListener('mouseleave', () => {
          commentEl.style.transform = 'translateX(0)'
          commentEl.style.backgroundColor = 'transparent'
        })
      })
    }
    
    // ==================== 浏览历史时间轴 ====================
    if (templateId === 'browser_history') {
      const container = containerRef.current
      const records = container.querySelectorAll('div[style*="padding"]')
      
      records.forEach((record, index) => {
        const recordEl = record as HTMLElement
        recordEl.style.opacity = '0'
        recordEl.style.transform = 'translateY(20px)'
        recordEl.style.transition = 'all 0.4s'
        
        setTimeout(() => {
          recordEl.style.opacity = '1'
          recordEl.style.transform = 'translateY(0)'
        }, index * 100)
      })
    }
    
    // ==================== 加油记录里程计算 ====================
    if (templateId === 'gas_record') {
      const container = containerRef.current
      const priceEl = container.querySelector('div[style*="总金额"]') as HTMLElement
      
      if (priceEl) {
        priceEl.style.cursor = 'pointer'
        priceEl.addEventListener('click', () => {
          priceEl.style.animation = 'pulse 0.5s'
          priceEl.style.color = '#e74c3c'
          
          setTimeout(() => {
            priceEl.style.animation = 'none'
            priceEl.style.color = 'inherit'
          }, 500)
        })
      }
    }
    
    // ==================== 酒店预订确认动画 ====================
    if (templateId === 'hotel_booking' || templateId === 'couple_hotel') {
      const container = containerRef.current
      const orderNo = container.querySelector('div[style*="订单号"]') as HTMLElement
      
      if (orderNo) {
        orderNo.style.cursor = 'pointer'
        orderNo.addEventListener('click', () => {
          navigator.clipboard.writeText(orderNo.textContent || '')
          
          const toast = document.createElement('div')
          toast.textContent = '订单号已复制'
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
          `
          document.body.appendChild(toast)
          
          setTimeout(() => toast.remove(), 2000)
        })
      }
    }
    
    // ==================== 快递单物流追踪 ====================
    if (templateId === 'express_package') {
      const container = containerRef.current
      const trackingNo = container.querySelector('div[style*="快递单号"]') as HTMLElement
      
      if (trackingNo) {
        trackingNo.style.cursor = 'pointer'
        trackingNo.style.transition = 'all 0.3s'
        
        trackingNo.addEventListener('click', () => {
          trackingNo.style.background = '#fff9e6'
          trackingNo.style.transform = 'scale(1.05)'
          
          setTimeout(() => {
            trackingNo.style.background = 'transparent'
            trackingNo.style.transform = 'scale(1)'
          }, 500)
        })
      }
    }
    
    // ==================== 情书心动特效 ====================
    if (templateId === 'love_letter') {
      const container = containerRef.current
      container.style.position = 'relative'
      
      let heartCount = 0
      container.addEventListener('click', () => {
        heartCount++
        
        const heart = document.createElement('div')
        heart.textContent = '♥'
        heart.style.cssText = `
          position: absolute;
          left: ${Math.random() * 80 + 10}%;
          bottom: 0;
          font-size: 20px;
          color: #ff6b9d;
          pointer-events: none;
          animation: floatHeart 2s ease-out forwards;
        `
        
        if (heartCount === 1) {
          const style = document.createElement('style')
          style.textContent = `
            @keyframes floatHeart {
              to {
                transform: translateY(-200px);
                opacity: 0;
              }
            }
          `
          container.appendChild(style)
        }
        
        container.appendChild(heart)
        setTimeout(() => heart.remove(), 2000)
      })
    }
    
    // ==================== 婚恋网资料卡滑动 ====================
    if (templateId === 'dating_profile') {
      const container = containerRef.current
      const card = container.querySelector('div[style*="background"]') as HTMLElement
      if (!card) return
      
      card.style.cursor = 'pointer'
      card.style.transition = 'transform 0.3s'
      
      let startX = 0
      let currentX = 0
      
      card.addEventListener('mousedown', (e) => {
        startX = e.clientX
        card.style.transition = 'none'
      })
      
      card.addEventListener('mousemove', (e) => {
        if (startX !== 0) {
          currentX = e.clientX - startX
          card.style.transform = `translateX(${currentX}px) rotate(${currentX / 10}deg)`
        }
      })
      
      card.addEventListener('mouseup', () => {
        if (Math.abs(currentX) > 100) {
          card.style.transition = 'transform 0.5s'
          card.style.transform = `translateX(${currentX > 0 ? 500 : -500}px) rotate(${currentX > 0 ? 30 : -30}deg)`
          
          setTimeout(() => {
            card.style.opacity = '0'
          }, 300)
        } else {
          card.style.transition = 'transform 0.3s'
          card.style.transform = 'translateX(0) rotate(0)'
        }
        startX = 0
        currentX = 0
      })
      
      card.addEventListener('mouseleave', () => {
        if (startX !== 0) {
          card.style.transition = 'transform 0.3s'
          card.style.transform = 'translateX(0) rotate(0)'
          startX = 0
          currentX = 0
        }
      })
    }
    
    // ==================== 酒吧账单计费动画 ====================
    if (templateId === 'bar_bill') {
      const container = containerRef.current
      const total = container.querySelector('div[style*="总金额"]') as HTMLElement
      
      if (total) {
        let currentAmount = 0
        const targetAmount = parseFloat(total.textContent?.replace(/[^0-9.]/g, '') || '0')
        
        const animateAmount = () => {
          if (currentAmount < targetAmount) {
            currentAmount += targetAmount / 50
            total.textContent = `¥${Math.min(currentAmount, targetAmount).toFixed(2)}`
            requestAnimationFrame(animateAmount)
          }
        }
        
        animateAmount()
      }
    }
    
    // ==================== 夜店门票扫描入场 ====================
    if (templateId === 'club_ticket') {
      const container = containerRef.current
      const ticket = container.querySelector('div[style*="background"]') as HTMLElement
      if (!ticket) return
      
      ticket.style.cursor = 'pointer'
      let scanCount = 0
      
      ticket.addEventListener('click', () => {
        scanCount++
        ticket.style.animation = 'pulse 0.5s'
        
        if (scanCount === 3) {
          const scanLine = document.createElement('div')
          scanLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, #00ff00, transparent);
            animation: scanTicket 1s ease-out;
          `
          
          const style = document.createElement('style')
          style.textContent = `
            @keyframes scanTicket {
              from { top: 0; }
              to { top: 100%; }
            }
          `
          
          container.style.position = 'relative'
          container.appendChild(style)
          container.appendChild(scanLine)
          
          setTimeout(() => {
            const checkIn = document.createElement('div')
            checkIn.textContent = '入场成功'
            checkIn.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #00b894;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
            `
            container.appendChild(checkIn)
            
            scanLine.remove()
            setTimeout(() => checkIn.remove(), 2000)
          }, 1000)
        }
        
        setTimeout(() => {
          ticket.style.animation = 'none'
        }, 500)
      })
    }
    
    // ==================== 加班记录时长累计 ====================
    if (templateId === 'overtime_record') {
      const container = containerRef.current
      const hours = container.querySelector('div[style*="加班时长"]') as HTMLElement
      
      if (hours) {
        hours.style.color = '#e74c3c'
        hours.style.fontWeight = 'bold'
        hours.style.animation = 'pulse 2s infinite'
      }
    }
    
    // ==================== 高端消费奢侈品展示 ====================
    if (templateId === 'luxury_purchase') {
      const container = containerRef.current
      const price = container.querySelector('div[style*="价格"]') as HTMLElement
      
      if (price) {
        price.style.cursor = 'pointer'
        price.addEventListener('click', () => {
          price.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)'
          price.style.webkitBackgroundClip = 'text'
          price.style.webkitTextFillColor = 'transparent'
          price.style.transform = 'scale(1.2)'
          
          setTimeout(() => {
            price.style.transform = 'scale(1)'
          }, 500)
        })
      }
    }
    
    // ==================== 会所会员充值动画 ====================
    if (templateId === 'spa_membership') {
      const container = containerRef.current
      const balance = container.querySelector('div[style*="余额"]') as HTMLElement
      
      if (balance) {
        balance.style.cursor = 'pointer'
        balance.addEventListener('dblclick', () => {
          const currentBalance = parseFloat(balance.textContent?.replace(/[^0-9.]/g, '') || '0')
          const newBalance = currentBalance + 1000
          
          balance.textContent = `¥${newBalance.toFixed(2)}`
          balance.style.animation = 'pulse 0.5s'
          balance.style.color = '#00b894'
          
          setTimeout(() => {
            balance.style.animation = 'none'
            balance.style.color = 'inherit'
          }, 500)
        })
      }
    }
    
    // ==================== 成人游戏进度条 ====================
    if (templateId === 'adult_game') {
      const container = containerRef.current
      const progress = container.querySelector('div[style*="进度"]') as HTMLElement
      
      if (progress) {
        const progressBar = document.createElement('div')
        progressBar.style.cssText = `
          width: 100%;
          height: 8px;
          background: #e5e5e5;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        `
        
        const progressFill = document.createElement('div')
        const percentage = parseInt(progress.textContent?.match(/\d+/)?.[0] || '0')
        progressFill.style.cssText = `
          width: ${percentage}%;
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 1s;
        `
        
        progressBar.appendChild(progressFill)
        progress.appendChild(progressBar)
      }
    }
    
    // ==================== 付费内容解锁特效 ====================
    if (templateId === 'paid_content') {
      const container = containerRef.current
      const unlock = container.querySelector('div[style*="解锁"], button') as HTMLElement
      
      if (unlock) {
        unlock.style.cursor = 'pointer'
        unlock.addEventListener('click', () => {
          unlock.textContent = '已解锁'
          unlock.style.background = '#00b894'
          
          for (let i = 0; i < 20; i++) {
            const spark = document.createElement('div')
            spark.textContent = '✨'
            spark.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              font-size: 16px;
              pointer-events: none;
              animation: sparkle 1s ease-out forwards;
            `
            spark.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`)
            spark.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`)
            
            const style = document.createElement('style')
            style.textContent = `
              @keyframes sparkle {
                to {
                  transform: translate(var(--tx), var(--ty));
                  opacity: 0;
                }
              }
            `
            
            container.style.position = 'relative'
            container.appendChild(style)
            container.appendChild(spark)
            
            setTimeout(() => {
              spark.remove()
              style.remove()
            }, 1000)
          }
        })
      }
    }
    
    // ==================== 情趣商城隐私包装提示 ====================
    if (templateId === 'adult_shop') {
      const container = containerRef.current
      const privacy = document.createElement('div')
      privacy.textContent = '隐私配送'
      privacy.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        animation: blink 2s infinite;
      `
      
      container.style.position = 'relative'
      container.appendChild(privacy)
    }
    
    // ==================== 约会软件配对心动 ====================
    if (templateId === 'dating_match') {
      const container = containerRef.current
      const matchBtn = container.querySelector('button, div[style*="配对"]') as HTMLElement
      
      if (matchBtn) {
        matchBtn.style.cursor = 'pointer'
        matchBtn.addEventListener('click', () => {
          matchBtn.style.animation = 'heartBeat 1s'
          
          const hearts = ['❤️', '💕', '💖', '💗', '💓']
          hearts.forEach((heart, i) => {
            const heartEl = document.createElement('div')
            heartEl.textContent = heart
            heartEl.style.cssText = `
              position: absolute;
              bottom: 0;
              left: ${20 + i * 20}%;
              font-size: 24px;
              animation: floatUp 2s ease-out forwards;
              animation-delay: ${i * 0.2}s;
            `
            
            const style = document.createElement('style')
            style.textContent = `
              @keyframes floatUp {
                to {
                  transform: translateY(-150px);
                  opacity: 0;
                }
              }
            `
            
            container.style.position = 'relative'
            container.appendChild(style)
            container.appendChild(heartEl)
            
            setTimeout(() => heartEl.remove(), 2200)
          })
        })
      }
    }
    
    // ==================== 性病检测报告严肃提示 ====================
    if (templateId === 'std_test') {
      const container = containerRef.current
      const results = container.querySelectorAll('div[style*="阴性"], div[style*="阳性"]')
      
      results.forEach(result => {
        const resultEl = result as HTMLElement
        if (resultEl.textContent?.includes('阴性')) {
          resultEl.style.color = '#00b894'
          resultEl.style.fontWeight = 'bold'
        } else if (resultEl.textContent?.includes('阳性')) {
          resultEl.style.color = '#e74c3c'
          resultEl.style.fontWeight = 'bold'
          resultEl.style.animation = 'pulse 1s infinite'
        }
      })
    }
    
    // ==================== 私密相册加密提示 ====================
    if (templateId === 'private_album') {
      const container = containerRef.current
      const lock = document.createElement('div')
      lock.textContent = '🔒'
      lock.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 64px;
        cursor: pointer;
        animation: shake 0.5s infinite;
      `
      
      container.style.position = 'relative'
      container.appendChild(lock)
      
      lock.addEventListener('click', () => {
        lock.textContent = '🔓'
        lock.style.animation = 'none'
        
        setTimeout(() => {
          lock.textContent = '🔒'
          lock.style.animation = 'shake 0.5s infinite'
        }, 3000)
      })
    }
    
    // ==================== 隐私浏览模式提示 ====================
    if (templateId === 'incognito_mode') {
      const container = containerRef.current
      const icon = document.createElement('div')
      icon.textContent = '🕵️'
      icon.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 48px;
        animation: pulse 2s infinite;
      `
      
      container.style.position = 'relative'
      container.appendChild(icon)
    }
    
    // ==================== 离婚协议撕裂效果 ====================
    if (templateId === 'divorce_agreement') {
      const container = containerRef.current
      const agreement = container.querySelector('div[style*="background"]') as HTMLElement
      if (!agreement) return
      
      agreement.style.cursor = 'pointer'
      let tearCount = 0
      
      agreement.addEventListener('click', () => {
        tearCount++
        
        if (tearCount === 1) {
          agreement.style.animation = 'shake 0.5s'
        } else if (tearCount === 3) {
          agreement.style.transition = 'all 1s'
          agreement.style.transform = 'scale(0.8) rotate(5deg)'
          agreement.style.opacity = '0.5'
          
          const tearLine = document.createElement('div')
          tearLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            bottom: 0;
            width: 2px;
            background: #e74c3c;
            transform: translateX(-50%);
            animation: tearEffect 1s ease-out;
          `
          
          const style = document.createElement('style')
          style.textContent = `
            @keyframes tearEffect {
              0% { height: 0; top: 50%; }
              100% { height: 100%; top: 0; }
            }
          `
          
          container.style.position = 'relative'
          container.appendChild(style)
          container.appendChild(tearLine)
        }
        
        setTimeout(() => {
          agreement.style.animation = 'none'
        }, 500)
      })
    }
    
    // ==================== 性爱时长计时器 ====================
    if (templateId === 'sex_timer') {
      const container = containerRef.current
      const duration = container.querySelector('div[style*="持续时长"]') as HTMLElement
      
      if (duration) {
        duration.style.cursor = 'pointer'
        duration.style.fontSize = '32px'
        duration.style.fontWeight = 'bold'
        duration.style.color = '#e74c3c'
        duration.style.animation = 'pulse 1s infinite'
      }
    }
    
    // ==================== 性爱日记翻阅动画 ====================
    if (templateId === 'sex_diary') {
      const container = containerRef.current
      const diary = container.querySelector('div[style*="background"]') as HTMLElement
      if (!diary) return
      
      diary.style.cursor = 'pointer'
      diary.style.transition = 'all 0.5s'
      
      let isRevealed = false
      diary.addEventListener('click', () => {
        isRevealed = !isRevealed
        
        if (isRevealed) {
          diary.style.transform = 'rotateY(5deg) scale(1.02)'
          diary.style.boxShadow = '0 8px 30px rgba(231, 76, 60, 0.3)'
        } else {
          diary.style.transform = 'rotateY(0deg) scale(1)'
          diary.style.boxShadow = 'initial'
        }
      })
    }
    
    // ==================== 性幻想清单勾选进度 ====================
    if (templateId === 'fantasy_list') {
      const container = containerRef.current
      const items = container.querySelectorAll('div[style*="padding"]')
      
      let completedCount = 0
      items.forEach(item => {
        const itemEl = item as HTMLElement
        itemEl.style.cursor = 'pointer'
        itemEl.style.transition = 'all 0.3s'
        
        let isCompleted = Math.random() > 0.7
        if (isCompleted) {
          completedCount++
          itemEl.style.textDecoration = 'line-through'
          itemEl.style.opacity = '0.5'
        }
        
        itemEl.addEventListener('click', () => {
          isCompleted = !isCompleted
          
          if (isCompleted) {
            completedCount++
            itemEl.style.textDecoration = 'line-through'
            itemEl.style.opacity = '0.5'
            itemEl.style.color = '#00b894'
          } else {
            completedCount--
            itemEl.style.textDecoration = 'none'
            itemEl.style.opacity = '1'
            itemEl.style.color = 'inherit'
          }
          
          const progress = document.createElement('div')
          progress.textContent = `完成进度: ${completedCount}/${items.length}`
          progress.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 12px;
          `
          
          container.style.position = 'relative'
          const oldProgress = container.querySelector('div[style*="完成进度"]')
          if (oldProgress) oldProgress.remove()
          container.appendChild(progress)
        })
      })
    }
    
    // ==================== 开房记录马赛克效果 ====================
    if (templateId === 'checkin_record') {
      const container = containerRef.current
      const sensitiveInfo = container.querySelectorAll('div[style*="身份证"]')
      
      sensitiveInfo.forEach(info => {
        const infoEl = info as HTMLElement
        infoEl.style.cursor = 'pointer'
        infoEl.style.position = 'relative'
        
        const mosaic = document.createElement('div')
        mosaic.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            #000 0px,
            #000 2px,
            #fff 2px,
            #fff 4px
          );
          opacity: 0.8;
          pointer-events: none;
        `
        
        infoEl.style.position = 'relative'
        infoEl.appendChild(mosaic)
        
        infoEl.addEventListener('click', () => {
          mosaic.style.opacity = mosaic.style.opacity === '0' ? '0.8' : '0'
        })
      })
    }
    
    // ==================== 成人网站会员倒计时 ====================
    if (templateId === 'adult_site_membership') {
      const container = containerRef.current
      const expireDate = container.querySelector('div[style*="到期"]') as HTMLElement
      
      if (expireDate) {
        expireDate.style.color = '#e74c3c'
        expireDate.style.fontWeight = 'bold'
        
        const dateStr = expireDate.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
        if (dateStr) {
          const expire = new Date(dateStr).getTime()
          const now = Date.now()
          const daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24))
          
          if (daysLeft < 7) {
            expireDate.style.animation = 'pulse 1s infinite'
            
            const warning = document.createElement('div')
            warning.textContent = `即将到期：还剩${daysLeft}天`
            warning.style.cssText = `
              position: absolute;
              top: 10px;
              right: 10px;
              background: #e74c3c;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              animation: pulse 1s infinite;
            `
            
            container.style.position = 'relative'
            container.appendChild(warning)
          }
        }
      }
    }
    
    // ==================== 成人浏览历史隐藏/显示 ====================
    if (templateId === 'adult_browser_history') {
      const container = containerRef.current
      const records = container.querySelectorAll('div[style*="padding"]')
      
      const toggleBtn = document.createElement('div')
      toggleBtn.textContent = '显示详情'
      toggleBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #2d3436;
        color: white;
        padding: 6px 16px;
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10;
      `
      
      container.style.position = 'relative'
      container.appendChild(toggleBtn)
      
      let isHidden = true
      records.forEach(record => {
        const recordEl = record as HTMLElement
        recordEl.style.filter = 'blur(8px)'
        recordEl.style.transition = 'filter 0.3s'
      })
      
      toggleBtn.addEventListener('click', () => {
        isHidden = !isHidden
        
        records.forEach(record => {
          const recordEl = record as HTMLElement
          recordEl.style.filter = isHidden ? 'blur(8px)' : 'none'
        })
        
        toggleBtn.textContent = isHidden ? '显示详情' : '隐藏详情'
      })
    }
    
    // ==================== 通用增强：所有模板添加长按菜单 ====================
    let pressTimer: number | null = null
    const container = containerRef.current
    
    container.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        const menu = document.createElement('div')
        menu.innerHTML = `
          <div style="padding: 8px; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="padding: 8px 12px; cursor: pointer; border-radius: 4px; font-size: 13px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">保存图片</div>
            <div style="padding: 8px 12px; cursor: pointer; border-radius: 4px; font-size: 13px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">分享</div>
            <div style="padding: 8px 12px; cursor: pointer; border-radius: 4px; font-size: 13px;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">复制</div>
          </div>
        `
        menu.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          animation: fadeIn 0.2s;
        `
        
        const style = document.createElement('style')
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `
        
        document.body.appendChild(style)
        document.body.appendChild(menu)
        
        const closeMenu = () => {
          menu.remove()
          style.remove()
          document.removeEventListener('click', closeMenu)
        }
        
        setTimeout(() => {
          document.addEventListener('click', closeMenu)
        }, 100)
      }, 800)
    })
    
    container.addEventListener('mouseup', () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    })
    
    container.addEventListener('mouseleave', () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    })
  }, [message.theatre?.templateId, message.theatre?.htmlContent])
  
  if (!message.theatre) {
    console.warn('⚠️ [TheatreMessage] message.theatre 为空')
    return null
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
        }
        @keyframes flicker {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 8px rgba(243, 156, 18, 0.6));
          }
          50% { 
            opacity: 0.85; 
            transform: scale(0.96);
            filter: brightness(0.9) drop-shadow(0 0 4px rgba(243, 156, 18, 0.4));
          }
        }
        @keyframes flip {
          0% { 
            transform: rotateY(0deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          50% {
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          }
          100% { 
            transform: rotateY(180deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-1deg); }
          20% { transform: translateX(8px) rotate(1deg); }
          30% { transform: translateX(-8px) rotate(-1deg); }
          40% { transform: translateX(8px) rotate(1deg); }
          50% { transform: translateX(-4px) rotate(-0.5deg); }
          60% { transform: translateX(4px) rotate(0.5deg); }
          70% { transform: translateX(-2px) rotate(-0.25deg); }
          80% { transform: translateX(2px) rotate(0.25deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.5),
                        0 0 10px rgba(255, 215, 0, 0.3),
                        0 0 15px rgba(255, 215, 0, 0.2);
          }
          50% { 
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                        0 0 20px rgba(255, 215, 0, 0.5),
                        0 0 30px rgba(255, 215, 0, 0.3);
          }
        }
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        [data-item] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        [data-item]:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        [data-play-btn] {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        [data-play-btn]:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 6px 20px rgba(9, 132, 227, 0.3);
        }
        [data-play-btn]:active {
          transform: scale(0.95) !important;
        }
        [data-play-btn]::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        [data-play-btn]:active::before {
          width: 100%;
          height: 100%;
        }
        .theatre-card {
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .theatre-card.flipped {
          transform: rotateY(180deg);
        }
        .theatre-content {
          animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .theatre-content > * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theatre-content > *:hover {
          transform: translateY(-2px);
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
