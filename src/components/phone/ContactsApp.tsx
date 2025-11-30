import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ContactsAppProps {
  content: AIPhoneContent
}

const ContactsApp = ({ content }: ContactsAppProps) => {
  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative absolute inset-0">
      {/* 顶部标题栏 */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <button className="text-[#007AFF] text-[17px]">群组</button>
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
              className="py-3 border-b border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[17px] text-black">{contact.name}</div>
                <div className="text-[13px] text-gray-500 mt-0.5">{contact.relation}</div>
              </div>
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
