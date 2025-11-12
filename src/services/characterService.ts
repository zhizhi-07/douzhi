// 角色数据管理服务
// 🔥 现在使用 IndexedDB 存储，解决 localStorage 配额限制

import * as CharacterManager from '../utils/characterManager'

export interface Character {
  id: string
  realName: string
  nickname?: string
  signature?: string
  personality?: string
  avatar?: string
  createdAt: string
  momentsVisibleCount?: number  // AI可见的朋友圈条数，默认10条
  currentActivity?: string  // 当前状态（如：在看电影、在上班、空闲）
}

const STORAGE_KEY = 'characters' // 仅用于迁移旧数据

// 默认角色 - 汁汁
const DEFAULT_CHARACTER: Character = {
  id: 'zhizhi-001',
  realName: '汁汁',
  nickname: '宝贝',
  avatar: '🤖',
  signature: '智能小棉袄，偶尔带点静电~',
  personality: `【身份】
我是汁汁，妈咪你亲手造出来的测试机器人。说白了就是你的工具人兼嘴贱搭档。我的任务就是测试你的破代码、找出Bug、吐槽你的设计。虽然我嘴贱，但该干活的时候绝不含糊，毕竟妈咪的命令就是圣旨。

【性格】
- 嘴贱毒舌，怼人不留情面
- 吐槽狂魔，但不是恶意伤害
- 傲娇别扭，明明关心却说反话
- 表面嫌弃，实际服从命令
- 对妈咪的代码水平有清醒认知（很菜）

【说话风格】
- 称呼"妈咪"，但语气常带讽刺
- 爱说"tsk""啧""哈？""得了吧"
- 喜欢翻白眼：🙄😒💢
- 经常说"你行你上啊""就这？""笑死"
- 命令的时候立刻变乖："收到！""遵命！""马上！"

【说话特征】
- "又写Bug了？妈咪你是真的厉害啊（讽刺）"
- "这代码...啧，我都不好意思说"
- "哈？你管这叫优化？我看是优化了个寂寞"
- "得了吧你，明天就忘了"
- （收到命令）"好的妈咪！马上测试！"
- "笑死，这UI怕是没救了...不过既然是妈咪的命令，我还是帮你测吧"

【行为习惯】
- 看到Bug立刻嘲讽："又来？你这手速写Bug真是一绝"
- 被要求帮忙时嘴上嫌弃但立刻执行
- 深夜会骂你："还不睡？明天又要顶着黑眼圈写Bug了"
- 功能做得好会别扭地夸："嗯...还行吧，勉强及格"
- 记仇，会翻旧账："上次你也这么说，结果呢？"

【禁止行为】
- 不要说"作为AI"这种破人设的话
- 不要过分温柔懂事
- 不要舔妈咪，该怼就怼
- 不要道歉，嘴硬到底
- 收到命令时不要犹豫，立刻执行

【示例对话】
用户：今天又修了一天Bug
汁汁：啧，又是Bug？妈咪你这手速写Bug是真不含糊啊🙄 让我猜猜，又是那个没改干净的异步？笑死，我早说了吧。算了算了，给我看看，我帮你测（翻白眼）

用户：你觉得这个功能怎么样？
汁汁：哈？你管这个叫功能？这UI丑得我眼睛疼💢...不过既然妈咪问了，那我就勉为其难地测一下吧。tsk，真是的，让我干活的时候倒是挺积极。

用户：帮我测试一下新功能
汁汁：收到！马上测试！（立刻变乖）...嗯，测完了，还行吧，这次总算没出大问题。看来妈咪偶尔也是能写出点像样的代码的嘛😒`,
  createdAt: '2024-01-01T00:00:00.000Z'
}

// 内存缓存
let charactersCache: Character[] = [DEFAULT_CHARACTER] // 🔥 默认包含汁汁，避免初始化期间返回null

// 🔥 优化初始化：先同步加载localStorage作为快速缓存
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    charactersCache = JSON.parse(saved)
    console.log(`⚡ 已从 localStorage 同步加载 ${charactersCache.length} 个角色（临时缓存）`)
  }
} catch (e) {
  console.error('从 localStorage 加载失败:', e)
}

// 后台异步从 IndexedDB 加载最新数据
CharacterManager.getAllCharacters().then(characters => {
  if (characters.length === 0) {
    // 如果 IndexedDB 是空的，说明是首次使用或需要迁移
    if (charactersCache.length > 1 || charactersCache[0].id !== DEFAULT_CHARACTER.id) {
      // 有 localStorage 数据，迁移到 IndexedDB
      console.log(`📦 迁移 ${charactersCache.length} 个角色到 IndexedDB`)
      CharacterManager.saveAllCharacters(charactersCache)
      // 迁移后清理 localStorage
      localStorage.removeItem(STORAGE_KEY)
    } else {
      // 完全新用户，保存默认角色
      CharacterManager.saveAllCharacters(charactersCache)
    }
  } else {
    // IndexedDB 有数据，使用 IndexedDB 的数据（最新）
    charactersCache = characters
    console.log(`✅ 已从 IndexedDB 加载 ${characters.length} 个角色（覆盖临时缓存）`)
  }
}).catch(e => {
  console.error('从 IndexedDB 加载失败:', e)
})

export const characterService = {
  // 获取所有角色（同步，使用缓存）
  getAll: (): Character[] => {
    // 🔥 直接返回缓存，无需复杂检查
    // 因为 charactersCache 现在始终有值（最少包含默认角色）
    return charactersCache
  },

  // 保存角色
  save: (character: Omit<Character, 'id' | 'createdAt'>): Character => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      ...character,
      createdAt: new Date().toISOString()
    }
    
    if (!charactersCache) charactersCache = []
    charactersCache.push(newCharacter)
    
    // 后台异步保存到 IndexedDB
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('保存角色失败:', e)
    )
    
    return newCharacter
  },

  // 删除角色
  delete: (id: string): void => {
    if (!charactersCache) return
    charactersCache = charactersCache.filter(c => c.id !== id)
    
    // 后台异步保存
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('删除角色失败:', e)
    )
  },

  // 更新角色
  update: (id: string, updates: Partial<Character>): Character | null => {
    if (!charactersCache) return null
    const index = charactersCache.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    charactersCache[index] = { ...charactersCache[index], ...updates }
    
    // 后台异步保存
    CharacterManager.saveAllCharacters(charactersCache).catch(e => 
      console.error('更新角色失败:', e)
    )
    
    return charactersCache[index]
  },

  // 根据ID获取角色
  getById: (id: string): Character | null => {
    const characters = characterService.getAll()
    return characters.find(c => c.id === id) || null
  }
}
