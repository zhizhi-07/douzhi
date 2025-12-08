import { useState, useEffect } from 'react'
import { apiService } from '../../../services/apiService'
import { getAllPostsAsync } from '../../../utils/forumNPC'
import type { ForumPost } from '../../../utils/forumNPC'

interface UseKickUserProps {
  decodedName: string
  isOwner: boolean
  setPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>
}

export function useKickUser({ decodedName, isOwner, setPosts }: UseKickUserProps) {
  const [showKickMenu, setShowKickMenu] = useState<string | null>(null)
  const [kickedUsers, setKickedUsers] = useState<string[]>([])
  const [isKicking, setIsKicking] = useState(false)

  // 加载被踢用户列表
  useEffect(() => {
    const kickedKey = `kicked_users_${decodedName}`
    try {
      const stored = localStorage.getItem(kickedKey)
      if (stored) {
        setKickedUsers(JSON.parse(stored))
      }
    } catch (e) {
      console.error('读取被踢用户失败:', e)
    }
  }, [decodedName])

  // 踢人功能
  const handleKickUser = async (npcId: string, npcName: string) => {
    if (!isOwner || isKicking) return
    
    setIsKicking(true)
    setShowKickMenu(null)
    
    // 添加到被踢列表
    const newKickedUsers = [...kickedUsers, npcId]
    setKickedUsers(newKickedUsers)
    
    // 存储被踢用户
    try {
      const kickedKey = `kicked_users_${decodedName}`
      localStorage.setItem(kickedKey, JSON.stringify(newKickedUsers))
    } catch (e) {
      console.error('存储被踢用户失败:', e)
    }

    // 从帖子列表中移除该用户的帖子
    setPosts(prev => prev.filter(p => p.npcId !== npcId))

    // 生成被踢用户的反应帖子
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (apiConfig) {
        const prompt = `你是一个被社区踢出的用户"${npcName}"，你刚刚被"#${decodedName}"话题的社区主踢出了社区。

请生成1条愤怒/委屈的抱怨帖子，可以选择以下反应之一：
1. 挂社区主：说社区主耍大牌、滥用权力
2. 委屈诉苦：说自己什么都没做就被踢了
3. 讽刺嘲讽：说这个社区不值得待
4. 爆料：说社区主私下的一些"黑料"（编造的）

**要求：**
- 帖子内容50-150字
- 语气要真实、情绪化
- 可以@社区主或提到话题名

**输出格式：**
帖子内容|反应类型

示例：
我就发了一条正常评论就被#xxx的社区主踢了？？？这社区主是不是有毛病啊，权力大了了不起吗？大家别去那个话题了，社区主耍大牌得很！|挂社区主

直接输出，不要其他内容。`

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
        
        if (content) {
          const [postContent] = content.split('|')
          if (postContent?.trim()) {
            const { savePosts, getAllNPCs, saveNPCs } = await import('../../../utils/forumNPC')
            const allPosts = await getAllPostsAsync()
            const existingNPCs = getAllNPCs()
            
            if (!existingNPCs.some(n => n.id === npcId)) {
              existingNPCs.push({
                id: npcId,
                name: npcName,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${npcId}`,
                bio: '被踢出社区的用户',
                followers: Math.floor(Math.random() * 100) + 10
              } as any)
              saveNPCs(existingNPCs)
            }

            const reactionPost = {
              id: `reaction-${Date.now()}`,
              npcId: npcId,
              content: `${postContent.trim()} #吐槽 #被踢了`,
              likes: Math.floor(Math.random() * 50),
              comments: [],
              timestamp: Date.now(),
              isLiked: false,
              images: [],
              time: new Date().toISOString()
            } as any
            
            allPosts.unshift(reactionPost)
            await savePosts(allPosts)
            
            console.log(`😤 ${npcName} 发布了反应帖子:`, postContent.trim())
          }
        }
      }
    } catch (error) {
      console.error('生成反应帖子失败:', error)
    } finally {
      setIsKicking(false)
    }
    
    alert(`已将 ${npcName} 踢出社区`)
  }

  return {
    showKickMenu,
    setShowKickMenu,
    kickedUsers,
    isKicking,
    handleKickUser
  }
}
