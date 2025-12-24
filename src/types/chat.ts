/**
 * 聊天相关类型定义
 */

export interface Message {
  id: number
  type: 'sent' | 'received' | 'system'
  content?: string
  aiReadableContent?: string  // AI读取的内容（如果与用户看到的不同）
  aiOnly?: boolean  // 只给AI看的消息，用户界面不显示
  time: string
  timestamp: number
  messageType?: 'text' | 'voice' | 'location' | 'photo' | 'transfer' | 'video-call-record' | 'system' | 'intimatePay' | 'forwarded-chat' | 'emoji' | 'musicInvite' | 'musicShare' | 'ai-memo' | 'paymentRequest' | 'productCard' | 'post' | 'offline-summary' | 'topic-start' | 'theatre' | 'theatre-html' | 'poke' | 'friendRequest' | 'judgment' | 'shop' | 'purchase' | 'busy' | 'logistics' | 'shoppingCart' | 'cartPaymentRequest' | 'giftCart' | 'tacitGameResult' | 'html' | 'contactCard' | 'checkIn' | 'gomoku' | 'gomokuResult'
  sceneMode?: 'online' | 'offline'  // 场景模式：在线聊天 or 线下剧情
  sceneContext?: {                   // 线下场景上下文
    location?: string                // 地点
    time?: string                    // 时间
    weather?: string                 // 天气
  }
  checkIn?: {                         // 情侣打卡数据
    streak: number                    // 连续打卡天数
    fortune: string                   // 今日运势/任务内容
    fortuneType: 'fortune' | 'task'   // 类型
    level?: string                    // 运势等级（吉/大吉/上上签等）
  }
  gomokuResult?: {                    // 五子棋结果
    userWin: boolean                  // 用户是否胜利
    userName?: string                 // 用户名
    userAvatar?: string               // 用户头像
    aiName: string                    // AI名
    aiAvatar?: string                 // AI头像
  }
  offlineSummary?: {                 // 线下记录信息
    title: string                    // 标题
    summary: string                  // 摘要
    memoryId?: string                // 关联的记忆ID
  }
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
  blockedByReceiver?: boolean  // 用户被AI拉黑（用户消息显示警告图标和拒收提示）
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
    paidByIntimatePay?: boolean  // 是否使用亲密付支付
    intimatePayCharacterName?: string  // 亲密付支付人名称
  }
  voiceText?: string  // 语音消息的文本内容
  voiceUrl?: string   // 语音消息的音频URL
  duration?: number   // 语音时长（秒）
  location?: {        // 位置消息
    name: string      // 地点名称
    address: string   // 详细地址
  }
  photoDescription?: string  // 照片描述
  photoBase64?: string        // 照片的base64编码（用于AI识图）
  isRecalled?: boolean        // 是否已撤回
  recalledContent?: string    // 撤回前的原始内容（供AI查看）
  recallReason?: string       // 撤回理由
  originalType?: 'received' | 'sent'  // 撤回前的原始消息类型
  quotedMessage?: {           // 引用的消息
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent' | 'system'
  }
  videoCallRecord?: {         // 视频通话记录
    duration: number          // 通话时长（秒）
    messages: Array<{
      id: number
      type: 'user' | 'ai' | 'narrator'
      content: string
      time: string
    }>
  }
  coupleSpaceInvite?: {       // 情侣空间邀请
    status: 'pending' | 'accepted' | 'rejected'
    senderName: string
    senderAvatar?: string
    isJoinInvite?: boolean    // 是否是加入已有空间的邀请（多人情侣空间）
  }
  intimatePay?: {             // 亲密付
    monthlyLimit: number
    status: 'pending' | 'accepted' | 'rejected'
    characterName: string
  }
  forwardedChat?: {           // 转发的聊天记录
    title: string             // 标题
    messages: Array<{
      senderName: string
      content: string
      messageType?: string
      time?: string
    }>
    messageCount: number      // 消息数量
  }
  emoji?: {                   // 表情包
    id: number
    url: string
    name: string
    description: string
  }
  musicInvite?: {             // 一起听邀请
    songTitle: string         // 歌曲标题
    songArtist: string        // 歌手
    songCover?: string        // 封面图片
    inviterName: string       // 邀请人姓名
    status: 'pending' | 'accepted' | 'rejected'  // 邀请状态
  }
  musicShare?: {              // 分享音乐
    songTitle: string         // 歌曲标题
    songArtist: string        // 歌手
    songCover?: string        // 封面图片
  }
  emojiDrawInvite?: {         // 颜文字你画我猜邀请
    inviterName: string       // 邀请人姓名
    status: 'pending' | 'accepted' | 'rejected'  // 邀请状态
  }
  paymentRequest?: {          // 代付请求
    itemName: string          // 商品/项目名称（外卖、衣服等）
    amount: number            // 金额
    note?: string             // 备注
    paymentMethod: 'ai' | 'self' | 'intimate'  // 支付方式：AI代付/自己支付/亲密付
    status: 'pending' | 'paid' | 'rejected'    // 状态（仅AI代付有pending状态）
    requesterId: string       // 发起人ID（通常是'user'）
    requesterName: string     // 发起人名称
    payerId?: string          // 付款人ID（AI代付时是角色ID）
    payerName?: string        // 付款人名称
  }
  productCard?: {             // 商品卡片
    name: string              // 商品名称
    price: number             // 价格
    description: string       // 商品描述
    sales: number             // 销量
  }
  post?: {                    // 帖子卡片
    content: string           // 帖子内容（完整的帖子文本）
    prompt: string            // 用户的生成描述
    postId?: string           // 帖子ID（用于跳转详情页）
    images?: string[]         // 帖子图片
  }
  theatre?: {                 // 小剧场HTML
    templateId: string        // 模板ID
    templateName: string      // 模板名称
    htmlContent: string       // 渲染后的HTML内容
    rawData: string           // AI输出的原始数据
  }
  poke?: {                    // 拍一拍
    fromName: string          // 发起人名字
    toName: string            // 被拍人名字
    suffix?: string           // 拍一拍后缀
  }
  friendRequest?: {           // 好友申请
    status: 'pending' | 'accepted' | 'rejected'
    message: string           // 验证消息
  }
  judgmentData?: {            // 判定对错数据
    type: 'request' | 'response' | 'result' | 'appeal'  // appeal: AI发起的上诉
    userReason?: string       // 用户的立场
    aiReason?: string         // AI的立场/上诉理由
    bias?: 'neutral' | 'user' | 'ai'  // 判定偏向
    result?: {                // 判定结果
      winner: 'user' | 'ai' | 'draw'
      reason: string
      solution: string
      userScore: number
      aiScore: number
    }
    userName?: string
    characterName?: string
  }
  shopShare?: {               // 商城分享
    shopId: string            // 店铺ID
    shopName: string          // 店铺名称
    productCount: number      // 商品总数
    previewProducts: Array<{  // 预览商品（最多3个）
      id: string
      name: string
      price: number
      image: string
    }>
  }
  purchaseData?: {            // 购买数据
    buyerName: string         // 买家名称
    sellerName: string        // 卖家名称
    productName: string       // 商品名称
    price: number             // 价格
    note?: string             // 备注
  }
  source?: 'dm'               // 消息来源：dm=论坛私聊（同步到主聊天时标记）
  logistics?: {               // 物流信息
    type: 'takeout' | 'package'  // 类型：外卖/快递
    status: string              // 状态文本
    detail: string              // 详细信息
    productName: string         // 商品名称
    price: number               // 商品价格
  }
  shoppingCart?: {            // 购物车
    items: Array<{
      id: string
      name: string
      price: number
      description: string
      quantity: number
      image?: string          // 商品图片（emoji或URL）
    }>
    totalAmount: number       // 总金额
    discount?: number         // 优惠金额
    shipping?: number         // 运费
    storeName?: string        // 店铺名称
  }
  cartPaymentRequest?: {      // 购物车代付请求
    cartId: string            // 购物车ID
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
    }>
    totalAmount: number       // 总金额
    requesterName: string     // 发起人名称
    status: 'pending' | 'paid' | 'rejected'  // 状态
    payerName?: string        // 付款人名称
    note?: string             // 备注
    isGift?: boolean          // 是否是礼物（给AI购买）
  }
  giftCart?: {                // 送礼物（给AI购买）
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
      image?: string
    }>
    totalAmount: number       // 总金额
    senderName: string        // 送礼人名称
    storeName?: string        // 店铺名称
    status: 'paid'            // 状态（送礼物都是已支付）
  }
  tacitGameResult?: {         // 默契游戏结果
    gameType: 'draw' | 'act'  // 游戏类型
    topic: string             // 题目
    aiGuess: string           // AI猜测的内容
    isCorrect: boolean        // 是否猜对
    characterName: string     // AI角色名
    rating?: number           // 用户评分（1-5星）
  }
  contactCard?: {             // 名片消息
    characterId: string       // 被推荐的角色ID
    characterName: string     // 被推荐的角色名称
    characterAvatar?: string  // 被推荐的角色头像
    signature?: string        // 被推荐的角色签名
    // 好友申请状态：pending=等待对方同意, accepted=已同意, rejected=已拒绝
    friendStatus?: 'pending' | 'accepted' | 'rejected'
    requestSentByAI?: boolean // 当前AI是否已发送好友申请
    verificationMessage?: string // AI发送的验证消息
  }
  metadata?: {                // 技术元数据
    generationTime?: number   // 生成耗时(ms)
    tokenCount?: number       // 生成内容Token数(估算)
    model?: string            // 使用的模型
  }
}

export interface Character {
  id: string
  realName: string
  nickname?: string
  signature?: string
  avatar?: string
  personality?: string  // 人设描述/性格
  currentActivity?: string  // 当前状态（如：在看电影、在上班、空闲）
  pokeSuffix?: string  // 拍一拍后缀（如："的小脑袋"）
  worldSetting?: string  // 世界观设定（自定义）
  languageStyle?: 'modern' | 'ancient' | 'noble' | 'fantasy' | 'auto'  // 语言风格：现代/古风/贵族/奇幻/自动检测
  // 以下为可选扩展字段（兼容外部角色卡/预设）
  world?: string
  scenario?: string
  version?: string
  system?: string
  post_history_instructions?: string
  first_mes?: string
  greeting?: string
}

export interface ApiSettings {
  baseUrl: string
  apiKey: string
  model: string
  provider: string
  temperature?: number
  maxTokens?: number
  supportsVision?: boolean  // 是否支持视觉识别（图片理解）
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
    }
  }>
  // 可选的图片URL（用于视觉识别API）
  imageUrl?: string
}
