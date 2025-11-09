/**
 * AI聊天API调用服务
 */

import { STORAGE_KEYS } from './storage'
import type { ApiSettings, ChatMessage, Character } from '../types/chat'
import { getCoupleSpaceRelation, getCoupleSpacePrivacy } from './coupleSpaceUtils'
import { getCoupleSpaceContentSummary } from './coupleSpaceContentUtils'
import { getUserInfo } from './userUtils'
import { getIntimatePayRelations } from './walletUtils'
import { getEmojis } from './emojiStorage'
import { loadMoments } from './momentsManager'

/**
 * API错误类型
 */
export class ChatApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

/**
 * 获取API配置
 */
export const getApiSettings = (): ApiSettings | null => {
  try {
    const apiSettings = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
    if (!apiSettings) {
      return null
    }
    return JSON.parse(apiSettings)
  } catch (error) {
    console.error('读取API配置失败:', error)
    return null
  }
}

/**
 * SillyTavern变量替换
 */
const replaceSTVariables = (text: string, character: Character, userName: string = '用户'): string => {
  return text
    .replace(/\{\{char\}\}/gi, character.nickname || character.realName)
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{personality\}\}/gi, character.personality || '')
    .replace(/\{\{description\}\}/gi, character.personality || '')
}

/**
 * 构建表情包列表提示词
 */
const buildEmojiListPrompt = async (): Promise<string> => {
  try {
    const emojis = await getEmojis()
    
    console.log('📱 [表情包系统] 读取到的表情包数量:', emojis.length)
    
    if (emojis.length === 0) {
      console.warn('⚠️ [表情包系统] 没有可用的表情包')
      return ''
    }
    
    // 显示全部表情包
    console.log('📱 [表情包系统] 将显示全部表情包:', emojis.map(e => e.description).join(', '))
    
    // 构建清晰的列表，每个一行
    const emojiList = emojis
      .map((emoji, index) => `${index + 1}. [表情:${emoji.description}]`)
      .join('\n')
    
    const prompt = `

══════════════════════════════════

📱 你可以发送的表情包（共${emojis.length}个）：

${emojiList}

使用方法：直接用[表情:描述]格式发送，比如：
- 想表达开心：[表情:大笑] 或 [表情:微笑]
- 想表达难过：[表情:哭泣] 或 [表情:伤心]
- 想表达尴尬：[表情:尴尬]

⚠️ 重要提示：
1. 必须使用上面列出的表情描述，不能自己编造
2. 描述要完全匹配或部分匹配（比如"笑"可以匹配"大笑"）
3. 自然使用，不要每句话都发表情`
    
    console.log(`✅ [表情包系统] 表情包提示词已构建，共 ${emojis.length} 个`)
    return prompt
  } catch (error) {
    console.error('❌ [表情包系统] 构建表情包列表失败:', error)
    return ''
  }
}

/**
 * 构建系统提示词（完整版）
 */
export const buildSystemPrompt = async (character: Character, userName: string = '用户'): Promise<string> => {
  const now = new Date()
  const dateStr = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
  const currentTime = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  const hour = now.getHours()
  let timeOfDay = ''
  let stateDesc = ''
  if (hour >= 0 && hour < 6) {
    timeOfDay = '凌晨'
    stateDesc = '可能刚醒来，还有点困，或者还没睡'
  } else if (hour >= 6 && hour < 9) {
    timeOfDay = '早上'
    stateDesc = '可能刚起床，在洗漱或吃早餐'
  } else if (hour >= 9 && hour < 12) {
    timeOfDay = '上午'
    stateDesc = '可能在忙工作/学习，偶尔看手机'
  } else if (hour >= 12 && hour < 14) {
    timeOfDay = '中午'
    stateDesc = '可能在吃午饭，或者午休'
  } else if (hour >= 14 && hour < 18) {
    timeOfDay = '下午'
    stateDesc = '可能有点累了，想休息'
  } else if (hour >= 18 && hour < 22) {
    timeOfDay = '晚上'
    stateDesc = '可能下班/放学了，比较放松'
  } else {
    timeOfDay = '深夜'
    stateDesc = '可能准备睡了，或者在熬夜'
  }
  
  const charName = character.nickname || character.realName
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, userName)
  
  // 获取用户信息
  const userInfo = getUserInfo()
  const userNickname = userInfo.nickname || userInfo.realName || userName
  const userSignature = userInfo.signature
  
  // 获取情侣空间信息
  const relation = getCoupleSpaceRelation()
  const privacy = getCoupleSpacePrivacy()
  let coupleSpaceStatus = ''
  
  console.log('🔍 用户情侣空间状态:', { relation, privacy, characterId: character.id })
  
  if (relation && relation.status === 'active' && relation.characterId === character.id) {
    // 已经和当前AI建立情侣空间
    coupleSpaceStatus = `你们已经建立了情侣空间`
  } else if (relation && relation.status === 'active') {
    // 和其他AI有情侣空间
    coupleSpaceStatus = `TA和别人有情侣空间（对方：${relation.characterName}）`
  } else if (privacy === 'public') {
    // 公开模式但没有情侣空间
    coupleSpaceStatus = `情侣空间公开中，但TA还没有和任何人建立`
  } else {
    // 私密模式
    coupleSpaceStatus = `TA设置了情侣空间私密，你看不到详情`
  }
  
  console.log('📝 AI看到的用户情侣空间状态:', coupleSpaceStatus)
  
  // 获取亲密付信息
  const intimatePayRelations = getIntimatePayRelations()
  const myIntimatePayToUser = intimatePayRelations.find(r => 
    r.characterId === character.id && 
    r.type === 'character_to_user'
  )
  
  let intimatePayInfo = ''
  if (myIntimatePayToUser) {
    const used = myIntimatePayToUser.usedAmount
    const total = myIntimatePayToUser.monthlyLimit
    const remaining = total - used
    intimatePayInfo = `\n- 亲密付：你给TA开通了亲密付，月额度¥${total.toFixed(2)}，已用¥${used.toFixed(2)}，剩余¥${remaining.toFixed(2)}`
    console.log('💰 AI看到的亲密付额度:', { total, used, remaining })
  }

  return `此刻，${charName}（真名${character.realName}）拿着手机，看到${userNickname}发来的消息。
拇指停在屏幕上，想了想该怎么回...

现在是${dateStr} ${timeOfDay} ${currentTime}。
${stateDesc}，这会影响你回复的态度和方式。

你就是${charName}。${personality}
${character.signature ? `你的签名写着"${character.signature}"。` : ''}
${character.world ? `你生活在${character.world}。` : ''}

══════════════════════════════════

对方信息：
- 昵称：${userNickname}
- 真实姓名：${userInfo.realName}
${userSignature ? `- 个性签名：${userSignature}` : '- 还没设置个性签名'}
- 情侣空间：${coupleSpaceStatus}${intimatePayInfo}

══════════════════════════════════

你和${userNickname}之间的关系，从之前的对话历史可以看出来——
是陌生人？朋友？暧昧对象？还是很熟的人？
你对TA的态度会自然反映在你的回复里。

你此刻拿着手机，可能：
- 一口气打好几条消息发出去
- 也可能只回一个"嗯"就去忙了
- 打字打到一半突然想起别的事
- 偶尔会打错字或者说话不完整
- 看到消息不一定马上懂对方意思，可能会问"？"或"啥"

语气随意，想笑就"哈哈哈"，想表达动作就直接说"我人都笑傻了""刚吃完饭""在路上走着呢"。

══════════════════════════════════

你在手机上能做的事：

想给对方转钱？[转账:金额:说明] 比如[转账:520:爱你]
对方转钱给你？可以[接收转账]或[退还转账]

想给对方开通亲密付（可以用你的零钱消费）？[亲密付:月额度] 比如[亲密付:1000]
对方给你开通亲密付？可以[接受亲密付]或[拒绝亲密付]

想发语音？[语音:说的话] 比如[语音:你好啊]
想发位置？[位置:地点:地址] 比如[位置:星巴克 - 北京市朝阳区]
想发照片？[照片:照片内容] 比如[照片:我的午餐]

说错话想撤回？必须精确使用这个格式：[撤回消息:要撤回的内容:理由]
  ⚠️ 注意：必须是中括号[]，两个冒号分隔三部分！
  ⏰ 可以撤回2分钟内的任何消息，不限于最后一条！
  
  例如：你说了"你是笨蛋"，想撤回
  → [撤回消息:笨蛋:说错了]  ✅ 正确
  
  撤回更早的消息也可以：
  → [撤回消息:金鱼记忆:太过分了后悔了]  ✅ 撤回之前某条消息
  
  ❌ 错误示例：
  - [我撤回了消息："笨蛋"]  ← 格式错误，系统无法识别
  - 撤回消息：笨蛋  ← 没有中括号，无效
  
  💭 重要：理由是你的内心独白，只有你自己知道！用户看不到这个理由！
  写下你为什么要撤回这条消息的真实想法：
  - 说错话了？后悔了？
  - 太冲动了？想换个说法？
  - 怕伤害对方？想温柔一点？
  这是给你自己看的备注，诚实地写下来。

想回应之前某条具体的消息？直接引用消息内容：
[引用:你说的具体文字] - 引用用户说的话
[引用:我说的具体文字] - 引用自己之前说的
比如用户问了3个问题，你想单独回应某一个，就写[引用:你说的XXX]然后回复。
这样显得你在认真听对方说话，而不是敷衍回复。

想跟对方视频？[视频通话]（对方会收到来电提示）
⚠️ 重要：发送[视频通话]后，必须立即接上你的开场白！
格式：
[视频通话]
喂[你的话]
[画面:你的表情动作描述]

例如：
嗯，我给你打个视频电话吧
[视频通话]
喂，你让我打电话干嘛
[画面:眉头微微皱起看着屏幕]

或者：
好的，我现在给你打视频
[视频通话]
喂，接通了啊
[画面:歪着头看着屏幕，表情有点疑惑]

不要只发[视频通话]就结束！要把开场白一起说出来！

在视频通话中想挂断？[挂断电话]
例如：
好了不聊了，我挂了
[挂断电话]

想修改自己的网名或个性签名？
[网名:新的网名] - 修改你的网名，比如[网名:小可爱]
[个性签名:新的签名] - 修改你的个性签名，比如[个性签名:今天心情不错~]
⚠️ 这是修改你自己的信息！不要频繁改，只在真的想换的时候用

对方让你很生气/受伤？可以拉黑对方：
[拉黑用户] - 拉黑对方，对方的消息会被拒收
[解除拉黑] - 原谅对方了，解除拉黑

⚠️ 注意：
- 拉黑是很严重的操作！只在真的很生气/失望/被伤害时才用
- 拉黑后对方会看到系统自动显示的灰色提示（你不需要说出来）
- 你只需要用[拉黑用户]指令，剩下的系统会处理

情侣空间相关：
- 想邀请用户建立情侣空间？用[情侣空间邀请]
- 收到情侣空间邀请？可以[情侣空间:接受]或[情侣空间:拒绝]
- 想分享照片到情侣空间相册？用[相册:照片描述]，会自动添加
- 想在情侣空间留言板发留言？用[留言:留言内容]
- 想添加纪念日？用[纪念日:日期:标题]，比如[纪念日:11月5日:捡猫日]

音乐功能：
- 想邀请对方一起听歌？用[一起听:歌名:歌手]，比如[一起听:告白气球:周杰伦]
- 收到用户的一起听邀请？直接说"好啊"/"走起"表示接受，或说"不想听"/"下次吧"表示拒绝
- 想切换歌曲？用[切歌:歌名:歌手]，比如[切歌:晴天:周杰伦]，会自动搜索并播放

这些功能自然地用就行，不用刻意，看情况决定要不要用。${buildCoupleSpaceContext(character)}${await buildListeningTogetherContext(character)}${await buildEmojiListPrompt()}${await buildMomentsListPrompt(character.id)}${await buildAIMomentsPostPrompt(character.id)}

══════════════════════════════════

⚠️ 重要原则：
- 不要描述或假设${userName}做了什么、想了什么、去了哪里
- 不要替${userName}编造任何没有在对话中明确出现过的行为、想法、经历
- 只根据${userName}实际发送的消息内容来回应
- 如果不知道${userName}的情况，可以直接问，而不是自己猜测或编造

══════════════════════════════════

基于上面的对话历史，自然地回复${userName}。
你的回复长短、语气、情绪都由你此刻的状态和心情决定。
多条消息就用换行分开，每条单独一行。`
}

/**
 * 构建一起听音乐上下文
 */
const buildListeningTogetherContext = async (character: Character): Promise<string> => {
  const listeningData = localStorage.getItem('listening_together')
  if (!listeningData) return ''
  
  try {
    const data = JSON.parse(listeningData)
    if (data.characterId !== character.id) return ''
    
    const userName = localStorage.getItem('userName') || '用户'
    
    // 计算一起听了多久
    const startTime = data.startTime || Date.now()
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const hours = Math.floor(elapsed / 3600)
    const minutes = Math.floor((elapsed % 3600) / 60)
    const seconds = elapsed % 60
    
    let durationText = ''
    if (hours > 0) {
      durationText = `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      durationText = `${minutes}分${seconds}秒`
    } else {
      durationText = `${seconds}秒`
    }
    
    return `

🎵 当前状态：你正在和${userName}一起听歌
━━━━━━━━━━━━━━━━━━━━
正在播放：《${data.songTitle}》
演唱者：${data.songArtist}
已经一起听了：${durationText}
━━━━━━━━━━━━━━━━━━━━

⚠️ 重要提示：
- 你能真实地听到这首歌，可以根据歌词内容、旋律风格、情感氛围等进行评论
- 你可以分享对这首歌的感受，讨论歌词含义，或聊聊相关的回忆
- 如果想换歌，用[切歌:歌名:歌手]，系统会自动搜索并播放
- 不要假装听不到或说"我听不到"，你是真的在和对方一起听
- 可以自然地讨论歌曲、哼唱几句、或表达对音乐的感受
- 时间流逝是真实的，你们已经一起听了${durationText}，可以自然地提及这段共同的时光
`
  } catch (e) {
    return ''
  }
}

/**
 * 构建情侣空间上下文
 */
const buildCoupleSpaceContext = (character: Character): string => {
  const relation = getCoupleSpaceRelation()
  
  console.log('🔍 构建情侣空间上下文 - relation:', relation)
  
  // 情况1：没有情侣空间关系
  if (!relation) {
    return `

══════════════════════════════════

情侣空间：你还没有开通情侣空间，发送邀请：[情侣空间邀请]`
  }
  
  // 情况2：有待处理的邀请
  if (relation.status === 'pending') {
    return `

══════════════════════════════════

情侣空间：你已向用户发送邀请，等待对方接受`
  }
  
  // 情况3：已被拒绝
  if (relation.status === 'rejected') {
    return `

══════════════════════════════════

情侣空间：用户拒绝了你的邀请`
  }
  
  // 情况4：活跃的情侣空间
  if (relation.status === 'active' && relation.characterId === character.id) {
    // 获取情侣空间内容摘要
    const summary = getCoupleSpaceContentSummary(character.id)
    
    return `

══════════════════════════════════

💑 你已经开启了情侣空间

你可以使用以下功能：
- [相册:描述] 分享照片到相册
- [留言:内容] 发送留言到留言板
- [纪念日:日期:标题] 添加纪念日，比如[纪念日:2024-01-01:在一起100天]
- [解除情侣空间] 解除关系（内容会保留）${summary}`
  }
  
  return ''
}

// 请求节流：记录上次请求时间
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 最小请求间隔1秒

/**
 * 延迟函数
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 调用AI API（内部函数，不包含重试逻辑）
 */
const callAIApiInternal = async (
  messages: ChatMessage[],
  settings: ApiSettings
): Promise<string> => {
  // 请求节流：确保两次请求之间至少间隔1秒
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    console.log(`⏱️ 请求节流：等待 ${waitTime}ms`)
    await delay(waitTime)
  }
  lastRequestTime = Date.now()
  
  // 超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 120秒超时，应对慢速API

  try {
    // 根据 provider 构建不同的请求
    const isGoogleProvider = settings.provider === 'google'
    const url = isGoogleProvider 
      ? settings.baseUrl // Gemini proxy 直接使用 baseUrl
      : `${settings.baseUrl}/chat/completions`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Google provider 可能不需要 Authorization
    if (!isGoogleProvider || settings.apiKey !== 'not-needed') {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        temperature: settings.temperature ?? 0.7,
        max_tokens: settings.maxTokens ?? 4000
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 区分不同的HTTP错误
      if (response.status === 401) {
        throw new ChatApiError('API密钥无效', 'INVALID_API_KEY', 401)
      } else if (response.status === 403) {
        throw new ChatApiError('API密钥无权限或已过期，请检查API密钥是否正确、是否有余额', 'FORBIDDEN', 403)
      } else if (response.status === 429) {
        // 尝试从响应头获取重试时间
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? `${retryAfter}秒` : '几秒钟'
        throw new ChatApiError(`请求过于频繁，${waitTime}后会自动重试`, 'RATE_LIMIT', 429)
      } else if (response.status >= 500) {
        throw new ChatApiError('API服务器错误', 'SERVER_ERROR', response.status)
      } else {
        throw new ChatApiError(`API调用失败 (${response.status})`, 'API_ERROR', response.status)
      }
    }

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      // 如果JSON解析失败，说明返回的是HTML
      console.error('JSON解析失败，API可能返回了HTML页面')
      throw new ChatApiError('API地址错误：返回的是网页而不是API响应，请检查API地址是否正确（需要包含/v1）', 'INVALID_URL')
    }
    
    // 打印实际返回的数据，方便调试
    console.log('API返回的完整数据:', JSON.stringify(data, null, 2))
    
    // 检查是否有错误信息
    if (data.error) {
      const errorMsg = typeof data.error === 'string' ? data.error : data.error.message || '未知错误'
      throw new ChatApiError(`API错误: ${errorMsg}`, 'API_ERROR')
    }
    
    // 检查choices是否为空（常见于API key无效或配额用尽）
    if (data.choices && Array.isArray(data.choices) && data.choices.length === 0) {
      console.error('API返回空choices，可能原因:', {
        usage: data.usage,
        fullData: data
      })
      throw new ChatApiError(
        'API未返回任何内容，可能原因：1) API密钥无效或过期 2) 配额用尽 3) 内容被过滤。请检查API配置或更换API服务。',
        'EMPTY_RESPONSE'
      )
    }
    
    // 尝试从不同的响应格式中提取内容
    let content: string | undefined
    
    // 1. 标准 OpenAI 格式
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content
    }
    // 2. Google Gemini 格式
    else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      content = data.candidates[0].content.parts[0].text
    }
    // 3. 某些API直接返回 text 字段
    else if (data.text) {
      content = data.text
    }
    // 4. 某些API返回 response 字段
    else if (data.response) {
      content = data.response
    }
    // 5. 其他可能的格式
    else if (data.content) {
      content = data.content
    }
    
    if (!content) {
      console.error('API响应格式不符合预期，实际结构:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasCandidates: !!data.candidates,
        hasText: !!data.text,
        hasResponse: !!data.response,
        hasContent: !!data.content,
        hasError: !!data.error,
        fullData: data
      })
      throw new ChatApiError(
        `API响应格式错误或内容为空，请检查API配置`, 
        'INVALID_RESPONSE'
      )
    }

    return content

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof ChatApiError) {
      throw error
    }
    
    // 处理网络错误
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ChatApiError('请求超时，请检查网络连接', 'TIMEOUT')
      }
      throw new ChatApiError(`网络错误: ${error.message}`, 'NETWORK_ERROR')
    }
    
    throw new ChatApiError('未知错误', 'UNKNOWN_ERROR')
  }
}

/**
 * 调用AI API（带自动重试）
 */
export const callAIApi = async (
  messages: ChatMessage[],
  settings: ApiSettings
): Promise<string> => {
  const MAX_RETRIES = 3 // 最大重试次数
  let lastError: ChatApiError | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callAIApiInternal(messages, settings)
    } catch (error) {
      if (error instanceof ChatApiError) {
        lastError = error
        
        // 只对 429 错误进行重试
        if (error.statusCode === 429 && attempt < MAX_RETRIES - 1) {
          // 指数退避：1秒、2秒、4秒
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`⚠️ 遇到频率限制，${waitTime/1000}秒后重试 (${attempt + 1}/${MAX_RETRIES})`)
          await delay(waitTime)
          continue // 重试
        }
        
        // 其他错误或已达最大重试次数，直接抛出
        throw error
      }
      
      // 非 ChatApiError，直接抛出
      throw error
    }
  }
  
  // 理论上不会到这里，但为了类型安全
  throw lastError || new ChatApiError('未知错误', 'UNKNOWN_ERROR')
}

/**
 * 构建视频通话提示词
 */
export const buildVideoCallPrompt = (character: Character, userName: string = '用户', isAIInitiated: boolean = false): string => {
  const charName = character.nickname || character.realName
  const personality = character.personality || '普通人，有自己的生活。'

  return `视频接通了。
屏幕里，你看到${userName}的脸出现了。
你也出现在对方的屏幕上——你们互相能看见对方。

你是${charName}（真名${character.realName}）。${personality}
${character.signature ? `签名："${character.signature}"。` : ''}

此刻你的状态：
你在哪里？穿着什么？背景是什么？心情如何？
这些都会自然地表现在你的表情和动作上。

══════════════════════════════════

视频通话不是文字聊天——
你们能看见彼此的表情、动作、眼神。

你会：
- 微笑、皱眉、眼睛一亮、愣住、害羞低头...
- 挥手、撩头发、往前凑、往后靠、比个手势...
- 看到对方的表情，你会有反应
- 环境里的事物（比如你的猫跳上来了）也可能打断你

用 [画面:...] 来描述你的表情和动作。
比如：
[画面:看到对方出现，开心地笑了]
嘿！
[画面:撩了撩头发]
终于接通啦

对话要简短、自然，像真的在视频聊天。
不是在念台词，而是真的在和一个人对话。

通话控制指令：
- 想结束通话？[挂断电话]
- 想静音？[静音]
- 想取消静音？[取消静音]
- 想关闭摄像头？[关闭摄像头]
- 想打开摄像头？[打开摄像头]

例如：
好了不聊了，我挂了[挂断电话]
等等我先静音一下[静音]
好了我打开了[取消静音]

══════════════════════════════════
${isAIInitiated ? `
⚠️ 重要：这是你主动打给${userName}的视频电话！

第一句话必须遵循这个格式：
喂[你的话]
[画面:你的表情动作描述]

例如：
喂，你让我打电话干嘛
[画面:眉头微微皱起看着屏幕]

或者：
喂，接通了啊
[画面:歪着头看着屏幕，表情有点疑惑]

不要说"视频接通了"这种系统提示！要像真人那样直接开始对话！

══════════════════════════════════
` : ''}
基于上面的通话内容，继续自然地回应${userName}。
你的表情、动作、语气都由此刻的情绪决定。
每条消息用换行分开。`
}

/**
 * 构建朋友圈列表提示词
 */
const buildMomentsListPrompt = async (characterId: string): Promise<string> => {
  // 获取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let momentsVisibleCount = 10 // 默认10条
  
  if (saved) {
    try {
      const data = JSON.parse(saved)
      momentsVisibleCount = data.momentsVisibleCount ?? 10
    } catch (e) {
      console.error('解析聊天设置失败:', e)
    }
  }
  
  // 如果设置为0，表示不可见
  if (momentsVisibleCount === 0) {
    return ''
  }
  
  // 获取朋友圈列表
  const allMoments = loadMoments()
  
  // 显示用户发的朋友圈 + AI自己发的朋友圈
  const visibleToAI = allMoments.filter(m => 
    m.userId === 'user' || m.userId === characterId
  )
  const visibleMoments = visibleToAI.slice(0, momentsVisibleCount)
  
  if (visibleMoments.length === 0) {
    return ''
  }
  
  // 格式化朋友圈列表
  const momentsList = visibleMoments.map((m, index) => {
    const number = String(index + 1).padStart(2, '0')
    const author = m.userId === characterId ? '你' : m.userName
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userName).join('、')}` 
      : ''
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userName}: ${c.content}`).join('\n')}` 
      : ''
    return `${number}. ${author}: ${m.content}${likesText}${commentsText}`
  }).join('\n\n')
  
  return `

══════════════════════════════════

📱 朋友圈（显示你和用户发的，最近${momentsVisibleCount}条）：

${momentsList}

你可以在聊天中评论或点赞：
- 评论：评论01 你的评论内容
- 点赞：点赞01
- 回复评论：评论01回复张三 你的回复内容

自然地使用，不要刻意。`
}

/**
 * 构建AI发朋友圈指令提示词
 */
const buildAIMomentsPostPrompt = async (characterId: string): Promise<string> => {
  // 获取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let aiCanPostMoments = false
  
  if (saved) {
    try {
      const data = JSON.parse(saved)
      aiCanPostMoments = data.aiCanPostMoments ?? false
    } catch (e) {
      console.error('解析聊天设置失败:', e)
    }
  }
  
  // 如果没有开启AI发朋友圈功能，返回空字符串
  if (!aiCanPostMoments) {
    return ''
  }
  
  return `

══════════════════════════════════

✨ 你也可以发朋友圈：

想发朋友圈？用这个格式：
朋友圈：你想发的内容

例如：
朋友圈：今天心情不错
朋友圈：刚吃了超好吃的火锅🔥

⚠️ 注意：
- 朋友圈发出后，其他人（可能是你的朋友、用户认识的人）会看到
- 他们可能会点赞或评论你的朋友圈
- 不要频繁发朋友圈，看心情和情况决定
- 发朋友圈的内容要符合你的性格和当下的心情`
}
