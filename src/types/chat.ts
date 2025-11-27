/**
 * 聊天相关类型定义
 */

export interface Message {
  id: number
  type: 'sent' | 'received' | 'system'
  content?: string
  aiReadableContent?: string  // AI读取的内容（如果与用户看到的不同）
  time: string
  timestamp: number
  messageType?: 'text' | 'voice' | 'location' | 'photo' | 'transfer' | 'video-call-record' | 'system' | 'intimatePay' | 'forwarded-chat' | 'emoji' | 'musicInvite' | 'ai-memo' | 'paymentRequest' | 'productCard' | 'post' | 'offline-summary' | 'theatre' | 'poke'
  sceneMode?: 'online' | 'offline'  // 场景模式：在线聊天 or 线下剧情
  sceneContext?: {                   // 线下场景上下文
    location?: string                // 地点
    time?: string                    // 时间
    weather?: string                 // 天气
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
