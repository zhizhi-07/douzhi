/**
 * 聊天加载骨架屏
 * 🔥 提升用户体验，显示加载状态
 */

const LoadingSkeleton = () => {
  return (
    <div className="flex-1 overflow-hidden px-4 py-4 space-y-4">
      {/* 模拟3条消息的骨架屏 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex items-start gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 头像骨架 */}
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          
          {/* 消息内容骨架 */}
          <div className="flex flex-col gap-2 max-w-[70%]">
            <div className={`h-16 rounded-lg bg-gray-200 animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
            <div className="h-3 w-12 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      ))}
      
      {/* 加载提示 */}
      <div className="flex justify-center items-center gap-2 py-4">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">加载消息中...</span>
      </div>
    </div>
  )
}

export default LoadingSkeleton

