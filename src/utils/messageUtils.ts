/**
 * 消息处理工具函数
 */

import type { Message, ChatMessage } from '../types/chat'
import { loadMessages, saveMessages } from './simpleMessageManager'
import { loadMoments } from './momentsManager'
import { getAllPosts } from './forumNPC'

/**
 * 配置常量
 */
export const MESSAGE_CONFIG = {
  MAX_HISTORY_COUNT: 20, // 默认的最大历史消息数
  STORAGE_KEY_PREFIX: 'chat_messages_',
  SETTINGS_KEY_PREFIX: 'chat_settings_'
} as const

/**
 * 获取指定聊天的消息条数设置
 */
export const getMessageLimitSetting = (chatId: string): number => {
  const settingsKey = `${MESSAGE_CONFIG.SETTINGS_KEY_PREFIX}${chatId}`
  const saved = localStorage.getItem(settingsKey)

  if (saved) {
    try {
      const settings = JSON.parse(saved)
      return settings.messageLimit ?? MESSAGE_CONFIG.MAX_HISTORY_COUNT
    } catch {
      return MESSAGE_CONFIG.MAX_HISTORY_COUNT
    }
  }

  return MESSAGE_CONFIG.MAX_HISTORY_COUNT
}

// 全局计数器，确保同一毫秒内生成的ID也是唯一的
let messageIdCounter = 0

/**
 * 格式化消息时间戳
 * 使用圆括号+“发于”前缀，让AI知道这是元数据而不是消息内容
 */
/**
 * 计算两条消息之间的时间间隔，返回自然语言描述
 * 只有间隔超过1分钟才返回，否则返回空字符串
 */
export function formatTimeGap(currentTimestamp: number, previousTimestamp: number | null): string {
  if (!previousTimestamp) return ''

  const gapMs = currentTimestamp - previousTimestamp
  const gapMinutes = Math.floor(gapMs / 60000)
  const gapHours = Math.floor(gapMinutes / 60)
  const gapDays = Math.floor(gapHours / 24)

  // 间隔小于1分钟不标注
  if (gapMinutes < 1) return ''

  // 间隔1-59分钟
  if (gapMinutes < 60) {
    return `[${gapMinutes}分钟后]`
  }

  // 间隔1-23小时
  if (gapHours < 24) {
    const remainMinutes = gapMinutes % 60
    if (remainMinutes > 0) {
      return `[${gapHours}小时${remainMinutes}分钟后]`
    }
    return `[${gapHours}小时后]`
  }

  // 间隔超过1天
  if (gapDays === 1) {
    return `[隔了一天]`
  }
  return `[隔了${gapDays}天]`
}

/**
 * 创建新消息
 */
export const createMessage = (
  content: string,
  type: 'sent' | 'received' | 'system'
): Message => {
  const now = Date.now()
  // 组合时间戳和计数器，确保ID唯一
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  return {
    id: uniqueId,
    type,
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now
  }
}

/**
 * 创建系统消息
 * 专门用于创建系统提示消息，避免类型转换
 */
export const createSystemMessage = (content: string): Message => {
  const now = Date.now()
  // 使用计数器确保ID唯一
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  return {
    id: uniqueId,
    type: 'system',
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now,
    messageType: 'system'
  }
}

/**
 * 状态记录类型（用于注入行程历史）
 */
export interface StatusRecord {
  time: string      // '09:30'
  action: string    // '在图书馆自习'
  timestamp: number
}

/**
 * 转换消息为API格式
 * @param messages 消息列表
 * @param hideTheatreHistory 是否隐藏小剧场历史（开启后AI看不到卡片）
 * @param addTimeGaps 是否添加时间间隔标记（用相对时间，AI无法模仿）
 * @param statusRecords 状态/行程记录，会按时间戳插入到消息流中
 */
export const convertToApiMessages = (
  messages: Message[],
  hideTheatreHistory: boolean = false,
  addTimeGaps: boolean = true,
  statusRecords: StatusRecord[] = []
): ChatMessage[] => {
  // 过滤后的消息列表
  const filteredMessages = messages.filter(msg => {
    // 🔥 过滤掉原始线下对话（sceneMode === 'offline'），只保留线下总结
    if (msg.sceneMode === 'offline' && msg.messageType !== 'offline-summary') {
      console.log('🚫 [线下消息过滤] 跳过原始线下对话:', msg.content?.substring(0, 30))
      return false
    }

    // 🎭 如果开启"隐藏小剧场历史"，过滤掉所有theatre类型消息
    if (hideTheatreHistory && msg.messageType === 'theatre') {
      console.log('🚫 [小剧场过滤] 已隐藏卡片历史:', msg.theatre?.templateName || '卡片')
      return false
    }

    return true
  })

  // 🔥 用 reduce 来追踪前一条消息的时间戳，计算时间间隔
  let prevTimestamp: number | null = null

  const result = filteredMessages.map(msg => {
    // 计算与前一条消息的时间间隔（放在消息开头，表示"X分钟后"）
    const timeGap = addTimeGaps ? formatTimeGap(msg.timestamp, prevTimestamp) : ''
    prevTimestamp = msg.timestamp

    // 处理撤回的消息
    if (msg.isRecalled && msg.recalledContent) {
      const isUserRecalled = msg.originalType === 'sent'
      const content = isUserRecalled
        ? `[撤回了消息: "${msg.recalledContent}"]`
        : `[我撤回了消息: "${msg.recalledContent}"]`
      return {
        role: isUserRecalled ? 'user' as const : 'assistant' as const,
        content: timeGap ? timeGap + ' ' + content : content
      }
    }

    // 视频通话记录转换为AI可读格式
    if (msg.messageType === 'video-call-record' && msg.videoCallRecord) {
      const duration = msg.videoCallRecord.duration
      const durationText = `${Math.floor(duration / 60)}分${duration % 60}秒`

      // 提取通话对话内容（包括旁白）
      const conversations = msg.videoCallRecord.messages
        .map(m => {
          if (m.type === 'narrator') {
            return `[画面: ${m.content}]` // 保留旁白（画面描述）
          }
          const speaker = m.type === 'user' ? '用户' : '你'
          return `${speaker}: ${m.content}`
        })
        .join('\n')

      // 使用已计算的 timeGap
      const callInfo = `[视频通话记录 - 时长${durationText}]\n通话内容:\n${conversations}`

      console.log('📞 [messageUtils] 视频通话记录已转换为AI可读格式', {
        时长: durationText,
        消息数: msg.videoCallRecord.messages.length,
        对话行数: conversations.split('\n').length
      })
      console.log('转换后的内容：', callInfo)

      return {
        role: 'system' as const,
        content: callInfo + timeGap
      }
    }

    // 转发的聊天记录转换为AI可读格式
    if (msg.messageType === 'forwarded-chat' && msg.forwardedChat) {
      const title = msg.forwardedChat.title
      const messageCount = msg.forwardedChat.messageCount

      // 提取聊天记录内容
      const chatContent = msg.forwardedChat.messages
        .map(m => {
          // 处理特殊消息类型
          let content = m.content
          if (m.messageType === 'photo') content = '[图片]'
          else if (m.messageType === 'voice') content = '[语音]'
          else if (m.messageType === 'location') content = '[位置]'
          else if (m.messageType === 'transfer') content = '[转账]'
          else if (m.messageType === 'video-call-record') content = '[视频通话]'
          else if (m.messageType === 'emoji') content = '[表情包]'

          return `${m.senderName}: ${content}`
        })
        .join('\n')

      // 使用已计算的 timeGap
      const forwardedInfo = msg.type === 'sent'
        ? `[用户转发了聊天记录]\n标题: ${title}\n共${messageCount}条消息\n聊天内容:\n${chatContent}`
        : `[对方转发了聊天记录]\n标题: ${title}\n共${messageCount}条消息\n聊天内容:\n${chatContent}`

      console.log('💬 [messageUtils] 转发记录已转换为AI可读格式', {
        标题: title,
        消息数: messageCount
      })
      console.log('转换后的内容：', forwardedInfo)

      return {
        role: msg.type === 'sent' ? ('user' as const) : ('assistant' as const),
        content: forwardedInfo + timeGap
      }
    }

    // 系统消息转换为AI可读格式（保留重要通知）
    if (msg.type === 'system') {
      console.log('🔍 检查系统消息:', msg.content)

      // 🔥 如果是 aiOnly 消息，直接传给AI（用户看不见但AI能看见）
      if (msg.aiOnly) {
        // 使用已计算的 timeGap
        const formattedContent = msg.aiReadableContent || msg.content || ''
        console.log('  ✅ AI专属消息:', formattedContent)
        return {
          role: 'system' as const,
          content: formattedContent + timeGap
        }
      }

      // 重要系统消息列表（这些消息需要让AI看到）
      const importantKeywords = [
        '亲密付',
        '情侣空间',
        '拒绝了',
        '驳回',
        '修改了',
        '视频通话',
        '拉黑',
        '解除拉黑',
        '拨打',
        '未接通',
        '取消了',
        '拍了拍',
        '踢了踢',
        '更换了头像',
        '换了头像',
        '换头像',
        '头像变更',
        '网名',
        '个性签名',
        '手机操作',  // AI的手机操作记录
        '备注改成',  // 改备注
        '免打扰',    // 设置免打扰
        '置顶聊天',  // 置顶
        '特别关心',  // 特别关心
        '保存到相册', // 保存照片
        '好友申请',  // 好友申请
        '为好友',    // 添加好友
        '验证消息',  // 验证消息
        '接受好友',  // 接受好友
        '拒绝好友',  // 拒绝好友
        '通过了你的好友' // 通过好友验证
      ]

      // 使用 aiReadableContent（如果有）或 content 来检查
      const checkContent = msg.aiReadableContent || msg.content || ''
      const isImportant = importantKeywords.some(keyword => checkContent.includes(keyword))

      console.log('  - 是否重要:', isImportant)

      if (isImportant) {
        // 优先使用 aiReadableContent，如果没有则使用 content
        let formattedContent = msg.aiReadableContent || msg.content || ''
        // 使用已计算的 timeGap

        // 格式化亲密付使用通知
        if (formattedContent.includes('的亲密付被使用了')) {
          const lines = formattedContent.split('\n')
          formattedContent = `【重要通知】${lines.join('，')}`
        }

        console.log('  ✅ AI将看到系统通知:', formattedContent)
        return {
          role: 'system' as const,
          content: formattedContent + timeGap
        }
      }

      console.log('  ❌ 系统消息被过滤')
      // 其他系统消息过滤掉
      return null
    }

    // 转账消息转换为AI可读格式
    if (msg.messageType === 'transfer' && msg.transfer) {
      const isUserSent = msg.type === 'sent'
      // 使用已计算的 timeGap
      const statusText = msg.transfer.status === 'pending' ? '待处理'
        : msg.transfer.status === 'received' ? '已收款'
          : '已退还'

      const transferInfo = isUserSent
        ? `[用户给你发起了转账：￥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message || '无'}，状态：${statusText}]`
        : `[你给用户发起了转账：￥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message || '无'}，状态：${statusText}]`

      return {
        role: isUserSent ? 'user' as const : 'assistant' as const,
        content: transferInfo + timeGap
      }
    }

    // 代付消息转换为AI可读格式
    if (msg.messageType === 'paymentRequest' && msg.paymentRequest) {
      const isUserSent = msg.type === 'sent'
      // 使用已计算的 timeGap
      const statusText = msg.paymentRequest.status === 'pending' ? '待处理'
        : msg.paymentRequest.status === 'paid' ? '已支付'
          : '已拒绝'

      const paymentInfo = isUserSent
        ? `[用户请求你代付：${msg.paymentRequest.itemName}，金额￥${msg.paymentRequest.amount.toFixed(2)}，备注：${msg.paymentRequest.note || '无'}，状态：${statusText}]`
        : `[你请求用户代付：${msg.paymentRequest.itemName}，金额￥${msg.paymentRequest.amount.toFixed(2)}，备注：${msg.paymentRequest.note || '无'}，状态：${statusText}]`

      return {
        role: isUserSent ? 'user' as const : 'assistant' as const,
        content: paymentInfo + timeGap
      }
    }

    // 语音消息转换为AI可读格式
    if (msg.messageType === 'voice' && msg.voiceText) {
      // 使用已计算的 timeGap
      const voiceInfo = `[语音: ${msg.voiceText}]`
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: voiceInfo + timeGap
      }
    }

    // 位置消息转换为AI可读格式
    if (msg.messageType === 'location' && msg.location) {
      // 使用已计算的 timeGap
      const locationInfo = `[位置: ${msg.location.name} - ${msg.location.address}]`
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: locationInfo + timeGap
      }
    }

    // 照片消息转换为AI可读格式
    if (msg.messageType === 'photo' && msg.photoDescription) {
      // 🔥 添加消息ID，让AI能够引用这张图片（用于换头像等功能）
      // 使用已计算的 timeGap
      const photoInfo = msg.type === 'sent'
        ? `[用户发了照片: ${msg.photoDescription}] (消息ID: ${msg.id})`
        : `[你发了照片: ${msg.photoDescription}]`

      // 如果有base64编码且是用户发送的照片，添加imageUrl字段供视觉识别API使用
      const chatMessage: ChatMessage = {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: photoInfo + timeGap
      }

      if (msg.photoBase64 && msg.type === 'sent') {
        console.log('📸 照片消息转换: photoBase64长度=', msg.photoBase64.length)
        chatMessage.imageUrl = `data:image/jpeg;base64,${msg.photoBase64}`
        console.log('✅ 已添加imageUrl到ChatMessage')
      } else {
        console.log('⚠️ 照片消息没有photoBase64数据')
      }

      return chatMessage
    }

    // 表情包消息转换为AI可读格式
    if (msg.messageType === 'emoji' && msg.emoji) {
      // 🔥 修复：让AI看到的格式和AI应该使用的格式一致，避免AI混淆
      // AI看到：[表情:描述] → AI学会：也要用[表情:描述]格式发送
      // 使用已计算的 timeGap
      const emojiInfo = msg.type === 'sent'
        ? `[用户发了表情包] [表情:${msg.emoji.description}]`
        : `[表情:${msg.emoji.description}]`  // AI自己发的，直接显示指令格式
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: emojiInfo + timeGap
      }
    }

    // 🎭 小剧场卡片消息转换为AI可读格式（自然语言描述，避免结构化格式被模仿）
    if (msg.messageType === 'theatre' && msg.theatre) {
      const templateName = msg.theatre.templateName || '卡片'
      let summary = ''

      try {
        const data = JSON.parse(msg.theatre.rawData || '{}')

        // 用完全口语化、无固定模式的描述，避免AI学习
        if (msg.theatre.templateId === 'poll') {
          const title = data.title || '投票'
          summary = msg.type === 'sent' ? `对方发起投票问${title}` : `发起投票问${title}`
        } else if (msg.theatre.templateId === 'payment_success') {
          const amount = data.amount || '0'
          const merchant = data.merchant || data.receiver || '商家'
          summary = msg.type === 'sent' ? `对方付款¥${amount}给${merchant}` : `付款¥${amount}给${merchant}`
        } else if (msg.theatre.templateId === 'red_packet') {
          const amount = data.amount || '0'
          summary = msg.type === 'sent' ? `对方发红包¥${amount}` : `发红包¥${amount}`
        } else if (msg.theatre.templateId === 'moments_post') {
          summary = msg.type === 'sent' ? `对方发了条朋友圈` : `发了条朋友圈`
        } else if (msg.theatre.templateId === 'weather') {
          const city = data.city || '城市'
          summary = msg.type === 'sent' ? `对方查看${city}天气` : `查看${city}天气`
        } else if (msg.theatre.templateId === 'wechat_chat') {
          summary = msg.type === 'sent' ? `对方转发了聊天记录` : `转发了聊天记录`
        } else if (msg.theatre.templateId === 'universal_card') {
          const title = data.title || ''
          summary = title ? (msg.type === 'sent' ? `对方发卡片${title}` : `发卡片${title}`) : (msg.type === 'sent' ? `对方发了张卡片` : `发了张卡片`)
        } else if (msg.theatre.templateId === 'memo_list') {
          const title = data.title || '清单'
          const items = data.items || data.list || []
          const firstThree = items.slice(0, 2).map((item: any) =>
            typeof item === 'string' ? item : item.text
          ).join('、')
          summary = msg.type === 'sent'
            ? `对方列了个${title}，写了${firstThree}这些`
            : `列了个${title}，写了${firstThree}这些`
        } else {
          // 其他类型
          summary = msg.type === 'sent' ? `对方发了${templateName}` : `发了${templateName}`
        }
      } catch (e) {
        console.error('[messageUtils] 解析卡片数据失败:', e)
      }

      // 直接描述内容，不加"你生成了/用户发送了"
      // 使用已计算的 timeGap
      const theatreInfo = `[${summary || templateName}]`

      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: theatreInfo + timeGap
      }
    }

    // 判定对错消息转换为AI可读格式
    if (msg.messageType === 'judgment' && msg.judgmentData) {
      // 优先使用 aiReadableContent（包含完整判决信息）
      const judgmentContent = msg.aiReadableContent || msg.content || '[判定消息]'
      return {
        role: msg.type === 'sent' ? 'user' as const : msg.type === 'received' ? 'assistant' as const : 'system' as const,
        content: judgmentContent + timeGap
      }
    }

    // 普通文本消息（包含引用信息）
    // 🔥 优先使用aiReadableContent（包含朋友圈等上下文），如果没有则使用content
    let textContent = msg.aiReadableContent || msg.content
    if (msg.quotedMessage && msg.quotedMessage.content) {
      // 简化引用内容显示
      let quotedContent = msg.quotedMessage.content
      // 如果引用内容太长，截取前50字
      if (quotedContent.length > 50) {
        quotedContent = quotedContent.substring(0, 50) + '...'
      }
      const quotedPrefix = `[引用了${msg.quotedMessage.senderName}的消息: "${quotedContent}"] `
      textContent = quotedPrefix + textContent
    }

    // 🔥 如果消息被拉黑，添加后缀说明
    if (msg.blocked) {
      if (msg.type === 'sent') {
        textContent = textContent + ' [此消息已被你拒收]'
      } else if (msg.type === 'received') {
        textContent = textContent + ' [此消息已被用户拒收]'
      }
    }

    // 🔥 如果开启时间戳，给消息加上时间标记（放在末尾，AI不会模仿）
    // 使用已计算的 timeGap
    return {
      role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
      content: textContent + timeGap
    }
  })
    .filter((msg): msg is Exclude<typeof msg, null> => msg !== null) as ChatMessage[]

  // 🔥 动态注入用户最近的朋友圈记录（如果消息列表中没有）
  try {
    const userMoments = loadMoments().filter(m => m.userId === 'user').slice(0, 5)

    if (userMoments.length > 0) {
      // 检查消息列表中是否已经有朋友圈记录
      const hasExistingMoments = result.some(m =>
        typeof m.content === 'string' && m.content.includes('【用户发朋友圈】')
      )

      if (!hasExistingMoments) {
        const momentsText = userMoments.map(m => {
          const images = m.images?.length ? ` [图片${m.images.length}张]` : ''
          return `${m.content || '[纯图片]'}${images}`
        }).join('\n')

        result.unshift({
          role: 'system' as const,
          content: `【用户最近的朋友圈】\n${momentsText}`
        })
        console.log('📷 [messageUtils] 注入用户朋友圈记录:', userMoments.length, '条')
      }
    }
  } catch (e) {
    // 忽略错误
  }

  // 🔥 动态注入用户最近的论坛帖子（让AI知道用户发了什么帖子）
  try {
    const userPosts = getAllPosts()
      .filter(p => p.npcId === 'user')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)

    if (userPosts.length > 0) {
      // 检查消息列表中是否已经有论坛帖子记录
      const hasExistingPosts = result.some(m =>
        typeof m.content === 'string' && m.content.includes('【用户最近的论坛帖子】')
      )

      if (!hasExistingPosts) {
        const postsText = userPosts.map(p => {
          const images = p.images > 0 ? ` [图片${p.images}张]` : ''
          const comments = p.comments > 0 ? ` (${p.comments}条评论, ${p.likes}赞)` : ''
          return `${p.content}${images}${comments}`
        }).join('\n')

        result.unshift({
          role: 'system' as const,
          content: `【用户最近的论坛帖子】\n${postsText}\n（你可以在聊天中自然提到"看到你发的帖子了"之类的，让对话更真实）`
        })
        console.log('📝 [messageUtils] 注入用户论坛帖子记录:', userPosts.length, '条')
      }
    }
  } catch (e) {
    // 忽略错误
  }

  // 🔥 注入状态/行程记录到消息流中（仅供AI回忆参考，不注入到对话）
  // 不再注入状态记录到消息流，因为：
  // 1. system角色会被降级为user，AI会以为是用户发的
  // 2. assistant角色+任何格式，AI都会学习模仿
  // 3. 状态信息已经通过 scheduleHint 在系统提示词里告诉AI了
  // 所以这里只打日志，不再注入
  if (statusRecords.length > 0) {
    console.log('📍 [messageUtils] 状态记录（不注入对话，仅供调试）:', statusRecords.map(r => `${r.time} ${r.action}`))
    // 不再创建 statusMessages，状态信息由 chatApi.ts 的 scheduleHint 处理
    // 不再注入 statusMessages 到 result，状态信息已在系统提示词的 scheduleHint 里
  }

  return result
}

/**
 * 获取最近的消息
 * @param messages 消息列表
 * @param chatId 聊天ID，用于读取用户设置的消息条数
 * @param count 手动指定的消息条数（优先级更高）
 */
export const getRecentMessages = (
  messages: Message[],
  chatId?: string,
  count?: number
): Message[] => {
  // 优先使用手动指定的count，否则从设置中读取，最后使用默认值
  let limit = count

  if (limit === undefined && chatId) {
    limit = getMessageLimitSetting(chatId)
  }

  if (limit === undefined) {
    limit = MESSAGE_CONFIG.MAX_HISTORY_COUNT
  }

  // 🔥 输出实际使用的消息条数限制
  console.log(`📊 [消息读取] 设置的限制: ${limit === 0 ? '无限制(读取全部)' : limit + '条'}`)
  console.log(`📊 [消息读取] 总消息数: ${messages.length}条`)
  console.log(`📊 [消息读取] 将返回: ${limit === 0 ? messages.length : Math.min(limit, messages.length)}条`)

  // 0 表示全部消息
  if (limit === 0) {
    return messages
  }

  return messages.slice(-limit)
}

/**
 * 加载聊天消息
 */
export const loadChatMessages = (chatId: string): Message[] => {
  try {
    const key = `${MESSAGE_CONFIG.STORAGE_KEY_PREFIX}${chatId}`
    const savedMessages = localStorage.getItem(key)
    return savedMessages ? JSON.parse(savedMessages) : []
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 保存聊天消息（使用统一的存储管理器）
 */
export const saveChatMessages = (chatId: string, msgs: Message[]): void => {
  // 🔥 使用simpleMessageManager统一管理（已升级到IndexedDB）
  saveMessages(chatId, msgs)
}

/**
 * 向指定角色的聊天记录添加通知消息
 */
export const addNotificationToChat = (characterId: string, content: string): void => {
  // 🔥 使用simpleMessageManager统一管理
  const messages = loadMessages(characterId)

  // 创建通知消息
  const now = Date.now()
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  const notificationMsg: Message = {
    id: uniqueId,
    type: 'system',
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: now,
    messageType: 'system'
  }

  messages.push(notificationMsg)
  saveMessages(characterId, messages)

  // 触发新通知事件（用于实时更新聊天页面）
  window.dispatchEvent(new CustomEvent('chat-notification-received', {
    detail: {
      chatId: characterId,
      message: notificationMsg,
      isIntimatePay: content.includes('亲密付')
    }
  }))

  console.log(`📬 已向 ${characterId} 的聊天添加通知:`, content)
}

/**
 * 解析AI回复，支持多条消息（按换行分隔）
 * 特殊处理：[视频通话]指令会把它和后面的开场白合并成一条（遇到空行分隔）
 */
export const parseAIMessages = (aiReply: string): string[] => {
  // 检测视频通话指令
  const videoCallMatch = aiReply.match(/[\[【]视频通话[\]】]/)

  if (videoCallMatch) {
    // 找到[视频通话]的位置
    const parts = aiReply.split(videoCallMatch[0])
    const beforeCall = parts[0]?.trim() || ''
    const afterCall = parts[1] || ''

    const messages: string[] = []

    // [视频通话]前面的内容按正常方式分割（这些是普通消息）
    if (beforeCall) {
      const beforeMessages = beforeCall
        .split('\n')
        .map(msg => msg.trim())
        .filter(msg => msg.length > 0)
      messages.push(...beforeMessages)
    }

    // 🔥 修复：只把紧跟在[视频通话]后的连续内容当作开场白，遇到空行就分隔
    // 按双换行符（空行）分段
    const afterCallParts = afterCall.split(/\n\s*\n/)

    // 第一段是开场白（可能包含多行）
    const openingLines = afterCallParts[0]?.trim() || ''
    const videoCallMessage = openingLines
      ? `${videoCallMatch[0]}\n${openingLines}`
      : videoCallMatch[0]
    messages.push(videoCallMessage)

    // 后面的段落作为普通消息
    for (let i = 1; i < afterCallParts.length; i++) {
      const segment = afterCallParts[i]?.trim()
      if (segment) {
        // 每个段落可能包含多行，按行分割
        const segmentLines = segment
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
        messages.push(...segmentLines)
      }
    }

    return messages
  }

  // 普通消息：按换行符分隔
  return aiReply
    .split('\n')
    .map(msg => msg.trim())
    .filter(msg => msg.length > 0)
}
