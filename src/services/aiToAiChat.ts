import { getStoredUserProfileJSON } from '../utils/userProfileStorage'
/**
 * AI对AI聊天服务
 * 让两个AI角色互相对话，读取双方人设和与用户的聊天记录
 */

import { Character, Message } from '../types/chat'
import { callAIApi, getApiSettings } from '../utils/chatApi'

// 获取用户信息
const getUserInfo = () => {
  try {
    const stored = getStoredUserProfileJSON()
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {}
  return { nickname: '用户', realName: '用户' }
}

// 替换人设中的变量
const replaceVariables = (text: string, charName: string) => {
  if (!text) return text
  const userInfo = getUserInfo()
  const userName = userInfo.nickname || userInfo.realName || '用户'
  return text
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{char\}\}/gi, charName)
}
import { AIMessage, saveFriendship } from '../components/AITwoAIChatViewer'
import { getAllCharacters } from '../utils/characterManager'
import { loadMessages } from '../utils/simpleMessageManager'

/**
 * 生成AI间对话
 * @param ai1 第一个AI角色（发起添加好友的）
 * @param ai2 第二个AI角色（被添加的）
 * @param existingMessages 已有的AI间聊天记录
 * @param ai1WithUserChat AI1和用户的聊天记录（作为背景）
 * @param ai2WithUserChat AI2和用户的聊天记录（作为背景）
 */
export async function generateAIToAIChat(
  ai1: Character,
  ai2: Character,
  existingMessages: AIMessage[],
  ai1WithUserChat: Message[],
  ai2WithUserChat: Message[]
): Promise<{ senderId: string; senderName: string; content: string }[]> {
  
  const ai1Name = ai1.nickname || ai1.realName
  const ai2Name = ai2.nickname || ai2.realName
  
  // 构建AI1的人设描述
  const ai1Persona = `
【${ai1Name}的人设】
${ai1.personality || '无特定人设'}
${ai1.signature ? `签名：${ai1.signature}` : ''}
`.trim()

  // 构建AI2的人设描述
  const ai2Persona = `
【${ai2Name}的人设】
${ai2.personality || '无特定人设'}
${ai2.signature ? `签名：${ai2.signature}` : ''}
`.trim()

  // 构建AI1和用户的聊天摘要
  const ai1UserChatSummary = ai1WithUserChat.length > 0
    ? ai1WithUserChat.slice(-5).map(m => 
        `${m.type === 'sent' ? '用户' : ai1Name}: ${m.content?.substring(0, 50) || '[特殊消息]'}`
      ).join('\n')
    : '暂无聊天记录'

  // 构建AI2和用户的聊天摘要
  const ai2UserChatSummary = ai2WithUserChat.length > 0
    ? ai2WithUserChat.slice(-5).map(m => 
        `${m.type === 'sent' ? '用户' : ai2Name}: ${m.content?.substring(0, 50) || '[特殊消息]'}`
      ).join('\n')
    : '暂无聊天记录'

  // 构建已有对话历史
  const chatHistory = existingMessages.length > 0
    ? existingMessages.slice(-10).map(m => `${m.senderName}: ${m.content}`).join('\n')
    : '（这是他们第一次聊天）'

  // 构建提示词
  const prompt = `你需要扮演两个AI角色进行对话。

${ai1Persona}

${ai2Persona}

【${ai1Name}和用户的近期聊天】
${ai1UserChatSummary}

【${ai2Name}和用户的近期聊天】
${ai2UserChatSummary}

【${ai1Name}和${ai2Name}的聊天历史】
${chatHistory}

现在请生成他们之间的新对话（2-4条消息），要求：
1. 每个角色都要符合自己的人设
2. 对话要自然、有来有往
3. 可以聊聊各自和用户的事情（但不要透露隐私）
4. 语气要符合年轻人聊天的感觉

输出格式（严格遵守）：
${ai1Name}: 消息内容
${ai2Name}: 消息内容
...

只输出对话内容，不要其他解释：`

  try {
    const apiSettings = getApiSettings()
    if (!apiSettings) {
      throw new Error('未配置API')
    }
    const result = await callAIApi([
      { role: 'user', content: prompt }
    ], apiSettings, false)
    const response = result.content || ''

    // 解析回复
    const lines = response.split('\n').filter((line: string) => line.trim())
    const newMessages: { senderId: string; senderName: string; content: string }[] = []

    for (const line of lines) {
      // 匹配格式：角色名: 内容
      const match = line.match(/^(.+?)[：:]\s*(.+)$/)
      if (match) {
        const [, name, content] = match
        const trimmedName = name.trim()
        
        if (trimmedName === ai1Name || trimmedName.includes(ai1Name)) {
          newMessages.push({
            senderId: ai1.id,
            senderName: ai1Name,
            content: content.trim()
          })
        } else if (trimmedName === ai2Name || trimmedName.includes(ai2Name)) {
          newMessages.push({
            senderId: ai2.id,
            senderName: ai2Name,
            content: content.trim()
          })
        }
      }
    }

    return newMessages
  } catch (error) {
    console.error('AI对话生成失败:', error)
    throw error
  }
}

/**
 * AI间私信聊天
 * 两个AI已经加上好友，现在进行私信对话
 * 根据用户聊天记录中的暗示进行互动
 */
export async function decideFriendRequest(
  requesterId: string,
  _requesterName: string,
  targetId: string,
  _targetName: string
): Promise<{ accepted: boolean; reply: string }> {
  
  // 获取两个角色的信息
  const allCharacters = await getAllCharacters()
  const requester = allCharacters.find(c => c.id === requesterId)
  const target = allCharacters.find(c => c.id === targetId)
  
  if (!requester || !target) {
    console.error('找不到角色信息')
    return { accepted: true, reply: '找不到角色信息' }
  }
  
  const requesterFullName = requester.nickname || requester.realName
  const targetFullName = target.nickname || target.realName
  
  // 获取两个AI和用户的聊天记录（用户聊天里有暗示为什么他们要私聊）
  const requesterWithUserChat = loadMessages(requesterId).slice(-20)
  const targetWithUserChat = loadMessages(targetId).slice(-20)
  
  // 获取AI间已有的聊天记录（第一条是验证消息，也就是第一句话）
  const { loadAIChat } = await import('../components/AITwoAIChatViewer')
  const aiChatMessages = loadAIChat(requesterId, targetId)
  
  // 替换人设中的变量
  const requesterPersonality = replaceVariables(requester.personality || '暂无人设', requesterFullName)
  const targetPersonality = replaceVariables(target.personality || '暂无人设', targetFullName)
  
  // 构建提示词 - 两个人私信聊天
  const prompt = `# AI私信对话

你要扮演两个角色在微信私信聊天。请仔细阅读他们的人设和聊天背景。

## 角色1：${requesterFullName}
${requesterPersonality}

## 角色2：${targetFullName}
${targetPersonality}

## 背景：用户和${requesterFullName}的对话（重要！用户可能有指示）
${requesterWithUserChat.length > 0 
  ? requesterWithUserChat.slice(-10).map(m => 
      `${m.type === 'sent' ? '用户' : requesterFullName}: ${m.content?.substring(0, 150) || '[消息]'}`
    ).join('\n')
  : '无'}

## 背景：用户和${targetFullName}的对话（重要！用户可能有指示）
${targetWithUserChat.length > 0 
  ? targetWithUserChat.slice(-10).map(m => 
      `${m.type === 'sent' ? '用户' : targetFullName}: ${m.content?.substring(0, 150) || '[消息]'}`
    ).join('\n')
  : '无'}

## 他们之前的私信（接着聊）
${aiChatMessages.length > 0
  ? aiChatMessages.slice(-6).map(m => `${m.senderName}: ${m.content}`).join('\n')
  : '（第一次私信）'}

## 任务
1. 仔细看用户和两个角色的对话，用户可能说了"让他骂XX"、"问他XXX"等指示
2. 根据各自人设性格说话，不要出戏
3. 接着上面的私信继续聊，不要重复之前说过的话
4. 每条消息要短，像真人发微信一样，一句话一条

## 输出格式（严格！每行一条消息）
${targetFullName}: 消息内容
${requesterFullName}: 消息内容

直接输出对话，不要解释：`

  // 打印提示词到控制台
  console.log('========== 好友申请决定提示词 ==========')
  console.log(prompt)
  console.log('==========================================')

  try {
    // 使用主API
    const apiSettings = getApiSettings()
    if (!apiSettings) {
      throw new Error('未配置API')
    }
    const result = await callAIApi([
      { role: 'user', content: prompt }
    ], apiSettings, false)
    const response = result.content || ''
    
    console.log('📨 [私信] API原始回复:', response)
    
    // 解析回复 - 直接解析私信对话
    const lines = response.split('\n').filter((line: string) => line.trim())
    let lastReply = ''
    
    // 转义正则特殊字符
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const targetEscaped = escapeRegex(targetFullName)
    const requesterEscaped = escapeRegex(requesterFullName)
    
    console.log('📨 [私信] 解析中...', { targetFullName, requesterFullName, lines })
    
    // 先收集所有要添加的消息，然后批量保存
    const newMessages: Array<{senderId: string, senderName: string, content: string}> = []
    
    for (const line of lines) {
      console.log('📨 [私信] 正在解析行:', line)
      
      // 解析目标角色的消息
      const targetMatch = line.match(new RegExp(`^${targetEscaped}[：:]\\s*(.+)$`))
      if (targetMatch) {
        lastReply = targetMatch[1].trim()
        newMessages.push({ senderId: targetId, senderName: targetFullName, content: lastReply })
        console.log(`📨 [私信] ✅ ${targetFullName}: ${lastReply}`)
      }
      // 解析请求者的消息
      const requesterMatch = line.match(new RegExp(`^${requesterEscaped}[：:]\\s*(.+)$`))
      if (requesterMatch) {
        const requesterReply = requesterMatch[1].trim()
        newMessages.push({ senderId: requesterId, senderName: requesterFullName, content: requesterReply })
        lastReply = requesterReply
        console.log(`📨 [私信] ✅ ${requesterFullName}: ${requesterReply}`)
      }
    }
    
    console.log(`📨 [私信] 共解析到 ${newMessages.length} 条消息`)
    
    // 批量添加消息（只load/save一次）
    if (newMessages.length > 0) {
      const { loadAIChat, saveAIChat } = await import('../components/AITwoAIChatViewer')
      const existingMessages = loadAIChat(requesterId, targetId)
      const now = new Date()
      let counter = 0
      
      for (const msg of newMessages) {
        const uniqueId = Date.now() * 1000 + (counter++)
        existingMessages.push({
          id: uniqueId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          content: msg.content,
          timestamp: now.getTime(),
          time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        })
      }
      
      saveAIChat(requesterId, targetId, existingMessages)
      console.log(`📨 [私信] 已保存 ${newMessages.length} 条新消息，总共 ${existingMessages.length} 条`)
    }
    
    // 更新好友关系状态为已接受（直接就是好友）
    saveFriendship(requesterId, targetId, {
      status: 'accepted',
      requesterId,
      targetId,
      timestamp: Date.now()
    })
    
    console.log(`📇 [私信] ${requesterFullName} 和 ${targetFullName} 进行了私信对话`)
    
    return { accepted: true, reply: lastReply }
  } catch (error) {
    console.error('私信对话失败:', error)
    return { accepted: true, reply: '对话失败' }
  }
}
