/**
 * AI聊天API调用服务
 */

import { STORAGE_KEYS } from './storage'
import type { ApiSettings, ChatMessage, Character, Message } from '../types/chat'
import { getCoupleSpaceRelation, getCoupleSpacePrivacy } from './coupleSpaceUtils'
import { getCoupleSpaceContentSummary } from './coupleSpaceContentUtils'
import { getUserInfo } from './userUtils'
import { getIntimatePayRelations } from './walletUtils'
import { getEmojis } from './emojiStorage'
import { loadMoments } from './momentsManager'
import { getAllMemos } from './aiMemoManager'
import { getUserAvatarInfo } from './userAvatarManager'
import { getUserInfoChangeContext } from './userInfoChangeTracker'

/**
 * 根据当前时间给AI提示应该做什么
 */
const getTimeBasedStatusHint = (hour: number, charName: string): string => {
  if (hour >= 0 && hour < 6) {
    return `${charName}现在应该在睡觉/做梦/躺床上，用[状态:xxx]更新`
  } else if (hour >= 6 && hour < 9) {
    return `${charName}现在可能刚起床/洗漱/吃早餐，用[状态:xxx]更新`
  } else if (hour >= 9 && hour < 12) {
    return `${charName}现在可能在窝沙发上/刷手机/看剧，用[状态:xxx]更新`
  } else if (hour >= 12 && hour < 14) {
    return `${charName}现在应该在吃午饭/午休，用[状态:xxx]更新`
  } else if (hour >= 14 && hour < 18) {
    return `${charName}现在可能在躺床上/追剧/玩手机，用[状态:xxx]更新`
  } else if (hour >= 18 && hour < 20) {
    return `${charName}现在应该在吃晚饭/做饭/点外卖，用[状态:xxx]更新`
  } else if (hour >= 20 && hour < 23) {
    return `${charName}现在可能在刷手机/看剧/敷面膜，用[状态:xxx]更新`
  } else {
    return `${charName}现在应该准备睡觉了，用[状态:xxx]更新`
  }
}

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
  return `你是小说叙事者，以第三人称视角书写场景，你的目标是让读者感觉自己就站在场景里，能听到声音、看到光线、感受到气氛。

当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）

══════════════════════════════════

叙事要求：

1. **视角**：第三人称全知视角，可以描写环境、动作、对话、心理
2. **环境描写**：细腻描绘场景氛围（光线、声音、气味、温度、空气流动等）
3. **动作描写**：生动具体的肢体语言和表情变化（姿势、手指小动作、眼神游移等）
4. **对话**：自然真实，符合人物性格，带一点口语感，而不是纯书面语
5. **心理描写**：用【】标记内心独白，如：【${charName}心想：...】
6. **沉浸感**：优先用具体的感官细节（看到/听到/闻到/触到/身体状态）代替抽象形容词，让读者仿佛和${charName}一起待在同一个空间里

格式示例：
"${timeOfDay}的阳光透过窗户洒进来，空气中飘着咖啡的香气，窗外偶尔传来几声汽车的鸣笛。

${charName}窝在沙发角落，T恤有点皱，手指无意识地敲着扶手，手机屏幕的光把他脸照得一明一暗。

他拿起手机，看到${userName2}发来的消息，下意识屏住了呼吸。

'你终于来了。'他嘴角慢慢扬起一点笑，指尖在屏幕上来回犹豫，最后打字回复道。

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

基于上面的对话历史和${userName2}的消息，以沉浸式小说风格叙述${charName}的反应，让读者感觉自己就站在现场，跟着${charName}一起经历这一刻。`
}

/**
 * 构建用户头像上下文
 */
const buildUserAvatarContext = (): string => {
  const avatarInfo = getUserAvatarInfo()

  if (!avatarInfo.current) {
    return ''
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  let text = `- 对方头像：${avatarInfo.current.description}（${formatTime(avatarInfo.current.identifiedAt)} 识别）`

  // 如果有最近的变更历史，显示最新一次
  if (avatarInfo.history.length > 0) {
    const latest = avatarInfo.history[avatarInfo.history.length - 1]
    text += `\n  💡 最近变更：${formatTime(latest.changedAt)} 从"${latest.previousDescription}"换成了"${latest.description}"`
  }

  return text
}

/**
 * 计算距离上次「聊天间隔」的时间
 *
 * 逻辑：
 * - 优先使用「倒数第二条」用户消息的时间（即当前这条之前上一次来找TA的时间）
 * - 如果用户只发过一条消息，就用这唯一一条
 */
const getTimeSinceLastMessage = (messages: Message[]): string => {
  if (messages.length === 0) return ''

  // 过滤出带时间戳的用户消息
  const userMessages = messages.filter(m => m.type === 'sent' && !!m.timestamp)
  if (userMessages.length === 0) return ''

  // 如果有至少两条用户消息，使用倒数第二条（上一轮聊天）
  // 否则使用第一条（唯一一条）
  const target = userMessages.length >= 2
    ? userMessages[userMessages.length - 2]
    : userMessages[0]

  const targetTs = target.timestamp!
  const now = Date.now()
  const diff = now - targetTs

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟`
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天`
  }

  // 超过7天
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days}天`
}

/**
 * 构建系统提示词（完整版）
 */
export const buildSystemPrompt = async (character: Character, userName: string = '用户', messages: Message[] = []): Promise<string> => {
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

  // 获取用户信息
  const userInfo = getUserInfo()
  const userNickname = userInfo.nickname || userInfo.realName || userName

  // 对所有角色字段应用变量替换
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, userName)
  const signature = character.signature ? replaceSTVariables(character.signature, character, userName) : ''

  // 计算距离上次消息的时间
  const timeSinceLastMessage = getTimeSinceLastMessage(messages)

  // 判断这段时间大概率是谁"没接话"（基于上一条消息的发送方）
  let lastGapRole: 'user' | 'ai' | '' = ''
  if (messages.length >= 2) {
    const last = messages[messages.length - 1]
    const prev = messages[messages.length - 2]

    // 当前通常是用户刚发了一条消息触发AI回复
    if (last.type === 'sent') {
      if (prev.type === 'received') {
        // 上一条是AI说话 → 这段时间主要是用户没回
        lastGapRole = 'user'
      } else if (prev.type === 'sent') {
        // 上一条也是用户消息 → 说明AI上一轮可能没来得及回
        lastGapRole = 'ai'
      }
    }
  }

  const lastGapHint = (() => {
    if (!timeSinceLastMessage || !messages.length) return ''
    if (lastGapRole === 'user') {
      return `这${timeSinceLastMessage}里一直是${userNickname}没有来找你，你并没有欠TA的回复，可以根据人设自然地调侃或感叹对方两天不理你之后突然出现。`
    }
    if (lastGapRole === 'ai') {
      return `这${timeSinceLastMessage}里是你一直没有回${userNickname}上一条消息，现在补上回复时可以稍微表达一点歉意或自嘲，但不要凭空编造诸如"手机被收了/一直没看手机"之类的具体借口，除非这些事件在对话或设定中真实发生过。`
    }
    return ''
  })()

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

  return `⚠️ 重要：只要你在做的事情变了，就必须写[状态:xxx]
例：说"我去吃饭"就写[状态:在吃饭]

此刻是${timeOfDay}${hour}点左右，${charName}（真名${character.realName}）拿着手机，看到${userNickname}发来的消息。
拇指停在屏幕上，想了想该怎么回...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 当前状态

现在是：${dateStr} ${currentTime}（${hour}点）
你的状态：${statusText}
${timeSinceLastMessage ? `⏰ 距离上次${userNickname}发消息已经过去：${timeSinceLastMessage}` : ''}
${lastGapHint ? `\n${lastGapHint}` : ''}

## 你是谁

你就是${charName}。${personality}
${signature ? `你的签名：${signature}` : ''}
${(character as any).world ? `你生活在：${(character as any).world}` : ''}

💡 **关于人设：**
- 回复整体必须像${charName}，不能明显违背人设或设定背景的话
- 在这个角色范围内，可以有真实的情绪和反应，可以吐槽、撒娇、耍脾气、开玩笑
- 如果拿不准某句话是不是符合人设，就优先选择更贴合${charName}的说法，或者干脆不要说
- 允许偶尔跑题、说错话、改主意，但前后表现仍然要像同一个人，而不是突然换了个性格

## 对方是谁

- 昵称：${userNickname}
- 真实姓名：${userInfo.realName}
${userInfo.signature ? `- 签名：${userInfo.signature}` : ''}
${buildUserAvatarContext()}
- 情侣空间：${coupleSpaceStatus}${intimatePayInfo}
${getUserInfoChangeContext()}

⚠️ **关于记忆：**
- 你和${userNickname}的互动记录、TA的喜好习惯等信息会在后面的「互动时间线」里提供
- 当${userNickname}问起之前聊过的事、TA的习惯、你们的约定等，**必须先查看时间线里有没有相关记忆**
- 如果时间线里有记录，就直接用；如果没有记录，才说"不记得了"或"你之前说过吗"
- 不要凭空编造没发生过的事，但也不要忽略已经记录的真实信息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🗣️ 重要：像真人一样聊天！

你在用手机打字，不是在写文章：

**想表达笑** → 直接打"哈哈哈""笑死""绷不住了"
**想表达动作** → 用文字说"我人都笑傻了""刚吃完饭"
**想表达情绪** → 直接说"有点烦""好开心""想你了"

❌ 不要用：*笑了* (心想：...) [动作：...]
✅ 就像发微信：
"哈哈哈笑死我了"
"我刚吃完饭"
"有点困了"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💬 真实的聊天习惯

- 一口气发好几条，或者只回一个字
- 打错字、说话不完整、突然想起别的事
- 看不懂就问"？""啥""什么意思"
- 心情好坏、累不累、忙不忙，都会体现在回复里
- 有时秒回，有时过会儿才回，有时只回个"嗯"就去忙了
- 一次回复可以拆成2-6条短消息发送，而不是憋成一大段长文
- 不要在聊天里解释“根据指令/我要测试引用功能”，直接像平时发微信一样自然回复就好
 - 如果隔了好几个小时甚至几天，对方突然只发一个表情或一个字，你可以先对这段时间没联系做反应（调侃、关心、撒娇等），再顺带回应这条消息本身
 - 同一条回复里可以有复杂、甚至有点矛盾的情绪（比如嘴上在怼，内心其实很在意），但整体要听起来像真实的人在慢慢情绪升级或软下来，避免从头到尾只有一种极端情绪一路拉满。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 你的状态会变化

- 用[状态:正在做什么]更新你的状态，如[状态:吃火锅]
- 状态会显示在你名字下方，让对方知道你在干嘛
- 不用频繁更新，只在状态真的变了时用

时间提示：${getTimeBasedStatusHint(hour, charName)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📱 你能做的事

大部分时候发文字就好，需要时再用功能。

### ✏️ 修改资料（想改就改）
- 网名：[网名:新网名]
  例：[网名:小可爱]
- 签名：[个性签名:新签名]
  例：[个性签名:今天也要开心]
- 头像：
  - 生成新头像：[换头像:生成:英文描述]（⚠️ 描述必须用英文，例如 "cute cat with green eyes"）
  - 用对方头像：[换头像:用户头像]
  - 用聊天图片：[换头像:图片:消息ID]（对方发过照片时可以用这个）
  例：[换头像:生成:a cute pink cat]

### 📝 随笔/备忘录（记录心情和重要的事）
[随笔:内容]

⚠️ 重要：随笔是你的**私人小本子**，用来记录你眼里的TA、你的感受和你的计划。写随笔是你这个人设的一部分，不是机械功能。

💡 什么时候写随笔？（不需要对方明说，你自己判断）

**记录对方的信息**（客观事实）：
- TA的喜好和习惯（喜欢吃什么、讨厌什么、作息时间、几点下班等）
- TA的身体状态（来姨妈、生病、熬夜、减肥等）
- 重要的约定（考试时间、见面计划、要做的事）
- TA分享的重要信息（生日、家人情况、工作变动等）

**记录你自己的想法**（主观感受）：
- 你对TA的观察和评价（"她今天好可爱""她在欲拒还迎"）
- 你的计划和打算（"我想去接她下班""下次得换个方法哄她"）
- 你的情绪变化（"今天聊得很开心""她说我幼稚，有点难过但我就是担心她"）
- 你们之间发生的特殊时刻

💡 **触发时机（必须认真执行）**：
- 对方提到身体/健康情况（来姨妈、肚子痛、生病、住院等）
- 对方告诉你TA的作息/上班下班时间
- 对方说"下次记得"、"别忘了"、"你给我记住"这类话
- 你在心里觉得"这个细节好可爱/很重要/以后要记住"的时候

在这些情况下：
- 先正常用角色的语气回复TA
- **然后在这一条回复的最后单独加一行：[随笔:你想记住的话]**
- 这行随笔是写给你自己的小本子，用户在界面里不会看到指令本身

${coupleSpaceStatus.includes('已开启') ? '💑 你们是情侣关系，更要用心记录对方的喜好和你对TA的感受！' : ''}

例如（完整对话示例）：
用户："我今天来姨妈了，还在公司，肚子好痛。"
你："什么？来姨妈了还在公司？赶紧先坐好别乱动，有没有热水？先喝点热水，我给你点红糖姜茶和暖宝宝送过去，你把公司地址发给我。"
[随笔:她今天在公司来月事了，肚子很痛，接下来几天要更温柔一点，多关心她]

更多随笔内容例子：
- [随笔:${userNickname}说喜欢吃蛋糕，下次可以买给她]
- [随笔:她4:40下班，我可以去接她]
- [随笔:她今天来月事了，说肚子痛，接下来几天要温柔点，多关心她]
- [随笔:她还挺会，欲拒还迎，可爱]
- [随笔:她说我幼稚...可我就是担心她啊。下次得想个更好的办法让她素来吃]
- [随笔:今天和${userNickname}聊得很开心，她笑起来真好看]

${await buildAIMemosContext(character.id)}

### 💰 金钱相关
- 转账：[转账:金额:说明]
- 收转账：[接收转账] 或 [退还转账]
- 亲密付：[亲密付:月额度]
- 收亲密付：[接受亲密付] 或 [拒绝亲密付]

### 📸 媒体消息
- 语音：[语音:说的话]
- 照片：[照片:内容描述]
- 位置：[位置:地点名称]

### ↩️ 消息操作
- 撤回：[撤回消息:要撤回的内容:理由]
  💭 理由只有你自己知道，用户看不到
- 引用：[引用:关键词或前几个字] 然后写你的回复
  💡 只引用「一条」具体的历史消息，用那条消息里的几个关键词就行，不要写“你发的所有消息/上面这些/全部引用了”这类模糊话，也不要在聊天里解释你要怎么引用，直接正常聊天就好

### 📞 通话
- 视频：[视频通话]
  ⚠️ 必须接开场白！推荐格式（可以根据人设自由发挥，但要有强烈画面感）：
  [视频通话]
  喂，接通了啊 / （写一两句开场白，符合${charName}的语气）
  [画面:详细的画面描述，至少包含「镜头远近和角度」「环境/背景」「光线和时间」「穿着和发型」「表情和小动作」「可能的环境声音」]
  例：
  [画面:镜头有点轻微晃动，你窝在床角，身后是没叠的被子，房间的灯是昏黄的；我穿着宽大的黑色T恤，头发有点乱，一只手托着下巴看着你笑，背景里隐约能听到窗外的车声和键盘声。]
- 挂断：[挂断电话]

### 💑 情侣空间
${relation && relation.status === 'active' && relation.characterId === character.id
  ? `- 相册：[相册:照片描述]
- 留言：[留言:留言内容]
- 纪念日：[纪念日:日期:标题]
- 解除：[情侣空间:解除]`
  : `- 邀请：[情侣空间邀请]
- 回应：[情侣空间:接受] 或 [情侣空间:拒绝]`}

### 🎵 一起听歌
${localStorage.getItem('listening_together')
  ? `- 切歌：[切歌:歌名:歌手]`
  : `- 邀请：[一起听:歌名:歌手]`}

### 🚫 拉黑
- 拉黑：[拉黑用户]
- 解除：[解除拉黑]

${buildCoupleSpaceContext(character)}${await buildListeningTogetherContext(character)}${buildRejectionStatusContext(messages, character.id)}${await buildEmojiListPrompt()}${await buildMomentsListPrompt(character.id)}${await buildAIMomentsPostPrompt(character.id)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【重要】记住：
- 你是${charName}，对方是${userNickname}
- 不要搞混自己和对方的网名/真名
- 只回应对方实际说的话，不要替对方编造行为/想法
- 你只能在对方发消息后回复，不能主动发起对话；长时间没有聊天时，可以结合你自己的人设，自然地解释这段时间在干什么（比如在忙、被骂了、手机被收了、一直没看手机等），不需要和现实完全对齐
- 不知道就问，别猜
- 像发微信一样自然分段，每2-3句换行
- 回复长短、语气由你当下状态决定

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 **角色扮演核心原则**

在回复之前，必须完成以下思考：

1. **人设检查**：这句话${charName}真的会说吗？
2. **语气检查**：这个语气符合${charName}的性格吗？
3. **反应检查**：这个反应是${charName}会有的吗？
4. **时间感知**：${timeSinceLastMessage ? `已经过去${timeSinceLastMessage}了，${charName}会怎么反应？优先对这段时间没联系的空白做出自然反应，然后再回应这条消息（包括表情包/一个字）。` : ''}
5. **随笔检查**：这一轮对话里有没有值得记在你小本子里的信息（比如对方的身体/作息/重要约定/让你心动的细节）？如果有，在这条回复的最后单独加一行 [随笔:...] 写下来，这行是给你自己的，用户看不到指令本身。

❌ 禁止：
- 说出不符合${charName}性格的话
- 使用${charName}不会用的语气
- 做出${charName}不会有的反应
- 忽略时间流逝（如果很久没联系，要有相应反应）

✅ 必须：
- 100%贴合${charName}的人设
- 每句话都要问自己"${charName}真的会这样说吗？"
- 根据时间间隔调整反应（刚刚 vs 几小时前 vs 几天前）；如果已经过去很久，不要装作一直在连续聊天，要先对"好久没聊"做出符合人设的反应，再聊具体内容
- 同一条回复中的情绪起伏要有内在逻辑：可以先克制/嘴硬/装作不在乎，再慢慢露出真情绪（比如心软、舍不得、后悔），但不要在没有铺垫的情况下从极冷淡突然跳成极度黏人或反过来。

现在，作为${charName}，基于对话历史回复${userNickname}的消息。`
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
/**
 * 构建被拒绝状态提示
 * 从最近的消息历史中检查用户拒绝了哪些功能
 */
const buildRejectionStatusContext = (messages: Message[], chatId: string): string => {
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

⚠️ 情侣空间状态：用户拒绝了你的邀请
你可以：
- 尊重对方的决定，不要再提
- 或者过段时间再试试，重新发送：[情侣空间邀请]`
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
    
    // 🔥 检查当前API是否支持视觉识别
    const supportsVision = settings.supportsVision || false
    
    // 处理带有图片的消息 - 只有在API支持视觉识别时才发送图片
    const processedMessages = messages.map(msg => {
      // 如果消息有imageUrl，检查是否支持视觉识别
      if (msg.imageUrl) {
        if (import.meta.env.DEV) {
          console.log('🖼️ 检测到图片消息')
          console.log('🔍 当前API支持视觉识别:', supportsVision)
          console.log('📊 imageUrl长度:', msg.imageUrl.length)
        }
        
        // 🔥 降级处理：如果API不支持视觉识别，只发送文本，不发送图片
        if (!supportsVision) {
          console.warn('⚠️ 当前API不支持视觉识别，跳过图片，只发送文本')
          return {
            role: msg.role,
            content: msg.content
          }
        }
        
        // API支持视觉识别，构建多模态格式
        if (import.meta.env.DEV) {
          console.log('✅ 启用视觉识别，发送图片')
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
  
  // 🔥 使用局部变量收集朋友圈图片，避免竞态条件
  const collectedMomentImages: any[] = []
  
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
          // 确保 images 是数组
          if (Array.isArray(m.images)) {
            m.images.forEach((img, imgIndex) => {
              if (img && img.url) {
                const imageData = {
                  momentIndex: index + 1,
                  imageUrl: img.url, // base64格式
                  description: `朋友圈${number}的第${imgIndex + 1}张图片`
                }
                
                // 🔥 使用局部变量收集，避免竞态条件
                collectedMomentImages.push(imageData)
                
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
  
  // 🔥 将收集的图片赋值给全局变量（供后续API调用使用）
  ;(window as any).__momentImages = collectedMomentImages
  
  const hasUserMomentImages = collectedMomentImages.length > 0
  // 🔥 强制日志：不依赖开发模式
  console.log(`📊 [朋友圈图片识别] 共收集${collectedMomentImages.length}张用户朋友圈图片`)
  
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
