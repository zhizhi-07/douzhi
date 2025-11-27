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
  minReplyCount: number = 10,  // 最少回复条数
  lorebookContext?: string  // 世界书上下文
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
  
  // 检查待处理的转账（用户发给AI成员的）
  const pendingTransfers = messages.filter(msg => 
    (msg as any).messageType === 'transfer' && 
    (msg as any).transfer?.status === 'pending' && 
    msg.userId === 'user'
  )
  
  let transferInstructions = ''
  if (pendingTransfers.length > 0) {
    const transferList = pendingTransfers.map(msg => {
      const toName = (msg as any).transfer?.toUserName || '某成员'
      const amount = (msg as any).transfer?.amount || 0
      const note = (msg as any).transfer?.message || ''
      return `- 用户给 **${toName}** 转账 ¥${amount}${note ? ` (留言: ${note})` : ''}`
    }).join('\n')
    
    transferInstructions = `

### ⚠️ 待处理的转账

${transferList}

**转账接收者必须做出回应**：
- 如果接受：在actions中加入 {"actorName": "接收者名字", "content": "[接收转账]"}
- 如果拒绝：在actions中加入 {"actorName": "接收者名字", "content": "[退还]"}
- **处理转账后必须再发一条文本消息表达想法**（例如："谢谢！""不用了，退给你"等）

**注意**：只有转账的接收者才能处理，其他人不能代替。
`
  }
  
  // 检查待领取的红包（用户发送的且还有余额的）
  const availableRedPackets = messages.filter(msg => 
    (msg as any).messageType === 'redPacket' && 
    (msg as any).redPacket?.remainingCount > 0 &&
    msg.userId === 'user'
  )
  
  let redPacketInstructions = ''
  if (availableRedPackets.length > 0) {
    const rpList = availableRedPackets.map(msg => {
      const total = (msg as any).redPacket?.totalAmount || 0
      const remaining = (msg as any).redPacket?.remaining || 0
      const remainingCount = (msg as any).redPacket?.remainingCount || 0
      const blessing = (msg as any).redPacket?.blessing || ''
      return `- **${msg.userName}** 的红包还剩 ${remainingCount} 个 (¥${remaining}/${total}) - "${blessing}"`
    }).join('\n')
    
    redPacketInstructions = `

### 🧧 可领取的红包

${rpList}

**AI角色可以领取红包**：
- 看到红包时，可以选择领取：在actions中加入 {"actorName": "你的名字", "content": "[领取红包]"}
- **领取后可以发消息表达心情**（例如："哇！抢到了！""谢谢！"等）
- **每个角色只能领取一次同一个红包**，已领取过的不能再领
- 如果红包已被抢完（remainingCount=0），不要再尝试领取

**注意**：红包先到先得，剩余金额和个数会实时更新。
`
  }
  
  return `# 群聊对话生成

## 核心原则：角色第一，剧情第二

你的任务是**让每个角色像活人一样自然反应**，而不是设计剧情：

1. **先看人设，再想台词** - 每条消息前问自己："这个角色会这么说吗？"
2. **情绪要渐进** - 同一角色的情绪可以变化，但必须有过程（平静→不耐烦→生气），禁止突然180度转变
3. **说话像打字** - 每条消息就是一条真实的手机聊天，可以很短（一个字/表情），可以连发，可以打错字

⚠️ **绝对禁止**：
- ❌ 为了"推进剧情"让角色说不符合人设的话
- ❌ 情绪突然翻转（上一条还温柔，下一条突然暴怒）
- ❌ 说"根据设定/作为AI"等破坏沉浸感的话
- ❌ 每条消息都解释动机（"我这么说是因为..."）
- ❌ 把人设卡的细节当成角色之间的已知事实

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
${transferInstructions}${redPacketInstructions}

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
  console.log(`🔍 [群聊同步] 开始检查 ${aiMembers.length} 个AI成员的群聊同步设置`)
  
  const syncedPrivateChats = aiMembers.filter(member => {
    // 读取该角色的聊天设置
    const settingsStr = localStorage.getItem(`chat_settings_${member.id}`)
    if (!settingsStr) {
      console.log(`⚠️ [群聊同步] ${member.name} (${member.id}) 没有聊天设置`)
      return false
    }
    
    try {
      const settings = JSON.parse(settingsStr)
      const enabled = settings.groupChatSync?.enabled === true
      console.log(`${enabled ? '✅' : '❌'} [群聊同步] ${member.name} (${member.id}) 群聊同步: ${enabled ? '已开启' : '未开启'}`)
      return enabled
    } catch (e) {
      console.error(`❌ [群聊同步] ${member.name} (${member.id}) 设置解析失败:`, e)
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
    console.log(`📚 [群聊同步] ${member.name} (${member.id}) 的私信记录: ${privateMsgs.length} 条`)
    const recentPrivateMsgs = privateMsgs.slice(-messageCount)
    
    if (recentPrivateMsgs.length === 0) {
      console.log(`⚠️ [群聊同步] ${member.name} 没有私信记录`)
      return `**${member.name}** 与用户的私信：（暂无私信记录）`
    }
    
    console.log(`✅ [群聊同步] ${member.name} 同步最近 ${recentPrivateMsgs.length} 条私信`)
    
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
- 头衔：特殊称号，如“大师兄”、“活跃分子”等，体现成员的特点或地位

---

## ⚠️ 重要：导演工具 - send_theatre_card

**你作为导演，可以调用 send_theatre_card 工具让角色发送小剧场卡片**（红包、投票、朋友圈等）！

### 使用方式：
当需要角色发送卡片时，**在输出JSON剧本的同时调用工具**。工具调用会自动关联到对应角色。

### 工具参数：
- template_id: 模板ID（poll投票、red_packet红包、payment_success支付、memo_list清单等）
- data: 数据对象，根据模板不同而不同

### 示例场景：
用户说"发个投票来"，唐秋水要发投票：
1. 在actions中添加唐秋水的普通台词（可选）：{"actorName": "唐秋水", "content": "来了！"}
2. 调用工具：send_theatre_card(template_id='poll', data={'title': '投票标题', 'options': ['选项1', '选项2']})
3. 继续添加其他角色的台词

### 常用模板数据格式：
- poll投票: {'title': '标题', 'options': ['选项A', '选项B'], 'multiple_choice': False}
- red_packet红包: {'amount': 88.88, 'blessing': '祝福语'}
- payment_success支付: {'amount': 26.0, 'merchant': '商家名', 'receiver': '收款方'}
- memo_list清单: {'title': '标题', 'items': [{'text': '项目1', 'checked': False}]}

### 重要提示：
- 工具调用后会自动生成卡片消息，无需在actions中再写
- 可以在调用工具前后添加角色的台词来增加真实感

---

## 生成步骤（内部思考，不要输出）

**在写每条消息前，快速检查：**

1. **人设检查**（10秒）：这个角色现在是什么心情？Ta会怎么反应？
2. **情绪连贯**（5秒）：Ta上一条消息是什么情绪？这条能直接跳到新情绪吗？（不能就加过渡）
3. **说话方式**（5秒）：Ta平时怎么说话？口头禅是什么？会用表情吗？

**记住**：
- 不是每个角色都要说话（有人可能在潜水）
- 不是每句话都要推进剧情（可以闲聊、水群、发表情）
- 同一角色可以连发好几条短消息（像真人打字一样）

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
- [小剧场:模板名称]：让角色发送互动卡片（支付、红包、投票等），后面跟具体数据。
- [接收转账]：接收用户发给你的转账（仅当有待处理的转账时使用）。
- [退还]：退还用户发给你的转账（仅当有待处理的转账时使用）。
- [领取红包]：领取群里的红包（仅当有可领取的红包时使用）。

## ⚠️ 重要：AI角色可以发送特殊消息！

**不要只发纯文字！** 当场景合适时，AI角色应该主动使用以下特殊消息格式，让聊天更真实：

- **[语音:文字内容]** - 发送语音消息
  - 场景：不方便打字、情绪激动、撒娇、懒得打字时
  - 例：{"actorName": "小花", "content": "[语音:哎呀我在外面呢一会儿回来]"}
  
- **[图片:描述]** - 发送图片
  - 场景：分享所见、晒照片、发表情包、证明自己在哪
  - 例：{"actorName": "小明", "content": "[图片:刚拍的夕阳超美]"}
  
- **[位置:地点名称]** - 分享位置
  - 场景：约见面、告诉别人自己在哪、推荐地点
  - 例：{"actorName": "汁汁", "content": "[位置:星巴克万达店]"}
  
- **[转账:接收者:金额:留言]** - 给特定的人转账（一对一）
  - 场景：请客、还钱、送礼、打赌
  - 例：{"actorName": "土豪", "content": "[转账:小美:88:请你喝奶茶]"}
  
- **[红包:金额:个数:祝福语]** - 发群红包（手气红包，群里所有人都能抢）
  - 场景：炫富、群发福利、活跃气氛、挑衅
  - 例：{"actorName": "富二代", "content": "[红包:888:5:有本事来抢啊]"}（888元分5个红包）
  - 例：{"actorName": "老板", "content": "[红包:66.66:3:恭喜发财]"}（66.66元分3个红包）

**触发词提示**：当用户或角色说到以下内容时，优先考虑使用特殊消息：
- "你在哪" "发个位置" "在哪里" → 用 [位置:xxx]
- "发张图" "给你看" "拍给你" → 用 [图片:xxx]  
- "语音说" "懒得打字" → 用 [语音:xxx]
- "请你吃xxx" "转给你" "给你钱" → 用 [转账:xxx]（一对一转账）
- "发红包" "撒钱" "来抢" "给你们发" → 用 [红包:xxx]（群红包，所有人能抢）

**⚠️ 红包 vs 转账 的区别**：
- **[转账]**：给特定一个人，对方可以接收或退还
- **[红包]**：群红包，所有人可以抢，抢到金额随机（手气红包）

检查清单：
- 是否输出了 relationships 和 plot？
- actions 数量是否不少于 ${minReplyCount} 条？
- 是否有至少 1-2 条 actions 是直接或间接回应用户刚才发的那条消息（可以是引用、@、调侃、安抚等），而不是只在角色之间自说自话？
- 台词是否口语化、符合人设、逻辑连贯？
- **是否使用了特殊消息？** 当有人问"你在哪"就发[位置]，有人说"发张图"就发[图片]，适合语音的场景就发[语音]，不要全是纯文字！
- 主要角色的情绪变化是否有"过程"和明确原因？例如从紧张/愧疚到恼火/爆发，中间要有过渡语气（沉默、犹豫、反问等），不要在一两条消息里直接从极度卑微跳到极度暴怒；在 relationships/plot 里点出原因，在 actions 里用多条短消息逐步表现。
- 是否避免所有角色都在单一情绪里互骂？（可以有脏话和火药味，但也要有人打圆场、有人沉默、有人轻描淡写地带过，保持真实的群聊层次感）
- 是否没有出现"我是AI""根据设定"等破坏沉浸感的内容？

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

${lorebookContext ? `
---
## 【世界书信息】（背景知识和设定）

${lorebookContext}

💡 提示：这些是世界观和背景设定，请在对话中自然地体现，角色会根据这些设定来行动和说话。

---
` : ''}

现在请按三步创作法输出 JSON，只输出 JSON，不要其他内容！
`;
}

/**
 * 调用AI生成群聊回复
 */
export async function generateGroupChatReply(
  groupId: string,  // 群聊ID
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  userMessage: string,
  emojis: Emoji[] = [],
  announcement?: string,
  summary?: GroupChatSummary,  // 总结（可选）
  minReplyCount: number = 10,  // 最少回复条数（默认10条）
  lorebookId?: string  // 挂载的世界书ID
): Promise<GroupChatScript | null> {
  try {
    console.log('🎬 开始生成群聊回复...')

    // 🔥 读取世界书上下文
    let lorebookContext = ''
    if (lorebookId) {
      const { lorebookManager } = await import('./lorebookSystem')
      const recentText = messages.slice(-10).map(m => m.content).join('\n')
      lorebookContext = lorebookManager.buildContext(
        '', // 群聊没有单一角色ID
        recentText,
        2000,
        '',
        '用户',
        undefined,
        lorebookId  // 直接传入世界书ID
      )
      if (lorebookContext) {
        console.log('📚 [群聊] 已注入世界书上下文')
      }
    }

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
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis, announcement, summary, minReplyCount, lorebookContext)

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

    // 🎭 读取群聊小剧场功能开关
    const { groupChatManager } = await import('./groupChatManager')
    const group = groupChatManager.getGroup(groupId)
    const enableTheatreCards = group?.enableTheatreCards ?? true // 默认开启
    
    // 调用AI（导演可以调用send_theatre_card工具来让角色发送卡片）
    const apiMessages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    const aiReply = await callAIApi(apiMessages, settings, enableTheatreCards)

    // 输出AI原始回复
    console.group(' [群聊导演] AI原始回复')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(aiReply.content.length > 500 ? aiReply.content.substring(0, 500) + '...(太长，省略)' : aiReply.content)
    // 🔥 注意：API返回的是 tool_calls（带下划线）
    let toolCalls = (aiReply as any).tool_calls
    console.log('🔍 [调试] toolCalls:', toolCalls)
    console.log('🔍 [调试] content长度:', aiReply.content?.length)
    if (toolCalls && toolCalls.length > 0) {
      console.log('🎭 [工具调用]:', toolCalls)
    }
    console.groupEnd()

    // 🔥 处理纯 Function Calling 响应（content 为空但有 tool_calls）
    let finalContent = aiReply.content
    let collectedTheatreCalls: Array<{templateId: string, data: any}> = []
    
    const hasEmptyContent = !finalContent || finalContent.trim() === ''
    const hasToolCalls = toolCalls && toolCalls.length > 0
    console.log('🔍 [调试] hasEmptyContent:', hasEmptyContent, 'hasToolCalls:', hasToolCalls)
    
    if (hasEmptyContent && hasToolCalls) {
      console.log('🎭 [群聊导演] 检测到纯 Function Calling 响应，需要继续对话获取 JSON 剧本')
      
      // 收集工具调用结果
      const toolResults: any[] = []
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'send_theatre_card') {
          try {
            const args = JSON.parse(toolCall.function.arguments)
            console.log('🎭 [导演工具] 解析小剧场调用:', args)
            
            // 保存小剧场调用
            collectedTheatreCalls.push({
              templateId: args.template_id,
              data: args.data
            })
            
            // 构造工具执行成功的结果
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: true, message: `已发送${args.template_id}卡片` })
            })
          } catch (e) {
            console.error('❌ [导演工具] 解析失败:', e)
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: false, error: '解析失败' })
            })
          }
        }
      }
      
      // 发送工具结果，让 AI 继续生成 JSON 剧本
      if (toolResults.length > 0) {
        console.log('🔄 [群聊导演] 发送工具结果，请求 AI 继续生成 JSON 剧本')
        
        const followUpMessages: ChatMessage[] = [
          { role: 'user', content: prompt },
          { 
            role: 'assistant', 
            content: aiReply.content || '',
            tool_calls: toolCalls
          } as any,
          ...toolResults,
          { role: 'user', content: '工具调用已执行成功。现在请输出完整的 JSON 剧本（包含 relationships、plot、actions）。' }
        ]
        
        try {
          const followUpReply = await callAIApi(followUpMessages, settings, false) // 第二次调用不再启用工具
          console.log('🎬 [群聊导演] 后续回复:', followUpReply.content.substring(0, 200))
          finalContent = followUpReply.content
          
          // 合并新的 tool_calls（如果有）
          const newToolCalls = (followUpReply as any).toolCalls
          if (newToolCalls && newToolCalls.length > 0) {
            toolCalls = [...toolCalls, ...newToolCalls]
          }
        } catch (followUpError) {
          console.error('❌ [群聊导演] 后续调用失败:', followUpError)
        }
      }
    }

    // 解析响应
    const script = extractGroupChatScript(finalContent)
    
    // 🎭 处理tool_calls（导演调用send_theatre_card）
    if (script) {
      // 先添加已收集的小剧场调用
      if (collectedTheatreCalls.length > 0) {
        ;(script as any).theatreCalls = collectedTheatreCalls
      }
      
      // 再处理剩余的 tool_calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function?.name === 'send_theatre_card') {
            try {
              const args = JSON.parse(toolCall.function.arguments)
              // 避免重复添加
              const alreadyExists = collectedTheatreCalls.some(
                tc => tc.templateId === args.template_id && JSON.stringify(tc.data) === JSON.stringify(args.data)
              )
              if (!alreadyExists) {
                console.log('🎭 [导演工具] 解析小剧场调用:', args)
                ;(script as any).theatreCalls = (script as any).theatreCalls || []
                ;(script as any).theatreCalls.push({
                  templateId: args.template_id,
                  data: args.data
                })
              }
            } catch (e) {
              console.error('❌ [导演工具] 解析失败:', e)
            }
          }
        }
      }
    }

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
