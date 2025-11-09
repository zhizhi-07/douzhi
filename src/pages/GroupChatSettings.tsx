/**
 * 群聊设置页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { groupChatManager } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
import { formatSummaryForDisplay } from '../utils/groupChatSummary'

const GroupChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [groupName, setGroupName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [members, setMembers] = useState<Array<{id: string, name: string, avatar: string}>>([])  
  const [announcement, setAnnouncement] = useState('')
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [tempAnnouncement, setTempAnnouncement] = useState('')
  const [managingMember, setManagingMember] = useState<{id: string, name: string, role: string, title?: string} | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [privateChatSyncEnabled, setPrivateChatSyncEnabled] = useState(false)
  const [privateChatSyncCount, setPrivateChatSyncCount] = useState(10)
  const [smartSummaryEnabled, setSmartSummaryEnabled] = useState(false)
  const [smartSummaryInterval, setSmartSummaryInterval] = useState(10)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  useEffect(() => {
    if (!id) return
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
      setAnnouncement(group.announcement || '')
      setPrivateChatSyncEnabled(group.privateChatSync?.enabled || false)
      setPrivateChatSyncCount(group.privateChatSync?.messageCount || 10)
      setSmartSummaryEnabled(group.smartSummary?.enabled || false)
      setSmartSummaryInterval(group.smartSummary?.triggerInterval || 10)
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
                <div className="w-12 h-12 rounded-lg bg-gray-200 mb-1 overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
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

        {/* 群公告 */}
        <div className="bg-white rounded-2xl p-4">
          <button 
            onClick={() => {
              setTempAnnouncement(announcement)
              setShowAnnouncementModal(true)
            }}
            className="w-full flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <span className="text-sm text-gray-600">群公告</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 max-w-[200px] truncate">
                {announcement || '未设置'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* 成员权限管理 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">成员权限</div>
          <div className="space-y-2">
            {members.map((member) => {
              const group = groupChatManager.getGroup(id || '')
              const memberDetail = group?.members?.find(m => m.id === member.id)
              const isOwner = memberDetail?.role === 'owner'
              const isAdmin = memberDetail?.role === 'admin'
              const currentUserIsOwner = group?.owner === 'user'
              
              return (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                        {isOwner && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded">群主</span>
                        )}
                        {!isOwner && isAdmin && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded">管理员</span>
                        )}
                        {memberDetail?.title && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded">{memberDetail.title}</span>
                        )}
                      </div>
                    </div>
                    {member.id !== 'user' && currentUserIsOwner && (
                      <button
                        onClick={() => {
                          setManagingMember({
                            id: member.id,
                            name: member.name,
                            role: memberDetail?.role || 'member',
                            title: memberDetail?.title
                          })
                          setNewTitle(memberDetail?.title || '')
                        }}
                        className="px-2 py-1 text-xs text-gray-900 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        管理
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 私聊同步 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">AI记忆增强</div>
          
          {/* 同步开关 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">同步私信</p>
              <p className="text-xs text-gray-500 mt-0.5">让AI了解成员与你的私聊内容</p>
            </div>
            <button
              onClick={() => {
                const newEnabled = !privateChatSyncEnabled
                setPrivateChatSyncEnabled(newEnabled)
                if (id) {
                  groupChatManager.updateGroup(id, {
                    privateChatSync: {
                      enabled: newEnabled,
                      messageCount: privateChatSyncCount
                    }
                  })
                }
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                privateChatSyncEnabled ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  privateChatSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 同步条数滑块 */}
          {privateChatSyncEnabled && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">同步消息条数</span>
                <span className="text-xs font-medium text-gray-900">{privateChatSyncCount}条</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={privateChatSyncCount}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value)
                  setPrivateChatSyncCount(newCount)
                  if (id) {
                    groupChatManager.updateGroup(id, {
                      privateChatSync: {
                        enabled: privateChatSyncEnabled,
                        messageCount: newCount
                      }
                    })
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5条</span>
                <span>50条</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                AI将读取每个成员与你的最近{privateChatSyncCount}条私信对话
              </p>
            </div>
          )}
        </div>

        {/* 智能总结 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">双AI架构</div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">智能总结</p>
              <p className="text-xs text-gray-500 mt-0.5">
                使用便宜AI生成总结表格，提升主AI理解力
              </p>
            </div>
            <button
              onClick={() => {
                const newEnabled = !smartSummaryEnabled
                setSmartSummaryEnabled(newEnabled)
                if (id) {
                  const group = groupChatManager.getGroup(id)
                  groupChatManager.updateGroup(id, {
                    smartSummary: {
                      ...group?.smartSummary,
                      enabled: newEnabled,
                      triggerInterval: smartSummaryInterval
                    }
                  })
                }
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                smartSummaryEnabled ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  smartSummaryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {smartSummaryEnabled && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {/* 触发间隔滑块 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">总结触发间隔</span>
                  <span className="text-xs font-medium text-gray-900">每{smartSummaryInterval}轮对话</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={smartSummaryInterval}
                  onChange={(e) => {
                    const newInterval = parseInt(e.target.value)
                    setSmartSummaryInterval(newInterval)
                    if (id) {
                      const group = groupChatManager.getGroup(id)
                      groupChatManager.updateGroup(id, {
                        smartSummary: {
                          ...group?.smartSummary,
                          enabled: smartSummaryEnabled,
                          triggerInterval: newInterval
                        }
                      })
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5轮</span>
                  <span>30轮</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                第一次：正常对话 → 后台生成总结
              </p>
              <p className="text-xs text-gray-500 mt-1">
                之后：每{smartSummaryInterval}轮对话基于总结创作
              </p>
              <p className="text-xs text-gray-500 mt-2">
                推荐在API设置中配置副API（便宜模型）用于总结
              </p>
              
              {/* 查看总结按钮 */}
              {id && groupChatManager.getGroup(id)?.smartSummary?.lastSummary && (
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="w-full mt-3 py-2 bg-gray-100 text-gray-900 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  查看最新总结
                </button>
              )}
            </div>
          )}
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

      {/* 成员管理弹窗 */}
      {managingMember && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setManagingMember(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                管理 {managingMember.name}
              </h3>
              
              {/* 头衔设置 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  设置头衔
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="输入头衔（留空则删除）"
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">{newTitle.length}/10</p>
              </div>

              {/* 管理员设置 */}
              {managingMember.role !== 'owner' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">设为管理员</p>
                      <p className="text-xs text-gray-500 mt-0.5">管理员可以管理普通成员</p>
                    </div>
                    <button
                      onClick={() => {
                        if (id) {
                          const isAdmin = managingMember.role === 'admin'
                          groupChatManager.setAdmin(id, managingMember.id, !isAdmin, '你')
                          // 更新状态
                          setManagingMember({ ...managingMember, role: isAdmin ? 'member' : 'admin' })
                        }
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        managingMember.role === 'admin' ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          managingMember.role === 'admin' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 移出群聊 */}
              {managingMember.role !== 'owner' && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      if (id && confirm(`确认将 ${managingMember.name} 移出群聊吗？`)) {
                        groupChatManager.removeMember(id, managingMember.id, true, '你')
                        setManagingMember(null)
                        // 刷新成员列表
                        const group = groupChatManager.getGroup(id)
                        if (group) {
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
                      }
                    }}
                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                  >
                    移出群聊
                  </button>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setManagingMember(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (id && managingMember) {
                      groupChatManager.setTitle(id, managingMember.id, newTitle, '你')
                      alert('设置成功')
                      setManagingMember(null)
                      // 刷新成员列表
                      const group = groupChatManager.getGroup(id)
                      if (group) {
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
                    }
                  }}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 群公告编辑弹窗 */}
      {showAnnouncementModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAnnouncementModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">群公告</h2>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-gray-500"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={tempAnnouncement}
                onChange={(e) => setTempAnnouncement(e.target.value)}
                placeholder="输入群公告内容..."
                className="w-full h-40 px-3 py-2 bg-gray-100 rounded-lg focus:outline-none resize-none text-sm"
              />

              <button
                onClick={() => {
                  if (id) {
                    groupChatManager.updateAnnouncement(id, tempAnnouncement, '你')
                    setAnnouncement(tempAnnouncement)
                  }
                  setShowAnnouncementModal(false)
                }}
                className="w-full mt-4 py-3 bg-gray-900 text-white rounded-lg font-medium active:scale-95 transition-all"
              >
                确定
              </button>
            </div>
          </div>
        </>
      )}

      {/* 查看总结模态框 */}
      {showSummaryModal && id && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowSummaryModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">群聊总结</h3>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {(() => {
                  const group = groupChatManager.getGroup(id)
                  const summaryStr = group?.smartSummary?.lastSummary
                  if (!summaryStr) return '暂无总结'
                  
                  try {
                    const summary = JSON.parse(summaryStr)
                    return formatSummaryForDisplay(summary)
                  } catch (error) {
                    return '总结格式错误'
                  }
                })()}
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-gray-400">
                最后更新: {(() => {
                  const group = groupChatManager.getGroup(id)
                  const time = group?.smartSummary?.lastSummaryTime
                  if (!time) return '未知'
                  return new Date(time).toLocaleString('zh-CN')
                })()}
              </div>

              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GroupChatSettings
