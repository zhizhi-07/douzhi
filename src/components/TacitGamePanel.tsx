/**
 * 默契游戏组件 - 内嵌在聊天界面
 * 包含：题目悬浮卡片 + 底部画板/输入区
 */

import { useState, useRef, useEffect } from 'react'

const TOPICS = {
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

// ============ 游戏选择菜单（在AddMenu点击默契后弹出）============
interface TacitGameSelectProps {
  isOpen: boolean
  onClose: () => void
  onSelectGame: (type: 'draw' | 'act') => void
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-rose-50 to-orange-50 mb-3 shadow-inner border border-rose-100/50">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">默契大考验</h3>
            <p className="text-sm text-gray-500 mt-1">和 {characterName} 看看你们有多合拍</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelectGame('draw')}
              className="group relative p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-orange-100/50 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-orange-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div className="text-left relative z-10">
                <div className="text-lg font-bold text-gray-800 mb-0.5">你画我猜</div>
                <div className="text-xs text-gray-500 font-medium">灵魂画手上线</div>
              </div>
            </button>

            <button
              onClick={() => onSelectGame('act')}
              className="group relative p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left relative z-10">
                <div className="text-lg font-bold text-gray-800 mb-0.5">你演我猜</div>
                <div className="text-xs text-gray-500 font-medium">戏精本精登场</div>
              </div>
            </button>
          </div>

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
  onClose: () => void
  onOpenPanel: () => void
  onConfirmCorrect?: () => void
  isPanelOpen: boolean
  hasSent?: boolean  // 是否已发送画作/描述
  isAiTyping?: boolean  // AI是否正在打字
}

export const TacitTopicCard = ({
  topic,
  gameType,
  onChangeTopic,
  onClose,
  onOpenPanel,
  onConfirmCorrect,
  isPanelOpen,
  hasSent = false,
  isAiTyping = false
}: TacitTopicCardProps) => {
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
    mainBtn: 'bg-gray-900 text-white shadow-lg shadow-gray-200',
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
    mainBtn: 'bg-gray-900 text-white shadow-lg shadow-gray-200',
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
          <div className="relative">
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Current Topic</div>
            <div className={`text-2xl font-bold ${styles.topic} tracking-tight leading-none`}>
              {topic}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 猜对按钮 - 仅在发送后且AI回复完才显示，用户确认AI猜对后点击 */}
            {hasSent && !isPanelOpen && !isAiTyping && onConfirmCorrect && (
              <button
                onClick={onConfirmCorrect}
                className="px-2.5 py-1 bg-green-500 text-white hover:bg-green-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                猜对了
              </button>
            )}

            <button
              onClick={onChangeTopic}
              className={`px-3 py-1.5 ${styles.btn} rounded-lg text-xs font-bold transition-colors flex items-center gap-1`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              换题
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
          className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
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
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all text-base text-gray-800 placeholder:text-gray-400"
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
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
        >
          <span>发送</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  )
}

// ============ 工具函数 ============
export const getRandomTopic = (type: 'draw' | 'act') => {
  const topics = TOPICS[type]
  return topics[Math.floor(Math.random() * topics.length)]
}

export default {
  TacitGameSelect,
  TacitTopicCard,
  TacitDrawPanel,
  TacitActPanel,
  getRandomTopic
}
