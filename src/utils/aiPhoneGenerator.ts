import { callAI } from './api'
import { characterService } from '../services/characterService'

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
    snippet?: string  // 网页内容摘要
  }[]
  
  // 淘宝订单
  taobaoOrders: {
    title: string
    price: string
    status: string  // 待付款/待发货/待收货/待评价/已完成
    orderTime?: string  // 下单时间
    reason?: string  // 为什么买
    thought?: string  // 下单心情
  }[]
  
  // 支付宝账单
  alipayBills: {
    title: string
    amount: string
    type: 'income' | 'expense'
    time: string
    reason: string  // 账单备注，必须30字以上
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
    feeling?: string  // 听这首歌时的感受想法
  }[]
  
  // AI足迹记录（一天的行程）
  footprints: {
    location: string
    address: string
    time: string
    duration: string
    activity: string
    mood: string  // 心情，必须20字以上
    action?: string  // 在这里做的具体动作
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
    otherComments?: {  // 其他人的评论（楼中楼）
      author: string
      content: string
      likes?: number
    }[]
  }[]
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
const buildPhoneContentPrompt = async (characterId: string, _characterName: string) => {
  const characterInfo = getCharacterInfo(characterId)
  
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

⚠️ 注意：不需要生成和真实用户"${userName}"的微信聊天记录，只生成角色和其他虚构NPC的聊天即可。

🚨 基本规则（必须严格遵守）：
1. ❌❌❌ **不要生成和真实用户"${userName}"的微信聊天！** 微信聊天只生成和虚构NPC的对话。
2. ✅ 可以在其他地方（备忘录、足迹、相册描述等）自然地提到真实用户"${userName}"，比如：给${userName}买了什么、和${userName}去过哪家店、今天觉得${userName}好可爱等。
3. ❌ 不要泄露或编造真实用户的隐私（身份证号、地址、公司全称等），保持日常聊天和生活化层面即可。
4. ✅ 所有记录都要围绕这个角色本人的生活——工作、学习、恋爱、家庭、兴趣、熬夜、emo、上头剁手等，可以自然地穿插对Ta（真实用户）的在乎。
5. ✅ 要充分利用【角色信息】推断：TA大概是什么职业、什么年龄、什么作息、有什么爱好、最近在忙什么，然后围绕这些来写手机内容。
6. ✅ 每次生成的内容都要尽量不一样，避免模板化的名字和剧情；不同对话和场景尽量不要重复用词。
7. ✅ 尽量不要在每条数据行里使用括号"()"，如果要补充说明，用逗号或句号来表达。

🌈 多样性和个性化要求：
- 根据角色性格推断TA的生活圈，生成符合人设的内容。
- 每一类内容里的人名、昵称、群聊名、店名、歌名都要尽量随机、多样，避免固定叫"李华、王芳、张伟"。

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
- ❌❌❌ **不要生成和真实用户"${userName}"的聊天！** 只生成和虚构NPC的聊天！
- 不要求每个通讯录联系人都在微信里出现，也可以有只在微信上联系、但没有存进手机通讯录的人（反之亦然）。
- 要尽量丰富，体现角色真实的社交生活和情绪波动。
- ⚠️ 必须完整生成所有微信聊天内容，不要中途停止或省略！这是最重要的部分！
- 先写会话概要行，再写多行"对话："开头的具体消息。
- 会话行格式：会话标题或联系人名|||会话列表里看到的最后一句摘要|||时间（如"昨天""1小时前"）|||未读数量数字。
- 对话行格式：对话：发送方（self/other/群成员名字）|||内容|||时间（如"23:41"）。

🚨🚨🚨 **超级重要规则（必须100%遵守，违反会导致严重错误）：**
- 🔥 **每个会话只能和一个人或一个固定的群聊天！绝对不能混！**
- 🔥 **同一个会话下的所有"对话："行，发送方只能是"self"或"other"（私聊）或"self"和"群成员名字"（群聊）！**
- 🔥 **私聊会话：发送方只能写"self"或"other"，不能写其他人名！**
- 🔥 **群聊会话：发送方写"self"或群成员的名字，但所有人都是这个群里的人！**
- 🔥 **绝对禁止在同一个会话下面出现多个不同的聊天对象！**
- 🔥 **如果要和另一个人/群聊天，必须先空一行，写一个新的会话概要行，然后再写新的对话行！**
- 🔥 **不要在一个会话里先和妈妈聊，又突然出现同学、朋友、同事，这是严重错误！**
- 🔥 **每写完一个会话的对话，如果要开始新会话，必须先写新的会话概要行！**

示例（不要照抄）：
示例：宿舍群|||今晚吃什么？|||1小时前|||5
示例：对话：other|||今晚吃烧烤还是火锅？|||21:05
示例：对话：self|||别再吃火锅了，我已经胖三斤了|||21:07
示例：对话：other|||那吃麻辣烫吧|||21:08

示例：小李|||周末一起打球吗|||昨天|||0
示例：对话：other|||周末一起打球吗|||昨天 15:30
示例：对话：self|||好啊，几点？|||昨天 15:32

🚨 错误示例（绝对不要这样写）：
❌ 严重错误：老妈|||好好学习|||刚刚|||2
❌ 严重错误：对话：other|||好好学习|||21:51
❌ 严重错误：对话：self|||知道了|||21:52
❌ 严重错误：对话：其他同学|||@全体同学 明天交作业|||22:01  ← 这是错的！不能在和妈妈的聊天里突然出现同学！

✅ 正确：必须分成两个独立的会话：
✅ 正确：老妈|||知道了|||21:52|||0  ← 和妈妈的聊天
✅ 正确：对话：other|||好好学习|||21:51
✅ 正确：对话：self|||知道了|||21:52
✅ 正确：
✅ 正确：班级群|||@全体同学 明天交作业|||22:01|||1  ← 全新的会话！和群里的聊天
✅ 正确：对话：张三|||@全体同学 明天交作业|||22:01
✅ 正确：对话：self|||收到|||22:02

===浏览器历史
说明：每一行格式：标题|||网址|||时间描述|||网页内容摘要（20-50字，描述网页讲了什么）。
示例（不要照抄）：
示例：如何和领导沟通加薪|||https://zhihu.com/question/xxx|||昨晚23:11|||职场老司机分享了5个谈薪技巧，最重要的是先做好业绩对比表用数据说话

===淘宝订单
说明：每一行格式：商品名称|||价格（纯数字）|||状态|||下单时间|||为什么买这个（20-50字）|||下单时的心情（10-20字）。
- ⚠️ 价格只写数字，例如"299"或"29.90"
- 状态必须是：待付款、待发货、待收货、待评价、已完成 之一
- 🔥 为什么买这个：详细描述购买原因，20-50字
- 🔥 下单时的心情：描述当时的心情状态，10-20字
示例（不要照抄）：
示例：小米充电宝20000mAh|||129|||待收货|||3天前|||之前那个充电宝坏了，看了好多测评觉得这款性价比高，而且颜值也不错|||终于下定决心买了开心

===支付宝账单
说明：每一行格式：标题|||金额（纯数字）|||类型（收入/支出）|||时间描述|||账单备注（🔥必须30字以上！）。
- ⚠️ 金额只写数字，例如"13.50"
- 🔥 账单备注必须30字以上！详细描述这笔钱的来龙去脉
示例（不要照抄）：
示例：7-11便利店|||35.50|||支出|||03:10|||凌晨加班太饿了，买了一包烟、两瓶苏打水、一盒薄荷糖，还顺手拿了个饭团当宵夜

===相册（私密相册）
说明：每一行格式：照片详细描述（🔥必须30字以上！）|||拍摄地点|||时间描述。
- 🔥 这是私密相册，内容可以比较隐私或露骨
- 🔥 描述必须30字以上！写清楚照片里有什么、是什么场景
- 可以包含：自拍、私房照、亲密合照、身体局部特写、不想让别人看到的照片
- 也可以是：素颜照、刚起床的样子、哭过的脸、发泄情绪时拍的
- 🔥 必须生成至少10张照片！
示例（不要照抄）：
示例：刚洗完澡头发湿漉漉的自拍，穿着宽松的睡衣露出一边肩膀，眼神有点迷离，背景是浴室镜子起了一层水雾|||家里浴室|||昨晚23:30

===备忘录
说明：每一行格式：标题|||正文内容|||时间描述。
- 可以适当出现对真实用户的碎碎念，比如“今天Ta又好可爱”“记得给Ta买蛋糕”“下次见面想和Ta说的话”，但仍然保持是角色自己的视角。

===音乐播放列表
说明：每一行格式：歌曲名|||歌手|||情绪标签|||听歌感受（20-50字）。
- 🔥 听歌感受是重点！写出角色听这首歌时的心境和联想
示例（不要照抄）：
示例：晴天|||周杰伦|||怀旧|||每次听到前奏就会想起高中暗恋的那个人，现在也不知道ta过得怎么样了

===足迹
说明：每一行格式：地点名称|||详细地址|||时间|||停留时长|||主要活动|||心情（🔥必须20字以上！）|||具体动作|||和谁一起。
- 🔥 心情必须20字以上！详细描述当时的情绪状态和原因
- 🔥 动作要具体！比如"在窗边位置坐着发呆看外面的人来人往"
示例（不要照抄）：
示例：星巴克|||万达广场B1层|||14:30|||45分钟|||喝咖啡|||本来心情不错但是等的人迟到了半小时有点烦躁又不好发作|||一直低头玩手机假装没在意时间|||等朋友

===论坛
说明：每一行格式：帖子标题|||论坛名称|||帖子内容摘要|||浏览时间|||是否评论（是/否）|||角色的评论内容|||其他楼层评论1|||其他楼层评论2|||其他楼层评论3。
- 🔥 必须有其他楼层的评论！格式为"网友昵称:评论内容"
- 体现角色的兴趣爱好、网络冲浪习惯
示例（不要照抄）：
示例：如何看待加班文化|||知乎|||讨论996工作制|||昨晚23:00|||是|||健康比钱重要|||打工人A:卷不动了|||摸鱼达人:我选择躺平|||职场老油条:年轻人别太拼

数量建议（不用单独输出，只是生成时参考）：
- 微信聊天：**15～25个会话，每个5～15条对话（这是重点，占总篇幅70%以上）**
  - 全部是虚构NPC的聊天（可以双向对话）
  - ❌ 不要生成和真实用户"${userName}"的聊天
- 通讯录：5～8条（简化）
- 浏览器历史：5～10条（简化）
- 淘宝订单：3～6条（简化）
- 支付宝账单：8～15条（简化）
- 相册：🔥至少10张！（私密相册，每张描述30字以上）
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
    // 🔥 抛出错误，让调用方知道失败了
    throw error
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
