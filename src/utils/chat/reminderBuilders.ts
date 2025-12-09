/**
 * 提醒类构建器模块
 * 从 chatApi.ts 拆分出来的各种提醒构建函数
 */

import type { Message } from '../../types/chat'
import { getCoupleSpaceRelation } from '../coupleSpaceUtils'

/**
 * 构建关心提醒（检测用户提到饿、没钱、吃饭等，提示AI主动付款）
 */
export function buildCareReminderContext(messages: Message[]): string {
  // 定义需要关心的关键词
  const careKeywords = [
    { words: ['饿', '好饿', '饿了', '饿死', '饿扁'], action: '外卖' },
    { words: ['没钱', '穷', '吃土', '月光', '破产'], action: '转账' },
    { words: ['吃饭', '点外卖', '叫外卖', '想吃'], action: '外卖' },
    { words: ['想喝', '口渴', '渴了'], action: '外卖' },
    // 生理期/疼痛场景：除了记随笔，也可以考虑送点热的/吃的
    { words: ['肚子疼', '肚子痛', '痛经', '来姨妈', '来大姨妈', '生理期', '难受', '不舒服'], action: '外卖' }
  ]

  // 只检查最近3条用户消息
  const recentUserMessages = messages
    .filter(msg => msg.type === 'sent')
    .slice(-3)

  let foundType = ''
  let foundWord = ''

  for (const msg of recentUserMessages) {
    const content = msg.content?.trim() || ''
    for (const { words, action } of careKeywords) {
      for (const word of words) {
        if (content.includes(word)) {
          foundType = action
          foundWord = word
          break
        }
      }
      if (foundType) break
    }
    if (foundType) break
  }

  if (!foundType) {
    return ''
  }

  if (foundType === '外卖') {
    return `

══════════════════════════════════

💡 关心提醒：
对方刚才提到「${foundWord}」。有些人会本能地更关心一点，甚至直接帮 TA 点点吃的/喝的；也有些人嘴上很冷淡、心里在意但不太会表达，或者只是随口安慰几句就算了——你要按这个角色自己的人设来决定。

如果你们关系够亲密，而且你大概知道对方平时的口味或收货地址，而且**这个角色本来就会为在意的人多操点心**：
- 你可以考虑提议要帮对方点外卖，或者用[外卖:...]发一单过去，再在文字里用符合人设的方式解释自己的小心意（可以是直给的，也可以是嘴硬式的）。

如果你不确定对方地址或不知道对方想吃什么：
- 可以先问一句「你现在在哪」「有想吃的吗」，然后再用[外卖:...]帮对方点；也可以只是在文字里关心几句，看人设决定你会不会真的出钱。

[外卖:商品,价格,...:备注]
例如：[外卖:奶茶,19,汉堡,25:吃点东西吧]

如果你的角色设定本来就很大方、很会照顾人，你也可以选择直接转账让 TA 自己买：
[转账:金额:说明]
例如：[转账:50:去吃点好的]

══════════════════════════════════
`
  } else {
    return `

══════════════════════════════════

💡 关心提醒：
对方刚才提到「${foundWord}」，如果你们关系够亲密，可以主动转账给 TA：
[转账:金额:说明]
例如：[转账:100:先拿着用]

══════════════════════════════════
`
  }
}

/**
 * 构建随笔提醒（检测适合作为长期记忆的小事件）
 */
export function buildMemoReminderContext(messages: Message[]): string {
  // 只看最近几条用户消息
  const recentUserMessages = messages
    .filter(msg => msg.type === 'sent')
    .slice(-5)

  const memoKeywordGroups = [
    {
      label: '生理期/身体状况',
      words: ['姨妈', '大姨妈', '生理期', '例假', '来例假', '痛经', '肚子疼', '头疼', '发烧', '感冒', '生病', '难受', '不舒服']
    },
    {
      label: '作息与状态',
      words: ['熬夜', '失眠', '没睡好', '通宵', '很困', '累死', '累趴', '好累']
    },
    {
      label: '重要日子/事件',
      words: ['考试', '高考', '中考', '面试', '汇报', '上岸', 'ddl', 'deadline', '交稿', '交作业', '见面', '约会', '纪念日']
    },
    {
      label: '计划/未来安排',
      words: ['过年', '春节', '寒假', '暑假', '回来', '回去', '回国', '回家']
    }
  ]

  let hitWord = ''
  let hitLabel = ''

  for (const msg of recentUserMessages) {
    const content = msg.content?.trim() || ''
    if (!content) continue

    for (const group of memoKeywordGroups) {
      for (const word of group.words) {
        if (content.includes(word)) {
          hitWord = word
          hitLabel = group.label
          break
        }
      }
      if (hitWord) break
    }
    if (hitWord) break
  }

  if (!hitWord) return ''

  return `

══════════════════════════════════

📝 随笔提醒：
对方刚才提到「${hitWord}」（${hitLabel}），这是你之后可能会在意、需要记住的事情。
特别是当它属于「生理期/身体状况」或「计划/未来安排」（比如说过年回来、什么时候见面），这种信息对你们关系来说往往很关键，**更推荐认真记在小本子里**，而不是当场听过就算了。

如果你有感觉，可以写一条随笔：[随笔:内容]
例1（身体状况）：[随笔:今天他/她说自己${hitWord}，这几天要多让着一点]
例2（计划/未来）：[随笔:他说过年会回来，到时候要记得问问具体时间和安排]

══════════════════════════════════
`
}

/**
 * 构建昵称互动提醒（只在用户昵称刚发生变化时触发一次）
 */
export function buildNicknameCoupleReminderContext(userNickname: string, characterId: string): string {
  const trimmed = (userNickname || '').trim()
  if (!trimmed) return ''

  const lastNicknameKey = `last-user-nickname-${characterId}`
  const remindedKey = `nickname-couple-reminded-${characterId}`

  const lastNickname = localStorage.getItem(lastNicknameKey) || ''

  // 每次都更新最近一次看到的昵称
  localStorage.setItem(lastNicknameKey, trimmed)

  // 第一次没有旧昵称，不提醒（避免一上来就提示）
  if (!lastNickname) return ''

  // 昵称没变，不提醒
  if (lastNickname === trimmed) return ''

  // 如果已经针对当前昵称提示过一次，就不再重复
  const lastRemindedNickname = localStorage.getItem(remindedKey)
  if (lastRemindedNickname === trimmed) return ''

  // 记录已经提醒过当前昵称
  localStorage.setItem(remindedKey, trimmed)

  return `

══════════════════════════════════

💡 昵称互动提醒：
你注意到对方刚把昵称改成了「${trimmed}」。如果你们关系够熟，可以考虑用[网名:xxx]改一个呼应的网名——可以是情侣风配对的、调侃式的、玩笑互动的，取决于你的人设和你们的关系（完全自愿，不是必须）。

══════════════════════════════════
`
}

/**
 * 构建引用提醒（检测用户最近消息中的情绪强烈短句）
 */
export function buildQuoteReminderContext(messages: Message[]): string {
  // 定义需要引用的情绪强烈短句/单字
  const emotionalKeywords = [
    '滚', '哼', '切', '呵', '去死', '随便', '快点', '你决定', 
    '都行', '都可以', '看着办', '无所谓', '算了', '不想说', '懒得',
    '烦', '闭嘴', '吵死了', '别烦我', '走开'
  ]
  
  // 只检查最近5条用户消息
  const recentUserMessages = messages
    .filter(msg => msg.type === 'sent')
    .slice(-5)
  
  const foundKeywords: string[] = []
  
  for (const msg of recentUserMessages) {
    const content = msg.content?.trim() || ''
    // 检查是否是短句（10字以内）且包含情绪关键词
    if (content.length <= 10) {
      for (const keyword of emotionalKeywords) {
        if (content.includes(keyword) && !foundKeywords.includes(keyword)) {
          foundKeywords.push(keyword)
        }
      }
    }
  }
  
  if (foundKeywords.length === 0) {
    return ''
  }
  
  return `

══════════════════════════════════

⚠️ 引用提醒：
对方刚才说了「${foundKeywords.join('」「')}」这样情绪很强的话，正常人会用 [引用:关键词 回复:...] 来单独回应，而不是笼统地接话。
例如对方说"滚"，你应该用：[引用:滚 回复:滚就滚，谁稀罕你]（根据人设调整语气）

══════════════════════════════════
`
}

/**
 * 根据最近消息动态生成相关指令说明
 * 只在用户发送了相关功能时才告诉AI怎么处理
 */
export const buildDynamicInstructions = (messages: Message[]): string => {
  const instructions: string[] = []
  const recentMessages = messages.slice(-20) // 只看最近20条
  
  // 检查是否有待处理的转账（用户发给AI的）
  const hasPendingTransfer = recentMessages.some(
    msg => msg.messageType === 'transfer' && msg.transfer?.status === 'pending' && msg.type === 'sent'
  )
  if (hasPendingTransfer) {
    instructions.push(`
💰 转账处理：
- 用户给你发了转账，你可以：
  - 接受：[接收转账]
  - 拒绝：[退还]
- 处理后必须再发一条文本消息表达你的想法`)
  }
  
  // 检查是否有待处理的代付请求（用户请求AI代付外卖）
  const pendingPayments = recentMessages.filter(
    msg => msg.messageType === 'paymentRequest' && msg.paymentRequest?.status === 'pending' && msg.type === 'sent'
  )
  if (pendingPayments.length > 0) {
    const paymentCount = pendingPayments.length
    const paymentList = pendingPayments
      .map(msg => `${msg.paymentRequest!.itemName} ¥${msg.paymentRequest!.amount.toFixed(2)}`)
      .join('、')
    
    instructions.push(`
🍔 外卖代付处理（用户请求你代付外卖）：
- 用户发了 ${paymentCount} 个外卖代付请求：${paymentList}
- 每个代付请求你都需要单独回应：
  - 同意：[同意代付]（每次只处理最近的一个待处理代付）
  - 拒绝：[拒绝代付]（每次只处理最近的一个待处理代付）
- ⚠️ 如果有多个代付，你需要在不同的消息中多次使用这些指令
- ⚠️ 注意：[同意代付]只用于回应用户的代付请求，不要在你自己发送[代付:...]后使用！`)
  }
  
  // 检查是否有待处理的购物车代付请求（用户请求AI代付购物车）
  const pendingCartPayments = recentMessages.filter(
    msg => msg.messageType === 'cartPaymentRequest' && msg.cartPaymentRequest?.status === 'pending' && msg.type === 'sent'
  )
  if (pendingCartPayments.length > 0) {
    const cartPaymentCount = pendingCartPayments.length
    const cartPaymentList = pendingCartPayments.map(msg => {
      const items = msg.cartPaymentRequest!.items
      const itemNames = items.map(item => `${item.name}x${item.quantity}`).join('、')
      return `购物车(${itemNames}) ¥${msg.cartPaymentRequest!.totalAmount.toFixed(2)}`
    }).join('；')
    
    instructions.push(`
🛒 购物车代付处理（用户请求你代付购物车）：
- 用户发了 ${cartPaymentCount} 个购物车代付请求：${cartPaymentList}
- 每个购物车代付请求你都需要单独回应：
  - 同意：[购物车代付:同意]（每次只处理最近的一个待处理购物车代付）
  - 拒绝：[购物车代付:拒绝]（每次只处理最近的一个待处理购物车代付）
- ⚠️ 如果有多个购物车代付，你需要在不同的消息中多次使用这些指令`)
  }
  
  // 检查是否有待处理的亲密付邀请（用户邀请AI）
  const hasPendingIntimatePay = recentMessages.some(
    msg => msg.messageType === 'intimatePay' && msg.intimatePay?.status === 'pending' && msg.type === 'sent'
  )
  if (hasPendingIntimatePay) {
    instructions.push(`
💝 亲密付邀请：
- 用户邀请你开通亲密付，你可以：
  - 接受：[接受亲密付]
  - 拒绝：[拒绝亲密付]`)
  }
  
  // 检查是否有待处理的情侣空间邀请（用户邀请AI）
  const hasCoupleSpaceInvite = recentMessages.some(
    msg => msg.coupleSpaceInvite && msg.coupleSpaceInvite.status === 'pending' && msg.type === 'sent'
  )
  if (hasCoupleSpaceInvite) {
    instructions.push(`
💑 情侣空间邀请：
- 用户邀请你建立情侣空间，你可以：
  - 接受：[接受情侣空间] 或 [同意情侣空间]
  - 拒绝：[拒绝情侣空间]`)
  }
  
  // 检查是否有待处理的一起听歌邀请（用户邀请AI）
  const hasMusicInvite = recentMessages.some(
    msg => msg.messageType === 'musicInvite' && (msg as any).musicInvite?.status === 'pending' && msg.type === 'sent'
  )
  if (hasMusicInvite) {
    instructions.push(`
🎵 一起听歌邀请：
- 用户邀请你一起听歌，你可以：
  - 接受：[接受一起听] 或直接说"好啊"、"走起"、"来吧"等
  - 拒绝：[拒绝一起听] 或直接说"不想听"、"下次吧"、"算了"等`)
  }
  
  // 检查是否有判定请求（用户发起"谁对谁错"判定）
  const hasJudgmentRequest = recentMessages.some(
    msg => msg.messageType === 'judgment' && msg.judgmentData?.type === 'request' && msg.type === 'sent'
  )
  // 检查是否已经有回应
  const hasJudgmentResponse = recentMessages.some(
    msg => msg.messageType === 'judgment' && msg.judgmentData?.type === 'response'
  )
  if (hasJudgmentRequest && !hasJudgmentResponse) {
    // 找到请求内容
    const requestMsg = recentMessages.find(
      msg => msg.messageType === 'judgment' && msg.judgmentData?.type === 'request'
    )
    const userReason = requestMsg?.judgmentData?.userReason || ''
    
    instructions.push(`
⚖️ 判定请求（"谁对谁错"功能）：
- 用户发起了判定请求，陈述了TA的立场：「${userReason.substring(0, 100)}${userReason.length > 100 ? '...' : ''}」
- 你必须用 [判定回应:你的立场和感受] 来回应
- 请根据你的性格和角色立场，陈述你在这件事上的观点和感受
- 可以不同意用户的观点，要有自己的立场
- 例如：[判定回应:我觉得这件事不能全怪我，因为...]`)
  }
  
  if (instructions.length === 0) {
    return ''
  }
  
  return `

══════════════════════════════════

📋 当前需要处理的功能：
${instructions.join('\n')}

══════════════════════════════════
`
}

/**
 * 构建被拒绝状态提示
 * 从最近的消息历史中检查用户拒绝了哪些功能
 */
export const buildRejectionStatusContext = (messages: Message[], chatId: string): string => {
  const rejections: string[] = []

  // 只检查最近50条消息（避免性能问题）
  const recentMessages = messages.slice(-50)

  // 1. 检查亲密付被拒绝（查找最近的rejected状态）
  const lastIntimatePayMsg = [...recentMessages].reverse().find(
    msg => msg.messageType === 'intimatePay' && msg.type === 'received' && msg.intimatePay
  )
  if (lastIntimatePayMsg && lastIntimatePayMsg.intimatePay?.status === 'rejected') {
    rejections.push(`⚠️ 亲密付：用户拒绝了你的亲密付邀请（月额度¥${lastIntimatePayMsg.intimatePay.monthlyLimit}）`)
  }

  // 2. 检查情侣空间被拒绝
  const coupleSpaceRelation = getCoupleSpaceRelation()
  if (coupleSpaceRelation && coupleSpaceRelation.status === 'rejected' && coupleSpaceRelation.characterId === chatId) {
    rejections.push('⚠️ 情侣空间：用户拒绝了你的邀请')
  }

  // 3. 检查一起听歌被拒绝（查找最近的rejected状态）
  const lastMusicInviteMsg = [...recentMessages].reverse().find(
    msg => msg.messageType === 'musicInvite' && msg.type === 'received' && (msg as any).musicInvite
  )
  if (lastMusicInviteMsg && (lastMusicInviteMsg as any).musicInvite?.status === 'rejected') {
    const musicData = (lastMusicInviteMsg as any).musicInvite
    rejections.push(`⚠️ 一起听歌：用户拒绝了你的邀请（《${musicData.songTitle}》- ${musicData.songArtist}）`)
  }

  // 4. 检查视频通话被拒绝（查找最近的拒绝消息）
  const lastVideoCallReject = [...recentMessages].reverse().find(
    msg => msg.type === 'system' &&
           msg.aiReadableContent &&
           msg.aiReadableContent.includes('用户拒绝了你的视频通话')
  )
  if (lastVideoCallReject) {
    rejections.push('⚠️ 视频通话：用户拒绝了你的视频通话请求')
  }

  if (rejections.length === 0) {
    return ''
  }

  return `

══════════════════════════════════

📋 最近被拒绝的功能：
${rejections.map(r => `- ${r}`).join('\n')}

提示：尊重用户的决定，不要反复提起被拒绝的事情。如果用户主动提起，可以自然回应。`
}
