/**
 * forumAIEcosystem.ts - AI驱动的话题社交生态系统
 * 
 * 用户创建话题后，AI角色会自动：
 * - 发布相关帖子（支持、反对、跑题、讨论等多样化内容）
 * - 在帖子下评论
 * - 楼中楼互相争论
 * - 点赞互动
 * 
 * 【优化版】一次API调用生成所有内容，角色完全随机不固定
 */

import type { ForumTopic } from '../types/forum'
import { createPost, createComment, updatePost } from './forumManager'

// ==================== 类型定义 ====================

interface EcosystemData {
  characters: Array<{
    name: string
    avatar: string
    personality: string
  }>
  posts: Array<{
    author: string
    content: string
    likes: number
  }>
  comments: Array<{
    postIndex: number // 评论在哪个帖子下（0表示第一个帖子）
    author: string
    content: string
    replyTo?: string // 回复谁（楼中楼）
    likes: number
  }>
}

// ==================== AI API调用 ====================

/**
 * 获取配置的API
 */
function getConfiguredAPI() {
  const apiSettings = localStorage.getItem('apiSettings')
  if (!apiSettings) {
    throw new Error('请先在设置中配置API')
  }
  
  try {
    const settings = JSON.parse(apiSettings)
    return {
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
    }
  } catch {
    throw new Error('API配置格式错误')
  }
}

/**
 * 【核心】一次API调用生成完整的论坛生态系统
 */
async function generateCompleteEcosystem(topic: ForumTopic): Promise<EcosystemData> {
  console.log('🤖 [AI生态] 一次性调用API生成完整生态...')
  
  const api = getConfiguredAPI()
  
  const systemPrompt = `你是一个论坛生态系统生成器。根据话题一次性生成完整的讨论内容。

任务：
1. 随机创造5-8个虚拟角色（不要用固定角色，每次都不同）
2. 每个角色根据性格发一个帖子（100-300字）
3. 生成8-15条评论（在不同帖子下）
4. 部分评论要互相回复（楼中楼）
5. 随机分配点赞数

要求：
- 角色要多样化：有支持的、反对的、跑题的、杠精、幽默的、专业的等
- 角色名要创意新颖，不要用固定套路
- 内容真实自然，像真人写的
- 允许争议、骂人、开玩笑等真实场景
- 评论要有互动性，互相争论
- 【重要】每个评论和帖子的content内容不要重复书写，一次性写完即可
- 【重要】评论内容要简洁，20-100字即可，不要太长

严格返回JSON格式：
{
  "characters": [
    {"name": "角色名", "avatar": "emoji", "personality": "简短性格描述"}
  ],
  "posts": [
    {"author": "角色名", "content": "帖子内容", "likes": 点赞数}
  ],
  "comments": [
    {"postIndex": 0, "author": "角色名", "content": "评论内容", "replyTo": "回复谁（可选）", "likes": 点赞数}
  ]
}`

  const userPrompt = `话题：${topic.name}
${topic.description ? `描述：${topic.description}` : ''}

请生成一个活跃的论坛讨论生态。记住：
- 角色要随机创造，不要用固定名字
- 内容要真实有趣
- 要有争议和互动`
  
  const requestBody = {
    model: api.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.95, // 高温度，最大化随机性和创造力
    max_tokens: 4000,
  }
  
  const response = await fetch(api.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api.apiKey}`
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [AI生态] API错误:', errorText)
    throw new Error(`API调用失败: ${response.statusText}`)
  }
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  console.log('✅ [AI生态] API返回内容长度:', content.length)
  
  // 解析JSON
  try {
    const cleanedResult = content.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('未找到JSON格式')
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as EcosystemData
    console.log('✅ [AI生态] 成功解析：', {
      角色数: parsed.characters?.length || 0,
      帖子数: parsed.posts?.length || 0,
      评论数: parsed.comments?.length || 0
    })
    
    return parsed
  } catch (error) {
    console.error('❌ [AI生态] 解析失败:', error)
    throw error
  }
}

// ==================== 主函数 ====================

/**
 * 【主函数】生成话题下的完整生态系统
 * 优化：一次API调用完成所有内容生成
 */
export async function generateTopicPosts(topic: ForumTopic): Promise<void> {
  console.log(`🎭 [AI生态] 开始为话题"${topic.name}"生成内容...`)
  console.log(`⚡ [优化] 使用一次API调用生成所有内容`)
  
  try {
    // 一次API调用生成所有内容
    const ecosystem = await generateCompleteEcosystem(topic)
    
    // 验证数据
    if (!ecosystem.characters || ecosystem.characters.length === 0) {
      throw new Error('角色数据为空')
    }
    if (!ecosystem.posts || ecosystem.posts.length === 0) {
      throw new Error('帖子数据为空')
    }
    
    console.log(`✅ [AI生态] 生成了 ${ecosystem.characters.length} 个随机角色`)
    console.log(`✅ [AI生态] 生成了 ${ecosystem.posts.length} 个帖子`)
    console.log(`✅ [AI生态] 生成了 ${ecosystem.comments?.length || 0} 条评论`)
    
    // 创建角色映射表
    const characterMap = new Map<string, { name: string; avatar: string }>()
    ecosystem.characters.forEach(c => {
      characterMap.set(c.name, { name: c.name, avatar: c.avatar })
      console.log(`👤 随机角色: ${c.avatar} ${c.name} - ${c.personality}`)
    })
    
    // 创建所有帖子
    const createdPosts: string[] = []
    for (const post of ecosystem.posts) {
      const character = characterMap.get(post.author)
      if (!character) {
        console.warn(`⚠️ 未找到角色: ${post.author}`)
        continue
      }
      
      const newPost = createPost({
        author: character.name,
        authorAvatar: character.avatar,
        time: `${Math.floor(Math.random() * 60) + 1}分钟前`,
        title: post.content.substring(0, 30) + '...',
        content: post.content,
        tags: [topic.name],
      })
      
      // 立即设置点赞数
      updatePost(newPost.id, { likes: post.likes || Math.floor(Math.random() * 50) + 5 })
      
      createdPosts.push(newPost.id)
      console.log(`✅ ${character.name} 发帖 (${post.likes}赞): ${post.content.substring(0, 40)}...`)
    }
    
    // 创建所有评论
    if (ecosystem.comments && ecosystem.comments.length > 0) {
      const commentMap = new Map<string, string>() // author -> commentId，用于楼中楼
      
      for (const comment of ecosystem.comments) {
        const postIndex = comment.postIndex || 0
        const postId = createdPosts[postIndex]
        if (!postId) {
          console.warn(`⚠️ 帖子索引 ${postIndex} 不存在`)
          continue
        }
        
        const character = characterMap.get(comment.author)
        if (!character) {
          console.warn(`⚠️ 未找到评论角色: ${comment.author}`)
          continue
        }
        
        // 查找回复对象的评论ID
        let parentId: string | undefined
        if (comment.replyTo) {
          parentId = commentMap.get(comment.replyTo)
        }
        
        const newComment = createComment({
          postId,
          author: character.name,
          authorAvatar: character.avatar,
          time: `${Math.floor(Math.random() * 30) + 1}分钟前`,
          content: comment.content,
          likes: comment.likes || Math.floor(Math.random() * 20),
          parentId,
          replyTo: comment.replyTo,
        })
        
        commentMap.set(character.name, newComment.id)
        
        if (comment.replyTo) {
          console.log(`💬 ${character.name} 回复 @${comment.replyTo}: ${comment.content.substring(0, 30)}...`)
        } else {
          console.log(`💬 ${character.name} 评论: ${comment.content.substring(0, 30)}...`)
        }
      }
    }
    
    console.log(`🎉 [AI生态] 话题"${topic.name}"的生态系统创建完成！`)
    console.log(`📊 [统计] ${ecosystem.characters.length}个随机角色，${ecosystem.posts.length}个帖子，${ecosystem.comments?.length || 0}条评论`)
    
  } catch (error) {
    console.error('❌ [AI生态] 生成内容失败:', error)
    throw error
  }
}

// ==================== 模拟数据降级 ====================

/**
 * 快速预览：生成简化版的AI内容（不调用API，用于测试或API失败时降级）
 */
export function generateMockTopicContent(topic: ForumTopic): void {
  console.log(`🎭 [AI生态] 使用模拟数据生成...`)
  
  // 随机生成角色
  const randomNames = ['理性青年', '热血网友', '幽默达人', '冷静派', '杠精王', '吃瓜群众', '专业人士', '乐观者', '悲观者', '跑题达人']
  const randomAvatars = ['🤓', '🔥', '😄', '😊', '🤨', '🍉', '💻', '🌈', '😔', '😴']
  const randomPersonalities = ['理性客观', '激进热情', '幽默风趣', '温和包容', '喜欢抬杠', '围观提问', '专业严谨', '积极乐观', '消极担心', '总是跑题']
  
  const count = Math.floor(Math.random() * 4) + 5 // 5-8个角色
  const characters: Array<{name: string, avatar: string, personality: string}> = []
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * randomNames.length)
    characters.push({
      name: randomNames[index] + (Math.random() > 0.5 ? i : ''),
      avatar: randomAvatars[index],
      personality: randomPersonalities[index]
    })
  }
  
  const stances = ['support', 'oppose', 'neutral', 'offtopic', 'question']
  
  // 生成帖子
  const createdPosts: string[] = []
  characters.forEach((character, index) => {
    const stance = stances[index % stances.length]
    let content = ''
    
    switch (stance) {
      case 'support':
        content = `我觉得"${topic.name}"这个话题很有意思！${topic.description || ''} 支持！`
        break
      case 'oppose':
        content = `不太认同"${topic.name}"，我觉得这个观点有问题...`
        break
      case 'neutral':
        content = `关于"${topic.name}"，我有一些想法分享...`
        break
      case 'offtopic':
        content = `说到"${topic.name}"，我想起来另一件事...`
        break
      case 'question':
        content = `请教一下，"${topic.name}"具体是什么意思？`
        break
    }
    
    const post = createPost({
      author: character.name,
      authorAvatar: character.avatar,
      time: `${Math.floor(Math.random() * 60) + 1}分钟前`,
      title: content.substring(0, 30) + '...',
      content,
      tags: [topic.name],
    })
    
    const likes = Math.floor(Math.random() * 50) + 5
    updatePost(post.id, { likes })
    createdPosts.push(post.id)
    
    console.log(`✅ ${character.name} 发帖 (${likes}赞)`)
  })
  
  // 为前3个帖子添加评论
  const comments = [
    // 赞同类
    '这个观点挺有意思的，学到了',
    '说得很有道理，深有体会',
    '确实是这样，我也有类似经历',
    '楼主分析得很到位',
    '同意，这个角度很新颖',
    
    // 反对类
    '不太认同，我觉得有几个问题',
    '这个观点有待商榷吧',
    '感觉楼主想得太简单了',
    '恕我直言，这个有点片面',
    '我持保留意见',
    
    // 疑问类
    '能详细说说吗？有点没看懂',
    '为什么会这样啊？求解答',
    '有具体例子吗',
    '楼主能展开讲讲吗',
    
    // 吐槽类
    '哈哈哈笑死我了',
    '这也太真实了吧',
    '说到我心坎里了',
    '绷不住了',
    
    // 中立类
    '各有各的道理吧',
    '看情况而定',
    '这个话题确实值得讨论',
    '角度不同，结论不同'
  ]
  
  const replies = [
    '你说得对，我补充一点',
    '我不太同意你的观点',
    '有道理，但是我觉得',
    '这话说得有点绝对了',
    '确实如此',
    '你这么一说我明白了',
    '咱俩想到一块去了',
    '你这个角度很独特',
    '我跟你的看法不太一样',
    '说得好',
    '你这话就不对了',
    '那倒也是'
  ]
  
  for (let i = 0; i < Math.min(3, createdPosts.length); i++) {
    const commentCount = Math.floor(Math.random() * 3) + 2 // 2-4条评论
    const commenters = characters.slice(0, commentCount)
    
    commenters.forEach((commenter, idx) => {
      const replyTo = idx > 0 && Math.random() > 0.5 ? commenters[idx - 1].name : undefined
      
      // 随机选择评论内容
      const content = replyTo 
        ? `@${replyTo} ${replies[Math.floor(Math.random() * replies.length)]}`
        : comments[Math.floor(Math.random() * comments.length)]
      
      createComment({
        postId: createdPosts[i],
        author: commenter.name,
        authorAvatar: commenter.avatar,
        time: `${Math.floor(Math.random() * 30) + 1}分钟前`,
        content,
        likes: Math.floor(Math.random() * 15),
        replyTo,
      })
      
      console.log(`💬 ${commenter.name} ${replyTo ? `回复 @${replyTo}` : '评论'}`)
    })
  }
  
  console.log(`✅ [模拟数据] 生成完成`)
}
