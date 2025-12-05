import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { addMessage } from '../utils/simpleMessageManager'
import { generateAutoLogistics } from '../services/autoLogistics'
import type { Message } from '../types/chat'

interface CartItem {
  id: string
  name: string
  price: number
  description: string
  quantity: number
  image?: string
}

const ShoppingCart = () => {
  const navigate = useNavigate()
  const { id: chatId } = useParams<{ id: string }>()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [intimatePayBalance, setIntimatePayBalance] = useState(0)

  // 从localStorage加载购物车
  useEffect(() => {
    const savedCart = localStorage.getItem(`shopping_cart_${chatId}`)
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [chatId])

  // 加载亲密付余额
  useEffect(() => {
    if (chatId) {
      const intimatePayData = localStorage.getItem(`intimate_pay_${chatId}`)
      if (intimatePayData) {
        try {
          const data = JSON.parse(intimatePayData)
          if (data.status === 'active') {
            // 计算剩余额度
            const used = data.usedAmount || 0
            const remaining = data.monthlyLimit - used
            setIntimatePayBalance(Math.max(0, remaining))
          }
        } catch (e) {
          console.error('加载亲密付数据失败:', e)
        }
      }
    }
  }, [chatId])

  // 保存购物车到localStorage
  useEffect(() => {
    if (chatId) {
      localStorage.setItem(`shopping_cart_${chatId}`, JSON.stringify(cartItems))
    }
  }, [cartItems, chatId])

  // 更新商品数量
  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  // 删除商品
  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
  }

  // 切换选中状态
  const toggleSelect = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)))
    }
  }

  // 计算总价
  const calculateTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // 结算 - 发送购物车卡片
  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert('请选择要购买的商品')
      return
    }

    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id))
    const totalAmount = calculateTotal()

    const cartMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[购物车] 共${selectedCartItems.length}件商品`,
      aiReadableContent: `用户发送了购物车，包含${selectedCartItems.length}件商品：
${selectedCartItems.map(item => `- ${item.name} x${item.quantity} (¥${item.price})`).join('\n')}
总金额：¥${totalAmount}

这是用户想要购买的商品清单。你可以主动帮用户购买：[购买购物车:购物车ID]`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'shoppingCart',
      shoppingCart: {
        items: selectedCartItems,
        totalAmount,
        storeName: '在线商城'
      }
    }

    if (chatId) {
      addMessage(chatId, cartMessage)
      // 清空已结算的商品
      setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      navigate(`/chat/${chatId}`)
    }
  }

  // 请求AI代付
  const handleRequestAIPay = () => {
    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id))
    const totalAmount = calculateTotal()
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
    const userName = userInfo.nickname || '用户'

    const paymentRequestMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[代付请求] 购物车`,
      aiReadableContent: `用户请求你帮忙代付购物车，包含${selectedCartItems.length}件商品：
${selectedCartItems.map(item => `- ${item.name} x${item.quantity} (¥${item.price})`).join('\n')}
总金额：¥${totalAmount}

你可以选择：
1. 同意代付：[购物车代付:同意]
2. 拒绝代付：[购物车代付:拒绝]`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'cartPaymentRequest',
      cartPaymentRequest: {
        cartId: `cart-${Date.now()}`,
        items: selectedCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount,
        requesterName: userName,
        status: 'pending'
      }
    }

    if (chatId) {
      addMessage(chatId, paymentRequestMessage)
      setShowPaymentModal(false)
      navigate(`/chat/${chatId}`)
    }
  }

  // 使用亲密付
  const handleUseIntimatePay = () => {
    const totalAmount = calculateTotal()

    if (intimatePayBalance < totalAmount) {
      alert(`亲密付余额不足！当前余额：¥${intimatePayBalance}`)
      return
    }

    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id))

    // 更新亲密付使用金额
    const intimatePayData = JSON.parse(localStorage.getItem(`intimate_pay_${chatId}`) || '{}')
    intimatePayData.usedAmount = (intimatePayData.usedAmount || 0) + totalAmount
    localStorage.setItem(`intimate_pay_${chatId}`, JSON.stringify(intimatePayData))

    // 发送购买成功消息
    const successMessage: Message = {
      id: Date.now(),
      type: 'system',
      content: `使用亲密付购买成功 ¥${totalAmount}`,
      aiReadableContent: `用户使用了你赠送的亲密付额度购买了商品，共花费 ¥${totalAmount}。你可以对此做出反应。`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'system'
    }

    if (chatId) {
      addMessage(chatId, successMessage)
      
      // 🚚 为购物车中的每个商品自动生成物流
      const messageId = successMessage.id
      setTimeout(async () => {
        try {
          console.log('🚚 [自动物流] 开始为亲密付商品生成物流...')
          for (const item of selectedCartItems) {
            const logistics = await generateAutoLogistics(
              item.name,
              item.price,
              item.quantity
            )
            // 使用消息ID + 商品ID作为唯一标识
            const logisticsKey = `${messageId}_${item.id}`
            localStorage.setItem(`logistics_${chatId}_${logisticsKey}`, JSON.stringify(logistics))
            console.log(`✅ [自动物流] ${item.name} 物流生成成功`)
          }
        } catch (error) {
          console.error('❌ [自动物流] 生成失败:', error)
        }
      }, 1000)
      
      // 清空已购买的商品
      setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      setShowPaymentModal(false)
      navigate(`/chat/${chatId}`)
    }
  }

  // 用户给AI购买商品（送礼物）
  const handleBuyForAI = () => {
    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id))
    const totalAmount = calculateTotal()
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
    const userName = userInfo.nickname || '用户'

    // 复用代付卡片，状态设为已支付
    const giftMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[送你礼物] 共${selectedCartItems.length}件商品`,
      aiReadableContent: `用户给你买了礼物！包含${selectedCartItems.length}件商品：
${selectedCartItems.map(item => `- ${item.name} x${item.quantity} (¥${item.price})`).join('\n')}
总金额：¥${totalAmount}

这是用户送给你的礼物，你可以对此表达感谢或惊喜。`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'cartPaymentRequest',
      cartPaymentRequest: {
        cartId: `gift-${Date.now()}`,
        items: selectedCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount,
        requesterName: userName,
        status: 'paid',
        payerName: userName
      }
    }

    if (chatId) {
      addMessage(chatId, giftMessage)
      
      // 🚚 为购物车中的每个商品自动生成物流
      const messageId = giftMessage.id
      setTimeout(async () => {
        try {
          console.log('🚚 [自动物流] 开始为礼物商品生成物流...')
          for (const item of selectedCartItems) {
            const logistics = await generateAutoLogistics(
              item.name,
              item.price,
              item.quantity
            )
            // 使用消息ID + 商品ID作为唯一标识
            const logisticsKey = `${messageId}_${item.id}`
            localStorage.setItem(`logistics_${chatId}_${logisticsKey}`, JSON.stringify(logistics))
            console.log(`✅ [自动物流] ${item.name} 物流生成成功`)
          }
        } catch (error) {
          console.error('❌ [自动物流] 生成失败:', error)
        }
      }, 1000)
      
      // 清空已购买的商品
      setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      setShowPaymentModal(false)
      navigate(`/chat/${chatId}`)
    }
  }

  const totalAmount = calculateTotal()
  const selectedCount = selectedItems.size

  return (
    <div className="h-screen bg-[#f2f4f7] flex flex-col font-sans">
      {/* 顶部导航 - 更加沉浸式 */}
      <div className="bg-white sticky top-0 z-30">
        <StatusBar />
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-50">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-gray-900 active:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">购物车({cartItems.length})</h1>
          <div className="w-9 flex items-center justify-end">
            <button className="text-gray-900 font-medium text-sm">管理</button>
          </div>
        </div>
      </div>

      {/* 购物车列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 scrollbar-hide">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-600">购物车竟然是空的</p>
            <p className="text-sm mt-2 text-gray-400">再忙，也要记得买点什么犒劳自己~</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-8 px-8 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-900 shadow-sm active:bg-gray-50"
            >
              去逛逛
            </button>
          </div>
        ) : (
          cartItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 relative overflow-hidden"
            >
              {/* 选择框 */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => toggleSelect(item.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedItems.has(item.id)
                      ? 'bg-[#ff5000] border-[#ff5000]'
                      : 'border-gray-300 bg-white'
                    }`}
                >
                  {selectedItems.has(item.id) && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 商品图片 */}
              <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden border border-gray-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>

              {/* 商品信息 */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div>
                  <h3 className="text-[15px] font-medium text-gray-900 line-clamp-2 leading-snug mb-1.5">
                    {item.name}
                  </h3>
                  <div className="flex">
                    <div className="px-1.5 py-0.5 bg-gray-50 rounded text-xs text-gray-500 flex items-center gap-1">
                      <span>默认规格</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div className="text-[#ff5000] font-bold flex items-baseline gap-0.5">
                    <span className="text-xs">¥</span>
                    <span className="text-lg">{item.price}</span>
                  </div>

                  {/* 数量控制 - 极简风格 */}
                  <div className="flex items-center border border-gray-200 rounded-lg h-7">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-full flex items-center justify-center text-gray-500 active:bg-gray-50 border-r border-gray-100"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                      </svg>
                    </button>
                    <div className="px-3 h-full flex items-center justify-center text-sm font-medium text-gray-900 bg-white min-w-[2rem]">
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-full flex items-center justify-center text-gray-500 active:bg-gray-50 border-l border-gray-100"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部结算栏 */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-between h-14">
            {/* 全选 */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 pl-1"
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedItems.size === cartItems.length && cartItems.length > 0
                  ? 'bg-[#ff5000] border-[#ff5000]'
                  : 'border-gray-300'
                }`}>
                {selectedItems.size === cartItems.length && cartItems.length > 0 && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600">全选</span>
            </button>

            <div className="flex items-center gap-3">
              {/* 总价 */}
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-900">合计:</span>
                  <span className="text-[#ff5000] font-bold text-lg">
                    <span className="text-sm">¥</span>{totalAmount}
                  </span>
                </div>
                {selectedCount > 0 && (
                  <div className="text-[10px] text-gray-400">
                    不含运费
                  </div>
                )}
              </div>

              {/* 结算按钮 */}
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={selectedCount === 0}
                className="px-8 h-10 bg-gradient-to-r from-[#ff9000] to-[#ff5000] text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                结算({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付方式选择弹窗 - 仿iOS Action Sheet风格 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setShowPaymentModal(false)}
          />

          {/* 弹窗内容 */}
          <div
            className="bg-[#f7f8fa] w-full max-w-md rounded-t-[20px] overflow-hidden relative z-10 animate-slide-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0">
              <div className="w-8" /> {/* 占位 */}
              <h2 className="text-[17px] font-bold text-gray-900">确认付款</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 金额显示 */}
            <div className="bg-white py-8 flex flex-col items-center justify-center mb-3">
              <div className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                <span className="text-xl">¥</span>{totalAmount}
              </div>
              <div className="text-sm text-gray-500 mt-1">订单金额</div>
            </div>

            {/* 支付方式列表 */}
            <div className="bg-white flex-1">
              <div className="px-4 py-2 text-xs text-gray-400 font-medium">选择支付方式</div>

              <div className="divide-y divide-gray-50 pl-4">
                {/* 亲密付 */}
                {intimatePayBalance > 0 && (
                  <button
                    onClick={handleUseIntimatePay}
                    className="w-full py-4 pr-4 flex items-center justify-between active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff4d4f] flex items-center justify-center text-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-[16px] font-medium text-gray-900">亲密付</div>
                        <div className="text-xs text-gray-500 mt-0.5">剩余额度: ¥{intimatePayBalance}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#ff4d4f] bg-[#fff1f0] px-2 py-0.5 rounded">推荐</span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                )}

                {/* 请求AI代付 */}
                <button
                  onClick={handleRequestAIPay}
                  className="w-full py-4 pr-4 flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1890ff] flex items-center justify-center text-white shadow-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-medium text-gray-900">找人代付</div>
                      <div className="text-xs text-gray-500 mt-0.5">发送给AI请求付款</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* 给AI购买 */}
                <button
                  onClick={handleBuyForAI}
                  className="w-full py-4 pr-4 flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#52c41a] flex items-center justify-center text-white shadow-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-medium text-gray-900">赠送给AI</div>
                      <div className="text-xs text-gray-500 mt-0.5">作为礼物直接购买</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 底部安全提示 */}
            <div className="bg-gray-50 p-4 text-center">
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                支付安全由平台保障
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShoppingCart
