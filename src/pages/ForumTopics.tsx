import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ForumLayout from '../components/ForumLayout'
import { loadTopics, followTopic, unfollowTopic, loadFollows, saveTopics, getTopicPosts } from '../utils/forumManager'
import { generateTopicPosts, generateMockTopicContent } from '../utils/forumAIEcosystem'
import type { ForumTopic } from '../types/forum'

const ForumTopics = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [follows, setFollows] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState('')

  useEffect(() => {
    setTopics(loadTopics())
    setFollows(loadFollows())
  }, [])

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return
    
    setGenerating(true)
    setGeneratingProgress('创建话题中...')
    
    try {
      // 创建话题
      const newTopic: ForumTopic = {
        id: Date.now().toString(),
        name: newTopicName.trim(),
        description: newTopicDescription.trim() || undefined,
        postCount: 0,
        createdAt: Date.now()
      }
      
      const currentTopics = loadTopics()
      currentTopics.push(newTopic)
      saveTopics(currentTopics)
      
      setTopics(currentTopics)
      
      // 如果启用AI，生成生态内容
      if (useAI) {
        setGeneratingProgress('AI角色正在讨论中...')
        
        try {
          await generateTopicPosts(newTopic)
          setGeneratingProgress('生态系统创建完成！')
        } catch (error) {
          console.error('AI生成失败，使用模拟数据:', error)
          setGeneratingProgress('使用模拟数据生成...')
          generateMockTopicContent(newTopic)
        }
        
        // 更新话题帖子数
        const updatedTopics = loadTopics()
        const topicIndex = updatedTopics.findIndex(t => t.id === newTopic.id)
        if (topicIndex >= 0) {
          const posts = getTopicPosts(newTopic.name)
          updatedTopics[topicIndex].postCount = posts.length
          saveTopics(updatedTopics)
          setTopics(updatedTopics)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // 关闭对话框并重置
      setShowCreateDialog(false)
      setNewTopicName('')
      setNewTopicDescription('')
      setGeneratingProgress('')
      
    } catch (error) {
      console.error('创建话题失败:', error)
      alert('创建失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleFollow = (topicName: string) => {
    if (follows.includes(topicName)) {
      unfollowTopic(topicName)
    } else {
      followTopic(topicName)
    }
    setFollows(loadFollows())
  }

  return (
    <ForumLayout>
      {/* 顶部标题栏和创建按钮 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">话题</h1>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="pb-20">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white border-b border-gray-100"
          >
            <div className="flex items-center gap-4 px-4 py-4">
              {/* 话题图标 */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">#</span>
              </div>
              
              {/* 话题信息 */}
              <div
                onClick={() => navigate(`/forum/topic/${encodeURIComponent(topic.name)}`)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">{topic.name}</h3>
                  {topic.hot && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full">热门</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{topic.postCount.toLocaleString()} 条帖子</p>
              </div>
              
              {/* 右箭头 */}
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
        
        {topics.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-3xl">#</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">还没有话题</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="text-sm text-blue-500 font-semibold"
            >
              创建第一个话题
            </button>
          </div>
        )}
      </div>

      {/* 创建话题对话框 */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-800 mb-4">创建话题</h2>
            
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="话题名称（必填）"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
              autoFocus
              disabled={generating}
            />
            
            <textarea
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              placeholder="话题描述（可选，建议填写以获得更好的AI生成效果）"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3 resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                minHeight: '80px'
              }}
              disabled={generating}
            />
            
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="w-4 h-4 rounded"
                disabled={generating}
              />
              <span className="text-sm text-gray-700">使用AI生成讨论内容（推荐）</span>
            </label>
            
            {generating && (
              <div className="mb-4 text-center">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full mb-2"></div>
                <p className="text-xs text-gray-600">{generatingProgress}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateDialog(false)
                  setNewTopicName('')
                  setNewTopicDescription('')
                }}
                disabled={generating}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 disabled:opacity-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={generating || !newTopicName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                {generating ? '生成中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ForumLayout>
  )
}

export default ForumTopics
