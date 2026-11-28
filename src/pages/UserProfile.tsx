/**
 * 用户信息编辑页面
 */

import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getUserInfo, getUserInfoWithAvatar, saveUserInfo, type UserInfo } from '../utils/userUtils'
import { trackAvatarChange, getUserInfoChangeHistory } from '../utils/userInfoChangeTracker'
import { compressAndConvertToBase64 } from '../utils/imageUtils'
import { recognizeUserAvatar, setUserAvatarDescription } from '../utils/userAvatarManager'
import { saveUserAvatar, deleteAvatar } from '../utils/avatarStorage'

const UserProfile = () => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<UserInfo>(getUserInfo())
  const [isSaving, setIsSaving] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [avatarProcessing, setAvatarProcessing] = useState(false)
  const avatarEditedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🔥 从 IndexedDB 加载头像
  useEffect(() => {
    let cancelled = false
    getUserInfoWithAvatar().then(info => {
      if (!cancelled && !avatarEditedRef.current) {
        setUserInfo(prev => ({ ...prev, avatar: info.avatar }))
      }
    }).finally(() => {
      if (!cancelled) setAvatarLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      try {
        setAvatarProcessing(true)
        // 压缩图片（头像使用较小尺寸：800x800，质量0.8）
        const base64 = await compressAndConvertToBase64(file, 800, 800, 0.8)
        const dataUrl = `data:image/jpeg;base64,${base64}`
        avatarEditedRef.current = true
        setUserInfo(prev => ({ ...prev, avatar: dataUrl }))
      } catch (error) {
        console.error('压缩头像失败:', error)
        alert('图片处理失败，请重试')
      } finally {
        setAvatarProcessing(false)
      }
    }
  }

  // 保存到localStorage
  const handleSave = async () => {
    // 防止重复点击
    if (isSaving || avatarLoading || avatarProcessing) return
    
    // 验证必填项
    if (!userInfo.realName || !userInfo.realName.trim()) {
      alert('请输入真实姓名')
      return
    }
    
    setIsSaving(true)
    
    // 获取旧的用户信息用于对比
    // 同步读取会隐藏 IndexedDB 标记，必须比较实际头像数据。
    const oldUserInfo = await getUserInfoWithAvatar()
    
    // 如果没有填写网名，使用真实姓名
    const finalUserInfo = {
      ...userInfo,
      nickname: userInfo.nickname.trim() || userInfo.realName
    }
    
    // 检测修改
    const avatarChanged = oldUserInfo.avatar !== finalUserInfo.avatar && finalUserInfo.avatar
    
    // 🔥 如果有头像，保存到 IndexedDB
    if (avatarChanged && finalUserInfo.avatar) {
      try {
        const saved = await saveUserAvatar(finalUserInfo.avatar)
        if (!saved) {
          alert('头像保存失败，请重试')
          setIsSaving(false)
          return
        }
        console.log('✅ 头像已保存到 IndexedDB')
      } catch (error) {
        console.error('❌ 保存头像到 IndexedDB 失败:', error)
        alert('头像保存失败，请重试')
        setIsSaving(false)
        return
      }
    }
    
    // 🔥 保存用户信息到 localStorage（只存标记，不存 base64）
    const infoToSave = {
      ...finalUserInfo,
      avatar: finalUserInfo.avatar ? 'indexeddb://user_avatar' : undefined
    }
    
    try {
      await saveUserInfo(infoToSave)
    } catch (error) {
      if (avatarChanged) {
        const restored = oldUserInfo.avatar ? await saveUserAvatar(oldUserInfo.avatar) : await deleteAvatar('user')
        if (!restored) console.error('头像回滚失败，请保留原文件重试')
      }
      console.error('❌ 保存用户信息失败:', error)
      alert('保存失败，请重试')
      setIsSaving(false)
      return
    }
    
    // 网名、签名由 saveUserInfo 统一追踪。
    if (avatarChanged && finalUserInfo.avatar) {
      if (!getUserInfoChangeHistory().avatar.current && oldUserInfo.avatar) trackAvatarChange(oldUserInfo.avatar)
      trackAvatarChange(finalUserInfo.avatar)
      
      // 🔥 只有开启了"允许AI看头像"才触发识别
      if (finalUserInfo.allowAvatarRecognition) {
        // 换头像时强制重新识别，不管之前是否有记录
        const avatarUrl = finalUserInfo.avatar
        setUserAvatarDescription('头像待识别（无法看到具体内容）', avatarUrl, 'main')
        console.log('🔍 检测到头像变更，准备调用AI识别...')
        recognizeUserAvatar(avatarUrl).then(async description => {
          const latest = await getUserInfoWithAvatar()
          if (!latest.allowAvatarRecognition || latest.avatar !== avatarUrl) return
          if (description) {
            setUserAvatarDescription(description, avatarUrl, 'main')
            console.log('✅ 头像识别完成:', description)
          } else {
            console.log('⚠️ 头像识别失败，保留待识别状态')
          }
        }).catch(error => {
          console.error('❌ 头像识别失败:', error)
        })
      } else {
        console.log('📷 用户未开启头像识别，跳过AI识别')
      }
    }
    
    setIsSaving(false)
    navigate(-1)
  }
  

  return (
    <div className="h-screen bg-gray-50 flex flex-col soft-page-enter">
      {/* 顶部导航 - 包含StatusBar */}
      <div className="glass-card rounded-r-b border-gray-200">
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
            disabled={isSaving || avatarLoading || avatarProcessing}
            className={`text-sm font-medium ${isSaving || avatarLoading || avatarProcessing ? 'text-gray-400' : 'text-green-600'}`}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="glass-card mt-2">
          {/* 头像 */}
          <div 
            className="flex items-center justify-between px-4 py-4 border-b border-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-gray-500 text-sm">头像</span>
            <div className="flex items-center gap-2">
              <div className="w-14 h-14 rounded-lg glass-card flex items-center justify-center overflow-hidden">
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

          {/* 头像识别开关 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div>
              <span className="text-gray-500 text-sm">头像识别</span>
              <div className="text-xs text-gray-400 mt-0.5">开启后，系统会对你的头像进行视觉分析，用于生成头像描述供 AI 参考</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userInfo.allowAvatarRecognition || false}
                onChange={(e) => setUserInfo({ ...userInfo, allowAvatarRecognition: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

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
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="text-gray-500 text-sm mb-3">个性签名</div>
            <textarea
              value={userInfo.signature || ''}
              onChange={(e) => setUserInfo({ ...userInfo, signature: e.target.value })}
              placeholder="写点什么吧..."
              className="w-full text-gray-900 outline-none resize-none"
              rows={3}
            />
          </div>


          {/* 用户人设 */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="text-gray-500 text-sm mb-3">用户人设</div>
            <textarea
              value={userInfo.persona || ''}
              onChange={(e) => setUserInfo({ ...userInfo, persona: e.target.value })}
              placeholder="描述你的性格、身份、背景等，AI会根据这些信息调整对你的态度和回复方式..."
              className="w-full text-gray-900 outline-none resize-none placeholder:text-gray-400"
              rows={4}
            />
          </div>

          {/* 公众人物开关 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div>
              <span className="text-gray-500 text-sm">公众人物</span>
              <div className="text-xs text-gray-400 mt-0.5">开启后，论坛网友会认识你</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userInfo.isPublicFigure || false}
                onChange={(e) => setUserInfo({ ...userInfo, isPublicFigure: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          {/* 公众形象（仅公众人物可见） */}
          {userInfo.isPublicFigure && (
            <div className="px-4 py-4">
              <div className="text-gray-500 text-sm mb-3">公众形象/社会印象</div>
              <textarea
                value={userInfo.publicPersona || ''}
                onChange={(e) => setUserInfo({ ...userInfo, publicPersona: e.target.value })}
                placeholder="描述你在公众面前的形象，比如：知名博主、网红、明星、企业家等。网友在论坛看到你时会根据这个印象来评论..."
                className="w-full text-gray-900 outline-none resize-none placeholder:text-gray-400"
                rows={3}
              />
            </div>
          )}
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
                <div className="text-blue-500">AI会根据你的网名、真实姓名、个性签名和人设来了解你，提供更个性化的对话体验。人设会影响AI对你的态度和回复方式。</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default UserProfile
