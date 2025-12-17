/**
 * 论坛私信生成系统
 * 根据用户的帖子、签名、@的公众人物、创建的话题等生成NPC私信
 */

import { apiService } from '../services/apiService'
import { getAllPostsAsync, getAllNPCs, saveNPCs, type ForumNPC } from './forumNPC'
import { getForumProfile } from './forumUser'
import { sendDMToUser } from './instagramDM'
import { getAllCharacters } from './characterManager'
import { getInstagramSettings } from '../pages/InstagramSettings'
import { callZhizhiApi } from '../services/zhizhiapi'

interface DMGeneratorOptions {
  useZhizhiAPI?: boolean  // 是否使用代付API
  count?: number  // 生成私信数量
}

interface GeneratedDM {
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'fan' | 'hater' | 'curious' | 'flirt' | 'business' | 'random'
}

/**
 * 生成NPC私信
 * 根据用户的论坛活动（帖子、签名、@、话题等）生成多样化的私信
 */
export async function generateNPCDMs(options: DMGeneratorOptions = {}): Promise<GeneratedDM[]> {
  // 默认5-8条私信
  const { useZhizhiAPI = false, count = 5 + Math.floor(Math.random() * 4) } = options
  
  console.log('📬 [私信生成] 开始生成NPC私信...')
  
  // 1. 收集用户信息
  const forumProfile = getForumProfile()
  const userNickname = forumProfile.nickname || '用户'
  const userSignature = forumProfile.signature || ''
  
  // 2. 获取用户的帖子
  const allPosts = await getAllPostsAsync()
  const userPosts = allPosts.filter(p => p.npcId === 'user').slice(0, 10)
  
  // 3. 提取@的人（从帖子内容中）
  const mentionedUsers: Set<string> = new Set()
  userPosts.forEach(post => {
    const mentions = post.content.match(/@[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || []
    mentions.forEach(m => mentionedUsers.add(m.slice(1)))
  })
  
  // 4. 获取所有角色（公众人物）
  const characters = await getAllCharacters()
  const publicFigures = characters.filter(c => c.isPublicFigure)
  
  // 5. 检查用户@了哪些公众人物
  const mentionedPublicFigures = publicFigures.filter(pf => {
    const name = pf.nickname || pf.realName || ''
    return mentionedUsers.has(name)
  })
  
  // 6. 获取NPC列表
  const npcs = getAllNPCs()
  
  // 7. 获取世界观设定
  const instagramSettings = getInstagramSettings()
  const worldview = instagramSettings.worldview?.trim() || ''
  
  // 构建用户帖子摘要
  const userPostsSummary = userPosts.length > 0 
    ? userPosts.map((p, i) => `${i + 1}. ${p.content.slice(0, 100)}${p.content.length > 100 ? '...' : ''}`).join('\n')
    : '暂无帖子'
  
  // 构建@的公众人物信息
  const publicFigureInfo = mentionedPublicFigures.length > 0
    ? mentionedPublicFigures.map(pf => {
        const label = localStorage.getItem(`public-label-${pf.id}`) || '公众人物'
        return `${pf.nickname || pf.realName}（${label}）`
      }).join('、')
    : ''
  
  // 构建世界观提示
  const worldviewPrompt = worldview ? `
## 🌍 论坛世界观设定
${worldview}

**世界观规则：所有私信内容都必须符合这个世界观设定！**
` : ''

  // 构建prompt
  const prompt = `你是一个论坛私信生成器。根据用户的论坛活动，生成其他网友发来的私信。
${worldviewPrompt}
## 📱 用户信息
- 网名：${userNickname}
- 个性签名：${userSignature || '（未设置）'}

## 📝 用户最近发的帖子
${userPostsSummary}

## 🔔 用户@过的公众人物
${publicFigureInfo || '（无）'}

## 🎯 生成要求

请生成 **${count}条** 不同类型的私信，私信类型包括但不限于：

1. **粉丝型**：喜欢用户的内容，想认识/交朋友
2. **好奇型**：对用户的帖子感兴趣，想了解更多
3. **搭讪型**：被用户吸引，想聊天/暧昧
4. **杠精型**：不同意用户的观点，来辩论/吵架
5. **商业型**：想合作/推广/卖东西
6. **求助型**：看到用户的帖子，来请教问题
7. **吃瓜型**：看到用户@了公众人物，来八卦
8. **随机寒暄**：纯粹打招呼、聊天

## 📤 输出格式（严格JSON！）

\`\`\`json
{
  "dms": [
    {
      "senderName": "发送者网名（创意一点，像真实网友）",
      "content": "私信内容（10-80字，自然口语化，可带emoji）",
      "type": "类型（fan/hater/curious/flirt/business/random）"
    }
  ]
}
\`\`\`

## ⚠️ 注意事项
- 网名要多样化：可以是昵称、表白墙风格、网络ID等
- 内容要真实自然，像真人发的私信
- 不同类型的私信语气完全不同
- 如果用户@过公众人物，可以有1-2条询问相关的私信
- **只输出JSON，不要解释！**`

  try {
    let content = ''
    
    if (useZhizhiAPI) {
      // 使用代付API
      content = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.9, max_tokens: 2000 }
      )
    } else {
      // 使用用户API
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)
      
      if (!apiConfig) {
        console.error('❌ [私信生成] 没有可用的API配置')
        return []
      }
      
      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions')
        ? apiConfig.baseUrl
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 2000
        })
      })
      
      const data = await response.json()
      if (data.error) {
        console.error('❌ [私信生成] API错误:', data.error)
        return []
      }
      
      content = data.choices?.[0]?.message?.content?.trim() || ''
    }
    
    console.log('📬 [私信生成] AI返回:', content.slice(0, 200))
    
    // 解析JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*"dms"[\s\S]*\}/)
    if (jsonMatch) {
      content = jsonMatch[1] || jsonMatch[0]
    }
    
    const parsed = JSON.parse(content)
    
    if (!parsed.dms || !Array.isArray(parsed.dms)) {
      console.error('❌ [私信生成] 返回格式错误')
      return []
    }
    
    // 转换并发送私信
    const generatedDMs: GeneratedDM[] = []
    const updatedNPCs = [...npcs]
    
    for (const dm of parsed.dms) {
      // 检查是否是现有NPC
      let existingNPC = npcs.find(n => n.name === dm.senderName)
      let senderId: string
      let senderAvatar: string | undefined
      
      if (existingNPC) {
        // 使用现有NPC
        senderId = existingNPC.id
        senderAvatar = existingNPC.avatar
      } else {
        // 创建新NPC（这是普通网友，不是AI角色）
        senderId = `npc-dm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newNPC: ForumNPC = {
          id: senderId,
          name: dm.senderName,
          avatar: '', // 空字符串表示使用渐变色头像
          bio: dm.type === 'fan' ? '热爱分享✨' : dm.type === 'business' ? '商务合作' : '普通网友',
          followers: Math.floor(Math.random() * 500) + 50
        }
        updatedNPCs.push(newNPC)
        senderAvatar = '' // 不设置头像，让UI使用渐变色
      }
      
      const generatedDM: GeneratedDM = {
        senderId,
        senderName: dm.senderName,
        senderAvatar,
        content: dm.content,
        type: dm.type || 'random'
      }
      
      // 发送私信给用户
      sendDMToUser(
        generatedDM.senderId,
        generatedDM.senderName,
        generatedDM.senderAvatar,
        generatedDM.content
      )
      
      generatedDMs.push(generatedDM)
      console.log(`📬 [私信] ${dm.senderName}: ${dm.content.slice(0, 30)}...`)
    }
    
    // 保存新NPC到列表
    if (updatedNPCs.length > npcs.length) {
      saveNPCs(updatedNPCs)
    }
    
    console.log(`✅ [私信生成] 成功生成 ${generatedDMs.length} 条私信`)
    return generatedDMs
    
  } catch (error) {
    console.error('❌ [私信生成] 生成失败:', error)
    return []
  }
}
