import React from 'react'

interface ChatMessage {
  type: 'sent' | 'received'
  content: string
  time?: string
  isImage?: boolean
  imageDescription?: string
}

interface ChatScreenshotCardProps {
  title: string  // 聊天标题，如"和豆汁儿的聊天"
  messages: ChatMessage[]
  characterName?: string
  characterAvatar?: string
  userAvatar?: string  // 用户头像
}

/**
 * 解析AI生成的聊天截图格式
 * 格式如：[和XXX的聊天] [对方消息|{{对方头像}}|内容|时间] [我的消息|内容|时间]
 */
export const parseChatScreenshot = (text: string): { title: string; messages: ChatMessage[]; lastTime?: string } | null => {
  // 检测是否包含聊天截图格式
  const titleMatch = text.match(/\[和(.+?)的聊天\]/)
  if (!titleMatch) return null

  const title = `和${titleMatch[1]}的聊天`
  const messages: ChatMessage[] = []
  let lastTime: string | undefined

  // 🔥 AI视角的聊天截图（AI在看自己的手机）：
  // - "对方消息" = 用户发的 → AI收到的 → 左边白色 + 用户头像 → type: 'received'
  // - "我的消息" = AI自己发的 → 右边绿色 + AI头像 → type: 'sent'
  
  // 匹配对方消息（用户发的，AI收到的）
  const receivedPattern = /\[对方消息\|(?:\{\{对方头像\}\}\|)?([^\|\]]*?)(?:\|(\d{1,2}:\d{2}))?\]/g
  let match
  while ((match = receivedPattern.exec(text)) !== null) {
    const content = match[1]?.trim()
    const time = match[2]
    
    // 跳过空内容或只有头像占位符的
    if (content && content !== '{{对方头像}}' && content.length > 0) {
      messages.push({
        type: 'received',  // 🔥 对方消息 = 用户发的 = 左边白色 + 用户头像
        content,
        time
      })
      if (time) lastTime = time
    }
  }

  // 匹配我的消息（AI发的）
  const sentPattern = /\[我的消息\|([^\|\]]+?)(?:\|(\d{1,2}:\d{2}))?\]/g
  while ((match = sentPattern.exec(text)) !== null) {
    const content = match[1]?.trim()
    if (content) {
      messages.push({
        type: 'sent',  // 🔥 我的消息 = AI发的 = 右边绿色 + AI头像
        content,
        time: match[2]
      })
      if (match[2]) lastTime = match[2]
    }
  }

  // 匹配图片描述：[图片：描述] 或 ╔═══ [图片：描述] ═══╝
  // 🔥 判断图片属于谁：看图片前面是"对方消息"还是"我的消息"
  const imagePattern = /\[图片[：:]\s*([^\]]+)\]/g
  while ((match = imagePattern.exec(text)) !== null) {
    // 查找图片前面最近的消息标识
    const beforeText = text.substring(0, match.index)
    const lastReceivedIndex = beforeText.lastIndexOf('[对方消息')
    const lastSentIndex = beforeText.lastIndexOf('[我的消息')
    
    // 如果"对方消息"在后面（更近），说明图片是用户发的（AI收到的）
    const isFromUser = lastReceivedIndex > lastSentIndex
    
    messages.push({
      type: isFromUser ? 'received' : 'sent',  // 🔥 对方=用户=左边, 我=AI=右边
      content: match[1].trim(),
      isImage: true,
      imageDescription: match[1].trim()
    })
  }

  // 匹配单独的时间戳 [13:24] 或 ═══[13:24]
  const timePattern = /[═╚╝\s]*\[(\d{1,2}:\d{2})\]/g
  while ((match = timePattern.exec(text)) !== null) {
    lastTime = match[1]
    // 把时间附加到最后一条消息上
    if (messages.length > 0 && !messages[messages.length - 1].time) {
      messages[messages.length - 1].time = match[1]
    }
  }

  // 如果没有解析到任何消息，返回null
  if (messages.length === 0) return null

  return { title, messages, lastTime }
}

/**
 * 检测文本是否是聊天截图格式
 */
export const isChatScreenshotFormat = (text: string): boolean => {
  return /\[和.+?的聊天\]/.test(text) && 
         (/\[对方消息\|/.test(text) || /\[我的消息\|/.test(text))
}

/**
 * 手机聊天截图卡片组件
 */
const ChatScreenshotCard: React.FC<ChatScreenshotCardProps> = ({
  title,
  messages,
  characterName,
  characterAvatar,
  userAvatar
}) => {
  return (
    <div className="w-full max-w-[280px] bg-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {/* 手机顶部状态栏 */}
      <div className="bg-gray-800 text-white px-3 py-1 flex justify-between items-center text-xs">
        <span>12:34</span>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3C6.95 3 3 6.95 3 12s3.95 9 9 9 9-3.95 9-9-3.95-9-9-9z"/>
          </svg>
          <span>100%</span>
        </div>
      </div>
      
      {/* 聊天标题栏 */}
      <div className="bg-gray-200 px-3 py-2 flex items-center gap-2 border-b border-gray-300">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-gray-800">{title.replace(/^和|的聊天$/g, '') || characterName}</span>
        </div>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>

      {/* 聊天内容区域 */}
      <div className="bg-[#ededed] px-3 py-3 space-y-2 min-h-[100px]">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'} items-end gap-1`}
          >
            {/* 用户头像（显示在左边，用户发的消息） */}
            {msg.type === 'received' && (
              <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 bg-gray-300">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                )}
              </div>
            )}
            
            {/* 消息气泡 */}
            <div className={`max-w-[70%] ${msg.type === 'sent' ? 'order-first' : ''}`}>
              {msg.isImage ? (
                // 图片消息
                <div className="bg-white rounded-md p-1 shadow-sm">
                  <div className="bg-gray-200 rounded w-32 h-24 flex items-center justify-center">
                    <div className="text-center p-2">
                      <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] text-gray-500 leading-tight block">{msg.imageDescription}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // 文字消息
                <div 
                  className={`px-2.5 py-1.5 rounded-md text-sm shadow-sm ${
                    msg.type === 'sent' 
                      ? 'bg-[#95ec69] text-gray-800' 
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              )}
              {/* 时间戳 */}
              {msg.time && (
                <div className={`text-[10px] text-gray-400 mt-0.5 ${msg.type === 'sent' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </div>
              )}
            </div>

            {/* AI头像（显示在右边，AI发的消息） */}
            {msg.type === 'sent' && (
              <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 bg-gray-300">
                {characterAvatar ? (
                  <img src={characterAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部输入栏 */}
      <div className="bg-gray-200 px-2 py-2 flex items-center gap-2 border-t border-gray-300">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <div className="flex-1 bg-white rounded-md h-7" />
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    </div>
  )
}

export default ChatScreenshotCard
