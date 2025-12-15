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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-sm shadow-[0_-8px_40px_rgba(0,0,0,0.15)] border-t border-gray-300/80 animate-slide-up pb-safe font-serif">
        {/* 试卷纹理背景 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        {/* 顶部装订线 */}
        <div className="absolute top-0 left-0 w-full h-2 border-b border-dashed border-gray-300"></div>

        <div className="p-6 relative z-10">
          <div className="text-center mb-6 border-b-2 border-gray-800 pb-4 relative">
             {/* 红色机密印章 */}
            <div className="absolute top-0 right-0 border-2 border-red-500 text-red-500 text-[10px] font-bold px-1 py-0.5 rotate-[-12deg] opacity-60 pointer-events-none">
              内部文件
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 tracking-widest">考试选择</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono tracking-wider">请选择考试科目</p>
          </div>

          <div className="space-y-4">
            {/* 选项A: 你画我猜 */}
            <button
              onClick={() => onSelectGame('draw')}
              className="w-full group relative p-4 bg-white border border-gray-300 shadow-sm hover:border-gray-800 hover:shadow-md transition-all duration-200 active:scale-[0.99] text-left overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-gray-800 transition-colors"></div>
              <div className="flex items-start gap-4 pl-2">
                <div className="w-8 h-8 flex items-center justify-center border border-gray-800 bg-gray-900 text-white font-bold font-mono text-lg shrink-0">
                  A
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 font-serif group-hover:underline decoration-1 underline-offset-4">实践美术</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">科目：你画我猜（用户作画）</div>
                </div>
              </div>
            </button>

            {/* 选项B: 你演我猜 */}
            <button
              onClick={() => onSelectGame('act')}
              className="w-full group relative p-4 bg-white border border-gray-300 shadow-sm hover:border-gray-800 hover:shadow-md transition-all duration-200 active:scale-[0.99] text-left overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-gray-800 transition-colors"></div>
              <div className="flex items-start gap-4 pl-2">
                <div className="w-8 h-8 flex items-center justify-center border border-gray-800 bg-white text-gray-900 font-bold font-mono text-lg shrink-0">
                  B
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 font-serif group-hover:underline decoration-1 underline-offset-4">表演艺术</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">科目：你演我猜</div>
                </div>
              </div>
            </button>

            {/* 选项C: AI画你猜 */}
            <button
              onClick={() => onSelectGame('ai-draw')}
              className="w-full group relative p-4 bg-white border border-gray-300 shadow-sm hover:border-gray-800 hover:shadow-md transition-all duration-200 active:scale-[0.99] text-left overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-gray-800 transition-colors"></div>
              <div className="flex items-start gap-4 pl-2">
                <div className="w-8 h-8 flex items-center justify-center border border-gray-800 bg-white text-gray-900 font-bold font-mono text-lg shrink-0">
                  C
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 font-serif group-hover:underline decoration-1 underline-offset-4">艺术鉴赏</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">科目：{characterName}作画</div>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 text-gray-400 text-xs font-mono hover:text-gray-600 transition-colors uppercase tracking-widest mt-2"
          >
            [ 取消考试 ]
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

  return (
    <div className="absolute top-16 left-4 right-4 z-30 pointer-events-auto animate-fade-in-down font-serif">
      <div className="bg-white/95 backdrop-blur-sm rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-300/80 p-4 relative overflow-hidden">
         {/* 试卷纹理背景 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        {/* 左侧装饰线 */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 border-l-2 border-red-300/30"></div>
        <div className="absolute left-4 top-0 bottom-0 w-0.5 border-l border-red-300/30"></div>

        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-3 relative z-10 pl-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 border border-gray-800 bg-white text-gray-900 font-bold font-mono text-xs uppercase tracking-wider">
              {isDrawGame ? '第一部分' : '第二部分'}
            </div>
            <span className="font-bold text-sm text-gray-800 tracking-wide uppercase border-b border-gray-300 pb-0.5">
              {isDrawGame ? '视觉艺术' : '表演艺术'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all font-mono font-bold"
          >
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex items-end justify-between pl-4 relative z-10">
          <div className="relative flex-1 mr-3">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1 font-mono">
              {isCustomMode ? '自定义题目：' : '当前题目：'}
            </div>
            {isCustomMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="输入题目..."
                  className="flex-1 text-lg font-bold text-gray-900 bg-white border-b-2 border-gray-800 rounded-none px-1 py-1 focus:outline-none focus:border-gray-500 font-mono placeholder:text-gray-300"
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
                  className="px-3 py-1 bg-gray-900 text-white text-xs font-bold disabled:opacity-50 font-mono uppercase"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setIsCustomMode(false)
                    setCustomInput('')
                  }}
                  className="px-2 py-1 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 tracking-widest font-mono border-b-2 border-gray-800/20 inline-block pb-1 min-w-[120px]">
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
                  <div className="px-2 py-1 border border-blue-300 bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center gap-1 font-mono uppercase">
                    <span className="animate-pulse">●</span> 批改中...
                  </div>
                ) : isAiTyping ? (
                  // AI正在打字
                  <div className="px-2 py-1 border border-gray-300 bg-gray-50 text-gray-500 text-[10px] font-bold font-mono uppercase">
                    等待中...
                  </div>
                ) : null
              )}

              {/* 自定义题目按钮 */}
              <button
                onClick={() => setIsCustomMode(true)}
                className="px-2 py-1 border border-gray-400 text-gray-600 hover:bg-gray-100 text-[10px] font-bold transition-colors flex items-center gap-1 font-mono uppercase"
                title="自定义题目"
              >
                编辑
              </button>

              <button
                onClick={onChangeTopic}
                disabled={isRefreshing}
                className="px-2 py-1 border border-gray-400 text-gray-600 hover:bg-gray-100 text-[10px] font-bold transition-colors flex items-center gap-1 disabled:opacity-50 font-mono uppercase"
              >
                {isRefreshing ? '刷新中' : remainingCount > 0 ? `下一题 (${remainingCount})` : '下一题'}
              </button>

              {!isPanelOpen && (
                <button
                  onClick={onOpenPanel}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-sm font-mono uppercase tracking-wider"
                >
                  <span>{isDrawGame ? '作画' : '表演'}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-sm shadow-[0_-8px_40px_rgba(0,0,0,0.15)] border-t border-gray-300/80 pb-safe font-serif">
      {/* 试卷纹理背景 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* 顶部拖动条 + 关闭 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-300/80 relative z-10">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors font-mono"
        >
          ✕
        </button>
        <div className="text-sm font-bold text-gray-800 tracking-widest border-b border-gray-800 pb-0.5">画板</div>
        <div className="w-8" /> {/* 占位 */}
      </div>

      {/* 画布容器 */}
      <div className="px-4 pb-2 pt-4 relative z-10">
        <div className="text-[10px] text-gray-500 font-mono mb-2 tracking-wider">请在此处作画：</div>
        <div className="relative rounded-sm overflow-hidden shadow-sm border-2 border-gray-800 bg-white">
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
      <div className="flex items-center gap-3 px-6 pb-6 pt-2 relative z-10">
        <button
          onClick={clearCanvas}
          className="w-10 h-10 flex items-center justify-center rounded-sm border border-gray-400 text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors bg-white shadow-sm"
          title="清空"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>

        <div className="flex-1 text-center text-xs text-gray-400 font-mono uppercase tracking-wider">
          {hasDrawn ? '作画中...' : '等待作画'}
        </div>

        <button
          onClick={handleSend}
          disabled={!hasDrawn}
          className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-sm font-bold shadow-md disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center gap-2 font-mono uppercase tracking-widest border border-black"
        >
          <span>提交</span>
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-sm shadow-[0_-8px_40px_rgba(0,0,0,0.15)] border-t border-gray-300/80 pb-safe font-serif">
      {/* 试卷纹理背景 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* 顶部拖动条 + 关闭 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-300/80 relative z-10">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors font-mono"
        >
          ✕
        </button>
        <div className="text-sm font-bold text-gray-800 tracking-widest border-b border-gray-800 pb-0.5">描述</div>
        <div className="w-8" />
      </div>

      {/* 输入区 */}
      <div className="px-4 pb-2 pt-4 relative z-10">
        <div className="text-[10px] text-gray-500 font-mono mb-2 tracking-wider">请描述你的动作：</div>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="在此输入你的答案..."
            className="w-full h-32 p-4 bg-white rounded-sm border-2 border-gray-800 resize-none focus:outline-none focus:ring-0 focus:border-gray-600 transition-all text-base text-gray-900 placeholder:text-gray-300 font-serif leading-relaxed"
            style={{ backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
            {description.length}/50 字
          </div>
        </div>
      </div>

      {/* 按钮栏 */}
      <div className="flex items-center justify-end px-6 pb-6 pt-2 relative z-10">
        <button
          onClick={handleSend}
          disabled={!description.trim()}
          className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-sm font-bold shadow-md disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center gap-2 font-mono uppercase tracking-widest border border-black"
        >
          <span>提交</span>
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
