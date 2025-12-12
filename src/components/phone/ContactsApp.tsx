import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ContactsAppProps {
  content: AIPhoneContent
  onBack?: () => void
}

const ContactsApp = ({ content, onBack }: ContactsAppProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative absolute inset-0">
      {/* 顶部标题栏 */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-[1000]">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-[#007AFF] text-[17px] flex items-center gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回
          </button>
          <button className="text-[#007AFF] text-[17px] font-medium">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <h1 className="text-[34px] font-bold text-black tracking-tight mb-2">通讯录</h1>

        {/* 搜索框 */}
        <div className="bg-[#767680]/10 rounded-[10px] h-9 flex items-center px-2 gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <span className="text-[17px] text-gray-500">搜索</span>
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="flex-1 overflow-y-auto bg-white px-4">
        {/* 我的名片 */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-100">
          <div className="w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center text-xl font-medium text-gray-600">
            {content.characterName?.[0] || '我'}
          </div>
          <div className="flex-1">
            <div className="text-[20px] font-semibold text-black">{content.characterName}</div>
            <div className="text-[13px] text-gray-500">我的名片</div>
          </div>
        </div>

        {/* 列表 */}
        <div className="mt-2">
          {content.contacts.map((contact, index) => (
            <div
              key={index}
              className="border-b border-gray-100 active:bg-gray-50 transition-all"
            >
              {/* 主行 - 可点击 */}
              <div
                className="py-3 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                {/* 头像 */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[17px] text-black">{contact.name}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{contact.relation}</div>
                </div>
                {/* 展开箭头 */}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 展开详情 - 通话记录 */}
              {expandedIndex === index && (
                <div className="pb-3 pl-[52px] pr-3 animate-in slide-in-from-top-2 duration-200">
                  {/* 电话号码 */}
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-[15px] text-[#007AFF]">{contact.phone}</span>
                  </div>

                  {/* 通话记录/备注 */}
                  {contact.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[11px] text-gray-500 font-medium">最近通话记录</span>
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed">{contact.notes}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3 mt-3">
                    <button className="flex-1 py-2 bg-[#007AFF] text-white rounded-lg text-[14px] font-medium">
                      呼叫
                    </button>
                    <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-medium">
                      发消息
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-8 text-gray-400 text-[13px]">
          {content.contacts.length} 位联系人
        </div>
      </div>

      {/* 侧边索引栏 (模拟) */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 text-[8px] text-[#007AFF] font-medium select-none z-20">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'].map(char => (
          <div key={char} className="w-4 text-center">{char}</div>
        ))}
      </div>
    </div>
  )
}

export default ContactsApp
