/**
 * 情侣空间 - 留言板
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCoupleMessages, 
  addCoupleMessage, 
  deleteCoupleMessage,
  type CoupleMessage 
} from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'

const CoupleMessageBoard = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<CoupleMessage[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [messageContent, setMessageContent] = useState('')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = () => {
    const all = getCoupleMessages()
    setMessages(all)
  }

  const handleAdd = () => {
    if (!messageContent.trim()) {
      alert('请输入留言内容')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    addCoupleMessage(
      relation.characterId,
      '我',
      messageContent.trim()
    )

    setMessageContent('')
    setShowAddModal(false)
    loadMessages()
    alert('留言已发布！')
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条留言吗？')) {
      deleteCoupleMessage(id)
      loadMessages()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">留言板</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-blue-500 font-medium"
          >
            写留言
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        {messages.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl p-8 text-center space-y-6 shadow-xl">
                <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无留言</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    点击右上角写留言按钮
                    <br />
                    留下你想对TA说的话
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 留言列表 */
          <div className="space-y-4 pb-6">
            {messages.map(message => {
              const time = new Date(message.timestamp)
              const dateStr = time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
              const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div key={message.id} className="bg-white rounded-2xl p-5 shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                        {message.characterName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {message.characterName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dateStr} {timeStr}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 写留言弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">写留言</h3>
            
            <div className="mb-6">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="写下你想说的话..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm"
                rows={6}
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-full bg-gray-200 text-gray-900 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-3 rounded-full bg-blue-500 text-white font-medium"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoupleMessageBoard
