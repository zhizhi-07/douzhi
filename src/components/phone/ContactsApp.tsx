import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ContactsAppProps {
  content: AIPhoneContent
}

const ContactsApp = ({ content }: ContactsAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">通讯录</h2>
        <p className="text-xs text-gray-500 mt-1">{content.contacts.length} 位联系人</p>
      </div>
      
      {/* 联系人列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {content.contacts.map((contact, index) => (
          <div 
            key={index}
            className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-700">{contact.name[0]}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{contact.name}</div>
                <div className="text-xs text-gray-500">{contact.relation}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <div>{contact.phone}</div>
              {contact.notes && (
                <div className="text-xs text-gray-400 mt-1">{contact.notes}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContactsApp
