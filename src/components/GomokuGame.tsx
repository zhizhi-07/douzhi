/**
 * 五子棋游戏组件
 * 小型悬浮棋盘，不挡住输入框，可收起
 */

import { useState, useEffect, useCallback } from 'react'

interface GomokuGameProps {
  isOpen: boolean
  onClose: () => void
  onSendMove: (position: string) => void
  onGameEnd?: (userWin: boolean) => void  // 游戏结束时的回调
  onAIMoveProcessed?: () => void  // AI落子处理完成后的回调
  aiMove?: string
  characterName?: string
  characterAvatar?: string
}

const BOARD_SIZE = 15
type Stone = 'black' | 'white' | null

const toAlphaCoord = (row: number, col: number): string => {
  const colLetter = String.fromCharCode(65 + col)
  return `${colLetter}${row + 1}`
}

const fromAlphaCoord = (coord: string): { row: number, col: number } | null => {
  const match = coord.toUpperCase().match(/^([A-O])(\d{1,2})$/)
  if (!match) return null
  const col = match[1].charCodeAt(0) - 65
  const row = parseInt(match[2]) - 1
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
  return { row, col }
}

const checkWin = (board: Stone[][], row: number, col: number, stone: Stone): boolean => {
  if (!stone) return false
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (const [dx, dy] of directions) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i
      const newCol = col + dy * i
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break
      if (board[newRow][newCol] !== stone) break
      count++
    }
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i
      const newCol = col - dy * i
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break
      if (board[newRow][newCol] !== stone) break
      count++
    }
    if (count >= 5) return true
  }
  return false
}

const GomokuGame = ({
  isOpen,
  onClose,
  onSendMove,
  onGameEnd,
  onAIMoveProcessed,
  aiMove,
  characterName = 'AI'
}: GomokuGameProps) => {
  const [board, setBoard] = useState<Stone[][]>(() => 
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  )
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black')
  const [playerColor] = useState<'black' | 'white'>('black')
  const [gameStatus, setGameStatus] = useState<'playing' | 'win' | 'lose' | 'draw'>('playing')
  const [lastMove, setLastMove] = useState<{ row: number, col: number } | null>(null)
  const [history, setHistory] = useState<{ row: number, col: number, stone: Stone }[]>([])
  const [waitingForAI, setWaitingForAI] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [lastProcessedAIMove, setLastProcessedAIMove] = useState<string | null>(null)

  // 处理AI落子 - 只要aiMove变化且未处理过就执行
  useEffect(() => {
    console.log('⚫ [五子棋] useEffect触发:', { aiMove, lastProcessedAIMove, waitingForAI, currentTurn, playerColor })
    if (!aiMove) return
    // 避免重复处理同一个落子
    if (aiMove === lastProcessedAIMove) {
      console.log('⚫ [五子棋] 跳过已处理的落子:', aiMove)
      return
    }
    
    const coord = fromAlphaCoord(aiMove)
    if (!coord) {
      console.log('⚫ [五子棋] 无效坐标:', aiMove)
      return
    }
    const { row, col } = coord
    if (board[row][col] !== null) {
      console.log('⚫ [五子棋] 位置已有棋子:', aiMove)
      return
    }
    
    console.log('⚫ [五子棋] 处理AI落子:', aiMove)
    const aiColor = playerColor === 'black' ? 'white' : 'black'
    const newBoard = board.map(r => [...r])
    newBoard[row][col] = aiColor
    setBoard(newBoard)
    setLastMove({ row, col })
    setHistory(prev => [...prev, { row, col, stone: aiColor }])
    setWaitingForAI(false)
    setLastProcessedAIMove(aiMove)  // 记录已处理
    
    if (checkWin(newBoard, row, col, aiColor)) {
      setGameStatus('lose')
      onGameEnd?.(false)  // 用户输了
    } else {
      setCurrentTurn(playerColor)
    }
    
    // 通知父组件清除aiMove
    onAIMoveProcessed?.()
  }, [aiMove, lastProcessedAIMove, board, playerColor, onGameEnd, onAIMoveProcessed])

  // 玩家落子
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return
    if (currentTurn !== playerColor) return
    if (waitingForAI) return
    if (board[row][col] !== null) return
    
    const newBoard = board.map(r => [...r])
    newBoard[row][col] = playerColor
    setBoard(newBoard)
    setLastMove({ row, col })
    setHistory(prev => [...prev, { row, col, stone: playerColor }])
    
    const position = toAlphaCoord(row, col)
    
    if (checkWin(newBoard, row, col, playerColor)) {
      setGameStatus('win')
      onSendMove(`[下棋:${position}] 我赢了！`)
      onGameEnd?.(true)  // 用户赢了
    } else {
      const aiColor = playerColor === 'black' ? 'white' : 'black'
      setCurrentTurn(aiColor)
      setWaitingForAI(true)
      onSendMove(`[下棋:${position}]`)
    }
  }, [board, currentTurn, playerColor, gameStatus, waitingForAI, onSendMove, onGameEnd])

  // 悔棋
  const handleUndo = useCallback(() => {
    if (history.length < 2 || gameStatus !== 'playing') return
    const newHistory = history.slice(0, -2)
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    newHistory.forEach(({ row, col, stone }) => { newBoard[row][col] = stone })
    setBoard(newBoard)
    setHistory(newHistory)
    setLastMove(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null)
    setCurrentTurn(playerColor)
    setWaitingForAI(false)
    onSendMove('[悔棋]')
  }, [history, gameStatus, playerColor, onSendMove])

  // 重新开始
  const handleRestart = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)))
    setCurrentTurn('black')
    setGameStatus('playing')
    setLastMove(null)
    setHistory([])
    setWaitingForAI(false)
    setLastProcessedAIMove(null)  // 重置已处理的AI落子
    onSendMove('[五子棋:重新开始]')
  }, [onSendMove])

  if (!isOpen) return null

  const CELL_SIZE = 16  // 缩小棋盘

  // 收起状态 - 雅致的标签
  if (isCollapsed) {
    return (
      <div 
        className="fixed top-16 right-4 z-40 px-4 py-2 rounded shadow-lg cursor-pointer flex items-center gap-2 text-sm font-serif border hover:shadow-xl transition-all tracking-widest backdrop-blur-md"
        onClick={() => setIsCollapsed(false)}
        style={{
          background: 'rgba(244, 241, 232, 0.65)', // 半透明宣纸色
          borderColor: 'rgba(44, 44, 44, 0.1)',
          color: '#2c2c2c',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#2c2c2c]"></div>
        <span>弈</span>
      </div>
    )
  }

  return (
    <div 
      className="fixed top-20 right-4 z-40 rounded shadow-2xl overflow-hidden select-none font-serif transition-all duration-500 ease-out backdrop-blur-xl"
      style={{ 
        width: CELL_SIZE * BOARD_SIZE + 32,
        background: 'rgba(244, 241, 232, 0.75)', // 半透明宣纸色
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      }}
    >
      {/* 宣纸纹理层 - 降低透明度以配合毛玻璃 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")` }} 
      />

      <div className="relative p-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-5 border-b border-[#2c2c2c]/10 pb-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#2c2c2c] tracking-[0.2em]" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}>五子连珠</span>
            <span className="text-[10px] text-[#2c2c2c]/50 tracking-widest mt-1">
              {gameStatus === 'win' ? '胜负已分 · 胜' : gameStatus === 'lose' ? '胜负已分 · 败' : 
               currentTurn === playerColor ? '请君落子' : `待 ${characterName} 斟酌`}
            </span>
          </div>
          <div className="flex gap-4 text-[#2c2c2c]/40">
            <button onClick={() => setIsCollapsed(true)} className="hover:text-[#2c2c2c] transition-colors">收起</button>
            <button onClick={onClose} className="hover:text-[#b91c1c] transition-colors">关闭</button>
          </div>
        </div>

        {/* 棋盘主体 */}
        <div className="relative mx-auto"
             style={{ 
               width: 'fit-content',
             }}
        >
          <div 
            className="grid relative"
            style={{ 
              gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative flex items-center justify-center cursor-pointer"
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {/* 网格线 - 极细黑线 */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute left-0 right-0 top-1/2 h-[0.5px] bg-[#2c2c2c] opacity-80 ${colIndex === 0 ? 'left-1/2' : ''} ${colIndex === BOARD_SIZE - 1 ? 'right-1/2' : ''}`}></div>
                    <div className={`absolute top-0 bottom-0 left-1/2 w-[0.5px] bg-[#2c2c2c] opacity-80 ${rowIndex === 0 ? 'top-1/2' : ''} ${rowIndex === BOARD_SIZE - 1 ? 'bottom-1/2' : ''}`}></div>
                  </div>
                  
                  {/* 星位 */}
                  {((rowIndex === 3 || rowIndex === 7 || rowIndex === 11) && 
                    (colIndex === 3 || colIndex === 7 || colIndex === 11)) && !cell && (
                    <div className="absolute w-[3px] h-[3px] bg-[#2c2c2c] rounded-full" />
                  )}

                  
                  {/* 棋子 - 极简扁平略带水墨感 */}
                  {cell && (
                    <div 
                      className={`rounded-full z-10 transition-all duration-500 ease-out
                        ${lastMove?.row === rowIndex && lastMove?.col === colIndex 
                          ? 'scale-95 shadow-lg' 
                          : 'scale-90'}
                      `}
                      style={{ 
                        width: CELL_SIZE - 4, 
                        height: CELL_SIZE - 4,
                        background: cell === 'black' ? '#1a1a1a' : '#fff',
                        border: cell === 'white' ? '1px solid #2c2c2c' : 'none',
                        boxShadow: cell === 'black' 
                          ? '1px 1px 2px rgba(0,0,0,0.3)' 
                          : 'inset 0 0 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* 最新落子标记 - 红点 */}
                      {lastMove?.row === rowIndex && lastMove?.col === colIndex && (
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${cell === 'black' ? 'bg-white/50' : 'bg-red-500/50'}`}></div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 底部操作栏 */}
        <div className="flex justify-center items-center mt-6 gap-8">
          <button
            onClick={handleUndo}
            disabled={history.length < 2 || gameStatus !== 'playing'}
            className="text-xs text-[#2c2c2c]/60 hover:text-[#2c2c2c] disabled:opacity-30 transition-colors tracking-widest"
          >
            悔棋
          </button>
          <div className="w-[1px] h-3 bg-[#2c2c2c]/10"></div>
          <button
            onClick={handleRestart}
            className="text-xs text-[#2c2c2c]/60 hover:text-[#2c2c2c] transition-colors tracking-widest"
          >
            重局
          </button>
          <div className="w-[1px] h-3 bg-[#2c2c2c]/10"></div>
          <button
            onClick={() => { setGameStatus('lose'); onSendMove('[认输]'); onGameEnd?.(false) }}
            disabled={gameStatus !== 'playing'}
            className="text-xs text-[#2c2c2c]/60 hover:text-[#b91c1c] disabled:opacity-30 transition-colors tracking-widest"
          >
            认输
          </button>
        </div>
      </div>
    </div>
  )
}

export default GomokuGame
