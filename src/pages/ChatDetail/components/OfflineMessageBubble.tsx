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
  const affectionMatch = content.match(/[>]?\s*💗\s*好感[：:]\s*(\d+)/m)
  const lustMatch = content.match(/[>]?\s*🔥\s*性欲[：:]\s*(\d+)/m)
  const psychologyMatch = content.match(/[>]?\s*💭\s*心理[：:]\s*(.+)/m)
  const clothingMatch = content.match(/[>]?\s*👗\s*服装[：:]\s*(.+)/m)
  const actionMatch = content.match(/[>]?\s*🎭\s*动作[：:]\s*(.+)/m)
  const locationMatch = content.match(/[>]?\s*📍\s*位置[：:]\s*(.+)/m)
  const desireMatch = content.match(/[>]?\s*🖤\s*欲念[：:]\s*(.+)/m)

  if (psychologyMatch || clothingMatch || actionMatch || locationMatch || desireMatch || affectionMatch) {
    statusData = {
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

// 状态卡片组件 - 杂志海报风格
const StatusCard = ({ data }: { data: StatusData }) => {
  if (!data) return null
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 颜色定义
  const affection = parseInt(data.affection || '0')
  const lust = parseInt(data.lust || '0')
  
  // Mini HUD (收起状态) - 精致票据挂件
  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="mt-6 mx-auto w-fit cursor-pointer group select-none relative"
      >
        {/* 票据主体 */}
        <div className="flex items-stretch bg-[#f8f5f2] border border-gray-200 shadow-sm rounded-sm overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:shadow-lg">
          {/* 左侧：条形码装饰 */}
          <div className="bg-gray-800 w-8 flex flex-col items-center justify-center gap-1 py-2">
            <div className="w-0.5 h-3 bg-white/50" />
            <div className="writing-vertical-rl text-[10px] text-white/90 font-serif tracking-widest transform rotate-180">档案</div>
            <div className="w-0.5 h-3 bg-white/50" />
          </div>

          {/* 中间：文字信息 */}
          <div className="px-5 py-2 flex flex-col justify-center min-w-[140px]">
             <div className="text-[10px] text-gray-400 font-bold tracking-widest mb-1.5">当前状态</div>
             <div className="flex items-center gap-3">
               <span className="font-serif text-gray-800 text-sm font-medium">{data.psychology?.split(/[,，]/)[0] || '未知'}</span>
               <div className="w-px h-3 bg-gray-300" />
               <span className="font-serif text-gray-500 text-xs italic">{data.location?.split(/[,，]/)[0] || '未知'}</span>
             </div>
          </div>

          {/* 右侧：数值环 */}
          <div className="bg-white border-l border-gray-100 px-4 py-2 flex items-center gap-4">
             {/* 好感度环 */}
             <div className="flex flex-col items-center gap-1">
               <div className="relative w-9 h-9 rounded-full border-2 border-pink-50 flex items-center justify-center">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                   <circle cx="16" cy="16" r="14" fill="none" stroke="#fbcfe8" strokeWidth="2.5" />
                   <circle cx="16" cy="16" r="14" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeDasharray={`${affection * 0.88}, 100`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                 </svg>
                 <span className="text-[10px] font-bold text-pink-500">{affection}</span>
               </div>
               <span className="text-[9px] text-gray-400 font-medium">好感</span>
             </div>

             {/* 性欲值环 */}
             <div className="flex flex-col items-center gap-1">
               <div className="relative w-9 h-9 rounded-full border-2 border-red-50 flex items-center justify-center">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                   <circle cx="16" cy="16" r="14" fill="none" stroke="#fee2e2" strokeWidth="2.5" />
                   <circle cx="16" cy="16" r="14" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray={`${lust * 0.88}, 100`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                 </svg>
                 <span className="text-[10px] font-bold text-red-500">{lust}</span>
               </div>
               <span className="text-[9px] text-gray-400 font-medium">性欲</span>
             </div>
          </div>
        </div>
        
        {/* 底部撕纸装饰 */}
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCA0IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCA0IEw1IDAgTDEwIDQgTDE1IDAgTDIwIDQgWiIgZmlsbD0iI2Y4ZjVmMiIvPjwvc3ZnPg==')] bg-repeat-x opacity-100" />
      </div>
    )
  }
  
  // 完整海报 (展开状态)
  return (
    <div className="mt-8 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
      <div className="relative w-full max-w-sm mx-auto bg-[#fdfbf7] shadow-2xl rounded-sm overflow-hidden transform transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
        
        {/* 顶部：海报 Header */}
        <div className="relative h-24 bg-gray-900 flex items-end justify-between p-5 overflow-hidden group">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent transition-opacity duration-1000 group-hover:opacity-30" />
          <div className="relative z-10">
             <div className="text-[10px] font-mono text-gray-400 tracking-[0.2em] mb-1.5 opacity-80">CONFIDENTIAL // RECORD</div>
             <h3 className="text-3xl font-serif text-white font-bold tracking-tight italic">STATUS REPORT</h3>
          </div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-white transition-colors mb-1 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* 左侧：能量槽侧边栏 */}
          <div className="w-16 bg-gray-50/80 border-r border-gray-200 flex flex-col items-center py-6 gap-6">
            {/* 好感槽 */}
            <div className="flex flex-col items-center gap-2 h-32 group">
               <div className="relative flex-1 w-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                 <div 
                   className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-600 to-pink-300 transition-all duration-1000 ease-out group-hover:brightness-110"
                   style={{ height: `${affection}%` }}
                 />
               </div>
               <span className="text-xs font-bold text-pink-500 font-mono">{affection}</span>
               <span className="text-[10px] text-gray-400 font-medium writing-vertical-rl tracking-widest">好感</span>
            </div>

            {/* 性欲槽 */}
            <div className="flex flex-col items-center gap-2 h-32 mt-2 group">
               <div className="relative flex-1 w-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                 <div 
                   className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 to-red-400 transition-all duration-1000 ease-out group-hover:brightness-110"
                   style={{ height: `${lust}%` }}
                 />
               </div>
               <span className="text-xs font-bold text-red-500 font-mono">{lust}</span>
               <span className="text-[10px] text-gray-400 font-medium writing-vertical-rl tracking-widest">性欲</span>
            </div>
          </div>

          {/* 右侧：内容区 */}
          <div className="flex-1 p-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
            
            {/* 装饰线条 */}
            <div className="w-full h-px bg-gray-800 mb-6 opacity-10" />

            <div className="space-y-6">
              {data.psychology && (
                <div className="group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">心理活动</span>
                  </div>
                  <p className="font-serif text-gray-800 text-sm leading-relaxed pl-4 border-l-2 border-gray-200 group-hover:border-blue-200 transition-colors">
                    {data.psychology}
                  </p>
                </div>
              )}

              {data.action && (
                <div className="group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 group-hover:text-amber-600 transition-colors">当前动作</span>
                  </div>
                  <p className="font-serif text-gray-800 text-sm leading-relaxed pl-4 border-l-2 border-gray-200 group-hover:border-amber-200 transition-colors">
                    {data.action}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {data.clothing && (
                  <div className="group">
                    <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">衣着打扮</div>
                    <p className="font-serif text-gray-700 text-xs leading-relaxed">{data.clothing}</p>
                  </div>
                )}
                {data.location && (
                  <div className="group">
                    <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">当前位置</div>
                    <p className="font-serif text-gray-700 text-xs leading-relaxed">{data.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部欲念封条 */}
            {data.desire && (
              <div className="mt-8 relative group cursor-help select-none">
                {/* 黑色胶带 */}
                <div className="absolute inset-0 bg-gray-900 transform -skew-x-2 group-hover:skew-x-0 group-hover:translate-y-[110%] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 flex items-center justify-center overflow-hidden shadow-lg border border-gray-800">
                   <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#fff,#fff_2px,transparent_2px,transparent_8px)]" />
                   <span className="text-white/90 font-mono text-[10px] tracking-[0.5em] font-bold">禁忌 · 封印</span>
                </div>
                
                {/* 内容 */}
                <div className="bg-red-50 p-3 border border-red-100 min-h-[3.5rem] flex items-center relative rounded-sm">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gray-200/50" />
                   <p className="font-serif text-red-900/90 text-sm italic w-full text-center px-2 leading-relaxed">
                     {data.desire}
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 海报底部装饰 */}
        <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-80" />
      </div>
    </div>
  )
}

// 剧情分支组件 - 视觉小说选项风格
const BranchOptions = ({ options, onSelect }: { options: string[], onSelect?: (text: string) => void }) => {
  if (!options || options.length === 0) return null
  
  return (
    <div className="mt-8 flex flex-col gap-3 px-2">
      <div className="flex items-center gap-2 mb-1 opacity-40 pl-1">
        <div className="h-px w-4 bg-gray-400" />
        <span className="text-[10px] font-serif uppercase tracking-widest text-gray-500">Choices</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      
      {options.map((option, index) => (
        <div 
          key={index}
          className="relative group cursor-pointer"
          onClick={() => onSelect?.(option)}
        >
          {/* 选项背景框 */}
          <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg transform transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-purple-200 group-hover:bg-white" />
          
          {/* 选项内容 */}
          <div className="relative p-4 flex gap-3 items-start">
            <span className="flex-shrink-0 font-serif text-xs text-gray-400 mt-0.5 group-hover:text-purple-400 transition-colors">
              0{index + 1}
            </span>
            <span className="text-sm font-serif text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
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
                  {parsedContent.branchOptions && <BranchOptions options={parsedContent.branchOptions} onSelect={onBranchSelect} />}
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
