/**
 * 判定对错Hook
 * 负责：判定功能的状态管理和逻辑处理
 */

import { useState, useCallback } from 'react'
import { getUserInfo } from '../../../utils/userUtils'
import { saveMessages } from '../../../utils/simpleMessageManager'
import { callJudgmentApi } from '../../../services/judgmentService'
import type { Message, Character } from '../../../types/chat'
import type { JudgmentData } from '../../../components/JudgmentCard'
import type { BiasType } from '../../../components/JudgmentModal'

export const useJudgment = (
  id: string | undefined,
  character: Character | null,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  triggerAIReply: () => void
) => {
  const [showJudgmentModal, setShowJudgmentModal] = useState(false)
  const [isJudging, setIsJudging] = useState(false)

  // 获取用户和角色名称
  const userName = getUserInfo()?.nickname || '用户'
  const characterName = character?.nickname || character?.realName || '对方'

  /**
   * 发送判定请求（用户填写立场后调用）
   */
  const sendJudgmentRequest = useCallback((userReason: string, bias: BiasType) => {
    if (!id) return

    const judgmentData: JudgmentData = {
      type: 'request',
      userReason,
      bias,
      userName,
      characterName
    }

    const judgmentMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[判定请求] ${userReason}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'judgment',
      judgmentData,
      // AI可读的内容 - 清晰说明需要用指令回复
      aiReadableContent: `【情感仲裁庭传票】

用户向你提起了诉讼，陈述了他的立场：
"${userReason}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 重要：你现在必须用 [判定回应] 指令来陈述你的立场和感受。

格式：[判定回应:你的立场和感受]

例如：
[判定回应:我觉得这件事不能全怪我，因为你当时也没说清楚。我知道你生气，但我也觉得委屈...]

请在下一条消息中使用这个指令格式回应，说出你的想法和感受。`
    }

    setMessages(prev => {
      const updated = [...prev, judgmentMsg]
      saveMessages(id, updated)
      return updated
    })

    // 触发AI回复
    setTimeout(() => {
      triggerAIReply()
    }, 500)
  }, [id, userName, characterName, setMessages, triggerAIReply])

  /**
   * 请求判定（点击AI回应卡片上的判定按钮）
   */
  const requestJudgment = useCallback(async (messageId: number) => {
    if (!id) return

    // 找到AI回应消息获取立场数据
    const responseMsg = messages.find(m => m.id === messageId)
    if (!responseMsg?.judgmentData || responseMsg.judgmentData.type !== 'response') return

    // 找到最近的用户判定请求消息获取用户立场和偏向
    const requestMsg = [...messages].reverse().find(
      m => m.messageType === 'judgment' && m.judgmentData?.type === 'request'
    )
    if (!requestMsg?.judgmentData) return

    setIsJudging(true)
    try {
      const result = await callJudgmentApi(
        id,
        characterName,
        userName,
        requestMsg.judgmentData.userReason || '',
        responseMsg.judgmentData.aiReason || '',
        requestMsg.judgmentData.bias || 'neutral'
      )

      // 发送判定结果消息
      const resultMsg: Message = {
        id: Date.now(),
        type: 'received',  // 改为received类型，这样会渲染成卡片
        content: `[判定结果] ${result.winner === 'user' ? userName : result.winner === 'ai' ? characterName : '平局'}占理`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'judgment',
        judgmentData: {
          type: 'result',
          result,
          userName,
          characterName
        },
        // AI可读的完整判决内容
        aiReadableContent: `[情感仲裁庭判决结果]
判决结果：${result.winner === 'user' ? `${userName}胜诉` : result.winner === 'ai' ? `${characterName}胜诉` : '双方和解'}
评分：${userName} ${result.userScore}分 vs ${characterName} ${result.aiScore}分

判决理由：
${result.reason}

判决如下：
${result.solution}

请根据这个判决结果，在后续对话中调整你的态度和回应。`
      }

      setMessages(prev => {
        const updated = [...prev, resultMsg]
        saveMessages(id, updated)
        return updated
      })
    } catch (error) {
      console.error('判定失败:', error)
    } finally {
      setIsJudging(false)
    }
  }, [id, messages, userName, characterName, setMessages])

  return {
    showJudgmentModal,
    setShowJudgmentModal,
    isJudging,
    sendJudgmentRequest,
    requestJudgment
  }
}
