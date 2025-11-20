import { useState, useEffect } from 'react'
import { TrendingUp, Hash } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'

interface Topic {
  id: string
  name: string
  posts: number
  trending: boolean
  category: string
}

const InstagramSearch = () => {
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = () => {
    // 模拟话题数据
    const mockTopics: Topic[] = [
      { id: '1', name: '日常生活', posts: 1234, trending: true, category: '推荐' },
      { id: '2', name: '美食分享', posts: 2567, trending: true, category: '推荐' },
      { id: '3', name: '旅行vlog', posts: 3456, trending: false, category: '推荐' },
      { id: '4', name: '摄影', posts: 4321, trending: true, category: '推荐' },
      { id: '5', name: '健身打卡', posts: 1890, trending: false, category: '生活' },
      { id: '6', name: '读书笔记', posts: 2234, trending: false, category: '生活' },
      { id: '7', name: '穿搭分享', posts: 3567, trending: true, category: '时尚' },
      { id: '8', name: '数码测评', posts: 1567, trending: false, category: '科技' },
      { id: '9', name: '游戏推荐', posts: 2890, trending: true, category: '娱乐' },
      { id: '10', name: '宠物日常', posts: 4567, trending: true, category: '生活' },
      { id: '11', name: '电影推荐', posts: 2345, trending: false, category: '娱乐' },
      { id: '12', name: '音乐分享', posts: 1678, trending: false, category: '娱乐' },
    ]
    setTopics(mockTopics)
  }

  return (
    <InstagramLayout showHeader={false}>
      {/* 话题标题 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">话题</h1>
        </div>
      </div>

      {/* 话题列表 */}
      <div className="pb-20">
        <div className="divide-y divide-gray-100">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => {
                // TODO: 跳转到话题详情页
                console.log('查看话题:', topic.name)
              }}
              className="px-4 py-4 active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-6 h-6 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {topic.name}
                    </h3>
                    {topic.trending && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-full">
                        <TrendingUp className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-500">热门</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {topic.posts.toLocaleString()} 条帖子
                  </p>
                </div>
                
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
        
        {topics.length === 0 && (
          <div className="py-20 text-center text-gray-400 text-sm">
            暂无话题
          </div>
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramSearch
