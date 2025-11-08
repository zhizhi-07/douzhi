/**
 * 群聊设置页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { groupChatManager } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'

const GroupChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [groupName, setGroupName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [members, setMembers] = useState<Array<{id: string, name: string, avatar: string}>>([])

  useEffect(() => {
    if (!id) return
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
      // 加载成员信息
      const memberList = group.memberIds.map(memberId => {
        if (memberId === 'user') {
          return { id: 'user', name: '我', avatar: '' }
        }
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char ? (char.nickname || char.realName) : '成员',
          avatar: char?.avatar || ''
        }
      })
      setMembers(memberList)
    }
  }, [id])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">群聊设置</h1>
          <div className="w-5" />
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 成员列表 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">群成员 {members.length}人</div>
          <div className="grid grid-cols-5 gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 mb-1" />
                <div className="text-xs text-gray-600 truncate w-full text-center">
                  {member.name}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center active:scale-95 transition-transform">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div className="text-xs text-gray-400 mt-1">添加</div>
            </div>
          </div>
        </div>

        {/* 群名称 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">群聊名称</span>
            {isEditing ? (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                  if (id) {
                    groupChatManager.updateGroup(id, { name: groupName })
                  }
                }}
                autoFocus
                className="text-sm text-right focus:outline-none"
              />
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-900 active:scale-95 transition-transform"
              >
                {groupName}
              </button>
            )}
          </div>
        </div>

        {/* 群二维码 */}
        <div className="bg-white rounded-2xl p-4">
          <button className="w-full flex items-center justify-between active:scale-[0.98] transition-transform">
            <span className="text-sm text-gray-600">群二维码</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 消息免打扰 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">消息免打扰</span>
            <button className="w-11 h-6 bg-gray-200 rounded-full relative active:scale-95 transition-all">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
            </button>
          </div>
        </div>

        {/* 置顶聊天 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">置顶聊天</span>
            <button className="w-11 h-6 bg-gray-200 rounded-full relative active:scale-95 transition-all">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
            </button>
          </div>
        </div>

        {/* 清空聊天记录 */}
        <div className="bg-white rounded-2xl p-4">
          <button 
            onClick={() => {
              if (id && confirm('确定要清空聊天记录吗？')) {
                groupChatManager.clearMessages(id)
                alert('已清空')
              }
            }}
            className="w-full text-sm text-gray-600 text-left active:scale-[0.98] transition-transform"
          >
            清空聊天记录
          </button>
        </div>

        {/* 退出群聊 */}
        <div className="bg-white rounded-2xl p-4">
          <button 
            onClick={() => {
              if (id && confirm('确定要退出群聊吗？')) {
                groupChatManager.deleteGroup(id)
                navigate('/wechat', { replace: true })
              }
            }}
            className="w-full text-sm text-red-500 text-left active:scale-[0.98] transition-transform"
          >
            退出群聊
          </button>
        </div>

      </div>
    </div>
  )
}

export default GroupChatSettings
