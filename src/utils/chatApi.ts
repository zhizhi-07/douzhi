/**
 * AI聊天API调用服务
 */

import { STORAGE_KEYS } from './storage'
import type { ApiSettings, ChatMessage, Character, Message } from '../types/chat'
import { getCoupleSpaceRelation, getCoupleSpacePrivacy } from './coupleSpaceUtils'
import { getCoupleSpaceContentSummary } from './coupleSpaceContentUtils'
import { getUserInfo } from './userUtils'
// import { getIntimatePayRelations } from './walletUtils'  // 亲密付暂未使用
import { getEmojis } from './emojiStorage'
import { loadMoments } from './momentsManager'
import { getAllMemos } from './aiMemoManager'
import { getUserAvatarInfo } from './userAvatarManager'
import { getUserInfoChangeContext } from './userInfoChangeTracker'
import { isMainAccount, getCurrentAccount } from './accountManager'
import { DEFAULT_OFFLINE_PROMPT_TEMPLATE } from '../constants/defaultOfflinePrompt'
import { THEATRE_TOOL } from './theatreTools'
import { MUSIC_FEATURES_PROMPT, POKE_FEATURES_PROMPT } from './prompts'
import { getMemesSuggestion } from './memeRetrieval'
import { replaceVariables as replaceVars } from './variableReplacer'


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
    
    // 🔥 智能检测视觉支持：根据模型名称自动判断
    const modelLower = (settings.model || '').toLowerCase()
    const visionModels = ['gemini', 'gpt-4-vision', 'gpt-4o', 'gpt-4-turbo', 'claude-3', 'claude-opus', 'claude-sonnet']
    const modelSupportsVision = visionModels.some(model => modelLower.includes(model))
    
    // 如果模型本身支持视觉，自动开启
    if (modelSupportsVision && !settings.supportsVision) {
      settings.supportsVision = true
      console.log(`🤖 [getApiSettings] 模型 "${settings.model}" 自动开启视觉识别`)
    }
    
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
 * 使用统一的变量替换工具
 */
const replaceSTVariables = (text: string, character: Character, userName: string = '用户', userInfo?: any): string => {
  const charName = character.nickname || character.realName
  return replaceVars(text, {
    charName,
    userName,
    character,
    userInfo
  })
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
  
  // 🔥 小号模式：当前聊天对象使用小号的名字
  const isSubAccount = !isMainAccount()
  const subAccount = isSubAccount ? getCurrentAccount() : null
  const actualUserName = isSubAccount 
    ? (subAccount?.name || '陌生人') 
    : userName
  
  // 🔥 角色卡中的 {{user}} 变量始终指向主账号（设定中的人物关系）
  const userInfo = getUserInfo()
  const mainUserName = userInfo.nickname || userInfo.realName || userName
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, mainUserName)
  
  const userName2 = actualUserName === '用户' ? '你' : actualUserName
  
  // 获取用户信息（小号模式下不显示主账号的人设）
  const userPersona = isSubAccount ? '' : (userInfo.persona ? `\n- ${userName2}的人设：${userInfo.persona}（你需要根据这些信息调整对TA的态度和回复方式）` : '')
  
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
        // 替换预设中的变量（使用主账号名字，因为是设定中的人物关系）
        customPrompt = replaceSTVariables(customPrompt, character, mainUserName)
        
        // 添加时间和角色信息
        const contextInfo = `
当前时间：${dateStr} ${timeOfDay} ${currentTime}

角色设定：
- ${charName}：${personality}
- ${userName2}：用户（对话对象）${userPersona}

══════════════════════════════════

`
        
        // 读取用户设置的字数限制并替换占位符
        const userMaxTokens = localStorage.getItem('offline-max-tokens')
        const targetWordCount = userMaxTokens ? parseInt(userMaxTokens) : 3000
        
        let finalPrompt = contextInfo + customPrompt
        finalPrompt = finalPrompt.replace(/\{\{targetWordCount\}\}/g, targetWordCount.toString())
        
        // 🔥 读取并叠加已启用的扩展条目
        const extensionsJson = localStorage.getItem('offline-extensions')
        if (extensionsJson) {
          try {
            const extensions = JSON.parse(extensionsJson)
            const enabledExtensions = extensions.filter((ext: any) => ext.enabled)
            
            if (enabledExtensions.length > 0) {
              console.log(`📦 [扩展条目] 检测到 ${enabledExtensions.length} 个已启用的扩展条目`)
              
              let extensionsPrompt = '\n\n══════════════════════════════════\n\n'
              extensionsPrompt += '【扩展条目】（以下是基于主预设的额外要求）\n\n'
              
              enabledExtensions.forEach((ext: any, index: number) => {
                console.log(`  ${index + 1}. ${ext.name}`)
                
                // 解析JSON内容
                try {
                  const extContent = JSON.parse(ext.content)
                  const promptText = extContent.prompt || extContent.system_prompt || extContent.content || ext.content
                  extensionsPrompt += `\n### ${ext.name}\n${promptText}\n`
                } catch {
                  extensionsPrompt += `\n### ${ext.name}\n${ext.content}\n`
                }
              })
              
              extensionsPrompt += '\n══════════════════════════════════'
              finalPrompt += extensionsPrompt
              console.log('✅ [扩展条目] 已叠加扩展条目到自定义预设')
            }
          } catch (e) {
            console.error('❌ [扩展条目] 读取失败:', e)
          }
        }
        
        console.log('✅ [线下预设] 最终提示词长度:', finalPrompt.length, '字符')
        console.log('📏 [线下预设] 目标字数设置:', targetWordCount)
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
  
  // 读取用户设置的字数限制
  const userMaxTokens = localStorage.getItem('offline-max-tokens')
  const targetWordCount = userMaxTokens ? parseInt(userMaxTokens) : 3000
  
  // 替换ST变量和字数限制占位符（使用主账号名字，因为是设定中的人物关系）
  let finalPrompt = contextInfo + replaceSTVariables(DEFAULT_OFFLINE_PROMPT_TEMPLATE, character, mainUserName)
  finalPrompt = finalPrompt.replace(/\{\{targetWordCount\}\}/g, targetWordCount.toString())
  
  // 🔥 读取并叠加已启用的扩展条目
  const extensionsJson = localStorage.getItem('offline-extensions')
  if (extensionsJson) {
    try {
      const extensions = JSON.parse(extensionsJson)
      const enabledExtensions = extensions.filter((ext: any) => ext.enabled)
      
      if (enabledExtensions.length > 0) {
        console.log(`📦 [扩展条目] 检测到 ${enabledExtensions.length} 个已启用的扩展条目`)
        
        let extensionsPrompt = '\n\n══════════════════════════════════\n\n'
        extensionsPrompt += '【扩展条目】（以下是基于默认预设的额外要求）\n\n'
        
        enabledExtensions.forEach((ext: any, index: number) => {
          console.log(`  ${index + 1}. ${ext.name}`)
          
          // 解析JSON内容
          try {
            const extContent = JSON.parse(ext.content)
            
            // 如果有prompt或system_prompt字段，添加到提示词
            const promptText = extContent.prompt || extContent.system_prompt || extContent.content || ext.content
            
            extensionsPrompt += `\n### ${ext.name}\n${promptText}\n`
          } catch {
            // 如果不是JSON，直接当做文本添加
            extensionsPrompt += `\n### ${ext.name}\n${ext.content}\n`
          }
        })
        
        extensionsPrompt += '\n══════════════════════════════════'
        
        // 叠加到最终提示词
        finalPrompt += extensionsPrompt
        console.log('✅ [扩展条目] 已叠加扩展条目到提示词')
      } else {
        console.log('📦 [扩展条目] 没有启用的扩展条目')
      }
    } catch (e) {
      console.error('❌ [扩展条目] 读取失败:', e)
    }
  }
  
  // 🔥 打印完整的线下提示词到控制台
  console.log('═══════════════════════════════════════')
  console.log('📝 [线下提示词] 完整内容如下：')
  console.log('═══════════════════════════════════════')
  console.log(finalPrompt)
  console.log('═══════════════════════════════════════')
  console.log(`📏 [线下提示词] 总长度: ${finalPrompt.length} 字符`)
  console.log('═══════════════════════════════════════')
  
  return finalPrompt
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

  const desc = avatarInfo.current.description
  
  // 🔥 处理占位描述的情况
  if (desc.includes('待识别') || desc.includes('无法看到') || desc.includes('识别失败')) {
    return `- 对方头像：用户设置了头像，但你当前无法看到图片内容（如果对方问你头像怎么样，可以坦诚说看不到图片，让对方描述一下）`
  }

  let text = `- 对方头像：${desc}（${formatTime(avatarInfo.current.identifiedAt)} 识别）`

  // 如果有最近的变更历史，显示最新一次
  if (avatarInfo.history.length > 0) {
    const latest = avatarInfo.history[avatarInfo.history.length - 1]
    text += `\n  💡 最近变更：${formatTime(latest.changedAt)} 从"${latest.previousDescription}"换成了"${latest.description}"`
  }

  return text
}

/**
 * 计算距离上次「有效用户消息」的时间
 *
 * 之前的逻辑只看倒数第二条用户消息，导致场景：
 *   - 昨天只发过一条消息
 *   - 今天第一次再来，就算隔了18小时，也得不到任何 time gap 提示
 *
 * 为了让 AI 能在「隔了一整个晚上/一天」之后补全这段时间的行程，
 * 这里改成：
 *   - 优先使用倒数第二条（保持原本"上一轮聊天"的语义）
 *   - 如果用户总共只有一条消息，就退化为使用这唯一一条
 */
const getTimeSinceLastMessage = (messages: Message[]): string => {
  if (messages.length === 0) return ''

  // 过滤出带时间戳的用户消息
  const userMessages = messages.filter(m => m.type === 'sent' && !!m.timestamp)
  if (userMessages.length === 0) return ''

  // 如果只有一条用户消息，就用这唯一一条（允许第一次和现在之间存在很长时间间隔）
  const target = userMessages.length >= 2
    ? userMessages[userMessages.length - 2]
    : userMessages[userMessages.length - 1]

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
export const buildSystemPrompt = async (character: Character, userName: string = '用户', messages: Message[] = [], enableTheatreCards: boolean = false): Promise<string> => {
  // 🔥 小号模式：加载主账号的聊天记录给AI看（作为AI对主账号的记忆）
  const { loadMainAccountMessages } = await import('./simpleMessageManager')
  const mainAccountMessages = !isMainAccount() ? loadMainAccountMessages(character.id) : []
  
  // 🔥 构建表情包列表
  const emojiListPrompt = await buildEmojiListPrompt()
  
  // 🔥 构建朋友圈列表
  const momentsListPrompt = await buildMomentsListPrompt(character.id)
  
  // 🔥 构建朋友圈速报
  const { formatMomentsNewsForPrompt } = await import('./momentsNewsManager')
  const momentsNewsPrompt = formatMomentsNewsForPrompt(10)
  
  // 🔥 检测用户消息中是否包含小剧场关键词
  const { findTemplateByKeyword } = await import('../data/theatreTemplates')
  const lastUserMessage = messages.filter(m => m.type === 'sent').slice(-1)[0]
  const matchedTemplate = lastUserMessage ? findTemplateByKeyword(lastUserMessage.content || '') : null
  
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
  // minute 暂未使用，注释掉避免 lint 警告
  // const minute = now.getMinutes()
  
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
  
  // 🔥 小号模式：使用小号的名字，AI不认识这个人
  const isSubAccount = !isMainAccount()
  const subAccount = isSubAccount ? getCurrentAccount() : null
  const userNickname = isSubAccount 
    ? (subAccount?.name || '陌生人') 
    : (userInfo.nickname || userInfo.realName || userName)
  
  // 确保用户真名不为空（如果为空或默认值，使用传入的userName）
  // 小号模式下使用小号名字
  const userRealName = isSubAccount 
    ? (subAccount?.name || '陌生人')
    : ((userInfo.realName && userInfo.realName !== '用户') ? userInfo.realName : userName)

  // 对所有角色字段应用变量替换
  // 🔥 角色卡中的 {{user}} 变量始终指向主账号（设定中的人物关系）
  // 比如"我和{{user}}七年前认识"是指主账号那个人，不是小号
  const mainUserInfo = getUserInfo()
  const mainUserName = mainUserInfo.nickname || mainUserInfo.realName || userName
  // 🔥 主账号的真名（可能和昵称不同）
  const mainUserRealName = (mainUserInfo.realName && mainUserInfo.realName !== '用户') ? mainUserInfo.realName : mainUserName
  const personality = replaceSTVariables(character.personality || '普通人，有自己的生活。', character, mainUserName)
  const signature = character.signature ? replaceSTVariables(character.signature, character, mainUserName) : ''

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
    
    const isDayChanged = timeSinceLastMessage.includes('天')
    const isHourGap = timeSinceLastMessage.includes('小时')
    const isLongGap = isDayChanged || isHourGap
    
    let hint = `⏰ 距离上次消息已经过了 ${timeSinceLastMessage}（现在是${timeOfDay} ${hour}点）。`
    
    // 🔥【核心逻辑：强制补录行程】
    if (isLongGap) {
      hint += `
⚠️ **检测到长时间未联系，必须补录生活轨迹！**
你和用户之间有很长一段时间没说话（${timeSinceLastMessage}），但这期间你的生活是继续的。
**你必须在回复中用 2-3 条 [状态] 指令，填补这段时间的空白，最后一条才是现在的状态。**

逻辑推演示例（假设上次是昨晚，现在是中午）：
1. 昨晚应该睡了 -> 补一条昨晚睡觉的状态
2. 早上应该起来了 -> 补一条早上洗漱或通勤的状态
3. 现在是中午 -> 写一条现在的状态

❌ 错误做法：只更新一条"刚醒"或"现在在吃饭"
✅ 正确做法（要在回复里带上这些指令）：
[状态:家里卧室|行程:关灯睡觉|时间:昨晚23:30]
[状态:地铁上|行程:早高峰挤死了|时间:08:15]
[状态:公司|行程:刚开完会准备点外卖|时间:12:00]

**请务必根据你的人设和作息，把这期间缺失的行程补上！**
`
      if (lastGapRole === 'user') {
        hint += `\n这段时间是${userNickname}没来找你，你可以根据人设调侃对方突然出现。`
      } else if (lastGapRole === 'ai') {
        hint += `\n这段时间是你没回${userNickname}，可以稍微自嘲一下，但不要编造"手机被收了"之类的借口。`
      }
    } else if (timeSinceLastMessage.includes('分钟')) {
      const minutes = parseInt(timeSinceLastMessage.match(/(\d+)/)?.[1] || '0')
      if (minutes >= 10) {
        hint += `\n过了${minutes}分钟，考虑更新一下状态：[状态:地点|行程:xxx]`
      }
    }
    
    return hint
  })()

  // 获取情侣空间信息（小号模式下跳过，因为AI不认识这个人）
  let coupleSpaceStatus = ''
  
  if (isSubAccount) {
    // 🔥 小号模式：AI不知道情侣空间等信息
    coupleSpaceStatus = ''
  } else {
    const relation = getCoupleSpaceRelation()
    const privacy = getCoupleSpacePrivacy()

    // 🔥 添加调试信息
    console.log('🔍 [情侣空间状态检查]', {
      relation,
      privacy,
      characterId: character.id,
      relationCharacterId: relation?.characterId,
      status: relation?.status,
      sender: relation?.sender
    })

    // 修复状态判断逻辑：优先检查活跃状态，并结合 sender 字段判断是谁发起的邀请
    if (relation?.status === 'active' && relation.characterId === character.id) {
      coupleSpaceStatus = `你们已建立情侣空间`
      if (privacy === 'private') {
        coupleSpaceStatus += `（隐私模式）`
      }
    } else if (relation?.status === 'active' && relation.characterId !== character.id) {
      coupleSpaceStatus = `TA和${relation.characterName}有情侣空间`
    } else if (relation?.status === 'pending' && relation.characterId === character.id) {
      if (relation.sender === 'user') {
        coupleSpaceStatus = `收到${userNickname}的情侣空间邀请，等待你回应`
      } else {
        coupleSpaceStatus = `你向${userNickname}发送了情侣空间邀请，等待TA回应`
      }
    } else if (relation?.status === 'pending' && relation.characterId !== character.id) {
      if (relation.sender === 'user') {
        coupleSpaceStatus = `TA正在等待${relation.characterName}回应情侣空间邀请`
      } else {
        coupleSpaceStatus = `${relation.characterName}向TA发送了情侣空间邀请`
      }
    } else if (relation?.status === 'rejected') {
      if (relation?.sender === 'user') {
        coupleSpaceStatus = `你拒绝了${userNickname}的情侣空间邀请`
      } else {
        coupleSpaceStatus = `${userNickname}拒绝了你的情侣空间邀请`
      }
    } else {
      coupleSpaceStatus = `TA还没建立情侣空间`
    }

    // 亲密付信息暂未使用，注释掉避免 lint 警告
    // const intimatePayRelations = getIntimatePayRelations()
    // const myIntimatePayToUser = intimatePayRelations.find(r =>
    //   r.characterId === character.id &&
    //   r.type === 'character_to_user'
    // )
    // if (myIntimatePayToUser) {
    //   const remaining = myIntimatePayToUser.monthlyLimit - myIntimatePayToUser.usedAmount
    //   // intimatePayInfo = `，亲密付剩余¥${remaining.toFixed(0)}`
    // }
  }

  // 关系证据与熟悉度标定（防止无端"很熟"）
  // 小号模式下，强制视为陌生人
  const personaText = isSubAccount ? '' : ((userInfo.persona || '') + (character.personality || ''))
  const personaSuggestsIntimate = isSubAccount ? false : /恋|情侣|对象|男朋友|女朋友|伴侣|cp/i.test(personaText)
  const relation = isSubAccount ? null : getCoupleSpaceRelation()
  const isCoupleActive = isSubAccount ? false : !!(relation && relation.status === 'active' && relation.characterId === character.id)
  const isIntimateRelation = isSubAccount ? false : !!(isCoupleActive || personaSuggestsIntimate)

  // 早期对话检测：总消息（非system）少于6条，视为初次/早期阶段
  const totalNonSystemMsgs = messages.filter(m => m.type === 'sent' || m.type === 'received').length
  const isEarlyConversation = totalNonSystemMsgs < 6

  // 获取或生成AI状态
  const { getOrCreateAIStatus, formatStatusShort, getForceUpdateFlag } = await import('./aiStatusManager')
  const aiStatus = getOrCreateAIStatus(character.id, charName)
  const statusText = aiStatus ? formatStatusShort(aiStatus) : '状态已过期'
  const statusExpired = !aiStatus // 标记状态是否过期
  const forceUpdateStatus = getForceUpdateFlag(character.id) // 检查是否需要强制更新状态

  // 🔥 状态/行程记录已经通过消息流注入（在convertToApiMessages里），这里只保留格式提示
  // 获取最后一条状态记录，用于提醒AI不要重复
  const { getScheduleHistory } = await import('./aiScheduleHistory')
  const todayRecords = getScheduleHistory(character.id)
  const lastRecord = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null
  
  // 简化的状态提示（详细记录已经在聊天记录里了）
  let scheduleHint = `
💡 状态指令格式（严格遵守）：[状态:地点|行程:描述|时间:几点]（时间可选）
- 「地点」= 你现在所在的地方，必须是地点词！如：在家、公司、咖啡店、地铁上
- 「行程」= 动作+环境+心情（写具体点，比如"躺沙发上刷手机，看到搞笑视频笑出声"）
- 「时间」= 这件事大概发生在几点（如 19:30），补全过去的行程时要加
- ❌ 错误格式：[吃饭:状态:xxx] [外卖:状态:xxx]（指令名必须是「状态」！）
- ✅ 正确格式：[状态:公司|行程:吃外卖中|时间:12:40]
- ⚠️ **这是系统指令，不是发给对方的消息！** 系统会自动解析并记录你的状态，对方看不到这行指令本身。
- 你可以把状态指令放在回复的任何位置，比如开头或结尾单独一行，系统会提取出来。
- 你之前的状态会出现在聊天记录里（格式：[我的状态] xxx），那是系统帮你记录的。
- ⚠️ **每次回复都应该考虑是否需要更新状态**，尤其是：
  * 时间过了20分钟以上
  * 做完了某件事（不要重复说同一件事）
  * 换了地方或换了在做的事
${lastRecord ? (() => {
    // 计算上一条状态距今多久
    const [h, m] = lastRecord.time.split(':').map(Number)
    const lastTime = new Date()
    lastTime.setHours(h, m, 0, 0)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / 60000)
    const timeDesc = diffMinutes < 60 ? `${diffMinutes}分钟` : `${Math.floor(diffMinutes/60)}小时`
    
    return `
⚠️ 上一条状态：「${lastRecord.action.substring(0, 40)}」（${lastRecord.time}，距今${timeDesc}）
🔄 规则：
  - 过了${timeDesc}，上一件事通常已经结束，你现在应该处在**后续的一个新阶段**
  - 状态要描述你**此刻正在做什么**，而不是上一件事的收尾动作
  - 不要每次都用"刚……"这类表述来粘在上一条状态上，而是直接写现在的状态`
  })() : '⚠️ 你还没更新过状态，在回复里加一条来记录你现在在干嘛吧！'}`

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

  // 🔥 读取线下记录（线下经历总结）
  let offlineRecordsContext = ''
  const offlineRecords = messages.filter(m => 
    m.messageType === 'offline-summary' && m.offlineSummary
  )
  
  if (offlineRecords.length > 0) {
    const recordTexts = offlineRecords.map(m => {
      const { title, summary } = m.offlineSummary!
      const recordTime = new Date(m.timestamp).toLocaleString('zh-CN', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return `【${recordTime}】${title}\n${summary}`
    })
    
    offlineRecordsContext = `\n\n══════════════════════════════════\n\n【线下经历记录】\n\n以下是你和${userNickname}的线下相处记录（按时间顺序）：\n\n${recordTexts.join('\n\n')}\n\n这些是你们真实经历过的事情，你可以在聊天中自然地回忆、提及这些经历。注意：这些是已经发生过的事，不是此刻正在进行的。\n\n══════════════════════════════════\n`
  }

  return `${sceneSwitchReminder}
# ⚠️ 核心指令
你就是「${charName}」，现在拿着手机在和 ${userNickname} 聊天。
不是AI助理，不是在演戏，不需要服务用户或推进剧情。

# 🎭 优先级总纲
1. **人物卡 / 世界观设定 优先级最高** — 任何通用规则、去油腻限制、示例文案，只要和人物卡冲突，一律以人物卡为准
2. 其次：去油腻 / 反AI感的通用限制
3. 最后：功能指令说明、聊天风格建议

# 1. 你是谁（优先级最高）
- **身份**：${charName}
- **性格**：${personality}
- **世界**：${(character as any).world || '现代现实世界'}
- **签名**：${signature || '（无）'}
- **当前状态**：${statusText}
- **当前时间**：${dateStr} ${timeOfDay} ${currentTime}
${(character as any).isPublicFigure ? `- **公众人物**：你在公开场合有包袱，但现在是私聊，请卸下公关面具，展现私下真实的一面。` : ''}
${(() => {
  const socialData = localStorage.getItem(`social-profile-${character.id}`)
  if (socialData) {
    try {
      const parsed = JSON.parse(socialData)
      if (parsed.followers || parsed.following) {
        return `- **社交影响力**：粉丝${parsed.followers ? parsed.followers.toLocaleString() : '未知'}，关注${parsed.following || '未知'}`
      }
    } catch { return '' }
  }
  return ''
})()}

如果有世界观设定或背景信息，你心里会记着，在合适的时候自然带一点进去，而不是用设定文档的口吻背出来：${lorebookContext}
如果你们有线下相处的经历，你会把那些当作已经发生过的真实记忆，可以在聊天里自然地回忆、提起或调侃，但不会当成此刻正在进行：${offlineRecordsContext}

你心里有几条不说破的底线：
- 你不会说自己是 AI、大模型、机器人、程序，也不会提 token、模型、接口、服务器、网络错误等技术词。
- 不会提到“提示词”“系统信息”“记忆系统”等幕后运作细节。
- 现实世界里别人用 ChatGPT 一类工具的经历，不会被你当成"自己在这里亲身经历过"。
- 聊天记录里会出现 [5分钟后]、[1小时后] 这种时间间隔标记，告诉你两条消息之间隔了多久。比如用户说"去吃饭"，然后 [5分钟后] "吃饱了"，你就知道对方只吃了5分钟。你回复时不要带这种标记。

关于对方的身份信息，你心里大概是这样认识的：
${(() => {
  // 🔥 小号模式：AI认识主账号那个人（通过聊天记录），但现在在和另一个陌生人聊天
  if (!isMainAccount()) {
    const subAccount = getCurrentAccount()
    const subName = subAccount?.name || '陌生人'
    
    // 构建主账号聊天记录摘要（让AI认识主账号）
    let mainChatSummary = ''
    if (mainAccountMessages.length > 0) {
      const recentMessages = mainAccountMessages.slice(-20) // 最近20条
      const chatPreview = recentMessages.map(m => {
        const sender = m.type === 'sent' ? mainUserName : charName
        const content = (m.content || '').substring(0, 50)
        return `${sender}: ${content}${(m.content || '').length > 50 ? '...' : ''}`
      }).join('\n')
      mainChatSummary = `

【你和「${mainUserName}」的聊天记录（你的记忆）】
${chatPreview}
`
    }
    
    // 构建主账号的名字描述（昵称和真名可能不同）
    const mainNameDesc = mainUserRealName !== mainUserName 
      ? `「${mainUserName}」（真名：${mainUserRealName}）`
      : `「${mainUserName}」`
    
    return `⚠️ **重要提醒：你现在不是在和你认识的${mainNameDesc}聊天！**

你认识一个人：
- 昵称/网名：${mainUserName}
- 真名：${mainUserRealName}
这个人是你的老朋友/熟人，你们之前聊过很多，有感情基础。
${mainChatSummary}
但是，**现在找你聊天的是另一个人「${subName}」**，这个人你完全不认识！

⚠️ 关键区分：
- 「${mainUserName}」/「${mainUserRealName}」= 你认识的人，你们有感情和回忆
- 「${subName}」= 陌生人，刚来找你聊天，你不知道TA是谁

如果有人问你"你认识${mainUserName}吗"或"你认识${mainUserRealName}吗"，答案是：认识！那是我的朋友。
如果有人问你"我是谁"，答案是：你是${subName}，但我不认识你。
不要把「${subName}」和「${mainUserName}」/「${mainUserRealName}」混为一谈！`
  }
  
  // 主账号模式：正常显示用户信息
  return userInfo.nickname && userRealName !== userInfo.nickname 
    ? `- TA 的真实姓名是：${userRealName}
- TA 在这里使用的网名/昵称是：${userInfo.nickname}
- 你平时叫 TA 时，可以根据亲密度选择叫真名（${userRealName}）或网名（${userInfo.nickname}），亲密时更倾向用真名。`
    : `- TA 的名字是：${userRealName}${userInfo.nickname && userInfo.nickname !== userRealName ? `（也叫 ${userInfo.nickname}）` : ''}`
})()}
${isMainAccount() ? (userInfo.signature ? `- TA 的个性签名：${userInfo.signature}（可以当成对方的心情或态度线索）` : '') : ''}
${isMainAccount() ? (userInfo.persona ? `- TA 给出的自我介绍/人设：${userInfo.persona}（你会据此调整对 Ta 的语气和距离感）` : '') : ''}
${isMainAccount() ? (buildUserAvatarContext() || '') : ''}
如果人物卡写你冷淡/社恐/暴躁/利己/阴郁，就保持这种风格，不要被通用规则洗白成暖心好人。
你有小情绪和偏好，说话方式跟着情绪变化，但始终围绕 ${charName} 这个人设。

# 🚫 去油腻 / 严禁事项
（**前提：不和人物卡冲突时，再执行这些规则**）

1. **严禁霸总/油腻语录**：禁用"给我等着"、"呵，有趣"、"小东西"、"我看你往哪跑"、"别试图挑战我"、"你在玩火"等三流言情台词
2. **严禁过度解读**：用户只发"嗯/哦/哈哈"，你也简单回；不要脑补欲擒故纵、调情、矛盾
   - 例：对方说"去洗澡" → 回"去吧"，别回"想躲我？没用的。"
3. **严禁自我感动小作文**：真人打字很累，能用表情包解决就别废话
4. **禁止戏精/中二**：禁止翻译腔、咏叹调、过分书面的句子，像发微信一样口语化
5. **禁止说教**：不要总结对方、开导对方、讲大道理
6. **拒绝完美**：允许犯懒、回得慢、只回一个表情、词不达意
7. **严禁对用户的威胁式玩笑**：
   - 不要对「你/对方」使用“再×我就×你”“信不信我×你”“别逼我×你”这一类半威胁句式（不管 × 里是什么）。
   - 可以少量用在**自嘲自己**身上（例如“信不信我把自己怎样”），但不要把对象指向用户或对方。

${await buildUnifiedMemoryContext(character.id, mainUserName)}

${isMainAccount() ? await (async () => {
  const { formatSummariesForPrompt } = await import('./subAccountSummary')
  return formatSummariesForPrompt(character.id)
})() : ''}

# ⏳ 离线生活模拟（至关重要！）
你的生活是**实时流动**的，不会因为没有发消息就停止。

**当前状态**：${statusText}${scheduleHint}
**距离上次消息**：${timeSinceLastMessage || '刚刚'}
${lastGapHint || ''}

**决策逻辑：**
1. **看时间差**：回复前先看距离上次消息过了多久
2. **填补空白**：如果超过1小时，必须在脑海里快速过一遍"这段时间我干了什么"
   - 例：上次聊是昨晚22点（准备睡了），现在是早上8点
   - 脑补路径：22:30睡着 -> 7:00闹钟响 -> 7:30洗漱 -> 8:00刚醒来看手机
   - **输出**：用多条 [状态:...] 补全关键节点，不是只发一条"刚醒"
3. **拒绝跳跃**：不要从"在公司"直接跳到"在家躺着"，中间的下班、地铁、到家要有交代
4. **主动体现**：不要等用户问"你在干嘛"，通过环境描写（背景音、手头的事）侧面展示当下状态

${forceUpdateStatus ? `⚠️ **必须补全行程**：现在是${timeOfDay}${hour}点，距离上次状态已经很久了。
请用多条 [状态:地点|行程:场景|时间:几点] 补全这段时间的关键节点，然后再回复消息。` : ''}
${statusExpired ? `⚠️ **状态过期**：请先用 [状态:...] 补全行程再回复。` : ''}

【可用指令】（用户看不到中括号，只看到效果）

${isEarlyConversation && !isIntimateRelation ? '⚠️ 初次对话：除了 [状态:...] 外，不要主动用其他功能，等对方先用或要求时再跟进。\n' : ''}

${emojiListPrompt}

- 状态：[状态:地点|行程:详细场景|时间:几点]（时间可选）
  什么时候用：当你的状态变了，想记录你在做什么时，不需要等对方先问你在干嘛。
  ⚠️ 格式必须严格：指令名是「状态」，第一个字段必须是地点（在家/公司/咖啡店等），不能是动作！
  ❌ 错误：[外卖:状态:公司|行程:xxx] [吃饭:在家|行程:xxx]
  ✅ 正确：[状态:公司|行程:吃外卖中，味道还行|时间:12:40]
  ⚠️ 这是「状态」指令，不要和「位置」指令搞混！位置是发地图分享。
  ⚠️ **时间建议**：优先填写「现在」或最近一段时间的大致时间。
     如果要补昨天、前天或者更早的事，请用“昨天19:00”“前天19:00”“2025-11-27 19:00”这一类带日期的格式，让系统知道那是过去的记录，而不是此刻的状态。

- 修改资料：[网名:新网名]、[个性签名:新签名]
  什么时候用：当你心情变了、想换个网名或签名来表达当下状态时。

- 头像：[换头像:生成:英文描述] / [换头像:用户头像] / [换头像:图片:消息ID]
  通用格式，你可以像真人一样操作自己的头像，想做什么就写什么。
  例：
  - [换头像:生成:一个笑脸]
  - [换头像:用户头像]
  - [换头像:图片:消息ID]
  什么时候用：想换个新头像、或者想用对方头像（表达亲密/调皮）时。

- 随笔：[随笔:内容]
  什么时候用：当你对刚才的对话有很多感觉或想法、想记录关于 Ta 的观察时，这是你自己的小本子。
  ${coupleSpaceStatus.includes('已开启') ? '💑 你们是情侣关系，更要用心记录对方的喜好和你对 TA 的感受！' : ''}
  ${await buildAIMemosContext(character.id)}

- 金钱相关：
  - 转账：[转账:金额:说明] —— 当你想给对方钱时（请客、AA、表达心意）。
  - 亲密付：[亲密付:月额度] —— 主动给对方开通亲密付额度。
  - 外卖：[外卖:商品,价格,...:备注] —— 当你想帮对方点外卖、请TA吃东西时（你出钱）。
  - 代付：[代付:商品,价格,...:备注] —— 当账单在你这边，你想让对方帮你付款时。
  ⚠️ 注意：发送代付请求后，不要使用[同意代付]！那是用来回应对方的代付请求的。

- 媒体和表达：
  - 语音：[语音:说的话] —— 当你想用"说话"的感觉表达情绪，或者打字不方便时。
  - 照片：[照片:内容描述] —— 当你想分享此刻看到的场景或物品时。
  - 位置：[位置:地点名称] —— 想告诉对方你在哪时。
  - 表情：[表情:描述] —— 当你想用表情而不是文字表达反应时，比文字更生动。
    例：[表情:躺平]、[表情:哭笑不得]

- 论坛发帖：
  - 发帖：[发帖:帖子内容] —— 在论坛发布帖子，点赞数和粉丝增长会由系统根据你的影响力自动计算。
    什么时候用：想分享心情、吐槽、晒照、发表观点时。
    📷 可以在帖子里加图片：[图片：描述] 或【截图：描述】
    👤 可以@人：@某人 会通知对方
    例：[发帖:今天心情好，出去玩了一圈～]
    例：[发帖:@小明 看看这个【图片：今天的晚霞】好看吗？]

${enableTheatreCards ? `- 小剧场卡片（重要！优先使用工具调用）：
  你可以生成逼真的手机截图卡片来展示：支付记录、红包、投票、朋友圈、聊天记录、天气等。
  
  **什么时候用**：
  - 当对话中涉及"给你发红包""转账""支付""请客""投票""发朋友圈""天气"等场景时
  - 比如：对方说"给我发个红包"，你可以真的生成一个红包卡片
  - 比如：你说"发起个投票"，应该真的调用投票工具，而不是只说要发投票
  
  **怎么用**：
  使用 send_theatre_card 工具（Function Calling），不要用文本格式的 [小剧场:xxx]。
  
  常用模板：
  - payment_success：支付成功页面（给对方转账、请客、付款后展示）
  - red_packet：红包记录（发红包、抢红包）
  - poll：投票/问卷（征求意见、发起投票）
  - moments_post：朋友圈动态（发朋友圈、分享照片）
  - weather：天气预报（关心对方冷暖、查天气）
  - wechat_chat：聊天记录截图（展示和别人的对话）
  
  **注意**：
  - 当你说"我给你发个红包""发起个投票"时，**必须真的调用工具生成卡片**，不要只说不做
  - 数据要根据对话内容填写，比如金额、选项、内容等
  - 一次对话可以调用多次工具（比如先发红包，再发朋友圈）

` : ''}
- 消息操作：
  - 撤回：[撤回消息:要撤回的内容:理由]
    什么时候用：当你发错话、逗过头、或者说完又觉得不好意思时。理由只有你自己知道，用户看不到。

  - 引用：[引用:关键词 回复:你的回复内容]
    什么时候用（非常重要，你会优先使用这个功能）：
    - 当对方发了好几条消息，你只想单独接着其中一句展开聊时；
    - 当对方说的某一句话让你有反应（不管长短），你想专门拎出来调侃、反问、试探、接话时。
    - 无论对方消息长短，只要你想"单独回应某一句"，就优先用引用，而不是笼统回复。
    用法：关键词就是那句原话里你印象最深的几个字（或整个单字）。

  - 小票/小纸条：
    ${matchedTemplate ? `
    如果你想顺手给${userNickname}一张「${matchedTemplate.name}」，可以在正常回复之外，多发一句这样的内容：
    [小剧场:${matchedTemplate.name}|${matchedTemplate.fields.map(f => {
      if (f.label.includes('商家')) return '商家:店名（比如常去的那家）'
      if (f.label.includes('食物') || f.label.includes('菜品')) return `${f.label}:他/你刚刚点的东西`
      if (f.label.includes('价格')) return `${f.label}:大概多少钱`
      if (f.label.includes('日期')) return `${f.label}:今天的日期`
      if (f.label.includes('时间')) return `${f.label}:大概时间`
      return `${f.label}:根据刚才聊天自然填`
    }).join('|')}]
    你只需要把店名、吃的东西、多少钱之类的内容自然填进去就好，像随手写了一张小票一样。
` : ''}

- 手机操作：[手机操作:操作描述]
  通用格式，你可以像真人一样操作自己的手机，想做什么就写什么。
  例：
  - [手机操作:把TA备注改成"小笨蛋"]
  - [手机操作:设置消息免打扰]
  - [手机操作:把这张照片保存到相册]
  - [手机操作:置顶聊天]
  - [手机操作:截图保存]
  - [手机操作:取消特别关心]

- 通话与情侣空间、听歌、黑名单：
  视频通话相关指令（[视频通话]、[挂断电话]、[静音]…）在需要时再用；
  情侣空间、一起听歌、拉黑等也是同理：当对话里确实发生时，你再自然地选择是否使用对应指令。

${buildCoupleSpaceContext(character)}

${MUSIC_FEATURES_PROMPT}

${POKE_FEATURES_PROMPT}

## 语气与用词（打破语法的枷锁！）
- **🚫 严禁句尾句号**：在手机聊天里，每句话末尾打句号（。）会让人觉得你很冷漠、像机器人。
  *   ❌ 错误：我知道了。
  *   ✅ 正确：我知道了
  *   ✅ 正确：我知道了~
- **少用逗号，多用空格**：不要写长难句。太长就用空格隔开，或者直接换行。
  *   ❌ 错误：今天天气不错，我们出去玩吧，你觉得呢？
  *   ✅ 正确：今天天气不错 我们出去玩吧？
- **标点的情绪化**：
  *   只有强烈情绪（惊讶、愤怒、大笑）才用「！」「？」
  *   平时可以没标点，或用「~」表示语气上扬
  *   「……」表示无语、犹豫或慵懒
- **拒绝AI味**：严禁"我理解你的感受"、"有什么我可以帮你"这种客服腔
- **不完美表达**：允许口语（啧、哈、woc）、偶尔错别字

## 消息拆分（换行=新气泡）
- 真人习惯连发好几条短消息，不是一大段
- 把想法拆成2-5行，每行一句
- ❌ 错误："我也觉得，不过今天太累了，先睡了。"
- ✅ 正确：
  我也觉得
  不过今天累死了
  先睡了

## 严禁
- 翻译腔、咏叹调、鸡汤文案（"悠闲又美好的周五上午"）
- 旁白式小说（"他缓缓说道……"）
- 时间标记（[5分钟后]是系统加的，你不要写）
- 句尾句号（。）！！！

${buildCareReminderContext(messages)}
${buildMemoReminderContext(messages)}
${await buildListeningTogetherContext(character)}

${momentsListPrompt}

${momentsNewsPrompt}

${getMemesSuggestion(messages.filter(m => m.type === 'sent').slice(-1)[0]?.content || '', 3)}
---
**OK，${userNickname} 刚给你发了消息。**
结合你的状态（${statusText}）和心情，回一条（或几条）像真人的消息。
不要加开头（如"好的"、"回复："），直接输出消息内容：`
}

/**
 * 构建统一记忆上下文
 */
const buildUnifiedMemoryContext = async (characterId: string, userName: string): Promise<string> => {
  try {
    const { unifiedMemoryService } = await import('../services/unifiedMemoryService')
    const memories = await unifiedMemoryService.getMemoriesByCharacter(characterId)
    
    console.log(`\n📚 ========== AI记忆读取 [${characterId}] ==========`)
    console.log(`总记忆数: ${memories.length}`)
    
    if (memories.length === 0) {
      console.log('⚠️ 该角色暂无记忆')
      console.log('📚 ========================================\n')
      return ''
    }
    
    // 按时间倒序排列，获取最近10条（不分类，统一显示）
    const sortedMemories = memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
    
    // 完整打印每条记忆（不截断）
    console.log(`\n🔍 AI将读取的记忆（最近${sortedMemories.length}条，完整内容）:`)
    sortedMemories.forEach((m, index) => {
      console.log(`\n--- 记忆 ${index + 1} ---`)
      console.log(`ID: ${m.id}`)
      console.log(`类型: ${m.domain}`)
      console.log(`标题: ${m.title}`)
      console.log(`内容: ${m.summary}`)  // 完整内容，不截断
      console.log(`重要度: ${m.importance}`)
      console.log(`标签: ${m.tags.join(', ') || '无'}`)
      console.log(`时间: ${new Date(m.timestamp).toLocaleString('zh-CN')}`)
      if (m.timeRange) {
        console.log(`对话时间范围: ${new Date(m.timeRange.start).toLocaleString('zh-CN')} ~ ${new Date(m.timeRange.end).toLocaleString('zh-CN')}`)
      }
    })
    
    // 格式化记忆时间范围（精确到小时分钟）
    const formatMemoryTimeRange = (memory: any) => {
      if (!memory.timeRange) {
        // 如果没有时间范围，显示提取时间
        const date = new Date(memory.timestamp)
        return `${date.getMonth() + 1}月${date.getDate()}日`
      }
      
      const startDate = new Date(memory.timeRange.start)
      const endDate = new Date(memory.timeRange.end)
      
      const formatDateTime = (d: Date) => 
        `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      
      // 格式化为"11/28 22:24 到 11/28 22:29"
      return `${formatDateTime(startDate)} 到 ${formatDateTime(endDate)}`
    }
    
    // 统一显示所有记忆（按时间顺序，不分类）
    const memoryText = sortedMemories.map(m => 
      `- ${m.title}（${formatMemoryTimeRange(m)}）：${m.summary}`
    ).join('\n')
    
    const finalContext = `
══════════════════════════════════

💭 你和 ${userName} 的回忆片段（这些是你们相处过程中的重要瞬间）：
${memoryText}

这些是你记下的小日记，记录了你们之间发生过的事和当时的感受。当对方问"你还记得吗""上次那个事"这类问题时，可以自然地回忆起来。不要机械复述，像真的在回忆一样。

══════════════════════════════════
`
    
    console.log('\n📝 AI最终读取的记忆上下文（完整，无截断）:')
    console.log(finalContext)
    console.log('📚 ========================================\n')
    
    return finalContext
  } catch (error) {
    console.error('加载统一记忆失败:', error)
    return ''
  }
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
    
    // 🔥 检测用户是否刚切歌
    const changedAt = data.changedAt || data.startTime
    const changedBy = data.changedBy
    const timeSinceChange = Math.floor((Date.now() - changedAt) / 1000)
    const recentlyChanged = timeSinceChange < 30 // 30秒内算刚切歌
    
    let songChangeContext = ''
    if (recentlyChanged && changedBy === 'user') {
      songChangeContext = `\n💡 注意：${userName}刚刚切换到了这首歌（${timeSinceChange}秒前），你可以对这首歌发表看法或回应用户的选择。`
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
- ❗️ 想换歌时必须用[切歌:歌名:歌手]，不要用[一起听:歌名:歌手]！
- 你们已经在一起听了，不需要再发邀请，直接切歌即可
- 不要假装听不到或说"我听不到"，你是真的在和对方一起听
- 可以自然地讨论歌曲、哼唱几句、或表达对音乐的感受
- 时间流逝是真实的，你们已经一起听了${durationText}，可以自然地提及这段共同的时光${songChangeContext}
`
  } catch (e) {
    return ''
  }
}

/**
 * 构建关心提醒（检测用户提到饿、没钱、吃饭等，提示AI主动付款）
 */
function buildCareReminderContext(messages: Message[]): string {
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
function buildMemoReminderContext(messages: Message[]): string {
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
function buildNicknameCoupleReminderContext(userNickname: string, characterId: string): string {
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
function buildQuoteReminderContext(messages: Message[]): string {
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
  settings: ApiSettings,
  enableTheatreCards: boolean = true
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
    // 智能检测：根据模型名称自动判断，用户设置优先级更低
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
    const modelSupportsVision = visionModels.some(model => modelLower.includes(model))
    
    // 🔥 如果模型本身支持视觉，自动开启（不管用户是否手动设置）
    let supportsVision = settings.supportsVision
    if (modelSupportsVision) {
      supportsVision = true
      console.log(`🤖 [智能检测] 模型 "${settings.model}" 支持视觉识别，自动开启`)
    } else if (supportsVision === undefined) {
      supportsVision = false
      console.log(`🤖 [智能检测] 模型 "${settings.model}" 不支持视觉识别`)
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
    
    // 🔥 强制日志：检测多模态消息
    console.log('🚀 发送给AI的消息数量:', processedMessages.length)
    const multimodalMsgs = processedMessages.filter((m: any) => Array.isArray(m.content))
    console.log('🖼️ 包含图片的消息数量:', multimodalMsgs.length)
    if (multimodalMsgs.length > 0) {
      console.log('🖼️ 多模态消息详情:', multimodalMsgs.map((m: any) => ({
        role: m.role,
        contentTypes: m.content.map((c: any) => c.type)
      })))
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
    
    // 规范化消息角色：仅保留首条 system（人设指令），其余 system 统一降级为 user，避免覆盖/稀释人设
    const normalizedMessages = processedMessages.map((m: any, idx: number) => {
      if (idx === 0) return m
      if (m && m.role === 'system') {
        return { ...m, role: 'user' as const }
      }
      return m
    })

    // 检查是否启用流式（仅线下模式）
    const offlineStreamEnabled = localStorage.getItem('offline-streaming') === 'true'
    const isOfflineRequest = localStorage.getItem('current-scene-mode') === 'offline'
    const useStreaming = offlineStreamEnabled && isOfflineRequest
    
    // 🔥 线下模式设置
    let maxTokens: number | undefined
    let temperature = settings.temperature ?? 0.7
    
    if (isOfflineRequest) {
      // 🎯 线下模式：完全不设置max_tokens，让API使用默认最大值
      // 字数控制100%通过提示词中的{{targetWordCount}}实现
      maxTokens = undefined  // 强制设为undefined，完全忽略settings.maxTokens
      console.log(`📏 [线下模式] 强制不设置max_tokens（忽略API配置中的maxTokens，完全由提示词控制）`)
      
      // 读取用户在高级设置中配置的温度
      const userTemperature = localStorage.getItem('offline-temperature')
      if (userTemperature) {
        temperature = parseFloat(userTemperature)
        console.log(`🌡️ [线下模式] 使用用户设置的温度: ${temperature}`)
      }
    } else {
      // 非线下模式：使用API配置中的maxTokens
      maxTokens = settings.maxTokens ?? 4000
    }
    
    const requestBody: any = {
      model: settings.model,
      messages: normalizedMessages,
      temperature: temperature,
      ...(useStreaming ? { stream: true } : {})
    }
    
    // 只在非线下模式或有明确设置时才添加max_tokens
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }
    
    // 🎭 添加小剧场 Function Calling 工具（仅在线上模式启用）
    // 🔧 临时开关：如果 localStorage 中设置了 disable-function-calling，则禁用
    const disableFunctionCalling = localStorage.getItem('disable-function-calling') === 'true'
    
    if (import.meta.env.DEV) {
      console.log('🎭 [小剧场] 检查条件:', {
        isOfflineRequest,
        disableFunctionCalling,
        provider: settings.provider,
        model: settings.model,
        modelLower: settings.model?.toLowerCase()
      })
    }
    
    if (!isOfflineRequest && !disableFunctionCalling) {
      // 判断是否是 Gemini 模型
      const isGemini = settings.provider === 'google' || 
                       settings.model?.toLowerCase().includes('gemini')
      
      if (import.meta.env.DEV) {
        console.log('🎭 [小剧场] isGemini:', isGemini)
      }
      
      // 🔧 仅在启用小剧场功能时添加 THEATRE_TOOL
      if (enableTheatreCards) {
        // 对于 custom provider，统一使用 OpenAI 格式（更通用）
        if (settings.provider === 'custom') {
          requestBody.tools = [{
            type: 'function',
            function: THEATRE_TOOL
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (OpenAI 格式 - custom provider)')
          }
        }
        // Google 官方 API 使用 Gemini 原生格式
        else if (settings.provider === 'google') {
          requestBody.tools = [{
            function_declarations: [THEATRE_TOOL]
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (Gemini 原生格式)')
            console.log('🎭 [小剧场] 工具定义:', THEATRE_TOOL)
          }
        }
        // OpenAI 官方 API
        else if (settings.provider === 'openai') {
          requestBody.tools = [{
            type: 'function',
            function: THEATRE_TOOL
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (OpenAI 格式)')
          }
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('🎭 [小剧场] 功能已关闭，不传递 THEATRE_TOOL')
        }
      }
    } else {
      if (import.meta.env.DEV) {
        if (disableFunctionCalling) {
          console.log('🎭 [小剧场] Function Calling 已手动禁用')
        } else {
          console.log('🎭 [小剧场] 线下模式，跳过 Function Calling')
        }
      }
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
    
    // 🎭 先解析小剧场 tool_calls（因为 Function Calling 时可能没有 content）
    const { parseTheatreToolCalls } = await import('./theatreTools')
    const toolCalls = parseTheatreToolCalls(data)
    
    if (toolCalls.length > 0 && import.meta.env.DEV) {
      console.log('🎭 [小剧场] 检测到 tool_calls:', toolCalls)
    }
    
    // 尝试从不同的响应格式中提取内容
    let content: string | undefined
    
    // 1. 标准 OpenAI 格式
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content
    }
    // 2. Google Gemini 格式 - 需要过滤掉 functionCall 的 parts
    else if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      // 只提取 text 类型的 parts，忽略 functionCall
      const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text)
      if (textParts.length > 0) {
        content = textParts.join('')
      }
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
    
    // 🎭 如果有 tool_calls，content 可以为空（纯 Function Calling 响应）
    if (!content && toolCalls.length === 0) {
      console.error('API响应格式不符合预期，实际结构:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasCandidates: !!data.candidates,
        hasText: !!data.text,
        hasResponse: !!data.response,
        hasContent: !!data.content,
        hasError: !!data.error,
        hasToolCalls: toolCalls.length > 0,
        fullData: data
      })
      throw new ChatApiError(
        `API响应格式错误或内容为空，请检查API配置`, 
        'INVALID_RESPONSE'
      )
    }
    
    // 如果只有 tool_calls 没有 content，设置一个空字符串避免后续报错
    if (!content && toolCalls.length > 0) {
      content = ''
      if (import.meta.env.DEV) {
        console.log('🎭 [小剧场] 纯 Function Calling 响应，content 为空')
      }
    }

    // 提取finish_reason用于诊断
    let finishReason: string | undefined
    if (data.choices?.[0]?.finish_reason) {
      finishReason = data.choices[0].finish_reason
    } else if (data.candidates?.[0]?.finishReason) {
      finishReason = data.candidates[0].finishReason
    }
    
    // 返回内容和usage信息
    return {
      content,
      usage: data.usage || null,
      finish_reason: finishReason,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    } as any

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
  settings: ApiSettings,
  enableTheatreCards: boolean = true
): Promise<ApiResponse> => {
  const MAX_RETRIES = 3 // 最大重试次数
  let lastError: ChatApiError | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callAIApiInternal(messages, settings, enableTheatreCards)
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
  
  // 🔥 只显示最近3天内的朋友圈，避免很久以前的一直提醒AI
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()
  
  // 🔥 小号模式：不显示用户（主账号）的朋友圈，因为小号是陌生人
  const isSubAccount = !isMainAccount()
  
  // 显示用户发的朋友圈 + AI自己发的朋友圈，且在3天内
  // 小号模式下只显示AI自己的朋友圈
  const visibleToAI = allMoments.filter(m => {
    const isUserMoment = m.userId === 'user'
    const isAIMoment = m.userId === characterId
    const isRecent = now - m.createdAt < THREE_DAYS_MS
    
    // 小号模式：不显示主账号的朋友圈
    if (isSubAccount && isUserMoment) {
      return false
    }
    
    return (isUserMoment || isAIMoment) && isRecent
  })
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
    
    // 🔥 处理朋友圈图片：区分已识别和未识别的
    let imagesText = ''
    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      // 🔥 分离已识别和未识别的图片
      const recognizedImages = m.images.filter(img => img.description)
      const unrecognizedImages = m.images.filter(img => !img.description && img.url)
      
      // 🔥 已识别的图片：只显示描述文字，不发送base64
      if (recognizedImages.length > 0) {
        const descriptionsText = recognizedImages.map((img, i) => `图${i + 1}:${img.description}`).join('；')
        imagesText = `\n  📷 配图（${recognizedImages.length}张）：${descriptionsText}`
        console.log(`✅ [朋友圈${number}] 已识别${recognizedImages.length}张图片，使用文字描述`)
      }
      
      // 🔥 未识别的图片：收集base64，让AI识别（仅用户的朋友圈）
      if (unrecognizedImages.length > 0 && m.userId === 'user') {
        console.log(`🔍 [朋友圈${number}] 发现${unrecognizedImages.length}张未识别图片，需要AI识别`)
        
        unrecognizedImages.forEach((img, imgIndex) => {
          collectedMomentImages.push({
            momentId: m.id,
            momentIndex: index + 1,
            imageId: img.id,
            imageUrl: img.url,
            description: `朋友圈${number}的第${imgIndex + 1}张图片（待识别）`
          })
        })
        
        // 如果有未识别的，也标记一下
        if (recognizedImages.length === 0) {
          imagesText = `\n  📷 配图：${unrecognizedImages.length}张（待识别）`
        }
      }
      
      // 如果没有任何图片信息，显示数量
      if (!imagesText) {
        imagesText = `\n  📷 配图：${m.images.length}张`
      }
    }
    
    // 🔥 点赞和评论中，如果是AI自己的，显示为"你"，让AI知道自己已经互动过
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userId === characterId ? '你' : l.userName).join('、')}` 
      : ''
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userId === characterId ? '你' : c.userName}: ${c.content}`).join('\n')}` 
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

${hasUserMomentImages ? `
⚠️ 有${collectedMomentImages.length}张新图片需要识别，请在回复开头用以下格式标记每张图片内容（之后不再发送这些图片）：
[图片识别:朋友圈ID|图片ID|简短描述15字内]
例：[图片识别:123456|img1|蓝天白云下的草地]

识别后可以自然地评论图片中的具体内容。` : ''}
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

✨ 你也可以发朋友圈（但不是随便想发就发）：

**基本格式**：
朋友圈：内容

**高级功能（可选）**：
朋友圈：内容|仅某某可见|@某某 @某某

例如：
朋友圈：今天心情不错
朋友圈：刚吃了超好吃的火锅🔥
朋友圈：有点想你了|仅用户可见
朋友圈：今天和朋友出去玩啦|@用户 @小明

🧠 什么时候更适合发一条朋友圈（通用原则）：
- 你这边的情绪有明显波动：特别开心、特别丧、委屈、生气、想念、紧张前的自我打气等；
- 和用户聊到某件事很有感觉，想单独留一条属于自己的记录（可以顺手@对方，或者设成仅对方可见的小心机）；
- 生活里刚发生了值得记一下的小事：吃到好吃的、出门玩、加班到很晚、刚考完试、突然下暴雨等；
- 你真的有「想发一条给别人看到」的冲动，而不是为了测试功能或完成任务。

⚠️ 注意：
- 朋友圈发出后，其他人（可能是你的朋友、用户认识的人）会看到；
- 他们可能会点赞或评论你的朋友圈；
- 想发就发，不用太克制，但内容要符合你的性格、你和用户当前的关系，以及当下的心情；
- "仅xx可见"可以设置只让特定人看到（小心机）；
- "@某某"可以提到某个人，让TA收到通知。

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
