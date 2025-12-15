/**
 * 你画我猜结果卡片
 * 风格：模拟试卷打分效果
 */

import { useState, useEffect } from 'react'

interface GuessResultCardProps {
  isCorrect: boolean  // 是否猜对
  answer: string      // 正确答案
  score: number       // 得分
  comment: string     // AI评语
  characterName?: string
}

const GuessResultCard = ({ 
  isCorrect, 
  answer, 
  score, 
  comment,
  characterName = 'TA' 
}: GuessResultCardProps) => {
  const [showScore, setShowScore] = useState(false)

  // 得分动画延迟，模拟判卷过程
  useEffect(() => {
    const timer = setTimeout(() => setShowScore(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-64 bg-white/95 backdrop-blur-sm rounded-sm shadow-md border border-gray-300/80 relative overflow-hidden font-serif">
      {/* 试卷纹理背景 - 模拟纸张杂色 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* 顶部装订线效果 */}
      <div className="absolute top-0 left-0 w-full h-8 border-b-2 border-dashed border-gray-300 pointer-events-none"></div>
      <div className="absolute top-2 left-4 w-3 h-3 rounded-full border border-gray-300 bg-white z-10"></div>
      
      <div className="p-5 pt-8 relative z-0">
        {/* 题目/答案区域 - 印刷体 */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-gray-500 tracking-wider">正确答案：</span>
          </div>
          <div className="text-xl font-bold text-gray-900 border-b border-gray-800 inline-block min-w-[60px] pb-1 px-1">
            {answer}
          </div>
        </div>

        {/* 评语区域 - 模拟老师手写评语 */}
        <div className="relative mt-4 pt-3 border-t border-gray-200">
          <span className="text-[10px] text-gray-400 absolute -top-2 bg-[#fffbf0] px-1 left-0">
            教师评语
          </span>
          <p className={`text-sm leading-relaxed font-handwriting transform -rotate-1 ${
            isCorrect ? 'text-red-600' : 'text-red-500'
          }`} style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive' }}>
            {comment}
          </p>
          <div className="mt-2 text-right">
            <span className={`text-xs font-handwriting ${
              isCorrect ? 'text-red-600' : 'text-red-500'
            }`} style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive' }}>
              — {characterName}
            </span>
          </div>
        </div>
      </div>

      {/* 巨大的分数批注 - 模拟印章/红笔 */}
      <div className={`absolute top-4 right-4 transform transition-all duration-500 ease-out ${
        showScore ? 'scale-100 opacity-100 rotate-[-15deg]' : 'scale-150 opacity-0 rotate-0'
      }`}>
        <div className="relative">
          {/* 分数圈圈 */}
          <div className={`w-20 h-20 border-4 rounded-full flex items-center justify-center ${
            isCorrect ? 'border-red-600 text-red-600' : 'border-red-500 text-red-500'
          }`} style={{ borderRadius: '50% 60% 40% 70% / 60% 50% 70% 40%' }}> {/* 不规则圆 */}
            <div className="flex flex-col items-center leading-none transform translate-y-[-2px]">
              <span className="text-3xl font-bold" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
                {score}
              </span>
              <span className="text-[10px] tracking-widest font-bold mt-1">得分</span>
            </div>
          </div>
          
          {/* 勾叉标记 */}
          <div className="absolute -bottom-2 -right-2 text-4xl filter drop-shadow-sm">
            {isCorrect ? '✔️' : '❌'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuessResultCard
