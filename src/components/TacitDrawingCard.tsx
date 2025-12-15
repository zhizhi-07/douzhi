/**
 * 用户画作展示卡片 - 试卷风格
 * 用于展示用户在"你画我猜"游戏中发送的画作
 */

import { useState } from 'react'

interface TacitDrawingCardProps {
  imageData: string  // base64图片数据
  topic: string      // 题目/答案
}

const TacitDrawingCard = ({ imageData, topic }: TacitDrawingCardProps) => {
  const [showFullImage, setShowFullImage] = useState(false)

  // 处理图片源
  const imageSrc = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`

  return (
    <>
      <div 
        className="w-56 bg-white/95 backdrop-blur-sm rounded-sm shadow-md border border-gray-300/80 relative overflow-hidden font-serif cursor-pointer"
        onClick={() => setShowFullImage(true)}
      >
        {/* 试卷纹理背景 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* 顶部装订线效果 */}
        <div className="absolute top-0 left-0 w-full h-6 border-b-2 border-dashed border-gray-300 pointer-events-none"></div>
        <div className="absolute top-1.5 left-3 w-2.5 h-2.5 rounded-full border border-gray-300 bg-white z-10"></div>

        {/* 左侧红色装饰线 */}
        <div className="absolute left-2 top-6 bottom-0 w-0.5 border-l-2 border-red-300/30"></div>
        <div className="absolute left-3 top-6 bottom-0 w-0.5 border-l border-red-300/30"></div>

        <div className="p-4 pt-8 pl-5 relative z-0">
          {/* 题目区域 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 border border-gray-800 bg-gray-900 text-white text-[10px] font-bold font-mono">
                画
              </span>
              <span className="text-xs text-gray-500 font-mono tracking-wider">我的画作</span>
            </div>
          </div>
          
          {/* 画作展示区域 - 模拟答题框 */}
          <div className="relative bg-white border-2 border-gray-800 rounded-sm overflow-hidden">
            {/* 答题框角落标记 */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-gray-400 z-10"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-gray-400 z-10"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-gray-400 z-10"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-gray-400 z-10"></div>
            
            <img 
              src={imageSrc} 
              alt="画作" 
              className="w-full h-auto"
            />
          </div>
          
          {/* 底部答案区域 */}
          <div className="mt-3 pt-2 border-t border-dashed border-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono">正确答案：</span>
              <span className="text-sm font-bold text-gray-900 font-mono border-b border-gray-800 px-2">
                {topic}
              </span>
            </div>
          </div>
        </div>

        {/* 右上角"已提交"印章 */}
        <div className="absolute top-8 right-2 border-2 border-green-600 rounded px-1 py-0.5 transform rotate-[10deg] opacity-60">
          <span className="text-[8px] font-bold text-green-600 tracking-widest">已提交</span>
        </div>
      </div>

      {/* 全屏查看大图 */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={imageSrc}
              alt="画作"
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white text-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
              onClick={() => setShowFullImage(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default TacitDrawingCard
