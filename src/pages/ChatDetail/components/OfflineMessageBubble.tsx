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

// 剧情分支组件 - 文艺风格
const BranchOptions = ({ options, onSelect }: { options: string[], onSelect?: (text: string) => void }) => {
  if (!options || options.length === 0) return null
  
  return (
    <div className="flex flex-col gap-3">
      {options.map((option, index) => (
        <div 
          key={index}
          className="group cursor-pointer bg-white/60 hover:bg-white rounded-lg px-5 py-4 border border-gray-100/80 hover:border-pink-200/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 relative overflow-hidden"
          onClick={() => onSelect?.(option)}
        >
          {/* 装饰线 */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 group-hover:bg-pink-300 transition-colors duration-500" />
          
          <div className="flex items-baseline gap-4">
            <span className="flex-shrink-0 text-xs font-serif italic text-gray-300 group-hover:text-pink-400 transition-colors duration-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-[15px] font-serif text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors tracking-wide">
              {option}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

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
                <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                   <div className="p-0.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                     <Avatar
                       type="sent"
                       avatar={userAvatar}
                       name="我"
                       chatId={chatId}
                       size={56}
                     />
                   </div>
                </div>
                {/* 装饰光晕 - 镜像位置 */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-100/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-purple-100/50 rounded-full blur-md opacity-60"></div>
             </div>

             {/* 中间信息 - 靠右对齐 */}
             <div className="flex-1 min-w-0 pt-2 flex flex-col items-end">
                <h3 className="text-base font-bold text-gray-800 tracking-wide font-serif">我</h3>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 font-serif">
                  <span className="italic">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="bg-indigo-50/50 text-indigo-400 border border-indigo-100 px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-medium">Player</span>
                </div>
             </div>
          </div>

          {/* 2. 内容区域 */}
          <div className="px-6 py-4">
             <div className="text-gray-700 text-[15px] leading-7 text-justify font-serif tracking-wide whitespace-pre-wrap">
               {message.content}
             </div>
          </div>
          
          {/* 底部装饰条 */}
          <div className="h-0.5 bg-gradient-to-l from-indigo-50 via-gray-100 to-white"></div>
        </div>
      )}

      {/* AI消息 - 融合参考图风格 */}
      {!isUser && (
        <div className="w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden group">
          
          {/* 1. 头部：头像 + 信息 + 状态环 */}
          <div className="px-6 pt-6 pb-2 flex items-start gap-4">
             {/* 左侧头像 */}
             <div className="relative flex-shrink-0">
                <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                   <div className="p-0.5 bg-white rounded-full shadow-sm border border-gray-100">
                     <Avatar
                       type="received"
                       avatar={characterAvatar}
                       name={characterName}
                       chatId={chatId}
                       size={56} // 略大的头像
                     />
                   </div>
                </div>
                {/* 装饰光晕 */}
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-pink-100/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-100/50 rounded-full blur-md opacity-60"></div>
             </div>

             {/* 中间信息 */}
             <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between">
                  <div className="pt-1">
                    <h3 className="text-base font-bold text-gray-800 tracking-wide font-serif">{characterName}</h3>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 font-serif">
                      <span className="bg-pink-50/50 text-pink-400 border border-pink-100 px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase font-medium">Love Story</span>
                      <span className="italic">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
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
                      <p key={index} className="text-gray-700 text-[15px] leading-8 text-justify font-serif tracking-wide">
                        {trimmed}
                      </p>
                    )
                 })} 
               </div>
             )}
          </div>

          {/* 3. 底部精致状态面板 - 文艺高级风格 */}
          {status && (
            <div className="mx-6 mb-8 mt-4">
              <div className="relative overflow-hidden rounded-lg border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all hover:bg-white/60 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] group/panel">
                {/* 艺术背景流光 */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-100/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover/panel:opacity-80" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover/panel:opacity-80" />
                
                <div className="relative z-10 px-6 py-6 space-y-7">
                   {/* 顶部：标题与核心指标 */}
                   <div className="space-y-5">
                     {status.title && (
                       <div className="flex flex-col items-center gap-3 pb-2">
                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                         <h4 className="text-lg font-serif font-medium tracking-[0.2em] text-gray-800 text-center">
                           {status.title}
                         </h4>
                         <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                       </div>
                     )}

                     {/* 指标条 - 极细艺术风格 */}
                     <div className="grid grid-cols-2 gap-8 px-2">
                        <div className="space-y-2 group/bar">
                          <div className="flex justify-between items-end text-[10px] tracking-widest text-gray-400 uppercase font-medium">
                            <span>Affection</span>
                            <span className="font-serif text-gray-600 text-xs">{status.affection || 0}%</span>
                          </div>
                          <div className="h-0.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400/80 w-0 transition-all duration-1000 group-hover/bar:bg-rose-500 ease-out" style={{ width: `${Math.min(parseInt(status.affection || '0'), 100)}%` }} />
                          </div>
                        </div>
                        <div className="space-y-2 group/bar">
                          <div className="flex justify-between items-end text-[10px] tracking-widest text-gray-400 uppercase font-medium">
                            <span>Lust</span>
                            <span className="font-serif text-gray-600 text-xs">{status.lust || 0}%</span>
                          </div>
                          <div className="h-0.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-red-800/60 w-0 transition-all duration-1000 group-hover/bar:bg-red-800 ease-out" style={{ width: `${Math.min(parseInt(status.lust || '0'), 100)}%` }} />
                          </div>
                        </div>
                     </div>
                   </div>

                   {/* 中部：状态矩阵 - 杂志排版 */}
                   {(status.location || status.clothing || status.action) && (
                     <div className="grid grid-cols-1 gap-px bg-gray-200/40 rounded-lg overflow-hidden border border-white/50">
                       {status.location && (
                         <div className="bg-white/30 p-3.5 flex items-baseline gap-4 backdrop-blur-sm hover:bg-white/60 transition-colors duration-300">
                           <span className="text-[9px] uppercase tracking-widest text-gray-400 w-12 flex-shrink-0 font-medium text-right">Loc</span>
                           <span className="text-sm font-serif text-gray-700 tracking-wide">{status.location}</span>
                         </div>
                       )}
                       {status.clothing && (
                         <div className="bg-white/30 p-3.5 flex items-baseline gap-4 backdrop-blur-sm hover:bg-white/60 transition-colors duration-300">
                           <span className="text-[9px] uppercase tracking-widest text-gray-400 w-12 flex-shrink-0 font-medium text-right">Wear</span>
                           <span className="text-sm font-serif text-gray-700 tracking-wide">{status.clothing}</span>
                         </div>
                       )}
                       {status.action && (
                         <div className="bg-white/30 p-3.5 flex items-baseline gap-4 backdrop-blur-sm hover:bg-white/60 transition-colors duration-300">
                           <span className="text-[9px] uppercase tracking-widest text-gray-400 w-12 flex-shrink-0 font-medium text-right">Act</span>
                           <span className="text-sm font-serif text-gray-700 tracking-wide leading-relaxed">{status.action}</span>
                         </div>
                       )}
                     </div>
                   )}

                   {/* 心理活动 - 留白设计 */}
                   {status.psychology && (
                      <div className="relative py-2 pl-4 border-l border-gray-300 mx-1">
                         <p className="font-serif text-[13px] text-gray-600 italic leading-loose opacity-90">
                           {status.psychology}
                         </p>
                      </div>
                   )}

                   {/* 欲念 - 深沉暗夜风 */}
                   {status.desire && (
                     <div className="relative mt-2 overflow-hidden rounded bg-[#1a1a1a] text-gray-300 shadow-inner group/desire">
                       {/* 装饰字 */}
                       <div className="absolute -top-2 -right-2 p-4 opacity-5 font-serif text-5xl italic leading-none pointer-events-none select-none">
                         Desire
                       </div>
                       
                       <div className="relative z-10 p-5 space-y-3">
                         <div className="flex items-center gap-2">
                           <span className="w-1 h-1 bg-red-900 rounded-full animate-pulse"></span>
                           <span className="text-[9px] tracking-[0.3em] uppercase text-red-900/80 font-bold">Secret</span>
                         </div>
                         <p className="font-serif text-sm leading-relaxed text-gray-400/90 tracking-wide text-justify group-hover/desire:text-gray-300 transition-colors duration-500">
                           {status.desire}
                         </p>
                       </div>
                     </div>
                   )}
                </div>
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
