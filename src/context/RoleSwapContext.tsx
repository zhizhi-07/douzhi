import { createContext, useContext, useState, ReactNode } from 'react'

// 虚拟环境数据类型
interface VirtualCharacter {
  id: string
  realName: string
  nickname?: string
  remark?: string
  signature?: string
  personality?: string
  avatar?: string
  createdAt: string
  pokeSuffix?: string
  worldSetting?: string
  languageStyle?: 'modern' | 'ancient' | 'noble' | 'fantasy' | 'auto'
}

interface VirtualGroup {
  id: string
  name: string
  members: string[]
  avatar?: string
  createdAt: string
}

interface VirtualMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  characterId?: string
}

interface RoleSwapState {
  // 是否在角色互换模式
  isActive: boolean
  // AI扮演的角色
  playerCharacter: { id: string; realName: string; personality?: string } | null
  // 虚拟环境数据
  virtualCharacters: VirtualCharacter[]
  virtualGroups: VirtualGroup[]
  virtualChats: Record<string, VirtualMessage[]>
  // AI的聊天历史（用于API调用）
  aiChatHistory: { role: string; content: string }[]
}

interface RoleSwapContextType {
  state: RoleSwapState
  // 进入角色互换模式
  enterRoleSwap: (playerChar: { id: string; realName: string; personality?: string }, aiFirstMessage?: string) => void
  // 退出角色互换模式
  exitRoleSwap: () => void
  // 添加虚拟角色
  addVirtualCharacter: (char: Omit<VirtualCharacter, 'id' | 'createdAt'>) => VirtualCharacter
  // 添加虚拟群聊
  addVirtualGroup: (group: Omit<VirtualGroup, 'id' | 'createdAt'>) => VirtualGroup
  // 添加虚拟消息
  addVirtualMessage: (chatId: string, msg: Omit<VirtualMessage, 'id' | 'timestamp'>) => void
  // 添加AI聊天历史
  addAIChatHistory: (msg: { role: string; content: string }) => void
  // 获取虚拟角色列表
  getVirtualCharacters: () => VirtualCharacter[]
  // 获取虚拟聊天记录
  getVirtualChat: (chatId: string) => VirtualMessage[]
}

const initialState: RoleSwapState = {
  isActive: false,
  playerCharacter: null,
  virtualCharacters: [],
  virtualGroups: [],
  virtualChats: {},
  aiChatHistory: []
}

const RoleSwapContext = createContext<RoleSwapContextType | null>(null)

export const RoleSwapProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<RoleSwapState>(initialState)

  const enterRoleSwap = (playerChar: { id: string; realName: string; personality?: string }, aiFirstMessage?: string) => {
    setState({
      isActive: true,
      playerCharacter: playerChar,
      virtualCharacters: [],
      virtualGroups: [],
      virtualChats: {},
      aiChatHistory: aiFirstMessage ? [{ role: 'assistant', content: aiFirstMessage }] : []
    })
  }

  const exitRoleSwap = () => {
    setState(initialState)
  }

  const addVirtualCharacter = (char: Omit<VirtualCharacter, 'id' | 'createdAt'>): VirtualCharacter => {
    const newChar: VirtualCharacter = {
      ...char,
      id: 'v_' + Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      virtualCharacters: [...prev.virtualCharacters, newChar]
    }))
    return newChar
  }

  const addVirtualGroup = (group: Omit<VirtualGroup, 'id' | 'createdAt'>): VirtualGroup => {
    const newGroup: VirtualGroup = {
      ...group,
      id: 'vg_' + Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      virtualGroups: [...prev.virtualGroups, newGroup]
    }))
    return newGroup
  }

  const addVirtualMessage = (chatId: string, msg: Omit<VirtualMessage, 'id' | 'timestamp'>) => {
    const newMsg: VirtualMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: Date.now()
    }
    setState(prev => ({
      ...prev,
      virtualChats: {
        ...prev.virtualChats,
        [chatId]: [...(prev.virtualChats[chatId] || []), newMsg]
      }
    }))
  }

  const addAIChatHistory = (msg: { role: string; content: string }) => {
    setState(prev => ({
      ...prev,
      aiChatHistory: [...prev.aiChatHistory, msg]
    }))
  }

  const getVirtualCharacters = () => state.virtualCharacters

  const getVirtualChat = (chatId: string) => state.virtualChats[chatId] || []

  return (
    <RoleSwapContext.Provider value={{
      state,
      enterRoleSwap,
      exitRoleSwap,
      addVirtualCharacter,
      addVirtualGroup,
      addVirtualMessage,
      addAIChatHistory,
      getVirtualCharacters,
      getVirtualChat
    }}>
      {children}
    </RoleSwapContext.Provider>
  )
}

export const useRoleSwap = () => {
  const context = useContext(RoleSwapContext)
  if (!context) {
    throw new Error('useRoleSwap must be used within RoleSwapProvider')
  }
  return context
}

// 判断是否在角色互换模式的简单hook
export const useIsRoleSwapMode = () => {
  const context = useContext(RoleSwapContext)
  return context?.state.isActive ?? false
}
