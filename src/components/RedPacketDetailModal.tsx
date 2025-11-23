import React from 'react'
import { ChevronLeft } from 'lucide-react'

interface RedPacketRecord {
  userId: string
  userName: string
  userAvatar?: string
  amount: number
  timestamp: number
}

interface RedPacketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  senderName: string
  senderAvatar: string
  blessing: string
  totalAmount: number
  count: number
  received: RedPacketRecord[]
  remaining: number
  remainingCount: number
  currentUserId: string
}

const RedPacketDetailModal: React.FC<RedPacketDetailModalProps> = ({
  isOpen,
  onClose,
  senderName,
  senderAvatar,
  blessing,
  totalAmount,
  count,
  received,
  remaining,
  remainingCount,
  currentUserId
}) => {
  if (!isOpen) return null

  const myRecord = received.find(r => r.userId === currentUserId)
  const isAllReceived = remainingCount === 0
  
  // 找出最佳手气
  const maxAmount = received.length > 0 ? Math.max(...received.map(r => r.amount)) : 0

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[360px] h-[540px] flex flex-col overflow-hidden shadow-2xl rounded-xl relative"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#f7f7f7', 
          opacity: 1,
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* 顶部红色背景 - 强制不透明 */}
        <div 
          className="relative h-24 flex-shrink-0"
          style={{ backgroundColor: '#ea5f39' }}
        >
          {/* 顶部装饰弧形 - 模仿微信 */}
          <div 
            className="absolute -bottom-[30px] left-0 right-0 h-[60px] rounded-[50%] z-0"
            style={{ backgroundColor: '#ea5f39' }}
          ></div>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-white/90 hover:text-white z-20"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="absolute top-4 w-full text-center text-white font-medium z-10">
            红包详情
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 z-10 flex-shrink-0">
          {/* 发送者信息 */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium text-gray-900 text-sm">
                {senderName}的红包
              </div>
              <div className="bg-[#d64a28] text-xs text-white px-1 rounded">拼</div>
            </div>
            <div className="text-gray-500 text-xs">
              {blessing}
            </div>
          </div>

          {/* 金额显示 */}
          <div className="mb-8 text-center">
            {myRecord ? (
              <>
                <div className="text-[40px] font-bold text-[#cfb577] leading-none mb-1">
                  {myRecord.amount.toFixed(2)}
                  <span className="text-sm font-normal ml-1 text-[#cfb577]">元</span>
                </div>
                <div className="text-xs text-[#cfb577] opacity-80 cursor-pointer">
                  已存入零钱
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-300 py-2">
                {remainingCount === 0 ? '手慢了，红包派完了' : '未领取'}
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="w-full text-xs text-gray-400 border-b border-gray-200 pb-2">
            {isAllReceived 
              ? `${count}个红包共${totalAmount.toFixed(2)}元，${(received[received.length-1].timestamp - received[0]?.timestamp) / 1000 > 60 ? '1分钟' : '55秒'}被抢光`
              : `已领取${received.length}/${count}个，共${(totalAmount - remaining).toFixed(2)}/${totalAmount.toFixed(2)}元`
            }
          </div>
        </div>

        {/* 发送者头像 - 绝对定位悬浮 */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-16 h-16 rounded-full p-0.5 bg-white shadow-sm overflow-hidden">
            {senderAvatar ? (
              <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                头像
              </div>
            )}
          </div>
        </div>

        {/* 领取记录列表 */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: '#f7f7f7' }}
        >
          {received.length === 0 ? (
            <div className="pt-10 text-center text-gray-400 text-sm">
              暂无领取记录
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {received.map((record, index) => {
                const isLuckiest = received.length >= count && record.amount === maxAmount
                
                return (
                  <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-100/50 transition-colors">
                    {/* 列表头像 */}
                    <div className="w-9 h-9 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                       {/* 这里实际应该传入头像URL，现在先用占位或者名字首字 */}
                       {record.userAvatar ? (
                         <img src={record.userAvatar} alt={record.userName} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                           {record.userName[0]}
                         </div>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                          {record.userName}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {record.amount.toFixed(2)}元
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {isLuckiest && (
                          <div className="flex items-center gap-1 text-[#cfb577] text-xs font-medium">
                            <span className="text-[10px]">👑</span>
                            <span>手气最佳</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* 底部提示 */}
        <div className="text-center py-3 text-[10px] text-[#576b95] cursor-pointer hover:underline flex-shrink-0">
          查看我的红包记录
        </div>
      </div>
    </div>
  )
}

export default RedPacketDetailModal
