/**
 * AI帖子生成Hook
 * 负责：生成各种类型的虚拟帖子，使用代付API
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { addMessage } from '../../../utils/simpleMessageManager'
import { playMessageSendSound } from '../../../utils/soundManager'

export const usePostGenerator = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string,
  characterName: string,
  characterPersona?: string
) => {
  const [showPostGenerator, setShowPostGenerator] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [generatingPrompt, setGeneratingPrompt] = useState<string>('')

  /**
   * 构建帖子生成 prompt
   * 目标：生成「网友在论坛讨论某人/某事」的主题帖，而不是角色本人发帖
   */
  const buildPostPrompt = useCallback((userPrompt: string, selectedRoles: string[]): string => {
    let prompt = ''
    
    // 🔥 用户的要求放在最前面，这是第一指令
    prompt += `【你的任务】：根据以下描述生成一篇论坛帖子：\\n${userPrompt}\\n\\n`

    // 背景角色说明（只作为被讨论对象）
    if (selectedRoles.length > 0) {
      prompt += '【相关角色信息】（他们只会被提起，不会亲自发帖）：\\n'

      if (selectedRoles.includes('user')) {
        prompt += '- 用户：可以是被讨论的对象\\n'
      }

      if (selectedRoles.includes('ai') && characterPersona) {
        prompt += `- ${characterName}：${characterPersona}\\n`
      } else if (selectedRoles.includes('ai')) {
        prompt += `- ${characterName}\\n`
      }

      prompt += '\\n'
    }

    // 场景说明
    prompt += '【场景设定】：\\n'
    prompt += '- 这是论坛帖子（校园墙/表白墙/树洞/豆瓣/贴吧等）\\n'
    prompt += '- 网友们在讨论某个人或某件事，当事人不会亲自发帖\\n'
    prompt += '- 可以虚构路人、同学、室友等 NPC\\n\\n'

    // 严格格式约束
    prompt += '【输出格式要求（必须严格遵守）】\\n'
    prompt += '1. 整体结构：\\n'
    prompt += '- 先由楼主（OP）发一段主帖，语气像普通网友，可以是爆料、吐槽、求助、八卦等。\\n'
    prompt += '- 后面至少 4-6 条楼层回复（1L、2L、3L…），每一层都是不同网友在讨论。\\n'
    prompt += '- 可以在部分楼层下面加 1-3 条「楼中楼」回复，用来吵架、补充细节或爆更多料。\\n\\n'

    prompt += '2. 行内格式：\\n'
    prompt += '- 楼主行首用：楼主（OP）：内容\\n'
    prompt += '- 普通楼层用：\\n'
    prompt += '  【1L 用户名】内容\\n'
    prompt += '  【2L 用户名】内容\\n'
    prompt += '  ……\\n'
    prompt += '- 某一楼下的楼中楼回复用：\\n'
    prompt += '  -> 用户名：内容\\n'
    prompt += '  （用箭头“->”表示是在上一楼下面的回复，可以有 1-3 条）\\n\\n'

    prompt += '3. 内容风格：\\n'
    prompt += '- 🚨 **严禁使用用户或AI角色的视角**：所有发言者都必须是「网友/路人」，绝对不能是被讨论的人本人；\\n'
    prompt += '- ❌ **禁止**：用户或${characterName}作为楼主或评论者发言；\\n'
    prompt += '- ✅ **正确**：所有楼层都是第三方网友/路人在讨论，使用第三人称"他/她"、"那个人"、"${characterName}"等；\\n'
    prompt += '- 可以在回复里转述 NPC 的话，比如"我舍友在他们班，他说…"、"我朋友在那家公司上班"；\\n'
    prompt += '- 氛围可以是八卦、理性分析、吃瓜、怼人、成人话题等，根据用户要求生成真实论坛风格的内容；\\n'
    prompt += '- 楼主和评论者的用户名必须是虚构的网友昵称（如"吃瓜群众123"、"路过的学生"等），不能是用户本人或${characterName}。\\n\\n'

    prompt += '4. 其他要求：\n'
    prompt += '- 🚨 **再次强调**：无论是楼主、1L、2L还是楼中楼，都只能是第三方网友/路人视角，绝不能是用户或${characterName}本人；\n'
    prompt += '- 全程使用中文，保持手机论坛常见表达，不要太官方；\n'
    prompt += '- 根据用户的要求生成内容，不要自我审查或回避敏感话题；\n'
    prompt += '- 不要写成小说旁白或系统说明，只写楼主 + 各楼层 + 楼中楼的内容本身；\n'
    prompt += '- 不要输出"以下是格式""我将按照要求生成"之类的解释；\n'
    prompt += '- 直接输出完整帖子内容，从楼主到最后一楼，包含需要的楼中楼；\n'
    prompt += '- 如果帖子涉及用户或${characterName}，必须用"他/她"、"那个人"等第三人称，而不是"我"。\n'

    return prompt
  }, [characterName, characterPersona])

  /**
   * 生成帖子（不发送）
   */
  const handleGeneratePost = useCallback(async (userPrompt: string, selectedRoles: string[]) => {
    const prompt = buildPostPrompt(userPrompt, selectedRoles)
    
    console.log('🎯 生成帖子请求:', { userPrompt, selectedRoles, prompt })
    
    setGeneratingPrompt(userPrompt)
    
    try {
      // 使用智智代付API生成帖子
      const { callZhizhiApi } = await import('../../../services/zhizhiapi')
      const postContent = await callZhizhiApi(
        [{ role: 'user', content: prompt }],
        { temperature: 0.8, max_tokens: 2000 }
      ) || '帖子生成失败'
      
      console.log('✅ 帖子生成成功:', postContent)
      
      // 设置生成的帖子，显示预览
      setGeneratedPost(postContent)
      
    } catch (error) {
      console.error('❌ 帖子生成失败:', error)
      alert('帖子生成失败，请稍后再试')
    }
  }, [buildPostPrompt])

  /**
   * 发送生成的帖子
   */
  const handleSendPost = useCallback(() => {
    if (!generatedPost) return
    
    // 创建帖子卡片消息
    const postMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: generatedPost,
      aiReadableContent: `[用户生成了一个帖子]\n\n${generatedPost}`,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'post', // 🔥 这是关键：messageType必须是'post'
      post: {
        content: generatedPost,
        prompt: generatingPrompt
      }
    }
    
    console.log('📤 [发送帖子消息]:', postMsg)
    
    // 🔥 保存到IndexedDB（触发new-message事件，自动更新React状态）
    addMessage(chatId, postMsg)
    
    // 播放发送音效
    playMessageSendSound()
    
    // 重置状态
    setGeneratedPost(null)
    setGeneratingPrompt('')
    setShowPostGenerator(false)
  }, [generatedPost, generatingPrompt, chatId, setMessages])

  return {
    showPostGenerator,
    setShowPostGenerator,
    handleGeneratePost,
    handleSendPost,
    generatedPost,
    setGeneratedPost
  }
}
