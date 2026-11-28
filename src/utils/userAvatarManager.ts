/**
 * 用户头像识别管理系统
 * 全局管理用户头像的AI识别、存储和变更历史
 */

import type { ChatMessage } from '../types/chat'

export interface UserAvatarInfo {
  description: string  // AI识别的头像描述
  identifiedAt: number  // 识别时间戳
  avatarUrl: string  // 头像URL（用于检测变化）
}

export interface UserAvatarHistory {
  current: UserAvatarInfo | null
  history: Array<{
    description: string
    changedAt: number
    previousDescription: string
  }>
}

const STORAGE_KEY = 'user_avatar_info'
function storageKey(accountId = localStorage.getItem('current_account_id') || 'main') {
  return accountId === 'main' ? STORAGE_KEY : `${STORAGE_KEY}_${accountId}`
}

/**
 * 生成头像指纹（用于快速比较，避免存储完整base64）
 */
function getAvatarFingerprint(avatarUrl: string): string {
  if (!avatarUrl) return ''
  // 使用前100字符 + 长度 + 后50字符作为指纹
  const len = avatarUrl.length
  const prefix = avatarUrl.substring(0, 100)
  const suffix = avatarUrl.substring(Math.max(0, len - 50))
  return `${prefix}|${len}|${suffix}`
}

/**
 * 获取用户头像信息
 */
export function getUserAvatarInfo(accountId?: string): UserAvatarHistory {
  try {
    const saved = localStorage.getItem(storageKey(accountId))
    if (saved) {
      const data = JSON.parse(saved)
      
      // 🔥 迁移旧数据：如果avatarUrl太长（超过500字符），说明是旧的完整base64格式
      // 清除旧数据，让系统重新识别一次
      if (data.current && data.current.avatarUrl && data.current.avatarUrl.length > 500) {
        console.log('🔄 [头像数据迁移] 检测到旧格式数据，需要重新识别一次')
        return {
          current: null,
          history: []
        }
      }
      
      return data
    }
  } catch (error) {
    console.error('读取用户头像信息失败:', error)
  }
  
  return {
    current: null,
    history: []
  }
}

/**
 * 保存用户头像信息
 */
export function saveUserAvatarInfo(info: UserAvatarHistory, accountId?: string): void {
  try {
    localStorage.setItem(storageKey(accountId), JSON.stringify(info))
    console.log('💾 用户头像信息已保存')
  } catch (error) {
    console.error('保存用户头像信息失败:', error)
  }
}

/**
 * 设置用户头像描述（首次识别或更新）
 */
export function setUserAvatarDescription(
  description: string,
  avatarUrl: string,
  accountId?: string
): void {
  const info = getUserAvatarInfo(accountId)
  const now = Date.now()
  
  // 使用指纹而不是完整URL
  const fingerprint = getAvatarFingerprint(avatarUrl)
  
  // 如果是首次识别
  if (!info.current) {
    info.current = {
      description,
      identifiedAt: now,
      avatarUrl: fingerprint  // 存储指纹
    }
    console.log('✨ 首次识别用户头像:', description)
    console.log('💾 头像指纹已保存')
  } else {
    // 重新识别同一张图片只更新描述，不代表用户换过头像。
    if (info.current.avatarUrl !== fingerprint) {
      info.history.push({
        description,
        changedAt: now,
        previousDescription: info.current.description
      })
    } else if (info.history.length > 0) {
      info.history[info.history.length - 1].description = description
    }
    
    info.current = {
      description,
      identifiedAt: now,
      avatarUrl: fingerprint  // 存储指纹
    }
    
    console.log('🔄 用户头像描述已更新:', description)
  }
  
  saveUserAvatarInfo(info, accountId)
}

/** 附加当前头像用于识别，不把识别请求当作头像变更事件。 */
export function addAvatarRecognitionRequest(messages: ChatMessage[], avatarUrl: string): string {
  const index = messages.map(message => message.role).lastIndexOf('user')
  if (index < 0 || !avatarUrl) return ''
  const message = messages[index]
  // 照片转换器使用 imageUrl；在这里合并，避免 API 层把数组再次包成 text。
  const { imageUrl, ...rest } = message
  const content = typeof message.content === 'string'
    ? [{ type: 'text' as const, text: message.content }]
    : message.content
  messages[index] = {
    ...rest,
    content: [
      ...content,
      ...(imageUrl ? [{ type: 'image_url' as const, image_url: { url: imageUrl } }] : []),
      { type: 'text', text: '【系统附加图片：用户当前头像，非用户本次发送的照片】' },
      { type: 'image_url', image_url: { url: avatarUrl } }
    ]
  }
  return `\n\n🖼️ 系统附加的图片是用户当前头像，仅供识别，不代表用户刚刚更换头像。请用[头像描述:xxx]客观记录其内容，约30字；无法识别时不要猜测。不要把这张图片当作用户本次发送的照片，也不要仅因本次识别而主动提起头像变化。`
}

/**
 * 检查头像是否已变化（通过URL对比）
 */
export function hasAvatarChanged(currentAvatarUrl: string): boolean {
  const info = getUserAvatarInfo()
  
  // 🔥 调试：打印当前头像URL长度
  console.log('📷 [头像检查] 当前头像URL长度:', currentAvatarUrl?.length || 0)
  
  if (!info.current) {
    console.log('📷 [头像检查] 无记录，需要首次识别')
    return true  // 没有记录，视为首次
  }
  
  // 🔥 检查描述是否是占位符（之前识别失败）
  const isPlaceholder = !info.current.description || 
    info.current.description.includes('待识别') ||
    info.current.description.includes('未识别') ||
    info.current.description.includes('无法看到') ||
    info.current.description.includes('识别失败') ||
    info.current.description.includes('不支持图片识别') ||
    info.current.description === ''
  
  if (isPlaceholder) {
    console.log('📷 [头像检查] 描述是占位符，需要重新识别:', info.current.description)
    return true
  }
  
  // 使用指纹比较
  const currentFingerprint = getAvatarFingerprint(currentAvatarUrl)
  const savedFingerprint = info.current.avatarUrl
  const changed = savedFingerprint !== currentFingerprint
  
  // 🔥 调试：打印指纹比较详情
  console.log('📷 [头像检查] 指纹比较:', {
    saved: savedFingerprint?.substring(0, 50) + '...',
    current: currentFingerprint?.substring(0, 50) + '...',
    savedLen: savedFingerprint?.length,
    currentLen: currentFingerprint?.length,
    changed
  })
  
  if (changed) {
    console.log('📷 [头像检查] 头像已变化，需要重新识别')
  } else {
    console.log('📷 [头像检查] 头像未变化，无需识别。已识别描述:', info.current.description)
  }
  
  return changed
}

/**
 * 获取头像变更历史文本（用于系统提示词）
 */
export function getAvatarHistoryText(): string {
  const info = getUserAvatarInfo()
  
  if (!info.current) {
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
  
  let text = `用户头像：${info.current.description}（${formatTime(info.current.identifiedAt)} 识别）`
  
  // 如果有变更历史，显示最近3次
  if (info.history.length > 0) {
    const recentHistory = info.history.slice(-3)
    text += '\n\n头像变更历史：'
    recentHistory.forEach(h => {
      text += `\n- ${formatTime(h.changedAt)}: 从"${h.previousDescription}"换成了"${h.description}"`
    })
  }
  
  return text
}

/**
 * 清除用户头像信息（用于测试或重置）
 */
export function clearUserAvatarInfo(): void {
  localStorage.removeItem(storageKey())
  console.log('🗑️ 用户头像信息已清除')
}

/**
 * 从AI回复中提取头像描述
 * AI会在回复中使用 [头像描述:xxx] 格式
 */
export function extractAvatarDescription(aiResponse: string): string | null {
  const match = aiResponse.match(/[\[【]头像描述[:\：]([^\]】]+)[\]】]/)
  if (match && match[1]) {
    const description = match[1].trim()
    console.log('✅ [头像识别] 从AI回复中提取到描述:', description)
    return description
  }
  return null
}

/**
 * 移除AI回复中的头像描述指令（不显示给用户）
 */
export function removeAvatarDescriptionCommand(text: string): string {
  return text.replace(/[\[【]头像描述[:\：][^\]】]+[\]】]/g, '').trim()
}
/**
 * 使用AI识别用户头像
 * @param avatarBase64 头像的base64数据
 * @returns 识别的描述文本，失败返回null
 */
export async function recognizeUserAvatar(avatarBase64: string): Promise<string | null> {
  try {
    console.log('🔍 [头像识别] 开始调用AI识别用户头像...')

    // 动态导入chatApi避免循环依赖
    const { callAIApi, getApiSettings } = await import('./chatApi')

    // 获取API设置
    const apiSettings = getApiSettings()
    if (!apiSettings) {
      console.error('❌ [头像识别] 未配置API设置')
      return null
    }

    // 🔥 降级处理：检查API是否支持视觉识别
    if (!apiSettings.supportsVision) {
      console.warn('⚠️ [头像识别] 当前API不支持视觉识别，跳过头像识别')
      console.warn('💡 [头像识别] 如需使用头像识别功能，请切换到支持视觉识别的API（如Gemini）')
      return null
    }

    // 构建识别提示词
    const prompt = `请描述这张头像图片的内容，要求：

【描述内容】
1. 主体是什么（人物/动物/物品/风景等）
2. 主要特征（颜色、表情、姿态、装饰等）
3. 整体风格或氛围

【要求】
- 用2-3句话描述，不超过50字
- 客观描述，突出最显眼的特征
- 不要主观评价或过度修饰
- 如果是人物，可提及发型、表情、穿着等
- 如果是物品/动物，可提及颜色、形状、特殊标记等

【示例】
- "一只橘色的短毛猫，圆圆的眼睛，正在看镜头，表情呆萌"
- "一个穿白色连衣裙的女孩，长直黑发，在海边，背景是蓝天白云"
- "蓝天白云下的雪山，山顶被阳光照亮，很壮观"

现在请描述这张头像：`

    // 调用AI API
    const response = await callAIApi(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: avatarBase64
              }
            }
          ]
        }
      ],
      apiSettings
    )

    const description = response.content.trim()
    console.log('✅ [头像识别] AI识别结果:', description)

    return description

  } catch (error) {
    console.error('❌ [头像识别] 识别失败:', error)
    return null
  }
}
