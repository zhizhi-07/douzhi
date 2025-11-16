/**
 * 用户信息编辑页面
 */

import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { getUserInfo, saveUserInfo, type UserInfo } from '../utils/userUtils'
import { loadMessages, saveMessages } from '../utils/simpleMessageManager'
import { trackNicknameChange, trackSignatureChange, trackAvatarChange } from '../utils/userInfoChangeTracker'

const UserProfile = () => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<UserInfo>(getUserInfo())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setUserInfo({ ...userInfo, avatar: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存到localStorage
  const handleSave = () => {
    // 验证必填项
    if (!userInfo.realName || !userInfo.realName.trim()) {
      alert('请输入真实姓名')
      return
    }
    
    // 获取旧的用户信息用于对比
    const oldUserInfo = getUserInfo()
    
    // 如果没有填写网名，使用真实姓名
    const finalUserInfo = {
      ...userInfo,
      nickname: userInfo.nickname.trim() || userInfo.realName
    }
    
    // 检测修改
    const nicknameChanged = oldUserInfo.nickname !== finalUserInfo.nickname
    const signatureChanged = oldUserInfo.signature !== finalUserInfo.signature
    
    // 保存用户信息
    saveUserInfo(finalUserInfo)
    
    // 🔥 追踪用户信息变更（用于提示词生成）
    if (nicknameChanged) {
      trackNicknameChange(finalUserInfo.nickname)
    }
    if (signatureChanged && finalUserInfo.signature) {
      trackSignatureChange(finalUserInfo.signature)
    }
    if (oldUserInfo.avatar !== finalUserInfo.avatar && finalUserInfo.avatar) {
      trackAvatarChange(finalUserInfo.avatar)
    }
    
    // 如果有修改，通知所有活跃的AI
    if (nicknameChanged || signatureChanged) {
      notifyAIAboutUserInfoChange(nicknameChanged, signatureChanged, oldUserInfo, finalUserInfo)
    }
    
    navigate(-1)
  }
  
  // 通知AI用户信息变更
  const notifyAIAboutUserInfoChange = async (
    nicknameChanged: boolean,
    signatureChanged: boolean,
    oldInfo: UserInfo,
    newInfo: UserInfo
  ) => {
    try {
      // 从localStorage获取所有聊天ID（只是为了获取ID列表）
      const allChatIds = Object.keys(localStorage)
        .filter(key => key.startsWith('chat_messages_') || key.startsWith('chat_'))
        .map(key => key.replace(/^(chat_messages_|chat_)/, ''))
        .filter((id, index, self) => self.indexOf(id) === index) // 去重
      
      console.log(`🔍 找到 ${allChatIds.length} 个聊天`)
      
      // 构建提示消息
      const changes: string[] = []
      if (nicknameChanged) {
        changes.push(`网名从"${oldInfo.nickname}"改为"${newInfo.nickname}"`)
      }
      if (signatureChanged) {
        const oldSig = oldInfo.signature || '(无)'
        const newSig = newInfo.signature || '(无)'
        changes.push(`个性签名从"${oldSig}"改为"${newSig}"`)
      }
      
      const changeText = changes.join('，')
      
      // 为每个聊天添加系统提示
      for (const chatId of allChatIds) {
        try {
          // 使用simpleMessageManager加载消息
          const messages = loadMessages(chatId)
          
          if (messages.length === 0) continue // 跳过空聊天
          
          // 创建系统提示消息
          const systemMessage = {
            id: Date.now(),
            type: 'system' as const,
            messageType: 'system' as const,
            content: `${newInfo.nickname || newInfo.realName} 修改了个人信息`,
            aiReadableContent: `【系统提示】对方刚刚修改了个人信息：${changeText}。你可以对此做出反应，比如评论新的网名或签名。`,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            hideInUI: false
          }
          
          // 添加到消息列表并保存
          messages.push(systemMessage)
          saveMessages(chatId, messages)
          
          console.log(`✅ 已通知聊天 ${chatId} 用户信息变更`)
        } catch (err) {
          console.error(`处理聊天 ${chatId} 失败:`, err)
        }
      }
      
      console.log(`📢 已通知 ${allChatIds.length} 个聊天`)
    } catch (error) {
      console.error('通知AI失败:', error)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 - 包含StatusBar */}
      <div className="bg-white border-b border-gray-200">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 text-sm"
          >
            取消
          </button>
          <h1 className="text-base font-semibold">个人信息</h1>
          <button
            onClick={handleSave}
            className="text-green-600 text-sm font-medium"
          >
            保存
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="bg-white mt-2">
          {/* 头像 */}
          <div 
            className="flex items-center justify-between px-4 py-4 border-b border-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-gray-500 text-sm">头像</span>
            <div className="flex items-center gap-2">
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* 网名 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-gray-500 text-sm">网名</span>
            <input
              type="text"
              value={userInfo.nickname}
              onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })}
              placeholder="不填则使用真实姓名"
              className="text-right text-gray-900 outline-none flex-1 ml-4 placeholder:text-gray-400"
            />
          </div>

          {/* 真实姓名 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-gray-500 text-sm">
              真实姓名 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={userInfo.realName}
              onChange={(e) => setUserInfo({ ...userInfo, realName: e.target.value })}
              placeholder="请输入真实姓名"
              className="text-right text-gray-900 outline-none flex-1 ml-4"
            />
          </div>

          {/* 个性签名 */}
          <div className="px-4 py-4">
            <div className="text-gray-500 text-sm mb-3">个性签名</div>
            <textarea
              value={userInfo.signature || ''}
              onChange={(e) => setUserInfo({ ...userInfo, signature: e.target.value })}
              placeholder="写点什么吧..."
              className="w-full text-gray-900 outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-4 px-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-2 text-blue-600 text-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium mb-1">AI会读取这些信息</div>
                <div className="text-blue-500">AI会根据你的网名、真实姓名和个性签名来了解你，提供更个性化的对话体验</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default UserProfile
