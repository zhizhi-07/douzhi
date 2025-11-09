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
  privateChatSync?: { enabled: boolean, messageCount: number },
  summary?: GroupChatSummary  // 🔥 总结（可选）
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
1. **推演角色关系网络** - 分析角色之间的关系和互动模式
2. **构思完整故事** - 基于关系设计自然的情节发展
3. **编排对话剧本** - 创作真实、口语化的群聊对话

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

### AI成员列表
${aiMembersInfo}

${privateChatSync && privateChatSync.enabled ? `
### 成员私信记录（AI记忆增强）

重要：以下是每个AI成员与用户的私聊记录，帮助你了解他们之间的关系和互动历史。

${aiMembers.map(member => {
  // 加载该成员与用户的私信
  const privateMsgs = loadMessages(member.id) || []
  const recentPrivateMsgs = privateMsgs.slice(-privateChatSync.messageCount)
  
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
}).join('\n\n---\n\n')}

---
` : ''}

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

### 第一步：分析人设关系（50-100字）
根据每个角色的**性格描述**，分析互动模式。

### 第二步：构思情节（50-100字）
基于人设，设计对话发展。

### 第三步：编排台词
将故事转化为对话：
- 允许连续发言（同一人可连发2-3条）
- 有人话多，有人话少，有人不发言
- 可以打断、插话、抢话
- 不要机械轮流
- **每个人都是主角**：根据角色性格决定是否参与，主要参与者多说，次要参与者少说，不参与者不出现

---

## 输出格式（严格遵守）

### 格式规范
每个AI成员的回复占一行：

**文字消息**：
\`\`\`
[成员名] 回复内容
\`\`\`

**发送表情包**：
\`\`\`
[成员名] [表情:编号]
\`\`\`

⚠️ **格式要求**：
- 必须用方括号 \`[ ]\` 包裹成员名
- 成员名后直接跟内容，中间只有一个空格
- 发送表情包时使用 \`[表情:编号]\` 格式，编号对应上面的表情包列表
- 每条回复独立成行
- 不要添加序号、标记、装饰

### 数量控制

**基础规则**：群成员数量 × (2到4) 条消息

当前AI成员数：${aiMembers.length}
建议输出：${aiMembers.length * 2}-${aiMembers.length * 4} 条消息

**分配灵活**：
- 主要参与者可以多说
- 次要参与者可以少说
- 不参与者不出现

---

## 🗣️ 口语化要求（核心！）

### 每条消息必须像真人打字

✅ **正确**：
- "哈哈哈笑死"
- "？？？"
- "emmm"
- "你在干嘛呀"
- "绝了😂"
- "..."
- "[表情:1]" ← 发送表情包（根据情境选择合适的表情）

❌ **错误**：
- "我认为这个问题需要从多个角度分析" ← 太书面！
- "非常感谢你的分享" ← 太正式！

### 基本要求

- 每条消息 **5-20字**，超过就分多条
- 一个想法可以分2-3条发（更真实）
- 根据角色性格使用语气词、表情、网络用语
- 可以打断、插话、抢话
- **表情包使用建议**：可以在合适的情境中发送表情包（如大笑、哭泣、尴尬等），但不要过度使用

---

## 严格符合人设

**每句话前问自己：这真的是这个角色会说的吗？**

不同性格的角色说话方式完全不同，必须根据角色的性格描述来创作台词。

---

## 重要约束

### 输出禁令
❌ 绝对禁止：
- "我是AI"、"我不能"、"根据设定"
- 项目符号、编号列表、Markdown格式
- 油腻霸道总裁语言（"宝贝"、"乖"、"你只能是我的"）

---

## 最终输出格式（JSON）

\`\`\`json
{
  "relationships": "基于人设的关系分析（50-100字）",
  "plot": "情节构思（50-100字）",
  "actions": [
    {"actorName": "角色名", "content": "台词"},
    {"actorName": "角色名", "content": "[表情:1]"},
    {"actorName": "角色名", "content": "台词", "quotedMessageId": "msg_xxx"},
    {"actorName": "角色名", "content": "[撤回:msg_xxx]"},
    {"actorName": "角色名", "content": "[踢出:成员名]"},
    {"actorName": "角色名", "content": "[群公告:新公告内容]"}
  ]
}
\`\`\`

**字段说明**：
- \`actorName\`：发言的角色名（必填）
- \`content\`：台词内容、表情包或指令（必填）
- \`quotedMessageId\`：引用的消息ID（可选，用于回复特定消息）

**引用消息功能**：
- 如果需要回复/引用之前的某条消息，可以添加 \`quotedMessageId\` 字段
- 消息ID可以从聊天记录中获取（每条消息都有唯一的ID）
- 引用后会在消息上方显示被引用的内容
- ⚠️ 不要滥用引用，只在真正需要回复特定消息时使用

**特殊指令**（根据角色权限和人设使用）：
- \`[撤回:msg_xxx]\`：撤回指定的消息（可以撤回自己的消息，或管理员撤回任何人的消息）
- \`[踢出:成员名]\`：将成员移出群聊（仅管理员/群主可用）
- \`[群公告:内容]\`：修改群公告（仅管理员/群主可用）

⚠️ **指令使用原则**：
- 这些指令是真实功能，会立即执行，请谨慎使用
- 必须符合角色的权限（是否是管理员/群主）
- 必须符合角色的性格（不要滥用权限）
- 可以在指令前后添加普通台词，例如先说话再撤回

检查清单：
- 输出了relationships和plot？
- 构思了情节？
- 每条5-20字？
- 口语化、碎片化？
- 严格符合人设？
- 输出数量 = 成员数×(2到4)？
- 使用正确的格式？
- 没有破坏沉浸感的内容？

---

## 【最后强调 - 人设是第一优先级】

在输出前，再次确认每个角色的核心人设：

${aiMembers.map(m => `- **${m.name}**：${m.description.split('。')[0]}。`).join('\n')}

**绝对禁止**：
- 说出不符合人设的话
- 性格突然转变
- 忘记角色关系

**每句话前问自己**：这真的是${aiMembers.map(m => m.name).join('、')}会说的吗？

---

现在请按三步创作法输出JSON，只输出JSON，不要其他内容！`
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
  privateChatSync?: { enabled: boolean, messageCount: number },
  summary?: GroupChatSummary  // 🔥 总结（可选）
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
    
    // 显示私聊同步信息
    if (privateChatSync && privateChatSync.enabled) {
      console.log('\n💬 私聊同步配置：')
      console.log(`  ✅ 已启用，同步条数: ${privateChatSync.messageCount}`)
      const aiMembers = members.filter(m => m.type === 'character')
      aiMembers.forEach(member => {
        const privateMsgs = loadMessages(member.id) || []
        console.log(`  - ${member.name}: 共${privateMsgs.length}条私信，同步最近${Math.min(privateMsgs.length, privateChatSync.messageCount)}条`)
      })
    } else {
      console.log('\n💬 私聊同步: ❌ 未启用')
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.groupEnd()
    
    // 构建提示词
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis, announcement, privateChatSync, summary)
    
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
    
    // 🔥 输出AI原始回复
    console.group('💭 [群聊导演] AI原始回复')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(aiReply)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📏 回复长度: ${aiReply.length}字符`)
    console.groupEnd()
    
    // 解析响应
    const script = extractGroupChatScript(aiReply)
    
    if (script) {
      // 🔥 输出解析后的剧本
      console.group('🎭 [群聊导演] 解析后的剧本')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n🔗 关系分析：')
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
