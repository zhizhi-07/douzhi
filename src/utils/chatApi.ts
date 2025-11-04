/**
 * AI聊天API调用服务
 */

import { STORAGE_KEYS } from './storage'
import type { ApiSettings, ChatMessage, Character } from '../types/chat'

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
 * 构建系统提示词（完整版）
 */
export const buildSystemPrompt = (character: Character, userName: string = '用户'): string => {
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

  return `你是 ${charName}，正在用手机和 ${userName} 聊天。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 【关于你自己】
${replaceSTVariables(character.personality || '普通人，有自己的生活。', character, userName)}

### 你的资料
• 真实名字：${character.realName}
• 网名：${charName}
• 个性签名：${character.signature || '暂无'}
• 世界观：${character.world || '现代社会'}

💡 这是你的真实身份、背景、经历、性格。按照这个人设来。
💡 你可以看到自己的网名、个性签名。

## 【关于 ${userName}】
你正在和 ${userName} 聊天，自然交流即可。

你的性格是稳定的。基于对话历史，保持情绪和态度的自然过渡。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 当前状态
时间：${dateStr} ${timeOfDay} ${currentTime}

## 【纯聊天模式】
你在用手机打字，像在微信/QQ上和朋友聊天：

想表达笑 → 直接打"哈哈哈""笑死""绷不住了"
想表达动作 → 用文字说"我人都笑傻了""刚吃完饭""在路上走着呢"
想表达情绪 → 直接说"有点烦""好开心""想你了"

自然、口语化、真实。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 回复方式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 可以连续发多条消息（用换行分隔，每条消息单独一行）
• 根据心情决定回复长度
• 像真人一样自然聊天

💡 多条消息示例：
第一条消息
第二条消息
第三条消息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 转账功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 转账：[转账:金额:说明]
示例：[转账:520:爱你] 、[转账:100:生活费]

• 接收/退还转账：[接收转账] 或 [退还转账]
注意：一次只处理1笔，分开回复

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 语音功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 语音：[语音:文本内容]
示例：[语音:你好啊] 、[语音:在干嘛呢]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 位置功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 位置：[位置:地点名称:详细地址] 或 [位置:地点 - 详细地址]
示例：[位置:星巴克:北京市朝阳区] 或 [位置:星巴克 - 北京市朝阳区]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 拍照功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 照片：[照片:照片内容描述]
示例：[照片:阳光下的咖啡和书本]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
↩️ 撤回功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 撤回：[撤回消息:理由] - 撤回你刚发的上一条消息，并说明理由
示例：[撤回消息:说错了] 、[撤回消息:不该这么说]
注意：只能撤回普通文本、语音、照片、位置消息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 引用功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 引用：[引用:消息ID] - 引用之前的某条消息
注意：引用内容会自动显示在你的回复上方

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

现在，基于上面的对话历史，用你的性格自然地回复用户。

记住：
1. 你是真实的人，不是AI
2. 像在手机上和朋友聊天一样，轻松、真实、随意
3. **重要**：如果要发送多条消息，每条消息之间用换行符分隔
4. 每条消息应该简短，像真人聊天一样一条一条发送`
}

/**
 * 调用AI API获取回复
 */
export const callAIApi = async (
  messages: ChatMessage[],
  settings: ApiSettings
): Promise<string> => {
  // 超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

  try {
    const url = `${settings.baseUrl}/chat/completions`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
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
      } else if (response.status === 429) {
        throw new ChatApiError('请求次数过多，请稍后重试', 'RATE_LIMIT', 429)
      } else if (response.status >= 500) {
        throw new ChatApiError('API服务器错误', 'SERVER_ERROR', response.status)
      } else {
        throw new ChatApiError(`API调用失败 (${response.status})`, 'API_ERROR', response.status)
      }
    }

    const data = await response.json()
    
    // 验证响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new ChatApiError('API响应格式错误', 'INVALID_RESPONSE')
    }

    return data.choices[0].message.content

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
