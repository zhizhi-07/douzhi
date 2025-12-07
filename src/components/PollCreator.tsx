/**
 * 投票创建器组件
 * 仿原生风格设计
 */

import { useState } from 'react'

interface PollCreatorProps {
  onClose: () => void
  onSubmit: (title: string, options: string[]) => void
}

const PollCreator = ({ onClose, onSubmit }: PollCreatorProps) => {
  const [title, setTitle] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.trim())
    if (!title.trim()) {
      alert('请输入投票标题')
      return
    }
    // 允许0选项发布，群成员可以自己添加
    onSubmit(title.trim(), validOptions)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#f7f7f7] w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all">
        {/* 头部导航 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 rounded-t-2xl">
          <button 
            onClick={onClose}
            className="text-gray-500 text-sm font-medium hover:text-gray-900 px-2 py-1"
          >
            取消
          </button>
          <div className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
            <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            发起投票
          </div>
          <button 
            onClick={handleSubmit}
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
              title.trim()
                ? 'bg-[#07c160] text-white shadow-sm hover:bg-[#06ad56]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!title.trim()}
          >
            发布
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 标题输入 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="投票标题"
              rows={2}
              className="w-full text-lg font-medium placeholder-gray-400 resize-none outline-none bg-transparent"
            />
          </div>
          
          {/* 选项列表 */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 ml-2 mb-1">选项</div>
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center p-3 group">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center mr-3 text-gray-300 text-xs font-medium bg-gray-50">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                    className="flex-1 text-base outline-none bg-transparent placeholder-gray-300"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {/* 添加选项按钮 */}
              <button
                type="button"
                onClick={addOption}
                className="w-full py-3.5 text-[#576b95] font-medium hover:bg-gray-50 transition-colors flex items-center px-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加选项
              </button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 pb-4">
            最多支持10个选项 • 可单选
          </div>
        </div>
      </div>
    </div>
  )
}

export default PollCreator
