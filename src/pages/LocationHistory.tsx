import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { locationService, LocationRecord } from '../services/locationService'
import { characterService } from '../services/characterService'

const LocationHistory = () => {
  const navigate = useNavigate()
  const { characterId } = useParams()
  const [history, setHistory] = useState<LocationRecord[]>([])
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week')

  useEffect(() => {
    loadHistory()
  }, [characterId, timeRange])

  const loadHistory = async () => {
    if (!characterId) return
    
    setLoading(true)
    try {
      const char = characterService.getById(characterId)
      setCharacter(char)

      // 根据时间范围计算起始时间
      let startTime: number | undefined
      const now = Date.now()
      switch (timeRange) {
        case 'today':
          startTime = now - 24 * 60 * 60 * 1000
          break
        case 'week':
          startTime = now - 7 * 24 * 60 * 60 * 1000
          break
        case 'month':
          startTime = now - 30 * 24 * 60 * 60 * 1000
          break
        default:
          startTime = undefined
      }

      const records = await locationService.getLocationHistory(characterId, {
        startTime,
        limit: 100
      })
      setHistory(records)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'user': return '手动设置'
      case 'ai': return 'AI移动'
      case 'system': return '系统记录'
      default: return '未知'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 状态栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {character?.nickname || character?.realName || 'AI'} 的足迹
          </h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* 时间筛选 */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'today' && '今天'}
              {range === 'week' && '本周'}
              {range === 'month' && '本月'}
              {range === 'all' && '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-400 text-sm">暂无足迹记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record, index) => (
              <div 
                key={record.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm"
              >
                {/* 时间线指示器 */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-200 to-transparent mt-1"></div>
                    )}
                  </div>

                  <div className="flex-1 pb-3">
                    {/* 位置信息 */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          📍 {record.areaName}
                        </h3>
                        {record.activity && (
                          <p className="text-xs text-gray-600 mt-1">
                            {record.activity}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(record.timestamp)}
                      </span>
                    </div>

                    {/* 来源标签 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {getSourceLabel(record.source)}
                      </span>
                      <span className="text-xs text-gray-400">
                        坐标: ({record.position.x.toFixed(1)}, {record.position.y.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {!loading && history.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>共 {history.length} 条记录</span>
            <span>
              访问过 {new Set(history.map(h => h.areaId)).size} 个区域
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationHistory
