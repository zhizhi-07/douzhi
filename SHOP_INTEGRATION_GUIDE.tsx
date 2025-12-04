/**
 * 商城功能 - ChatDetail集成代码片段
 * 将以下代码添加到ChatDetail.tsx中对应位置
 */

// ============ 1. 导入语句部分（约第28行附近）============
import ShopManager from '../components/ShopManager'
import ShopViewer from '../components/ShopViewer'

// ============ 2. 状态管理部分（ChatDetail函数内部）============
// 商城相关状态
const [showShopManager, setShowShopManager] = useState(false)
const [showShopViewer, setShowShopViewer] = useState(false)
const [viewingShopId, setViewingShopId] = useState<string | null>(null)

// ============ 3. 处理函数部分============

// 打开商城管理
const handleSelectShop = () => {
    playSystemSound()
    setShowShopManager(true)
}

// 分享店铺
const handleShareShop = (shareData: any) => {
    const message: Message = {
        id: Date.now(),
        type: 'sent',
        messageType: 'shop',
        content: `[店铺] ${shareData.shopName}`,
        aiReadableContent: `[用户分享了店铺"${shareData.shopName}"，里面有${shareData.productCount}件商品：${shareData.previewProducts.map((p: any) => `${p.name}(¥${p.price})`).join('、')}。用户可以在这里购买情侣互动道具]`,
        shopShare: shareData,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    }

    chatState.setMessages(prev => {
        const updated = [...prev, message]
        if (id) saveMessages(id, updated)
        return updated
    })

    chatAI.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}

// 查看店铺（点击商城卡片时调用）
const handleViewShop = (shopId: string) => {
    setViewingShopId(shopId)
    setShowShopViewer(true)
}

// 购买商品
const handlePurchaseProduct = (product: any) => {
    const message: Message = {
        id: Date.now(),
        type: 'sent',
        content: `我要购买：${product.name}`,
        aiReadableContent: `[用户想要购买"${product.name}"(¥${product.price})，这是一个${product.category}商品：${product.description}。请回复购买确认或者拒绝]`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    }

    chatState.setMessages(prev => {
        const updated = [...prev, message]
        if (id) saveMessages(id, updated)
        return updated
    })

    setShowShopViewer(false)
    setViewingShopId(null)

    // 触发AI回复
    setTimeout(() => {
        chatAI.handleAIReply()
    }, 500)
}

// ============ 4. AddMenu组件部分（约1486行，找到<AddMenu>标签）============
// 在 <AddMenu 中添加:
onSelectShop = { handleSelectShop }

// 完整示例:
/*
<AddMenu
  isOpen={addMenu.showAddMenu}
  onClose={() => {
    playSystemSound()
    addMenu.setShowAddMenu(false)
  }}
  onSelectRecall={addMenu.handlers.handleSelectRecall}
  onSelectImage={addMenu.handlers.handleSelectImage}
  onSelectCamera={addMenu.handlers.handleSelectCamera}
  onSelectTransfer={addMenu.handlers.handleSelectTransfer}
  onSelectIntimatePay={addMenu.handlers.handleSelectIntimatePay}
  onSelectCoupleSpaceInvite={addMenu.handlers.handleSelectCoupleSpace}
  onSelectLocation={addMenu.handlers.handleSelectLocation}
  onSelectVoice={addMenu.handlers.handleSelectVoice}
  onSelectVideoCall={() => videoCall.startCall()}
  onSelectMusicInvite={() => musicInvite.setShowMusicInviteSelector(true)}
  onSelectAIMemo={addMenu.handlers.handleSelectAIMemo}
  onSelectOffline={addMenu.handlers.handleSelectOffline}
  onSelectPaymentRequest={addMenu.handlers.handleSelectPaymentRequest}
  onSelectShopping={addMenu.handlers.handleSelectShopping}
  onSelectPost={addMenu.handlers.handleSelectPost}
  onSelectFormatCorrector={addMenu.handlers.handleSelectFormatCorrector}
  onSelectWeather={addMenu.handlers.handleSelectWeather}
  onSelectEnvelope={addMenu.handlers.handleSelectEnvelope}
  onSelectJudgment={addMenu.handlers.handleSelectJudgment}
  onSelectShop={handleSelectShop}  // 新添加这一行
  hasCoupleSpaceActive={coupleSpace.hasCoupleSpace}
  customIcons={customIcons}
/>
*/

// ============ 5. SpecialMessageRenderer条件判断（约1044-1060行）============
// 找到 message.coupleSpaceInvite 的条件判断，添加 shop 类型
// 将这一行:
message.messageType === 'judgment' ? (
    // 改为:
    message.messageType === 'judgment' ||
        message.messageType === 'shop' ? (

// 完整示例:
/*
{message.coupleSpaceInvite ||
  message.messageType === 'intimatePay' ||
  message.messageType === 'forwarded-chat' ||
  message.messageType === 'emoji' ||
  message.messageType === 'transfer' ||
  message.messageType === 'voice' ||
  message.messageType === 'location' ||
  message.messageType === 'photo' ||
  message.messageType === 'paymentRequest' ||
  message.messageType === 'productCard' ||
  message.messageType === 'post' ||
  message.messageType === 'theatre' ||
  message.messageType === 'poke' ||
  message.messageType === 'musicShare' ||
  message.messageType === 'friendRequest' ||
  message.messageType === 'judgment' ||
  message.messageType === 'shop' ||  // 新添加这一行
  (message.messageType as any) === 'musicInvite' ? (
  <SpecialMessageRenderer
    message={message}
    ...
  />
) : (
  <MessageBubble
    message={message}
    ...
  />
)}
*/

// ============ 6. 组件渲染部分（约1814-1820行，JudgmentInputModal之后）============
// 在 </div> 结束标签之前添加商城组件

/*
{/* ⚖️ 判定对错输入弹窗 *​/}
<JudgmentInputModal
  isOpen={judgment.showJudgmentModal}
  onClose={() => judgment.setShowJudgmentModal(false)}
  characterName={character.nickname || character.realName}
  onSubmit={judgment.sendJudgmentRequest}
/>

{/* 🛍️ 商城管理 *​/}
<ShopManager
  isOpen={showShopManager}
  onClose={() => setShowShopManager(false)}
  onShare={handleShareShop}
/>

{/* 🛍️ 店铺查看器 *​/}
{viewingShopId && (
  <ShopViewer
    isOpen={showShopViewer}
    onClose={() => {
      setShowShopViewer(false)
      setViewingShopId(null)
    }}
    shopId={viewingShopId}
    onPurchase={handlePurchaseProduct}
  />
)}
</div>  // 这是 ChatDetail 的结束标签
*/

// ============ 7. SpecialMessageRenderer.tsx中添加ShopCard渲染 ============
// 文件路径: src/pages/ChatDetail/components/SpecialMessageRenderer.tsx

// 在文件顶部添加导入:
import ShopCard from '../../../components/ShopCard'

// 在渲染逻辑中添加（找到其他 message.messageType 的判断位置）:
/*
// 商城分享卡片
if (message.messageType === 'shop' && message.shopShare) {
  return (
    <ShopCard
      shopName={message.shopShare.shopName}
      productCount={message.shopShare.productCount}
      previewProducts={message.shopShare.previewProducts}
      onClick={() => {
        // 需要通过 props 传递 handleViewShop 函数
        // 或使用 window.dispatchEvent 触发事件
        window.dispatchEvent(new CustomEvent('view-shop', {
          detail: { shopId: message.shopShare.shopId }
        }))
      }}
    />
  )
}
*/

// 如果使用事件方式，需要在 ChatDetail中添加监听:
/*
useEffect(() => {
  const handleViewShopEvent = (e: any) => {
    handleViewShop(e.detail.shopId)
  }
  window.addEventListener('view-shop', handleViewShopEvent)
  return () => window.removeEventListener('view-shop', handleViewShopEvent)
}, [])
*/

// ============ 完成！============
