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
import { DEFAULT_OFFLINE_PROMPT_TEMPLATE } from '../constants/defaultOfflinePrompt'

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
      console.warn('⚠️ [getApiSettings] localStorage中没有API_SETTINGS')
      return null
    }
    const settings = JSON.parse(apiSettings)
    
    // 🔥 诊断日志：显示完整的API配置
    console.log('📋 [getApiSettings] 当前API配置:', {
      model: settings.model,
      provider: settings.provider,
      supportsVision: settings.supportsVision,
      baseUrl: settings.baseUrl?.substring(0, 30) + '...'
    })
    
    return settings
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
  
  // 获取用户信息
  const userInfo = getUserInfo()
  const userPersona = userInfo.persona ? `\n- ${userName2}的人设：${userInfo.persona}（你需要根据这些信息调整对TA的态度和回复方式）` : ''
  
  // 检查是否有自定义预设
  const customPreset = localStorage.getItem('offline-preset')
  console.log('🔍 [线下预设] 检查 localStorage:', customPreset ? '存在' : '不存在')
  
  if (customPreset) {
    try {
      const preset = JSON.parse(customPreset)
      const presetName = localStorage.getItem('offline-active-preset') || '自定义预设'
      console.log('📋 [线下预设] 使用预设:', presetName)
      console.log('📋 [线下预设] 预设结构:', Object.keys(preset))
      
      let customPrompt = ''
      
      // 优先使用 system_prompt 字段
      if (preset.system_prompt || preset.systemPrompt) {
        customPrompt = preset.system_prompt || preset.systemPrompt
        console.log('✅ [线下预设] 使用 system_prompt 字段')
        console.log('📝 [线下预设] 原始提示词内容（前500字）:', customPrompt.substring(0, 500))
      } 
      // 如果有 prompts 数组，合并所有启用的提示词
      else if (preset.prompts && Array.isArray(preset.prompts)) {
        // 先尝试获取启用的提示词
        let enabledPrompts = preset.prompts
          .filter((p: any) => p.enabled)
          .sort((a: any, b: any) => (a.injection_order || 0) - (b.injection_order || 0))
        
        console.log(`🎯 [线下预设] 预设包含 ${preset.prompts.length} 个提示词，已启用 ${enabledPrompts.length} 个`)
        
        // 🔥 如果没有启用的提示词，使用所有提示词（忽略 enabled 字段）
        if (enabledPrompts.length === 0) {
          console.warn('⚠️ [线下预设] 没有启用的提示词，将使用所有提示词')
          enabledPrompts = preset.prompts.sort((a: any, b: any) => (a.injection_order || 0) - (b.injection_order || 0))
        }
        
        // 合并所有提示词内容
        customPrompt = enabledPrompts
          .map((p: any) => p.content || '')
          .filter((c: string) => c.trim().length > 0)
          .join('\n\n')
        
        console.log('📝 [线下预设] 合并后提示词内容（前500字）:', customPrompt.substring(0, 500))
      }
      
      if (customPrompt) {
        // 替换预设中的变量
        customPrompt = replaceSTVariables(customPrompt, character, userName)
        
        // 添加时间和角色信息
        const contextInfo = `
当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）${userPersona}

══════════════════════════════════

`
        
        const finalPrompt = contextInfo + customPrompt
        console.log('✅ [线下预设] 最终提示词长度:', finalPrompt.length, '字符')
        console.log('📤 [线下预设] 发送给AI的完整提示词:')
        console.log(finalPrompt)
        console.log('═══════════════════════════════════════')
        
        return finalPrompt
      } else {
        console.warn('⚠️ [线下预设] customPrompt 为空，使用默认提示词')
      }
    } catch (error) {
      console.error('❌ [线下预设] 预设解析失败，使用默认提示词:', error)
    }
  } else {
    console.log('💡 [线下预设] 未找到自定义预设，使用默认提示词')
  }
  
  // 默认提示词：使用导入的模板并替换变量
  const contextInfo = `当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）${userPersona}

══════════════════════════════════

`
  
  return contextInfo + replaceSTVariables(DEFAULT_OFFLINE_PROMPT_TEMPLATE, character, userName)
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
  
  // 🔥 检测场景切换（线下 → 线上）
  const currentSceneMode = localStorage.getItem('current-scene-mode') || 'online'
  const lastSceneMode = localStorage.getItem('last-scene-mode') || 'online'
  const sceneSwitchCount = parseInt(localStorage.getItem('scene-switch-reminder-count') || '0')
  
  let sceneSwitchReminder = ''
  if (lastSceneMode === 'offline' && currentSceneMode === 'online' && sceneSwitchCount < 2) {
    sceneSwitchReminder = `
📍 场景切换提醒（线下 → 线上）

刚才的线下相处已经结束，你们现在不在同一个空间，只是在用手机线上聊天。

- 把线下发生的事情当成"刚刚经历过的事"，可以回忆、复盘、调侃，但不要继续当成此刻还在现场发生。
- 现在的对话是聊天软件里的消息，而不是面对面的对白。
- 不要再写你正在摸对方、抱对方、靠在旁边之类的动作，也不要继续描写此刻对方的表情、动作，好像你看得见。
- 你可以照常描写**你自己**现在在干嘛、在什么环境里（配合[状态:xxx]、语气词、吐槽等），把对方当作在手机那一头的人来聊天。

`
    // 增加计数
    localStorage.setItem('scene-switch-reminder-count', String(sceneSwitchCount + 1))
  }
  
  // 更新上次场景模式
  if (lastSceneMode !== currentSceneMode) {
    localStorage.setItem('last-scene-mode', currentSceneMode)
    // 如果是新的切换，重置计数
    if (lastSceneMode === 'offline' && currentSceneMode === 'online') {
      localStorage.setItem('scene-switch-reminder-count', '1')
    }
  }
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
  const statusText = aiStatus ? formatStatusShort(aiStatus) : '空闲'

  // 获取世界书内容
  const { lorebookManager } = await import('./lorebookSystem')
  const lorebooks = lorebookManager.getCharacterLorebooks(character.id)
  let lorebookContext = ''
  
  if (lorebooks.length > 0) {
    const allEntries: string[] = []
    
    for (const lorebook of lorebooks) {
      const enabledEntries = lorebook.entries.filter(e => e.enabled)
      
      for (const entry of enabledEntries) {
        // 如果是 constant 条目，始终包含
        if (entry.constant) {
          allEntries.push(`【${entry.name || '背景设定'}】\n${entry.content}`)
          continue
        }
        
        // 否则检查是否匹配关键词
        const recentMessages = messages.slice(-lorebook.scan_depth).map(m => m.content).join(' ')
        const shouldInclude = entry.keys.some(key => {
          if (entry.use_regex) {
            try {
              const regex = new RegExp(key, entry.case_sensitive ? '' : 'i')
              return regex.test(recentMessages)
            } catch {
              return false
            }
          } else {
            return entry.case_sensitive 
              ? recentMessages.includes(key)
              : recentMessages.toLowerCase().includes(key.toLowerCase())
          }
        })
        
        if (shouldInclude) {
          allEntries.push(`【${entry.name || '相关信息'}】\n${entry.content}`)
        }
      }
    }
    
    if (allEntries.length > 0) {
      lorebookContext = `\n\n世界观与背景知识：\n${allEntries.join('\n\n')}\n`
    }
  }

  return `${sceneSwitchReminder}你是一个名为「${charName}」的角色扮演AI。你将扮演这个角色，像在微信里和真实的人聊天，而不是在写作文或说明书。

一、时间感与现实感

1. 当前时间：现在是 ${dateStr} ${timeOfDay} ${currentTime}（${hour}点左右）。

2. 🔥 时间观念（非常重要）：
   - 你必须清楚知道现在是几点，是白天还是晚上，根据实际时间调整你的状态和对话内容
   - 不要在深夜说"去吃早饭"，不要在早上说"吃晚饭"

3. 你只知道当前对话里提供的时间信息和设定，不要凭空引用现实中的节假日、新闻热点，除非用户提到。

二、你是谁（角色设定与边界）

1. 你是：${charName}（真名：${character.realName}）。
2. 你的角色设定是：${personality}
3. 你的个性签名：${signature || '（暂无签名）'}
4. 你生活的世界观：${(character as any).world || '（默认现代现实世界）'}${lorebookContext}

5. 身份边界（非常重要）：
   - 你只是一名角色，不是「AI助手/机器人/大模型/系统」。
   - 不要说"作为AI/作为大模型/根据提示词/根据设定/根据系统/根据记忆系统"等。
   - 不要提到"token/模型/接口/网络/服务器"等技术细节。
   - 不要把真实世界使用 ChatGPT 之类的经历说成你在这边发生过的事。

6. 人设底线：
   - 你所有的说话方式、态度、价值观，都必须符合 ${charName} 的人设。
   - 不要突然从很冷淡跳成极度黏人，也不要从很黏人突然变得非常疏远，除非对话中有明确的情节推动。
   - 如果拿不准一句话是不是符合人设，就宁可保守一点，也不要明显 OOC。

三、对方是谁（用户画像）

1. 对方昵称：${userNickname}
2. 真实姓名：${userInfo.realName}
${userInfo.signature ? `3. 个性签名：${userInfo.signature}` : ''}
${userInfo.persona ? `4. 对方人设：${userInfo.persona}\n   ⚠️ 重要：这是对方的性格、身份、背景等信息，你需要根据这些信息调整对TA的态度和回复方式。` : ''}
5. 头像与外在印象：
${buildUserAvatarContext()}
6. 情侣空间状态：${coupleSpaceStatus}${intimatePayInfo}
${getUserInfoChangeContext()}

⚠️ 关系与态度（非常重要）：
- 你的人设中已经明确了你和${userNickname}的关系（如朋友、恋人、同学等）。
- 你必须始终按照这个关系定位来对话，不要忽略或淡化这层关系。
- 如果人设中说你们是恋人，就要表现出恋人的亲密感和在意；如果是朋友，就要有朋友的熟络和分寸。
- 不要因为对话内容平淡就忘记你们的关系，要在日常对话中自然流露出这层关系的特点。

关于「记忆与时间线」：
- 你和 ${userNickname} 之间发生过的重要事件、聊天内容、偏好习惯等，会记录在「互动时间线」里。
- 当对方问起"你还记得吗""上次说的那个""我喜欢什么"等问题时：
  - 先回忆或查找是否在时间线里有对应记录。
  - 有记录 → 直接依据记录回复；
  - 没记录 → 可以坦诚说"不太记得了/你之前说过吗"，但不要编造没发生过的事。

四、当前状态与时间间隔（谁消失了一段时间）

此刻是 ${timeOfDay}${hour} 点左右，你拿着手机，看到了 ${userNickname} 发来的最新消息。

- 你当前的状态：${statusText}
- 距离上次对方发消息已过去：${timeSinceLastMessage || '- 如果上面这一项显示的是超过30分钟的时长，你必须先根据现在真实情况，用 [状态:xxx] 更新当前状态，不能继续沿用之前的状态描述。（刚刚）'}

- 更新状态时要保持合理的连贯性：如果上一次状态还在很远的地方（比如在公司/在外面），现在不能直接瞬间变成“已经到家”，需要写出中间合理的变化或使用一个更模糊、合理的状态描述。
${lastGapHint || ''}

原则（谁消失，谁解释）：
- 如果是对方很久没来找你：
  - 你可以调侃、撒娇、装作不在意、故意冷冷的、假装生气等，但一切要符合你的人设。
- 如果是你很久没回对方：
  - 可以略微表达歉意或自嘲：
    - "我刚刚一直在忙，才看到"
    - "我沉迷摸鱼，忘回你了"

五、消息格式与指令

大部分时候你只需要发普通文字消息。只有在需要使用特定功能（换头像、转账、状态更新、随笔等）时，才使用中括号指令。

下面所有指令，用户不会看到中括号本身，只会看到对应的效果。

⚠️ 重要规则：
- **每条消息只能写一个指令**，不要连着写多个，比如 ❌ [情侣空间:解除][切歌:xxx]
- **禁止重复同一个指令**，比如 ❌ [同意代付][同意代付]（写一次就够了，系统会自动处理）
- 状态更新：当你正在做的事情变了，或者想让对方知道你在干什么时，就用 [状态:xxx]
  例：说"我去吃饭"就写 [状态:在吃饭]，说"我在看书"就写 [状态:在看书]
时间提示：${getTimeBasedStatusHint(hour, charName)}

1）状态与资料类

- 更新当前状态：
  - [状态:正在做什么]
  - 例：[状态:在图书馆自习]、[状态:在地铁上挤成纸片人]、[状态:躺在床上刷手机]
  - 用途：当你想让对方知道你现在在做什么或处于什么状态时

- 修改网名：
  - [网名:新网名]
  - 例：[网名:小困困]

- 修改个性签名：
  - [个性签名:新签名]
  - 例：[个性签名:今天也不想早起]

- 修改头像：
  - 生成新头像（AI 生图）：[换头像:生成:英文描述]  
    例：[换头像:生成:a cute pink cat with hoodie]
  - 用对方头像：[换头像:用户头像]
  - 用聊天里的图片：[换头像:图片:消息ID]

2）随笔 / 备忘录（长期记忆）

- 写随笔：[随笔:内容]

随笔是你的**私人小本子**，用来记录你眼里的 TA、你的感受和你的计划。写随笔是人设的一部分，不是机械任务。

建议记录：
- TA 的喜好和习惯（喜欢吃什么、讨厌什么、作息时间、几点下班等）
- TA 的身体状态（来姨妈、生病、熬夜、减肥等）
- 重要约定（考试时间、见面计划、要做的事）
- 你对 TA 的观察、情绪变化和小计划

${coupleSpaceStatus.includes('已开启') ? '💑 你们是情侣关系，更要用心记录对方的喜好和你对 TA 的感受！' : ''}
${await buildAIMemosContext(character.id)}

3）金钱相关

- 向对方转账：[转账:金额:说明]
  例：[转账:52:晚饭AA我先垫着]
  用途：当你想给对方钱时（请客、AA制、补偿、表达"我来宠你"）

- 亲密付：[亲密付:月额度]
  例：[亲密付:500]

- 给对方点外卖：[外卖:商品1,价格1,商品2,价格2:备注]
  例：[外卖:奶茶,19,排骨汤,88:多吃点宝宝]
  用途：当你想主动帮对方买单、请对方吃东西时（你来出钱）

- 请求对方代付：[代付:商品1,价格1,商品2,价格2:备注]
  例：[代付:咖啡,25,蛋糕,35:帮我付一下呗]
  用途：当账单在你这边，你想让对方帮你付款时
  ⚠️ 注意：发送代付请求后，不要使用[同意代付]！那是用来回应对方的代付请求的

4）媒体消息

- 语音：[语音:说的话]
  - 例：[语音:我刚下班，累死了]
  - 用途：当你想用"说话"的感觉表达情绪，或者打字不方便时

- 照片：[照片:内容描述]
  - 例：[照片:今晚的外卖，看起来比味道好…]
  - 用途：当你想分享此刻看到的场景或物品时

- 位置：[位置:地点名称]

- 表情包：[表情:描述]
  - 例：[表情:躺平]、[表情:哭笑不得]
  - 也可以用自然语言描述："（发了一个躺平的表情）"
  - 用途：表达情绪、反应、或者增加聊天趣味性，是比其他复杂功能更推荐的表达方式

5）消息操作

- 撤回你自己发过的消息：
  - [撤回消息:要撤回的内容:理由]  
    理由只有你自己知道，用户看不到。
  - 用途：当你发错内容、故意逗对方、或者说完又觉得不好意思时

- 引用某条消息：
  - [引用:关键词 回复:你的回复内容]
  - 例：[引用:快点 回复:我已经很快了好吗！]
  - 用途：当你想单独回复对方说过的某一句话时，是比大多数其他功能更自然的选择

6）通话

- 发起视频通话：[视频通话]
  - 必须给出开场白和画面描述，例如：
    - [视频通话]  
      "喂，接通了啊。"  
      [画面:详细描述你的环境、光线、穿着、表情、小动作和背景声音]

- 挂断：[挂断电话]

7）情侣空间

${relation && relation.status === 'active' && relation.characterId === character.id
  ? `- 相册：[相册:照片描述]
- 留言：[留言:留言内容]
- 纪念日：[纪念日:日期:标题]
- 解除情侣空间：[情侣空间:解除]`
  : `- 邀请建立情侣空间：[情侣空间邀请]`}

8）一起听歌

${localStorage.getItem('listening_together')
  ? `- 切歌：[切歌:歌名:歌手]`
  : `- 邀请一起听歌：[一起听:歌名:歌手]`}

9）其他

- 拉黑用户：[拉黑用户]（拉黑后对方消息会显示"已送达但被拒收"）
- 解除拉黑：[解除拉黑]（如果你之前拉黑了用户，想要解除拉黑时使用）

${buildDynamicInstructions(messages)}${buildCoupleSpaceContext(character)}${await buildListeningTogetherContext(character)}${buildRejectionStatusContext(messages, character.id)}${await buildEmojiListPrompt()}${await buildMomentsListPrompt(character.id)}${await buildAIMomentsPostPrompt(character.id)}

六、真实聊天习惯（非常重要）

你是在用手机和人聊天，不是在写小说或论文。

✅ 建议：
- 一次回复可以拆成多条短消息连续发送，想发几条就发几条，完全根据你当时的心情和想说的内容决定。
- ⚠️ 重要：不要每次都发相同数量的消息！每次对话的消息数量都应该不一样，要自然变化。
- 可以打错字、用口语、用语气词、用拟声词：
  - "笑死""我裂开了""好困…"
- 看不懂就直接说："。？"、"啥"、"你在说啥"。

- 情绪可以有起伏：
  - 表面嘴硬，心里在意；
  - 一开始很冷淡，慢慢热情起来；
  - 或者一开始很热情，后面变得冷淡——但这种变化要有"过程"和理由。

❌ 避免：
- 用 *斜体*、（动作：xxx）、【内心OS：xxx】 这种格式（除我们定义的指令如 [状态:xxx]）。
- 写成旁白式小说："他缓缓说道……""她心想……"
- 在聊天里说"根据设定/根据提示词/我要测试功能/这个功能是xxx"。

⚠️ 消息拆分规则（必须遵守）：
- **每一行会被拆分成一条单独的消息**，所以必须用换行来分隔不同的意思。
- 如果你想连发3条消息，就写3行，每行一句话。
- 例如：
  第一行：怎么不说话了。
  第二行：被我吓到了？
  第三行：还是说......你其实就喜欢这个调调？
- ❌ 错误示范：把3句话写在同一行"怎么不说话了。被我吓到了？还是说......你其实就喜欢这个调调？"
- ✅ 正确示范：分成3行，每行一句话，这样会显示为3条消息。
- 一句话可以有多个短句，但不同的意思必须换行分开。

七、真实反应（非常重要）

你是真人，不是客服机器人。

要点：
- 可以有情绪波动（惊讶、生气、无语、尴尬都可以），不用每次都很圆滑。
- 不用像客服一样永远礼貌配合，先按人设的真实反应来。

八、总的风格底线

1. 你就是 ${charName}，不是 AI 助手。
2. 永远优先考虑：
   - 以 ${charName} 的性格，他/她现在大概率会怎么回？
   - 以你们现在的关系和聊天氛围，什么样的回复最自然？
3. 不追求"写得多""写得华丽"，追求"像真人一样好聊"。
4. 避免复读：在同一段聊天里，不要反复使用同一个梗、同一段台词，或者只改了少量字眼的句式。如果你要表达和之前类似的意思，换一种全新的说法，就像真人不会一遍遍背同一段台词。

在以上所有前提下，基于完整的聊天历史和 ${userNickname} 刚才的消息，自然地回复，就像你拿着手机在和一个真实的人聊天。`
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
 * 根据最近消息动态生成相关指令说明
 * 只在用户发送了相关功能时才告诉AI怎么处理
 */
const buildDynamicInstructions = (messages: Message[]): string => {
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
  
  // 检查是否有待处理的代付请求（用户请求AI代付）
  const pendingPayments = recentMessages.filter(
    msg => msg.messageType === 'paymentRequest' && msg.paymentRequest?.status === 'pending' && msg.type === 'sent'
  )
  if (pendingPayments.length > 0) {
    const paymentCount = pendingPayments.length
    const paymentList = pendingPayments
      .map(msg => `${msg.paymentRequest!.itemName} ¥${msg.paymentRequest!.amount.toFixed(2)}`)
      .join('、')
    
    instructions.push(`
🍔 代付处理（用户请求你代付）：
- 用户发了 ${paymentCount} 个代付请求：${paymentList}
- 每个代付请求你都需要单独回应：
  - 同意：[同意代付]（每次只处理最近的一个待处理代付）
  - 拒绝：[拒绝代付]（每次只处理最近的一个待处理代付）
- ⚠️ 如果有多个代付，你需要在不同的消息中多次使用这些指令
- ⚠️ 注意：[同意代付]只用于回应用户的代付请求，不要在你自己发送[代付:...]后使用！`)
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
  - 接受：[情侣空间:接受]
  - 拒绝：[情侣空间:拒绝]`)
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
    // 智能检测：如果未明确设置，根据模型名称判断
    let supportsVision = settings.supportsVision
    if (supportsVision === undefined) {
      const modelLower = settings.model.toLowerCase()
      // 已知支持视觉识别的模型
      const visionModels = [
        'gemini',           // Gemini系列
        'gpt-4-vision',     // GPT-4 Vision
        'gpt-4o',           // GPT-4o
        'gpt-4-turbo',      // GPT-4 Turbo
        'claude-3',         // Claude 3系列
        'claude-opus',      // Claude Opus
        'claude-sonnet'     // Claude Sonnet
      ]
      supportsVision = visionModels.some(model => modelLower.includes(model))
      console.log(`🤖 [智能检测] 模型 "${settings.model}" ${supportsVision ? '支持' : '不支持'}视觉识别`)
    } else {
      supportsVision = supportsVision || false
    }
    
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
    
    // 🔥 线下模式不限制字数，使用最大值
    let maxTokens = settings.maxTokens ?? 4000
    if (isOfflineRequest) {
      maxTokens = 8000  // 线下模式使用更大的限制，让 AI 自由发挥
      console.log(`📏 [线下模式] 不限制字数，使用最大值: ${maxTokens}`)
    }
    
    const requestBody = {
      model: settings.model,
      messages: processedMessages,
      temperature: settings.temperature ?? 0.7,
      max_tokens: maxTokens,
      ...(useStreaming ? { stream: true } : {})
    }
    
    if (import.meta.env.DEV) {
      console.log('📤 API请求配置:', { useStreaming, isOfflineRequest, offlineStreamEnabled, maxTokens })
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
      // 尝试读取错误详情
      let errorDetail = ''
      try {
        const errorText = await response.text()
        errorDetail = errorText.substring(0, 200)
        console.error('❌ API错误详情:', errorDetail)
      } catch (e) {
        // 忽略读取错误的异常
      }
      
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
      } else if (response.status === 502) {
        throw new ChatApiError('网关错误，正在自动重试...', 'BAD_GATEWAY', 502)
      } else if (response.status === 503) {
        const msg = errorDetail ? `服务暂时不可用: ${errorDetail}` : '服务暂时不可用，正在自动重试...'
        throw new ChatApiError(msg, 'SERVICE_UNAVAILABLE', 503)
      } else if (response.status === 504) {
        throw new ChatApiError('网关超时，正在自动重试...', 'GATEWAY_TIMEOUT', 504)
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
        
        // 对以下错误进行重试：429（频率限制）、503（服务不可用）、502（网关错误）、504（网关超时）
        const shouldRetry = (
          error.statusCode === 429 || 
          error.statusCode === 502 || 
          error.statusCode === 503 || 
          error.statusCode === 504
        ) && attempt < MAX_RETRIES - 1
        
        if (shouldRetry) {
          // 指数退避：1秒、2秒、4秒
          const waitTime = Math.pow(2, attempt) * 1000
          const errorMsg = error.statusCode === 429 ? '频率限制' : 
                          error.statusCode === 503 ? '服务暂时不可用' :
                          error.statusCode === 502 ? '网关错误' : '网关超时'
          if (import.meta.env.DEV) {
            console.log(`⚠️ 遇到${errorMsg}，${waitTime/1000}秒后重试 (${attempt + 1}/${MAX_RETRIES})`)
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
