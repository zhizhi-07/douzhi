import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { addMessage } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'

interface Product {
  id: string
  name: string
  price: number
  description: string
  sales: number
}

// 模拟商品数据
const PRODUCTS: Product[] = [
  { id: '1', name: '无线蓝牙耳机', price: 199, description: '音质巨好，降噪效果一流，续航持久，佩戴舒适不夹耳，支持快充，通话清晰，适合运动和日常使用', sales: 1234 },
  { id: '2', name: '保温杯', price: 89, description: '保温24小时，304不锈钢材质，密封性好不漏水，大容量设计，外观时尚简约，适合办公室和户外', sales: 856 },
  { id: '3', name: '口红套装', price: 299, description: '5支装，多色可选，滋润不掉色，持久显色，质地细腻，适合各种场合，送礼自用都很棒', sales: 2341 },
  { id: '4', name: '运动鞋', price: 399, description: '透气舒适，减震效果好，时尚百搭，耐磨防滑，轻便设计，适合跑步健身，多种颜色可选', sales: 567 },
  { id: '5', name: '手机壳', price: 29, description: '防摔耐磨，手感好，多款式可选，精准开孔，超薄设计，支持无线充电，保护性强', sales: 3456 },
  { id: '6', name: '零食大礼包', price: 99, description: '10种零食，满足你的味蕾，包含薯片、饼干、糖果等，分量足，适合追剧聚会，性价比超高', sales: 1890 },
  { id: '7', name: '香水', price: 599, description: '持久留香，淡雅清新，适合日常，前调花香中调果香，后调木质香，适合春夏季节使用', sales: 432 },
  { id: '8', name: '背包', price: 159, description: '大容量，多隔层，防水耐用，可放15.6寸笔记本，USB充电口设计，适合上班上学旅行', sales: 789 },
  { id: '9', name: '充电宝', price: 129, description: '20000mAh大容量，快充支持，双USB输出，LED电量显示，轻薄便携，适合出差旅行', sales: 2123 },
  { id: '10', name: '毛绒玩具', price: 79, description: '柔软舒适，可爱造型，送礼佳品，环保材质，可机洗，多种尺寸可选，适合儿童和女生', sales: 1567 },
]

// 商品分类
const CATEGORIES = ['推荐', '数码', '美妆', '居家', '服饰', '食品', '百货']

const OnlineShopping = () => {
  const navigate = useNavigate()
  const { id: chatId } = useParams<{ id: string }>()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [cart, setCart] = useState<Product[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customProduct, setCustomProduct] = useState({ name: '', price: '', description: '' })
  const [selectedCategory, setSelectedCategory] = useState('推荐')

  // 显示的商品列表（根据分类和搜索结果筛选）
  const displayProducts = (() => {
    // 如果有搜索结果，优先显示搜索结果
    if (searchResults.length > 0) return searchResults
    
    // 如果选择了"推荐"或没有选择，显示所有商品
    if (selectedCategory === '推荐') return PRODUCTS
    
    // 根据分类筛选商品（简单的关键词匹配）
    return PRODUCTS.filter(p => 
      p.name.includes(selectedCategory) || 
      p.description.includes(selectedCategory)
    )
  })()

  // 加入购物车
  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product])
    alert(`已加入购物车：${product.name}`)
  }

  // 转发商品
  const forwardProduct = (product: Product) => {
    if (!chatId) return
    
    // 创建商品卡片消息
    const productMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[商品] ${product.name}`,
      aiReadableContent: `用户分享了一个商品：
商品名称：${product.name}
价格：¥${product.price}
商品描述：${product.description}
销量：已售${product.sales}件

这是一个商品卡片，用户可能想让你了解这个商品，或者想要你的意见和建议。`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'productCard',
      productCard: {
        name: product.name,
        price: product.price,
        description: product.description,
        sales: product.sales
      }
    }
    
    // 发送到聊天
    addMessage(chatId, productMessage)
    
    // 返回聊天页面
    navigate(`/chat/${chatId}`)
  }

  // AI搜索商品
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // 使用智智代付API
      const { callZhizhiApi } = await import('../services/zhizhiapi')
      
      const content = await callZhizhiApi([{
        role: 'user',
        content: `你是一个电商平台的商品推荐AI。用户搜索了"${searchQuery}"，请生成5个相关商品。

要求：
1. 商品名称必须包含"${searchQuery}"关键词
2. 提供详细的商品描述（40-60字，包含特点、用途、优势等）
3. 价格范围：1元到10000元
4. 销量随机生成

返回格式（纯JSON数组）：
[{"name":"商品名","price":价格,"description":"描述","sales":销量}]

现在请为"${searchQuery}"生成5个商品：`
      }], { temperature: 0.8, max_tokens: 800 })
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        const products = JSON.parse(jsonMatch[0])
        setSearchResults(products.slice(0, 5).map((p: any, i: number) => ({
          id: `search-${Date.now()}-${i}`,
          name: p.name,
          price: p.price,
          description: p.description,
          sales: p.sales || 0
        })))
      }
    } catch (error) {
      console.error('搜索失败:', error)
      alert('搜索失败，请重试')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="h-screen bg-[#f7f8fa] flex flex-col font-sans">
      {/* 顶部导航 - 仿电商APP头部 */}
      <div className="bg-white sticky top-0 z-30 px-3 py-2 shadow-sm">
        <StatusBar />
        <div className="flex items-center gap-3 h-12">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-gray-800 active:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 搜索框 */}
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索商品..."
              className="w-full pl-9 pr-10 py-2 bg-gray-100 border border-transparent focus:bg-white focus:border-orange-500 rounded-full text-sm outline-none transition-all placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              搜索
            </button>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex flex-col items-center justify-center text-gray-600 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-[10px] leading-none mt-0.5">自定义</span>
          </button>
        </div>
        
        {/* 分类/筛选标签 */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 hide-scrollbar text-sm px-1">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                setSearchResults([]) // 清空搜索结果
                setSearchQuery('') // 清空搜索框
              }}
              className={`whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'font-bold text-orange-500 relative after:content-[""] after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-1 after:bg-orange-500 after:rounded-full'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto p-3 hide-scrollbar">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium animate-pulse">正在全网搜索好物...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {displayProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col group active:scale-[0.98] transition-all duration-200"
                >
                  {/* 商品图片区域 */}
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-6">
                      {/* 模拟商品图片内容 */}
                       <div className="text-center">
                         <div className="text-4xl mb-2">📦</div>
                         <p className="text-xs text-gray-400 line-clamp-3 px-2 opacity-60 scale-90">{product.description}</p>
                       </div>
                    </div>
                    {/* 转发按钮悬浮在图片右上角 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); forwardProduct(product); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-orange-500 transition-colors shadow-sm z-10"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    {/* 标签 */}
                    <div className="absolute bottom-0 left-0 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-tr-lg font-medium">
                      热销
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 leading-5 h-10">
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-1 rounded mr-1 align-middle">精选</span>
                        {product.name}
                      </h3>
                      
                      {/* 标签栏 */}
                      <div className="flex gap-1 mb-2">
                        <span className="text-[10px] text-orange-600 border border-orange-200 px-1 rounded">包邮</span>
                        <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">运费险</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <div className="flex items-baseline text-orange-600">
                          <span className="text-xs font-medium">¥</span>
                          <span className="text-lg font-bold font-din leading-none mx-0.5">{product.price}</span>
                          <span className="text-xs text-gray-400 font-normal ml-1 decoration-slice">
                            {product.sales > 1000 ? `${(product.sales/10000).toFixed(1)}万+` : product.sales}人付款
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="w-full py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full text-sm font-medium active:scale-95 transition-transform shadow-md shadow-orange-200 flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        加入购物车
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {displayProducts.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-500">暂无相关商品</p>
                <p className="text-sm mt-2 text-gray-400">换个关键词试试看吧~</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 自定义商品弹窗 */}
      {showCustomModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">自定义商品卡片</h3>
              <button onClick={() => setShowCustomModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                 <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block ml-1">商品名称</label>
                <input
                  type="text"
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：iPhone 15 Pro Max"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block ml-1">价格（元）</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</div>
                  <input
                    type="number"
                    value={customProduct.price}
                    onChange={(e) => setCustomProduct(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-din font-bold text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block ml-1">商品描述</label>
                <textarea
                  value={customProduct.description}
                  onChange={(e) => setCustomProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入详细的商品描述，突出卖点（40-60字最佳）"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    if (!customProduct.name || !customProduct.price || !customProduct.description) {
                      alert('请填写完整信息')
                      return
                    }
                    const newProduct: Product = {
                      id: `custom-${Date.now()}`,
                      name: customProduct.name,
                      price: parseFloat(customProduct.price),
                      description: customProduct.description,
                      sales: Math.floor(Math.random() * 5000) // 随机销量
                    }
                    forwardProduct(newProduct)
                    setCustomProduct({ name: '', price: '', description: '' })
                    setShowCustomModal(false)
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
                >
                  生成并发送
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OnlineShopping
