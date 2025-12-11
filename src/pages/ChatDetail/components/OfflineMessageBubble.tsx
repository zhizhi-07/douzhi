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
  onBranchSelect?: (text: string) => void
}

interface StatusData {
  title?: string
  psychology?: string
  clothing?: string
  action?: string
  location?: string
  desire?: string
  affection?: string
  lust?: string
}

// 解析消息内容，提取状态和分支
const parseMessageContent = (content: string) => {
  let mainContent = content
  let statusData: StatusData | null = null
  let branchOptions: string[] | null = null

  // 1. 提取状态面板 - 使用更直接的匹配方式
  const titleMatch = content.match(/[>]?\s*📌\s*标题[：:]\s*(.+)/m)
  const affectionMatch = content.match(/[>]?\s*💗\s*好感[：:]\s*(\d+)/m)
  const lustMatch = content.match(/[>]?\s*🔥\s*性欲[：:]\s*(\d+)/m)
  const psychologyMatch = content.match(/[>]?\s*💭\s*心理[：:]\s*(.+)/m)
  const clothingMatch = content.match(/[>]?\s*👗\s*服装[：:]\s*(.+)/m)
  const actionMatch = content.match(/[>]?\s*🎭\s*动作[：:]\s*(.+)/m)
  const locationMatch = content.match(/[>]?\s*📍\s*位置[：:]\s*(.+)/m)
  const desireMatch = content.match(/[>]?\s*🖤\s*欲念[：:]\s*(.+)/m)

  if (psychologyMatch || clothingMatch || actionMatch || locationMatch || desireMatch || affectionMatch || titleMatch) {
    statusData = {
      title: titleMatch?.[1]?.trim(),
      affection: affectionMatch?.[1],
      lust: lustMatch?.[1],
      psychology: psychologyMatch?.[1]?.trim(),
      clothing: clothingMatch?.[1]?.trim(),
      action: actionMatch?.[1]?.trim(),
      location: locationMatch?.[1]?.trim(),
      desire: desireMatch?.[1]?.trim()
    }
    // 从正文中移除状态行
    mainContent = mainContent
      .replace(/[>]?\s*📌\s*标题[：:].+/gm, '')
      .replace(/[>]?\s*💗\s*好感[：:].+/gm, '')
      .replace(/[>]?\s*🔥\s*性欲[：:].+/gm, '')
      .replace(/[>]?\s*💭\s*心理[：:].+/gm, '')
      .replace(/[>]?\s*👗\s*服装[：:].+/gm, '')
      .replace(/[>]?\s*🎭\s*动作[：:].+/gm, '')
      .replace(/[>]?\s*📍\s*位置[：:].+/gm, '')
      .replace(/[>]?\s*🖤\s*欲念[：:].+/gm, '')
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
      .filter(line => /^\d+[\.\、]/.test(line)) // 支持 1. 或 1、
      .map(line => line.replace(/^\d+[\.\、]\s*/, '').replace(/\*\*/g, '').trim())
    
    if (options.length > 0) {
      branchOptions = options
    }
    // 从正文中移除分支块
    mainContent = mainContent.replace(branchBlockRegex, '')
  }

  // 清理多余的空行
  mainContent = mainContent.replace(/\n{3,}/g, '\n\n').trim()

  return {
    mainContent,
    statusData,
    branchOptions
  }
}

// 剧情分支组件
const BranchOptions = ({ options, onSelect }: { options: string[], onSelect?: (text: string) => void }) => {
  if (!options || options.length === 0) return null
  
  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => (
        <div 
          key={index}
          className="group cursor-pointer bg-gray-50 hover:bg-white rounded-lg px-4 py-3 border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all duration-300"
          onClick={() => onSelect?.(option)}
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 text-[10px] text-gray-400 font-mono mt-0.5 group-hover:text-pink-400 transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
              {option}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// 状态环组件
const StatusRing = ({ value, color, label }: { value: number, color: string, label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={`${color === 'pink' ? 'text-pink-400' : 'text-red-400'} transition-all duration-1000 ease-out`}
          strokeDasharray={`${value}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${color === 'pink' ? 'text-pink-500' : 'text-red-500'}`}>
        {value}
      </span>
    </div>
    <span className="text-[9px] text-gray-400 transform scale-90">{label}</span>
  </div>
)

const OfflineMessageBubble = ({ message, characterName, characterAvatar, chatId, onBranchSelect }: OfflineMessageBubbleProps) => {
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

  const status = parsedContent.statusData

  return (
    <div className="py-4 w-full">
      {/* 用户消息 - 镜像卡片风格 */}
      {isUser && (
        <div className="w-full bg-[#fffcfc] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden group">
          {/* 1. 头部：镜像布局 */}
          <div className="px-6 pt-6 pb-2 flex flex-row-reverse items-start gap-4">
             {/* 右侧头像 */}
             <div className="relative flex-shrink-0">
                <div className="p-1 bg-white rounded-full shadow-sm border border-gray-100 relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <Avatar
                    type="sent"
                    avatar={userAvatar}
                    name="我"
                    chatId={chatId}
                    size={56}
                  />
                </div>
                {/* 装饰圆点 - 镜像位置 */}
                <div className="absolute top-0 -right-1 w-3 h-3 bg-indigo-200 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 -left-1 w-4 h-4 bg-purple-100 rounded-full opacity-50"></div>
             </div>

             {/* 中间信息 - 靠右对齐 */}
             <div className="flex-1 min-w-0 pt-2 flex flex-col items-end">
                <h3 className="text-base font-bold text-gray-800 tracking-wide">我</h3>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 font-mono">
                  <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-bold">Player</span>
                </div>
             </div>
          </div>

          {/* 2. 内容区域 */}
          <div className="px-6 py-4">
             <div className="text-gray-700 text-[15px] leading-7 text-justify font-sans tracking-wide whitespace-pre-wrap">
               {message.content}
             </div>
          </div>
          
          {/* 底部装饰条 */}
          <div className="h-1 bg-gradient-to-l from-indigo-50 via-white to-purple-50"></div>
        </div>
      )}

      {/* AI消息 - 融合参考图风格 */}
      {!isUser && (
        <div className="w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden group">
          
          {/* 1. 头部：头像 + 信息 + 状态环 */}
          <div className="px-6 pt-6 pb-2 flex items-start gap-4">
             {/* 左侧头像 */}
             <div className="relative flex-shrink-0">
                <div className="p-1 bg-white rounded-full shadow-sm border border-gray-100 relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <Avatar
                    type="received"
                    avatar={characterAvatar}
                    name={characterName}
                    chatId={chatId}
                    size={56} // 略大的头像
                  />
                </div>
                {/* 装饰圆点 */}
                <div className="absolute top-0 -left-1 w-3 h-3 bg-pink-200 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 -right-1 w-4 h-4 bg-blue-100 rounded-full opacity-50"></div>
             </div>

             {/* 中间信息 */}
             <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between">
                  <div className="pt-1">
                    <h3 className="text-base font-bold text-gray-800 tracking-wide">{characterName}</h3>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 font-mono">
                      <span className="bg-pink-50 text-pink-400 px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-bold">Love Story</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* 右侧状态环 - 恢复原始位置 */}
                  {status && (
                    <div className="flex items-center gap-4">
                      <StatusRing value={parseInt(status.affection || '0')} color="pink" label="好感" />
                      <StatusRing value={parseInt(status.lust || '0')} color="red" label="性欲" />
                    </div>
                  )}
                </div>
                
                {/* 标题显示在头部下方 */}
                {status?.title && (
                   <div className="mt-5 relative pl-1">
                     <span className="relative z-10 text-sm font-bold text-gray-800 block flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-pink-400 rounded-full"></span>
                       {status.title}
                     </span>
                   </div>
                )}
             </div>
          </div>

          {/* 2. 内容区域 */}
          <div className="px-6 py-4">
             {chatScreenshot ? (
                <div className="mb-4">
                   <ChatScreenshotCard
                      title={chatScreenshot.title}
                      messages={chatScreenshot.messages}
                      characterName={characterName}
                      characterAvatar={characterAvatar}
                      userAvatar={userAvatar}
                    />
                    {message.content && <div className="mt-4 text-gray-600 text-sm">{message.content.replace(/\[.*?\]/g, '')}</div>}
                </div>
             ) : (
               <div className="space-y-5">
                 {parsedContent.mainContent.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
                    const trimmed = paragraph.trim()

                    // 心理活动：精致的灰色引用块
                    const isThought = /^【.*】$/.test(trimmed) || /^\(.*\)$/.test(trimmed) || /^（.*）$/.test(trimmed) || /^`.*`$/.test(trimmed)
                    if (isThought) {
                      return (
                        <div key={index} className="relative group mx-1 my-2">
                           <div className="bg-gray-50/50 rounded-lg p-3 text-sm text-gray-500 font-serif italic leading-relaxed border-l-2 border-gray-200">
                             {trimmed.replace(/^[`【（(]|[`】）)]$/g, '')}
                           </div>
                        </div>
                      )
                    }

                    // 动作描写：轻量化显示
                    const isAction = /^\*.*\*$/.test(trimmed)
                    if (isAction) {
                       return (
                        <div key={index} className="flex items-center gap-2 text-gray-400 text-xs py-1 px-1">
                          <span className="w-1 h-1 rounded-full bg-pink-300 opacity-60"></span>
                          <span className="italic">{trimmed.replace(/\*/g, '')}</span>
                        </div>
                      )
                    }

                    // 正文
                    return (
                      <p key={index} className="text-gray-700 text-[15px] leading-8 text-justify font-sans tracking-wide">
                        {trimmed}
                      </p>
                    )
                 })} 
               </div>
             )}
          </div>

          {/* 3. 底部精致状态栏 - 极简主义 */}
          {status && (status.location || status.clothing || status.action || status.psychology) && (
            <div className="mx-6 mb-5 pt-4 border-t border-gray-100/60 border-dashed">
                <div className="flex flex-wrap gap-y-3 gap-x-4 text-[11px]">
                   {status.location && (
                     <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                       <span className="text-blue-400">📍</span>
                       <span>{status.location}</span>
                     </div>
                   )}
                   {status.clothing && (
                     <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                       <span className="text-purple-400">👗</span>
                       <span>{status.clothing}</span>
                     </div>
                   )}
                   {status.action && (
                     <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                       <span className="text-amber-400">🎭</span>
                       <span>{status.action}</span>
                     </div>
                   )}
                   {status.psychology && (
                     <div className="w-full mt-1 flex items-start gap-2 text-gray-400 italic">
                       <span className="text-pink-300 mt-0.5">💭</span>
                       <span className="leading-relaxed">{status.psychology}</span>
                     </div>
                   )}
                </div>
            </div>
          )}
          
          {/* 剧情分支 */}
          {parsedContent.branchOptions && (
            <div className="px-6 pb-6">
              <BranchOptions options={parsedContent.branchOptions} onSelect={onBranchSelect} />
            </div>
          )}
          
          {/* 底部装饰条 */}
          <div className="h-1 bg-gradient-to-r from-pink-50 via-white to-blue-50"></div>
        </div>
      )}
    </div>
  )
}

export default OfflineMessageBubble
