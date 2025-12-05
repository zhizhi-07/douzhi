/**
 * 物流查看弹窗组件
 * 显示自动生成的物流信息（只读）
 */

import { useState, useEffect, useRef } from 'react'
import { playSystemSound } from '../utils/soundManager'
import type { Message } from '../types/chat'
import { getLogistics, getCurrentLogisticsStatus, type AutoLogisticsResult } from '../services/autoLogistics'
import { callZhizhiApi } from '../services/zhizhiapi'

interface PurchasedItem {
  messageId: number
  productName: string
  price: number
  note?: string
  type: 'takeout' | 'package'
  logistics?: AutoLogisticsResult
}

interface LogisticsModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  chatId: string
}

// 商家聊天消息
interface ChatMessage {
  id: number
  role: 'user' | 'merchant'
  content: string
  time: string
}

const LogisticsModal = ({ isOpen, onClose, messages, chatId }: LogisticsModalProps) => {
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<PurchasedItem | null>(null)
  
  // 商家聊天状态
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showRefundOptions, setShowRefundOptions] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 读取已购买的商品和物流信息
  useEffect(() => {
    if (!isOpen) return

    const items: PurchasedItem[] = []
    const seenKeys = new Set<string>() // 用于去重

    messages.forEach(msg => {
      // 查找已支付的代付请求
      if (msg.messageType === 'paymentRequest' && msg.paymentRequest?.status === 'paid') {
        const key = `payment_${msg.id}`
        if (seenKeys.has(key)) return
        seenKeys.add(key)

        const logistics = getLogistics(chatId, msg.id)
        if (logistics) {
          items.push({
            messageId: msg.id,
            productName: msg.paymentRequest.itemName,
            price: msg.paymentRequest.amount,
            note: msg.paymentRequest.note,
            type: logistics.type,
            logistics
          })
        }
      }

      // 查找购买记录
      if (msg.messageType === 'purchase' && msg.purchaseData) {
        const key = `purchase_${msg.id}`
        if (seenKeys.has(key)) return
        seenKeys.add(key)

        const logistics = getLogistics(chatId, msg.id)
        if (logistics) {
          items.push({
            messageId: msg.id,
            productName: msg.purchaseData.productName,
            price: msg.purchaseData.price,
            note: msg.purchaseData.note,
            type: logistics.type,
            logistics
          })
        }
      }

      // 查找购物车代付记录
      if (msg.cartPaymentRequest && msg.cartPaymentRequest.status === 'paid') {
        msg.cartPaymentRequest.items.forEach(cartItem => {
          const logisticsKey = `${msg.id}_${cartItem.id}`
          const key = `cart_${logisticsKey}`
          if (seenKeys.has(key)) return
          seenKeys.add(key)

          const logisticsData = localStorage.getItem(`logistics_${chatId}_${logisticsKey}`)
          if (logisticsData) {
            try {
              const logistics = JSON.parse(logisticsData)
              items.push({
                messageId: msg.id,
                productName: `${cartItem.name} x${cartItem.quantity}`,
                price: cartItem.price * cartItem.quantity,
                note: msg.cartPaymentRequest?.note,
                type: logistics.type,
                logistics
              })
            } catch (e) {
              console.error('解析物流数据失败:', e)
            }
          }
        })
      }
    })

    setPurchasedItems(items.reverse()) // 最新的在前
  }, [isOpen, messages, chatId])

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null)
      setShowChat(false)
      setChatMessages([])
    }
  }, [isOpen])

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 聊天记录存储key
  const getChatStorageKey = () => `merchant_chat_${chatId}_${selectedItem?.messageId}`

  // 加载已保存的聊天记录
  const loadSavedChat = () => {
    if (!selectedItem) return null
    const saved = localStorage.getItem(getChatStorageKey())
    if (saved) {
      try {
        return JSON.parse(saved) as ChatMessage[]
      } catch {
        return null
      }
    }
    return null
  }

  // 保存聊天记录
  const saveChatMessages = (messages: ChatMessage[]) => {
    if (!selectedItem) return
    localStorage.setItem(getChatStorageKey(), JSON.stringify(messages))
  }

  // 打开商家聊天
  const openMerchantChat = async () => {
    playSystemSound()
    setShowChat(true)
    
    // 先检查是否有保存的聊天记录
    const savedMessages = loadSavedChat()
    if (savedMessages && savedMessages.length > 0) {
      setChatMessages(savedMessages)
      return
    }
    
    // 没有记录，调用API生成客服欢迎语
    setIsSending(true)
    setChatMessages([{
      id: Date.now(),
      role: 'merchant',
      content: '正在接入客服...',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }])

    try {
      const response = await callZhizhiApi([
        {
          role: 'system',
          content: `扮演网店客服。商品：${selectedItem?.productName}，¥${selectedItem?.price.toFixed(2)}。给店铺起名，打个招呼。不超过50字。`
        }
      ], { temperature: 1.0, max_tokens: 150 })

      const welcomeMsg: ChatMessage = {
        id: Date.now(),
        role: 'merchant',
        content: response,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages([welcomeMsg])
      saveChatMessages([welcomeMsg])
    } catch (error) {
      console.error('客服接入失败:', error)
      const errorMsg: ChatMessage = {
        id: Date.now(),
        role: 'merchant',
        content: '抱歉，客服繁忙，请稍后再试~',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages([errorMsg])
    } finally {
      setIsSending(false)
    }
  }
  
  // 获取当前物流状态
  const getLogisticsStatusText = () => {
    if (!selectedItem?.logistics) return '暂无物流信息'
    const { currentStep, isCompleted } = getCurrentLogisticsStatus(selectedItem.logistics)
    if (isCompleted) return `已送达 - ${currentStep.detail}`
    return `${currentStep.status} - ${currentStep.detail}`
  }

  // 发送消息给商家
  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    saveChatMessages(newMessages)
    setInputText('')
    setIsSending(true)

    try {
      const response = await callZhizhiApi([
        {
          role: 'system',
          content: `你是活生生的人，网店客服。保持之前的店铺名和性格。

订单：${selectedItem?.productName}，¥${selectedItem?.price.toFixed(2)}
物流：${getLogisticsStatusText()}

你是真人，像真人一样打字：
- 可以分段发，比如"啊？\n怎么了"
- 可以打错字、用语气词
- 顾客凶你可以凶回去
- 不合理的不同意，别怂
- 已经退过款别再补偿
- 威胁投诉？随便

同意退款才加：[退款:${selectedItem?.price.toFixed(2)}]`
        },
        ...chatMessages.map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        })),
        { role: 'user' as const, content: text }
      ], { temperature: 0.8, max_tokens: 200 })

      // 检测是否包含退款格式
      const refundMatch = response.match(/\[退款[：:]([\d.]+)\]/)
      let displayContent = response
      
      if (refundMatch) {
        const refundAmount = parseFloat(refundMatch[1])
        // 删除退款格式，显示退款成功提示
        displayContent = response.replace(/\[退款[：:][\d.]+\]/, '').trim()
        
        // 标记订单为已退款（不删除，只是标记状态）
        if (selectedItem) {
          const refundKey = `refund_${chatId}_${selectedItem.messageId}`
          localStorage.setItem(refundKey, JSON.stringify({
            amount: refundAmount,
            time: Date.now()
          }))
          console.log(`✅ 退款成功：¥${refundAmount}`)
        }
        
        // 添加系统提示
        displayContent += `\n\n💰 退款 ¥${refundAmount.toFixed(2)} 已到账`
      }

      const merchantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'merchant',
        content: displayContent,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages(prev => {
        const updated = [...prev, merchantMsg]
        saveChatMessages(updated)
        return updated
      })
    } catch (error) {
      console.error('商家回复失败:', error)
      setChatMessages(prev => {
        const errorMsg: ChatMessage = {
          id: Date.now() + 1,
          role: 'merchant',
          content: '抱歉，系统繁忙，请稍后再试～',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
        const updated = [...prev, errorMsg]
        saveChatMessages(updated)
        return updated
      })
    } finally {
      setIsSending(false)
    }
  }

  // 快捷退款选项
  const refundReasons = [
    '商品有质量问题',
    '收到商品与描述不符',
    '不想要了/买错了',
    '商品未按时送达',
    '其他原因'
  ]

  const handleRefund = (reason: string) => {
    setShowRefundOptions(false)
    sendMessage(`我想申请退款，原因是：${reason}`)
  }

  if (!isOpen) return null

  const handleSelectItem = (item: PurchasedItem) => {
    playSystemSound()
    setSelectedItem(item)
  }

  const handleBack = () => {
    playSystemSound()
    setSelectedItem(null)
  }

  // 获取状态图标 (SVG)
  const getStatusIcon = (iconChar: string, isActive: boolean) => {
    // 映射 emoji 到 SVG 图标
    // 📦 -> Package
    // 🚚 -> Truck
    // 🏠/📍 -> Location/Home
    // ✅ -> Check
    // 👨‍🍳 -> Chef/Cooking
    // 🛵 -> Bike

    const iconClass = isActive ? "w-5 h-5 text-white" : "w-4 h-4 text-gray-500"

    if (iconChar.includes('📦') || iconChar.includes('📄')) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
    if (iconChar.includes('🚚') || iconChar.includes('🚛')) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    }
    if (iconChar.includes('🛵')) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
    if (iconChar.includes('👨‍🍳') || iconChar.includes('🍳')) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
    if (iconChar.includes('✅') || iconChar.includes('🏠') || iconChar.includes('📍')) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }

    // 默认圆点
    return <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`} />
  }

  // 渲染物流详情
  const renderLogisticsDetail = (item: PurchasedItem) => {
    if (!item.logistics) return null

    const { currentStep, progress, isCompleted } = getCurrentLogisticsStatus(item.logistics)
    const isTakeout = item.type === 'takeout'
    const themeColor = isTakeout ? 'orange' : 'blue'
    const bgColor = isTakeout ? 'bg-orange-500' : 'bg-blue-600'
    const textColor = isTakeout ? 'text-orange-600' : 'text-blue-600'
    const lightBg = isTakeout ? 'bg-orange-50' : 'bg-blue-50'

    return (
      <div className="space-y-6">
        {/* 头部状态卡片 */}
        <div className={`${lightBg} rounded-2xl p-5 border border-${themeColor}-100`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">当前状态</div>
              <div className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
                {currentStep.status}
                {isCompleted && <span className="text-sm bg-green-100 text-green-600 px-2 py-0.5 rounded-full">已送达</span>}
              </div>
            </div>
            <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center shadow-lg shadow-${themeColor}-200`}>
              {getStatusIcon(currentStep.icon, true)}
            </div>
          </div>

          <div className="bg-white/60 rounded-xl p-3 text-sm text-gray-700 leading-relaxed backdrop-blur-sm">
            {currentStep.detail}
          </div>
          <div className="text-xs text-gray-400 mt-2 text-right">
            更新于 {new Date(currentStep.timestamp).toLocaleString('zh-CN')}
          </div>
        </div>

        {/* 商品简要信息 */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            {isTakeout ? (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.productName}</div>
            <div className="text-sm text-gray-500 mt-0.5">运单号: SF{item.messageId.toString().slice(-12)}</div>
          </div>
        </div>

        {/* 物流时间线 */}
        <div className="px-2">
          <div className="text-sm font-bold text-gray-900 mb-4">物流详情</div>
          <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {item.logistics.steps
              .filter(step => Date.now() >= step.timestamp) // 只显示已到达的状态
              .sort((a, b) => b.timestamp - a.timestamp) // 倒序排列，最新的在上面
              .map((step, index) => {
                const isLatest = index === 0

                return (
                  <div key={index} className="relative flex gap-4">
                    {/* 节点图标 */}
                    <div className={`absolute -left-[5px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white ${isLatest ? bgColor : 'bg-gray-200'
                      }`}>
                      {getStatusIcon(step.icon, isLatest)}
                    </div>

                    <div className="flex-1 pt-1 pl-8">
                      <div className={`text-sm font-medium ${isLatest ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.status}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(step.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {isLatest && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="flex gap-3 mt-6 px-2">
          <button
            onClick={openMerchantChat}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            联系商家
          </button>
          <button
            onClick={() => setShowRefundOptions(true)}
            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            申请退款
          </button>
        </div>
      </div>
    )
  }

  // 渲染商家聊天界面
  const renderMerchantChat = () => {
    return (
      <div className="flex flex-col h-full">
        {/* 聊天消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'merchant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500">店铺客服</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 快捷选项 */}
        <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto">
          <button
            onClick={() => sendMessage('我想查询物流进度')}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs whitespace-nowrap"
          >
            查询物流
          </button>
          <button
            onClick={() => setShowRefundOptions(true)}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs whitespace-nowrap"
          >
            申请退款
          </button>
          <button
            onClick={() => sendMessage('商品有问题，我想投诉')}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs whitespace-nowrap"
          >
            投诉商家
          </button>
        </div>

        {/* 输入框 */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => {
          playSystemSound()
          onClose()
        }}
      />

      {/* 弹窗 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 animate-slide-up pb-safe shadow-2xl max-h-[85vh] flex flex-col">
        {/* 顶部把手 */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 标题栏 */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {(selectedItem || showChat) && (
              <button
                onClick={() => {
                  playSystemSound()
                  if (showChat) {
                    setShowChat(false)
                  } else {
                    handleBack()
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-2"
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h3 className="text-[17px] font-bold text-gray-900">
                {showChat ? '联系商家' : selectedItem ? '物流详情' : '我的订单'}
              </h3>
            </div>
            {!selectedItem && !showChat && (
              <div className="text-xs text-gray-400">共 {purchasedItems.length} 单</div>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className={`flex-1 overflow-y-auto ${showChat ? '' : 'p-5'}`}>
          {showChat ? (
            // 显示商家聊天
            renderMerchantChat()
          ) : selectedItem ? (
            // 显示物流详情
            renderLogisticsDetail(selectedItem)
          ) : (
            // 显示订单列表
            purchasedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-base font-medium text-gray-900">暂无订单</div>
                <div className="text-sm text-gray-400 mt-1">购买商品后可在此查看物流</div>
              </div>
            ) : (
              <div className="space-y-3">
                {purchasedItems.map((item) => {
                  const status = item.logistics ? getCurrentLogisticsStatus(item.logistics) : null
                  const isTakeout = item.type === 'takeout'
                  // 检查是否已退款
                  const refundKey = `refund_${chatId}_${item.messageId}`
                  const refundData = localStorage.getItem(refundKey)
                  const isRefunded = !!refundData

                  return (
                    <button
                      key={item.messageId}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm active:scale-[0.98] transition-all ${isRefunded ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}
                    >
                      {/* 图标 */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isRefunded ? 'bg-gray-100 text-gray-400' : (isTakeout ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500')
                      }`}>
                        {isRefunded ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        ) : isTakeout ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-start">
                          <div className={`font-bold truncate pr-2 ${isRefunded ? 'text-gray-500' : 'text-gray-900'}`}>{item.productName}</div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">
                            {status?.currentStep.timestamp ? new Date(status.currentStep.timestamp).toLocaleDateString() : ''}
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-1">
                          {isRefunded ? (
                            <div className="text-xs font-medium px-2 py-0.5 rounded-md inline-block bg-gray-100 text-gray-500">
                              已退款
                            </div>
                          ) : (
                            <div className={`text-xs font-medium px-2 py-0.5 rounded-md inline-block ${status?.isCompleted
                                ? 'bg-gray-100 text-gray-500'
                                : (isTakeout ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600')
                              }`}>
                              {status?.currentStep.status || '处理中'}
                            </div>
                          )}
                          <div className={`text-sm font-medium ${isRefunded ? 'text-gray-400 line-through' : 'text-gray-900'}`}>¥{item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* 退款原因选择弹窗 */}
      {showRefundOptions && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowRefundOptions(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] p-5 pb-safe animate-slide-up">
            <div className="text-center mb-4">
              <h4 className="font-bold text-gray-900">选择退款原因</h4>
              <p className="text-xs text-gray-500 mt-1">请选择您申请退款的原因</p>
            </div>
            <div className="space-y-2">
              {refundReasons.map((reason, index) => (
                <button
                  key={index}
                  onClick={() => handleRefund(reason)}
                  className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 text-left active:scale-[0.98] transition-all"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRefundOptions(false)}
              className="w-full py-3 mt-3 text-gray-500 text-sm font-medium"
            >
              取消
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default LogisticsModal
