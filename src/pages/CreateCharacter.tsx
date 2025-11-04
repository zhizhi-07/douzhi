import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'

const CreateCharacter = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nickname: '',      // 网名（选填）
    realName: '',      // 真名（必填）
    signature: '',     // 个性签名
    personality: '',   // 性格描述
    world: '2025现代世界', // 世界（默认）
    avatar: ''         // 头像
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    // 验证
    if (!formData.realName.trim()) {
      alert('请输入真实名字')
      return
    }

    // 保存角色
    const newCharacter = characterService.save(formData)
    console.log('创建角色成功:', newCharacter)
    
    // 跳转到通讯录
    navigate('/contacts')
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">创建角色</h1>
          <button 
            onClick={handleSubmit}
            className="text-green-600 font-medium"
          >
            完成
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 头像区域 */}
        <div className="flex justify-center mb-6">
          <label className="cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="w-20 h-20 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-gray-200/50 overflow-hidden">
              {formData.avatar ? (
                <img src={formData.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
          </label>
        </div>

        {/* 表单项 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          {/* 真名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">真实名字 *</label>
            <input
              type="text"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              placeholder="角色的真实姓名"
              className="w-full bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 网名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">网名</label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="聊天显示的名字（可选）"
              className="w-full bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 个性签名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">个性签名</label>
            <input
              type="text"
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
              placeholder="一句话介绍自己（可选）"
              className="w-full bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 性格描述 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">性格描述</label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="简单描述性格特点..."
              rows={3}
              className="w-full bg-transparent text-gray-900 outline-none text-sm resize-none"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 世界 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">所属世界</label>
            <div className="flex items-center justify-between">
              <span className="text-gray-900 text-sm">{formData.world}</span>
              <span className="text-gray-400 text-xs">默认</span>
            </div>
          </div>
        </div>

        {/* 提示文字 */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 text-center">
            非必填项可留空使用默认设置
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateCharacter
