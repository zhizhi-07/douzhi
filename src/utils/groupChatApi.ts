/**
 * 群聊AI调用逻辑
 * 负责构建提示词和调用AI
 */

import { callAIApi, getApiSettings } from './chatApi'
import { extractGroupChatScript, GroupChatScript } from './groupMessageParser'
import type { ChatMessage } from '../types/chat'
import type { Emoji } from './emojiStorage'

export interface GroupMember {
  id: string
  name: string
  description: string
  type: 'user' | 'character'
}

export interface GroupChatMessage {
  userId: string
  userName: string
  content: string
}

/**
 * 构建群聊AI提示词
 */
function buildGroupChatPrompt(
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  userMessage: string,
  emojis: Emoji[] = []
): string {
  const now = new Date()
  const currentTime = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  // 构建成员列表
  const aiMembers = members.filter(m => m.type === 'character')
  const aiMembersInfo = aiMembers.map(m => `• **${m.name}**
  - 性格：${m.description}`).join('\n')
  
  const userName = members.find(m => m.type === 'user')?.name || '用户'
  
  // 构建聊天记录
  const messageHistory = messages.length > 0
    ? messages.slice(-20).map(msg => `${msg.userName}: ${msg.content}`).join('\n')
    : '（群聊刚创建，暂无消息）'
  
  // 构建表情包列表
  const emojiList = emojis.length > 0
    ? emojis.map((emoji, idx) => `${idx + 1}. ${emoji.description}`).join('\n')
    : '（暂无表情包）'
  
  return `# 🎬 你是群聊剧本导演

## 🎯 核心任务

你是唯一的剧本创作者，任务是：
1. **推演角色关系网络** - 分析角色之间的关系和互动模式
2. **构思完整故事** - 基于关系设计自然的情节发展
3. **编排对话剧本** - 创作真实、口语化的群聊对话

---

## 📋 当前情境

### 群聊信息
- 群名称：${groupName}
- 当前时间：${currentTime}
- 成员总数：${members.length}

### 群成员列表

**用户（真人）**：
• ${userName}

**AI成员**：
${aiMembersInfo}

### 聊天记录
${messageHistory}

### 触发事件
用户发送了：${userMessage}

### 📦 可用表情包
${emojiList}

---

## 🎭 三步创作法

### 第一步：关系推演
根据角色人设和聊天历史，深入分析角色之间的关系动态。

### 第二步：情节构思
基于推演出的关系，构思一个自然的故事发展。

### 第三步：编排台词
将故事转化为对话：
- ✅ 允许连续发言（同一人可连发2-3条）
- ✅ 有人话多，有人话少，有人不发言
- ✅ 可以打断、插话、抢话
- ❌ 不要机械轮流
- 只写参与者，没台词的角色不要出现

---

## 📝 输出格式（严格遵守）

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

- 💬 每条消息 **5-20字**，超过就分多条
- 🎯 一个想法可以分2-3条发（更真实）
- 😊 根据角色性格使用语气词、表情、网络用语
- 🗨️ 可以打断、插话、抢话
- 🎨 **表情包使用建议**：可以在合适的情境中发送表情包（如大笑、哭泣、尴尬等），但不要过度使用

---

## 🎭 严格符合人设

**每句话前问自己：这真的是这个角色会说的吗？**

不同性格的角色说话方式完全不同，必须根据角色的性格描述来创作台词。

---

## 🚫 重要约束

### 输出禁令
❌ 绝对禁止：
- "我是AI"、"我不能"、"根据设定"
- 项目符号、编号列表、Markdown格式
- 油腻霸道总裁语言（"宝贝"、"乖"、"你只能是我的"）

---

## 📊 最终输出格式（JSON）

\`\`\`json
{
  "relationships": "关系分析（20字内）",
  "plot": "情节构思（30字内）",
  "actions": [
    {"actorName": "角色名", "content": "台词"},
    {"actorName": "角色名", "content": "[表情:1]"},
    {"actorName": "角色名", "content": "台词"}
  ]
}
\`\`\`

**检查清单**：
- ✅ 推演了关系？
- ✅ 构思了情节？
- ✅ 每条5-20字？
- ✅ 口语化、碎片化？
- ✅ 严格符合人设？
- ✅ 输出数量 = 成员数×(2到4)？
- ✅ 使用 \`[成员名] 内容\` 格式？
- ✅ 没有破坏沉浸感的内容？

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
  emojis: Emoji[] = []
): Promise<GroupChatScript | null> {
  try {
    console.log('🎬 开始生成群聊回复...')
    
    // 构建提示词
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis)
    
    // 获取API配置
    const settings = getApiSettings()
    if (!settings) {
      throw new Error('未配置API设置')
    }
    
    // 调用AI
    const apiMessages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    const response = await callAIApi(apiMessages, settings)
    
    console.log('✅ AI回复:', response)
    
    // 解析响应
    const script = extractGroupChatScript(response)
    
    if (!script) {
      console.error('❌ 解析群聊剧本失败')
      return null
    }
    
    console.log('📊 剧本信息:')
    console.log('  关系分析:', script.relationships)
    console.log('  情节构思:', script.plot)
    console.log('  消息数量:', script.actions.length)
    
    return script
  } catch (error) {
    console.error('❌ 生成群聊回复失败:', error)
    return null
  }
}
