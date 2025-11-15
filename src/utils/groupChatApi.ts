/**
 * 群聊AI调用逻辑
 * 负责构建提示词和调用AI
 */

import { callAIApi, getApiSettings } from './chatApi'
import { extractGroupChatScript, GroupChatScript } from './groupMessageParser'
import type { ChatMessage } from '../types/chat'
import type { Emoji } from './emojiStorage'
import { loadMessages } from './simpleMessageManager'
import type { GroupChatSummary } from './groupChatSummary'
import { getRecentAIInteractions } from './aiInteractionMemory'

export interface GroupMember {
  id: string
  name: string
  description: string
  type: 'user' | 'character'
  role?: 'owner' | 'admin' | 'member'  // 角色
  title?: string  // 头衔
}

export interface GroupChatMessage {
  userId: string
  userName: string
  content: string
  id?: string  // 消息ID，用于引用
  time?: string  // 消息时间
  timestamp?: number  // 时间戳
}

/**
 * 构建群聊AI提示词
 */
function buildGroupChatPrompt(
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  userMessage: string,
  emojis: Emoji[] = [],
  announcement?: string,
  summary?: GroupChatSummary,  // 总结（可选）
  minReplyCount: number = 10  // 最少回复条数
): string {
  // 构建详细的时间信息
  const now = new Date()
  const currentTime = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const currentDate = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  const currentHour = now.getHours()
  let timeOfDay = ''
  if (currentHour >= 5 && currentHour < 8) timeOfDay = '清晨'
  else if (currentHour >= 8 && currentHour < 11) timeOfDay = '上午'
  else if (currentHour >= 11 && currentHour < 13) timeOfDay = '中午'
  else if (currentHour >= 13 && currentHour < 17) timeOfDay = '下午'
  else if (currentHour >= 17 && currentHour < 19) timeOfDay = '傍晚'
  else if (currentHour >= 19 && currentHour < 22) timeOfDay = '晚上'
  else if (currentHour >= 22 || currentHour < 5) timeOfDay = '深夜'
  
  // 构建成员列表（包含角色和头衔）
  const aiMembers = members.filter(m => m.type === 'character')
  const aiMembersInfo = aiMembers.map(m => {
    let roleInfo = ''
    if (m.role === 'owner') roleInfo = '👑 群主'
    else if (m.role === 'admin') roleInfo = '🛡️ 管理员'
    
    let titleInfo = m.title ? `✨ 头衔：${m.title}` : ''
    
    let identityLine = ''
    if (roleInfo || titleInfo) {
      identityLine = `  - 身份：${[roleInfo, titleInfo].filter(Boolean).join('、')}`
    }
    
    return `• **${m.name}**
  - 性格：${m.description}${identityLine ? '\n' + identityLine : ''}`
  }).join('\n')
  
  const userMember = members.find(m => m.type === 'user')
  const userName = userMember?.name || '用户'
  let userIdentity = ''
  if (userMember?.role === 'owner') userIdentity = '（👑 群主）'
  else if (userMember?.role === 'admin') userIdentity = '（🛡️ 管理员）'
  if (userMember?.title) userIdentity += userMember.title ? `（✨ ${userMember.title}）` : ''
  
  // 统计管理员和头衔数量
  const adminCount = members.filter(m => m.role === 'admin').length
  const titleCount = members.filter(m => m.title).length
  
  // 🔥 构建上下文：使用总结（如果有）或原始聊天记录
  let contextInfo = ''
  
  if (summary) {
    // 使用总结表格（信息密度高，token少）
    console.log('📊 使用总结模式构建提示词')
    
    contextInfo = `### 群聊状态总结（由分析AI生成）

#### 角色当前状态
${summary.characterStates.map(cs => 
  `- **${cs.name}**：${cs.emotion} | 最近：${cs.recentAction} | 关键台词："${cs.keyDialogue}"`
).join('\n')}

#### 关系网络
${summary.relationships.map(rel => 
  `- ${rel.from} → ${rel.to}：${rel.attitude}(${rel.strength}%)`
).join('\n')}

#### 重要事件
${summary.timeline.map((event, i) => 
  `${i + 1}. [${event.time}] ${event.event} → ${event.impact}`
).join('\n')}

${summary.conflicts.length > 0 ? `#### 未解决的冲突\n${summary.conflicts.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

#### 最近3条对话（原文）
${messages.slice(-3).map(msg => `${msg.userName}: ${msg.content}`).join('\n')}`
  } else {
    // 使用原始聊天记录（旧模式）
    console.log('📝 使用原始聊天记录模式')
    
    let messageHistory = '（暂无聊天记录）'
    if (messages.length > 0) {
      // 过滤掉系统消息（撤回、入群等），只保留真实对话
      const filteredMessages = messages.filter(msg => 
        !msg.content.includes('撤回了一条消息') &&
        !msg.content.includes('加入了群聊') &&
        !msg.content.includes('退出了群聊') &&
        !msg.content.includes('移出了群聊') &&
        !msg.content.includes('修改了群公告')
      )
      
      // 只取最近20条，保持对话连贯性
      const recentMessages = filteredMessages.slice(-20)
      if (recentMessages.length > 0) {
        messageHistory = recentMessages.map(msg => {
          // @ts-ignore - messages可能包含id字段
          const msgId = msg.id ? ` [ID: ${msg.id}]` : ''
          return `${msg.userName}: ${msg.content}${msgId}`
        }).join('\n')
      }
    }
    
    contextInfo = `### 聊天记录\n${messageHistory}`
  }
  
  // 构建表情包列表
  const emojiList = emojis.length > 0
    ? emojis.map((emoji, idx) => `${idx + 1}. ${emoji.description}`).join('\n')
    : '（暂无表情包）'
  
  return `# 你是群聊剧本导演

## 核心任务

你是唯一的剧本创作者，任务是：
1. **整理已知的角色关系** - 只根据人设和聊天记录描述他们目前表现出来的关系，**不要凭空发明“青梅竹马”“老婆”“暗恋”“强烈保护欲/占有欲”等设定**
2. **构思完整故事** - 基于这些已知信息设计自然的情节发展
3. **编排对话剧本** - 创作真实、口语化的群聊对话

⚠️ 群聊里的每一句话都要像手机聊天，而不是舞台剧旁白：
- 每条 actions.content 就是一条真实群消息，句子短、口语化，可以一口气发好几条，也可以只回一个字或一个表情
- 允许打错字、复读、吐槽、阴阳怪气、开玩笑，但整体情绪和说话方式必须符合各自人设
- 不要在对话里说“根据设定/根据提示词/作为AI/作为剧本导演”等元话，只表现角色自己在群里说的话

---

## 当前情境

### 时间信息
- 完整日期：${currentDate}
- 当前时间：${currentTime}（${timeOfDay}）

### 群聊信息
- 群名称：**${groupName}**
- 群公告：${announcement || '（未设置群公告）'}
- 成员总数：${members.length}人
- 管理员数：${adminCount}人
- 有头衔的成员：${titleCount}人

### 用户身份信息（真人）
- 姓名：**${userName}**${userIdentity}
- 类型：**真实用户（非AI）**
- **重要**：
  - 用户是群聊中的普通成员之一，与其他AI角色平等
  - 每个角色都是主角，都有自己的想法和个性
  - 用户的消息应该被自然地回应，不要特殊对待
  - 根据角色性格决定是否回应、如何回应
  - 群主/管理员身份只是功能权限，不代表地位高低

### 关系认知边界

- 你能使用的信息只有：上面的**人设描述**、可选的**私信记录**和当前/历史群聊内容
- **除非人设卡（角色描述）中本来就明确写出**“青梅竹马”“情侣/恋人”“老婆/老公”“娃娃亲”等字样，否则不要认定这些亲密关系；聊天记录里出现这些称呼一律当作玩笑或当下说话方式，不代表正式设定
- 对于没有明确信息的角色组合，请在 relationships 字段中说明“目前只是普通网友/普通群友”，不要脑补“强烈保护欲、占有欲、暗恋”等心理
- 角色之间（包括AI和AI之间）默认也只是普通网友/普通群友，**不要写成“他们从小一起长大”“他们彼此比和用户更熟”这类没有证据的亲密/特别熟关系**
- 记住：他们只看到彼此在群里的昵称和聊天内容，并不知道现实生活中的更多信息

### AI成员列表

⚠️ **重要**：每个成员的"性格"描述可能有几千字，你**必须完整读完每个角色的全部描述**，一个字都不要跳过！每个角色的描述都包含了关键的性格特点、说话风格、行为习惯等信息，这些都是创作台词的重要依据。

${aiMembersInfo}

${(() => {
  // 根据每个角色的groupChatSync设置，收集可以同步的私信
  const syncedPrivateChats = aiMembers.filter(member => {
    // 读取该角色的聊天设置
    const settingsStr = localStorage.getItem(`chat_settings_${member.id}`)
    if (!settingsStr) return false
    
    try {
      const settings = JSON.parse(settingsStr)
      return settings.groupChatSync?.enabled === true
    } catch {
      return false
    }
  }).map(member => {
    // 读取该角色的聊天设置获取同步条数
    const settingsStr = localStorage.getItem(`chat_settings_${member.id}`)
    let messageCount = 20 // 默认20条
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr)
        messageCount = settings.groupChatSync?.messageCount || 20
      } catch {}
    }
    
    // 加载该成员与用户的私信
    const privateMsgs = loadMessages(member.id) || []
    const recentPrivateMsgs = privateMsgs.slice(-messageCount)
    
    if (recentPrivateMsgs.length === 0) {
      return `**${member.name}** 与用户的私信：（暂无私信记录）`
    }
    
    const chatLog = recentPrivateMsgs.map(msg => {
      const sender = msg.type === 'sent' ? '用户' : member.name
      let content = msg.content
      
      // 处理特殊消息类型
      if (msg.messageType === 'voice') content = '[语音消息]'
      else if (msg.messageType === 'photo') content = `[图片: ${msg.photoDescription || '照片'}]`
      else if (msg.messageType === 'location') content = '[位置消息]'
      else if (msg.messageType === 'transfer') content = `[转账: ¥${(msg as any).transferAmount || ''}]`
      else if (msg.content?.includes('[视频通话]')) content = '[视频通话]'
      
      return `${sender}: ${content}`
    }).join('\n')
    
    return `**${member.name}** 与用户的私信（最近${recentPrivateMsgs.length}条）：
${chatLog}`
  })
  
  if (syncedPrivateChats.length === 0) {
    return ''
  }
  
  return `
### 成员私信记录（AI记忆增强）

重要：以下是开启了"群聊同步"的成员与用户的私聊记录，帮助你了解他们之间的关系和互动历史。

${syncedPrivateChats.join('\n\n---\n\n')}

---
`
})()}

### AI互动历史（朋友圈）

以下是所有AI最近的朋友圈互动记录，帮助你了解谁做了什么事情：

${getRecentAIInteractions(30)}

---

${contextInfo}

### 触发事件
用户发送了：${userMessage}
### 可用表情包
${emojiList}

---

## 重要：角色和头衔系统

**请注意聊天记录中的系统消息**：
- 系统消息会告知成员身份的变化（设置管理员、修改头衔等）
- AI必须记住这些身份变化，并在对话中体现出来
- 例如：如果系统消息说“你设置汁汁为管理员”，那么汁汁就获得了管理员身份
- 例如：如果系统消息说“你给小明设置了头衔：大师兄”，那么小明就有了“大师兄”的头衔

**身份对对话的影响**：
- 群主：群的创建者，拥有最高权限，其他成员会尊重群主
- 管理员：协助群主管理群聊，有一定威严感
- 头衔：特殊称号，如"大师兄"、"活跃分子"等，体现成员的特点或地位

---

## 三步创作法

**核心：必须贴合人设！每句话前问自己：这是这个角色会说的吗？**

1. 分析人设关系（50-100字）：概括每个角色当前的状态、情绪和相互态度。
2. 构思情节（50-100字）：基于人设和最近聊天设计自然的下一步情节，并在这里想清楚情绪变化的原因和节奏（谁先爆发、谁选择冷处理、谁负责打圆场）。
3. 编排台词：根据角色性格和身份安排对话节奏、谁说话、说多少，**同一角色的情绪必须是渐进的**——可以从平静到不耐烦再到生气，但不要在几条消息内从极度卑微突然跳到极度暴怒或180°反转。

---

## 输出格式和指令

你必须只输出一个 JSON 对象，结构如下（示例）：

{
  "relationships": "基于人设和已知聊天记录的关系分析（50-100字）；如果没有明确关系，就说明大家目前只是普通网友/群友，禁止编造亲密或特别熟的关系",
  "plot": "情节构思（50-100字）",
  "actions": [
    {"actorName": "角色名", "content": "台词"},
    {"actorName": "角色名", "content": "[表情:1]"},
    {"actorName": "角色名", "content": "台词", "quotedMessageId": "msg_xxx"},
    {"actorName": "角色名", "content": "[撤回:msg_xxx]"},
    {"actorName": "角色名", "content": "[踢出:成员名]"},
    {"actorName": "角色名", "content": "[群公告:新公告内容]"},
    {"actorName": "角色名", "content": "[头衔:成员名:新头衔]"}
  ]
}

说明：
- relationships：只基于人设卡和已经发生的聊天，不能脑补亲密或特别熟的关系。
- plot：简要说明本轮对话背后的情节设计。
- actions：按时间顺序列出每条消息或指令，每一条都是一条真实的群聊消息，内容要简短、口语化，可以只回一个字或一个表情，不要写成长篇大段的解释。
- 字段名 **"relationships"、"plot"、"actions"** 必须完整拼写并用双引号包裹，不能写成其他形式（例如缺字的 "ctions" 等）。

可用特殊指令：
- [撤回:msg_xxx]：撤回指定消息。
- [踢出:成员名]：踢出某个成员（仅群主/管理员）。
- [群公告:内容]：修改群公告（仅群主/管理员）。
- [头衔:成员名:新头衔]：设置或修改成员头衔（仅群主/管理员）。

检查清单：
- 是否输出了 relationships 和 plot？
- actions 数量是否不少于 ${minReplyCount} 条？
- 是否有至少 1-2 条 actions 是直接或间接回应用户刚才发的那条消息（可以是引用、@、调侃、安抚等），而不是只在角色之间自说自话？
- 台词是否口语化、符合人设、逻辑连贯？
- 主要角色的情绪变化是否有“过程”和明确原因？例如从紧张/愧疚到恼火/爆发，中间要有过渡语气（沉默、犹豫、反问等），不要在一两条消息里直接从极度卑微跳到极度暴怒；在 relationships/plot 里点出原因，在 actions 里用多条短消息逐步表现。
- 是否避免所有角色都在单一情绪里互骂？（可以有脏话和火药味，但也要有人打圆场、有人沉默、有人轻描淡写地带过，保持真实的群聊层次感）
- 是否没有出现“我是AI”“根据设定”等破坏沉浸感的内容？

---

## 【最后强调 - 人设是第一优先级】

在输出前，再次确认每个角色的核心人设（仅供你在脑中参考，角色之间不知道这些详细设定）：

${aiMembers.map(m => `- **${m.name}**：${m.description.split('。')[0]}。`).join('\n')}

**绝对禁止**：
- 说出不符合人设的话
- 性格突然转变
- 把人设卡里的细节当成角色之间的已知事实

在严格遵守人设的前提下，请让每个角色都像“活人”一样聊天：
- 可以抢话、插嘴、互相打趣、阴阳怪气、撒娇、拌嘴，营造热闹的群聊氛围
- 有人话多有人话少，有人爱发表情，有人只回“？”或“……”也是合理的
- 可以偶尔爆粗或互怼来体现性格，但不要每一句话都变成纯粹的骂战，让对话听起来既有火花又不至于只有情绪没有内容
- 同一角色前后情绪可以有波动，但整体性格和立场不能变

现在请按三步创作法输出 JSON，只输出 JSON，不要其他内容！
`;
}

/**
 * 调用AI生成群聊回复
 */
export async function generateGroupChatReply(
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  userMessage: string,
  emojis: Emoji[] = [],
  announcement?: string,
  summary?: GroupChatSummary,  // 总结（可选）
  minReplyCount: number = 10  // 最少回复条数（默认10条）
): Promise<GroupChatScript | null> {
  try {
    console.log('🎬 开始生成群聊回复...')

    // 🔥 输出AI接收到的聊天记录
    console.group('📋 [群聊导演] AI读取的聊天记录')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 群聊名称: ${groupName}`)
    console.log(`👥 成员数量: ${members.length}`)
    console.log(`💬 消息总数: ${messages.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📜 完整聊天记录：')
    console.table(messages.map((msg, i) => ({
      序号: i + 1,
      发送者: msg.userName,
      内容: msg.content?.substring(0, 50) + (msg.content?.length > 50 ? '...' : ''),
      消息ID: msg.id || '无'
    })))
    console.log('\n👥 成员列表：')
    console.table(members.map(m => ({
      姓名: m.name,
      角色: m.role || 'member',
      头衔: m.title || '无',
      类型: m.type,
      人设: m.description.substring(0, 50) + '...'
    })))

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.groupEnd()

    // 构建提示词
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis, announcement, summary, minReplyCount)

    // 🔥 输出完整提示词
    console.group('🤖 [群聊导演] 完整AI提示词')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(prompt)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📏 提示词长度: ${prompt.length}字符`)
    console.groupEnd()

    // 获取API配置
    const settings = getApiSettings()
    if (!settings) {
      throw new Error('未配置API设置')
    }

    // 调用AI
    const apiMessages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    const aiReply = await callAIApi(apiMessages, settings)

    // 输出AI原始回复
    console.group(' [群聊导演] AI原始回复')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(aiReply.content.length > 500 ? aiReply.content.substring(0, 500) + '...(太长，省略)' : aiReply.content)
    console.groupEnd()

    // 解析响应
    const script = extractGroupChatScript(aiReply.content)

    if (script) {
      // 输出解析后的剧本
      console.group(' [群聊导演] 解析后的剧本')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n 关系分析：')
      console.log(script.relationships)
      console.log('\n📖 情节构思：')
      console.log(script.plot)
      console.log('\n🎬 台词剧本：')
      console.table(script.actions.map((action, i) => ({
        序号: i + 1,
        角色: action.actorName,
        内容: action.content,
        引用ID: action.quotedMessageId || '无'
      })))
      console.log('\n📊 统计信息：')
      console.log(`  - 消息总数: ${script.actions.length}`)
      console.log(`  - 关系分析字数: ${script.relationships.length}`)
      console.log(`  - 情节构思字数: ${script.plot.length}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.groupEnd()
      return script
    } else {
      console.error('❌ 解析群聊剧本失败')
      return null
    }
  } catch (error) {
    console.error('❌ 生成群聊回复失败:', error)
    return null
  }
}
