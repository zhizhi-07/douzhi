import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { ChevronLeft } from 'lucide-react'

interface NotesAppProps {
  content: AIPhoneContent
}

const NotesApp = ({ content }: NotesAppProps) => {
  const [selectedNote, setSelectedNote] = useState<number | null>(null)

  // 详情页 - 仿iOS备忘录风格
  if (selectedNote !== null) {
    const note = content.notes[selectedNote]
    return (
      <div className="w-full h-full bg-[#FDFBF7] flex flex-col relative">
        {/* 顶部导航栏 - 透明背景 */}
        <div className="px-4 pt-2 pb-2 flex items-center justify-between z-10">
          <button 
            onClick={() => setSelectedNote(null)} 
            className="flex items-center text-[#D4A017] active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={28} />
            <span className="text-lg font-medium -ml-1">备忘录</span>
          </button>
          <div className="flex gap-4">
            <button className="text-[#D4A017] active:opacity-60 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="text-[#D4A017] active:opacity-60 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 详情内容 - 纸张纹理 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 py-4 min-h-full">
            <div className="text-xs text-gray-400 text-center mb-6 font-medium">
              {note.time}
            </div>
            
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4 leading-tight">
              {note.title}
            </h2>
            
            <div className="text-base text-[#4A4A4A] whitespace-pre-wrap leading-relaxed font-sans tracking-wide">
              {note.content}
            </div>
            
            {/* 底部留白 */}
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    )
  }

  // 列表页 - 仿iOS备忘录
  return (
    <div className="w-full h-full bg-[#F2F2F7] flex flex-col absolute inset-0">
      {/* 顶部大标题 */}
      <div className="px-4 pt-10 pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-black mb-2">备忘录</h1>
        {/* 搜索框 */}
        <div className="bg-[#E3E3E8] rounded-xl px-3 py-2 flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-gray-500 text-sm">搜索</span>
        </div>
      </div>

      {/* 列表内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
          {content.notes.map((note, index) => (
            <div 
              key={index}
              onClick={() => setSelectedNote(index)}
              className={`
                pl-4 pr-4 py-3 cursor-pointer active:bg-gray-50 transition-colors
                ${index !== content.notes.length - 1 ? 'border-b border-gray-100' : ''}
              `}
            >
              <h3 className="font-semibold text-black text-base mb-1 truncate">
                {note.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {note.time.split(' ')[0]}
                </span>
                <p className="text-sm text-gray-500 line-clamp-1 truncate">
                  {note.content}
                </p>
              </div>
            </div>
          ))}
          
          {content.notes.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              暂无备忘录
            </div>
          )}
        </div>
        
        <div className="text-center text-xs text-gray-400 mb-4">
          {content.notes.length} 个备忘录
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="bg-[#F2F2F7]/80 backdrop-blur-md border-t border-gray-300/50 px-4 py-3 flex justify-between items-center">
        <button className="text-[#D4A017] active:opacity-60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        </button>
        <button className="text-[#D4A017] active:opacity-60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </button>
      </div>
    </div>
  )
}

export default NotesApp
