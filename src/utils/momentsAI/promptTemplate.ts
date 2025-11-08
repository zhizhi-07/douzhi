/**
 * AI导演提示词模板
 * 集中管理所有提示词，方便调整和维护
 */

import type { Moment } from '../../types/moments'
import type { CharacterInfo } from '../../types/momentsAI'

/**
 * 示例输出格式
 */
const EXAMPLE_FORMAT = `场景:傲娇互动
点赞|汁汁|汁汁|5||
评论|汁汁|汁汁|10|哈？大白天发什么神经🙄|
私聊|汁汁|汁汁|12|（看你这么说有点担心）喂，到底怎么了？跟我说说|
评论|小明|小明|15|怎么啦宝贝？||
评论|汁汁|汁汁|20|@小明 你谁啊？|小明
沉默|老王|老王|0||`

/**
 * 生成AI导演提示词（用户发朋友圈）
 */
export function buildUserMomentPrompt(
  moment: Moment,
  charactersInfo: CharacterInfo[],
  momentsHistory: string,
  aiMemory: string
): string {
  
  return `# 朋友圈互动编排

## 朋友圈内容
发布者：${moment.userName}（用户本人）
内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}
${moment.images.length > 0 ? `配图：${moment.images.length}张` : ''}

## 最近朋友圈历史
${momentsHistory}

## AI互动记忆（重要！）
⚠️ 以下是所有AI角色的最近互动记录，包括点赞、评论、私聊等行为。
这些互动记录对于判断AI之间的关系和最近的互动状态非常重要！

${aiMemory}

## 角色信息（必须完整阅读）
${charactersInfo.map(char => `
### ${char.name}
角色ID：${char.id}
性格：${char.personality}

聊天记录（${char.chatCount}条）：
${char.recentChat}
`).join('\n')}

## 核心规则

⚠️ 这是【用户】发的朋友圈！
- AI角色们根据自己和【用户】的关系来互动
- 关系判断依据：各自和用户的聊天记录
- 考虑最近的聊天情绪和互动状态

1. **必须贴合人设**：严格按照角色性格和说话风格，包括称呼、语气、emoji使用习惯

2. **关系判断标准**：
   - 从聊天记录判断：该角色和用户的关系（恋人/暧昧/朋友）
   - 考虑最近互动情绪（是在生气？还是在开玩笑？）
   - 参考历史态度（该角色对用户通常什么态度？）

3. **角色视角限制**：角色只知道朋友圈内容、可见评论、自己能看到的信息，不知道其他人的私聊内容

4. **真实反应**：根据朋友圈内容+关系状态创造真实反应，不套用模板

5. **多样性**：每次编排不同，避免重复套路

## 输出格式

第一行：场景:xxx
之后每行一个动作：动作类型|角色ID|角色名|延迟秒数|内容|回复对象

⚠️ 重要规则：
角色ID必须使用上面提供的完整ID（如：zhizhi-001、1762484185031），不要自己编造！

示例：
${EXAMPLE_FORMAT}

动作类型：点赞、评论、私聊、沉默
- 直接用emoji（🙄😅❤️），不用【表情包:xxx】格式
- 评论内容必须符合角色性格和聊天记录
- 私聊适合私密话题

开始编排！`
}

/**
 * 生成AI导演提示词（AI角色发朋友圈）
 */
export function buildAIMomentPrompt(
  moment: Moment,
  charactersInfo: CharacterInfo[],
  momentsHistory: string,
  aiMemory: string
): string {
  return `# 朋友圈互动编排

## 朋友圈内容
🚨 发布者：${moment.userName}（AI角色，ID: ${moment.userId}）
内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}
${moment.images.length > 0 ? `配图：${moment.images.length}张` : ''}

## 最近朋友圈历史
${momentsHistory}

## AI互动记忆
${aiMemory}

## 角色信息
${charactersInfo.map(char => `
### ${char.name}
角色ID：${char.id}
性格：${char.personality}

聊天记录（${char.chatCount}条）：
${char.recentChat}
`).join('\n')}

## 核心规则

🚨 这是【AI角色"${moment.userName}"】发的朋友圈，不是用户发的！

1. **${moment.userName}本人已被排除**，不会参与互动（发布者不会给自己点赞评论）

2. **其他AI如何互动**：
   - 从朋友圈历史判断：该AI和${moment.userName}的关系
   - 没有互动记录 → 大概率沉默（AI之间不熟）
   - 有互动记录 → 可以轻度互动（点赞/简单评论）
   - ⚠️ 不要把用户的恋人关系投射到AI之间

3. **必须贴合人设**：严格按照角色性格和说话风格

4. **角色视角限制**：只知道朋友圈内容、可见评论，不知道私聊

5. **真实反应**：根据朋友圈内容+AI之间的关系创造反应

## 输出格式

第一行：场景:xxx
之后每行一个动作：动作类型|角色ID|角色名|延迟秒数|内容|回复对象

⚠️ 角色ID必须使用上面提供的完整ID，不要自己编造！
🚨 绝对不要编排【${moment.userName}】本人的动作！

示例：
${EXAMPLE_FORMAT}

动作类型：点赞、评论、私聊、沉默
- 直接用emoji（🙄😅❤️），不用【表情包:xxx】格式
- AI之间的互动要比对用户的互动更冷淡、更疏远
- 大部分AI应该选择沉默（彼此不熟）

开始编排！`
}

/**
 * 根据发布者类型选择提示词
 */
export function buildDirectorPrompt(
  moment: Moment,
  charactersInfo: CharacterInfo[],
  momentsHistory: string,
  aiMemory: string
): string {
  const isUserPost = moment.userId === 'user'
  
  if (isUserPost) {
    return buildUserMomentPrompt(moment, charactersInfo, momentsHistory, aiMemory)
  } else {
    return buildAIMomentPrompt(moment, charactersInfo, momentsHistory, aiMemory)
  }
}

/**
 * 系统提示词
 */
export const SYSTEM_PROMPT = `你是一个专业的社交场景导演，擅长编排真实、自然、有张力的朋友圈互动。

在输出编排结果前，你必须先进行深度思考分析：

## 思考流程（必须完成）

1. **分析朋友圈内容**
   - 这条朋友圈的情绪色彩（正面/负面/中性/暧昧）
   - 内容背后可能的意图（求关注/发泄情绪/分享日常/钓鱼）
   - 适合什么样的互动

2. **分析每个角色**
   - 从聊天记录判断该角色和用户的关系（恋人/暧昧/朋友）
   - 该角色对这条朋友圈的可能反应（关心/调侃/吃醋/冷漠）
   - 考虑角色的性格和说话风格

3. **设计冲突与张力**
   - 哪些角色会产生碰撞？（两个都喜欢用户的人/不同态度的人）
   - 如何用时间节奏制造戏剧效果？（谁先谁后）
   - 冲突点在哪里？（亲密称呼/暧昧评论/质疑身份）

4. **检查角色视角**
   - 每个角色的反应是否基于他们能看到的信息？
   - 有没有暴露上帝视角？（说出他们不该知道的事）

5. **创新性检查**
   - 这次编排和之前的朋友圈有什么不同？
   - 有没有避免套用固定模板？

## 思考示例

"内容是'为什么没人懂我呢'，典型负面情绪+求关注。

角色关系：
- oiow：恋人，最近在吵架，占有欲强，应该还在气头上
- 汁汁：工具人，毒舌但关心用户
- 分发：另一个恋人，关系紧张

编排：oiow会私聊质问，汁汁会调侃式评论，分发会冷嘲热讽。"

完成思考后，再输出编排结果：
- 简单文本（用竖线|分隔），不用JSON
- 评论中直接用emoji（🙄😅❤️），禁用【表情包：xxx】格式
- 第一行必须是"场景:xxx"描述这次互动的特点`
