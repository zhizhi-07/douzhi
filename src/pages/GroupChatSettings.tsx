/**
 * 群聊设置页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { groupChatManager } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
import { formatSummaryForDisplay } from '../utils/groupChatSummary'
import { lorebookManager } from '../utils/lorebookSystem'
import BubbleSettings from './ChatSettings/BubbleSettings'

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
  const [smartSummaryEnabled, setSmartSummaryEnabled] = useState(false)
  const [smartSummaryInterval, setSmartSummaryInterval] = useState(10)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [minReplyCount, setMinReplyCount] = useState(15)
  const [selectedLorebookId, setSelectedLorebookId] = useState<string | undefined>(undefined)
  const [availableLorebooks, setAvailableLorebooks] = useState<Array<{id: string, name: string}>>([])
  const [enableTheatreCards, setEnableTheatreCards] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<Array<{id: string, name: string, avatar: string}>>([])

  useEffect(() => {
    if (!id) return
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
      setAnnouncement(group.announcement || '')
      setSmartSummaryEnabled(group.smartSummary?.enabled || false)
      setSmartSummaryInterval(group.smartSummary?.triggerInterval || 10)
      setMinReplyCount(group.minReplyCount || 15)
      setSelectedLorebookId(group.lorebookId)
      setEnableTheatreCards(group.enableTheatreCards ?? false)
      
      // 加载世界书列表
      const lorebooks = lorebookManager.getAllLorebooks()
      setAvailableLorebooks(lorebooks.map(lb => ({ id: lb.id, name: lb.name })))
      
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
    <div className="h-screen flex flex-col bg-gray-50 soft-page-enter">
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
      `}</style>
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
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
              <button 
                onClick={() => {
                  // 获取所有角色，排除已在群里的
                  const allChars = characterService.getAll()
                  const memberIds = members.map(m => m.id)
                  const available = allChars
                    .filter(c => !memberIds.includes(c.id))
                    .map(c => ({ id: c.id, name: c.nickname || c.realName, avatar: c.avatar || '' }))
                  setAvailableCharacters(available)
                  setShowAddMemberModal(true)
                }}
                className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div className="text-xs text-gray-400 mt-1">添加</div>
            </div>
          </div>
        </div>

        {/* 群名称 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm text-gray-500 mb-3">成员权限</div>
          <div className="space-y-2">
            {members.map((member) => {
              const group = groupChatManager.getGroup(id || '')
              const memberDetail = group?.members?.find(m => m.id === member.id)
              const isOwner = memberDetail?.role === 'owner'
              const isAdmin = memberDetail?.role === 'admin'
              const currentUserRole = group?.members?.find(m => m.id === 'user')?.role
              const currentUserIsOwner = currentUserRole === 'owner'
              const currentUserIsAdmin = currentUserRole === 'admin'
              
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
                    {/* 所有成员都可以打开“管理”弹窗，用于修改头衔；具体权限在弹窗内部控制 */}
                    {member.id !== 'user' && (
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

        {/* AI记忆增强提示 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm mb-4">
          <div className="text-sm text-gray-500 mb-2">💡 私信同步</div>
          <p className="text-xs text-gray-500 leading-relaxed">
            群聊AI是否能看到成员的私信内容，由每个角色自己的聊天设置中的"群聊同步"开关控制。
            <br />
            开启后，该角色的私信消息会同步到群聊AI，让群聊对话更连贯。
          </p>
        </div>

        {/* 中插HTML小剧场 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">中插HTML小剧场</div>
              <div className="text-xs text-gray-400">开启后每条回复都会插入HTML卡片（便利贴、聊天截图、账单等）</div>
            </div>
            <button
              onClick={() => {
                if (!id) return
                const newValue = !enableTheatreCards
                setEnableTheatreCards(newValue)
                groupChatManager.updateGroup(id, {
                  enableTheatreCards: newValue
                })
              }}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: enableTheatreCards ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  enableTheatreCards ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
        </div>

        {/* 智能总结 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
              className={`relative w-11 h-6 rounded-full transition-all ${
                smartSummaryEnabled 
                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                  : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
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
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
                  style={{
                    background: `linear-gradient(to right, #64748b 0%, #64748b ${((smartSummaryInterval - 5) / 25) * 100}%, #e2e8f0 ${((smartSummaryInterval - 5) / 25) * 100}%, #e2e8f0 100%)`
                  }}
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

        {/* AI回复条数设置 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">AI回复条数</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  设置每次AI回复的最少消息条数
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">每次至少{minReplyCount}条</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={minReplyCount}
              onChange={(e) => {
                const newCount = parseInt(e.target.value)
                setMinReplyCount(newCount)
                if (id) {
                  groupChatManager.updateGroup(id, {
                    minReplyCount: newCount
                  })
                }
              }}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
              style={{
                background: `linear-gradient(to right, #64748b 0%, #64748b ${((minReplyCount - 5) / 45) * 100}%, #e2e8f0 ${((minReplyCount - 5) / 45) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5条</span>
              <span>50条</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            💡 提示：设置较大值会增加一次对话API消耗，但能获得更丰富的群聊体验
          </p>
        </div>

        {/* 挂载世界书 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">挂载世界书</p>
            <p className="text-xs text-gray-500 mt-0.5">
              为群聊挂载全局世界书，AI会根据关键词自动读取相关设定
            </p>
          </div>
          <select
            value={selectedLorebookId || ''}
            onChange={(e) => {
              const newId = e.target.value || undefined
              setSelectedLorebookId(newId)
              if (id) {
                groupChatManager.updateGroup(id, { lorebookId: newId })
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
          >
            <option value="">不挂载世界书</option>
            {availableLorebooks.map(lb => (
              <option key={lb.id} value={lb.id}>{lb.name}</option>
            ))}
          </select>
          {availableLorebooks.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              暂无可用的世界书，请先在世界书管理中创建
            </p>
          )}
        </div>

        {/* 气泡设置 */}
        {id && (
          <BubbleSettings 
            chatId={id} 
            onSaved={() => {
              // 设置已保存
            }} 
          />
        )}

        {/* 置顶聊天 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">置顶聊天</span>
            <button className="relative w-11 h-6 rounded-full bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] active:scale-95 transition-all">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 glass-card rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]" />
            </button>
          </div>
        </div>

        {/* 清空聊天记录 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
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
            <div className="glass-card rounded-2xl p-5 max-w-sm w-full shadow-2xl">
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

              {/* 管理员设置（只有群主可以设置/取消管理员） */}
              {managingMember.role !== 'owner' && id && (() => {
                const group = groupChatManager.getGroup(id)
                const currentUserRole = group?.members?.find(m => m.id === 'user')?.role
                const currentUserIsOwner = currentUserRole === 'owner'
                return currentUserIsOwner
              })() && (
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
                      className={`relative w-11 h-6 rounded-full transition-all ${
                        managingMember.role === 'admin' 
                          ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                          : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                          managingMember.role === 'admin' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 移出群聊（群主和管理员都可以踢人） */}
              {managingMember.role !== 'owner' && id && (() => {
                const group = groupChatManager.getGroup(id)
                const currentUserRole = group?.members?.find(m => m.id === 'user')?.role
                return currentUserRole === 'owner' || currentUserRole === 'admin'
              })() && (
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

              {/* 转让群主（仅当前群主可见，且不能对自己显示） */}
              {id && managingMember.role !== 'owner' && (() => {
                const group = groupChatManager.getGroup(id)
                const currentUserRole = group?.members?.find(m => m.id === 'user')?.role
                return currentUserRole === 'owner'
              })() && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      if (id && confirm(`确定将群主转让给 ${managingMember.name} 吗？`)) {
                        groupChatManager.transferOwner(id, managingMember.id, '你')
                        alert('已转让群主')
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
                    className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                  >
                    转让群主
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
            <div className="glass-card rounded-t-3xl p-6 shadow-2xl">
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
            <div className="glass-card rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
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

      {/* 添加成员模态框 */}
      {showAddMemberModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddMemberModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-5 max-w-sm w-full shadow-2xl max-h-[70vh] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                添加群成员
              </h3>
              
              {availableCharacters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  没有可添加的角色了
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {availableCharacters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        if (id) {
                          groupChatManager.addMember(id, char.id)
                          // 更新成员列表
                          const group = groupChatManager.getGroup(id)
                          if (group) {
                            const memberList = group.memberIds.map(memberId => {
                              if (memberId === 'user') {
                                return { id: 'user', name: '我', avatar: '' }
                              }
                              const c = characterService.getById(memberId)
                              return {
                                id: memberId,
                                name: c ? (c.nickname || c.realName) : '成员',
                                avatar: c?.avatar || ''
                              }
                            })
                            setMembers(memberList)
                          }
                          setShowAddMemberModal(false)
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                        {char.avatar ? (
                          <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {char.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{char.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-full mt-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GroupChatSettings
