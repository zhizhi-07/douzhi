import { callAI } from './api'

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
}

// 获取角色聊天记录
const getCharacterChatHistory = (characterId: string): string => {
  try {
    const chatKey = `chat_${characterId}`
    const saved = localStorage.getItem(chatKey)
    if (!saved) return '没有聊天记录'
    
    const messages = JSON.parse(saved)
    // 取最近20条消息
    const recentMessages = messages.slice(-20)
    
    return recentMessages.map((msg: any) => {
      const sender = msg.type === 'sent' ? '用户' : '角色'
      return `${sender}: ${msg.content}`
    }).join('\n')
  } catch (e) {
    console.error('获取聊天记录失败:', e)
    return '无法获取聊天记录'
  }
}

// 获取角色信息
const getCharacterInfo = (characterId: string): string => {
  try {
    const saved = localStorage.getItem('characters')
    if (!saved) return '未知角色'
    
    const characters = JSON.parse(saved)
    const character = characters.find((c: any) => c.id === characterId)
    
    if (!character) return '未知角色'
    
    return `角色名：${character.name}\n性格：${character.personality || '未设置'}\n描述：${character.description || '未设置'}`
  } catch (e) {
    console.error('获取角色信息失败:', e)
    return '未知角色'
  }
}

// 生成手机内容的提示词
const buildPhoneContentPrompt = (characterId: string, characterName: string) => {
  const characterInfo = getCharacterInfo(characterId)
  const chatHistory = getCharacterChatHistory(characterId)
  
  return `你是一个手机内容生成器。根据角色性格生成手机内容。

角色信息：
${characterInfo}

最近聊天记录（仅供参考角色性格和生活状态）：
${chatHistory}

🚨 重要规则（必须严格遵守）：
1. ❌ 不要生成任何与"用户"、"微信用户"或真实用户相关的内容
2. ❌ 微信聊天记录必须是虚构的NPC（如朋友、同事、家人等），不能包含用户
3. ❌ 不能编造用户的行为、对话或任何信息
4. ✅ 只能生成角色自己的手机内容（角色与其他虚构NPC的互动）
5. ✅ 聊天记录要符合角色性格，但对象必须是虚构的人物

使用文本格式输出，严格按照以下格式，每个分类用===开头，每条记录一行，字段用|||分隔。

===通讯录
李华|||138****1234|||大学同学|||上周打电话：又叫我去组饭局，我根本就不想去，好烦啊。但他说小美也在，算了还是去吧
王芳|||139****5678|||同事|||昨天通话：催我交项目报告，说周一开会要用。我说知道了知道了，她还是不放心
张伟|||137****9012|||表哥|||前天联系：问我要不要去上海玩，说可以住他那。我说考虑考虑，其实就是不想去
刘洋|||136****3456|||高中同学|||上周通话：约我周末吃饭，说好久没见了。我推说有事，他说那下次吧
陈晨|||135****7890|||发小|||昨天打来：吐槽他女朋友又作了，聊了一个多小时。我都困了他还在说
赵敏|||134****1234|||房东|||本月5号：催我交房租，说已经晚了两天了。我说马上转，然后又拖了一天
周杰|||133****5678|||健身教练|||上周联系：问我怎么好几天没来了，是不是又偷懒。我说工作忙，他说借口
吴婷|||132****9012|||前同事|||前几天聊天：问我现在公司怎么样，要不要跳槽。我说还行，她说有机会介绍给我
郑凯|||131****3456|||朋友|||上周末：约我去爬山，我说太累了不去。他说我就知道你会这么说
孙莉|||130****7890|||表姐|||昨天视频：让我过年回家住她那，说给我准备好房间了。我说再看看
(继续生成到10-15条，每个都要有真实的联系原因和通话内容，要有生活气息)

===微信聊天
【群聊】大学宿舍|||李华：周末聚餐啊|||1小时前|||3
对话：李华|||周末聚餐啊，老地方|||10:30
对话：张明|||我可以，几点？|||10:32
对话：self|||又吃饭，上周不是刚吃过|||10:33
对话：李华|||哎呀，好久没见了嘛|||10:35
对话：王强|||我也去，叫上小美吧|||10:36
对话：self|||小美也去的话我就去|||10:38
对话：李华|||哈哈哈，我就知道|||10:39
【群聊】公司项目组|||王芳：@所有人 周一开会|||昨天|||5
对话：王芳|||@所有人 周一上午9点开会，记得带报告|||18:00
对话：self|||收到|||18:05
对话：刘洋|||好的|||18:06
对话：陈晨|||我那天要请假|||18:10
对话：王芳|||请假？什么事这么重要|||18:12
对话：陈晨|||家里有事|||18:15
对话：王芳|||那会后单独找你|||18:20
李华|||周末打球去不？|||2小时前|||0
对话：other|||在吗？|||14:25
对话：self|||在的，怎么了？|||14:26
对话：other|||周末打球去不？|||14:30
对话：self|||好啊，几点？|||14:32
对话：other|||下午3点老地方|||14:33
陈晨|||我女朋友又生气了|||昨天|||1
对话：other|||兄弟，我女朋友又生气了|||20:30
对话：self|||又怎么了？|||20:32
对话：other|||我也不知道啊，莫名其妙就不理我了|||20:35
对话：self|||你肯定又忘了什么|||20:36
对话：other|||我想想...卧槽，今天是她生日|||20:40
对话：self|||哈哈哈哈哈|||20:41
对话：other|||完了完了，怎么办|||20:42
对话：self|||赶紧买礼物道歉吧|||20:43
(继续生成6-10个聊天，包含2-3个群聊。每个聊天5-10条对话，要有真实感和生活气息)

===浏览器历史
五一旅游攻略|||https://www.example.com/travel|||2小时前|||计划五一假期去哪里玩
最新手机评测|||https://www.example.com/phone|||昨天19:45|||想换新手机，看看评测
Python教程|||https://www.example.com/python|||昨天20:30|||工作需要学习Python
健身计划制定|||https://www.example.com/fitness|||2天前|||想开始健身，查找方法
美食推荐|||https://www.example.com/food|||3天前|||周末找个好吃的餐厅
(继续生成到15-25条)

===淘宝订单
无线蓝牙耳机|||299|||待收货|||旧的坏了|||这款评价不错，希望音质好
运动鞋|||459|||已发货|||跑步用|||看起来很轻便舒适
保温杯|||89|||待评价|||冬天需要|||保温效果好，容量够大
(继续生成8-15条)

===支付宝账单
外卖订单|||38|||支出|||12:30|||中午点了个快餐
地铁充值|||100|||支出|||8:00|||上班通勤
工资|||8500|||收入|||1号|||这个月工资
(继续生成20-30条)

===相册
日落风景|||西湖边|||昨天傍晚
朋友聚会|||火锅店|||上周六
家里的猫|||客厅|||今天上午
(继续生成15-25条)

===备忘录
周末计划|||买菜、打扫卫生、整理衣柜|||今天
工作待办|||完成报告、开会、回复邮件|||昨天
购物清单|||牛奶、面包、水果、洗衣液|||2天前
(继续生成10-15条)

===音乐播放列表
晴天|||周杰伦|||放松
夜曲|||周杰伦|||安静
告白气球|||周杰伦|||浪漫
(继续生成20-30首)

===足迹
星巴克|||国贸店|||09:00|||1小时|||喝咖啡看书|||放松|||独自
公司|||CBD大厦|||10:30|||6小时|||工作开会|||忙碌|||同事们
健身房|||社区健身中心|||18:00|||1.5小时|||跑步训练|||充实|||独自
(继续生成8-12条完整一天的行程)

重要：严格按照上述格式输出，不要添加任何解释文字，直接开始输出数据！

现在开始输出：`

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
    const prompt = buildPhoneContentPrompt(characterId, characterName)
    
    // 手机内容需要大量token，设置为6000
    const response = await callAI([
      { role: 'user', content: prompt }
    ], 1, 6000)  // 1次重试，最多6000 tokens
    
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
