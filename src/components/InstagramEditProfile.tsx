import { useState, useRef, useEffect } from 'react'
import { X, Camera } from 'lucide-react'
import { getUserInfo, getUserInfoWithAvatar, saveUserInfo, type UserInfo } from '../utils/userUtils'
import { compressAndConvertToBase64 } from '../utils/imageUtils'

interface InstagramEditProfileProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const InstagramEditProfile = ({ isOpen, onClose, onSave }: InstagramEditProfileProps) => {
  const [profile, setProfile] = useState<UserInfo>(getUserInfo())
  const [isLoading, setIsLoading] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 异步加载头像
  useEffect(() => {
    if (isOpen && !avatarLoaded) {
      getUserInfoWithAvatar().then(info => {
        setProfile(info)
        setAvatarLoaded(true)
      })
    }
  }, [isOpen, avatarLoaded])

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setAvatarLoaded(false)
    }
  }, [isOpen])

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
      setProfile({ ...profile, avatar: dataUrl })
    } catch (error) {
      console.error('压缩头像失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存修改
  const handleSave = async () => {
    if (!profile.nickname?.trim() && !profile.realName?.trim()) {
      alert('请填写名字')
      return
    }

    // 保存到微信用户资料（同步）
    const finalProfile: UserInfo = {
      ...profile,
      nickname: profile.nickname?.trim() || '',
      realName: profile.realName?.trim() || profile.nickname?.trim() || '用户',
      avatar: profile.avatar || '',
      signature: profile.signature?.trim() || ''
    }

    saveUserInfo(finalProfile)
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
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="头像"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 ring-2 ring-gray-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">{(profile.nickname || profile.realName || '我')[0]}</span>
                </div>
              )}
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
                value={profile.nickname || ''}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                placeholder="你的名字"
                maxLength={30}
                className="w-full text-base outline-none"
              />
            </div>

            {/* 个性签名 */}
            <div className="px-4 py-3 bg-white !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs text-gray-500 mb-2">个性签名</label>
              <textarea
                value={profile.signature || ''}
                onChange={(e) => setProfile({ ...profile, signature: e.target.value })}
                placeholder="介绍一下自己..."
                maxLength={150}
                rows={3}
                className="w-full text-base outline-none resize-none"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {(profile.signature || '').length}/150
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default InstagramEditProfile
