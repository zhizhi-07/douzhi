/**
 * 信封AI回信服务
 * 根据角色性格和聊天上下文生成回信
 */

import { callAI } from '../utils/api'
import { getCharacterById } from '../utils/characterManager'
import { loadMessages } from '../utils/simpleMessageManager'
import { getUserInfo } from '../utils/userUtils'

/**
 * 生成AI回信
 * @param characterId 角色ID
 * @param letterContent 用户的信件内容
 * @param isAnonymous 是否匿名
 * @returns AI的回信内容
 */
export const generateLetterReply = async (
  characterId: string,
  letterContent: string,
  isAnonymous: boolean
): Promise<string> => {
  try {
    // 1. 获取角色信息
    const character = await getCharacterById(characterId)
    if (!character) {
      throw new Error('角色不存在')
    }

    // 2. 获取用户信息
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName || '用户'

    // 3. 获取最近的聊天记录（最多100条）作为上下文
    // 🔥 即使是匿名信，也要同步聊天记录，让AI更了解上下文
    const messages = loadMessages(characterId).slice(-100)
    const chatContext = messages
      .filter(m => m.content && !m.aiOnly)
      .map(m => {
        const sender = m.type === 'sent' ? userName : (character.nickname || character.realName)
        return `${sender}: ${m.content}`
      })
      .join('\n')

    console.log('💬 [信封AI] 同步了', messages.length, '条聊天记录')

    // 4. 构建提示词
    const prompt = `你是${character.nickname || character.realName}。

**你的性格设定**：
${character.personality || '温柔体贴'}

**你的个性签名**：
${character.signature || '无'}

**你最近的生活状态**（以下是你的聊天记录，从中可以了解你的生活、感情状况等）：
${chatContext || '（暂无聊天记录）'}

---

现在，你收到了一封${isAnonymous ? '匿名' : '来自' + userName + '的'}信：

"${letterContent}"

请回信。根据你的真实情况回答，直接输出回信内容。`

    console.log('✉️ [信封AI] 开始生成回信...')
    console.log('✉️ [信封AI] 角色:', character.nickname || character.realName)
    console.log('✉️ [信封AI] 是否匿名:', isAnonymous)
    console.log('✉️ [信封AI] 信件内容长度:', letterContent.length)

    // 5. 使用用户设置的API生成回信
    // 🔥 改成 system + user 格式，和私聊保持一致
    const reply = await callAI([
      { role: 'system', content: `你是${character.nickname || character.realName}，请用你的性格和口吻回复这封信。` },
      { role: 'user', content: prompt }
    ] as any, 1, 4000)

    console.log('✅ [信封AI] 回信生成成功，长度:', reply.length)
    return reply.trim()

  } catch (error) {
    console.error('❌ [信封AI] 生成回信失败:', error)
    throw error
  }
}
