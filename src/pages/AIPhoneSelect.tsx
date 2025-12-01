import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import AIPhoneModal from '../components/AIPhoneModal'
import { getPhoneHistory, PhoneHistory } from '../utils/aiPhoneGenerator'
import { backgroundGenerator, BackgroundTask } from '../utils/backgroundPhoneGenerator'
import { characterService } from '../services/characterService'

const AIPhoneSelect = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<any[]>([])
  const [selectedHistory, setSelectedHistory] = useState<PhoneHistory | null>(null)
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null)
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // 🔥 页面加载时加载角色数据，使用 characterService 保持与微信一致
  useEffect(() => {
    const loadCharacters = () => {
      try {
        // 🔥 使用 characterService，与微信聊天列表保持一致
        const latestCharacters = characterService.getAll()

        // 🔥 过滤掉无效的角色数据（兼容旧数据）
        const validCharacters = latestCharacters.filter((char: any) => {
          return char && typeof char === 'object' && char.id && (char.name || char.realName)
        })

        setCharacters(validCharacters)
        setRefreshKey(prev => prev + 1)

        // 自动展开第一个有历史记录的角色
        if (validCharacters.length > 0) {
          try {
            const firstCharacterWithHistory = validCharacters.find((char: any) => {
              try {
                const history = getPhoneHistory(char.id)
                return history && history.length > 0
              } catch (e) {
                console.warn(`获取角色 ${char.id} 历史记录失败:`, e)
                return false
              }
            })

            if (firstCharacterWithHistory) {
              setExpandedCharacterId(firstCharacterWithHistory.id)
            }
          } catch (e) {
            console.warn('展开历史记录失败:', e)
          }
        }
      } catch (error) {
        console.error('加载角色失败:', error)
      }
    }

    // 🔥 等待 characterService 的异步加载完成
    const timer = setTimeout(() => {
      loadCharacters()
      setIsLoading(false)
    }, 500) // 等待 500ms 让 characterService 从 IndexedDB 加载

    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen font-serif bg-transparent">
      {/* 状态栏和导航栏容器 - Glassmorphism Header */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <StatusBar />

        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-all shadow-sm border border-white/40"
          >
            <BackIcon size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-medium text-gray-900 tracking-wide">选择角色</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 🔥 加载状态 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-white/50 border-t-gray-600 rounded-full mb-4"></div>
          <div className="text-gray-600 font-medium">加载角色数据中...</div>
        </div>
      ) : (
        /* 角色列表 */
        <div className="p-4 space-y-4">
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-600 text-lg mb-2">暂无角色</div>
              <div className="text-sm text-gray-500">请先在微信中添加AI角色</div>
            </div>
          ) : (
            characters.map((character: any) => {
              // 🔥 安全获取历史记录，避免旧数据导致崩溃
              let history: PhoneHistory[] = []
              try {
                history = getPhoneHistory(character.id) || []
              } catch (e) {
                console.warn(`获取角色 ${character.id} 历史记录失败:`, e)
              }
              const isExpanded = expandedCharacterId === character.id
              // 🔥 获取角色名称，兼容 name 和 realName
              const characterName = character.name || character.realName || '未命名'

              return (
                <div key={`${character.id}-${refreshKey}`} className="space-y-2">
                  {/* 角色主卡片 - Glass Card */}
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm overflow-hidden transition-all hover:bg-white/70 hover:shadow-md">
                    <button
                      onClick={() => handleCharacterSelect({ id: character.id, name: characterName })}
                      className="w-full p-4 flex items-center gap-4 transition-all ios-button"
                    >
                      {/* 头像 */}
                      <div className="w-16 h-16 rounded-full bg-white/50 border border-white/60 shadow-inner flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {character.avatar ? (
                          <img
                            src={character.avatar}
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-gray-500">{characterName[0]}</span>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 text-left">
                        <div className="text-xl font-medium text-gray-900 flex items-center gap-2">
                          {characterName}
                          {history.length > 0 && !isExpanded && (
                            <span className="text-xs px-2 py-0.5 bg-white/50 border border-white/40 text-gray-600 rounded-full backdrop-blur-sm">
                              {history.length}条记录
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 opacity-80">生成新内容</div>
                      </div>

                      {/* 箭头 */}
                      <div className="text-gray-400 opacity-70">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>

                    {/* 历史记录按钮 */}
                    {history.length > 0 && (
                      <button
                        onClick={() => toggleExpand(character.id)}
                        className="w-full px-4 py-3 border-t border-white/30 bg-white/30 flex items-center justify-between hover:bg-white/50 transition-colors"
                      >
                        <span className="text-sm text-gray-700 font-medium">
                          历史记录 ({history.length})
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 历史记录列表 - Simplified Glass List */}
                  {isExpanded && history.length > 0 && (
                    <div className="ml-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleHistorySelect(item)}
                          className="w-full bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30 hover:bg-white/60 transition-all flex items-center gap-3 text-left shadow-sm group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center border border-white/40 group-hover:scale-105 transition-transform">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                              <line x1="12" y1="18" x2="12" y2="18"></line>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-base font-medium text-gray-800">
                              {new Date(item.timestamp).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 opacity-80">
                              点击查看此次记录
                            </div>
                          </div>
                          <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      )}

      {/* 后台生成提示 - Glass Toast */}
      {backgroundTasks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {backgroundTasks.map((task) => (
            <div
              key={task.characterId}
              className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all ${task.status === 'generating'
                ? 'bg-white/80 border-white/50'
                : task.status === 'completed'
                  ? 'bg-green-50/80 border-green-200/50'
                  : 'bg-red-50/80 border-red-200/50'
                }`}
            >
              <div className="flex items-center gap-3">
                {task.status === 'generating' && (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                )}
                {task.status === 'completed' && (
                  <div className="text-green-600 font-bold">✓</div>
                )}
                {task.status === 'failed' && (
                  <div className="text-red-500 font-bold">✕</div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {task.characterName}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
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
