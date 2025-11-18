import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import AIPhoneModal from '../components/AIPhoneModal'
import { useCharacter } from '../context/ContactsContext'
import { getPhoneHistory, PhoneHistory } from '../utils/aiPhoneGenerator'
import { backgroundGenerator, BackgroundTask } from '../utils/backgroundPhoneGenerator'

const AIPhoneSelect = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const [selectedHistory, setSelectedHistory] = useState<PhoneHistory | null>(null)
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null)
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([])
  const [refreshKey, setRefreshKey] = useState(0) // 用于强制刷新

  // 页面加载时刷新一次，确保显示历史记录，并自动展开第一个有历史的角色
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
    
    // 自动展开第一个有历史记录的角色
    if (characters.length > 0) {
      const firstCharacterWithHistory = characters.find((char: any) => {
        const history = getPhoneHistory(char.id)
        return history.length > 0
      })
      
      if (firstCharacterWithHistory) {
        setExpandedCharacterId(firstCharacterWithHistory.id)
      }
    }
  }, [characters])

  // 监听后台任务
  useEffect(() => {
    const unsubscribe = backgroundGenerator.subscribe((tasks) => {
      setBackgroundTasks(tasks)
      // 当任务完成时，刷新历史记录列表
      if (tasks.some(t => t.status === 'completed')) {
        setRefreshKey(prev => prev + 1)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // 点击角色 - 开始后台生成
  const handleCharacterSelect = (character: { id: string; name: string }) => {
    backgroundGenerator.startGeneration(character.id, character.name)
  }

  // 点击历史记录 - 查看已保存的
  const handleHistorySelect = (history: PhoneHistory) => {
    setSelectedHistory(history)
  }

  // 展开/收起历史记录
  const toggleExpand = (characterId: string) => {
    setExpandedCharacterId(expandedCharacterId === characterId ? null : characterId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <BackIcon size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">选择角色</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 角色列表 */}
      <div className="p-4 space-y-3">
        {characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-2">暂无角色</div>
            <div className="text-sm text-gray-300">请先在微信中添加AI角色</div>
          </div>
        ) : (
          characters.map((character: any) => {
            const history = getPhoneHistory(character.id)
            const isExpanded = expandedCharacterId === character.id
            
            return (
              <div key={`${character.id}-${refreshKey}`} className="space-y-2">
                {/* 角色主卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => handleCharacterSelect(character)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-all ios-button"
                  >
                    {/* 头像 */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center flex-shrink-0">
                      {character.avatar ? (
                        <img 
                          src={character.avatar} 
                          alt={character.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">{character.name[0]}</span>
                      )}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 text-left">
                      <div className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        {character.name}
                        {history.length > 0 && !isExpanded && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                            {history.length}条记录
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-green-600 mt-1">生成新内容</div>
                    </div>
                    
                    {/* 箭头 */}
                    <div className="text-gray-300">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* 历史记录按钮 */}
                  {history.length > 0 && (
                    <button
                      onClick={() => toggleExpand(character.id)}
                      className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-600">
                        历史记录 ({history.length})
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 历史记录列表 */}
                {isExpanded && history.length > 0 && (
                  <div className="ml-4 space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleHistorySelect(item)}
                        className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 hover:bg-gray-100 transition-all flex items-center gap-3 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-300/30 to-gray-400/30 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12" y2="18"></line>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(item.timestamp).toLocaleString('zh-CN', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            点击查看此次记录
                          </div>
                        </div>
                        <div className="text-gray-300">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 后台生成提示 */}
      {backgroundTasks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {backgroundTasks.map((task) => (
            <div
              key={task.characterId}
              className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md ${
                task.status === 'generating'
                  ? 'bg-blue-50/90 border-blue-200'
                  : task.status === 'completed'
                  ? 'bg-green-50/90 border-green-200'
                  : 'bg-red-50/90 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.status === 'generating' && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                )}
                {task.status === 'completed' && (
                  <div className="text-green-500">✓</div>
                )}
                {task.status === 'failed' && (
                  <div className="text-red-500">✕</div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {task.characterName}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {task.status === 'generating' && '正在后台生成手机内容...'}
                    {task.status === 'completed' && '生成完成！'}
                    {task.status === 'failed' && '生成失败'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 手机弹窗 - 查看历史记录 */}
      {selectedHistory && (
        <AIPhoneModal
          characterId={selectedHistory.characterId}
          characterName={selectedHistory.characterName}
          onClose={() => setSelectedHistory(null)}
          forceNew={false}
          historyContent={selectedHistory.content}
        />
      )}
    </div>
  )
}

export default AIPhoneSelect
