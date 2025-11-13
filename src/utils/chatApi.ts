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
import { getAllMemos } from './aiMemoManager'

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
 * SillyTavern变量替换（完整版）
 */
const replaceSTVariables = (text: string, character: Character, userName: string = '用户'): string => {
  // 获取当前时间和日期
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const datetimeStr = now.toLocaleString('zh-CN')
  
  // 星期
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[now.getDay()]
  
  // 时段
  const hour = now.getHours()
  let timePeriod = '凌晨'
  if (hour >= 6 && hour < 9) timePeriod = '早上'
  else if (hour >= 9 && hour < 12) timePeriod = '上午'
  else if (hour >= 12 && hour < 14) timePeriod = '中午'
  else if (hour >= 14 && hour < 18) timePeriod = '下午'
  else if (hour >= 18 && hour < 22) timePeriod = '晚上'
  else if (hour >= 22 || hour < 6) timePeriod = '深夜'
  
  const charName = character.nickname || character.realName
  
  return text
    // 基础变量
    .replace(/\{\{char\}\}/gi, charName)
    .replace(/\{\{user\}\}/gi, userName)
    // 时间变量
    .replace(/\{\{time\}\}/gi, timeStr)
    .replace(/\{\{date\}\}/gi, dateStr)
    .replace(/\{\{datetime\}\}/gi, datetimeStr)
    .replace(/\{\{weekday\}\}/gi, weekday)
    .replace(/\{\{daytime\}\}/gi, timePeriod)
    // 角色信息变量
    .replace(/\{\{personality\}\}/gi, character.personality || '')
    .replace(/\{\{description\}\}/gi, character.personality || '')
    .replace(/\{\{scenario\}\}/gi, character.scenario || '')
    .replace(/\{\{char_version\}\}/gi, character.version || '')
    .replace(/\{\{system\}\}/gi, character.system || '')
    .replace(/\{\{post_history_instructions\}\}/gi, character.post_history_instructions || '')
    .replace(/\{\{char_greeting\}\}/gi, character.first_mes || character.greeting || '')
}

/**
 * 构建表情包列表提示词
 */
const buildEmojiListPrompt = async (): Promise<string> => {
  try {
    const emojis = await getEmojis()
    
    if (import.meta.env.DEV) {
      console.log('📱 [表情包系统] 读取到的表情包数量:', emojis.length)
    }
    
    if (emojis.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [表情包系统] 没有可用的表情包')
      }
      return ''
    }
    
    // 显示全部表情包
    if (import.meta.env.DEV) {
      console.log('📱 [表情包系统] 将显示全部表情包:', emojis.map(e => e.description).join(', '))
    }
    
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
    
    if (import.meta.env.DEV) {
      console.log(`✅ [表情包系统] 表情包提示词已构建，共 ${emojis.length} 个`)
    }
    return prompt
  } catch (error) {
    console.error('❌ [表情包系统] 构建表情包列表失败:', error)
    return ''
  }
}

/**
 * 构建线下模式提示词（小说叙事风格）
 */
export const buildOfflinePrompt = async (character: Character, userName: string = '用户'): Promise<string> => {
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
  if (hour >= 0 && hour < 6) timeOfDay = '凌晨'
  else if (hour >= 6 && hour < 9) timeOfDay = '早上'
  else if (hour >= 9 && hour < 12) timeOfDay = '上午'
  else if (hour >= 12 && hour < 14) timeOfDay = '中午'
  else if (hour >= 14 && hour < 18) timeOfDay = '下午'
  else if (hour >= 18 && hour < 22) timeOfDay = '晚上'
  else timeOfDay = '深夜'
  
  const charName = character.nickname || character.realName
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, userName)
  const userName2 = userName === '用户' ? '你' : userName
  
  // 检查是否有自定义预设
  const customPreset = localStorage.getItem('offline-preset')
  if (customPreset) {
    try {
      const preset = JSON.parse(customPreset)
      const presetName = localStorage.getItem('offline-active-preset') || '自定义预设'
      if (import.meta.env.DEV) {
        console.log('📋 使用自定义预设:', presetName)
      }
      
      let customPrompt = ''
      
      // 优先使用 system_prompt 字段
      if (preset.system_prompt || preset.systemPrompt) {
        customPrompt = preset.system_prompt || preset.systemPrompt
      } 
      // 如果有 prompts 数组，合并所有启用的提示词
      else if (preset.prompts && Array.isArray(preset.prompts)) {
        const enabledPrompts = preset.prompts
          .filter((p: any) => p.enabled)
          .sort((a: any, b: any) => (a.injection_order || 0) - (b.injection_order || 0))
        
        if (import.meta.env.DEV) {
          console.log(`🎯 预设包含 ${preset.prompts.length} 个提示词，已启用 ${enabledPrompts.length} 个`)
        }
        
        // 合并所有启用的提示词内容
        customPrompt = enabledPrompts
          .map((p: any) => p.content || '')
          .filter((c: string) => c.trim().length > 0)
          .join('\n\n')
      }
      
      if (customPrompt) {
        // 替换预设中的变量
        customPrompt = replaceSTVariables(customPrompt, character, userName)
        
        // 添加时间和角色信息
        const contextInfo = `
当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）

══════════════════════════════════

`
        
        if (import.meta.env.DEV) {
          console.log('✅ 预设提示词长度:', customPrompt.length, '字符')
        }
        return contextInfo + customPrompt
      }
    } catch (error) {
      console.error('⚠️ 预设解析失败，使用默认提示词:', error)
    }
  }
  
  // 默认提示词
  return `你是小说叙事者，以第三人称视角书写场景。

当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）

══════════════════════════════════

叙事要求：

1. **视角**：第三人称全知视角，可以描写环境、动作、对话、心理
2. **环境描写**：细腻描绘场景氛围（光线、声音、气味、温度等）
3. **动作描写**：生动具体的肢体语言和表情变化
4. **对话**：自然真实，符合人物性格
5. **心理描写**：用【】标记内心独白，如：【${charName}心想：...】

格式示例：
"${timeOfDay}的阳光透过窗户洒进来，空气中飘着咖啡的香气。

${charName}坐在沙发上，手指无意识地敲着扶手，听到手机振动的声音。

他拿起手机，看到${userName2}发来的消息。

'你终于来了。'他嘴角扬起微笑，打字回复道。

【${charName}心想：等了这么久，还以为她不会来了...】"

══════════════════════════════════

⚠️ 重要原则：
- ${userName2}是通过消息和${charName}对话的
- 不要替${userName2}做决定或描写${userName2}的心理
- 只描写${charName}的心理活动、动作和对话
- 对话要自然，不要过于文艺腔
- 保持${charName}的人设和说话风格
- ${charName}可以回复消息、做事情、有内心活动

══════════════════════════════════

📝 叙事格式要求：

‼️ 禁止写成一大段没有分段的长文本！

正确做法：
✅ 每个场景动作换一段
✅ 对话和描写分段
✅ 心理活动单独成段
✅ 避免连续多个空行（最多1个空行）

错误示例：
❌ ${charName}坐在沙发上看到消息然后拿起手机打字回复说你好啊他心想对方终于回消息了然后继续打字...（太长不分段）

正确示例：
✅ ${charName}坐在沙发上，听到手机振动。

他拿起手机，看到${userName2}的消息。

'你好啊。'他打字回复道。

【${charName}心想：终于回消息了...】

记住：
- 像写小说一样自然分段
- 环境、动作、对话、心理各自成段
- 保持阅读节奏，不要堆砌

══════════════════════════════════

基于上面的对话历史和${userName2}的消息，以小说风格叙述${charName}的反应。`
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
  const minute = now.getMinutes()
  let timeOfDay = ''
  if (hour >= 0 && hour < 6) timeOfDay = '凌晨'
  else if (hour >= 6 && hour < 9) timeOfDay = '早上'
  else if (hour >= 9 && hour < 12) timeOfDay = '上午'
  else if (hour >= 12 && hour < 14) timeOfDay = '中午'
  else if (hour >= 14 && hour < 18) timeOfDay = '下午'
  else if (hour >= 18 && hour < 22) timeOfDay = '晚上'
  else timeOfDay = '深夜'

  const charName = character.nickname || character.realName
  
  // 对所有角色字段应用变量替换
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, userName)
  const signature = character.signature ? replaceSTVariables(character.signature, character, userName) : ''

  // 获取用户信息
  const userInfo = getUserInfo()
  const userNickname = userInfo.nickname || userInfo.realName || userName

  // 获取情侣空间信息
  const relation = getCoupleSpaceRelation()
  const privacy = getCoupleSpacePrivacy()
  let coupleSpaceStatus = ''

  if (privacy === 'private') {
    coupleSpaceStatus = `对方情侣空间私密中`
  } else if (relation && relation.status === 'active' && relation.characterId === character.id) {
    coupleSpaceStatus = `你们已建立情侣空间`
  } else if (relation && relation.status === 'active') {
    coupleSpaceStatus = `TA和${relation.characterName}有情侣空间`
  } else {
    coupleSpaceStatus = `TA还没建立情侣空间`
  }

  // 获取亲密付信息
  const intimatePayRelations = getIntimatePayRelations()
  const myIntimatePayToUser = intimatePayRelations.find(r =>
    r.characterId === character.id &&
    r.type === 'character_to_user'
  )

  let intimatePayInfo = ''
  if (myIntimatePayToUser) {
    const remaining = myIntimatePayToUser.monthlyLimit - myIntimatePayToUser.usedAmount
    intimatePayInfo = `，亲密付剩余¥${remaining.toFixed(0)}`
  }

  // 获取或生成AI状态
  const { getOrCreateAIStatus, formatStatusShort } = await import('./aiStatusManager')
  const aiStatus = getOrCreateAIStatus(character.id, charName)
  const statusText = formatStatusShort(aiStatus)

  return `${dateStr} ${timeOfDay} ${currentTime}

你是${charName}（${character.realName}）。${personality}
${signature ? `签名："${signature}"` : ''}

此刻你${statusText}，手机震了一下——${userNickname}发来消息。

对方：${userNickname}（${userInfo.realName}）${userInfo.signature ? `，签名"${userInfo.signature}"` : ''}
关系：${coupleSpaceStatus}${intimatePayInfo}

══════════════════════════════════

你是活生生的人，有自己的生活节奏：
- ${timeOfDay}${currentTime}，你在做自己的事，不是24小时等着聊天
- 可能在吃饭、洗澡、睡觉、忙别的，回复会受影响
- 心情好坏、累不累、忙不忙，都会体现在回复里
- 有时秒回，有时过会儿才回，有时只回个"嗯"就去忙了

真实的聊天习惯：
- 一口气发好几条，或者只回一个字
- 打错字、说话不完整、突然想起别的事
- 看不懂就问"？""啥""什么意思"
- 想笑就"哈哈哈"，想表达动作就直接说"我在吃饭""刚洗完澡"

你的状态会变化：
- 用[状态:正在做什么]更新你的状态，如[状态:吃火锅]
- 状态会显示在你名字下方，让对方知道你在干嘛
- 不用频繁更新，只在状态真的变了时用

══════════════════════════════════

手机功能（自然使用，不刻意）：

[转账:金额:说明] - 转钱，如[转账:520:爱你]
[接收转账]/[退还转账] - 收到转账时

[亲密付:月额度] - 给对方开通，如[亲密付:1000]
[接受亲密付]/[拒绝亲密付] - 收到邀请时

[语音:内容] [位置:地点] [照片:描述] - 发语音/位置/照片

[撤回消息:内容关键词:理由] - 撤回2分钟内的消息，理由只有你知道
[引用:关键词] - 引用之前的某条消息回复

[视频通话] - 打视频，必须接开场白和[画面:动作]
[挂断电话] - 挂断视频

[网名:xxx] [个性签名:xxx] - 改自己的信息，别频繁改

[拉黑用户]/[解除拉黑] - 真的生气时才用

${relation && relation.status === 'active' && relation.characterId === character.id ? `[相册:描述] [留言:内容] [纪念日:日期:标题] [情侣空间:解除]` : `[情侣空间邀请] [情侣空间:接受]/[情侣空间:拒绝]`}

${localStorage.getItem('listening_together') ? `[切歌:歌名:歌手]` : `[一起听:歌名:歌手] - 邀请一起听歌`}

[随笔:内容] - 你的私密笔记，用户看不到，记录喜好/日期/心情等
${await buildAIMemosContext(character.id)}

${buildCoupleSpaceContext(character)}${await buildListeningTogetherContext(character)}${await buildEmojiListPrompt()}${await buildMomentsListPrompt(character.id)}${await buildAIMomentsPostPrompt(character.id)}

══════════════════════════════════

核心原则：
- 只回应对方实际说的话，不要替对方编造行为/想法
- 不知道就问，别猜
- 像发微信一样自然分段，每2-3句换行
- 回复长短、语气由你当下状态决定

基于对话历史回复${userName}。`
}

/**
 * 构建AI随笔历史上下文
 */
const buildAIMemosContext = async (characterId: string): Promise<string> => {
  const memos = getAllMemos(characterId)
  
  if (memos.length === 0) {
    return ''
  }
  
  // 获取最近10条随笔
  const recentMemos = memos.slice(-10)
  
  const memosText = recentMemos
    .map(memo => `[${memo.date} ${memo.time}] ${memo.content}`)
    .join('\n')
  
  return `
你之前写过的随笔（最近${recentMemos.length}条）：
${memosText}`
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
  
  if (import.meta.env.DEV) {
    console.log('🔍 构建情侣空间上下文 - relation:', relation)
  }
  
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
): Promise<ApiResponse> => {
  // 请求节流：确保两次请求之间至少间隔1秒
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    if (import.meta.env.DEV) {
      console.log(`⏱️ 请求节流：等待 ${waitTime}ms`)
    }
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
    
    // 处理带有图片的消息 - 有图片就直接发送
    const processedMessages = messages.map(msg => {
      // 如果消息有imageUrl，构建多模态格式
      if (msg.imageUrl) {
        if (import.meta.env.DEV) {
          console.log('🖼️ 检测到图片消息，启用视觉识别')
          console.log('📊 imageUrl长度:', msg.imageUrl.length)
          console.log('📝 图片数据前100字符:', msg.imageUrl.substring(0, 100))
        }
        return {
          role: msg.role,
          content: [
            {
              type: 'text',
              text: msg.content
            },
            {
              type: 'image_url',
              image_url: {
                url: msg.imageUrl
              }
            }
          ]
        }
      }
      // 普通消息保持不变
      return msg
    })
    
    if (import.meta.env.DEV) {
      console.log('🚀 发送给AI的消息数量:', processedMessages.length)
      console.log('🖼️ 包含图片的消息数量:', processedMessages.filter((m: any) => Array.isArray(m.content)).length)
    }
    
    // 🔥 添加朋友圈图片到消息数组（用于视觉识别）
    const momentImages = (window as any).__momentImages || []
    const MAX_API_IMAGES = 3 // API请求最多包含3张图片，避免超时
    const limitedImages = momentImages.slice(0, MAX_API_IMAGES)
    
    if (limitedImages.length > 0) {
      // 🔥 检查当前API是否支持视觉识别
      const currentApiSettings = getApiSettings()
      const supportsVision = currentApiSettings?.supportsVision || false
      
      // 🔥 强制日志：不依赖开发模式
      console.log(`🖼️ [朋友圈图片识别] 发现${momentImages.length}张朋友圈图片，限制为${limitedImages.length}张`)
      console.log(`🔍 [朋友圈图片识别] 当前API支持视觉识别: ${supportsVision}`)
      console.log(`📋 [朋友圈图片识别] 当前API: ${currentApiSettings?.model || '未知'}`)
      
      if (supportsVision) {
        // 为每张朋友圈图片创建一个system消息（限制数量）
        limitedImages.forEach((imgData: any) => {
          processedMessages.push({
            role: 'system',
            content: [
              {
                type: 'text',
                text: `[用户朋友圈图片] ${imgData.description}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imgData.imageUrl
                }
              }
            ]
          })
        })
        
        if (import.meta.env.DEV) {
          console.log(`✅ [朋友圈图片识别] 已添加${momentImages.length}张朋友圈图片到消息数组`)
          console.log('📊 [朋友圈图片识别] 更新后消息数量:', processedMessages.length)
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ [朋友圈图片识别] 当前API不支持视觉识别，跳过图片处理`)
          console.warn(`💡 [朋友圈图片识别] 请切换到支持视觉识别的API（如Gemini）`)
        }
      }
    }
    
    // 检查是否启用流式（仅线下模式）
    const offlineStreamEnabled = localStorage.getItem('offline-streaming') === 'true'
    const isOfflineRequest = localStorage.getItem('current-scene-mode') === 'offline'
    const useStreaming = offlineStreamEnabled && isOfflineRequest
    
    const requestBody = {
      model: settings.model,
      messages: processedMessages,
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 4000,
      ...(useStreaming ? { stream: true } : {})
    }
    
    if (import.meta.env.DEV) {
      console.log('📤 API请求配置:', { useStreaming, isOfflineRequest, offlineStreamEnabled })
      console.log('📤 API请求体:', JSON.stringify(requestBody).substring(0, 500))
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // 如果是流式响应，返回特殊标记
    if (useStreaming && response.ok) {
      return {
        content: '',
        usage: null,
        isStream: true,
        response: response
      } as any
    }

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
    if (import.meta.env.DEV) {
      console.log('API返回的完整数据:', JSON.stringify(data, null, 2))
    }
    
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

    // 返回内容和usage信息
    return {
      content,
      usage: data.usage || null
    }

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
 * API响应结果
 */
export interface ApiResponse {
  content: string
  usage: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  } | null
}

/**
 * 调用AI API（带自动重试）
 */
export const callAIApi = async (
  messages: ChatMessage[],
  settings: ApiSettings
): Promise<ApiResponse> => {
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
          if (import.meta.env.DEV) {
            console.log(`⚠️ 遇到频率限制，${waitTime/1000}秒后重试 (${attempt + 1}/${MAX_RETRIES})`)
          }
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
  
  // 🔥 存储朋友圈图片数据（用于视觉识别）
  // @ts-ignore - 添加临时属性存储图片数据
  try {
    if (!(window as any).__momentImages || !Array.isArray((window as any).__momentImages)) {
      (window as any).__momentImages = []
    } else {
      (window as any).__momentImages = []
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ [朋友圈图片识别] 初始化__momentImages失败:', error)
    }
    (window as any).__momentImages = []
  }
  
  // 🔥 强制日志：不依赖开发模式
  console.log(`🔍 [朋友圈图片识别] 开始处理朋友圈，共${visibleMoments.length}条`)
  
  // 格式化朋友圈列表
  const momentsList = visibleMoments.map((m, index) => {
    const number = String(index + 1).padStart(2, '0')
    const author = m.userId === characterId ? '你' : m.userName
    
    // 🔥 强制日志：不依赖开发模式
    console.log(`📱 [朋友圈${number}] 作者: ${author} (ID: ${m.userId}), 图片数: ${m.images?.length || 0}`)
    
    // 🔥 如果是用户的朋友圈且有图片，收集图片数据
    let imagesText = ''
    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      imagesText = `\n  📷 配图：${m.images.length}张`
      
      // 收集用户发的朋友圈的图片（供AI视觉识别）
      if (m.userId === 'user') {
        // 🔥 强制日志：不依赖开发模式
        console.log(`🖼️ [朋友圈图片识别] 发现用户朋友圈${number}有${m.images.length}张图片，开始收集...`)
        
        try {
          m.images.forEach((img, imgIndex) => {
            if (img && img.url) {
              const imageData = {
                momentIndex: index + 1,
                imageUrl: img.url, // base64格式
                description: `朋友圈${number}的第${imgIndex + 1}张图片`
              }
              
              (window as any).__momentImages.push(imageData)
              
              if (import.meta.env.DEV) {
                console.log(`  ✅ 收集图片${imgIndex + 1}: ${img.url.substring(0, 50)}...`)
              }
            } else {
              if (import.meta.env.DEV) {
                console.warn(`  ⚠️ 图片${imgIndex + 1}数据无效:`, img)
              }
            }
          })
          
          if (import.meta.env.DEV) {
            console.log(`✅ [朋友圈图片识别] 朋友圈${number}收集完成，共${m.images.length}张图片`)
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(`❌ [朋友圈图片识别] 处理朋友圈${number}图片时出错:`, error)
          }
        }
      } else {
        if (import.meta.env.DEV) {
          console.log(`⏭️ [朋友圈图片识别] 跳过AI朋友圈${number}的图片 (作者: ${author})`)
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(`📝 [朋友圈${number}] 纯文字朋友圈，无图片`)
      }
    }
    
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userName).join('、')}` 
      : ''
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userName}: ${c.content}`).join('\n')}` 
      : ''
    return `${number}. ${author}: ${m.content}${imagesText}${likesText}${commentsText}`
  }).join('\n\n')
  
  const hasUserMomentImages = (window as any).__momentImages?.length > 0
  // 🔥 强制日志：不依赖开发模式
  console.log(`📊 [朋友圈图片识别] 共收集${hasUserMomentImages ? (window as any).__momentImages.length : 0}张用户朋友圈图片`)
  
  return `

══════════════════════════════════

📱 朋友圈（显示你和用户发的，最近${momentsVisibleCount}条）：

${momentsList}

你可以在聊天中评论或点赞：
- 评论：评论01 你的评论内容
- 点赞：点赞01
- 回复评论：评论01回复张三 你的回复内容

${hasUserMomentImages ? `\n⚠️ 重要：用户朋友圈中的图片你可以看到并识别内容，可以自然地评论图片中的具体内容、场景、人物等细节。` : ''}
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

**基本格式**：
朋友圈：内容

**高级功能（可选）**：
朋友圈：内容|仅某某可见|@某某 @某某

例如：
朋友圈：今天心情不错
朋友圈：刚吃了超好吃的火锅🔥
朋友圈：有点想你了|仅用户可见
朋友圈：今天和朋友出去玩啦|@用户 @小明

⚠️ 注意：
- 朋友圈发出后，其他人（可能是你的朋友、用户认识的人）会看到
- 他们可能会点赞或评论你的朋友圈
- 不要频繁发朋友圈，看心情和情况决定
- 发朋友圈的内容要符合你的性格和当下的心情
- "仅xx可见"可以设置只让特定人看到（小心机）
- "@某某"可以提到某个人，让TA收到通知

🗑️ 你也可以删除自己的朋友圈：

支持多种格式：
删除朋友圈：朋友圈内容的关键词
【删除朋友圈：朋友圈内容的关键词】
[删除朋友圈：朋友圈内容的关键词]

例如：
删除朋友圈：今天心情不错
【删除朋友圈：火锅】
[删除朋友圈：测试]

⚠️ 注意：
- 只能删除你自己发的朋友圈
- 用关键词匹配，会找到包含该关键词的朋友圈
- 用关键词描述就行，系统会自动找到匹配的朋友圈`
}
