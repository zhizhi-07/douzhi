import { useState, useRef } from 'react'
import { X, Camera } from 'lucide-react'
import { getUserInfo, saveUserInfo } from '../utils/userUtils'
import { compressAndConvertToBase64 } from '../utils/imageUtils'
import { trackNicknameChange, trackSignatureChange, trackAvatarChange } from '../utils/userInfoChangeTracker'
import { recognizeUserAvatar, setUserAvatarDescription, hasAvatarChanged } from '../utils/userAvatarManager'

interface InstagramEditProfileProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const InstagramEditProfile = ({ isOpen, onClose, onSave }: InstagramEditProfileProps) => {
  const [userInfo, setUserInfo] = useState(getUserInfo())
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // 处理头像上传
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    try {
      setIsLoading(true)
      const base64 = await compressAndConvertToBase64(file, 800, 800, 0.8)
      const dataUrl = `data:image/jpeg;base64,${base64}`
      setUserInfo({ ...userInfo, avatar: dataUrl })
    } catch (error) {
      console.error('压缩头像失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存修改
  const handleSave = async () => {
    if (!userInfo.realName?.trim() && !userInfo.nickname?.trim()) {
      alert('请至少填写一个名字')
      return
    }

    const oldUserInfo = getUserInfo()

    // 最终保存的信息
    const finalUserInfo = {
      ...userInfo,
      realName: userInfo.realName?.trim() || userInfo.nickname?.trim() || '用户',
      nickname: userInfo.nickname?.trim() || userInfo.realName?.trim() || '用户',
      signature: userInfo.signature?.trim() || ''
    }

    // 检测修改
    const nicknameChanged = oldUserInfo.nickname !== finalUserInfo.nickname
    const signatureChanged = oldUserInfo.signature !== finalUserInfo.signature
    const avatarChanged = oldUserInfo.avatar !== finalUserInfo.avatar && finalUserInfo.avatar

    // 保存
    saveUserInfo(finalUserInfo)

    // 追踪变更
    if (nicknameChanged) {
      trackNicknameChange(finalUserInfo.nickname)
    }
    if (signatureChanged && finalUserInfo.signature) {
      trackSignatureChange(finalUserInfo.signature)
    }
    if (avatarChanged && finalUserInfo.avatar) {
      trackAvatarChange(finalUserInfo.avatar)

      // 异步识别头像
      const avatarUrl = finalUserInfo.avatar
      if (hasAvatarChanged(avatarUrl)) {
        recognizeUserAvatar(avatarUrl).then(description => {
          if (description) {
            setUserAvatarDescription(description, avatarUrl)
          }
        }).catch(error => {
          console.error('头像识别失败:', error)
        })
      }
    }

    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white !bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: '#ffffff' }}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
          <button
            onClick={onClose}
            className="p-2 -m-2 active:opacity-60"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-base font-semibold">编辑资料</h2>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="text-blue-500 font-semibold text-sm active:opacity-60 disabled:opacity-40"
          >
            完成
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
          {/* 头像 */}
          <div className="flex flex-col items-center py-6 border-b border-gray-100 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
            <div className="relative">
              <img
                src={userInfo.avatar || '/default-avatar.png'}
                alt="头像"
                className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isLoading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center active:bg-blue-600 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={isLoading}
              className="mt-3 text-sm text-blue-500 font-semibold active:opacity-60"
            >
              {isLoading ? '上传中...' : '更换头像'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* 编辑字段 */}
          <div className="divide-y divide-gray-100 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
            {/* 名字 */}
            <div className="px-4 py-3 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs text-gray-500 mb-2">名字</label>
              <input
                type="text"
                value={userInfo.nickname || ''}
                onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })}
                placeholder="你的名字"
                maxLength={30}
                className="w-full text-base outline-none"
              />
            </div>

            {/* 个性签名 */}
            <div className="px-4 py-3 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs text-gray-500 mb-2">个性签名</label>
              <textarea
                value={userInfo.signature || ''}
                onChange={(e) => setUserInfo({ ...userInfo, signature: e.target.value })}
                placeholder="介绍一下自己..."
                maxLength={150}
                rows={3}
                className="w-full text-base outline-none resize-none"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {(userInfo.signature || '').length}/150
              </div>
            </div>

            {/* 提示信息 */}
            <div className="px-4 py-4 bg-gray-50">
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 你的个人信息将在朋友圈和个人主页展示。修改后AI角色也会知道你的最新信息。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstagramEditProfile
