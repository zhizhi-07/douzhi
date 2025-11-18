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
   * 构建帖子生成prompt
   */
  const buildPostPrompt = useCallback((userPrompt: string, selectedRoles: string[]): string => {
    let prompt = '请生成一个虚拟的社交媒体帖子。\n\n'
    
    // 添加角色信息
    if (selectedRoles.length > 0) {
      prompt += '相关角色信息：\n'
      
      if (selectedRoles.includes('user')) {
        prompt += '- 用户\n'
      }
      
      if (selectedRoles.includes('ai') && characterPersona) {
        prompt += `- ${characterName}：${characterPersona}\n`
      } else if (selectedRoles.includes('ai')) {
        prompt += `- ${characterName}\n`
      }
      
      prompt += '\n请根据以上角色的背景和人设，生成合理的帖子内容。\n\n'
    }
    
    // 添加用户描述
    prompt += `帖子要求：${userPrompt}\n\n`
    
    // 添加格式要求
    prompt += `格式要求：
- 包含多个网友的评论（至少3-5条）
- 每条评论要有用户名
- 内容要真实自然，符合社交媒体风格
- 如果涉及到角色，内容要符合角色的人设和背景
- 直接输出帖子内容，不要有任何解释说明`
    
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
      // 使用代付API生成帖子
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-biaugiqxfopyfosfxpggeqcitfwkwnsgkduvjavygdtpoicm'
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 2000
        })
      })

      const data = await response.json()
      const postContent = data.choices?.[0]?.message?.content || '帖子生成失败'
      
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
    
    // 保存并显示
    addMessage(chatId, postMsg)
    setMessages(prev => [...prev, postMsg])
    
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
