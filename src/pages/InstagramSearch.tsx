import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Hash, Plus, X } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { apiService } from '../services/apiService'
import { getAllPosts, savePosts, getAllNPCs, saveNPCs, cleanupNPCStorage } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'

interface Topic {
  id: string
  name: string
  posts: number
  trending: boolean
  category: string
}

const TOPICS_KEY = 'instagram_topics'

// 获取话题列表
function getStoredTopics(): Topic[] {
  const stored = localStorage.getItem(TOPICS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultTopics()
    }
  }
  return getDefaultTopics()
}

// 保存话题列表
function saveTopics(topics: Topic[]) {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics))
}

// 默认话题
function getDefaultTopics(): Topic[] {
  return [
    { id: '1', name: '日常生活', posts: 1234, trending: true, category: '推荐' },
    { id: '2', name: '美食分享', posts: 2567, trending: true, category: '推荐' },
    { id: '3', name: '旅行vlog', posts: 3456, trending: false, category: '推荐' },
    { id: '4', name: '摄影', posts: 4321, trending: true, category: '推荐' },
    { id: '5', name: '健身打卡', posts: 1890, trending: false, category: '生活' },
    { id: '6', name: '读书笔记', posts: 2234, trending: false, category: '生活' },
    { id: '7', name: '穿搭分享', posts: 3567, trending: true, category: '时尚' },
    { id: '8', name: '数码测评', posts: 1567, trending: false, category: '科技' },
  ]
}

const InstagramSearch = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [topicDesc, setTopicDesc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setTopics(getStoredTopics())
  }, [])

  // 创建话题并生成帖子
  const handleCreateTopic = async () => {
    if (!topicName.trim()) return
    
    // 先清理localStorage，避免爆掉
    cleanupNPCStorage()
    
    setIsGenerating(true)
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        alert('没有可用的API配置')
        setIsGenerating(false)
        return
      }

      // 获取所有角色，检查话题是否涉及公众人物
      const allChars = await getAllCharacters()
      const topicText = `${topicName} ${topicDesc || ''}`
      const mentionedPublicFigures = allChars.filter(c => 
        c.isPublicFigure && 
        (topicText.includes(c.nickname || '') || topicText.includes(c.realName))
      )
      
      // 构建公众人物说明（包含完整人设）
      const publicFigurePrompt = mentionedPublicFigures.length > 0 ? `
**话题涉及的公众人物（网友都认识他们）：**
${mentionedPublicFigures.map(pf => {
        const desc = []
        if (pf.publicPersona) desc.push(`网络形象：${pf.publicPersona}`)
        if (pf.personality) desc.push(`性格人设：${pf.personality}`)
        return `- ${pf.nickname || pf.realName}${desc.length > 0 ? '：' + desc.join('，') : ''}`
      }).join('\n')}

**公众人物互动规则：**
- 网友发帖时会针对这些公众人物发表看法
- 公众人物本人（${mentionedPublicFigures.map(pf => pf.nickname || pf.realName).join('、')}）也可能发帖回应
- **重要：公众人物的帖子必须完全符合他们的性格人设**
- 帖子可以是支持、反对、调侃、爆料、质疑等
` : ''
      
      // 🔷🔷🔷 创建话题日志 🔷🔷🔷
      console.log('\n' + '🔶'.repeat(30))
      console.log('🏷️ 创建话题 - 开始')
      console.log('🔶'.repeat(30))
      console.log('📝 话题名称:', topicName)
      console.log('📝 话题描述:', topicDesc || '无')
      console.log('👥 所有角色数量:', allChars.length)
      if (mentionedPublicFigures.length > 0) {
        console.log('🌟 检测到公众人物:')
        mentionedPublicFigures.forEach(pf => {
          console.log(`  - ${pf.nickname || pf.realName}`)
          console.log(`    网络形象: ${pf.publicPersona || '无'}`)
          console.log(`    性格人设: ${pf.personality || '无'}`)
        })
      } else {
        console.log('🌟 检测到公众人物: 无')
      }

      const prompt = `你是一个社交平台内容生成器。现在有一个热门话题：

**话题名称：**#${topicName}
**话题描述：**${topicDesc || topicName}
${publicFigurePrompt}
请生成3-5条帖子，每条帖子带3-8条评论（包含楼中楼回复）。

**要求：**
- 网名2-4个字（如：小李、阿明、路人甲等）${mentionedPublicFigures.length > 0 ? `\n- 公众人物本人（${mentionedPublicFigures.map(pf => pf.nickname || pf.realName).join('、')}）也可以发帖或评论` : ''}
- 帖子内容20-150字，评论5-50字
- 可以有不同观点：支持、反对、调侃、提问等

**输出格式：**
===帖子1===
发帖人|帖子内容
[评论] 网名：评论内容
[回复] 网名 -> 被回复人：回复内容
===帖子2===
发帖人|帖子内容
[评论] 网名：评论内容
...

**示例：**
===帖子1===
小李|这个话题太有意思了，大家怎么看？
[评论] 阿明：确实挺有意思的
[回复] 路人甲 -> 阿明：同意！
[评论] 网友A：我有不同看法
===帖子2===
老王|我来说两句...
[评论] 小张：说得好！

直接输出，不要其他内容。`

      // 打印完整Prompt
      console.log('============================================================')
      console.log('📋 创建话题 - 完整Prompt:')
      console.log('============================================================')
      console.log(prompt)
      console.log('============================================================')

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
          temperature: 0.9
        })
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      // 打印AI返回内容
      console.log('============================================================')
      console.log('🤖 创建话题 - AI返回内容:')
      console.log('============================================================')
      console.log(content)
      console.log('============================================================')
      
      // 解析帖子和评论（新格式：===帖子N=== 分割）
      const postBlocks = content.split(/===帖子\d+===/).filter((b: string) => b.trim())
      const currentPosts = getAllPosts()
      const existingNPCs = getAllNPCs()
      const baseTimestamp = Date.now()
      const createdPostIds: string[] = []
      
      // 导入评论数据库
      const { addComment, addReply } = await import('../utils/forumCommentsDB')
      
      for (let index = 0; index < postBlocks.length; index++) {
        const block = postBlocks[index].trim()
        const lines = block.split('\n').filter((l: string) => l.trim())
        if (lines.length === 0) continue
        
        // 第一行是帖子：发帖人|帖子内容
        const postLine = lines[0]
        const postMatch = postLine.match(/^(.+?)\|(.+)$/)
        if (!postMatch) continue
        
        const posterName = postMatch[1].trim()
        const postContent = postMatch[2].trim()
        
        // 检查是否是公众人物
        const publicFigure = allChars.find(c => 
          c.nickname === posterName || c.realName === posterName
        )
        
        // 创建NPC
        let npcId = `topic-npc-${baseTimestamp}-${index}`
        let npcAvatar = '/default-avatar.png'
        
        if (publicFigure) {
          npcId = publicFigure.id
          npcAvatar = publicFigure.avatar || '/default-avatar.png'
          console.log(`🌟 公众人物 ${posterName} 发帖`)
        }
        
        if (!existingNPCs.find(n => n.name === posterName)) {
          existingNPCs.push({
            id: npcId,
            name: posterName,
            avatar: npcAvatar,
            bio: publicFigure ? (publicFigure.publicPersona || '公众人物') : '论坛活跃用户',
            followers: Math.floor(Math.random() * 500) + 100
          })
        }
        
        // 创建帖子
        const postId = `topic-post-${baseTimestamp}-${index}`
        createdPostIds.push(postId)
        
        // 解析评论（从第二行开始）
        const commentLines = lines.slice(1)
        const nameToCommentId = new Map<string, string>()
        let commentCount = 0
        
        for (const line of commentLines) {
          // 匹配主评论：[评论] 网名：内容
          const commentMatch = line.match(/^\[评论\]\s*(.+?)[:：](.+)$/)
          if (commentMatch) {
            const commenterName = commentMatch[1].trim()
            const commentContent = commentMatch[2].trim()
            
            // 检查评论者是否是公众人物
            const commenterPF = allChars.find(c => 
              c.nickname === commenterName || c.realName === commenterName
            )
            const commenterId = commenterPF?.id || `topic-npc-${baseTimestamp}-${index}-c${commentCount}`
            const commenterAvatar = commenterPF?.avatar || '/default-avatar.png'
            
            const comment = await addComment(
              postId, commenterId, commenterName, commenterAvatar, commentContent,
              Math.floor(Math.random() * 50) + 5,
              !!commenterPF?.isPublicFigure
            )
            nameToCommentId.set(commenterName, comment.id)
            commentCount++
            continue
          }
          
          // 匹配回复：[回复] 网名 -> 被回复人：内容
          const replyMatch = line.match(/^\[回复\]\s*(.+?)\s*->\s*(.+?)[:：](.+)$/)
          if (replyMatch) {
            const replierName = replyMatch[1].trim()
            const replyToName = replyMatch[2].trim()
            const replyContent = replyMatch[3].trim()
            
            const targetCommentId = nameToCommentId.get(replyToName)
            if (targetCommentId) {
              const replierPF = allChars.find(c => 
                c.nickname === replierName || c.realName === replierName
              )
              const replierId = replierPF?.id || `topic-npc-${baseTimestamp}-${index}-r${commentCount}`
              const replierAvatar = replierPF?.avatar || '/default-avatar.png'
              
              await addReply(
                targetCommentId, replierId, replierName, replierAvatar,
                replyContent, replyToName,
                Math.floor(Math.random() * 20) + 1
              )
              nameToCommentId.set(replierName, targetCommentId)
              commentCount++
            }
          }
        }
        
        // 创建帖子
        const newPost = {
          id: postId,
          npcId,
          content: `#${topicName} ${postContent}`,
          images: 0,
          likes: Math.floor(Math.random() * 100) + 10,
          comments: commentCount,
          time: '刚刚',
          timestamp: baseTimestamp - index * 60000,
          isLiked: false,
          topicId: topicName
        }
        currentPosts.unshift(newPost)
        console.log(`📝 帖子 ${index + 1}: ${posterName} | 评论数: ${commentCount}`)
      }
      
      saveNPCs(existingNPCs)
      savePosts(currentPosts)
      
      console.log('📝 创建的帖子ID:', createdPostIds)
      
      // 创建新话题
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: topicName.trim(),
        posts: createdPostIds.length,
        trending: false,
        category: '自定义'
      }
      
      const updatedTopics = [newTopic, ...topics]
      saveTopics(updatedTopics)
      setTopics(updatedTopics)
      
      setShowCreateModal(false)
      setTopicName('')
      setTopicDesc('')
      console.log(`✨ 创建话题 #${topicName} 成功，生成${createdPostIds.length}条帖子（含评论）`)
      
      // 评论生成完成后再跳转到话题详情
      navigate(`/instagram/topic/${encodeURIComponent(newTopic.name)}`)
    } catch (error) {
      console.error('创建话题失败:', error)
      alert('创建失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <InstagramLayout showHeader={false}>
      {/* 话题标题 + 创建按钮 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">话题</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="pb-20">
        <div className="divide-y divide-gray-100">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => navigate(`/instagram/topic/${encodeURIComponent(topic.name)}`)}
              className="px-4 py-4 active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-6 h-6 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {topic.name}
                    </h3>
                    {topic.trending && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-full">
                        <TrendingUp className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-500">热门</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {topic.posts.toLocaleString()} 条帖子
                  </p>
                </div>
                
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
        
        {topics.length === 0 && (
          <div className="py-20 text-center text-gray-400 text-sm">
            暂无话题
          </div>
        )}
      </div>

      {/* 创建话题模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-base font-semibold">创建话题</h2>
              <button
                onClick={handleCreateTopic}
                disabled={!topicName.trim() || isGenerating}
                className="text-blue-500 font-semibold text-sm disabled:opacity-40"
              >
                {isGenerating ? '生成中...' : '创建'}
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm text-gray-500 mb-2">话题名称</label>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="输入话题名称"
                    className="flex-1 bg-transparent outline-none text-base"
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">话题描述（可选）</label>
                <textarea
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="描述一下这个话题，AI会根据描述生成帖子..."
                  className="w-full bg-gray-100 rounded-lg px-3 py-2 outline-none text-base resize-none"
                  rows={3}
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </InstagramLayout>
  )
}

export default InstagramSearch
