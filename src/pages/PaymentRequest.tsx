import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCharacterById } from '../utils/characterManager'
import { saveMessages, loadMessages } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'
import StatusBar from '../components/StatusBar'
import { getIntimatePayRelations, useIntimatePay, type IntimatePayRelation, getBalance, setBalance, addTransaction } from '../utils/walletUtils'

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
  
  // 小吃
  { id: '10', name: '煎饼果子', price: 12, category: '小吃' },
  { id: '11', name: '肉夹馍', price: 15, category: '小吃' },
  { id: '12', name: '烤冷面', price: 10, category: '小吃' },
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
3. **价格随意**：从几毛钱到上万元都可以，脑洞大开，合理就行

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 状态栏和导航栏容器 - 合并为一个白色背景 */}
      <div className="bg-white">
        {/* 状态栏 */}
        <StatusBar />
        
        {/* 顶部导航栏 */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {isOrderMode ? '给TA点外卖' : '发起代付'}
            </h1>
            <p className="text-xs text-gray-500">
              {isOrderMode 
                ? `给 ${character?.nickname || character?.realName} 点外卖` 
                : `请 ${character?.nickname || character?.realName} 帮忙付款`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              清空
            </button>
          )}
          <button
            onClick={() => {
              setIsOrderMode(!isOrderMode)
              // 切换模式时重置支付方式
              setPaymentMethod(isOrderMode ? 'ai' : 'intimate')
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isOrderMode 
                ? '' 
                : 'border-2 border-dashed'
            }`}
            style={
              isOrderMode
                ? { backgroundColor: '#fff7b6', color: '#666' }
                : { borderColor: '#e6d89a', color: '#666', backgroundColor: 'transparent' }
            }
          >
            给TA点外卖
          </button>
        </div>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-y-auto">
        {/* AI搜索框 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入关键词，AI帮你找美食..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2"
              style={{ outlineColor: '#fff7b6' }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#fff7b6', color: '#666' }}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        {/* 自定义商品按钮 */}
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowCustomItem(true)}
            className="w-full py-3 border-2 border-dashed rounded-full transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: '#fff7b6', borderColor: '#e6d89a', color: '#666' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">添加自定义商品</span>
          </button>
        </div>

        {/* 商品列表 */}
        <div className="p-4 space-y-2">
          {filteredItems.map(item => {
            const cartItem = cart.find(i => i.id === item.id)
            const quantity = cartItem?.quantity || 0

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#d4a017' }}>¥{item.price.toFixed(2)}</p>
                </div>
                
                {quantity === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-all"
                    style={{ backgroundColor: '#fff7b6', color: '#666' }}
                  >
                    添加
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#fff7b6', color: '#666' }}
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

      {/* 底部购物车和结算 */}
      {cart.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          {/* 购物车列表 */}
          <div className="px-4 py-3 border-b border-gray-100 max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name} x{item.quantity}</span>
                  <span className="text-gray-900 font-medium">¥{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注信息（选填）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* 支付方式 - 仅在给TA点外卖模式显示 */}
          {isOrderMode && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('intimate')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === 'intimate'
                      ? 'text-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={paymentMethod === 'intimate' ? { backgroundColor: '#fff7b6' } : {}}
                >
                  亲密付
                </button>
                <button
                  onClick={() => setPaymentMethod('self')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === 'self'
                      ? 'text-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={paymentMethod === 'self' ? { backgroundColor: '#fff7b6' } : {}}
                >
                  零钱支付
                </button>
              </div>
            </div>
          )}

          {/* 结算按钮 */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">总计</div>
              <div className="text-xl font-bold" style={{ color: '#d4a017' }}>¥{totalPrice.toFixed(2)}</div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0}
              className="px-8 py-2 rounded-full font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#fff7b6', color: '#666' }}
            >
              {isOrderMode ? '支付' : '发起代付'}
            </button>
          </div>
        </div>
      )}

      {/* 自定义商品弹窗 */}
      {showCustomItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomItem(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">添加自定义商品</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="例如：珍珠奶茶"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: '#fff7b6' }}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格（元）</label>
                <input
                  type="number"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  placeholder="例如：15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: '#fff7b6' }}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomItem(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={addCustomItem}
                className="flex-1 py-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: '#fff7b6', color: '#666' }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentRequest
