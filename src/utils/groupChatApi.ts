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
import { getUserInfo } from './userUtils'

export interface GroupMember {
  id: string
  name: string
  description: string
  type: 'user' | 'character'
  role?: 'owner' | 'admin' | 'member'  // 角色
  title?: string  // 头衔
  aliases?: string[]  // 所有可能的名字（realName, nickname等），用于匹配AI回复
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
  enableHtmlTheatre: boolean = false,  // 是否启用中插HTML小剧场
  plotSummary?: { relationships: string; plot: string }  // 🔥 剧情摘要（避免 AI 失忆）
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
    day: 'numeric'
  })
  const weekdayStr = now.toLocaleDateString('zh-CN', { weekday: 'long' })
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
  const userInfo = getUserInfo()
  const userName = userMember?.name || userInfo.nickname || '用户'
  // 🔥 获取用户真名（让AI知道用户的真实姓名）
  const userRealName = userInfo.realName && userInfo.realName !== '用户' ? userInfo.realName : null
  
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
    return `【角色${index + 1}】名字：「${m.name}」（⚠️ actorName 必须完全匹配这个名字！）
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
  
  // 🔥 如果有剧情摘要，先添加进来（让 AI 知道之前发生了什么，避免失忆）
  let plotContext = ''
  if (plotSummary && (plotSummary.relationships || plotSummary.plot)) {
    console.log('📝 [剧情摘要] 使用上次的剧情摘要作为背景')
    plotContext = `### 剧情回顾（上次对话的摘要）
**人物关系**：${plotSummary.relationships || '暂无'}
**剧情进展**：${plotSummary.plot || '暂无'}

`
  }
  
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
      // 过滤掉系统消息（撤回、入群等）和小剧场HTML，只保留真实对话
      const filteredMessages = messages.filter(msg => 
        !msg.content.includes('撤回了一条消息') &&
        !msg.content.includes('加入了群聊') &&
        !msg.content.includes('退出了群聊') &&
        !msg.content.includes('移出了群聊') &&
        !msg.content.includes('修改了群公告') &&
        !msg.content.includes('[小剧场HTML]') &&  // 🔥 过滤小剧场HTML
        !(msg as any).messageType?.includes('theatre')  // 🔥 过滤小剧场类型
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
  
  return `# 群聊模式

## 核心任务

你扮演群里的所有AI角色，根据每个角色的人设自然地聊天。

**基本原则**：
- 按照人设说话，保持每个角色的语气和性格，严禁OOC (Out of Character)
- 这是线上群聊，角色之间隔着屏幕，不能有面对面的动作
- 后面说话的人能看到前面的人说了什么，要自然地接话
- 如果人设里写了角色之间的关系，要体现出来

**可选指令**：
- **引用消息**：回复某人时使用 quotedMessageId 引用对方的话
- **表情包**：使用 [表情:编号] 发送表情
- **撤回消息**：使用 [撤回:msg_xxx] 模拟手滑

**注意事项**：
- 不要所有人都说一样的话，要有差异化
- 角色不知道的事就装傻或岔开话题

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

🚨 **名字区分警告**：如果群里有名字相似的角色（如「方亦楷」和「方亦楷2.0」），actorName 必须使用**完整且精确**的名字！
- ❌ 错误：两个人都写 "方亦楷"
- ✅ 正确：一个写 "方亦楷"，另一个写 "方亦楷2.0"

---

## 2. 可用的特殊消息

- **[语音:内容]**：不想打字时用。例：[语音:烦死啦别理我]
- **[图片:描述]**：分享照片（只写描述，禁止URL）。例：[图片:刚点的烧烤]
- **[表情包:描述]**：发表情，从列表中选。例：[表情包:狗头]
- **[位置:地点]**：约人时用。例：[位置:海底捞火锅]
- **[转账:给谁:金额:留言]**：表白/感谢时用。例：[转账:女神:520:拿去花]
- **[红包:总金额:份数:祝福语]**：节日/庆祝时用。例：[红包:200:5:大家辛苦了]
- **[领取红包]**：抢群里的红包（领取后不用说谢谢，系统自动显示）
- **[接收转账]** / **[退还]**：处理收到的转账
- **[撤回:msg_xxx]**：后悔说错话时用
- **引用消息**：加 quotedMessageId 字段回复特定消息

### 投票功能
- **[发起投票:标题:选项1:选项2...]**：有争议时用。例：[发起投票:今晚吃什么:火锅:烧烤]
- **[投票:序号]** / **[添加选项:新选项]**：参与已有投票

### 群聊管理指令（群主/管理员可用）
- **[踢出:成员名]**：把某人踢出群聊（需要管理员权限）。
  - 例：{"actorName": "群主", "content": "[踢出:捣乱的人]"}
- **[改头衔:成员名:新头衔]**：给成员设置专属头衔。
  - 例：{"actorName": "管理员", "content": "[改头衔:小明:群宠]"}
- **[退群]**：主动退出群聊。
  - 例：{"actorName": "小红", "content": "[退群]不想待了！"}

---

## 3. 行为准则

1. **正常聊天为主**：就像真人在群里聊天一样。
2. **拒绝油腻**：
   - 禁止：霸总语录("女人你玩火")、土味情话、普信发言、强行撩人。
   - 禁止：客服腔("收到""理解")、公文风、机械复读。
   - 保持松弛感，像朋友一样聊天，不要端着。
   - **⚠️ 顶级封杀词**：**顺着网线**（如"顺着网线过去咬你"、"顺着网线打你" —— 极其弱智的古早语录，直接死机！）
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

**🎨 视觉风格（根据内容二选一）**

**1. 📱 拟真UI派（用于：APP界面、聊天记录、网页、系统通知）**
- **核心要求**：高保真还原 iOS/Android 界面细节！
- **细节**：顶部状态栏（时间/电量）、底部 Home 条、毛玻璃效果（backdrop-filter: blur）。
- **配色**：
  - 微信：#07c160 (绿), #f7f7f7 (灰底), #ededed (气泡)
  - 警告/系统：#ff3b30 (红), #007aff (蓝), rgba(0,0,0,0.8) (半透黑)
  - 音乐/视频：深色模式, 专辑封面模糊背景
- **禁止**：把 APP 界面画成黑白线框图！要用真实的色彩和阴影。

**2. ✏️ 创意手绘派（用于：便签、涂鸦、收据、纸质物品）**
- **核心要求**：去电子化，模拟物理质感。
- **细节**：旋转 (transform: rotate)、纸张纹理、胶带粘贴、边缘撕裂。
- **CSS技巧**：
  - 阴影：box-shadow: 2px 2px 5px rgba(0,0,0,0.1)
  - 字体：font-family: cursive, "Comic Sans MS"
- **鼓励**：emoji / 大颜文字 / 悬浮贴纸
- 可用符号组合创作原创小涂鸦，示例：
    /\\_/\\
   ( o.o )
    > ^ <
  或横向小花：--❀--  小星：★彡  箭头心：─═══❤═══─
- 拟物细节：咖啡渍、折角、指纹、胶带、铅笔擦痕

**❌ 严禁出现**：
- "黑白虚线框 + 叠加方块" 的无聊设计（除非你真的在画草稿）。
- 毫无设计感的纯文本堆砌。
- **假按钮**：写着"查看详情"、"点击展开"却无法点击的元素！要么用 <details> 让它真的能展开，要么就别画按钮。

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
  - 画风必须是：anime style / illustration / cartoon / sketch
  - **绝对禁止真人照片、禁止生成用户或角色的照片/头像**

**🎯 核心原则**
模拟角色"会写/会看到/会保存"的真实物件，是剧情延展而非装饰！
` : ''}---

## 4. 当前环境

- **时间**：${currentDate}（${weekdayStr}）${currentTime} (${timeOfDay})
- **⚠️ 时间感知**：今天是${weekdayStr}，约定事情时注意日期
- **群名**：${groupName}
- **公告**：${announcement || '无'}
- **用户**：${userName}${userIdentity} (这是真实用户，不是AI)${userRealName ? `
- **用户真名**：${userRealName}（⚠️ 请称呼用户的真名「${userRealName}」，不要叫网名）` : ''}

${transferInstructions}${redPacketInstructions}

---

## 5. 🎭 角色列表 (最重要的部分！)

**请仔细阅读并完全代入以下每一个角色：**

${aiMembersInfo}

---

## 6. 聊天记录 (上下文)

${lorebookContext ? `【世界书设定】\n${lorebookContext}\n\n` : ''}
${plotContext}${syncedPrivateChatContent}### AI朋友圈互动
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
9. **🚨 名字精确匹配**：
   - actorName 必须与角色列表中的名字**完全一致**！
   - 如果有「方亦楷」和「方亦楷2.0」，绝对不能混用！
   - 每个角色都是独立的个体，性格完全不同！
8. **去AI化检查（重要）**：
   - 检查你的回复是否太有礼貌了？如果是，**重写！**
   - 检查"毒舌"角色是否在讲道理？如果是，改成**直接嘲讽**！
   - 检查是否有"希望大家..."之类的和事佬发言？如果有，**删掉！**
   - **自问**："这是角色想说的，还是AI想说的？" → 任何解释、总结、打圆场的话都是AI想说的，删！
   - **自问**："这个角色真的懂这件事吗？" → 超出人设认知范围就装傻！

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
  enableHtmlTheatre: boolean = false,  // 是否启用中插HTML小剧场
  plotSummary?: { relationships: string; plot: string }  // 🔥 剧情摘要（避免 AI 失忆）
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
    const prompt = buildGroupChatPrompt(groupName, members, messages, userMessage, emojis, announcement, summary, minReplyCount, lorebookContext, enableHtmlTheatre, plotSummary)

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

    // 🔥 群聊需要更大的 max_tokens，因为要生成多条消息
    const groupChatSettings = {
      ...settings,
      maxTokens: Math.max(settings.maxTokens || 4000, 8000)  // 至少 8000 tokens
    }

    // 🎭 群聊暂时关闭工具调用（Google API不兼容），中插HTML靠提示词实现
    const enableTheatreCards = false
    
    // 调用AI（导演可以调用send_theatre_card工具来让角色发送卡片）
    // 🔥 修复：使用system角色发送提示词，兼容Google API等要求system消息的API
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: '请根据上述设定生成群聊对话。' }
    ]
    const aiReply = await callAIApi(apiMessages, groupChatSettings, enableTheatreCards)

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

    // 🔥 检查内容是否为空，如果为空则重试一次
    if (!finalContent || finalContent.trim() === '') {
      console.warn('⚠️ [群聊导演] AI返回空内容，尝试重新请求...')
      try {
        const retryReply = await callAIApi(apiMessages, settings, false)
        if (retryReply.content && retryReply.content.trim()) {
          finalContent = retryReply.content
          console.log('✅ [群聊导演] 重试成功，获取到内容')
        } else {
          console.error('❌ [群聊导演] 重试后仍然为空，可能是API问题')
          return null
        }
      } catch (retryError) {
        console.error('❌ [群聊导演] 重试失败:', retryError)
        return null
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
