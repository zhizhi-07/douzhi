import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'

const CharacterDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [character, setCharacter] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    realName: '',
    signature: '',
    personality: '',
    avatar: '',
    isPublicFigure: false
  })

  useEffect(() => {
    if (id) {
      const data = characterService.getById(id)
      if (data) {
        setCharacter(data)
        setFormData({
          nickname: data.nickname || '',
          realName: data.realName,
          signature: data.signature || '',
          personality: data.personality || '',
          avatar: data.avatar || '',
          isPublicFigure: data.isPublicFigure || false
        })
      }
    }
  }, [id])

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

  const handleSave = () => {
    if (!formData.realName.trim()) {
      alert('请输入真实名字')
      return
    }

    if (id) {
      characterService.update(id, formData)
      setCharacter({ ...character, ...formData })
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个角色吗？')) {
      if (id) {
        characterService.delete(id)
        navigate('/contacts')
      }
    }
  }

  if (!character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <p className="text-gray-400">角色不存在</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/contacts')} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditing ? '编辑角色' : '角色详情'}
          </h1>
          {isEditing ? (
            <button onClick={handleSave} className="text-green-600 font-medium">
              保存
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-blue-600 font-medium">
              编辑
            </button>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 头像 */}
        <div className="flex justify-center mb-6">
          {isEditing ? (
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="w-24 h-24 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-gray-200/50 overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </label>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-200 flex items-center justify-center shadow-md overflow-hidden">
              {character.avatar ? (
                <img src={character.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* 信息卡片 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          {/* 真名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">真实名字</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                className="w-full bg-transparent text-gray-900 outline-none text-sm"
              />
            ) : (
              <p className="text-gray-900 text-sm">{character.realName}</p>
            )}
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 网名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">网名</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="未设置"
                className="w-full bg-transparent text-gray-900 outline-none text-sm"
              />
            ) : (
              <p className="text-gray-900 text-sm">{character.nickname || '未设置'}</p>
            )}
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 个性签名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">个性签名</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.signature}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                placeholder="未设置"
                className="w-full bg-transparent text-gray-900 outline-none text-sm"
              />
            ) : (
              <p className="text-gray-900 text-sm">{character.signature || '未设置'}</p>
            )}
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 性格描述 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">性格描述</label>
            {isEditing ? (
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="未设置"
                rows={3}
                className="w-full bg-transparent text-gray-900 outline-none text-sm resize-none"
              />
            ) : (
              <p className="text-gray-900 text-sm">{character.personality || '未设置'}</p>
            )}
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 公众人物 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">公众人物</div>
              <div className="text-xs text-gray-400">设置该角色为知名度较高的公众人物</div>
            </div>
            {isEditing ? (
              <button
                onClick={() => setFormData({ ...formData, isPublicFigure: !formData.isPublicFigure })}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  formData.isPublicFigure
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                    : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                    formData.isPublicFigure ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            ) : (
              <p className="text-sm text-gray-900">{character.isPublicFigure ? '是' : '否'}</p>
            )}
          </div>
        </div>

        {/* 删除按钮 */}
        {!isEditing && (
          <button
            onClick={handleDelete}
            className="w-full mt-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-medium active:scale-95 transition-transform"
          >
            删除角色
          </button>
        )}
      </div>
    </div>
  )
}

export default CharacterDetail
