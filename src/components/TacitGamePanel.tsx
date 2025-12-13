/**
 * 默契游戏组件 - 内嵌在聊天界面
 * 包含：题目悬浮卡片 + 底部画板/输入区
 */

import { useState, useRef, useEffect } from 'react'
import { callZhizhiApi } from '../services/zhizhiapi'

// 本地默认题库（备用）
const DEFAULT_TOPICS = {
  draw: [
    '猫', '狗', '花', '月亮', '太阳', '房子',
    '汽车', '星星', '爱心', '气球', '苹果', '彩虹',
    '树', '鱼', '云', '山', '雪人', '蛋糕'
  ],
  act: [
    '跑步', '做饭', '看书', '唱歌', '跳舞', '游泳',
    '打游戏', '画画', '瑜伽', '弹吉他', '骑车', '踢球',
    '睡觉', '吃饭', '喝水', '拍照', '打电话', '弹钢琴'
  ]
}

// 缓存key
const CACHE_KEY = 'tacit_game_topics_cache'

interface TopicsCache {
  draw: string[]
  act: string[]
  drawIndex: number  // 当前用到第几个
  actIndex: number
}

// 获取缓存
const getCache = (): TopicsCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('读取题目缓存失败', e)
  }
  return { draw: [], act: [], drawIndex: 0, actIndex: 0 }
}

// 保存缓存
const saveCache = (cache: TopicsCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('保存题目缓存失败', e)
  }
}

// 调用zhizhiapi获取100个题目
const fetchTopicsFromAPI = async (type: 'draw' | 'act'): Promise<string[]> => {
  const prompt = type === 'draw' 
    ? '请生成100个适合你画我猜游戏的词语，要求：简单易画、名词为主（如动物、物品、食物、植物、交通工具、生活用品等）。直接输出词语，用逗号分隔，不要解释。'
    : '请生成100个适合你演我猜游戏的词语，要求：动作类词语为主（如运动、日常动作、职业动作等）。直接输出词语，用逗号分隔，不要解释。'

  try {
    const response = await callZhizhiApi(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8, max_tokens: 2000 }
    )
    
    if (response) {
      // 解析逗号分隔的词语
      const topics = response
        .split(/[,，、\n]+/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0 && t.length <= 10)  // 过滤太长的
        .slice(0, 100)  // 最多100个
      
      if (topics.length >= 5) {
        console.log(`🎮 从zhizhiapi获取了${topics.length}个${type === 'draw' ? '你画我猜' : '你演我猜'}题目`)
        return topics
      }
    }
  } catch (e) {
    console.error('获取题目失败', e)
  }

  // 失败时用默认题库
  return [...DEFAULT_TOPICS[type]].sort(() => Math.random() - 0.5)
}

// ============ 游戏选择菜单（在AddMenu点击默契后弹出）============
interface TacitGameSelectProps {
  isOpen: boolean
  onClose: () => void
  onSelectGame: (type: 'draw' | 'act' | 'ai-draw') => void
  characterName: string
}

export const TacitGameSelect = ({
  isOpen,
  onClose,
  onSelectGame,
  characterName
}: TacitGameSelectProps) => {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-white/50 animate-slide-up pb-safe">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-200/80 rounded-full" />
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-3 shadow-sm border border-rose-100">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">默契大考验</h3>
            <p className="text-sm text-gray-500 mt-1">和 {characterName} 看看你们有多合拍</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelectGame('draw')}
              className="group relative p-4 bg-white hover:bg-orange-50/50 rounded-2xl border border-gray-100 hover:border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div className="text-left relative z-10">
                <div className="text-lg font-bold text-gray-900 mb-0.5 group-hover:text-orange-700 transition-colors">你画我猜</div>
                <div className="text-xs text-gray-500 font-medium group-hover:text-orange-600/70">灵魂画手上线</div>
              </div>
            </button>

            <button
              onClick={() => onSelectGame('act')}
              className="group relative p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left relative z-10">
                <div className="text-lg font-bold text-gray-900 mb-0.5 group-hover:text-blue-700 transition-colors">你演我猜</div>
                <div className="text-xs text-gray-500 font-medium group-hover:text-blue-600/70">戏精本精登场</div>
              </div>
            </button>
          </div>

          {/* AI画你猜 - 单独一行 */}
          <button
            onClick={() => onSelectGame('ai-draw')}
            className="group relative w-full p-4 bg-white hover:bg-purple-50/50 rounded-2xl border border-gray-100 hover:border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-purple-600 text-xl">
                🎨
              </div>
              <div className="text-left relative z-10">
                <div className="text-lg font-bold text-gray-900 mb-0.5 group-hover:text-purple-700 transition-colors">{characterName}画你猜</div>
                <div className="text-xs text-gray-500 font-medium group-hover:text-purple-600/70">TA用字符画画，你来猜</div>
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            暂不开始
          </button>
        </div>
      </div>
    </>
  )
}

// ============ 悬浮题目卡片 ============
interface TacitTopicCardProps {
  topic: string
  gameType: 'draw' | 'act'
  onChangeTopic: () => void
  onSetCustomTopic?: (topic: string) => void  // 设置自定义题目
  onClose: () => void
  onOpenPanel: () => void
  isPanelOpen: boolean
  hasSent?: boolean  // 是否已发送画作/描述
  isAiTyping?: boolean  // AI是否正在打字
  isJudging?: boolean  // 是否正在AI判定
  isRefreshing?: boolean  // 是否正在刷新题库
  remainingCount?: number  // 剩余题目数量
}

export const TacitTopicCard = ({
  topic,
  gameType,
  onChangeTopic,
  onSetCustomTopic,
  onClose,
  onOpenPanel,
  isPanelOpen,
  hasSent = false,
  isAiTyping = false,
  isJudging = false,
  isRefreshing = false,
  remainingCount = 0
}: TacitTopicCardProps) => {
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const isDrawGame = gameType === 'draw'

  // 动态样式配置
  const styles = isDrawGame ? {
    bg: 'bg-white/90',
    border: 'border-orange-100',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: '你画我猜',
    accent: 'text-orange-600',
    topic: 'text-gray-800',
    btn: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    mainBtn: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200',
    label: '画板'
  } : {
    bg: 'bg-white/90',
    border: 'border-blue-100',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '你演我猜',
    accent: 'text-blue-600',
    topic: 'text-gray-800',
    btn: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    mainBtn: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200',
    label: '输入'
  }

  return (
    <div className="absolute top-16 left-4 right-4 z-30 pointer-events-auto animate-fade-in-down">
      <div className={`${styles.bg} backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border ${styles.border} p-4 ring-1 ring-black/5`}>
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDrawGame ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
              {styles.icon}
            </div>
            <span className="font-bold text-sm text-gray-700 tracking-wide">
              {styles.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex items-end justify-between">
          <div className="relative flex-1 mr-3">
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
              {isCustomMode ? 'Custom Topic' : 'Current Topic'}
            </div>
            {isCustomMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="输入自定义题目..."
                  className="flex-1 text-lg font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      onSetCustomTopic?.(customInput.trim())
                      setIsCustomMode(false)
                      setCustomInput('')
                    } else if (e.key === 'Escape') {
                      setIsCustomMode(false)
                      setCustomInput('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customInput.trim()) {
                      onSetCustomTopic?.(customInput.trim())
                      setIsCustomMode(false)
                      setCustomInput('')
                    }
                  }}
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  确定
                </button>
                <button
                  onClick={() => {
                    setIsCustomMode(false)
                    setCustomInput('')
                  }}
                  className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className={`text-2xl font-bold ${styles.topic} tracking-tight leading-none`}>
                {topic}
              </div>
            )}
          </div>

          {!isCustomMode && (
            <div className="flex items-center gap-2">
              {/* 判定状态显示 */}
              {hasSent && !isPanelOpen && (
                isJudging ? (
                  // 正在AI判定中
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    判定中...
                  </div>
                ) : isAiTyping ? (
                  // AI正在打字
                  <div className="px-2.5 py-1 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium">
                    等待回复...
                  </div>
                ) : null
              )}

              {/* 自定义题目按钮 */}
              <button
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1.5 ${styles.btn} rounded-lg text-xs font-bold transition-colors flex items-center gap-1`}
                title="自定义题目"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                自定
              </button>

              <button
                onClick={onChangeTopic}
                disabled={isRefreshing}
                className={`px-3 py-1.5 ${styles.btn} rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50`}
              >
                {isRefreshing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                {isRefreshing ? '刷新中' : remainingCount > 0 ? `换题(${remainingCount})` : '换题'}
              </button>

              {!isPanelOpen && (
                <button
                  onClick={onOpenPanel}
                  className={`px-4 py-1.5 ${styles.mainBtn} rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5`}
                >
                  <span>{styles.label}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ 悬浮画板（简化版，题目在顶部卡片）============
interface TacitDrawPanelProps {
  onSendImage: (imageData: string) => void
  onClose: () => void
  canvasDataRef: React.MutableRefObject<string | null>
}

export const TacitDrawPanel = ({
  onSendImage,
  onClose,
  canvasDataRef
}: TacitDrawPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // 初始化画布（恢复之前的绘画）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 先填充背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 如果有之前保存的绘画，恢复它
    if (canvasDataRef.current) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        setHasDrawn(true)
      }
      img.src = canvasDataRef.current
    }
  }, [])

  // 关闭时保存画布状态
  const handleClose = () => {
    const canvas = canvasRef.current
    if (canvas && hasDrawn) {
      canvasDataRef.current = canvas.toDataURL('image/png')
    }
    onClose()
  }

  // 清空画布
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    canvasDataRef.current = null
  }

  const getPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()  // 防止触摸滚动
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasDrawn(true)  // 开始画就标记为已绘制
    const { x, y } = getPosition(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()  // 防止触摸滚动
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getPosition(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#2d2d2d'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // 停止绘画时也保存
    const canvas = canvasRef.current
    if (canvas && hasDrawn) {
      canvasDataRef.current = canvas.toDataURL('image/png')
    }
  }

  const handleSend = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const imageData = canvas.toDataURL('image/png')
    onSendImage(imageData)
    clearCanvas()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 pb-safe">
      {/* 顶部拖动条 + 关闭 */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="w-12 h-1 bg-gray-200 rounded-full" />
        <div className="w-8" /> {/* 占位 */}
      </div>

      {/* 画布容器 */}
      <div className="px-4 pb-2">
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
          {/* 格子背景 */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />

          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-full touch-none relative z-10"
            style={{ aspectRatio: '2/1', cursor: 'crosshair' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* 按钮栏 */}
      <div className="flex items-center gap-3 px-6 pb-6 pt-2">
        <button
          onClick={clearCanvas}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="清空"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>

        <div className="flex-1 text-center text-xs text-gray-400 font-medium">
          {hasDrawn ? 'Drawing...' : 'Start Drawing'}
        </div>

        <button
          onClick={handleSend}
          disabled={!hasDrawn}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
        >
          <span>发送</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>
    </div>
  )
}

// ============ 悬浮描述面板（你演我猜，简化版）============
interface TacitActPanelProps {
  onSendDescription: (description: string) => void
  onClose: () => void
  descriptionRef: React.MutableRefObject<string>
}

export const TacitActPanel = ({
  onSendDescription,
  onClose,
  descriptionRef
}: TacitActPanelProps) => {
  const [description, setDescription] = useState(descriptionRef.current)

  const handleClose = () => {
    descriptionRef.current = description
    onClose()
  }

  const handleSend = () => {
    if (!description.trim()) return
    onSendDescription(description.trim())
    setDescription('')
    descriptionRef.current = ''
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 pb-safe">
      {/* 顶部拖动条 + 关闭 */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="w-12 h-1 bg-gray-200 rounded-full" />
        <div className="w-8" />
      </div>

      {/* 输入区 */}
      <div className="px-4 pb-2">
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述动作让TA猜..."
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-base text-gray-800 placeholder:text-gray-400"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
            {description.length}/50
          </div>
        </div>
      </div>

      {/* 按钮栏 */}
      <div className="flex items-center justify-end px-6 pb-6 pt-2">
        <button
          onClick={handleSend}
          disabled={!description.trim()}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
        >
          <span>发送</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  )
}

// ============ 工具函数 ============

// 从缓存获取下一个题目（同步版本，不调API）
export const getRandomTopic = (type: 'draw' | 'act'): string => {
  const cache = getCache()
  const topics = type === 'draw' ? cache.draw : cache.act
  const index = type === 'draw' ? cache.drawIndex : cache.actIndex
  
  // 如果有缓存且还没用完
  if (topics.length > 0 && index < topics.length) {
    const topic = topics[index]
    // 更新索引
    if (type === 'draw') {
      cache.drawIndex = index + 1
    } else {
      cache.actIndex = index + 1
    }
    saveCache(cache)
    console.log(`🎮 使用缓存题目 [${index + 1}/${topics.length}]: ${topic}`)
    return topic
  }
  
  // 缓存用完或没有缓存，用默认题库的随机一个
  const defaultTopics = DEFAULT_TOPICS[type]
  return defaultTopics[Math.floor(Math.random() * defaultTopics.length)]
}

// 刷新题库（调用API获取新题目）
export const refreshTopics = async (type: 'draw' | 'act'): Promise<string> => {
  console.log(`🔄 刷新${type === 'draw' ? '你画我猜' : '你演我猜'}题库...`)
  
  const newTopics = await fetchTopicsFromAPI(type)
  const cache = getCache()
  
  if (type === 'draw') {
    cache.draw = newTopics
    cache.drawIndex = 1  // 返回第一个，索引设为1
  } else {
    cache.act = newTopics
    cache.actIndex = 1
  }
  
  saveCache(cache)
  return newTopics[0]  // 返回第一个题目
}

// 检查是否需要刷新（缓存用完了）
export const needsRefresh = (type: 'draw' | 'act'): boolean => {
  const cache = getCache()
  const topics = type === 'draw' ? cache.draw : cache.act
  const index = type === 'draw' ? cache.drawIndex : cache.actIndex
  return topics.length === 0 || index >= topics.length
}

// 获取剩余题目数
export const getRemainingCount = (type: 'draw' | 'act'): number => {
  const cache = getCache()
  const topics = type === 'draw' ? cache.draw : cache.act
  const index = type === 'draw' ? cache.drawIndex : cache.actIndex
  return Math.max(0, topics.length - index)
}

export default {
  TacitGameSelect,
  TacitTopicCard,
  TacitDrawPanel,
  TacitActPanel,
  getRandomTopic
}
