import { useNavigate, useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatusBar from '../components/StatusBar'
import { UserInfo, getUserInfo, getUserInfoWithAvatar } from '../utils/userUtils'
import { isMainAccount, getCurrentAccount } from '../utils/accountManager'

/**
 * 获取当前账号的显示信息
 * 主账号：使用 user_info
 * 小号：使用小号的名字和头像
 */
const getDisplayUserInfo = (): UserInfo => {
  const mainInfo = getUserInfo()

  if (isMainAccount()) {
    return mainInfo
  }

  // 小号模式：使用小号的信息
  const subAccount = getCurrentAccount()
  if (subAccount) {
    return {
      ...mainInfo,
      nickname: subAccount.name,
      realName: subAccount.name,
      avatar: subAccount.avatar || mainInfo.avatar,
      signature: subAccount.signature || '',
      persona: '', // 小号没有人设
    }
  }

  return mainInfo
}

const Me = () => {
  const navigate = useNavigate()
  const { customIcons } = useOutletContext<{ customIcons: Record<string, string> }>()
  const [userInfo, setUserInfo] = useState<UserInfo>(getDisplayUserInfo())

  // 🔥 从 IndexedDB 加载头像
  useEffect(() => {
    const loadAvatar = async () => {
      const info = await getUserInfoWithAvatar()
      setUserInfo(prev => ({ ...prev, avatar: info.avatar }))
    }
    loadAvatar()
  }, [])

  // 监听storage变化和账号切换，实时更新用户信息
  useEffect(() => {
    const updateUserInfo = async () => {
      const baseInfo = getDisplayUserInfo()
      const fullInfo = await getUserInfoWithAvatar()
      setUserInfo({ ...baseInfo, avatar: fullInfo.avatar || baseInfo.avatar })
    }

    window.addEventListener('storage', updateUserInfo)
    window.addEventListener('focus', updateUserInfo)
    window.addEventListener('accountSwitched', updateUserInfo)

    return () => {
      window.removeEventListener('storage', updateUserInfo)
      window.removeEventListener('focus', updateUserInfo)
      window.removeEventListener('accountSwitched', updateUserInfo)
    }
  }, [])

  const menuGroups = [
    {
      id: 1,
      items: [{
        id: 11,
        name: '钱包',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>,
        path: '/wallet',
        enabled: true
      }],
    },
    {
      id: 2,
      items: [{
        id: 21,
        name: '收藏',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
        path: '',
        enabled: false
      }],
    },
    {
      id: 3,
      items: [{
        id: 31,
        name: '切换账号',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>,
        path: '/switch-account',
        enabled: true
      }],
    },
  ]

  return (
    <div
      className="h-full flex flex-col font-serif"
      data-me-page
    >
      {/* 顶部 - 玻璃拟态 */}
      <div
        className="relative z-10"
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        <StatusBar />
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/')} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
              <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">我</h1>
            <div className="w-5"></div>
          </div>
        </div>
      </div>

      {/* 个人信息卡片 - 玻璃拟态 */}
      <div className="px-4 pt-4 mb-4">
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl overflow-hidden shadow-sm">
          <div
            onClick={() => navigate('/user-profile')}
            className="flex items-center px-5 py-6 cursor-pointer hover:bg-white/70 active:bg-white/80 transition-all"
          >
            {/* 头像 */}
            <div className="w-16 h-16 rounded-xl bg-white/40 flex items-center justify-center shadow-sm overflow-hidden border border-white/40">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-[#8C8C8C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>

            {/* 用户信息 */}
            <div className="ml-5 flex-1 min-w-0">
              <h2 className="text-lg font-medium text-[#2C2C2C] mb-1 truncate tracking-wide">
                {userInfo.nickname || userInfo.realName}
              </h2>
              <p className="text-sm text-[#5A5A5A] truncate font-light">
                {userInfo.signature || '暂无签名'}
              </p>
            </div>

            <span className="text-[#8C8C8C] text-xl ml-2 font-light">›</span>
          </div>
        </div>
      </div>

      {/* 菜单列表 - 玻璃拟态 */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {menuGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="mb-4 card-enter"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl overflow-hidden shadow-sm">
              {group.items.map((item, index) => (
                <div key={item.id}>
                  <div
                    onClick={() => item.enabled && item.path && navigate(item.path)}
                    className={`flex items-center px-5 py-4 transition-all ${item.enabled
                      ? 'cursor-pointer hover:bg-white/50 active:bg-white/60'
                      : 'cursor-not-allowed opacity-50'
                      }`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center ${item.enabled ? 'text-[#5A5A5A]' : 'text-[#8C8C8C]'
                      }`}>
                      {item.icon}
                    </div>
                    <span className={`ml-4 flex-1 text-sm tracking-wide ${item.enabled ? 'text-[#2C2C2C]' : 'text-[#8C8C8C]'
                      }`}>
                      {item.name}
                    </span>
                    <span className="text-[#8C8C8C] text-lg font-light">›</span>
                  </div>
                  {index < group.items.length - 1 && (
                    <div className="mx-5 border-b border-[#2C2C2C]/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Me
