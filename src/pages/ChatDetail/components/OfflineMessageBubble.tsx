/**
 * 线下模式消息组件 - 沉浸式小说阅读风格
 */

import { useState, useEffect, useMemo } from 'react'
import { Message } from '../../../types/chat'
import ChatScreenshotCard, { parseChatScreenshot, isChatScreenshotFormat } from '../../../components/ChatScreenshotCard'
import { getAvatar } from '../../../utils/avatarStorage'
import Avatar from '../../../components/Avatar'

interface OfflineMessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar?: string
  chatId?: string
}

interface StatusData {
  psychology?: string
  clothing?: string
  action?: string
  location?: string
  desire?: string
}

// 解析消息内容，提取状态和分支
const parseMessageContent = (content: string) => {
  let mainContent = content
  let statusData: StatusData | null = null
  let branchOptions: string[] | null = null

  // 1. 提取状态面板
  const statusRegex = />\s*([💭👗🎭📍🖤])\s*([^：:]+)[：:]\s*(.+)/g
  const statusMatches = [...content.matchAll(statusRegex)]
  
  if (statusMatches.length > 0) {
    statusData = {}
    statusMatches.forEach(match => {
      const emoji = match[1]
      const value = match[3].trim()
      
      if (emoji === '💭') statusData!.psychology = value
      else if (emoji === '👗') statusData!.clothing = value
      else if (emoji === '🎭') statusData!.action = value
      else if (emoji === '📍') statusData!.location = value
      else if (emoji === '🖤') statusData!.desire = value
    })
    // 从正文中移除状态行
    mainContent = mainContent.replace(statusRegex, '')
  }

  // 2. 提取剧情分支
  // 匹配格式：🛡️ 剧情分支：\n1. xxx\n2. xxx...
  const branchBlockRegex = /🛡️\s*剧情分支[：:]\s*([\s\S]*)$/
  const branchMatch = mainContent.match(branchBlockRegex)
  
  if (branchMatch) {
    const branchText = branchMatch[1]
    const options = branchText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line)) // 只保留数字开头的行
      .map(line => line.replace(/^\d+\.\s*/, '').trim()) // 移除序号
    
    if (options.length > 0) {
      branchOptions = options
    }
    // 从正文中移除分支块
    mainContent = mainContent.replace(branchBlockRegex, '')
  }

  return {
    mainContent: mainContent.trim(),
    statusData,
    branchOptions
  }
}

// 状态卡片组件
const StatusCard = ({ data }: { data: StatusData }) => {
  if (!data) return null
  
  return (
    <div className="mt-4 bg-gray-50/50 rounded-xl p-3 border border-gray-100 text-xs">
      <div className="grid grid-cols-2 gap-3">
        {data.psychology && (
          <div className="col-span-2 sm:col-span-1 flex gap-2 items-start">
            <span className="text-base">💭</span>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">心理</span>
              <span className="text-gray-700">{data.psychology}</span>
            </div>
          </div>
        )}
        {data.action && (
          <div className="col-span-2 sm:col-span-1 flex gap-2 items-start">
            <span className="text-base">🎭</span>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">动作</span>
              <span className="text-gray-700">{data.action}</span>
            </div>
          </div>
        )}
        {data.clothing && (
          <div className="col-span-2 sm:col-span-1 flex gap-2 items-start">
            <span className="text-base">👗</span>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">服装</span>
              <span className="text-gray-700">{data.clothing}</span>
            </div>
          </div>
        )}
        {data.location && (
          <div className="col-span-2 sm:col-span-1 flex gap-2 items-start">
            <span className="text-base">📍</span>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">位置</span>
              <span className="text-gray-700">{data.location}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 欲念 - 独立一行，突出显示 */}
      {data.desire && (
        <div className="mt-3 pt-3 border-t border-gray-100/50 flex gap-2 items-start bg-purple-50/30 -mx-3 px-3 pb-1">
          <span className="text-base mt-2">🖤</span>
          <div className="mt-2">
             <span className="text-purple-300 block text-[10px] uppercase tracking-wider">深层欲念</span>
             <span className="text-gray-800 italic">{data.desire}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 剧情分支组件
const BranchOptions = ({ options }: { options: string[] }) => {
  if (!options || options.length === 0) return null
  
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="text-[10px] text-gray-400 uppercase tracking-widest ml-1 mb-1 flex items-center gap-1">
        <span>🔀</span> 剧情分支
      </div>
      {options.map((option, index) => (
        <div 
          key={index}
          className="px-4 py-3 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition-all duration-300 cursor-pointer flex items-start gap-2 group"
        >
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-medium group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors mt-0.5">
            {index + 1}
          </span>
          <span className="leading-relaxed">{option}</span>
        </div>
      ))}
    </div>
  )
}

const OfflineMessageBubble = ({ message, characterName, characterAvatar, chatId }: OfflineMessageBubbleProps) => {
  const isUser = message.type === 'sent'
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined)
  
  // 解析内容
  const parsedContent = useMemo(() => {
    if (!message.content) return { mainContent: '', statusData: null, branchOptions: null }
    return parseMessageContent(message.content)
  }, [message.content])

  // 从 IndexedDB 异步获取用户头像
  useEffect(() => {
    const loadUserAvatar = async () => {
      const avatar = await getAvatar('user')
      if (avatar) {
        setUserAvatar(avatar)
      }
    }
    loadUserAvatar()
  }, [])

  // 检测是否包含聊天截图格式
  const chatScreenshot = message.content && isChatScreenshotFormat(message.content) 
    ? parseChatScreenshot(message.content) 
    : null

  return (
    <div className={`py-4 w-full flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      
      {/* AI头像 (左侧) */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
           <Avatar
            type="received"
            avatar={characterAvatar}
            name={characterName}
            chatId={chatId}
          />
        </div>
      )}

      {/* 消息内容区域 */}
      <div className={`max-w-[85%] ${isUser ? 'text-right' : 'text-left'}`}>
        
        {/* 用户消息气泡 */}
        {isUser && (
          <div className="inline-block px-4 py-2 bg-[#eef2ff] text-gray-700 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm border border-blue-50/50">
            {message.content}
          </div>
        )}

        {/* AI消息 - 优化后的阅读体验 */}
        {!isUser && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50 shadow-sm transition-all duration-500 hover:shadow-md">
             {/* 名字显示 (可选，增加辨识度) */}
             <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide">{characterName}</div>

             {/* 🔥 如果是聊天截图格式，用卡片渲染 */}
             {chatScreenshot ? (
                <div className="flex flex-col items-center gap-6 my-4">
                  <div className="transform scale-95 origin-center transition-transform hover:scale-100 duration-500 shadow-lg shadow-gray-100 rounded-xl overflow-hidden">
                    <ChatScreenshotCard
                      title={chatScreenshot.title}
                      messages={chatScreenshot.messages}
                      characterName={characterName}
                      characterAvatar={characterAvatar}
                      userAvatar={userAvatar}
                    />
                  </div>
                  
                  {/* 如果有其他内容，也显示出来 */}
                  {message.content && (() => {
                    const remaining = message.content
                      .replace(/\[和.+?的聊天\]/g, '')
                      .replace(/\[对方消息\|[^\]]*\]/g, '')
                      .replace(/\[我的消息\|[^\]]*\]/g, '')
                      .replace(/\[图片[：:][^\]]+\]/g, '')
                      .replace(/\[\d{1,2}:\d{2}\]/g, '')
                      .replace(/[╔═╝╚┌┐└┘│─]+/g, '')
                      .replace(/\{\{对方头像\}\}/g, '')
                      .replace(/\n{3,}/g, '\n\n')
                      .trim()
                    
                    if (remaining && remaining.length > 5) {
                      return (
                        <div className="font-sans text-gray-700 text-[15px] leading-7 tracking-wide mt-4">
                          {remaining.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
                            <p key={index} className="mb-3 last:mb-0 text-justify">{paragraph.trim()}</p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
             ) : (
                <>
                  {/* 正文渲染 */}
                  <div className="font-sans text-gray-700 text-[15px] leading-7 tracking-wide">
                    {parsedContent.mainContent.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
                      const trimmed = paragraph.trim()

                      // 心理描写
                      const isThought = /^【.*】$/.test(trimmed) || /^\(.*\)$/.test(trimmed) || /^（.*）$/.test(trimmed)
                      if (isThought) {
                        return (
                          <div key={index} className="my-3 px-3 py-1.5 bg-gray-50 rounded text-gray-500 italic text-sm border-l-2 border-gray-200">
                            {trimmed}
                          </div>
                        )
                      }

                      // 动作描写
                      const isAction = /^\*.*\*$/.test(trimmed)
                      if (isAction) {
                         return (
                          <p key={index} className="text-gray-500 mb-3 italic text-sm">
                            {trimmed.replace(/\*/g, '')}
                          </p>
                        )
                      }

                      // 普通对白/正文
                      return (
                        <p key={index} className="mb-3 last:mb-0 text-justify">
                          {trimmed}
                        </p>
                      )
                    })}
                  </div>

                  {/* 状态卡片 */}
                  {parsedContent.statusData && <StatusCard data={parsedContent.statusData} />}

                  {/* 剧情分支选项 */}
                  {parsedContent.branchOptions && <BranchOptions options={parsedContent.branchOptions} />}
                </>
             )}
          </div>
        )}
      </div>

      {/* 用户头像 (右侧) */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
           <Avatar
            type="sent"
            avatar={undefined} // 使用默认或从存储获取
            name="我"
            chatId={chatId}
          />
        </div>
      )}
    </div>
  )
}

export default OfflineMessageBubble
