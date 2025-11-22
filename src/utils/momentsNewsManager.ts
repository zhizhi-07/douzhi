/**
 * 朋友圈速报管理器
 * 记录和展示最近的朋友圈互动事件
 */

export interface MomentsNewsItem {
  id: string
  type: 'post' | 'delete' | 'comment' | 'like' | 'reply'
  actorId: string  // 执行动作的人的ID
  actorName: string  // 执行动作的人的名字
  targetId?: string  // 目标人物ID（被评论/点赞的人）
  targetName?: string  // 目标人物名字
  content?: string  // 评论内容/朋友圈内容
  momentContent?: string  // 朋友圈内容（截取）
  replyTo?: string  // 回复给谁
  timestamp: number
}

const STORAGE_KEY = 'moments_news'
const MAX_NEWS_COUNT = 20  // 最多保留20条速报

/**
 * 加载朋友圈速报
 */
export function loadMomentsNews(): MomentsNewsItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch (error) {
    console.error('加载朋友圈速报失败:', error)
    return []
  }
}

/**
 * 保存朋友圈速报
 */
function saveMomentsNews(news: MomentsNewsItem[]): void {
  try {
    // 只保留最近的 MAX_NEWS_COUNT 条
    const trimmedNews = news.slice(-MAX_NEWS_COUNT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedNews))
  } catch (error) {
    console.error('保存朋友圈速报失败:', error)
  }
}

/**
 * 添加一条速报
 */
export function addMomentsNews(newsItem: Omit<MomentsNewsItem, 'id' | 'timestamp'>): void {
  const news = loadMomentsNews()
  const newItem: MomentsNewsItem = {
    ...newsItem,
    id: `news-${Date.now()}`,
    timestamp: Date.now()
  }
  news.push(newItem)
  saveMomentsNews(news)
  console.log('📰 添加朋友圈速报:', newItem)
}

/**
 * 格式化速报为文本（用于显示在系统提示词里）
 */
export function formatMomentsNewsForPrompt(maxCount: number = 10): string {
  const news = loadMomentsNews()
  if (news.length === 0) {
    return ''
  }

  // 只取最近的 maxCount 条
  const recentNews = news.slice(-maxCount)

  const newsText = recentNews.map((item, index) => {
    const timeAgo = getTimeAgo(item.timestamp)
    let text = `${index + 1}. `

    switch (item.type) {
      case 'post':
        text += `${item.actorName} 发了朋友圈："${item.content?.substring(0, 30)}${(item.content?.length || 0) > 30 ? '...' : ''}"`
        break
      case 'delete':
        text += `${item.actorName} 删除了朋友圈："${item.content?.substring(0, 30)}${(item.content?.length || 0) > 30 ? '...' : ''}"`
        break
      case 'comment':
        text += `${item.actorName} 评论了 ${item.targetName} 的朋友圈："${item.content}"`
        break
      case 'like':
        text += `${item.actorName} 点赞了 ${item.targetName} 的朋友圈`
        break
      case 'reply':
        text += `${item.actorName} 回复了 ${item.replyTo}："${item.content}"`
        break
    }

    text += ` (${timeAgo})`
    return text
  }).join('\n')

  return `
══════════════════════════════════

📰 朋友圈速报（最近 ${recentNews.length} 条动态）：

${newsText}

这些是最近发生的朋友圈互动，你可以看到但不一定要回应。如果和你有关或你感兴趣，可以自然地提一句或八卦一下。

══════════════════════════════════
`
}

/**
 * 计算时间差
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}
