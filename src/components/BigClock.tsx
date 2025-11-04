interface BigClockProps {
  time: Date
}

const BigClock: React.FC<BigClockProps> = ({ time }) => {
  return (
    <div className="p-6 mb-4 text-center">
      {/* 大时间 */}
      <div className="text-8xl font-bold text-gray-900 mb-2">
        {time.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
      
      {/* 日期 */}
      <div className="text-lg font-semibold text-gray-600">
        {time.toLocaleDateString('zh-CN', { 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}
      </div>
    </div>
  )
}

export default BigClock
