import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ensureMessagesLoaded, saveMessages } from '../utils/simpleMessageManager'
import { receiveTransfer } from '../utils/walletUtils'
import { getUserInfo } from '../utils/userUtils'
import type { Message } from '../types/chat'

export default function TransferDetail() {
  const { chatId, messageId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)

  // 从路由 state 获取额外信息
  const { characterName = '对方' } = location.state || {}

  useEffect(() => {
    const loadData = async () => {
      if (!chatId || !messageId) return
      
      try {
        const messages = await ensureMessagesLoaded(chatId)
        const msg = messages.find(m => m.id === Number(messageId))
        if (msg) {
          setMessage(msg)
        } else {
          console.error('未找到转账消息')
        }
      } catch (error) {
        console.error('加载消息失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [chatId, messageId])

  if (loading) return <div className="min-h-screen bg-[#ededed]" />
  if (!message || !message.transfer) return <div className="min-h-screen bg-[#ededed] flex items-center justify-center text-gray-500">消息不存在</div>

  const { amount, message: transferMessage, status } = message.transfer
  const isSent = message.type === 'sent'
  const isPending = status === 'pending'
  const isReceived = status === 'received'
  const isExpired = status === 'expired'

  // 处理收款
  const handleReceive = async () => {
    if (!chatId || !message) return
    
    // 获取用户真实名字
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName

    try {
      const messages = await ensureMessagesLoaded(chatId)
      
      // 更新消息状态
      const updatedMessages = messages.map(msg => {
        if (msg.id === message.id) {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'received' as const
            },
            aiReadableContent: `[${userName}领取了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
          }
        }
        return msg
      })

      // 增加余额
      receiveTransfer(amount, characterName, transferMessage || '转账')

      // 创建系统消息
      const systemMsg: Message = {
        id: Date.now() + Math.random(),
        type: 'system',
        content: `已收款 ¥${amount.toFixed(2)}，已存入余额`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system',
        aiReadableContent: `${userName}领取了转账¥${amount.toFixed(2)}，已存入余额`
      }

      const finalMessages = [...updatedMessages, systemMsg]
      
      // 保存到存储
      saveMessages(chatId, finalMessages)
      
      // 更新本地状态
      setMessage({
        ...message,
        transfer: {
          ...message.transfer!,
          status: 'received'
        }
      })
      
      // 可选：显示成功提示
      // alert('收款成功')
    } catch (error) {
      console.error('收款失败:', error)
      alert('收款失败，请重试')
    }
  }

  // 处理退还
  const handleReject = async () => {
    if (!chatId || !message) return
    
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName

    try {
      const messages = await ensureMessagesLoaded(chatId)
      
      // 更新消息状态
      const updatedMessages = messages.map(msg => {
        if (msg.id === message.id) {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'expired' as const
            },
            aiReadableContent: `[${userName}退还了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
          }
        }
        return msg
      })

      // 创建系统消息
      const systemMsg: Message = {
        id: Date.now() + Math.random(),
        type: 'system',
        content: `已退还 ¥${amount.toFixed(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system',
        aiReadableContent: `${userName}退还了转账¥${amount.toFixed(2)}`
      }

      const finalMessages = [...updatedMessages, systemMsg]
      
      // 保存到存储
      saveMessages(chatId, finalMessages)
      
      // 更新本地状态
      setMessage({
        ...message,
        transfer: {
          ...message.transfer!,
          status: 'expired'
        }
      })
    } catch (error) {
      console.error('退还失败:', error)
      alert('操作失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ededed]">
      {/* 顶部导航栏 */}
      <div className="flex items-center px-4 h-14 shrink-0 bg-[#ededed]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-700 hover:bg-black/5 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="ml-2 text-gray-800 font-medium">转账详情</span>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex flex-col items-center pt-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* 图标 */}
        <div className="w-16 h-16 mb-4 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center">
            {isReceived ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-white text-3xl font-bold">¥</span>
            )}
          </div>
        </div>
        
        {/* 状态文字 */}
        <div className="text-gray-600 text-lg mb-6">
          {isPending ? '待收款' : 
           isReceived ? '已收款' : 
           isExpired ? '已退还' : '转账详情'}
        </div>
        
        {/* 金额 */}
        <div className="text-gray-900 text-5xl font-medium mb-8 font-din">
          ¥{amount.toFixed(2)}
        </div>
        
        {/* 备注信息区域 */}
        <div className="w-full mb-auto">
          <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-300">
            <span className="text-gray-500">转账备注</span>
            <span className="text-gray-400">
              {transferMessage && transferMessage.trim() ? transferMessage : '无备注'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">转账时间</span>
            <span className="text-gray-400">
              {new Date(message.timestamp).toLocaleString('zh-CN', {
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="w-full pb-12 pt-6 space-y-4 flex flex-col items-center">
          {/* 只有在待处理状态且不是自己发送的转账才显示操作按钮 */}
          {!isSent && isPending && (
            <>
              {/* 确认收款按钮 */}
              <button
                onClick={handleReceive}
                className="w-full py-3.5 bg-[#07c160] rounded-lg text-white text-base font-medium hover:bg-[#06ad56] active:bg-[#059a4c] transition-colors"
              >
                确认收款
              </button>
              
              {/* 退还链接 */}
              <button
                onClick={handleReject}
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                立即退还
              </button>
            </>
          )}

          {/* 已收款/已退还/已过期 提示 */}
          {!isPending && (
            <div className="text-gray-400 text-sm">
              {isReceived ? '已存入零钱' : 
               isExpired ? '已退还给对方' : ''}
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}
