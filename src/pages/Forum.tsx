import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ForumLayout from '../components/ForumLayout'
import { loadPosts, loadTopics } from '../utils/forumManager'
import { getAllCharacters } from '../utils/characterManager'
import type { ForumPost, ForumTopic } from '../types/forum'
import type { Character } from '../services/characterService'

const Forum = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    setPosts(loadPosts())
    setTopics(loadTopics())
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
  }

  // 渲染帖子卡片
  const renderPostCard = (post: ForumPost) => (
    <div
      key={post.id}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="py-4 cursor-pointer active:opacity-70 transition-opacity border-b border-gray-100"
    >
      {/* 用户信息 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{post.author}</span>
            {post.isHighlight && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">精华</span>
            )}
            {post.isHot && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">热门</span>
            )}
          </div>
          <div className="text-xs text-gray-400">{post.time}</div>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-sm font-medium text-gray-800 mb-2">
        {post.title}
      </h3>

      {/* 内容预览 */}
      {post.content && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {post.content.split('\n')[0]}...
        </p>
      )}

      {/* 图片 */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {post.images.slice(0, 3).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 互动统计 */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{post.views} 浏览</span>
        <span>{post.replies} 回复</span>
        <span>{post.likes} 点赞</span>
      </div>
    </div>
  )

  return (
    <ForumLayout>
      <div className="pb-20">
        {/* 角色故事栏 - Instagram风格 */}
        {characters.length > 0 && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4">
                {/* 添加自己的故事 */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="relative w-16 h-16 cursor-pointer"
                    onClick={() => navigate('/forum/profile')}
                  >
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">+</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">我的</span>
                </div>
                
                {/* 角色列表 */}
                {characters.map((character) => (
                  <div 
                    key={character.id}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    onClick={() => navigate(`/forum/character/${character.id}`)}
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-white p-0.5">
                          <img
                            src={character.avatar || '/default-avatar.png'}
                            alt={character.realName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      {/* 在线状态点 */}
                      {character.currentActivity && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-700 max-w-16 truncate">
                      {character.nickname || character.realName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* 热门话题 */}
          <div className="py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">热门话题</h2>
              <button className="text-xs text-gray-400">更多</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="px-3 py-1.5 rounded-full bg-gray-50 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  #{topic.name}
                </div>
              ))}
            </div>
          </div>

          {/* 帖子列表 */}
          <div>
            {posts.map(renderPostCard)}
          </div>
        </div>
      </div>
    </ForumLayout>
  )
}

export default Forum
