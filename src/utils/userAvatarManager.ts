/**
 * 用户头像识别管理系统
 * 全局管理用户头像的AI识别、存储和变更历史
 */

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

/**
 * 获取用户头像信息
 */
export function getUserAvatarInfo(): UserAvatarHistory {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
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
export function saveUserAvatarInfo(info: UserAvatarHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
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
  avatarUrl: string
): void {
  const info = getUserAvatarInfo()
  const now = Date.now()
  
  // 如果是首次识别
  if (!info.current) {
    info.current = {
      description,
      identifiedAt: now,
      avatarUrl
    }
    console.log('✨ 首次识别用户头像:', description)
  } else {
    // 如果是更新（头像变化）
    info.history.push({
      description,
      changedAt: now,
      previousDescription: info.current.description
    })
    
    info.current = {
      description,
      identifiedAt: now,
      avatarUrl
    }
    
    console.log('🔄 用户头像已更新:', {
      from: info.history[info.history.length - 1].previousDescription,
      to: description
    })
  }
  
  saveUserAvatarInfo(info)
}

/**
 * 检查头像是否已变化（通过URL对比）
 */
export function hasAvatarChanged(currentAvatarUrl: string): boolean {
  const info = getUserAvatarInfo()
  if (!info.current) {
    return true  // 没有记录，视为首次
  }
  
  return info.current.avatarUrl !== currentAvatarUrl
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
  localStorage.removeItem(STORAGE_KEY)
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
    const { callAIApi } = await import('./chatApi')

    // 获取API设置
    const settings = localStorage.getItem('api_settings')
    if (!settings) {
      console.error('❌ [头像识别] 未配置API设置')
      return null
    }

    const apiSettings = JSON.parse(settings)

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
