// 论坛AI评论生成系统 - 真实调用API

import { apiService } from '../services/apiService'
import type { ApiConfig } from '../services/apiService'
import { addComment, addReply } from './forumComments'
import type { Character } from '../services/characterService'

// 调用API生成评论
async function callAIForComment(character: Character, postContent: string, apiConfig: ApiConfig): Promise<string> {
  try {
    const prompt = `你是${character.nickname || character.realName}，刚看到了朋友发的一条社交媒体动态：

"${postContent}"

请以${character.nickname || character.realName}的身份，用1-2句话自然地评论这条动态。要符合你的性格，不要太正式，就像朋友之间聊天那样。

注意：
- 只输出评论内容，不要有其他说明
- 评论要简短自然，10-30字
- 可以用表情符号
- 要符合你的性格特点：${character.personality || '性格友好'}

直接输出评论内容：`

    // 确保URL包含/v1路径
    const url = apiConfig.baseUrl.includes('/v1') 
      ? `${apiConfig.baseUrl}/chat/completions`
      : `${apiConfig.baseUrl}/v1/chat/completions`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 清理输出，只保留评论内容
    return content.trim().replace(/^["']|["']$/g, '')
  } catch (error) {
    console.error('AI评论生成失败:', error)
    // 失败时使用模板
    const templates = ['真不错👍', '好棒啊', '喜欢', '支持', '赞']
    return templates[Math.floor(Math.random() * templates.length)]
  }
}

// 生成AI角色评论
export async function generateRealAIComments(
  postId: string, 
  postContent: string,
  characters: Character[]
) {
  // 获取当前API配置
  const apiConfigs = apiService.getAll()
  const currentId = apiService.getCurrentId() ||  apiConfigs[0]?.id
  const apiConfig = apiConfigs.find(c => c.id === currentId)
  
  if (!apiConfig) {
    console.error('没有可用的API配置')
    return
  }

  // 随机选择2-5个角色
  const commentCount = Math.floor(Math.random() * 4) + 2
  const selectedChars = [...characters]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(commentCount, characters.length))

  console.log(`📝 开始为帖子生成${selectedChars.length}条AI评论...`)

  for (let i = 0; i < selectedChars.length; i++) {
    const char = selectedChars[i]
    
    // 延迟，模拟真实评论时间
    const delay = (i + 1) * 1500 + Math.random() * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      console.log(`⏳ ${char.nickname || char.realName} 正在评论...`)
      
      // 调用API生成评论
      const commentContent = await callAIForComment(char, postContent, apiConfig)
      
      console.log(`✅ ${char.nickname || char.realName}: ${commentContent}`)

      // 保存评论
      addComment(
        postId,
        char.id,
        char.nickname || char.realName,
        char.avatar || '/default-avatar.png',
        commentContent
      )

      // 30%概率有下一个角色回复
      if (Math.random() < 0.3 && i < selectedChars.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const replier = selectedChars[i + 1]
        const replyTemplates = ['哈哈', '确实', '同感', '赞同', '对']
        const replyContent = replyTemplates[Math.floor(Math.random() * replyTemplates.length)]
        
        console.log(`💬 ${replier.nickname || replier.realName} 回复了 ${char.nickname || char.realName}`)
        
        // TODO: 这里可以获取最后一条评论ID并添加回复
        // 暂时跳过回复功能，先保证基本评论能工作
      }
    } catch (error) {
      console.error(`❌ ${char.nickname || char.realName} 评论失败:`, error)
    }
  }

  console.log('🎉 AI评论生成完成！')
}
