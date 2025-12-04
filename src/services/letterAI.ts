/**
 * 信封AI回信服务
 * 根据角色性格和聊天上下文生成回信
 */

import { callZhizhiApi } from './zhizhiapi'
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

    // 3. 获取最近的聊天记录（最多20条）作为上下文
    const messages = loadMessages(characterId).slice(-20)
    const chatContext = messages
      .filter(m => m.content && !m.aiOnly)
      .map(m => {
        const sender = m.type === 'sent' ? userName : (character.nickname || character.realName)
        return `${sender}: ${m.content}`
      })
      .join('\n')

    // 4. 构建提示词
    const senderInfo = isAnonymous 
      ? '一位匿名者' 
      : userName

    const prompt = `你是${character.nickname || character.realName}。

**你的性格设定**：
${character.personality || '温柔体贴'}

**你的个性签名**：
${character.signature || '无'}

**你和${userName}的最近聊天记录**（供参考）：
${chatContext || '（暂无聊天记录）'}

---

现在，你收到了一封来自${senderInfo}的信：

"${letterContent}"

**任务**：
请以${character.nickname || character.realName}的身份，用书信的方式回复这封信。

**要求**：
1. 保持你的性格特点和说话风格
2. 如果是匿名信，可以表达好奇或猜测对方身份
3. 如果不是匿名信，可以结合你们的聊天历史
4. 语气要真诚、温暖，像写给朋友的信
5. 字数在100-300字之间
6. 不要使用emoji，保持书信的正式感
7. 可以提及信中的内容，表达你的感受和想法

直接输出回信内容，不要有任何前缀或后缀。`

    console.log('✉️ [信封AI] 开始生成回信...')
    console.log('✉️ [信封AI] 角色:', character.nickname || character.realName)
    console.log('✉️ [信封AI] 是否匿名:', isAnonymous)
    console.log('✉️ [信封AI] 信件内容长度:', letterContent.length)

    // 5. 调用zhizhiapi生成回信
    const reply = await callZhizhiApi([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.8,
      max_tokens: 800
    })

    console.log('✅ [信封AI] 回信生成成功，长度:', reply.length)
    return reply.trim()

  } catch (error) {
    console.error('❌ [信封AI] 生成回信失败:', error)
    throw error
  }
}
