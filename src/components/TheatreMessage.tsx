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
    if (!containerRef.current || !message.theatre?.templateId) {
      console.log('[TheatreMessage] Early return - containerRef or templateId missing')
      return
    }
    
    const templateId = message.theatre.templateId
    console.log(`[TheatreMessage] useEffect running for templateId: "${templateId}"`)
    
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
      
      // 绘制"刮开查看"文字
      ctx.save()
      ctx.font = 'bold 24px SimHei, Microsoft YaHei'
      ctx.fillStyle = 'rgba(100, 100, 100, 0.4)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('刮开查看', canvas.width / 2, canvas.height / 2)
      
      // 添加一些保密纹理（斜线）
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.15)'
      ctx.lineWidth = 2
      for (let i = -canvas.height; i < canvas.width; i += 15) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + canvas.height, canvas.height)
        ctx.stroke()
      }
      ctx.restore()
      
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
    
    // ==================== 性爱时长交互 ====================
    if (templateId === 'sex_timer') {
      const container = containerRef.current
      
      // 按钮
      const toggleForeplay = container.querySelector('[data-action="toggle-foreplay"]')
      const toggleMain = container.querySelector('[data-action="toggle-main"]')
      const toggleAftercare = container.querySelector('[data-action="toggle-aftercare"]')
      const togglePositions = container.querySelector('[data-action="toggle-positions"]')
      const toggleClimax = container.querySelector('[data-action="toggle-climax"]')
      
      // 详情区域
      const foreplayDetail = container.querySelector('[data-detail="foreplay"]') as HTMLElement
      const mainDetail = container.querySelector('[data-detail="main"]') as HTMLElement
      const aftercareDetail = container.querySelector('[data-detail="aftercare"]') as HTMLElement
      const positionsDetail = container.querySelector('[data-detail="positions"]') as HTMLElement
      const climaxDetail = container.querySelector('[data-detail="climax"]') as HTMLElement
      
      const allDetails = [foreplayDetail, mainDetail, aftercareDetail, positionsDetail, climaxDetail]
      
      const setupToggle = (btn: Element | null, targetDetail: HTMLElement | null) => {
        if (!btn || !targetDetail) return
        
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          
          const isCurrentlyVisible = targetDetail.style.display === 'block'
          
          // 先关闭所有详情
          allDetails.forEach(detail => {
            if (detail) detail.style.display = 'none'
          })
          
          // 如果之前不是显示的，就显示它
          if (!isCurrentlyVisible) {
            targetDetail.style.display = 'block'
          }
        })
      }
      
      setupToggle(toggleForeplay, foreplayDetail)
      setupToggle(toggleMain, mainDetail)
      setupToggle(toggleAftercare, aftercareDetail)
      setupToggle(togglePositions, positionsDetail)
      setupToggle(toggleClimax, climaxDetail)
    }

    // ==================== 购物车交互 ====================
    if (templateId === 'shopping_cart') {
      const container = containerRef.current.querySelector('[data-shopping-cart]')
      if (!container) return
      
      // 初始化数据
      const items = new Map<number, { 
        price: number, 
        count: number, 
        selected: boolean,
        el: HTMLElement,
        checkbox: HTMLElement,
        countEl: HTMLElement
      }>()
      
      const itemEls = container.querySelectorAll('[data-item]')
      itemEls.forEach(el => {
        const id = parseInt(el.getAttribute('data-item') || '0')
        const price = parseFloat(el.getAttribute('data-price') || '0')
        const countEl = el.querySelector('div[style*="min-width: 24px"]') as HTMLElement
        const count = parseInt(countEl?.textContent || '1')
        const checkbox = el.querySelector(`[data-checkbox="${id}"]`) as HTMLElement
        
        if (id && !items.has(id)) {
          items.set(id, {
            price,
            count,
            selected: true,
            el: el as HTMLElement,
            checkbox,
            countEl
          })
        }
      })
      
      const totalEl = container.querySelector('[data-total]') as HTMLElement
      const countSpan = Array.from(container.querySelectorAll('span')).find(s => s.parentElement?.textContent?.includes('已选')) as HTMLElement
      
      const updateTotal = () => {
        let total = 0
        let selectedCount = 0
        
        items.forEach(item => {
          if (item.selected) {
            total += item.price * item.count
            selectedCount++
          }
        })
        
        if (totalEl) {
          // 动画效果
          totalEl.style.transition = 'transform 0.2s'
          totalEl.style.transform = 'scale(1.2)'
          totalEl.style.color = '#ff4d4f'
          totalEl.textContent = `${total}`
          setTimeout(() => {
            totalEl.style.transform = 'scale(1)'
          }, 200)
        }
        
        if (countSpan) {
          countSpan.textContent = `${selectedCount}`
        }
        
        // 更新全选按钮状态
        const selectAllBtn = container.querySelector('[data-select-all]') as HTMLElement
        if (selectAllBtn) {
          const allSelected = Array.from(items.values()).every(i => i.selected)
          if (allSelected) {
             selectAllBtn.style.background = '#ff4d4f'
             selectAllBtn.style.border = '2px solid #ff4d4f'
             selectAllBtn.innerHTML = '<span style="color: white; font-size: 12px; font-weight: bold;">✓</span>'
          } else {
             selectAllBtn.style.background = 'transparent'
             selectAllBtn.style.border = '2px solid #ddd'
             selectAllBtn.innerHTML = ''
          }
        }
      }
      
      // 绑定事件
      items.forEach((item) => {
        // Checkbox 点击
        if (item.checkbox) {
          item.checkbox.addEventListener('click', (e) => {
            e.stopPropagation()
            item.selected = !item.selected
            
            if (item.selected) {
               item.checkbox.style.background = '#ff4d4f'
               item.checkbox.style.border = '2px solid #ff4d4f'
               item.checkbox.innerHTML = '<span style="color: white; font-size: 12px; font-weight: bold;">✓</span>'
               item.el.style.opacity = '1'
               
               // 选中动画
               item.checkbox.style.transform = 'scale(1.1)'
               setTimeout(() => item.checkbox.style.transform = 'scale(1)', 200)
            } else {
               item.checkbox.style.background = 'transparent'
               item.checkbox.style.border = '2px solid #ddd'
               item.checkbox.innerHTML = ''
               item.el.style.opacity = '0.6'
            }
            updateTotal()
          })
        }
        
        // 数量加减
        const qtyBtns = item.el.querySelectorAll('div[style*="padding: 0 8px"]')
        const minusBtn = qtyBtns[0] as HTMLElement
        const plusBtn = qtyBtns[1] as HTMLElement
        
        if (minusBtn) {
          minusBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (item.count > 1) {
              item.count--
              if (item.countEl) item.countEl.textContent = `${item.count}`
              updateTotal()
            }
          })
        }
        
        if (plusBtn) {
          plusBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (item.count < 99) {
              item.count++
              if (item.countEl) item.countEl.textContent = `${item.count}`
              updateTotal()
            }
          })
        }
      })
      
      // 全选按钮
      const selectAllBtn = container.querySelector('[data-select-all]')
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          const allSelected = Array.from(items.values()).every(i => i.selected)
          const newState = !allSelected
          
          items.forEach(item => {
            item.selected = newState
            if (newState) {
               item.checkbox.style.background = '#ff4d4f'
               item.checkbox.style.border = '2px solid #ff4d4f'
               item.checkbox.innerHTML = '<span style="color: white; font-size: 12px; font-weight: bold;">✓</span>'
               item.el.style.opacity = '1'
            } else {
               item.checkbox.style.background = 'transparent'
               item.checkbox.style.border = '2px solid #ddd'
               item.checkbox.innerHTML = ''
               item.el.style.opacity = '0.6'
            }
          })
          updateTotal()
        })
      }
      
      // 结算按钮
      const checkoutBtn = container.querySelector('[data-checkout-btn]') as HTMLElement
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
           const selectedCount = Array.from(items.values()).filter(i => i.selected).length
           if (selectedCount === 0) {
             checkoutBtn.style.animation = 'shake 0.5s'
             setTimeout(() => checkoutBtn.style.animation = '', 500)
             return
           }
           
           // Loading state
           const originalText = checkoutBtn.textContent
           checkoutBtn.textContent = '处理中...'
           checkoutBtn.style.opacity = '0.8'
           
           setTimeout(() => {
             checkoutBtn.textContent = '下单成功!'
             checkoutBtn.style.background = '#52c41a'
             checkoutBtn.style.opacity = '1'
             
             // 撒花效果
             for (let i = 0; i < 20; i++) {
                const p = document.createElement('div')
                p.textContent = ['🎉', '✨', '💰', '🎁'][Math.floor(Math.random() * 4)]
                p.style.position = 'fixed'
                p.style.left = `${checkoutBtn.getBoundingClientRect().left + Math.random() * 100}px`
                p.style.top = `${checkoutBtn.getBoundingClientRect().top}px`
                p.style.fontSize = '20px'
                p.style.pointerEvents = 'none'
                p.style.transition = 'all 1s ease-out'
                document.body.appendChild(p)
                
                requestAnimationFrame(() => {
                  p.style.transform = `translate(${(Math.random()-0.5)*100}px, -${100+Math.random()*100}px) rotate(${Math.random()*360}deg)`
                  p.style.opacity = '0'
                })
                setTimeout(() => p.remove(), 1000)
             }
             
             setTimeout(() => {
                checkoutBtn.textContent = originalText
                checkoutBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff4d4f)'
             }, 2000)
           }, 800)
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
    
    // ==================== 快递单交互 ====================
    if (templateId === 'express_package') {
      const container = containerRef.current
      const copyBtn = container.querySelector('[data-copy-btn]') as HTMLElement
      
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const text = copyBtn.getAttribute('data-copy-btn')
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              const originalText = copyBtn.textContent
              copyBtn.textContent = '已复制'
              copyBtn.style.borderColor = '#52c41a'
              copyBtn.style.color = '#52c41a'
              
              setTimeout(() => {
                copyBtn.textContent = originalText
                copyBtn.style.borderColor = '#1890ff'
                copyBtn.style.color = '#1890ff'
              }, 2000)
            })
          }
        })
      }
    }

    // ==================== 优惠券交互 ====================
    if (templateId === 'coupon') {
      const container = containerRef.current.querySelector('[data-coupon]')
      if (!container) return
      
      // 倒计时
      const expireDateStr = message.theatre.htmlContent.match(/有效期至\s*(\d{4}-\d{2}-\d{2})/)
          ? message.theatre.htmlContent.match(/有效期至\s*(\d{4}-\d{2}-\d{2})/)?.[1]
          : (message.theatre.htmlContent.match(/过期日期.*?placeholder.*?"([^"]+)"/)?.[1] || '2025-12-31')
      
      const expireDate = new Date(expireDateStr || '2025-12-31').getTime()
      
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
        
        const daysEl = container.querySelector('[data-days]')
        const hoursEl = container.querySelector('[data-hours]')
        
        if (daysEl) daysEl.textContent = String(days)
        if (hoursEl) hoursEl.textContent = String(hours)
      }
      
      updateCountdown()
      const interval = setInterval(updateCountdown, 60000) // 每分钟更新
      
      // 使用按钮
      const useBtn = container.querySelector('[data-use-btn]') as HTMLElement
      const usedStamp = container.querySelector('[data-used-stamp]') as HTMLElement
      
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          useBtn.style.transform = 'scale(0.95)'
          setTimeout(() => useBtn.style.transform = 'scale(1)', 150)
          
          // 模拟网络请求延迟
          useBtn.textContent = '使用中...'
          useBtn.style.opacity = '0.7'
          
          setTimeout(() => {
            useBtn.style.display = 'none'
            if (usedStamp) {
              usedStamp.style.display = 'block'
              usedStamp.style.animation = 'stampIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              
              // Add style if not exists
              if (!document.getElementById('stamp-anim-style')) {
                const style = document.createElement('style')
                style.id = 'stamp-anim-style'
                style.textContent = `
                  @keyframes stampIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(2) rotate(-15deg); }
                    to { opacity: 0.8; transform: translate(-50%, -50%) scale(1) rotate(-15deg); }
                  }
                `
                document.head.appendChild(style)
              }
            }
            
            container.style.filter = 'grayscale(1) opacity(0.8)'
            container.style.transition = 'all 0.5s'
          }, 800)
        })
      }
      
      return () => clearInterval(interval)
    }
    
    // ==================== 菜单交互 ====================
    if (templateId === 'menu') {
      const container = containerRef.current
      const bookContainer = container.querySelector('[data-menu-book]') as HTMLElement
      const bookInner = container.querySelector('[data-book-inner]') as HTMLElement
      const menuContainer = container.querySelector('[data-book-inner]') // 用内页作为菜单容器
      
      if (!menuContainer) return
      
      // 翻书交互
      let isBookOpen = false
      if (bookContainer && bookInner) {
        bookContainer.addEventListener('click', (e) => {
          // 如果点击的是菜单项内部（点菜），不触发翻书
          if ((e.target as HTMLElement).closest('[data-menu-item]')) {
            return
          }
          
          if (!isBookOpen) {
            isBookOpen = true
            bookInner.style.transform = 'translateX(0) rotateY(-180deg)'
          } 
          // 如果已经打开，再次点击封面区域（实际上很难点到封面，因为封面转过去了）或者边缘可以合上
          // 这里简化逻辑：点击翻开后，如果想合上，可以再次点击非菜单区域
          // 但为了体验好，我们让点击内页的空白处不合上，只允许单向翻开（或者点击特定关闭按钮，这里暂不实现关闭）
        })
      }
      
      const menuItems = menuContainer.querySelectorAll('[data-menu-item]')
      const quantities = new Array(menuItems.length).fill(0)
      
      // 动态获取价格列表
      const prices: number[] = []
      menuItems.forEach(item => {
        const priceAttr = item.getAttribute('data-price')
        if (priceAttr) {
          prices.push(parseFloat(priceAttr))
        } else {
          // 兼容旧版正则匹配逻辑（备用）
          const priceText = item.querySelector('div[style*="font-weight: bold"]')?.nextElementSibling?.previousElementSibling?.textContent || ''
          const match = priceText.match(/¥(\d+)/)
          prices.push(match ? parseFloat(match[1]) : 0)
        }
      })
      
      const updateTotal = () => {
        let total = 0
        quantities.forEach((qty, idx) => {
          total += (prices[idx] || 0) * qty
        })
        const totalEl = menuContainer.querySelector('[data-total]')
        if (totalEl) totalEl.textContent = `¥${total}`
      }
      
      menuItems.forEach((item, index) => {
        const itemEl = item as HTMLElement
        // 动态查找 qty 元素，不再依赖固定的 index+1
        const qtyEl = item.querySelector('[data-qty]') as HTMLElement
        const titleEl = item.querySelector('div[style*="font-weight: bold"]') as HTMLElement
        
        if (!qtyEl) return

        item.addEventListener('click', (e) => {
          e.stopPropagation() // 阻止冒泡，防止触发翻书
          
          quantities[index]++
          if (quantities[index] > 9) quantities[index] = 0
          
          qtyEl.textContent = `已选 ${quantities[index]}`
          
          if (quantities[index] > 0) {
            qtyEl.style.opacity = '1'
            qtyEl.style.transform = 'translateY(0)'
            if (titleEl) titleEl.style.borderBottomColor = '#8d6e63'
          } else {
            qtyEl.style.opacity = '0'
            qtyEl.style.transform = 'translateY(5px)'
            if (titleEl) titleEl.style.borderBottomColor = 'transparent'
          }
          
          updateTotal()
        })
      })
    }
    
    // ==================== 备忘录交互 ====================
    if (templateId === 'memo') {
      const container = containerRef.current
      const modal = container.querySelector('[data-detail-modal]') as HTMLElement
      const backBtn = container.querySelector('[data-back-btn]')
      
      const modalTitle = container.querySelector('[data-modal-title]')
      const modalTime = container.querySelector('[data-modal-time]')
      const modalText = container.querySelector('[data-modal-text]')
      
      // 列表项点击
      const items = container.querySelectorAll('[data-memo-item]')
      items.forEach(item => {
        item.addEventListener('click', () => {
          const title = item.querySelector('[data-full-title]')?.textContent || ''
          const time = item.querySelector('[data-full-time]')?.textContent || ''
          const detail = item.querySelector('[data-detail-content]')?.textContent || ''
          
          if (modalTitle) modalTitle.textContent = title
          if (modalTime) modalTime.textContent = time
          if (modalText) modalText.textContent = detail
          
          if (modal) {
            modal.style.transform = 'translateX(0)'
          }
        })
      })
      
      // 返回按钮点击
      if (backBtn && modal) {
        backBtn.addEventListener('click', () => {
          modal.style.transform = 'translateX(100%)'
        })
      }
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

      // 1. 标签切换
      const tabs = container.querySelectorAll('[data-tab]')
      const items = container.querySelectorAll('[data-call-item]')

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const type = tab.getAttribute('data-tab')

          // 更新Tab样式
          tabs.forEach(t => {
            const isSelected = t === tab
            ;(t as HTMLElement).style.fontWeight = isSelected ? '600' : '500'
            ;(t as HTMLElement).style.color = isSelected ? '#000' : '#666'
            ;(t as HTMLElement).style.background = isSelected ? '#fff' : 'transparent'
            ;(t as HTMLElement).style.boxShadow = isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          })

          // 筛选列表
          items.forEach(item => {
            const callType = item.getAttribute('data-type')
            const el = item as HTMLElement

            if (type === 'all') {
              el.style.display = 'flex'
            } else if (type === 'missed') {
              if (callType?.includes('未接')) {
                el.style.display = 'flex'
              } else {
                el.style.display = 'none'
              }
            }
          })
        })
      })

      // 2. 列表项点击展开详情
      items.forEach(item => {
        item.addEventListener('click', () => {
           const content = item.getAttribute('data-content')
           const reason = item.getAttribute('data-reason')
           const type = item.getAttribute('data-type')
           
           // 检查是否已经展开
           const existingDetail = item.nextElementSibling
           if (existingDetail && existingDetail.hasAttribute('data-detail-row')) {
             // 收起
             existingDetail.remove()
             return
           }
           
           // 创建详情行
           const detailRow = document.createElement('div')
           detailRow.setAttribute('data-detail-row', 'true')
           detailRow.style.background = '#f9f9f9'
           detailRow.style.padding = '12px 16px'
           detailRow.style.borderBottom = '0.5px solid rgba(0,0,0,0.1)'
           detailRow.style.fontSize = '14px'
           detailRow.style.color = '#333'
           detailRow.style.lineHeight = '1.5'
           detailRow.style.animation = 'slideDown 0.2s ease-out'
           
           // 插入样式
           if (!document.getElementById('call-log-anim')) {
             const style = document.createElement('style')
             style.id = 'call-log-anim'
             style.textContent = `@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`
             document.head.appendChild(style)
           }
           
           if (type?.includes('未接')) {
             detailRow.innerHTML = `
               <div style="color: #ff3b30; font-weight: 600; margin-bottom: 4px;">⚠️ 未接听原因</div>
               <div>${reason || '暂无原因说明'}</div>
             `
           } else {
             detailRow.innerHTML = `
               <div style="color: #007aff; font-weight: 600; margin-bottom: 4px;">📝 通话内容摘要</div>
               <div>${content || '暂无通话内容记录'}</div>
             `
           }
           
           item.parentNode?.insertBefore(detailRow, item.nextSibling)
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
      const book = container.querySelector('.cert-book') as HTMLElement
      
      if (book) {
        let isFlipped = false
        container.addEventListener('click', () => {
          isFlipped = !isFlipped
          book.style.transform = isFlipped ? 'rotateY(-180deg) translateX(100px)' : 'rotateY(0deg) translateX(0)'
          // 调整视角中心，让翻开后的效果更居中
          if (isFlipped) {
             container.style.transform = 'translateX(-50px)'
          } else {
             container.style.transform = 'translateX(0)'
          }
          container.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        })
      }
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
    
    // ==================== 倒计时翻转交互 ====================
    if (templateId === 'countdown') {
      const countdownCard = containerRef.current.querySelector('[data-countdown]')
      if (!countdownCard) return
      
      const flipCard = countdownCard.querySelector('[data-flip-card]') as HTMLElement
      if (!flipCard) return
      
      let isFlipped = false
      
      countdownCard.addEventListener('click', () => {
        isFlipped = !isFlipped
        
        if (isFlipped) {
          flipCard.style.transform = 'rotateY(180deg)'
        } else {
          flipCard.style.transform = 'rotateY(0deg)'
        }
      })
    }
    
    // ==================== 私密相册翻转交互 ====================
    if (templateId === 'private_album') {
      const albumCard = containerRef.current.querySelector('[data-private-album]')
      if (!albumCard) return
      
      const lockBtn = albumCard.querySelector('[data-lock-btn]') as HTMLElement
      if (!lockBtn) return
      
      const correctPassword = albumCard.getAttribute('data-password') || '1234'
      let isUnlocked = false
      
      // 初始状态：所有照片模糊
      const photoCards = Array.from(albumCard.querySelectorAll('[data-photo-card]'))
      photoCards.forEach(card => {
        const el = card as HTMLElement
        el.style.cssText += ';filter:blur(20px);pointer-events:none'
      })
      
      // 点击锁图标输入密码
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        
        if (!isUnlocked) {
          const input = prompt('请输入密码查看私密相册：')
          if (input === correctPassword) {
            isUnlocked = true
            lockBtn.style.background = 'rgba(76, 217, 100, 0.3)'
            
            // 解锁：移除模糊，启用交互
            photoCards.forEach(card => {
              const el = card as HTMLElement
              el.style.cssText += ';filter:none;pointer-events:auto'
            })
          } else if (input !== null) {
            alert('密码错误')
          }
        }
      })
      
      // 每张照片的翻转交互
      photoCards.forEach((card, index) => {
        const cardEl = card as HTMLElement
        const flipEl = cardEl.querySelector(`[data-photo-flip="${index + 1}"]`) as HTMLElement
        if (!flipEl) return
        
        let isFlipped = false
        
        cardEl.addEventListener('click', () => {
          if (!isUnlocked) return
          
          isFlipped = !isFlipped
          flipEl.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        })
      })
    }
    
    // ==================== 外卖评价记录（无交互，纯展示） ====================
    // delivery_review 模板是静态展示，不需要交互逻辑
    
    // ==================== 时间胶囊交互 ====================
    if (templateId === 'time_capsule') {
      const container = containerRef.current.querySelector('[data-time-capsule]')
      if (!container) return
      
      const sealedView = container.querySelector('[data-capsule-sealed]') as HTMLElement
      const openedView = container.querySelector('[data-capsule-opened]') as HTMLElement
      
      if (!sealedView || !openedView) return
      
      // 点击信封打开
      sealedView.addEventListener('click', () => {
        // 信封翻转消失动画
        sealedView.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        sealedView.style.transform = 'rotateX(90deg) scale(0.8)'
        sealedView.style.opacity = '0'
        
        setTimeout(() => {
          sealedView.style.display = 'none'
          openedView.style.display = 'block'
          openedView.style.opacity = '0'
          openedView.style.transform = 'translateY(30px) scale(0.95)'
          
          // 信纸展开动画
          requestAnimationFrame(() => {
            openedView.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            openedView.style.opacity = '1'
            openedView.style.transform = 'translateY(0) scale(1)'
          })
        }, 400)
      })
    }
    
    // ==================== 拼团交互 ====================
    if (templateId === 'group_buy') {
      const container = containerRef.current.querySelector('[data-group-buy]')
      if (!container) return
      
      const joinBtn = container.querySelector('[data-join-btn]') as HTMLButtonElement
      if (!joinBtn) return
      
      let hasJoined = false
      
      joinBtn.addEventListener('click', () => {
        if (hasJoined) return
        
        hasJoined = true
        
        // 按钮点击效果
        joinBtn.style.transform = 'scale(0.95)'
        
        setTimeout(() => {
          joinBtn.style.transform = 'scale(1)'
          
          // 改变按钮状态
          joinBtn.textContent = '参团成功！'
          joinBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)'
          joinBtn.style.cursor = 'default'
          
          // 显示成功提示
          const successMsg = document.createElement('div')
          successMsg.textContent = '🎉 参团成功，等待其他人参团'
          successMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.85);
            color: #fff;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeIn 0.3s;
          `
          document.body.appendChild(successMsg)
          
          setTimeout(() => {
            successMsg.style.opacity = '0'
            successMsg.style.transition = 'opacity 0.3s'
            setTimeout(() => successMsg.remove(), 300)
          }, 2000)
        }, 150)
      })
    }
    
    // ==================== 砍一刀交互（无限套路） ====================
    if (templateId === 'bargain') {
      const container = containerRef.current.querySelector('[data-bargain]')
      if (!container) return
      
      const bargainBtn = container.querySelector('[data-bargain-btn]') as HTMLButtonElement
      const shareBtn = container.querySelector('[data-share-btn]') as HTMLButtonElement
      const trickIcon = container.querySelector('[data-trick-icon]') as HTMLElement
      const trickTitle = container.querySelector('[data-trick-title]') as HTMLElement
      const trickProgress = container.querySelector('[data-trick-progress]') as HTMLElement
      const trickToggle = container.querySelector('[data-trick-toggle]') as HTMLElement
      const trickBox = container.querySelector('[data-trick-box]') as HTMLElement
      const trickArrow = container.querySelector('[data-trick-arrow]') as HTMLElement
      
      if (!bargainBtn || !shareBtn || !trickIcon || !trickTitle || !trickProgress) return
      
      // 折叠功能
      let isCollapsed = false
      if (trickToggle && trickBox && trickArrow) {
        trickToggle.addEventListener('click', () => {
          isCollapsed = !isCollapsed
          if (isCollapsed) {
            trickBox.style.display = 'none'
            trickArrow.textContent = '▶'
          } else {
            trickBox.style.display = 'block'
            trickArrow.textContent = '▼'
          }
        })
      }
      
      let trickLevel = 0
      const tricks = [
        {
          icon: '💎',
          title: '还差1颗钻石就成功了！',
          progress: '<div style="font-size:13px;font-weight:600;color:#ff4757">钻石：0/1</div>'
        },
        {
          icon: '🪙',
          title: '1颗钻石 = 99个金币',
          progress: '<div style="font-size:13px;font-weight:600;color:#ffa500">金币：98/99（还差1个）</div>'
        },
        {
          icon: '⭐',
          title: '1个金币 = 100个星星',
          progress: '<div style="font-size:13px;font-weight:600;color:#4caf50">星星：99/100（马上就够了）</div>'
        },
        {
          icon: '✨',
          title: '1个星星 = 50个火花',
          progress: '<div style="font-size:13px;font-weight:600;color:#9c27b0">火花：49/50（就差临门一脚）</div>'
        },
        {
          icon: '🔥',
          title: '1个火花 = 200个能量',
          progress: '<div style="font-size:13px;font-weight:600;color:#f44336">能量：199/200（就差1点能量）</div>'
        },
        {
          icon: '⚡',
          title: '还差1个新用户助力',
          progress: '<div style="font-size:13px;font-weight:600;color:#ff9800">新用户：0/1（分享给新朋友）</div>'
        },
        {
          icon: '🐭',
          title: '哦哦~ 能量钻石被老鼠叼走了',
          progress: '<div style="font-size:13px;font-weight:600;color:#666">一切归零，重新开始吧 😈</div>'
        }
      ]
      
      const updateTrick = () => {
        const trick = tricks[trickLevel % tricks.length]
        
        // 按钮loading状态
        const originalText = bargainBtn.innerHTML
        bargainBtn.innerHTML = '<span>助力中...</span>'
        bargainBtn.style.opacity = '0.7'
        bargainBtn.disabled = true
        shareBtn.disabled = true
        
        setTimeout(() => {
          // 更新卡片内容
          trickIcon.textContent = trick.icon
          trickTitle.textContent = trick.title
          trickProgress.innerHTML = trick.progress
          
          // 添加更新动画
          const trickBoxEl = container.querySelector('[data-trick-box]') as HTMLElement
          if (trickBoxEl) {
            trickBoxEl.style.transform = 'scale(1.02)'
            trickBoxEl.style.transition = 'transform 0.3s'
            setTimeout(() => {
              trickBoxEl.style.transform = 'scale(1)'
            }, 300)
          }
          
          // 显示灰色弹窗提示
          const toast = document.createElement('div')
          toast.textContent = '助力成功！查看最新进度'
          toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `
          document.body.appendChild(toast)
          
          setTimeout(() => {
            toast.style.opacity = '0'
            toast.style.transition = 'opacity 0.3s'
            setTimeout(() => toast.remove(), 300)
          }, 1500)
          
          // 恢复按钮
          bargainBtn.innerHTML = originalText
          bargainBtn.style.opacity = '1'
          bargainBtn.disabled = false
          shareBtn.disabled = false
          
          trickLevel++
        }, 800)
      }
      
      bargainBtn.addEventListener('click', updateTrick)
      shareBtn.addEventListener('click', updateTrick)
    }

    // ==================== 日记本翻页 & 涂鸦交互 ====================
    if (templateId === 'diary') {
      const book = containerRef.current.querySelector('[data-diary-book]')
      if (!book) return

      // 1. 封面点击打开
      const cover = book.querySelector('.cover') as HTMLElement
      if (cover) {
        cover.style.zIndex = '20'
        cover.style.cursor = 'pointer'

        cover.addEventListener('click', (e) => {
          e.stopPropagation()
          const isFlipped = cover.style.transform.includes('-180deg')

          if (isFlipped) {
            cover.style.transform = 'rotateY(0deg)'
            cover.style.zIndex = '20'
          } else {
            cover.style.transform = 'rotateY(-180deg)'
            cover.style.zIndex = '1'
          }
        })
      }

      // 2. 页面翻动
      const pages = Array.from(book.querySelectorAll('.page:not(.cover)')) as HTMLElement[]

      pages.forEach((page) => {
        const pageNumber = parseInt(page.getAttribute('data-page') || '0')

        // 随机微小旋转，增加不规整感 (-1deg 到 1deg)
        const randomRotate = (Math.random() * 2 - 1).toFixed(1)
        const baseTransform = `rotate(${randomRotate}deg)`
        page.style.transform = baseTransform

        // Ensure pointer events are on
        page.style.pointerEvents = 'auto'
        page.style.cursor = 'pointer'

        // 初始Z-index
        const initialZ = 8 - pageNumber
        page.style.zIndex = String(initialZ)

        page.addEventListener('click', (e) => {
          e.stopPropagation()

          const currentTransform = page.style.transform
          const isFlipped = currentTransform.includes('-180deg')

          if (isFlipped) {
            // 翻回来
            page.style.transform = `rotateY(0deg) ${baseTransform}`
            page.style.zIndex = String(initialZ)
          } else {
            // 翻过去
            page.style.transform = `rotateY(-180deg) ${baseTransform}`
            const flippedZ = 1 + pageNumber
            page.style.zIndex = String(flippedZ)
          }
        })
      })

      // 3. 涂鸦渲染 (支持多页涂鸦)
      const doodleContainers = book.querySelectorAll('[data-doodle-container]')
      
      // 简单的SVG库
      const svgs: Record<string, string> = {
        cat: `<svg viewBox="0 0 100 100" fill="none" stroke="#333" stroke-width="3"><path d="M20 80 Q 30 20 50 20 Q 70 20 80 80" /><circle cx="35" cy="40" r="5" fill="#333" /><circle cx="65" cy="40" r="5" fill="#333" /><path d="M45 50 L 55 50" /><path d="M20 25 L 30 10 L 40 25" /><path d="M60 25 L 70 10 L 80 25" /></svg>`,
        sun: `<svg viewBox="0 0 100 100" fill="none" stroke="#f39c12" stroke-width="3"><circle cx="50" cy="50" r="20" /><line x1="50" y1="20" x2="50" y2="10" /><line x1="50" y1="80" x2="50" y2="90" /><line x1="20" y1="50" x2="10" y2="50" /><line x1="80" y1="50" x2="90" y2="50" /><line x1="29" y1="29" x2="22" y2="22" /><line x1="71" y1="29" x2="78" y2="22" /><line x1="29" y1="71" x2="22" y2="78" /><line x1="71" y1="71" x2="78" y2="78" /></svg>`,
        coffee: `<svg viewBox="0 0 100 100" fill="none" stroke="#795548" stroke-width="3"><path d="M20 30 L 20 70 Q 20 90 50 90 Q 80 90 80 70 L 80 30 Z" /><path d="M80 40 Q 95 40 95 55 Q 95 70 80 70" /><path d="M30 20 Q 35 5 40 20" /><path d="M50 20 Q 55 5 60 20" /><path d="M70 20 Q 75 5 80 20" /></svg>`,
        heart: `<svg viewBox="0 0 100 100" fill="#e74c3c" stroke="none"><path d="M50 85 Q 10 55 20 30 Q 30 5 50 30 Q 70 5 80 30 Q 90 55 50 85" /></svg>`,
        star: `<svg viewBox="0 0 100 100" fill="#f1c40f" stroke="none"><polygon points="50,10 61,35 88,35 66,50 75,75 50,60 25,75 34,50 12,35 39,35" /></svg>`,
        flower: `<svg viewBox="0 0 100 100" fill="none" stroke="#e91e63" stroke-width="2"><circle cx="50" cy="50" r="10" fill="#f1c40f" stroke="none" /><path d="M50 40 Q 50 10 60 20 Q 70 30 60 40" /><path d="M60 50 Q 90 50 80 60 Q 70 70 60 60" /><path d="M50 60 Q 50 90 40 80 Q 30 70 40 60" /><path d="M40 50 Q 10 50 20 40 Q 30 30 40 40" /><path d="M50 70 L 50 95" stroke="#2ecc71" /></svg>`,
        cloud: `<svg viewBox="0 0 100 100" fill="none" stroke="#3498db" stroke-width="2"><path d="M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 50,0 a20,20 0 0,1 0,40 z" /></svg>`,
        smile: `<svg viewBox="0 0 100 100" fill="none" stroke="#f39c12" stroke-width="3"><circle cx="50" cy="50" r="40" /><circle cx="35" cy="35" r="5" fill="#f39c12" /><circle cx="65" cy="35" r="5" fill="#f39c12" /><path d="M30 65 Q 50 85 70 65" /></svg>`,
      }
      
      const keys = Object.keys(svgs)

      doodleContainers.forEach(container => {
        const placeholder = container.querySelector('[data-doodle-type]')
        let type = placeholder?.getAttribute('data-doodle-type')?.toLowerCase().trim()
        
        // 如果没有指定类型，或者类型是 random，或者类型不存在，则随机选择
        if (!type || type === 'random' || !svgs[type]) {
          type = keys[Math.floor(Math.random() * keys.length)]
        }
        
        container.innerHTML = svgs[type]
      })
    }
    
    // ==================== 成人浏览历史模糊效果 ====================
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

    // ==================== MBTI 测试动画 & 交互 ====================
    if (templateId === 'mbti_test') {
      const container = containerRef.current
      if (!container) return

      // 1. 加载动画
      const bars = container.querySelectorAll('div[style*="width: {{"]')
      const progressBars = container.querySelectorAll('div[style*="transition: width"]')
      progressBars.forEach(bar => {
        const el = bar as HTMLElement
        const targetWidth = el.style.width
        el.style.width = '0%'
        setTimeout(() => { el.style.width = targetWidth }, 100)
      })

      // 2. 点击交互
      const showModal = (title: string, content: string) => {
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(30,30,46,0.95); backdrop-filter: blur(5px);
          z-index: 10; padding: 20px; display: flex; flex-direction: column;
          justify-content: center; animation: fadeIn 0.2s;
        `
        modal.innerHTML = `
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2ecc71;">${title}</div>
          <div style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.9);">${content}</div>
          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.5);">点击关闭</div>
        `
        modal.onclick = () => modal.remove()
        container.appendChild(modal)
      }

      // 监听点击事件
      const analysisText = container.querySelector('[data-analysis]')?.textContent || ''
      const careerText = container.querySelector('[data-career]')?.textContent || ''
      const relText = container.querySelector('[data-relationship]')?.textContent || ''
      
      // 点击标题
      const titleEl = container.querySelector('[data-action="show-type-detail"]') as HTMLElement
      if (titleEl) {
        titleEl.addEventListener('click', () => {
          showModal('深度解析', analysisText || '暂无详细分析')
        })
      }

      // 点击描述
      const descEl = container.querySelector('[data-action="show-desc-detail"]') as HTMLElement
      if (descEl) {
        descEl.addEventListener('click', () => {
          showModal('生活建议', `
            <div style="margin-bottom:10px"><strong style="color:#3498db">🎓 职业建议：</strong><br>${careerText}</div>
            <div><strong style="color:#e74c3c">❤️ 情感建议：</strong><br>${relText}</div>
          `)
        })
      }

      // 点击维度
      container.querySelectorAll('[data-action="show-dim-detail"]').forEach(el => {
        el.addEventListener('click', () => {
          const dim = el.getAttribute('data-dim')
          let title = ''
          let content = ''
          switch(dim) {
            case 'ei': title = 'E vs I (能量来源)'; content = 'E型倾向于从外部世界获取能量，I型则倾向于从内心世界获取能量。'; break;
            case 'ns': title = 'N vs S (感知方式)'; content = 'N型关注未来的可能性和抽象概念，S型关注当下的现实和具体细节。'; break;
            case 'tf': title = 'T vs F (判断方式)'; content = 'T型倾向于根据逻辑和客观标准做决定，F型则倾向于根据价值观和他人感受做决定。'; break;
            case 'jp': title = 'J vs P (生活方式)'; content = 'J型倾向于有计划、有条理的生活，P型则倾向于灵活、随性的生活。'; break;
          }
          showModal(title, content)
        })
      })
    }

    // ==================== 睡眠报告交互 ====================
    if (templateId === 'sleep_report') {
      const container = containerRef.current
      if (!container) return

      const scoreEl = container.querySelector('div[style*="font-size: 48px"]') as HTMLElement
      const adviceEl = container.querySelector('[data-advice]')
      const showAdviceBtn = container.querySelector('[data-action="show-advice"]')
      const toggleDreamBtn = container.querySelector('[data-action="toggle-dream"]')
      const dreamLog = container.querySelector('.dream-log') as HTMLElement

      // 1. 分数动画
      if (scoreEl) {
        const targetScore = parseInt(scoreEl.textContent || '0')
        let currentScore = 0
        const duration = 1000
        const stepTime = 20
        const increment = targetScore / (duration / stepTime)
        
        const timer = setInterval(() => {
          currentScore += increment
          if (currentScore >= targetScore) {
            currentScore = targetScore
            clearInterval(timer)
          }
          scoreEl.textContent = Math.floor(currentScore).toString()
        }, stepTime)
      }

      // 2. 展开梦境
      if (toggleDreamBtn && dreamLog) {
        toggleDreamBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          const isExpanded = dreamLog.style.height !== '40px'
          dreamLog.style.height = isExpanded ? '40px' : 'auto'
          dreamLog.style.background = isExpanded ? 'rgba(162, 155, 254, 0.1)' : 'rgba(162, 155, 254, 0.2)'
        })
      }

      // 3. 显示建议
      if (showAdviceBtn && adviceEl) {
        showAdviceBtn.addEventListener('click', () => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(20, 30, 48, 0.95); backdrop-filter: blur(5px);
            z-index: 10; padding: 20px; display: flex; flex-direction: column;
            justify-content: center; animation: fadeIn 0.2s; color: white;
          `
          modal.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #a29bfe;">🌙 助眠建议</div>
            <div style="font-size: 14px; line-height: 1.6; opacity: 0.9;">${adviceEl.textContent}</div>
            <div style="margin-top: 20px; text-align: center; font-size: 12px; opacity: 0.5;">点击关闭</div>
          `
          modal.onclick = () => modal.remove()
          container.appendChild(modal)
        })
      }
    }

    // ==================== 互动游戏交互 ====================
    if (templateId === 'adult_game') {
      const container = containerRef.current
      if (!container) return

      const character = container.querySelector('[data-action="touch-character"]') as HTMLElement
      const favorability = container.querySelector('[data-action="show-favorability"]') as HTMLElement
      const innerThoughts = container.querySelector('[data-inner-thoughts]')
      const secretClue = container.querySelector('[data-secret-clue]')

      // 1. 触摸角色 -> 震动 + 显示内心独白
      if (character) {
        character.addEventListener('click', (e) => {
          e.stopPropagation()
          
          // 震动动画
          character.style.animation = 'shake 0.5s'
          setTimeout(() => character.style.animation = '', 500)

          // 显示气泡
          const thoughts = innerThoughts?.textContent || '...'
          const bubble = document.createElement('div')
          bubble.textContent = thoughts
          bubble.style.cssText = `
            position: absolute; bottom: 300px; left: 50%; transform: translateX(-50%);
            background: white; color: #333; padding: 10px 15px; border-radius: 20px;
            font-size: 12px; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            max-width: 80%; z-index: 20; animation: popUp 0.3s;
          `
          // 小三角
          const triangle = document.createElement('div')
          triangle.style.cssText = `
            position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
            width: 0; height: 0; border-left: 6px solid transparent;
            border-right: 6px solid transparent; border-top: 6px solid white;
          `
          bubble.appendChild(triangle)
          container.appendChild(bubble)

          setTimeout(() => {
            bubble.style.opacity = '0'
            bubble.style.transition = 'opacity 0.5s'
            setTimeout(() => bubble.remove(), 500)
          }, 3000)
        })
      }

      // 2. 点击好感度
      if (favorability) {
        favorability.addEventListener('click', () => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(45, 52, 54, 0.95); z-index: 30; padding: 20px;
            display: flex; flex-direction: column; justify-content: center;
            animation: fadeIn 0.2s; color: white; text-align: center;
          `
          modal.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">❤</div>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #ff7675;">好感度分析</div>
            <div style="font-size: 14px; opacity: 0.8;">她对你的感觉似乎...<br>已经不仅仅是朋友了哦？</div>
            <div style="margin-top: 15px; font-size: 12px; color: #fab1a0;">隐藏线索：${secretClue?.textContent || '无'}</div>
            <div style="margin-top: 20px; font-size: 12px; opacity: 0.5;">点击关闭</div>
          `
          modal.onclick = () => modal.remove()
          container.appendChild(modal)
        })
      }

      // 3. 选项逻辑 (保留)
      const options = container.querySelectorAll('[data-option]')
      options.forEach(opt => {
        const el = opt as HTMLElement
        el.addEventListener('click', () => {
          options.forEach(o => {
            (o as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
            (o as HTMLElement).style.transform = 'scale(1)';
          })
          el.style.background = '#fab1a0'
          el.style.transform = 'scale(0.98)'
        })
      })
    }

    // ==================== 直播打赏交互 ====================
    if (templateId === 'live_donation') {
      const container = containerRef.current
      if (!container) return

      const giftBtn = container.querySelector('[data-gift-btn]') as HTMLElement
      const streamerBtn = container.querySelector('[data-action="streamer-click"]') as HTMLElement
      const rankBtn = container.querySelector('[data-action="show-rank"]') as HTMLElement
      const reactionBubble = container.querySelector('.reaction-bubble') as HTMLElement
      const vipList = container.querySelector('[data-vip-list]')

      // 1. 主播反应
      if (streamerBtn && reactionBubble) {
        streamerBtn.addEventListener('click', () => {
          reactionBubble.style.transform = 'scale(1)'
          setTimeout(() => {
            reactionBubble.style.transform = 'scale(0)'
          }, 3000)
        })
      }

      // 2. 榜单弹窗
      if (rankBtn && vipList) {
        rankBtn.addEventListener('click', () => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); z-index: 20; padding: 20px;
            display: flex; flex-direction: column; justify-content: center;
            animation: fadeIn 0.2s; color: white;
          `
          modal.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #ffd700; text-align: center;">👑 贵宾席</div>
            <div style="font-size: 14px; line-height: 2;">${vipList.innerHTML}</div>
            <div style="margin-top: 20px; text-align: center; font-size: 12px; opacity: 0.5;">点击关闭</div>
          `
          modal.onclick = () => modal.remove()
          container.appendChild(modal)
        })
      }

      // 3. 礼物特效 (保留)
      if (giftBtn) {
        giftBtn.addEventListener('click', () => {
          giftBtn.style.transform = 'scale(0.9)'
          setTimeout(() => giftBtn.style.transform = 'scale(1)', 100)
          
          const particle = document.createElement('div')
          const icons = ['🚀', '✨', '💖', '💎', '🎉']
          particle.textContent = icons[Math.floor(Math.random() * icons.length)]
          particle.style.cssText = `
            position: absolute; bottom: 60px; right: 20px; font-size: 24px;
            pointer-events: none; animation: flyUp 1s ease-out forwards; z-index: 15;
          `
          if (!document.getElementById('live-anim-style')) {
            const style = document.createElement('style')
            style.id = 'live-anim-style'
            style.textContent = `@keyframes flyUp { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(-${Math.random()*50}px, -150px) scale(1.5); opacity: 0; } }`
            document.head.appendChild(style)
          }
          container.appendChild(particle)
          setTimeout(() => particle.remove(), 1000)
        })
      }
    }


    // ==================== 愿望清单交互 ====================
    if (templateId === 'fantasy_list') {
      const container = containerRef.current
      if (!container) return

      const items = container.querySelectorAll('[data-item]')
      const progressText = container.querySelector('[data-progress]')
      
      const total = items.length
      let completed = 0
      
      const updateProgress = () => {
        if (progressText) progressText.textContent = `${completed}/${total}`
      }
      
      items.forEach(item => {
        const el = item as HTMLElement
        const check = el.querySelector('.check-mark') as HTMLElement
        const detail = el.querySelector('.item-detail') as HTMLElement
        const arrow = el.innerText.includes('▼') ? el.innerText.slice(-1) : '' // Simplified check
        
        let isExpanded = false
        let isChecked = false
        
        // 点击整个条目
        el.addEventListener('click', (e) => {
          // 阻止事件冒泡，避免触发其他点击
          e.stopPropagation()
          
          // 切换展开/折叠
          isExpanded = !isExpanded
          
          if (isExpanded) {
             detail.style.height = 'auto'
             detail.style.padding = '10px 16px'
             detail.style.opacity = '1'
             // 简单模拟 checked 状态切换（如果你希望点击复选框才切换，可以单独监听 check-box）
             // 这里为了“交互强一点”，我们点击就展开，并且如果没勾选，顺便勾选上（或者不勾选，看需求）
             // 按照用户习惯，点击条目展开，点击复选框勾选。
             // 这里简化：点击条目就是展开详情。
          } else {
             detail.style.height = '0'
             detail.style.padding = '0 16px'
             detail.style.opacity = '0'
          }
        })

        // 单独监听复选框点击
        const checkBox = el.querySelector('.check-box') as HTMLElement
        if (checkBox) {
          checkBox.addEventListener('click', (e) => {
            e.stopPropagation() // 阻止冒泡，不触发展开
            isChecked = !isChecked
            
            if (isChecked) {
              completed++
              check.style.display = 'block'
              checkBox.style.background = '#ffadd2'
              //el.style.opacity = '0.8'
            } else {
              completed--
              check.style.display = 'none'
              checkBox.style.background = 'transparent'
              //el.style.opacity = '1'
            }
            updateProgress()
          })
        }
      })
      
      // 初始化进度
      if (progressText) {
        const match = progressText.textContent?.match(/(\d+)\//)
        if (match) completed = parseInt(match[1])
      }
    }

    
    // ==================== 情侣酒店交互 ====================
    if (templateId === 'couple_hotel') {
      const container = containerRef.current
      const mask = container.querySelector('[data-privacy-mask]') as HTMLElement
      const unlockBtn = container.querySelector('[data-unlock-btn]') as HTMLElement
      
      // 1. 私密模式切换
      if (mask && unlockBtn) {
        unlockBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          mask.style.opacity = '1'
          mask.style.pointerEvents = 'auto'
        })
        
        mask.addEventListener('click', () => {
          mask.style.opacity = '0'
          mask.style.pointerEvents = 'none'
        })
      }
      
      // 2. 生成特色标签
      const featuresData = container.querySelector('[data-features]')?.getAttribute('data-features')
      const tagsContainer = container.querySelector('[data-feature-tags]')
      
      if (featuresData && tagsContainer) {
        const features = featuresData.split(/[、，,]/).filter(f => f.trim())
        features.forEach(feature => {
          const tag = document.createElement('div')
          tag.textContent = feature.trim()
          tag.style.cssText = `
            font-size: 10px;
            padding: 4px 8px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            color: rgba(255,255,255,0.8);
            background: rgba(255,255,255,0.05);
          `
          tagsContainer.appendChild(tag)
        })
      }
    }

    // ==================== 情趣商城订单交互 ====================
    if (templateId === 'adult_shop') {
      const container = containerRef.current
      const boxContainer = container.querySelector('.box-container') as HTMLElement
      const secretNote = container.querySelector('.secret-note') as HTMLElement
      const noteStatus = container.querySelector('.note-status') as HTMLElement
      const noteContent = container.querySelector('.note-content') as HTMLElement
      const closeNoteBtn = container.querySelector('.close-note') as HTMLElement
      
      // 1. 翻转盒子 (点击除了内部交互元素以外的区域)
      if (boxContainer) {
        let isFlipped = false
        container.addEventListener('click', (e) => {
          // 如果点击的是note内部，不翻转
          if (secretNote && secretNote.contains(e.target as Node)) return
          
          isFlipped = !isFlipped
          boxContainer.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          
          // 翻转回去时，隐藏note
          if (!isFlipped && secretNote) {
             secretNote.style.transform = 'rotate(-2deg) translateY(120%)'
          }
        })
      }
      
      // 2. 关闭便签
      if (closeNoteBtn && secretNote) {
        closeNoteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          secretNote.style.transform = 'rotate(-2deg) translateY(120%)'
        })
      }
      
      // 3. 商品点击交互
      const products = container.querySelectorAll('.product-item')
      products.forEach(product => {
        product.addEventListener('click', (e) => {
          e.stopPropagation() // 防止触发盒子翻转
          const name = product.querySelector('div[style*="filter"]') as HTMLElement
          const hint = product.querySelector('.hint-text') as HTMLElement
          
          if (name) {
            const currentFilter = name.style.filter
            
            // 状态1：模糊 -> 清晰
            if (currentFilter !== 'none') {
              name.style.filter = 'none'
              if (hint) hint.style.opacity = '1'
            } 
            // 状态2：清晰 -> 显示便签
            else {
              if (secretNote && noteStatus && noteContent) {
                const status = product.getAttribute('data-status') || '未知状态'
                const note = product.getAttribute('data-note') || '暂无记录'
                
                noteStatus.textContent = `Status: ${status}`
                noteContent.textContent = note
                
                secretNote.style.transform = 'rotate(-2deg) translateY(0)'
              }
            }
          }
        })
      })
    }

    // ==================== 婚恋网配对交互 ====================
    if (templateId === 'dating_profile') {
      const container = containerRef.current
      const cardInner = container.querySelector('.card-inner') as HTMLElement
      
      // 1. 翻转卡片
      if (cardInner) {
        let isFlipped = false
        cardInner.addEventListener('click', () => {
          isFlipped = !isFlipped
          cardInner.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        })
      }
      
      // 2. 生成标签
      const tagsData = container.querySelector('div[style*="display:none"]')?.textContent
      const tagsContainer = container.querySelector('[data-tags]')
      
      if (tagsData && tagsContainer) {
        const tags = tagsData.split(/[、，,]/).filter(t => t.trim())
        const colors = ['#ff7675', '#74b9ff', '#55efc4', '#a29bfe', '#fdcb6e']
        
        tags.forEach((tagText, index) => {
          const tag = document.createElement('div')
          tag.textContent = tagText.trim()
          tag.style.cssText = `
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 15px;
            background: ${colors[index % colors.length]}20;
            color: ${colors[index % colors.length]};
            font-weight: 500;
          `
          tagsContainer.appendChild(tag)
        })
      }
    }

    // ==================== 开房记录交互 ====================
    if (templateId === 'checkin_record') {
      const container = containerRef.current
      const mosaics = container.querySelectorAll('[data-mosaic]')
      
      mosaics.forEach(mosaic => {
        mosaic.addEventListener('click', (e) => {
          e.stopPropagation()
          const el = mosaic as HTMLElement
          el.style.opacity = el.style.opacity === '0' ? '0.8' : '0'
        })
      })
    }

    // ==================== 酒吧账单交互 ====================
    if (templateId === 'bar_bill') {
      const container = containerRef.current
      const toggleBtn = container.querySelector('[data-toggle-aa]') as HTMLElement
      const aaPanel = container.querySelector('[data-aa-panel]') as HTMLElement
      const splitBtns = container.querySelectorAll('[data-split]')
      const resultDisplay = container.querySelector('[data-split-result]')
      
      // 1. 展开/收起面板
      if (toggleBtn && aaPanel) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          const isHidden = aaPanel.style.display === 'none'
          aaPanel.style.display = isHidden ? 'block' : 'none'
          toggleBtn.textContent = isHidden ? 'Hide Calculator' : 'Tap to Split Bill'
        })
      }
      
      // 2. 计算AA
      if (resultDisplay) {
        // 获取总金额 (假设格式为 ¥19998 或 19998)
        const totalText = container.innerText.match(/TOTAL\s+¥?(\d+)/i)?.[1] || '0'
        const total = parseInt(totalText)
        
        splitBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            // 重置样式
            splitBtns.forEach(b => (b as HTMLElement).style.background = 'transparent')
            ;(btn as HTMLElement).style.background = '#f0f0f0'
            
            const count = parseInt(btn.getAttribute('data-split') || '1')
            const perPerson = (total / count).toFixed(0)
            resultDisplay.textContent = `¥${perPerson} / person`
          })
        })
      }
    }

    // ==================== 年度账单交互 ====================
    if (templateId === 'yearly_bill') {
      const container = containerRef.current
      const shareBtn = container.querySelector('[data-share-btn]')
      
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          shareBtn.textContent = '正在生成...'
          setTimeout(() => {
            shareBtn.textContent = '已保存到相册'
            ;(shareBtn as HTMLElement).style.background = 'rgba(82, 196, 26, 0.2)'
            ;(shareBtn as HTMLElement).style.color = '#52c41a'
            setTimeout(() => {
              shareBtn.textContent = '点击生成海报'
              ;(shareBtn as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
              ;(shareBtn as HTMLElement).style.color = 'white'
            }, 2000)
          }, 1500)
        })
      }
    }

    // ==================== 话费充值交互 ====================
    if (templateId === 'phone_recharge') {
      const container = containerRef.current
      const completeBtn = container.querySelector('[data-action="complete"]')
      
      if (completeBtn) {
        completeBtn.addEventListener('click', () => {
          container.style.transition = 'all 0.5s'
          container.style.transform = 'scale(0.95)'
          container.style.opacity = '0.5'
          completeBtn.textContent = '已完成'
        })
      }
    }

    // ==================== 加油小票交互 ====================
    if (templateId === 'gas_record') {
      const container = containerRef.current
      container.addEventListener('click', () => {
        // 撕纸效果动画
        container.style.transition = 'transform 0.2s'
        container.style.transform = 'translateY(5px) rotate(-1deg)'
        setTimeout(() => {
          container.style.transform = 'translateY(0) rotate(0)'
        }, 200)
      })
    }

    // ==================== 高端消费交互 ====================
    if (templateId === 'luxury_purchase') {
      const container = containerRef.current
      // 简单的鼠标移动光泽效果
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        container.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.8) 0%, #f8f8f8 60%)`
      })
      container.addEventListener('mouseleave', () => {
        container.style.background = '#f8f8f8'
      })
    }

    // ==================== 退款申请交互 ====================
    if (templateId === 'refund_request') {
      // 主要是静态展示，添加简单的点击反馈
      const container = containerRef.current
      container.addEventListener('click', () => {
        // 模拟刷新状态
        const statusEl = container.querySelector('div[style*="font-weight: bold"]') as HTMLElement
        if (statusEl && statusEl.textContent === '退款成功') return
        
        if (statusEl) {
          const original = statusEl.textContent
          statusEl.textContent = '刷新中...'
          setTimeout(() => {
            statusEl.textContent = original
          }, 800)
        }
      })
    }

    // ==================== 体检/检测报告交互 ====================
    if (templateId === 'health_checkup' || templateId === 'std_test') {
      const container = containerRef.current
      const report = container.querySelector('div[data-health-report], div[data-medical-report]') as HTMLElement
      
      if (report) {
        report.style.cursor = 'pointer'
        report.addEventListener('click', () => {
          // 模拟折叠/展开
          if (report.style.maxHeight) {
            report.style.maxHeight = ''
            report.style.overflow = 'visible'
          } else {
            // 默认是展开的，这里只是添加一个微交互
            report.style.transform = 'scale(0.98)'
            setTimeout(() => report.style.transform = 'scale(1)', 150)
          }
        })
      }
    }

    // ==================== 好友列表交互 ====================
    if (templateId === 'friend_list') {
      const container = containerRef.current
      const items = container.querySelectorAll('div[onmouseover]')
      
      items.forEach(item => {
        item.addEventListener('click', () => {
          const name = item.querySelector('div[style*="font-weight: 500"]')?.textContent
          if (name) {
            // 模拟发起聊天
            console.log(`Chat with ${name}`)
            const el = item as HTMLElement
            el.style.background = '#e6f7ff'
            setTimeout(() => el.style.background = '#fff', 300)
          }
        })
      })
    }

    // ==================== 评论区交互 ====================
    if (templateId === 'comment_section') {
      const container = containerRef.current
      const likeBtns = container.querySelectorAll('div[style*="text-align: center"]')
      
      likeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const heart = btn.querySelector('div[style*="font-size: 16px"]')
          const count = btn.querySelector('div[style*="font-size: 10px"]')
          
          if (heart && count) {
            if (heart.textContent === '♡') {
              heart.textContent = '❤️'
              heart.style.color = 'red'
              const num = parseInt(count.textContent || '0')
              count.textContent = isNaN(num) ? '1' : String(num + 1)
            } else {
              heart.textContent = '♡'
              heart.style.color = '#999'
              // 简化逻辑，取消点赞不减数字或还原（略）
            }
          }
        })
      })
    }

    // ==================== 配对成功交互 ====================
    if (templateId === 'dating_match') {
      const container = containerRef.current
      const btns = container.querySelectorAll('button')
      
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btn.style.transform = 'scale(0.95)'
          setTimeout(() => btn.style.transform = 'scale(1)', 100)
          
          if (btn.textContent?.includes('发消息')) {
            btn.textContent = '已发送'
            btn.style.background = '#ddd'
            btn.style.color = '#666'
          }
        })
      })
    }

    // ==================== 树洞/表白墙交互 ====================
    if (templateId === 'confession_wall' || templateId === 'confession_board') {
      const container = containerRef.current
      const likeArea = container.querySelector('div[style*="display: flex; gap: 15px"]')
      
      if (likeArea) {
        likeArea.addEventListener('click', () => {
          const heart = likeArea.querySelector('span')
          if (heart) {
            heart.style.transform = 'scale(1.5)'
            heart.style.color = 'red'
            setTimeout(() => heart.style.transform = 'scale(1)', 200)
          }
        })
      }
    }

    // ==================== 学生证/VIP卡/会员卡交互 ====================
    if (templateId === 'student_card' || templateId === 'vip_card' || templateId === 'spa_membership') {
      const container = containerRef.current
      const card = container.querySelector('div[style*="border-radius"]') as HTMLElement
      
      if (card) {
        card.style.transition = 'transform 0.5s, box-shadow 0.5s'
        card.style.transformStyle = 'preserve-3d'
        
        container.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          
          const centerX = rect.width / 2
          const centerY = rect.height / 2
          
          const rotateX = ((y - centerY) / centerY) * -10 // Max 10deg
          const rotateY = ((x - centerX) / centerX) * 10 // Max 10deg
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
          card.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0,0,0,0.2)`
        })
        
        container.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'
          card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
        })
      }
    }

    // ==================== 网站会员交互 ====================
    if (templateId === 'adult_site_membership') {
      const container = containerRef.current
      const btn = container.querySelector('button')
      if (btn) {
        btn.addEventListener('click', () => {
          window.open('about:blank', '_blank') // 模拟跳转
        })
      }
    }

    // ==================== 排行榜交互 ====================
    if (templateId === 'leaderboard') {
      const container = containerRef.current
      const myRank = container.querySelector('div[style*="background: #f5f5f5"]') as HTMLElement
      
      if (myRank) {
        myRank.addEventListener('click', () => {
          myRank.style.background = '#e6f7ff'
          myRank.style.border = '1px solid #1890ff'
          setTimeout(() => {
            myRank.style.background = '#f5f5f5'
            myRank.style.border = '1px solid #eee'
          }, 1000)
        })
      }
    }

    // ==================== 夜店门票交互 ====================
    if (templateId === 'club_ticket') {
      const container = containerRef.current
      const ticket = container.querySelector('[data-club-ticket]') as HTMLElement
      
      if (ticket) {
        // 模拟全息反光
        container.addEventListener('mousemove', (e) => {
          const rect = ticket.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width * 100
          const y = (e.clientY - rect.top) / rect.height * 100
          
          const glare = ticket.querySelector('div[style*="linear-gradient"]') as HTMLElement
          if (glare) {
            glare.style.background = `linear-gradient(${135 + x}deg, transparent 40%, rgba(255,255,255,0.3) ${y}%, transparent 60%)`
          }
        })
      }
    }

    // ==================== 付费内容交互 ====================
    if (templateId === 'paid_content') {
      const container = containerRef.current
      const unlockBtn = container.querySelector('button')
      const lockScreen = container.querySelector('div[style*="filter: blur"]') as HTMLElement
      const lockIcon = container.querySelector('div[style*="font-size: 40px"]')
      
      if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
          unlockBtn.textContent = 'Processing...'
          setTimeout(() => {
            if (lockScreen) lockScreen.style.filter = 'none'
            if (lockIcon && lockIcon.parentElement) lockIcon.parentElement.style.display = 'none'
            unlockBtn.style.display = 'none'
            
            // 移除遮罩文字
            const mask = container.querySelector('div[style*="background: rgba(0,0,0,0.3)"]')
            if (mask) mask.remove()
          }, 1500)
        })
      }
    }

    // ==================== 闹钟交互 ====================
    if (templateId === 'alarm_clock') {
      const container = containerRef.current
      const toggles = container.querySelectorAll('div[style*="border-radius: 15px"]')
      
      toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
          const el = toggle as HTMLElement
          const circle = el.querySelector('div') as HTMLElement
          const isOff = el.style.background === 'rgb(51, 51, 51)' || el.style.background === '#333'
          
          if (isOff) {
            el.style.background = '#34c759'
            circle.style.left = ''
            circle.style.right = '2px'
          } else {
            el.style.background = '#333'
            circle.style.right = ''
            circle.style.left = '2px'
          }
        })
      })
    }

    // ==================== 浏览历史交互 ====================
    if (templateId === 'browser_history') {
      const container = containerRef.current
      const clearBtn = container.querySelector('div[style*="cursor: pointer"]')
      const items = container.querySelectorAll('div[style*="border-bottom"]')
      
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('Clear all history?')) {
            items.forEach(item => item.remove())
            clearBtn.textContent = 'History Cleared'
          }
        })
      }
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
        /* 小剧场卡片响应式样式 - 覆盖所有模板的固定宽度和高度 */
        .theatre-content > div[style*="max-width"],
        .theatre-content > div[data-student-card],
        .theatre-content > div[data-vip-card],
        .theatre-content > div[data-spa-card],
        .theatre-content > div[data-ios-memo],
        .theatre-content > div[data-receipt],
        .theatre-content > div[data-coupon],
        .theatre-content > div[data-shopping-cart],
        .theatre-content > div[data-menu-book],
        .theatre-content > div[data-club-ticket],
        .theatre-content > div {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* 高度自适应 - 移除固定高度 */
        .theatre-content > div[style*="height:"],
        .theatre-content > div[style*="height: "] {
          height: auto !important;
          min-height: unset !important;
        }
        
        /* 内部元素也需要响应式调整 */
        .theatre-content img,
        .theatre-content canvas {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* 字体大小响应式调整 */
        @media (max-width: 375px) {
          .theatre-content {
            font-size: 13px;
          }
          .theatre-content div[style*="font-size: 18px"] {
            font-size: 16px !important;
          }
          .theatre-content div[style*="font-size: 20px"] {
            font-size: 18px !important;
          }
          .theatre-content div[style*="font-size: 24px"] {
            font-size: 20px !important;
          }
        }
        
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
      <div className="my-4 w-full max-w-[280px] sm:max-w-[320px]" ref={containerRef}>
        <div 
          className="theatre-content"
          dangerouslySetInnerHTML={{ __html: message.theatre.htmlContent }}
        />
      </div>
    </>
  )
}
