/**
 * 论坛NPC发帖系统
 * 让社区更热闹，NPC自动生成帖子
 */

import { apiService } from '../services/apiService'
import { getAllPostsAsync, savePosts, getAllNPCs, saveNPCs } from './forumNPC'
import type { ForumPost, ForumNPC } from './forumNPC'
import { getAllCharacters } from './characterManager'
import { replaceVariables } from './variableReplacer'
import { getUserInfo } from './userUtils'
import { loadMessages } from './simpleMessageManager'
import { callZhizhiApi } from '../services/zhizhiapi'

export interface NPCPostOptions {
  count: number              // 发帖数量 1-10
  topicHint?: string         // 话题提示（用户输入，可选）
  specificCharacterId?: string  // 指定某个角色发帖
}

// 完整角色信息接口
interface FullPosterInfo {
  id: string
  name: string
  personality: string  // 完整人设
  isPublicFigure: boolean
  publicLabel?: string
  signature?: string
  recentChats?: string  // 最近聊天记录摘要
}

// 生成NPC发帖（一次API调用，包含帖子+评论+点赞）
// useZhizhiAPI: 是否使用代付API（用于自动刷新）
export async function generateNPCPosts(options: NPCPostOptions, useZhizhiAPI = false): Promise<ForumPost[]> {
  const { count, topicHint, specificCharacterId } = options
  
  console.log(`🚀 开始生成NPC帖子: 数量=${count}, 话题提示=${topicHint || '随机'}, 指定角色=${specificCharacterId || '无'}, API=${useZhizhiAPI ? 'zhizhi' : '用户'}`)
  
  // 获取API配置
  let apiConfig: { baseUrl: string; apiKey: string; model: string } | undefined
  
  if (useZhizhiAPI) {
    // 使用zhizhi代付API（随机轮询）
    console.log('📡 使用zhizhi API (随机轮询)')
  } else {
    // 使用用户当前选择的API
    const apiConfigs = apiService.getAll()
    const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
    const userApi = apiConfigs.find(c => c.id === currentId)
    if (userApi) {
      apiConfig = {
        baseUrl: userApi.baseUrl.endsWith('/chat/completions') 
          ? userApi.baseUrl 
          : userApi.baseUrl.replace(/\/?$/, '/chat/completions'),
        apiKey: userApi.apiKey,
        model: userApi.model
      }
    }
    if (!apiConfig) {
      console.error('❌ 没有可用的用户API配置')
      return []
    }
  }
  
  // 获取所有角色和NPC
  const characters = await getAllCharacters()
  const npcs = getAllNPCs()
  const userInfo = getUserInfo()
  const userName = userInfo.nickname || userInfo.realName || '用户'
  
  // 构建可用发帖者列表（包含完整信息）
  let availablePosters: FullPosterInfo[] = []
  
  // 获取角色的最近聊天记录
  const getRecentChats = async (charId: string, charName: string): Promise<string> => {
    try {
      const messages = await loadMessages(charId)
      if (!messages || messages.length === 0) return ''
      
      // 取最近10条消息
      const recent = messages.slice(-10)
      const chatSummary = recent.map(m => {
        const sender = m.type === 'sent' ? userName : charName
        const content = m.content?.slice(0, 50) || ''
        return `${sender}: ${content}${m.content && m.content.length > 50 ? '...' : ''}`
      }).join('\n')
      
      return chatSummary
    } catch {
      return ''
    }
  }
  
  // 如果指定了角色
  if (specificCharacterId) {
    const char = characters.find(c => c.id === specificCharacterId)
    if (char) {
      const recentChats = await getRecentChats(char.id, char.nickname || char.realName || '')
      const publicLabel = localStorage.getItem(`public-label-${char.id}`) || undefined
      
      availablePosters = [{
        id: String(char.id),  // 确保ID是字符串
        name: char.nickname || char.realName || 'Unknown',
        personality: replaceVariables(char.personality || '', { charName: char.nickname || char.realName, userName, character: char }),
        isPublicFigure: char.isPublicFigure || false,
        publicLabel: publicLabel && publicLabel !== '__none__' ? publicLabel : undefined,
        signature: char.signature,
        recentChats
      }]
    }
  } else {
    // 🔥 NPC为主，角色为辅（约9:1的比例）
    // 只随机选1-2个角色发帖，其余都是NPC
    const aiCharacters = characters.filter(c => c.personality)
    const shuffledChars = [...aiCharacters].sort(() => Math.random() - 0.5)
    const numCharacters = Math.min(1 + Math.floor(Math.random() * 2), shuffledChars.length) // 1-2个角色
    const selectedCharacters = shuffledChars.slice(0, numCharacters)
    
    console.log(`📌 随机选中 ${selectedCharacters.length} 个角色:`, selectedCharacters.map(c => c.nickname || c.realName))
    
    // 加载选中角色的人设
    for (const c of selectedCharacters) {
      const recentChats = await getRecentChats(c.id, c.nickname || c.realName || '')
      const publicLabel = localStorage.getItem(`public-label-${c.id}`) || undefined
      
      availablePosters.push({
        id: String(c.id),
        name: c.nickname || c.realName || 'Unknown',
        personality: replaceVariables(c.personality || '', { charName: c.nickname || c.realName, userName, character: c }),
        isPublicFigure: c.isPublicFigure || false,
        publicLabel: publicLabel && publicLabel !== '__none__' ? publicLabel : undefined,
        signature: c.signature,
        recentChats
      })
    }
    
    // 添加NPC（大部分帖子由NPC发）
    const npcList = npcs.slice(0, Math.max(8, count)).map(n => ({
      id: n.id,
      name: n.name,
      personality: n.bio || '普通社区用户，喜欢分享日常',
      isPublicFigure: false,
      recentChats: undefined
    }))
    
    availablePosters = [...availablePosters, ...npcList]
    console.log(`📌 加入 ${npcList.length} 个NPC，总共 ${availablePosters.length} 个发帖者`)
  }
  
  if (availablePosters.length === 0) {
    console.error('❌ 没有可用的发帖者')
    return []
  }
  
  // 简化日志
  const charCount = availablePosters.filter(p => p.recentChats !== undefined).length
  const npcCount = availablePosters.length - charCount
  console.log(`📋 发帖者: ${charCount}个角色 + ${npcCount}个NPC`)
  
  // 构建角色详情
  const posterDetails = availablePosters.map(p => {
    let info = `### 👤 ${p.name}`
    if (p.isPublicFigure) info += ` 【${p.publicLabel || '公众人物'}】`
    info += `\n**完整人设**：${p.personality}`
    if (p.signature) info += `\n**个性签名**：${p.signature}`
    if (p.recentChats) info += `\n**与用户${userName}的最近聊天**：\n${p.recentChats}`
    return info
  }).join('\n\n---\n\n')
  
  // 话题方向
  const topicPrompt = topicHint 
    ? `**用户指定话题**：${topicHint}` 
    : `**话题完全随机**！禁止重复以下老套话题：游戏/明星八卦/网红爆料。
请从以下方向随机选择，每条帖子话题必须不同：
- 生活琐事：做饭翻车、通勤见闻、宠物日常、租房吐槽、快递丢了
- 情感八卦：暧昧对象、前任阴影、暗恋表白、相亲奇葩、朋友撕逼
- 工作学习：摸鱼技巧、同事奇葩、考试焦虑、论文折磨、实习血泪
- 兴趣爱好：追星日常、二次元、运动健身、手工DIY、摄影分享
- 吐槽发疯：emo时刻、社死现场、奇葩经历、深夜emo、突然想到的事
- 求助分享：求推荐、求吐槽、分享好物、避雷帖子、经验分享`
  
  const prompt = `你是一个社区论坛的内容生成器。请根据每个角色的**完整人设**和**聊天记录**，生成贴合人设的帖子。

## 🎯 核心要求
1. **人设第一**：帖子内容必须100%符合角色人设！语气、用词、关注点都要贴合人设
2. **话题多样**：每条帖子话题必须不同，禁止重复套路
3. **结合聊天**：如果有聊天记录，帖子可以延续聊天中的话题或情绪

## 📝 话题方向
${topicPrompt}

## 👥 可用发帖者（仔细阅读每个人的完整信息！）

${posterDetails}

## 📤 输出格式（严格JSON！）
\`\`\`json
{
  "posts": [
    {
      "author": "发帖人名字",
      "content": "帖子内容（可包含[小剧场HTML]...[/小剧场HTML]）",
      "imagePrompt": "英文图片描述（可选，大部分不需要）",
      "likes": 点赞数,
      "comments": [{ "author": "评论人", "content": "评论内容" }]
    }
  ]
}
\`\`\`

## ✅ 发帖规则
1. **必须生成恰好${count}条帖子**，不能多不能少！
2. 每条帖子2-5条评论
3. 帖子5-150字，自然口语化，可包含emoji
4. 点赞：热门50-200，普通10-50，冷门0-10
5. imagePrompt只在需要配图时填写，大部分留空
6. **HTML小剧场不是必须的**，最多1-2条帖子用HTML，其他用普通文字
7. **禁止使用<br>标签！** 换行请用 \\n 转义符

## 💬 评论规则（重要！）
- **公众人物/明星的帖子**：评论者必须是"粉丝A/路人B/网友C/吃瓜群众"等陌生网友，用追星/围观语气
- **普通角色的帖子**：评论者可以是其他角色（如果他们认识），语气更熟悉
- 评论要简短自然，10-30字，像真实网友评论

## 🎭 中插HTML小剧场（用心设计！不要敷衍！）

可在content中使用 [小剧场HTML]...[/小剧场HTML] 包裹富文本。

**⚠️ 质量要求**：如果要用HTML，就必须认真设计！宁可不用，也不要敷衍了事。
- 不要只是简单的文字+背景色，那还不如纯文本
- 要有真正的设计感：精心的排版、配色、细节

**📌 核心原则**：模拟角色"会写/会看到/会保存"的真实物件，是剧情延展而非装饰！

**🎨 必须有的设计元素**（至少包含3个！）：
- 精心的配色方案（渐变、对比色、品牌色）
- 真实感细节：阴影、圆角、边框、质感纹理
- 拟物效果：咖啡渍、折角、胶带、手写字体、纸张纹理
- 动画效果：hover变化、渐入、呼吸效果、闪烁
- emoji装饰、颜文字、贴纸感元素

**✨ CSS动画示例**：
\`\`\`css
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
animation: float 2s infinite;
\`\`\`

**🔘 交互元素**：
- <details><summary>点击展开</summary>隐藏内容</details>
- :hover 状态变化（颜色、大小、阴影）

**📂 模块类型示例**：
- **行为类**：手写便签、留言纸条、涂改草稿、课堂笔记、搜索记录
- **数码类**：聊天气泡、草稿箱、播放器界面、弹幕、视频截图
- **现实类**：外卖订单、转账截图、鲜花发票、签收单、闹钟提示
- **情绪类**：撕裂纸条、墨迹晕染、被划掉的句子、心率曲线
- **空间类**：墙角刻字、快递盒涂写、明信片折痕、梦境相片
- **交互类**：翻转卡片、情绪选择、点信封展开、心理测试、点亮文字

**🖼️ 图片**：使用 https://image.pollinations.ai/prompt/{英文关键词}
**⚠️ 图片规则**：
- 人物禁止真人！必须加"anime style"或"illustration"
- 食物、物品、风景等可以用真实风格
- 不要生成健身/gym相关图片

**只输出JSON，不要任何解释！**`

  // 打印完整prompt
  console.log('='.repeat(60))
  console.log('📝 完整Prompt:')
  console.log(prompt)
  console.log('='.repeat(60))

  try {
    console.log('📤 请求AI生成帖子...')
    
    let content = ''
    
    if (useZhizhiAPI) {
      // 使用随机轮询的代付API
      content = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.9, max_tokens: 32000 }
      )
    } else {
      // 使用用户API
      const response = await fetch(apiConfig!.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig!.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig!.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 32000
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        console.error('❌ API错误:', data.error)
        return []
      }
      
      content = data.choices?.[0]?.message?.content?.trim() || ''
    }
    
    console.log('📥 AI返回:', content.slice(0, 500) + '...')
    
    // 提取JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*"posts"[\s\S]*/)
    if (jsonMatch) {
      content = jsonMatch[1] || jsonMatch[0]
    }
    
    // 修复截断的JSON - 提取所有完整的帖子对象
    const fixTruncatedJson = (json: string): string => {
      // 找到 posts 数组开始的位置
      const postsStart = json.indexOf('"posts"')
      if (postsStart === -1) return json
      
      const arrayStart = json.indexOf('[', postsStart)
      if (arrayStart === -1) return json
      
      // 从数组开始位置提取所有完整的对象
      const posts: string[] = []
      let depth = 0
      let start = -1
      let inString = false
      let escape = false
      
      for (let i = arrayStart; i < json.length; i++) {
        const char = json[i]
        
        if (escape) {
          escape = false
          continue
        }
        if (char === '\\') {
          escape = true
          continue
        }
        if (char === '"' && !escape) {
          inString = !inString
          continue
        }
        if (inString) continue
        
        if (char === '{') {
          if (depth === 0) start = i  // 帖子对象开始
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0 && start !== -1) {
            // 帖子对象结束
            posts.push(json.slice(start, i + 1))
            start = -1
          }
        }
      }
      
      console.log(`🔧 修复截断JSON: 从原始内容中提取到 ${posts.length} 个完整帖子对象`)
      
      if (posts.length > 0) {
        return `{"posts": [${posts.join(',')}]}`
      }
      
      return json
    }
    
    // 解析JSON
    let parsed: { posts: Array<{
      author: string
      content: string
      imagePrompt?: string
      likes: number
      comments: Array<{ author: string; content: string }>
    }> }
    
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      console.warn('⚠️ JSON解析失败，尝试修复...')
      try {
        const fixed = fixTruncatedJson(content)
        parsed = JSON.parse(fixed)
        console.log('✅ JSON修复成功')
      } catch (e2) {
        console.error('❌ JSON修复失败:', e2)
        return []
      }
    }
    
    if (!parsed.posts || !Array.isArray(parsed.posts)) {
      console.error('❌ 返回格式错误')
      return []
    }
    
    console.log(`📊 解析完成: 共 ${parsed.posts.length} 条帖子`)
    parsed.posts.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.author}: ${p.content?.slice(0, 30)}... (${p.comments?.length || 0}条评论)`)
    })
    
    // 创建帖子
    const existingPosts = await getAllPostsAsync()
    const now = Date.now()
    const newPosts: ForumPost[] = []
    
    // 打印可用发帖者名字列表，用于调试
    console.log(`📋 可用发帖者名字:`, availablePosters.map(ap => ap.name))
    
    for (let i = 0; i < parsed.posts.length; i++) {
      const p = parsed.posts[i]
      
      // 找到发帖者ID - 模糊匹配（去掉空格、支持部分匹配）
      const authorName = p.author.trim()
      const poster = availablePosters.find(ap => 
        ap.name === authorName || 
        ap.name.includes(authorName) || 
        authorName.includes(ap.name)
      )
      let authorId = poster?.id
      
      console.log(`🔍 匹配作者 "${authorName}": ${poster ? `找到 ${poster.name}(${poster.id})` : '未找到，创建NPC'}`)
      
      if (!authorId) {
        // 创建新NPC
        authorId = `npc-${now}-${Math.random().toString(36).slice(2, 6)}`
        const newNPC: ForumNPC = {
          id: authorId,
          name: p.author,
          avatar: '/default-avatar.png',
          bio: '社区用户',
          followers: Math.floor(Math.random() * 1000) + 100
        }
        npcs.push(newNPC)
      }
      
      // 生成图片URL（如果有imagePrompt且不为空）
      let imageUrls: string[] | undefined = undefined
      const hasRealImage = p.imagePrompt && p.imagePrompt.trim() && p.imagePrompt.trim().length > 3
      if (hasRealImage) {
        const encodedPrompt = encodeURIComponent(p.imagePrompt!.trim())
        imageUrls = [`https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`]
        console.log(`🖼️ 生成图片: ${p.imagePrompt}`)
      }
      
      const postId = `post-${now}-${i}-${Math.random().toString(36).slice(2, 9)}`
      
      // 打印帖子信息
      console.log(`📝 帖子${i + 1}: ${p.author} - ${p.content.slice(0, 50)}... (点赞:${p.likes}, 评论:${p.comments?.length || 0}, 图片:${hasRealImage ? '有' : '无'})`)
      
      newPosts.push({
        id: postId,
        npcId: String(authorId),  // 确保npcId是字符串
        content: p.content,
        images: hasRealImage ? 1 : 0,  // 只有真的有图片时才设为1
        imageUrls: imageUrls,
        likes: p.likes || Math.floor(Math.random() * 30),
        comments: p.comments?.length || 0,
        time: '刚刚',
        timestamp: now - i * 120000,
        isLiked: false
      })
      
      // 保存评论到IndexedDB
      if (p.comments && p.comments.length > 0) {
        const { addComment } = await import('./forumCommentsDB')
        for (const comment of p.comments) {
          // 找评论者ID
          const commenter = availablePosters.find(ap => ap.name === comment.author)
          let commenterId = commenter?.id
          if (!commenterId) {
            commenterId = `npc-${now}-${Math.random().toString(36).slice(2, 6)}`
            npcs.push({
              id: commenterId,
              name: comment.author,
              avatar: '/default-avatar.png',
              bio: '社区用户',
              followers: Math.floor(Math.random() * 500) + 50
            })
          }
          
          await addComment(
            postId,
            commenterId,
            comment.author,
            '/default-avatar.png',
            comment.content,
            Math.floor(Math.random() * 20)
          )
        }
      }
    }
    
    // 保存NPC
    saveNPCs(npcs)
    
    // 保存帖子
    const allPosts = [...newPosts, ...existingPosts]
    await savePosts(allPosts)
    
    console.log(`✅ 成功生成 ${newPosts.length} 条帖子`)
    return newPosts
    
  } catch (error) {
    console.error('❌ 生成帖子失败:', error)
    return []
  }
}

/**
 * 根据当前帖子和角色人设生成热点话题
 */
export async function generateHotTopics(): Promise<string[]> {
  console.log('🔥 开始生成热点话题...')
  
  const apiConfigs = apiService.getAll()
  const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
  const apiConfig = apiConfigs.find(c => c.id === currentId)
  
  if (!apiConfig) {
    console.error('❌ 没有可用的API配置')
    return getDefaultHotTopics()
  }
  
  // 获取最近帖子
  const posts = await getAllPostsAsync()
  const recentPosts = posts.slice(0, 20)
  
  // 获取角色信息（公众人物）
  const characters = await getAllCharacters()
  const publicFigures = characters.filter(c => c.isPublicFigure)
  
  const postsSummary = recentPosts.map(p => {
    const npc = characters.find(c => c.id === p.npcId)
    return `${npc?.nickname || npc?.realName || '用户'}: ${p.content.slice(0, 50)}... (${p.likes}赞)`
  }).join('\n')
  
  const publicFigureNames = publicFigures.map(c => 
    `${c.nickname || c.realName}${localStorage.getItem(`public-label-${c.id}`) ? `(${localStorage.getItem(`public-label-${c.id}`)})` : ''}`
  ).join('、')
  
  const prompt = `根据以下社区动态，生成10个当前热点话题。

## 最近帖子
${postsSummary || '暂无帖子'}

## 社区公众人物
${publicFigureNames || '暂无'}

## 要求
1. 话题要结合帖子内容，有些可以是对帖子话题的延伸
2. 可以提到公众人物的名字，如"XX的新动态"
3. 也要有一些通用热门话题
4. 话题要简短，10-20字
5. 直接输出JSON数组，不要解释

输出格式：
["话题1", "话题2", ...]`

  try {
    const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions')
      ? apiConfig.baseUrl
      : `${apiConfig.baseUrl}/chat/completions`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000
      })
    })
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    
    // 提取JSON数组
    const match = content.match(/\[[\s\S]*\]/)
    if (match) {
      const topics = JSON.parse(match[0])
      if (Array.isArray(topics) && topics.length > 0) {
        console.log('✅ 生成热点:', topics)
        return topics.slice(0, 10)
      }
    }
  } catch (e) {
    console.error('❌ 生成热点失败:', e)
  }
  
  return getDefaultHotTopics()
}

function getDefaultHotTopics(): string[] {
  return [
    '今天吃什么',
    '深夜emo时刻',
    '工作摸鱼日常',
    '租房那些事',
    '社死现场分享',
    '突然想到的事',
    '求推荐好物',
    '吐槽一下生活',
    '晒晒今日穿搭',
    '分享快乐瞬间'
  ]
}

/**
 * 检查是否需要自动生成帖子（用户1小时后上线）
 * 使用 zhizhi API（代付API）
 */
export async function checkAutoGeneratePosts(): Promise<ForumPost[]> {
  const LAST_VISIT_KEY = 'forum_last_visit'
  const ONE_HOUR = 60 * 60 * 1000
  
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
  const now = Date.now()
  
  // 更新访问时间
  localStorage.setItem(LAST_VISIT_KEY, now.toString())
  
  if (!lastVisit) {
    console.log('📍 首次访问论坛，不自动生成')
    return []
  }
  
  const timeDiff = now - parseInt(lastVisit)
  if (timeDiff < ONE_HOUR) {
    console.log(`📍 距离上次访问 ${Math.floor(timeDiff / 60000)} 分钟，不需要自动生成`)
    return []
  }
  
  console.log(`📍 距离上次访问 ${Math.floor(timeDiff / 3600000)} 小时，使用zhizhi API自动生成帖子...`)
  
  // 获取角色和用户的帖子作为话题参考
  const allPosts = await getAllPostsAsync()
  const characters = await getAllCharacters()
  const characterIds = new Set(characters.map(c => c.id))
  
  // 只筛选角色和用户发的帖子（不含NPC）
  const friendPosts = allPosts.filter(p => 
    p.npcId === 'user' || characterIds.has(p.npcId)
  ).slice(0, 10)
  
  // 提取话题作为提示
  const topicHint = friendPosts.length > 0 
    ? `最近好友动态：${friendPosts.map(p => p.content.slice(0, 30)).join('；')}`
    : undefined
  
  console.log(`📍 读取到 ${friendPosts.length} 条好友帖子作为参考`)
  
  // 根据时间间隔决定生成数量
  const hours = Math.floor(timeDiff / ONE_HOUR)
  const count = Math.min(hours * 2, 10) // 每小时2条，最多10条
  
  // 使用 zhizhi API 生成（传入特殊标记）
  return generateNPCPosts({ count, topicHint }, true)
}
