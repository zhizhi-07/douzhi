import { callAI } from './api'
import { characterService } from '../services/characterService'
import { loadMessages } from './simpleMessageManager'

// 手机内容数据结构
export interface AIPhoneContent {
  characterId: string
  characterName: string
  generatedAt: number
  
  // 通讯录
  contacts: {
    name: string
    phone: string
    relation: string
    notes?: string
  }[]
  
  // 微信聊天
  wechatChats: {
    name: string
    lastMessage: string
    time: string
    unread: number
    avatar?: string
    messages: {
      content: string
      isSelf: boolean
      time: string
      type?: 'text' | 'image' | 'voice'
    }[]
  }[]
  
  // 浏览器历史
  browserHistory: {
    title: string
    url: string
    time: string
    reason?: string  // 为什么搜索/浏览
  }[]
  
  // 淘宝订单
  taobaoOrders: {
    title: string
    price: string
    status: string
    reason?: string  // 为什么买
    thought?: string  // 购买时的想法
  }[]
  
  // 支付宝账单
  alipayBills: {
    title: string
    amount: string
    type: 'income' | 'expense'
    time: string
    reason?: string  // 账单原因/备注
  }[]
  
  // 相册照片
  photos: {
    description: string
    location?: string
    time: string
  }[]
  
  // 备忘录
  notes: {
    title: string
    content: string
    time: string
  }[]
  
  // 音乐播放列表
  musicPlaylist: {
    title: string
    artist: string
    mood?: string
  }[]
  
  // AI足迹记录（一天的行程）
  footprints: {
    location: string
    address: string
    time: string
    duration: string
    activity: string
    mood?: string
    companion?: string
  }[]
  
  // 论坛浏览和评论
  forumPosts: {
    title: string
    forum: string  // 论坛名称，如"贴吧""豆瓣""知乎"
    content: string  // 帖子内容摘要
    time: string
    hasCommented: boolean  // 是否评论过
    comment?: string  // 角色的评论内容
    reason?: string  // 为什么浏览/评论
  }[]
}

// 获取角色聊天记录
const getCharacterChatHistory = async (characterId: string): Promise<string> => {
  try {
    // 🔥 使用新的消息加载方式
    const messages = await loadMessages(characterId)
    if (!messages || messages.length === 0) return '没有聊天记录'
    
    // 取最近30条消息
    const recentMessages = messages.slice(-30)
    
    return recentMessages.map((msg: any) => {
      const sender = msg.type === 'sent' ? '用户' : '角色'
      const content = msg.content || msg.aiReadableContent || ''
      return `${sender}: ${content}`
    }).join('\n')
  } catch (e) {
    console.error('获取聊天记录失败:', e)
    return '无法获取聊天记录'
  }
}

// 获取角色信息
const getCharacterInfo = (characterId: string): string => {
  try {
    // 🔥 使用 characterService 从 IndexedDB 获取角色
    const character = characterService.getById(characterId)
    
    if (!character) return '未知角色'
    
    const name = character.nickname || character.realName
    const personality = character.personality || '未设置'
    const signature = character.signature || '未设置'
    
    return `角色名：${name}\n性格：${personality}\n签名：${signature}`
  } catch (e) {
    console.error('获取角色信息失败:', e)
    return '未知角色'
  }
}

// 生成手机内容的提示词
const buildPhoneContentPrompt = async (characterId: string, characterName: string) => {
  const characterInfo = getCharacterInfo(characterId)
  const chatHistory = await getCharacterChatHistory(characterId)
  
  // 🔥 获取真实用户信息
  const { getUserInfo } = await import('./userUtils')
  const userInfo = getUserInfo()
  const userName = userInfo.nickname || userInfo.realName || '用户'
  
  return `你是一名"手机内容观察员"，要根据下面提供的角色设定和最近聊天记录，虚构出这个角色手机里的完整世界。

角色信息（请认真阅读，用来推断TA的生活圈和性格）：
${characterInfo}

真实用户信息：
- 用户名称：${userName}
- ⚠️ 重要：在生成内容时，涉及到真实用户的地方，必须直接写"${userName}"这个名字，不要用占位符、不要用"user"、不要用"用户"、不要用任何大括号或变量符号。

最近聊天记录节选（只用于理解角色的状态和说话风格，不要直接照抄）：
${chatHistory}

🚨 基本规则（必须严格遵守）：
1. ✅ 可以出现与真实用户"${userName}"有关的内容，但**只能从角色视角出发**，比如：给${userName}买了什么、和${userName}去过哪家店、今天觉得${userName}好可爱等。
2. ❌❌❌ **绝对不能替真实用户"${userName}"说话！** 不要编造${userName}的任何对话内容，包括"嗯嗯""好的""笑哭表情"等任何回复，完全不要写！
3. ✅ 微信聊天中，如果涉及真实用户"${userName}"，**只能写角色自己发送的消息**，展示为未读消息（角色发了但${userName}还没回）。
4. ✅ 参考【最近聊天记录】，可以延续之前的话题，生成角色新发的几条消息，但不要编造${userName}的回复。
5. ❌❌❌ **在与"${userName}"的聊天中，绝对不能出现"对话：other"或"对话：${userName}"这样的行！只能是"对话：self"！**
6. ❌ 不要泄露或编造真实用户的隐私（身份证号、地址、公司全称等），保持日常聊天和生活化层面即可。
7. ✅ 所有记录都要围绕这个角色本人的生活——工作、学习、恋爱、家庭、兴趣、熬夜、emo、上头剁手等，可以自然地穿插对Ta（真实用户）的在乎。
8. ✅ 要充分利用【角色信息】和【聊天记录】推断：TA大概是什么职业、什么年龄、什么作息、有什么爱好、最近在忙什么，然后围绕这些来写手机内容。
9. ✅ 每次生成的内容都要尽量不一样，避免模板化的名字和剧情；不同对话和场景尽量不要重复用词。
10. ✅ 尽量不要在每条数据行里使用括号"()"，如果要补充说明，用逗号或句号来表达。

🌈 多样性和个性化要求（可以多参考聊天里提到的“Ta”来设计和用户相关的内容）：
- 如果聊天记录里经常提到“加班、项目、甲方”，可以多一些工作群、项目相关的聊天、浏览器搜索和账单。
- 如果聊天记录里经常提到“恋爱、暧昧、失恋”，可以多一些深夜聊天记录、emo歌单、朋友圈截图式的备忘录。
- 如果聊天记录里经常提到“游戏、二次元、追星”，可以多一些相关联系人昵称、浏览器搜索、淘宝周边订单。
- 如果聊天记录里有地域信息（比如成都、广州、上海），可以在地点、店名、活动里体现出来。
- 每一类内容里的人名、昵称、群聊名、店名、歌名都要尽量随机、多样，避免固定叫“李华、王芳、张伟”。

⚙️ 输出格式总规则（非常重要）：
- 只输出纯文本，不要Markdown，不要解释。
- 使用下面这些分区标题：===通讯录、===微信聊天、===浏览器历史、===淘宝订单、===支付宝账单、===相册、===备忘录、===音乐播放列表、===足迹、===论坛。
- 每一行用“|||”分隔字段，不能用其它分隔符。

===通讯录
说明：这里指的是**手机系统的电话通讯录**，不是微信联系人列表。
- 每一行是一个联系人，格式：姓名|||手机号（可打码）|||关系|||最近一次通话或联系的简短说明（可以写成通话记录的感觉）。
- 备注可以写「上次什么时候打电话」「谁先打的」「聊了什么」「为什么联系TA」等信息，方便看出最近的电话往来。
示例（不要照抄，只是说明结构）：
示例：小周|||137****8899|||大学室友|||昨晚 23:40 打电话吐槽老板，让你今天记得提醒他别冲动辞职
示例：妈妈|||138****8888|||家人|||上周日视频通话 30 分钟，聊考试和最近的状态

===微信聊天
说明：这里指的是**微信里的聊天会话列表**，包括微信好友和微信群，和上面的电话通讯录是两套不同的联系人系统。
- 不要求每个通讯录联系人都在微信里出现，也可以有只在微信上联系、但没有存进手机通讯录的人（反之亦然）。
- 要尽量丰富，体现角色真实的社交生活和情绪波动。
- ⚠️ 必须完整生成所有微信聊天内容，不要中途停止或省略！这是最重要的部分！
- 先写会话概要行，再写多行"对话："开头的具体消息。
- 会话行格式：会话标题或联系人名|||会话列表里看到的最后一句摘要|||时间（如"昨天""1小时前"）|||未读数量数字。
- 对话行格式：对话：发送方（self/other/群成员名字）|||内容|||时间（如"23:41"）。

🚨🚨🚨 **超级重要规则（必须100%遵守）：**
- 🔥 **每个会话只能和一个人或一个固定的群聊天！**
- 🔥 **同一个会话下的所有"对话："行，必须都是同一个聊天对象！**
- 🔥 **绝对禁止在同一个会话下面出现多个不同的聊天对象！**
- 🔥 **如果要和另一个人/群聊天，必须先结束当前会话，写一个新的会话概要行，然后再写新的对话行！**
- 🔥 **不要在一个会话里先和妈妈聊，又突然和同学群聊，这是错误的！**

**关于真实用户"${userName}"的聊天（🔥 极其重要，必须严格遵守）：**
- 会话标题直接写"${userName}"
- 参考【最近聊天记录】，可以延续之前的话题
- **只写角色发送的消息，发送方必须写"self"**
- 生成2-5条角色新发的消息即可
- ❌❌❌ 绝对禁止！不要写"对话：other"开头的行！
- ❌❌❌ 绝对禁止！不要写"对话：${userName}"开头的行！
- ❌❌❌ 只能写"对话：self"开头的行！
- 示例正确格式：
  对话：self|||在吗？|||23:15
  对话：self|||想你了|||23:16

**关于其他虚构NPC的聊天：**
- 可以正常写双向对话（self和other都可以）
- 体现角色的日常社交、工作、朋友圈等

示例（不要照抄）：
示例：宿舍群|||今晚吃什么？|||1小时前|||5
示例：对话：other|||今晚吃烧烤还是火锅？|||21:05
示例：对话：self|||别再吃火锅了，我已经胖三斤了|||21:07
示例：对话：other|||那吃麻辣烫吧|||21:08

示例：${userName}|||在吗？|||刚刚|||3
示例：对话：self|||在吗？|||23:15
示例：对话：self|||想你了|||23:16
示例：对话：self|||[图片]|||23:17

示例：小李|||周末一起打球吗|||昨天|||0
示例：对话：other|||周末一起打球吗|||昨天 15:30
示例：对话：self|||好啊，几点？|||昨天 15:32

🚨 错误示例（绝对不要这样写）：
❌ 严重错误：老妈|||好好学习|||刚刚|||2
❌ 严重错误：对话：other|||好好学习|||21:51
❌ 严重错误：对话：self|||知道了|||21:52
❌ 严重错误：对话：其他同学|||@全体同学 明天交作业|||22:01  ← 这是错的！不能在和妈妈的聊天里突然出现同学！
❌ 严重错误：对话：self|||收到|||22:02  ← 这还是和妈妈聊吗？还是和同学聊？混乱了！

✅ 正确：必须分成两个独立的会话：
✅ 正确：老妈|||知道了|||21:52|||0  ← 和妈妈的聊天
✅ 正确：对话：other|||好好学习|||21:51
✅ 正确：对话：self|||知道了|||21:52
✅ 正确：
✅ 正确：班级群|||@全体同学 明天交作业|||22:01|||1  ← 全新的会话！和群里的聊天
✅ 正确：对话：张三|||@全体同学 明天交作业|||22:01
✅ 正确：对话：self|||收到|||22:02

===浏览器历史
说明：每一行格式：标题|||网址|||时间描述|||搜索/浏览原因。
示例（不要照抄）：
示例：如何和领导沟通加薪|||https://example.com/salary|||昨晚23:11|||准备鼓起勇气和领导谈涨薪

===淘宝订单
说明：每一行格式：商品名称|||价格（纯数字，不要带符号）|||状态（待收货/已完成/退款中等）|||购买原因|||下单时的心理活动或吐槽。
- ⚠️ 价格只写数字，例如"299"或"29.90"，不要写"¥299"。
- 可以自然地出现"给Ta买的""帮Ta代付的""和Ta一起用的"之类的备注，体现角色和真实用户的关系。

===支付宝账单
说明：每一行格式：标题|||金额（纯数字，不要带符号）|||类型（收入/支出）|||时间描述|||账单原因或备注。
- ⚠️ 金额只写数字，例如"13.50"，不要写"¥13.50"或"-13.50"。

===相册
说明：每一行格式：照片简短描述|||拍摄地点|||时间描述。

===备忘录
说明：每一行格式：标题|||正文内容|||时间描述。
- 可以适当出现对真实用户的碎碎念，比如“今天Ta又好可爱”“记得给Ta买蛋糕”“下次见面想和Ta说的话”，但仍然保持是角色自己的视角。

===音乐播放列表
说明：每一行格式：歌曲名|||歌手|||情绪/场景标签（如“emo”“通勤”“睡前”“健身”）。

===足迹
说明：每一行格式：地点名称|||详细地址或商圈|||时间|||停留时长|||主要活动|||心情|||和谁一起（可以写“独自”）。

===论坛
说明：每一行格式：帖子标题|||论坛名称（如"贴吧""豆瓣""知乎""NGA""虎扑"等）|||帖子内容摘要|||浏览时间|||是否评论（是/否）|||角色的评论内容（如果评论了）|||浏览/评论原因。
- 体现角色的兴趣爱好、关注话题、网络冲浪习惯
- 评论内容要符合角色性格，可以是吐槽、赞同、提问、分享经验等
示例（不要照抄）： 
示例：如何看待加班文化|||知乎|||讨论996工作制的利弊|||昨晚23:00|||是|||我觉得健康更重要，钱赚不完但身体垮了就完了|||深夜刷到的，感同身受
示例：这游戏新版本怎么样|||NGA|||玩家讨论游戏更新内容|||今天下午|||否|||||想看看其他人的评价再决定要不要更新

数量建议（不用单独输出，只是生成时参考）：
- 微信聊天：**15～25个会话，每个5～15条对话（这是重点，占总篇幅70%以上）**
  - 其中必须包含1个与真实用户"${userName}"的会话（2-5条角色发的未读消息）
  - 其余都是虚构NPC的聊天（可以双向对话）
- 通讯录：5～8条（简化）
- 浏览器历史：5～10条（简化）
- 淘宝订单：3～6条（简化）
- 支付宝账单：8～15条（简化）
- 相册：5～10条（简化）
- 备忘录：5～8条（简化）
- 音乐播放列表：10～15首（简化）
- 足迹：4～6条（简化）
- 论坛：8～12条（体现角色的兴趣和网络习惯）

重要：
- 严格按照上述分区标题和“|||”字段格式输出。
- 不要输出"示例"这两个字开头的行，真正的数据行里不要包含“示例”这个词。
- 不要输出任何解释、说明、小标题，只输出数据本身。

现在开始根据这个角色的特点，生成一整套专属于TA的手机内容：`

}

// 生成AI手机内容
export const generateAIPhoneContent = async (
  characterId: string,
  characterName: string,
  forceNew: boolean = true  // 默认总是生成新的
): Promise<AIPhoneContent> => {
  try {
    // forceNew为false时才使用缓存（查看历史记录时）
    if (!forceNew) {
      const cacheKey = `ai_phone_${characterId}`
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const cachedData = JSON.parse(cached)
        console.log('使用缓存的手机内容')
        return cachedData
      }
    }
    
    console.log('正在生成手机内容...')
    const prompt = await buildPhoneContentPrompt(characterId, characterName)
    
    // 手机内容需要大量token，设置为10000（微信聊天为主）
    const response = await callAI([
      { role: 'user', content: prompt }
    ], 1, 10000)  // 1次重试，最多10000 tokens
    
    console.log('AI响应长度:', response.length)
    console.log('AI响应前1000字符:', response.substring(0, 1000))
    
    // 使用文本解析器代替JSON解析
    const { parsePhoneContent } = await import('./phoneContentParser')
    const phoneContent = parsePhoneContent(response, characterId, characterName)
    
    // 保存到历史记录
    savePhoneHistory(characterId, phoneContent)
    
    return phoneContent
    
  } catch (error) {
    console.error('生成手机内容失败:', error)
    
    // 返回默认内容
    return {
      characterId,
      characterName,
      generatedAt: Date.now(),
      contacts: [
        { name: '妈妈', phone: '138****8888', relation: '家人', notes: '最爱我的人' }
      ],
      wechatChats: [
        { name: '好友', lastMessage: '在吗？', time: '刚刚', unread: 1, messages: [{ content: '在吗？', isSelf: false, time: '刚刚' }] }
      ],
      browserHistory: [
        { title: '百度首页', url: 'https://www.baidu.com', time: '5分钟前' }
      ],
      taobaoOrders: [
        { title: '商品', price: '99.00', status: '待收货' }
      ],
      alipayBills: [
        { title: '转账', amount: '100.00', type: 'expense', time: '今天' }
      ],
      photos: [
        { description: '风景照', location: '公园', time: '上周' }
      ],
      notes: [
        { title: '待办事项', content: '记得买东西', time: '昨天' }
      ],
      musicPlaylist: [
        { title: '歌曲', artist: '歌手', mood: '放松' }
      ],
      footprints: [
        { location: '家', address: '住宅区', time: '08:00', duration: '2小时', activity: '起床洗漱' }
      ],
      forumPosts: [
        { title: '帖子', forum: '论坛', content: '内容', time: '今天', hasCommented: false }
      ]
    }
  }
}

// 历史记录接口
export interface PhoneHistory {
  id: string
  characterId: string
  characterName: string
  timestamp: number
  content: AIPhoneContent
}

// 保存手机内容到历史记录
export const savePhoneHistory = (characterId: string, content: AIPhoneContent) => {
  const historyKey = `phone_history_${characterId}`
  const historyListKey = 'phone_history_list'
  
  // 创建历史记录
  const history: PhoneHistory = {
    id: `${characterId}_${Date.now()}`,
    characterId,
    characterName: content.characterName,
    timestamp: Date.now(),
    content
  }
  
  // 保存到角色专属历史
  const saved = localStorage.getItem(historyKey)
  const historyList: PhoneHistory[] = saved ? JSON.parse(saved) : []
  historyList.unshift(history) // 最新的放在前面
  
  // 只保留最近10条
  if (historyList.length > 10) {
    historyList.pop()
  }
  
  localStorage.setItem(historyKey, JSON.stringify(historyList))
  
  // 同时保存到总列表（用于快速查找）
  const allHistorySaved = localStorage.getItem(historyListKey)
  const allHistory: string[] = allHistorySaved ? JSON.parse(allHistorySaved) : []
  if (!allHistory.includes(characterId)) {
    allHistory.push(characterId)
    localStorage.setItem(historyListKey, JSON.stringify(allHistory))
  }
}

// 获取角色的历史记录列表
export const getPhoneHistory = (characterId: string): PhoneHistory[] => {
  const historyKey = `phone_history_${characterId}`
  const saved = localStorage.getItem(historyKey)
  return saved ? JSON.parse(saved) : []
}

// 获取单条历史记录
export const getPhoneHistoryById = (historyId: string): PhoneHistory | null => {
  const [characterId] = historyId.split('_')
  const historyList = getPhoneHistory(characterId)
  return historyList.find(h => h.id === historyId) || null
}

// 删除历史记录
export const deletePhoneHistory = (characterId: string, historyId: string) => {
  const historyKey = `phone_history_${characterId}`
  const historyList = getPhoneHistory(characterId)
  const filtered = historyList.filter(h => h.id !== historyId)
  localStorage.setItem(historyKey, JSON.stringify(filtered))
}

// 清除角色所有历史
export const clearCharacterHistory = (characterId: string) => {
  const historyKey = `phone_history_${characterId}`
  localStorage.removeItem(historyKey)
}

// 清除所有历史
export const clearAllPhoneHistory = () => {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('phone_history_')) {
      localStorage.removeItem(key)
    }
  })
}
