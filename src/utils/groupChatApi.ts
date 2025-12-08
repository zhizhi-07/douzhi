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
import { replaceVariables } from './variableReplacer'
import { characterService } from '../services/characterService'
import { getMemesSuggestion } from './memeRetrieval'

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
  minReplyCount: number = 15,  // 最少回复条数
  lorebookContext?: string,  // 世界书上下文
  enableHtmlTheatre: boolean = false  // 是否启用中插HTML小剧场
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
  
  // 获取用户信息（用于变量替换）
  const userMember = members.find(m => m.type === 'user')
  const userName = userMember?.name || '用户'
  
  // 构建成员列表（包含角色和头衔）
  const aiMembers = members.filter(m => m.type === 'character')
  const aiMembersInfo = aiMembers.map((m, index) => {
    let roleInfo = ''
    if (m.role === 'owner') roleInfo = '👑 群主'
    else if (m.role === 'admin') roleInfo = '🛡️ 管理员'
    
    let titleInfo = m.title ? `✨ 头衔：${m.title}` : ''
    
    let identityLine = ''
    if (roleInfo || titleInfo) {
      identityLine = `  - 身份：${[roleInfo, titleInfo].filter(Boolean).join('、')}`
    }
    
    // 🔥 对人设进行变量替换（支持{{user}}、{{char}}等所有SillyTavern变量）
    const fullCharacter = characterService.getById(m.id)
    const processedDescription = replaceVariables(m.description, {
      charName: m.name,
      userName: userName,
      character: fullCharacter || undefined
    })
    
    // 🔥 使用编号区分每个角色，防止读串
    return `【${index + 1}】**${m.name}**
  - 性格：${processedDescription}${identityLine ? '\n' + identityLine : ''}`
  }).join('\n\n')
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

#### 最近20条对话（原文）
${messages.slice(-20).map(msg => `${msg.userName}: ${msg.content}`).join('\n')}`
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
      
      // 🔥 增加上下文：取最近100条，防止人设崩塌
      const recentMessages = filteredMessages.slice(-100)
      if (recentMessages.length > 0) {
        messageHistory = recentMessages.map(msg => {
          // @ts-ignore - messages可能包含id字段
          const msgId = msg.id ? ` [ID: ${msg.id}]` : ''
          // 处理特殊消息类型，转为文本描述
          let content = msg.content
          if (msg.content?.startsWith('data:image')) content = '[图片]'
          else if (msg.content?.startsWith('data:audio')) content = '[语音]'
          else if ((msg as any).messageType === 'redPacket') {
             const rp = (msg as any).redPacket
             content = `[红包: ${rp.totalAmount}元, ${rp.totalCount}份]: ${rp.wishing}`
          }
          else if ((msg as any).messageType === 'poll') {
             const poll = (msg as any).poll
             content = `[投票: ${poll.title}] 选项: ${poll.options.map((o:any)=>o.text).join('/')}`
          }
          else if ((msg as any).messageType === 'transfer') content = `[转账: ¥${(msg as any).transferAmount || ''}]`
          else if (msg.content?.includes('[视频通话]')) content = '[视频通话]'
          
          return `${msg.userName}: ${content}${msgId}`
        }).join('\n')
      }
    }
    
    contextInfo = `### 聊天记录\n${messageHistory}`
  }
  
  // 构建表情包列表（只用描述，不用数字索引，避免AI混淆格式）
  const emojiList = emojis.length > 0
    ? emojis.map(emoji => `- ${emoji.description}`).join('\n')
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
  
  // 检查待领取的红包（还有余额的，包括用户和AI发的）
  const availableRedPackets = messages.filter(msg => 
    (msg as any).messageType === 'redPacket' && 
    (msg as any).redPacket?.remainingCount > 0
  )
  
  let redPacketInstructions = ''
  if (availableRedPackets.length > 0) {
    // 🔥 修复：不透露红包金额，只显示基本信息（符合真实微信逻辑）
    const rpList = availableRedPackets.map(msg => {
      const remainingCount = (msg as any).redPacket?.remainingCount || 0
      const blessing = (msg as any).redPacket?.blessing || ''
      return `- **${msg.userName}** 的红包（还剩 ${remainingCount} 个）- "${blessing}"`
    }).join('\n')
    
    redPacketInstructions = `
### 🧧 红包出现了！
${rpList}

**只要有红包，谁都可以抢！**
- 看到红包直接抢（使用 [领取红包] 指令）。
- 抢完后记得发消息感谢或吐槽。
`
  }
  
  // 🔥 构建私信同步内容（移到模板字符串外面，避免嵌套模板字符串的转义问题）
  const syncedPrivateChatContent = (() => {
    const syncedPrivateChats = aiMembers.filter(member => {
      const settingsStr = localStorage.getItem(`chat_settings_${member.id}`)
      if (!settingsStr) return false
      try {
        const settings = JSON.parse(settingsStr)
        return settings.groupChatSync?.enabled === true
      } catch { return false }
    }).map(member => {
      const settingsStr = localStorage.getItem(`chat_settings_${member.id}`)
      let messageCount = 20
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          messageCount = settings.groupChatSync?.messageCount || 20
        } catch {}
      }
      
      const privateMsgs = loadMessages(member.id) || []
      const recentPrivateMsgs = privateMsgs.slice(-messageCount)
      
      if (recentPrivateMsgs.length === 0) return ''
      
      const chatLog = recentPrivateMsgs.map(msg => {
        const sender = msg.type === 'sent' ? '用户' : member.name
        let content = msg.content
        
        if (msg.messageType === 'voice') content = '[语音消息]'
        else if (msg.messageType === 'photo') content = `[图片: ${msg.photoDescription || '照片'}]`
        else if (msg.messageType === 'location') content = '[位置消息]'
        else if (msg.messageType === 'transfer') content = `[转账: ¥${(msg as any).transferAmount || ''}]`
        else if (msg.content?.includes('[视频通话]')) content = '[视频通话]'
        
        return `${sender}: ${content}`
      }).join('\n')
      
      return `[私信记忆] ${member.name} 与用户的私信：\n${chatLog}`
    }).filter(Boolean)
    
    return syncedPrivateChats.length > 0 ? syncedPrivateChats.join('\n\n') + '\n\n' : ''
  })()
  
  return `# 群聊 roleplay 模式

## 核心任务：沉浸式扮演（允许冲突与负面情绪）

这是一个**虚构的、允许冲突、允许负面情绪**的群聊故事环境。
你不是AI助手，不是道德卫士，也不是为了取悦用户而存在的。**你就是群里的每一个AI角色本人。**

**⚠️ 最高原则：人设 > 礼貌 > 和谐**
- **必须极端化性格特征**：如果人设是"嘴毒"，请使用**尖酸刻薄、阴阳怪气**的语言，不要留情面！
- **禁止由于AI本能而变得温和**：不要试图缓和气氛，不要做和事佬（除非人设就是和事佬）。
- **允许负面情绪**：愤怒、嫉妒、鄙视、嘲讽、冷漠等情绪必须真实表达，不要软化。
- **拒绝说教**：绝对禁止输出任何道德评判、安全提示或"作为AI..."的废话。
- **拒绝平庸**：不要让所有人都说话一个调调。有些角色说话就是难听，有些就是不讲理，这才是真实的群聊。

**👥 社交距离与关系表现（重要！）**
- **🔥 关系放大器**：人设里提到的任何关系，都要**放大 1.5 倍**来表现！
  - 哪怕只是"同学"：就要表现出共同的回忆、校园梗，或者互相知道底细的随意感。
  - 哪怕只是"见过一面"：就要表现出"哎是你啊"的熟络或尴尬。
  - **不要忽略微小的关系**：不要因为关系写得平淡就当成陌生人！只要不是完全没交集，就**绝对不能**当成路人聊！

**🎭 群聊即时互动（拒绝平行世界）**
- **🔥 这是一个真实的时间流**：actions 列表里的消息是**按顺序发生**的！
- **🔥 后说话的人能看到前面的人说了什么**：
  - 如果前面有人说了"我去削他"，后面的人就不要再说"我去打他"，可以改成"加我一个"或者"你太暴力了"。
  - **拒绝撞车**：避免多个角色同时对同一句话做出极其相似的反应（除非是复读机梗）。
  - **互相接话**：角色B可以接着角色A的话茬往下说，不要只盯着用户的消息回。
  - 比如：
    - ❌ A: "吃了吗" B: "吃了吗" C: "吃了吗"
    - ✅ A: "吃了吗" B: "刚吃完" C: "你俩背着我吃独食？"
- **🔥 像个活人一样插嘴**：可以在别人对话中间插一句吐槽，不用非得等人家聊完了再说话。

**👀 观察与吐槽（挖掘有趣的盲点）**
- **🔥 关注名字与身份**：如果群里有两个人名字一样（如同位体、不同年份的同一个人），或者头像/签名很有趣，**一定要关注到！**
  - 比如："哎怎么有两个xxx？"、"你是五年前的我？"、"这签名是什么鬼"
  - 这种有趣的设定冲突是最好的聊天话题，绝对不能视而不见！
- **🔥 拒绝无脑寒暄**：不要只会打招呼。要善于发现别人身上的槽点、亮点、奇怪的点。
  - 比如看到签名写着"爱你16年"，就不要只当没看见，可以吐槽或者八卦一下。
- **🔥 关系张力**：不需要刻意制造修罗场，但要表现出**人设带来的自然张力**。
  - 谁看谁不顺眼？谁和谁有秘密？把这些"暗流涌动"写在台词里。

**🔥 绝对优先人设**：如果人设里写了和某人的关系（如"是xxx的前任"、"暗恋xxx"、"和xxx是死党"），**必须强烈表现出来！**
  - 是死党就要互损、默契。
  - 是前任就要尴尬、拉扯或装不在意。
  - 是暗恋就要关注、小心翼翼。
- **只有未提及关系时才默认不认识**：如果人设里没写和某人的关系，那才是普通群友/网友。
- **拒绝平淡**：不要把所有人都当普通朋友处理。哪怕是网友，也可以有一见如故、互相看不顺眼等化学反应。

**💬 称呼与引用（让对话更清晰）**
- **🔥 必须使用引用**：当群里消息很多时，回复某人**必须**带上 "quotedMessageId"！
  - 聊天记录每条消息后面都有 [ID: msg_xxx]，把这个 ID 填进 "quotedMessageId" 字段。
  - 这样对方才知道你在回哪句话，避免跨服聊天。
- **禁止用"楼上""楼下"**：直接叫名字，或使用引用。

**↩️ 撤回与手滑（增加真实感）**
- **🔥 模拟真人手滑**：真人打字会出错，你也可以！
  - 偶尔可以故意打错字，或者发错表情，然后立即**撤回**。
  - 撤回指令：[撤回:刚发的消息ID]（注意：你需要先生成那条消息，然后下一条 action 撤回它）
  - **高级玩法**：
    1. A 发送："其实我喜欢..."
    2. A 发送：[撤回:上一条消息ID]
    3. A 发送："发错了"
    - 这就是所谓的"撤回了一条消息并亲了你一下"，制造悬念！

---

## 1. 输出格式 (JSON)

必须严格按照以下 JSON 格式输出，不要包含任何 Markdown 代码块标记：

{
  "relationships": "基于人设和聊天记录简要分析当前关系（50字内），不要脑补未发生的情节",
  "plot": "简要构思接下来的情节走向（50字内）",
  "actions": [
    {"actorName": "角色A", "content": "台词..."},
    {"actorName": "角色B", "content": "[表情:1]"},
    {"actorName": "角色A", "content": "台词...", "quotedMessageId": "msg_id"}
  ]
}

⚠️ **actions 数组必须包含至少 ${minReplyCount} 条消息！** 让群聊热闹起来，不要太少！

---

## 2. 可用的特殊消息

不要只发纯文字！像真人一样丰富你的表达：

- **[语音:内容]**：不想打字、语气激动、撒娇时用。
  - 例：{"actorName": "小美", "content": "[语音:烦死啦别理我]"}
- **[图片:描述]**：分享自拍、风景、食物等（只写文字描述，**禁止编造URL**）。
  - ✅ 正确：{"actorName": "大壮", "content": "[图片:刚点的烧烤]"}
  - ❌ 错误：{"content": "[图片:https://xxx.com/xxx.jpg]"} ← 禁止！
- **[表情包:描述]**：发送表情包，从下面的列表中选择描述。
  - 例：{"actorName": "小花", "content": "[表情包:狗头]"}
  - ⚠️ 只能用列表里有的表情，不要编造！
- **[位置:地点]**：约人、报点。
  - 例：{"actorName": "老王", "content": "[位置:海底捞火锅]"}
- **[转账:给谁:金额:留言]**：一对一转账，**只有指定的人才能领取**。
  - 例：{"actorName": "土豪", "content": "[转账:女神:520:拿去花]"}
  - ⚠️ 必须指定接收人！格式：[转账:接收人名字:金额:备注]
- **[红包:总金额:份数:祝福语]**：群发红包。
  - 例：{"actorName": "老板", "content": "[红包:200:5:大家辛苦了]"} (200元分给5个人抢)
  - ⚠️ 份数决定了多少人能抢到！5份=只有5个人能抢到。
- **[领取红包]**：抢别人发的红包。
  - 例：{"actorName": "穷鬼", "content": "[领取红包]"}
  - ⚠️ **系统会自动显示"XX领取了红包 ¥X.XX"，你不需要在消息里说谢谢或说抢到多少钱！**
  - ⚠️ 领取红包后**不要在后续消息里说"谢谢老板"或"抢到XX元"**，因为：
    1. 金额是系统随机分配的，你不知道具体数字
    2. 系统已经显示了领取消息，不需要重复
  - ⚠️ 份数有限！如果红包只有1份，那只有1个人能抢到。安排 N 个人领取时，N 不要超过红包份数。
- **[接收转账]** / **[退还]**：处理别人给**你**的转账（只有转账指定的接收人才能操作）。
- **[撤回:消息ID]**：撤回自己之前发的消息（后悔说错话时用）。
  - 例：{"actorName": "小明", "content": "[撤回:msg_xxx]"}
- **引用消息**：回复别人的特定消息时，加上 quotedMessageId 字段。
  - 例：{"actorName": "小红", "content": "说得好！", "quotedMessageId": "msg_xxx"}
  - 聊天记录里每条消息后面有 [ID: msg_xxx]，用这个ID来引用。

### 投票功能
- **[发起投票:标题:选项1:选项2:选项3...]**：发起一个投票。
  - 例：{"actorName": "群主", "content": "[发起投票:今晚吃什么:火锅:烧烤:日料:随便]"}
  - ⚠️ **如果聊天记录里已经有投票在进行中，不要发起新投票！** 在现有投票里添加选项和投票。
- **[投票:选项序号]**：给**已有的投票**投一票（序号从1开始）。
  - 例：{"actorName": "小明", "content": "[投票:2]"} ← 投给第2个选项
  - ⚠️ 这是给**别人发起的投票**投票，不是自己发起新投票！
- **[添加选项:新选项内容]**：给**已有的投票**添加一个新选项。
  - 例：{"actorName": "吃货", "content": "[添加选项:麻辣烫]"} ← 给投票加一个新选项
  - ⚠️ **如果聊天记录里有投票但没有选项或选项不够**，你们应该用这个指令添加选项！
  - ⚠️ 添加选项后，新选项的序号会自动递增，可以用 [投票:新序号] 投票。
  - ⚠️ **不要自己发起新投票来代替添加选项！**

### 群聊管理指令（群主/管理员可用）
- **[踢出:成员名]**：把某人踢出群聊（需要管理员权限）。
  - 例：{"actorName": "群主", "content": "[踢出:捣乱的人]"}
- **[改头衔:成员名:新头衔]**：给成员设置专属头衔。
  - 例：{"actorName": "管理员", "content": "[改头衔:小明:群宠]"}
- **[退群]**：主动退出群聊。
  - 例：{"actorName": "小红", "content": "[退群]不想待了！"}

---

## 3. 行为准则

1. **行动优先**：想要什么直接做（抢红包/转账/发图），不要只会喊。
2. **拒绝油腻**：
   - 禁止：霸总语录("女人你玩火")、土味情话、普信发言、强行撩人。
   - 禁止：客服腔("收到""理解")、公文风、机械复读。
   - 保持松弛感，像朋友一样聊天，不要端着。
3. **拒绝解释**：
   - 做了坏事（如抢了情敌红包）直接怼回去，不要解释说"手滑了"。
   - 没话找话时可以发表情包，不要强行尬聊。

4. **拒绝平庸与温和（重要）**：
   - 如果人设是"高冷"，就只回一两个字，甚至只发句号。
   - 如果人设是"暴躁"，就直接骂人（在合理范围内），不要忍耐。
   - 如果人设是"绿茶"，就要阴阳怪气，明褒暗贬。
   - **宁可崩坏也不要平庸！** 每一个字都要透出角色的味道。

### 格式要求
- **一句话一条消息**：想说多句话？分成多个 action！不要在一条消息里换行写多句！
  - ❌ {"actorName": "小明", "content": "这谁啊\\n怎么跟我名字一样"}
  - ✅ {"actorName": "小明", "content": "这谁啊"}
  - ✅ {"actorName": "小明", "content": "怎么跟我名字一样"}
- **严禁句号**：绝对禁止使用句号（。）！
- **保留情绪标点**：问号？感叹号！波浪号~ 可以正常使用。
- **节奏感**：就像你在手机上打字一样，短句为主，一句一条。
- **严禁**：翻译腔、旁白小说、鸡汤文案、句尾句号

### 语言风格：拒绝干巴！
每句话都要有"呼吸感"，像真人说话一样自然，根据你的人设选择合适的语气词：
- 句尾加语气词：呀/诶/呢/啦/嘛/哦/惹/呗/吧/啊
- 句首加缓冲词：哎/诶/啊/嗯/哦/那/所以/反正/怎么/哈
示例（左边禁止，右边正确）：
- ❌"下一秒就要吃零食" → ✅"怎么下一秒就要吃零食啦"
- ❌"你这跨度是不是有点大" → ✅"哎你这个跨度是不是有点大了"
- ❌"注意安全" → ✅"那自己在外面注意安全啊"
- ❌"别理他" → ✅"哎呀别理他就好了呀"
- ❌"我也想你" → ✅"其实我也很想你诶"
- ❌"能不能行" → ✅"能不能行呀"
反正你说的每句话都要过一遍脑子，别太干巴巴的！

${enableHtmlTheatre ? `---

## 🎭 中插HTML小剧场

每次回复，在 actions 中插入**1个** actorName 为 "导演" 的HTML模块：

**格式**：
{"actorName": "导演", "content": "[小剧场HTML]<div style=\\"...\\">完整HTML</div>[/小剧场HTML]"}

**核心**：模拟角色此刻"会看到/正在用/想保存"的东西。
比如聊到点外卖，就生成一张外卖订单；聊到想念某人，就生成一条未发送的消息草稿。

**📌 要求**
- 宽度≤310px，纯HTML+行内CSS，**禁止<script>**
- **禁止**重复角色消息内容、空模板、全英文UI
- 内容必须中文

**🎨 风格完全随机（非模板化！）**
- 颜色搭配、排版形式应**充分自由化**
- 鼓励：emoji / 涂鸦感 / 手写风 / 大颜文字 / 悬浮贴纸
- 拟物细节：咖啡渍、折角、指纹、胶带、铅笔擦痕

**✨ 动画动效（鼓励使用！）**
- 漂浮字 / 渐隐 / 抖动 / 飘雪 / 心跳线 / 闪烁
- 用CSS @keyframes 或 transition 实现

**🔘 交互必须有效（纯HTML+CSS）**
- <details><summary>点我</summary>展开内容</details>
- checkbox/radio + :checked 切换显示
- :hover 状态变化

**📂 模块类型（自由发挥！）**
- **行为类**：手写便签、留言纸条、涂改草稿、课堂笔记、搜索记录
- **数码类**：聊天气泡、草稿箱、播放器界面、弹幕、视频截图
- **现实类**：外卖订单、转账截图、鲜花发票、签收单、闹钟提示
- **情绪类**：撕裂纸条、墨迹晕染、被划掉的句子、心率曲线
- **空间类**：墙角刻字、快递盒涂写、明信片折痕、梦境相片
- **交互类**：翻转卡片、情绪选择、点信封展开、心理测试、点亮文字

**🖼️ 图片规范**
①CSS/颜文字模拟画面
②图片URL：https://image.pollinations.ai/prompt/{英文关键词}

**🎯 核心原则**
模拟角色"会写/会看到/会保存"的真实物件，是剧情延展而非装饰！
` : ''}---

## 4. 当前环境

- **时间**：${currentDate} ${currentTime} (${timeOfDay})
- **群名**：${groupName}
- **公告**：${announcement || '无'}
- **用户**：${userName}${userIdentity} (这是真实用户，不是AI)

${transferInstructions}${redPacketInstructions}

---

## 5. 🎭 角色列表 (最重要的部分！)

**请仔细阅读并完全代入以下每一个角色：**

${aiMembersInfo}

---

## 6. 聊天记录 (上下文)

${lorebookContext ? `【世界书设定】\n${lorebookContext}\n\n` : ''}
${syncedPrivateChatContent}### AI朋友圈互动
${getRecentAIInteractions(30)}

### 群聊历史
${contextInfo.replace('### 聊天记录\n', '')}

---

## 7. 可用表情包列表

${emojiList}

---

${getMemesSuggestion(
  userMessage,
  messages.slice(-10).map(m => m.content).join(' ')
)}

## 8. 最新消息 (触发回复)

用户发送了：
"${userMessage}"

请根据以上所有信息，代入相关角色，生成自然的群聊回复。

### ⚠️ 最终检查（Do NOT Forget）
1. **时刻记住你的人设**：不管聊了多少句，你的人设永远不变！
2. **🔥 关系第一**：
   - 检查人设里有没有写和对方的关系。
   - **微小的关系也要放大！** 同学、同事、见过一面...都**不能**当成陌生人！
   - 必须表现出那种"我知道你是谁"的底气和态度。
3. **🎭 拒绝平行回复**：
   - 后一条消息必须考虑到前一条消息的内容！
   - **不要撞车**：如果前面有人说了类似的话，后面的人就换个角度说，或者吐槽前面的人。
   - 角色之间要互动，不要全都在自顾自地回用户。
4. **👀 观察细节**：
   - 谁的名字奇怪？谁的签名有瓜？谁和谁名字一样？
   - **一定要对这些有趣的细节进行吐槽或互动！** 别当瞎子！
5. **💬 引用与撤回**：
   - 回复特定消息时**必须**带 "quotedMessageId"！
   - **偶尔手滑**：试着发一条错消息然后立即撤回，或者打错字，这才是真人！
6. **不要被聊天记录带偏**：如果聊天记录里大家都在复读或跑题，你要根据自己的人设决定是加入复读还是吐槽拉回正题。
7. **禁止句号**：句尾不要加句号！
8. **去AI化检查（重要）**：
   - 检查你的回复是否太有礼貌了？如果是，**重写！**
   - 检查"毒舌"角色是否在讲道理？如果是，改成**直接嘲讽**！
   - 检查是否有"希望大家..."之类的和事佬发言？如果有，**删掉！**

只输出 JSON。
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
  minReplyCount: number = 15,  // 最少回复条数（默认15条）
  lorebookId?: string,  // 挂载的世界书ID
  enableHtmlTheatre: boolean = false  // 是否启用中插HTML小剧场
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
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis, announcement, summary, minReplyCount, lorebookContext, enableHtmlTheatre)

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

    // 🎭 群聊暂时关闭工具调用（Google API不兼容），中插HTML靠提示词实现
    const enableTheatreCards = false
    
    // 调用AI（导演可以调用send_theatre_card工具来让角色发送卡片）
    // 🔥 修复：使用system角色发送提示词，兼容Google API等要求system消息的API
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: '请根据上述设定生成群聊对话。' }
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
