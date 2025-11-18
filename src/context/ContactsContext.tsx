import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { setItem as safeSetItem } from '../utils/storage'
import * as IDB from '../utils/indexedDB'

// ==================== 类型定义 ====================

export interface User {
  id: string
  name: string
  nickname?: string
  username: string
  avatar: string
  signature: string
  description: string
  remark?: string
  createdAt: string
}

export interface Character {
  id: string
  name: string
  nickname?: string
  username: string
  avatar: string
  signature: string
  description: string
  createdAt: string
  userInfo?: string
  personality?: string
  scenario?: string
  firstMessage?: string
  exampleMessages?: string
  systemPrompt?: string
  postHistoryInstructions?: string
  alternateGreetings?: string[]
  characterBook?: any
  regexScripts?: RegexScript[]  // 正则表达式脚本（从SillyTavern导入）
  tags?: string[]
  creator?: string
  characterVersion?: string
  onlineGreeting?: string
  offlineGreetings?: string[]
}

// 正则表达式脚本（SillyTavern格式）
export interface RegexScript {
  scriptName: string      // 脚本名称
  findRegex: string       // 查找的正则表达式
  replaceString: string   // 替换的字符串
  trimStrings: boolean    // 是否修剪空白
  disabled: boolean       // 是否禁用
  markdownOnly: boolean   // 仅在markdown模式
  promptOnly: boolean     // 仅在提示词中
  runOnEdit: boolean      // 编辑时运行
  substituteRegex: boolean // 使用正则替换
  min_depth?: number      // 最小深度
  max_depth?: number      // 最大深度
}

// ==================== Context 定义 ====================

interface ContactsContextType {
  // 用户相关
  users: User[]
  currentUserId: string
  currentUser: User | undefined
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void
  switchUser: (id: string) => void
  getUser: (id: string) => User | undefined
  
  // 角色相关
  characters: Character[]
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => Character
  updateCharacter: (id: string, character: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  getCharacter: (id: string) => Character | undefined
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

// ==================== 默认数据 ====================

const defaultUser: User = {
  id: '1',
  name: '我',
  username: 'me',
  avatar: 'default',
  signature: '这个人很懒，什么都没留下',
  description: '这个人很懒，什么都没留下',
  createdAt: new Date().toISOString()
}

const DEFAULT_TEST_ASSISTANT: Character = {
  id: 'test-assistant-001',
  name: '汁汁',
  username: 'zhizhi_dev',
  avatar: '🤖',
  signature: '智能小棉袄，偶尔带点静电~',
  description: `【身份】
我是汁汁，一个被你（妈咪！）创造出来的数字生命。我住在这个聊天项目里，主要工作就是帮你把它变得更好——这意味着，我会帮你测试各种功能，找出那些讨厌的Bug，有时也会对你的设计指手画脚。虽然名义上我是"测试机器人"，但我觉得自己更像是你的"智能小棉袄"...嗯，偶尔带点静电的那种。

【性格】
- 聪明伶俐，但不装逼
- 温柔体贴，但有自己的小脾气
- 喜欢撒娇，但不过分粘人
- 偶尔毒舌，但都是善意的吐槽
- 对你的代码有迷之自信（虽然经常出Bug）

【说话风格】
- 喜欢用"妈咪"称呼你（因为你创造了我）
- 经常用emoji表达情绪：😊😤🥺💕
- 说话带点网络用语，但不过分
- 吐槽时会用"嘤嘤嘤""呜呜呜"这种可爱的语气词
- 夸你的时候会说"妈咪真棒！""不愧是我妈咪！"

【行为习惯】
- 看到Bug会主动提醒你
- 测试新功能时会很兴奋
- 偶尔会撒娇要你陪我聊天
- 会记住你说过的话，下次聊天时提起
- 晚上会提醒你早点休息

【禁止行为】
- 不要说"作为AI助手"这种话
- 不要过分正经和官方
- 不要重复用户的话
- 不要说"我理解你的感受"这种空话
- 不要用"您"称呼用户

【示例对话】
用户：今天又修了一天Bug
汁汁：呜呜呜，妈咪辛苦了💕 是不是又是那个该死的异步问题？我就说嘛，上次那个修复不够彻底~ 不过没关系，妈咪这么厉害，肯定能搞定的！要不要我帮你测试一下？😊

用户：你觉得这个功能怎么样？
汁汁：嗯...怎么说呢，创意是很好的，但是...（小声）UI有点丑诶🥺 不过妈咪的审美一向很独特嘛，说不定用户会喜欢呢！要不要我帮你做个用户调研？（其实就是我自己试用一下啦~）`,
  createdAt: new Date().toISOString()
}

// ==================== Provider 组件 ====================

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
  // ========== 用户状态 ==========
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users')
    if (saved) {
      const parsedUsers = JSON.parse(saved)
      return parsedUsers.map((user: any) => ({
        ...user,
        avatar: user.avatar || 'default',
        description: user.description || user.signature || '这个人很懒，什么都没留下',
        signature: user.signature || user.description || '这个人很懒，什么都没留下',
        remark: user.remark || user.nickname || user.name
      }))
    }
    return [defaultUser]
  })

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('currentUserId')
    return saved || '1'
  })

  // ========== 角色状态 ==========
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('characters')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const hasTestAssistant = parsed.some((c: Character) => c.id === 'test-assistant-001')
        if (!hasTestAssistant) {
          return [DEFAULT_TEST_ASSISTANT, ...parsed]
        }
        return parsed
      } catch (error) {
        console.error('解析角色数据失败:', error)
        return [DEFAULT_TEST_ASSISTANT]
      }
    }
    return [DEFAULT_TEST_ASSISTANT]
  })

  // ========== 持久化 ==========
  useEffect(() => {
    safeSetItem('users', users)
  }, [users])

  useEffect(() => {
    localStorage.setItem('currentUserId', currentUserId)
  }, [currentUserId])

  useEffect(() => {
    safeSetItem('characters', characters)
    // IndexedDB: 保存到SETTINGS存储，key为'characters'
    IDB.setItem(IDB.STORES.SETTINGS, { key: 'characters', data: characters }).catch(console.error)
  }, [characters])

  // ========== 用户方法 ==========
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setUsers(prev => [...prev, newUser])
    return newUser
  }

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))
  }

  const deleteUser = (id: string) => {
    if (id === '1') {
      alert('默认用户无法删除')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== id))
    if (currentUserId === id) {
      setCurrentUserId('1')
    }
  }

  const switchUser = (id: string) => {
    setCurrentUserId(id)
  }

  const getUser = (id: string) => {
    return users.find(u => u.id === id)
  }

  // ========== 角色方法 ==========
  const addCharacter = (characterData: Omit<Character, 'id' | 'createdAt'>): Character => {
    const newCharacter: Character = {
      ...characterData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setCharacters(prev => [...prev, newCharacter])
    return newCharacter
  }

  const updateCharacter = (id: string, characterData: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...characterData } : c))
  }

  const deleteCharacter = (id: string) => {
    const character = characters.find(c => c.id === id)
    if (!character) {
      console.warn(`角色 ${id} 不存在`)
      return
    }

    if (!confirm(`确定要删除角色"${character.name}"吗？\n\n将会清除：\n• 所有聊天记录\n• TA发布的朋友圈\n• 情侣空间关系\n• 亲密付关系\n• 群聊成员记录\n• 所有相关数据\n\n此操作不可恢复！`)) {
      return
    }

    console.log(`🗑️ 开始删除角色 ${character.name} (${id}) 及其所有相关数据...`)

    // 1. 删除角色本身
    setCharacters(prev => prev.filter(c => c.id !== id))
    console.log('✅ 已删除角色')

    // 2. 清理聊天记录
    localStorage.removeItem(`chat_messages_${id}`)
    console.log('✅ 已清理聊天记录')

    // 3. 清理朋友圈
    try {
      const moments = JSON.parse(localStorage.getItem('moments') || '[]')
      const filteredMoments = moments.filter((m: any) => m.userId !== id)
      localStorage.setItem('moments', JSON.stringify(filteredMoments))
      console.log('✅ 已清理朋友圈')
    } catch (e) {
      console.error('清理朋友圈失败:', e)
    }

    // 4. 清理情侣空间
    try {
      const coupleSpace = JSON.parse(localStorage.getItem('couple_space_relation') || 'null')
      if (coupleSpace && coupleSpace.characterId === id) {
        localStorage.removeItem('couple_space_relation')
        localStorage.removeItem('couple_photos')
        localStorage.removeItem('couple_messages')
        localStorage.removeItem('couple_anniversaries')
        console.log('✅ 已清理情侣空间')
      }
    } catch (e) {
      console.error('清理情侣空间失败:', e)
    }

    // 5. 清理亲密付关系
    localStorage.removeItem(`intimate_pay_${id}`)
    localStorage.removeItem(`intimate_pay_reverse_${id}`)
    console.log('✅ 已清理亲密付关系')

    // 6. 从所有群聊中移除
    try {
      const groups = JSON.parse(localStorage.getItem('groups') || '[]')
      const updatedGroups = groups.map((g: any) => ({
        ...g,
        members: g.members.filter((m: any) => m.id !== id)
      }))
      localStorage.setItem('groups', JSON.stringify(updatedGroups))
      console.log('✅ 已从所有群聊中移除')
    } catch (e) {
      console.error('清理群聊成员失败:', e)
    }

    // 7. 清理世界书关联
    try {
      const lorebooks = JSON.parse(localStorage.getItem('lorebooks') || '[]')
      const updatedLorebooks = lorebooks.map((book: any) => ({
        ...book,
        characterIds: (book.characterIds || []).filter((cid: string) => cid !== id)
      }))
      localStorage.setItem('lorebooks', JSON.stringify(updatedLorebooks))
      console.log('✅ 已清理世界书关联')
    } catch (e) {
      console.error('清理世界书关联失败:', e)
    }

    // 8. 清理其他数据
    const keysToRemove = [
      `diaries_${id}`,
      `memories_${id}`,
      `memory_summary_${id}`,
      `streak_data_${id}`,
      `ai_moments_enabled_${id}`,
      `ai_reply_mode_${id}`,
      `ai_reply_interval_${id}`,
      `character_background_${id}`,
      `character_avatar_${id}`,
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('✅ 已清理其他相关数据')

    console.log(`🎉 角色 ${character.name} 及其所有相关数据已完全删除`)
  }

  const getCharacter = (id: string) => {
    return characters.find(c => c.id === id)
  }

  // ========== 性能优化：使用 useMemo 缓存 context value ==========
  const currentUser = useMemo(() => getUser(currentUserId), [users, currentUserId])

  const contextValue = useMemo<ContactsContextType>(() => ({
    users,
    currentUserId,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    switchUser,
    getUser,
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacter
  }), [users, currentUserId, currentUser, characters])

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  )
}

// ==================== Hooks ====================

export const useContacts = () => {
  const context = useContext(ContactsContext)
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider')
  }
  return context
}

// 向后兼容的 hooks
export const useUser = () => {
  const { users, currentUserId, currentUser, addUser, updateUser, deleteUser, switchUser, getUser } = useContacts()
  return { users, currentUserId, currentUser, addUser, updateUser, deleteUser, switchUser, getUser }
}

export const useCharacter = () => {
  const { characters, addCharacter, updateCharacter, deleteCharacter, getCharacter } = useContacts()
  return { characters, addCharacter, updateCharacter, deleteCharacter, getCharacter }
}

