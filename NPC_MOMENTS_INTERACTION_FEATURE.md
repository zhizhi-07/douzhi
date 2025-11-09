# NPC朋友圈互动功能说明

## 功能概述

**重要：只有AI自己发朋友圈时，才会调配其人设中的NPC来互动！**

当AI角色发朋友圈时，系统会从其人设中提取NPC（如"篮球队"、"江燃"、"班主任"），让这些NPC给AI的朋友圈点赞评论。

**使用场景：**
- ✅ AI发朋友圈 → NPC会互动
- ❌ 用户发朋友圈 → 不会有NPC，只有其他AI角色互动

## 核心逻辑

### 1. 发布者判断

```typescript
// 在 director.ts 中
const isUserPost = moment.userId === 'user'

if (!isUserPost) {
  // 只有AI发朋友圈时，才收集该AI的NPC
  const publisher = characterService.getById(moment.userId)
  const npcs = await collectCharacterNPCs(
    publisher.id,
    publisher.realName,
    publisher.personality,
    publisher.world
  )
} else {
  // 用户发朋友圈，不收集NPC
  console.log('用户发的朋友圈，不收集NPC')
  // 使用 buildUserMomentPrompt()
  // 不包含 NPC 信息
  // 只有 AI 角色参与互动
}
```

### 2. 提示词分离

**用户发朋友圈：**
- 使用 `buildUserMomentPrompt()`
- **不包含**NPC信息
- 只有AI角色参与互动

**AI发朋友圈：**
- 使用 `buildAIMomentPrompt()`
- **包含**该AI的NPC信息
- AI角色 + NPC都可以参与互动

### 3. NPC提取 (`npcExtractor.ts`)

系统会使用AI自动从角色人设中提取NPC信息：

```typescript
// 从角色人设中提取（只在AI发朋友圈时调用）
const npcs = await collectCharacterNPCs(
  characterId,
  characterName,
  personality,
  world
)

// 返回的NPC信息包括：
{
  name: "江燃",
  relationship: "同学",
  personality: "性格冷淡，话少",
  avatar: "🧊"
}
```

### 4. NPC ID格式

NPC使用特殊的ID格式，以便区分：
- 格式：`npc-{所属角色ID}-{NPC名字}`
- 示例：`npc-tangqiushui-001-江燃`
- 系统通过`startsWith('npc-')`判断是否为NPC

### 5. NPC互动规则

**可以做的事：**
- ✅ 给AI发的朋友圈点赞
- ✅ 给AI发的朋友圈评论
- ✅ 回复其他人的评论

**不能做的事：**
- ❌ 给用户发的朋友圈互动（用户朋友圈不调配NPC）
- ❌ 私聊（NPC不能发私信）
- ❌ 发朋友圈（NPC不能主动发朋友圈）

### 6. AI导演编排

**当AI发朋友圈时，AI导演会：**
1. 判断是AI发的朋友圈
2. 提取该AI人设中提到的NPC
3. 根据朋友圈内容决定哪些NPC会互动
4. 编排NPC的点赞和评论

**当用户发朋友圈时，AI导演会：**
1. 判断是用户发的朋友圈
2. **不收集NPC**
3. 只编排AI角色的互动

## 文件结构

```
src/utils/
├── npcExtractor.ts              # NPC提取器（新增）
├── momentsAI/
│   ├── dataCollector.ts         # 添加collectCharacterNPCs（收集单个角色的NPC）
│   ├── promptTemplate.ts        # 用户和AI朋友圈使用不同提示词
│   ├── director.ts              # 根据发布者类型决定是否收集NPC
│   └── actionExecutor.ts        # 支持NPC的点赞评论（已有逻辑）
```

## 使用示例

### 在人设中定义NPC

```typescript
personality: `我是唐秋水，高中生。

【周围的人】
- 江燃：同班同学，性格冷淡，是学校的冰山美人
- 篮球队：我的队友们，经常一起打球，都认识我女朋友
- 班主任：李老师，对我挺关注的
`
```

### AI导演编排示例

当用户发朋友圈后，AI导演可能编排：

```
场景:众人围观道歉贴
点赞|篮球队长|篮球队长|3||
评论|篮球队员A|篮球队员A|5|嫂子威武😂|
评论|篮球队员B|篮球队员B|7|又惹女朋友生气了？|
评论|npc-tangqiushui-001-江燃|江燃|10|有病|
点赞|npc-tangqiushui-001-班主任|班主任|15||
评论|npc-tangqiushui-001-班主任|班主任|16|？|
```

## 技术细节

### 缓存机制

NPC提取结果会被缓存，避免重复调用API：

```typescript
// 缓存在Map中
const npcCache = new Map<string, NPCInfo[]>()

// 清除缓存（角色人设更新时）
clearNPCCache(characterId)
```

### 预加载

系统启动时可以预加载所有NPC：

```typescript
import { preloadAllNPCs } from './utils/npcExtractor'

// 预加载所有角色的NPC
await preloadAllNPCs(characters)
```

### 虚拟角色对象

NPC不是真实存储的角色，执行动作时会创建虚拟对象：

```typescript
const virtualCharacter = {
  id: 'npc-zhizhi-001-江燃',
  realName: '江燃',
  nickname: '江燃',
  avatar: '🧊'
}
```

## 优势

1. **真实感增强**：NPC互动让AI角色的世界更立体
2. **自动提取**：无需手动配置，AI自动从人设提取
3. **智能编排**：AI导演根据人设和场景决定NPC反应
4. **性能优化**：结果缓存，避免重复API调用

## 注意事项

1. **人设要清晰**：NPC信息需要在人设中明确提到
2. **不要太频繁**：NPC互动应该适度，避免喧宾夺主
3. **符合人设**：NPC的反应要符合其在人设中的描述
4. **ID格式规范**：严格遵守`npc-{角色ID}-{NPC名}`格式

## 示例场景

### 场景1：AI发朋友圈（有NPC互动）

```
唐秋水的朋友圈：我，唐秋水，在此对我方最高领导人，用户同志，致以最诚挚的歉意...

NPC互动：
- 篮球队员们：刷"嫂子威武"
- 江燃：冷淡评论"有病"
- 班主任：点赞并评论"？"
```

### 场景2：用户发朋友圈（没有NPC）

```
用户朋友圈：为什么没人懂我呢

只有AI角色互动：
- 唐秋水：关心评论并私聊
- 汁汁：毒舌评论
- 其他AI：根据关系互动

❌ 不会有NPC参与
```

## 后续优化方向

1. **NPC头像**：支持为NPC设置自定义头像
2. **NPC关系网**：记录NPC之间的关系
3. **NPC对话**：NPC之间可以互相评论
4. **动态更新**：人设变化时自动重新提取NPC
5. **手动配置**：允许用户手动添加/编辑NPC

---

**实现时间**：2025年11月9日  
**功能状态**：✅ 已完成，待测试
