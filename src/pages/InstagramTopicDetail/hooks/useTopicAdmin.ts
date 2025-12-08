import { useState, useEffect } from 'react'
import type { TopicAdmin, SimpleCharacter } from './types'

interface UseTopicAdminProps {
  decodedName: string
  isOwner: boolean
}

export function useTopicAdmin({ decodedName, isOwner }: UseTopicAdminProps) {
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<SimpleCharacter[]>([])
  const [topicAdmins, setTopicAdmins] = useState<TopicAdmin[]>([])

  // 加载角色列表和管理员
  useEffect(() => {
    const loadData = async () => {
      // 加载角色
      try {
        const { getAllCharacters } = await import('../../../utils/characterManager')
        const chars = await getAllCharacters()
        setAvailableCharacters(chars.map(c => ({ 
          id: c.id, 
          realName: c.realName, 
          avatar: c.avatar 
        })))
      } catch (e) {
        console.error('加载角色失败:', e)
      }
      
      // 加载已添加的管理员
      try {
        const adminKey = `topic_admins_${decodedName}`
        const stored = localStorage.getItem(adminKey)
        if (stored) {
          setTopicAdmins(JSON.parse(stored))
        }
      } catch (e) {
        console.error('加载管理员失败:', e)
      }
    }
    if (isOwner) loadData()
  }, [decodedName, isOwner])

  // 添加管理员
  const handleAddAdmin = (char: SimpleCharacter) => {
    if (topicAdmins.some(a => a.id === char.id)) return
    
    const newAdmin: TopicAdmin = {
      id: char.id,
      name: char.realName,
      avatar: char.avatar,
      role: '管理员'
    }
    const newAdmins = [...topicAdmins, newAdmin]
    setTopicAdmins(newAdmins)
    
    const adminKey = `topic_admins_${decodedName}`
    localStorage.setItem(adminKey, JSON.stringify(newAdmins))
    
    setShowAddAdmin(false)
  }

  // 移除管理员
  const handleRemoveAdmin = (adminId: string) => {
    const newAdmins = topicAdmins.filter(a => a.id !== adminId)
    setTopicAdmins(newAdmins)
    
    const adminKey = `topic_admins_${decodedName}`
    localStorage.setItem(adminKey, JSON.stringify(newAdmins))
  }

  return {
    showAddAdmin,
    setShowAddAdmin,
    availableCharacters,
    topicAdmins,
    handleAddAdmin,
    handleRemoveAdmin
  }
}
