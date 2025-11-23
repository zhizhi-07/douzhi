import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCharacterById } from '../utils/characterManager'
import { saveMessages, loadMessages } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'
import StatusBar from '../components/StatusBar'
import { getIntimatePayRelations, useIntimatePay, type IntimatePayRelation, getBalance, setBalance, addTransaction } from '../utils/walletUtils'
import { getImage } from '../utils/unifiedStorage'

interface FoodItem {
  id: string
  name: string
  price: number
  category: string
}

interface CartItem extends FoodItem {
  quantity: number
}

// 预设的外卖商品
const FOOD_ITEMS: FoodItem[] = [
  // 主食
  { id: '1', name: '黄焖鸡米饭', price: 25, category: '主食' },
  { id: '2', name: '麻辣烫', price: 28, category: '主食' },
  { id: '3', name: '兰州拉面', price: 22, category: '主食' },
  { id: '4', name: '沙县小吃套餐', price: 20, category: '主食' },
  { id: '5', name: '盖浇饭', price: 18, category: '主食' },
  { id: '6', name: '炒面', price: 16, category: '主食' },
  
  // 快餐
  { id: '7', name: '汉堡套餐', price: 35, category: '快餐' },
  { id: '8', name: '炸鸡套餐', price: 38, category: '快餐' },
  { id: '9', name: '披萨', price: 45, category: '快餐' },
  { id: '13', name: '海底捞火锅双人餐', price: 188, category: '快餐' },
  { id: '14', name: '日料套餐', price: 158, category: '快餐' },
  
  // 小吃
  { id: '10', name: '煎饼果子', price: 12, category: '小吃' },
  { id: '11', name: '肉夹馍', price: 15, category: '小吃' },
  { id: '12', name: '烤冷面', price: 10, category: '小吃' },
  { id: '15', name: '矿泉水', price: 2, category: '小吃' },
  { id: '16', name: '包子', price: 3, category: '小吃' },
]

const PaymentRequest = () => {
  const navigate = useNavigate()
  const { id: chatId } = useParams<{ id: string }>()
  const [character, setCharacter] = useState<any>(null)
  
  useEffect(() => {
    if (chatId) {
      getCharacterById(chatId).then(char => setCharacter(char))
    }
  }, [chatId])
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [isOrderMode, setIsOrderMode] = useState(false) // 是否为"给TA点外卖"模式
  const [paymentMethod, setPaymentMethod] = useState<'ai' | 'self' | 'intimate'>('ai')
  const [showCustomItem, setShowCustomItem] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [functionBg, setFunctionBg] = useState('')

  // 加载功能背景
  useEffect(() => {
    const loadFunctionBg = async () => {
      const bg = await getImage('function_bg')
      if (bg) setFunctionBg(bg)
    }
    loadFunctionBg()
  }, [])

  // 筛选商品
  const filteredItems = searchResults.length > 0 
    ? searchResults 
    : FOOD_ITEMS

  // 添加到购物车
  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  // 从购物车移除
  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  // 清空购物车
  const clearCart = () => {
    setCart([])
  }

  // 添加自定义商品
  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice.trim()) {
      alert('请填写商品名称和价格')
      return
    }

    const price = parseFloat(customItemPrice)
    if (isNaN(price) || price <= 0) {
      alert('请输入有效的价格')
      return
    }

    const customItem: FoodItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      price,
      category: '自定义'
    }

    addToCart(customItem)
    setCustomItemName('')
    setCustomItemPrice('')
    setShowCustomItem(false)
  }

  // AI搜索商品
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入搜索关键词')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-biaugiqxfopyfosfxpggeqcitfwkwnsgkduvjavygdtpoicm'
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [{
            role: 'user',
            content: `你是一个脑洞大开的美食创意师。用户搜索了"${searchQuery}"，请生成15个完全不同风格的创意商品。

🎯 铁律：
1. **必须包含关键词**："${searchQuery}"必须出现在商品名中
2. **每次都要不一样**：不要重复套路，要有新意
3. **价格层次（必须严格遵守）**：
   - 至少2个超便宜商品（0.5-1元，比如试吃装、迷你版）
   - 至少2个超贵商品（1000元以上，比如终身会员、豪华套餐）
   - 其余商品价格随意分布

🌈 创意方向（每次随机选择不同的组合）：
- 口味系：水果味、甜品味、咸味、辣味、酸味、苦味、混合味
- 网红系：脏脏、爆浆、拉丝、爆珠、渐变、分层、冒烟
- 规格系：迷你、正常、加大、超大、巨无霸、家庭装、派对装
- 特色系：冰淇淋、奶盖、芝士、布丁、果冻、椰果、仙草
- 联名系：动漫联名、游戏联名、明星同款、品牌联名
- 季节系：春季限定、夏日特饮、秋冬暖饮、节日特供
- 地域系：日式、韩式、泰式、港式、台式、欧式、美式
- 创意系：DIY自选、盲盒款、隐藏款、会员专属、新品试吃
- 情感系：恋爱款、失恋款、加班款、熬夜款、减肥款
- 搞怪系：暗黑料理、奇葩组合、挑战款、整蛊款

💡 命名技巧：
- 可以用形容词：超级、极致、爆款、王炸、绝绝子
- 可以用emoji：💕、🔥、⭐、🌈、🎉
- 可以用网络用语：yyds、绝了、爱了、上头
- 可以用数字：2.0、Pro、Max、Plus、Ultra
- 可以讲故事：恋爱的味道、深夜食堂、周末特供

📋 返回格式：纯JSON数组
[{"name":"商品名称","price":价格数字}]

🎲 示例（仅供参考，不要照抄）：
搜索"奶茶" → 
[
  {"name":"失恋专用奶茶（超苦）","price":9.9},
  {"name":"奶茶刺客Pro Max","price":88},
  {"name":"深夜emo奶茶","price":15},
  {"name":"奶茶盲盒（随机口味）","price":12},
  {"name":"奶茶火锅（4-6人份）","price":168},
  {"name":"奶茶冰淇淋三明治","price":22},
  {"name":"会发光的奶茶","price":35},
  {"name":"奶茶布丁双拼","price":18},
  {"name":"奶茶雪糕","price":8},
  {"name":"奶茶终身会员卡（无限畅饮）","price":9999}
]

💰 价格建议（可以更夸张）：
- 普通款：几元到几十元
- 豪华款：几百到几千元
- 终极款：上万元（如：终身会员、包年套餐、超级豪华版）

现在请为"${searchQuery}"生成15个脑洞大开的商品（每次都要有新花样）：`
          }],
          temperature: 1.0,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '搜索失败')
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回数据格式错误')
      }
      
      const content = data.choices[0].message.content
      
      // 解析JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0])
        const foodItems: FoodItem[] = items.map((item: any, index: number) => ({
          id: `search-${Date.now()}-${index}`,
          name: item.name,
          price: parseFloat(item.price),
          category: '搜索结果'
        }))
        setSearchResults(foodItems)
      } else {
        throw new Error('无法解析AI返回的商品列表')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      alert(`搜索失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSearching(false)
    }
  }

  // 计算总价
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 提交订单
  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('请先添加商品到购物车')
      return
    }

    if (!chatId || !character) {
      alert('角色信息加载失败')
      return
    }

    // 🔥 处理支付逻辑
    let intimatePayProvider: IntimatePayRelation | null = null
    
    if (isOrderMode) {
      // 给TA点外卖模式
      if (paymentMethod === 'self') {
        // 使用零钱支付 - 扣除余额
        const currentBalance = getBalance()
        
        if (currentBalance < totalPrice) {
          alert(`零钱余额不足！当前余额：¥${currentBalance.toFixed(2)}，需要：¥${totalPrice.toFixed(2)}`)
          return
        }
        
        // 扣除余额
        const newBalance = currentBalance - totalPrice
        setBalance(newBalance)
        
        // 添加交易记录
        addTransaction({
          type: 'intimate_pay',
          amount: totalPrice.toFixed(2),
          description: `给 ${character.nickname || character.realName} 点外卖`,
          characterName: character.nickname || character.realName
        })
        
        console.log(`💰 使用零钱支付 ¥${totalPrice.toFixed(2)}，剩余余额 ¥${newBalance.toFixed(2)}`)
      } else if (paymentMethod === 'intimate') {
        // 使用亲密付
        const allRelations = getIntimatePayRelations()
        const availableRelations = allRelations.filter((r: IntimatePayRelation) => 
          r.type === 'character_to_user' && 
          (r.monthlyLimit - r.usedAmount) >= totalPrice
        )
        
        if (availableRelations.length === 0) {
          alert('没有可用的亲密付额度！请确保有角色给你开通了亲密付且额度充足')
          return
        }
        
        // 使用第一个可用的亲密付
        intimatePayProvider = availableRelations[0]
        
        // 扣除亲密付额度
        const success = useIntimatePay(intimatePayProvider.characterName, totalPrice)
        if (!success) {
          alert('使用亲密付失败，请重试')
          return
        }
        
        console.log(`💳 使用 ${intimatePayProvider.characterName} 的亲密付给 ${character.nickname || character.realName} 点外卖`)
      }
    }

    // 生成订单描述
    const itemNames = cart.map(item => `${item.name}x${item.quantity}`).join('、')
    
    // 确定消息类型和状态
    const messageType = paymentMethod === 'ai' ? 'sent' : 'sent'
    const status = paymentMethod === 'ai' ? 'pending' : 'paid'
    
    // 生成唯一ID（使用时间戳 + 随机数）
    const baseTimestamp = Date.now()
    const paymentMessageId = baseTimestamp + Math.floor(Math.random() * 1000)
    const systemMessageId = baseTimestamp + 1000 + Math.floor(Math.random() * 1000)
    
    // 创建系统消息
    let systemMessage: Message | null = null
    if (isOrderMode) {
      // 给TA点外卖模式
      if (paymentMethod === 'self') {
        systemMessage = {
          id: systemMessageId,
          type: 'system',
          content: `你给 ${character.nickname || character.realName} 点了外卖：${itemNames}，共 ¥${totalPrice.toFixed(2)}`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: baseTimestamp + 1,
          messageType: 'system'
        }
      } else if (paymentMethod === 'intimate' && intimatePayProvider) {
        systemMessage = {
          id: systemMessageId,
          type: 'system',
          content: `你使用了 ${intimatePayProvider.characterName} 的亲密付给 ${character.nickname || character.realName} 点外卖：${itemNames}，共 ¥${totalPrice.toFixed(2)}`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: baseTimestamp + 1,
          messageType: 'system'
        }
      }
    }

    // 创建代付消息
    const paymentMessage: Message = {
      id: paymentMessageId,
      type: messageType,
      content: `[${isOrderMode ? '外卖' : '代付'}] ${itemNames}，共 ¥${totalPrice.toFixed(2)}`,
      aiReadableContent: isOrderMode 
        ? `[用户给你点外卖] 商品：${itemNames}，总金额：¥${totalPrice.toFixed(2)}${note ? `，备注：${note}` : ''}，支付方式：${
            paymentMethod === 'intimate' ? '使用你的亲密付' : '用户自己支付'
          }`
        : `[用户发起代付请求] 商品：${itemNames}，总金额：¥${totalPrice.toFixed(2)}${note ? `，备注：${note}` : ''}，需要你确认代付`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: baseTimestamp,
      messageType: 'paymentRequest',
      paymentRequest: {
        itemName: itemNames,
        amount: totalPrice,
        note: note || undefined,
        paymentMethod: isOrderMode ? 'self' : paymentMethod,
        status: isOrderMode ? 'paid' : status,
        requesterId: 'user',
        requesterName: '我',
        payerId: paymentMethod === 'ai' ? character.id : undefined,
        payerName: paymentMethod === 'ai' ? (character.nickname || character.realName) : paymentMethod === 'intimate' ? (character.nickname || character.realName) : undefined
      }
    }

    // 加载现有消息
    const existingMessages = await loadMessages(chatId)
    
    // 更新消息列表
    const newMessages = systemMessage 
      ? [...existingMessages, paymentMessage, systemMessage]
      : [...existingMessages, paymentMessage]
    
    // 保存到 IndexedDB
    await saveMessages(chatId, newMessages)
    console.log('💾 [代付] 消息已保存到IndexedDB')
    
    // 🔥 如果使用了亲密付，给提供亲密付的角色发送通知
    if (intimatePayProvider && intimatePayProvider.characterId !== chatId) {
      const providerMessages = await loadMessages(intimatePayProvider.characterId)
      const notificationMessage: Message = {
        id: Date.now() + 2000 + Math.floor(Math.random() * 1000),
        type: 'system',
        content: `${character.nickname || character.realName} 使用了你的亲密付购买 ${itemNames}，共 ¥${totalPrice.toFixed(2)}`,
        aiReadableContent: `[系统通知] 用户使用了你给TA开通的亲密付，给 ${character.nickname || character.realName} 购买了 ${itemNames}，金额 ¥${totalPrice.toFixed(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: baseTimestamp + 2,
        messageType: 'system'
      }
      
      const updatedProviderMessages = [...providerMessages, notificationMessage]
      await saveMessages(intimatePayProvider.characterId, updatedProviderMessages)
      console.log(`📨 [亲密付通知] 已向 ${intimatePayProvider.characterName} 发送使用通知`)
    }
    
    // 返回聊天页面
    navigate(-1)
  }

  return (
    <div 
      data-modal-container
      className="h-screen flex flex-col bg-[#f5f5f5]"
      style={{
        backgroundColor: functionBg ? 'transparent' : '#f5f5f5',
        backgroundImage: functionBg ? `url(${functionBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 顶部导航栏 - 仿外卖APP样式 */}
      <div className={`sticky top-0 z-20 transition-all duration-300 ${functionBg ? 'bg-white/90 backdrop-blur-md' : 'bg-white shadow-sm'}`}>
        <StatusBar />
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => {
                  setIsOrderMode(false)
                  setPaymentMethod('intimate')
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !isOrderMode 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                发起代付
              </button>
              <button
                onClick={() => {
                  setIsOrderMode(true)
                  setPaymentMethod('ai')
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isOrderMode 
                    ? 'bg-[#FFD161] text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                给TA点外卖
              </button>
            </div>

            <div className="w-10 flex justify-end">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-[#FFD161] focus-within:bg-white transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="想吃什么？让AI帮你找找..."
                className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-5 py-2 rounded-full text-sm font-medium bg-[#FFD161] text-gray-900 hover:bg-[#FFC300] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSearching ? '找美食...' : '搜索'}
            </button>
          </div>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${functionBg ? 'bg-white/80' : ''}`}>
        {/* 添加自定义商品入口 */}
        <button
          onClick={() => setShowCustomItem(true)}
          className="w-full py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#FFD161] hover:text-[#FFD161] hover:bg-[#FFFDF5] transition-all flex items-center justify-center gap-2 font-medium group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          没有想吃的？添加自定义商品
        </button>

        {/* 商品列表 */}
        <div className="grid gap-3 pb-24">
          {filteredItems.map(item => {
            const cartItem = cart.find(i => i.id === item.id)
            const quantity = cartItem?.quantity || 0

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#FFD161]/30"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* 商品占位图 */}
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                        {item.category === '搜索结果' ? '推荐' : item.category}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-[#FF4B4B] mt-1">
                      <span className="text-xs font-normal mr-0.5">¥</span>
                      {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {quantity === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-[#FFD161] text-gray-900 hover:bg-[#FFC300] active:scale-95 transition-all shadow-sm"
                  >
                    选购
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-[#FFD161] flex items-center justify-center text-gray-900 hover:bg-[#FFC300] transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 底部结算栏 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl">
          {/* 购物车预览 (仅显示前2个 + 展开更多提示) */}
          <div className="px-4 py-3 bg-[#FFFDF5] border-b border-[#FFE082]/20 flex items-center justify-between text-xs text-gray-500">
            <span>已选 {cart.reduce((a, b) => a + b.quantity, 0)} 件商品</span>
            <span>{cart.map(i => i.name).join('、').slice(0, 20)}{cart.length > 2 ? '...' : ''}</span>
          </div>

          {/* 备注输入 */}
          <div className="px-4 py-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注口味、偏好等 (选填)..."
              className="w-full bg-gray-50 border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-[#FFD161] placeholder-gray-400"
              maxLength={50}
            />
          </div>

          {/* 支付方式选择 */}
          {isOrderMode && (
            <div className="px-4 py-2 flex gap-2">
              <button
                onClick={() => setPaymentMethod('intimate')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  paymentMethod === 'intimate'
                    ? 'bg-[#FFF8E1] border-[#FFD161] text-[#FF8F00]'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                亲密付
              </button>
              <button
                onClick={() => setPaymentMethod('self')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  paymentMethod === 'self'
                    ? 'bg-[#FFF8E1] border-[#FFD161] text-[#FF8F00]'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                零钱支付
              </button>
            </div>
          )}

          {/* 底部主要操作区 */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-900">合计</span>
                <span className="text-2xl font-extrabold text-[#FF4B4B]">
                  <span className="text-base font-bold">¥</span>
                  {totalPrice.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-light">
                {isOrderMode ? '虚拟支付不产生实际费用' : '需对方确认后生效'}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="flex-1 max-w-[160px] h-12 rounded-full font-bold text-lg bg-gradient-to-r from-[#FFD161] to-[#FFC107] text-gray-900 shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center"
            >
              {isOrderMode ? '立即支付' : '发起代付'}
            </button>
          </div>
        </div>
      )}

      {/* 自定义商品弹窗 */}
      {showCustomItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCustomItem(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">添加自定义商品</h2>
              <p className="text-sm text-gray-500 mt-1">找不到想吃的？自己加一个！</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">商品名称</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="例如：珍珠奶茶"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD161] focus:bg-white transition-all"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">价格（元）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input
                    type="number"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD161] focus:bg-white transition-all font-mono"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCustomItem(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={addCustomItem}
                className="flex-1 py-3 bg-[#FFD161] text-gray-900 rounded-xl hover:bg-[#FFC300] font-bold shadow-md transition-all"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentRequest
