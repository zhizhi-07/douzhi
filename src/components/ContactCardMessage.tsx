/**
 * 名片消息卡片组件
 * 仿微信原生名片样式
 * 
 * 流程：
 * 1. 用户发送名片给当前AI
 * 2. 当前AI可以选择"添加好友"（发送好友申请）
 * 3. 点击刷新按钮，对方AI决定是否同意
 * 4. 用户点击名片可查看两个AI的聊天室
 */

import { useNavigate } from 'react-router-dom'
import { Message } from '../types/chat'
import { playSystemSound } from '../utils/soundManager'

interface ContactCardMessageProps {
  message: Message
  currentCharacterId: string  // 当前聊天的AI角色ID
  currentCharacterName: string
}

const ContactCardMessage = ({
  message,
  currentCharacterId,
  currentCharacterName
}: ContactCardMessageProps) => {
  const navigate = useNavigate()
  const contactCard = message.contactCard

  if (!contactCard) return null

  const friendStatus = contactCard.friendStatus
  const requestSent = contactCard.requestSentByAI
  const verificationMessage = contactCard.verificationMessage

  // 状态文字
  const getStatusText = () => {
    if (!requestSent) return null
    if (friendStatus === 'pending') return '好友申请中'
    if (friendStatus === 'accepted') return '已成为好友'
    if (friendStatus === 'rejected') return '对方已拒绝'
    return null
  }

  return (
    <>
      <div
        onClick={() => {
          playSystemSound()
          // 跳转到AI私信聊天页面
          const params = new URLSearchParams({
            aiId: currentCharacterId,
            aiName: currentCharacterName,
            targetId: contactCard.characterId,
            targetName: contactCard.characterName
          })
          navigate(`/ai-chat?${params.toString()}`)
        }}
        className="relative overflow-hidden rounded-[4px] bg-white w-[240px] cursor-pointer active:brightness-95 select-none"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        {/* 上半部分：头像和名字 */}
        <div className="flex items-center p-3 gap-3">
          {/* 头像 */}
          <div className="w-[42px] h-[42px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
            {contactCard.characterAvatar ? (
              <img
                src={contactCard.characterAvatar}
                alt={contactCard.characterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* 名字和状态 */}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] text-black font-normal truncate leading-tight">
              {contactCard.characterName}
            </div>
            {/* 状态提示 */}
            {getStatusText() && (
              <div className={`text-[10px] mt-0.5 ${
                friendStatus === 'accepted' ? 'text-green-600' : 
                friendStatus === 'rejected' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {getStatusText()}
              </div>
            )}
            {/* 验证消息 */}
            {requestSent && verificationMessage && friendStatus === 'pending' && (
              <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                "{verificationMessage}"
              </div>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="h-[1px] bg-gray-100 mx-3" />

        {/* 底部 */}
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-[#999999]">个人名片</span>
          <span className="text-[10px] text-[#576b95]">查看聊天</span>
        </div>
      </div>

      </>
  )
}

export default ContactCardMessage
