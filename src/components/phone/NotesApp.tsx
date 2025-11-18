import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface NotesAppProps {
  content: AIPhoneContent
}

const NotesApp = ({ content }: NotesAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">备忘录</h2>
        <p className="text-xs text-gray-500 mt-1">{content.notes.length} 条备忘</p>
      </div>
      
      {/* 备忘录列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {content.notes.map((note, index) => (
          <div 
            key={index}
            className="bg-gradient-to-br from-yellow-100/60 to-yellow-50/40 backdrop-blur-md rounded-2xl p-4 border border-yellow-200/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">{note.title}</h3>
              <span className="text-xs text-gray-500">{note.time}</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotesApp
