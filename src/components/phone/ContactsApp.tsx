import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ContactsAppProps {
  content: AIPhoneContent
}

const ContactsApp = ({ content }: ContactsAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">通讯录</h1>
        </div>
        {/* 搜索框 */}
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="text-sm text-gray-400">搜索</span>
          </div>
        </div>
      </div>
      
      {/* 联系人列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white">
          {content.contacts.map((contact, index) => (
            <div 
              key={index}
              className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 active:bg-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-medium text-gray-700">{contact.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{contact.name}</div>
                <div className="text-sm text-gray-500">{contact.relation}</div>
                {contact.notes && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">📞 {contact.notes}</div>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContactsApp
