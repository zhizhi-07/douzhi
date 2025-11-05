/**
 * 情侣空间主页
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'
import {
  getCoupleSpaceRelation,
  createCoupleSpaceInvite,
  endCoupleSpaceRelation,
  getCoupleSpacePrivacy,
  setCoupleSpacePrivacy,
  type CoupleSpaceRelation
} from '../utils/coupleSpaceUtils'

const CoupleSpace = () => {
  const navigate = useNavigate()
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public')

  useEffect(() => {
    loadRelation()
    
    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRelation()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', loadRelation)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', loadRelation)
    }
  }, [])

  const loadRelation = () => {
    const relation = getCoupleSpaceRelation()
    setRelation(relation)
    
    const privacy = getCoupleSpacePrivacy()
    setPrivacyMode(privacy)
  }
  
  const handlePrivacyToggle = () => {
    const newMode = privacyMode === 'public' ? 'private' : 'public'
    setCoupleSpacePrivacy(newMode)
    setPrivacyMode(newMode)
  }

  const handleInvite = (characterId: string) => {
    const character = characterService.getById(characterId)
    if (!character) return

    const invitation = createCoupleSpaceInvite(
      'current_user',
      character.id,
      character.nickname || character.realName,
      character.avatar
    )

    if (!invitation) {
      alert('创建邀请失败，请先结束当前的情侣空间')
      return
    }

    // 跳转到聊天并发送邀请卡片
    navigate(`/chat/${characterId}`, {
      state: { sendCoupleSpaceInvite: true }
    })
  }

  const handleEndRelation = () => {
    if (confirm('确定要结束情侣空间吗？所有数据将被清除！')) {
      const success = endCoupleSpaceRelation()
      if (success) {
        alert('已结束情侣空间')
        loadRelation()
      }
    }
  }

  const characters = characterService.getAll()

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            情侣空间
          </h1>
          <div className="w-6" />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        {!relation || relation.status === 'ended' || relation.status === 'rejected' ? (
          /* 未建立情侣空间 */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl p-8 text-center space-y-6 shadow-xl">
                <div className="w-24 h-24 mx-auto rounded-full bg-pink-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">开启情侣空间</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    邀请你的TA加入专属情侣空间
                    <br />
                    共同记录美好时光
                  </p>
                </div>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full py-4 rounded-2xl bg-pink-500 text-white font-semibold shadow-lg hover:bg-pink-600 active:scale-95 transition-all"
                >
                  发送邀请
                </button>
              </div>

              {/* 说明卡片 */}
              <div className="mt-6 bg-white rounded-2xl p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-500 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium mb-1">选择你的TA</h3>
                    <p className="text-gray-600 text-sm">从角色列表中选择一位进行邀请</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-500 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium mb-1">等待对方同意</h3>
                    <p className="text-gray-600 text-sm">对方可以选择接受或拒绝邀请</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-500 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium mb-1">开启专属空间</h3>
                    <p className="text-gray-600 text-sm">建立后可共享照片、记录纪念日等</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : relation.status === 'pending' ? (
          /* 等待对方接受 */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl p-8 text-center space-y-6 shadow-xl">
                <div className="w-24 h-24 mx-auto rounded-full bg-pink-100 flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">等待对方同意</h2>
                  <p className="text-gray-600 text-sm">
                    已向 {relation.characterName} 发送邀请
                    <br />
                    请耐心等待对方回应
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 已建立情侣空间 */
          <div className="space-y-6 pb-6">
            {/* 两人头像 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <div className="relative flex items-center justify-center mb-6">
                {/* 用户头像 */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-gray-700 text-3xl font-bold">
                    我
                  </div>
                </div>

                {/* 爱心连接 */}
                <div className="relative -mx-6 z-10">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center shadow-xl">
                    <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                </div>

                {/* 角色头像 */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {relation.characterAvatar ? (
                      <img src={relation.characterAvatar} alt={relation.characterName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-3xl font-bold">
                        {relation.characterName[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 名字 */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  我 & {relation.characterName}
                </h2>
              </div>

              {/* 恋爱天数 */}
              <div className="text-center">
                <div className="inline-flex items-baseline space-x-2">
                  <span className="text-sm text-gray-600">在一起</span>
                  <span className="text-5xl font-bold text-pink-500">
                    {Math.floor((Date.now() - (relation.acceptedAt || relation.createdAt)) / (1000 * 60 * 60 * 24))}
                  </span>
                  <span className="text-sm text-gray-600">天</span>
                </div>
              </div>
            </div>

            {/* 功能入口 */}
            <div className="grid grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/couple-album')}
                className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">相册</span>
              </button>

              <button 
                onClick={() => navigate('/couple-anniversary')}
                className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">纪念日</span>
              </button>

              <button 
                onClick={() => navigate('/couple-message-board')}
                className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">留言</span>
              </button>

              <button className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white hover:scale-105 active:scale-95 transition-all">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">更多</span>
              </button>
            </div>

            {/* 隐私设置 */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">隐私设置</div>
                  <div className="text-xs text-gray-600">
                    {privacyMode === 'public' 
                      ? '公开：其他人可以看到你有情侣空间' 
                      : '私密：对其他人隐藏情侣空间状态'}
                  </div>
                </div>
                <button
                  onClick={handlePrivacyToggle}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    privacyMode === 'public' 
                      ? 'bg-gray-200 text-gray-900' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {privacyMode === 'public' ? '公开' : '私密'}
                </button>
              </div>
            </div>

            {/* 结束关系按钮 */}
            <button
              onClick={handleEndRelation}
              className="w-full py-3 rounded-2xl text-red-500 text-sm font-medium bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all"
            >
              结束情侣空间
            </button>
          </div>
        )}
      </div>

      {/* 邀请角色列表弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative w-full max-h-[70vh] bg-white rounded-t-3xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 text-center">选择邀请对象</h3>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {characters.map(character => (
                <div
                  key={character.id}
                  onClick={() => {
                    handleInvite(character.id)
                    setShowInviteModal(false)
                  }}
                  className="flex items-center space-x-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0">
                    {character.avatar ? (
                      <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                        {character.realName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{character.nickname || character.realName}</h4>
                    {character.signature && (
                      <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">{character.signature}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoupleSpace
