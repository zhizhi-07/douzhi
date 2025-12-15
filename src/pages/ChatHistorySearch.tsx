/**
 * 聊天记录搜索页面
 * 仿微信设计
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  searchMessages, 
  getMessagesByDate, 
  type SearchResult,
  type DateGroupedMessages 
} from '../utils/chatHistorySearch'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../types/chat'
import Avatar from '../components/Avatar'

type ViewMode = 'default' | 'search' | 'date' | 'date_result'

const ChatHistorySearch = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [viewMode, setViewMode] = useState<ViewMode>('default')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [dateGroups, setDateGroups] = useState<DateGroupedMessages[]>([])
  const [selectedDateGroup, setSelectedDateGroup] = useState<DateGroupedMessages | null>(null)
  const [loading, setLoading] = useState(false)
  const [character, setCharacter] = useState<Character | null>(null)
  
  // 日历相关状态
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // 有消息的日期集合
  const availableDates = useMemo(() => new Set(dateGroups.map(g => g.date)), [dateGroups])
  
  // 加载角色信息
  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      const characters = await getAllCharacters()
      const char = characters.find(c => c.id === id)
      if (char) {
        setCharacter(char)
      }
      // 预加载日期分组（用于日期模式）
      const groups = await getMessagesByDate(id)
      setDateGroups(groups)
    }
    loadData()
  }, [id])
  
  // 搜索
  const handleSearch = useCallback(async (keyword: string) => {
    if (!id || !keyword.trim()) {
      setSearchResults([])
      if (!keyword.trim()) setViewMode('default')
      return
    }
    
    setLoading(true)
    setViewMode('search')
    try {
      const results = await searchMessages(id, keyword, {
        sender: 'all', 
        limit: 100
      })
      setSearchResults(results)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }, [id])
  
  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchKeyword(text)
    if (!text.trim()) {
      setViewMode('default')
      setSearchResults([])
    } else {
      // 防抖搜索
      const timer = setTimeout(() => {
        handleSearch(text)
      }, 300)
      return () => clearTimeout(timer)
    }
  }

  // 高亮匹配文本
  const highlightText = (text: string, start: number, end: number) => {
    if (start < 0 || end > text.length) {
      return <span>{text}</span>
    }
    return (
      <>
        <span>{text.substring(0, start)}</span>
        <span className="text-[#07c160] font-medium">{text.substring(start, end)}</span>
        <span>{text.substring(end)}</span>
      </>
    )
  }
  
  // 跳转到聊天页面并定位到消息
  const handleMessageClick = (messageId: number) => {
    sessionStorage.setItem(`scroll_to_message_${id}`, String(messageId))
    navigate(`/chat/${id}`)
  }

  // 日历相关辅助函数
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const handleNextMonth = () => {
    const now = new Date()
    // 不允许超过当前月份
    if (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() === now.getMonth()) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (availableDates.has(dateStr)) {
      const group = dateGroups.find(g => g.date === dateStr)
      if (group) {
        setSelectedDateGroup(group)
        setViewMode('date_result')
      }
    }
  }

  const renderHeader = () => {
    // 日历视图和日期结果视图显示标题栏
    if (viewMode === 'date' || viewMode === 'date_result') {
      let title = '按日期查找'
      if (viewMode === 'date_result' && selectedDateGroup) {
        title = selectedDateGroup.dateDisplay
      }

      return (
        <div className="bg-[#ededed] pt-[env(safe-area-inset-top)] sticky top-0 z-20 border-b border-[#e5e5e5]">
          <div className="px-4 h-[44px] flex items-center justify-between">
            <button 
              onClick={() => {
                if (viewMode === 'date_result') {
                  setViewMode('date')
                } else {
                  setViewMode('default')
                }
              }}
              className="p-2 -ml-2"
            >
              <svg className="w-6 h-6 text-[#181818]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[17px] font-medium text-[#181818] absolute left-1/2 -translate-x-1/2">
              {title}
            </span>
            <div className="w-10"></div>
          </div>
        </div>
      )
    }

    // 默认视图和搜索视图显示搜索栏
    return (
      <div className="bg-[#ededed] pt-[env(safe-area-inset-top)] sticky top-0 z-20">
        <div className="px-2 py-2 flex items-center">
          <div className="flex-1 relative">
            <div className="bg-white rounded-[6px] flex items-center h-[34px] px-2">
              <svg className="w-[17px] h-[17px] text-[#b2b2b2] mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchKeyword}
                onChange={handleInputChange}
                placeholder="搜索"
                className="flex-1 bg-transparent border-none text-[16px] text-[#000] placeholder-[#8e8e93] focus:outline-none h-full"
                autoFocus={viewMode !== 'default'}
              />
              {searchKeyword && (
                <button
                  onClick={() => {
                    setSearchKeyword('')
                    setViewMode('default')
                    setSearchResults([])
                  }}
                  className="ml-1 flex items-center justify-center"
                >
                  <svg className="w-[17px] h-[17px] text-[#c7c7cc]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="ml-2 text-[#576b95] text-[17px] whitespace-nowrap px-1"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  const renderDefaultView = () => (
    <div className="pt-12 px-8">
      <div className="text-center">
        <div className="text-[#b2b2b2] text-sm mb-8">搜索指定内容</div>
        
        <div className="flex justify-between max-w-[300px] mx-auto mb-8">
          <button 
            onClick={() => setViewMode('date')} 
            className="text-[#576b95] text-[16px] w-1/3 text-center active:opacity-70"
          >
            日期
          </button>
          <button className="text-[#576b95] text-[16px] w-1/3 text-center opacity-40 cursor-not-allowed">
            图片与视频
          </button>
          <button className="text-[#576b95] text-[16px] w-1/3 text-center opacity-40 cursor-not-allowed">
            文件
          </button>
        </div>
        
        <div className="flex justify-between max-w-[300px] mx-auto">
          <button className="text-[#576b95] text-[16px] w-1/3 text-center opacity-40 cursor-not-allowed">
            链接
          </button>
          <button className="text-[#576b95] text-[16px] w-1/3 text-center opacity-40 cursor-not-allowed">
            音乐
          </button>
          <button className="text-[#576b95] text-[16px] w-1/3 text-center opacity-40 cursor-not-allowed">
            交易
          </button>
        </div>
      </div>
    </div>
  )

  const renderSearchResults = () => (
    <div className="bg-white">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#e5e5e5] border-t-[#07c160] rounded-full animate-spin" />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-20 text-[#b2b2b2] text-[15px]">
          未找到与"{searchKeyword}"相关的结果
        </div>
      ) : (
        <div>
          <div className="px-4 py-2 text-xs text-[#b2b2b2] bg-[#f7f7f7]">
            搜索结果 ({searchResults.length})
          </div>
          {searchResults.map((result, index) => (
            <div
              key={`${result.message.id}-${index}`}
              onClick={() => handleMessageClick(result.message.id)}
              className="flex px-4 py-3 border-b border-[#f0f0f0] active:bg-[#f5f5f5] cursor-pointer"
            >
              <div className="w-10 h-10 mr-3 flex-shrink-0">
                <Avatar
                  type={result.message.type === 'sent' ? 'sent' : 'received'}
                  name={result.message.type === 'sent' ? '我' : character?.realName || 'TA'}
                  avatar={result.message.type === 'received' ? character?.avatar : undefined}
                  chatId={id}
                  size={40}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[15px] text-black font-medium truncate">
                    {result.message.type === 'sent' ? '我' : character?.realName || 'TA'}
                  </span>
                  <span className="text-xs text-[#b2b2b2] font-normal">
                    {result.dateDisplay.split('年')[1] || result.dateDisplay}
                  </span>
                </div>
                <div className="text-[14px] text-[#888] truncate">
                  {highlightText(result.matchedText, result.highlightStart, result.highlightEnd)}
                </div>
              </div>
            </div>
          ))}
          <div className="py-6 text-center text-xs text-[#b2b2b2]">
            已显示所有匹配结果
          </div>
        </div>
      )}
    </div>
  )

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const now = new Date()
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    
    // 生成日历网格
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return (
      <div className="bg-white min-h-full flex flex-col">
        {/* 年月切换 */}
        <div className="flex items-center justify-center py-4 text-[17px] font-medium text-[#181818]">
          <button 
            onClick={handlePrevMonth}
            className="p-4 active:opacity-50"
          >
            <svg className="w-4 h-4 text-[#181818]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="mx-8">{year}年{month + 1}月</span>
          <button 
            onClick={handleNextMonth}
            className={`p-4 ${isCurrentMonth ? 'opacity-20 cursor-default' : 'active:opacity-50'}`}
            disabled={isCurrentMonth}
          >
            <svg className="w-4 h-4 text-[#181818]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 星期头 */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-xs text-[#b2b2b2] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-y-2 px-2">
          {days.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasMsg = availableDates.has(dateStr)
            const isToday = isCurrentMonth && day === now.getDate()
            
            return (
              <div key={day} className="flex justify-center items-center aspect-square">
                <button
                  disabled={!hasMsg}
                  onClick={() => handleDateClick(year, month, day)}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-medium transition-colors
                    ${isToday ? 'text-[#07c160]' : ''}
                    ${hasMsg ? 'text-[#181818] active:bg-[#f0f0f0]' : 'text-[#e5e5e5]'}
                  `}
                >
                  {day}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDateResultView = () => {
    if (!selectedDateGroup) return null

    return (
      <div className="bg-white min-h-full">
        {selectedDateGroup.messages.map((msg, index) => (
          <div
            key={`${msg.id}-${index}`}
            onClick={() => handleMessageClick(msg.id)}
            className="flex px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 active:bg-[#f5f5f5] cursor-pointer"
          >
            <div className="w-10 h-10 mr-3 flex-shrink-0">
              <Avatar
                type={msg.type === 'sent' ? 'sent' : 'received'}
                name={msg.type === 'sent' ? '我' : character?.realName || 'TA'}
                avatar={msg.type === 'received' ? character?.avatar : undefined}
                chatId={id}
                size={40}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[15px] text-black font-medium truncate">
                  {msg.type === 'sent' ? '我' : character?.realName || 'TA'}
                </span>
                <span className="text-xs text-[#b2b2b2]">{new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-[14px] text-[#888] line-clamp-2 break-all">
                {msg.content || (msg.messageType ? `[${msg.messageType}]` : '[消息]')}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto bg-white">
        {viewMode === 'default' && renderDefaultView()}
        {viewMode === 'search' && renderSearchResults()}
        {viewMode === 'date' && renderCalendarView()}
        {viewMode === 'date_result' && renderDateResultView()}
      </div>
    </div>
  )
}

export default ChatHistorySearch
