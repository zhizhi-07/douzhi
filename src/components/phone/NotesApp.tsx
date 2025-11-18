import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface NotesAppProps {
  content: AIPhoneContent
}

const NotesApp = ({ content }: NotesAppProps) => {
  const [selectedNote, setSelectedNote] = useState<number | null>(null)

  // 显示备忘录详情
  if (selectedNote !== null) {
    const note = content.notes[selectedNote]
    return (
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        {/* 详情页标题栏 */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 pt-3 pb-3 flex items-center justify-between">
            <button onClick={() => setSelectedNote(null)} className="text-blue-500 text-sm">
              返回
            </button>
            <button className="text-blue-500 text-sm">完成</button>
          </div>
        </div>
        
        {/* 详情内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{note.title}</h2>
          <p className="text-xs text-gray-500 mb-4">{note.time}</p>
          <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
        </div>
      </div>
    )
  }

  // 显示备忘录列表
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">备忘录</h1>
          <button className="text-blue-500 text-lg">＋</button>
        </div>
      </div>
      
      {/* 备忘录列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white">
          {content.notes.map((note, index) => (
            <div 
              key={index}
              onClick={() => setSelectedNote(index)}
              className="px-4 py-3 border-b border-gray-200 active:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-semibold text-gray-900 text-base flex-1">{note.title}</h3>
                <span className="text-xs text-gray-500">{note.time}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotesApp
