import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import {
  getCurrentAccountId,
  switchAccount,
  createSubAccountAsync,
  deleteSubAccount,
  updateAccountAsync,
  getAccountsWithAvatars,
  Account
} from '../utils/accountManager'
import { getUserAvatar } from '../utils/avatarStorage'
import { getMasksWithAvatars, createMask, updateMask, deleteMask, Mask } from '../utils/maskManager'

type TabType = 'mask' | 'account'

const SwitchAccount = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('mask')
  
  // 账号相关
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccountId, setCurrentAccountId] = useState<string>('')
  
  // 面具相关
  const [masks, setMasks] = useState<Mask[]>([])
  
  // 弹窗相关
  const [showCreateModal, setShowCreateModal] = useState(false)
  // 小号用
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountSignature, setNewAccountSignature] = useState('')
  const [newAccountAvatar, setNewAccountAvatar] = useState<string>('')
  // 面具用
  const [newMaskNickname, setNewMaskNickname] = useState('')
  const [newMaskRealName, setNewMaskRealName] = useState('')
  const [newMaskSignature, setNewMaskSignature] = useState('')
  const [newMaskDescription, setNewMaskDescription] = useState('')
  const [newMaskPersona, setNewMaskPersona] = useState('')
  const [newMaskAvatar, setNewMaskAvatar] = useState<string>('')
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editingMask, setEditingMask] = useState<Mask | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'account' | 'mask'>('account')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mainAccountAvatar, setMainAccountAvatar] = useState<string>('')

  useEffect(() => {
    loadData()
    // 从 IndexedDB 加载主账号头像
    const loadMainAvatar = async () => {
      const avatar = await getUserAvatar()
      if (avatar) {
        setMainAccountAvatar(avatar)
      }
    }
    loadMainAvatar()

    // 监听用户信息更新
    const handleUserInfoUpdate = () => { loadMainAvatar() }
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)
    window.addEventListener('storage', handleUserInfoUpdate)

    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
      window.removeEventListener('storage', handleUserInfoUpdate)
    }
  }, [])

  const loadData = async () => {
    // 加载账号
    const accountsWithAvatars = await getAccountsWithAvatars()
    setAccounts(accountsWithAvatars)
    setCurrentAccountId(getCurrentAccountId())
    // 加载面具（带头像）
    const masksWithAvatars = await getMasksWithAvatars()
    setMasks(masksWithAvatars)
  }

  // ===== 账号相关操作 =====
  const handleSwitchAccount = (accountId: string) => {
    if (accountId === currentAccountId) return
    switchAccount(accountId)
    setCurrentAccountId(accountId)
    loadData()
    navigate('/wechat')
  }

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return
    await createSubAccountAsync(newAccountName.trim(), newAccountAvatar || undefined, newAccountSignature.trim() || undefined)
    resetModal()
    loadData()
  }

  const handleDeleteAccount = (accountId: string) => {
    deleteSubAccount(accountId)
    setShowDeleteConfirm(null)
    loadData()
  }

  const handleEditAccount = (account: Account) => {
    if (account.isMain) {
      navigate('/user-profile')
      return
    }
    setEditingAccount(account)
  }

  const handleSaveEditAccount = async () => {
    if (!editingAccount) return
    await updateAccountAsync(editingAccount.id, {
      name: editingAccount.name,
      signature: editingAccount.signature
    })
    setEditingAccount(null)
    loadData()
  }

  // ===== 面具相关操作 =====
  const handleCreateMask = async () => {
    if (!newMaskNickname.trim()) return
    await createMask({
      nickname: newMaskNickname.trim(),
      realName: newMaskRealName.trim() || undefined,
      avatar: newMaskAvatar || undefined,
      signature: newMaskSignature.trim() || undefined,
      description: newMaskDescription.trim() || undefined,
      persona: newMaskPersona.trim() || undefined
    })
    resetModal()
    loadData()
  }

  const handleDeleteMask = async (maskId: string) => {
    await deleteMask(maskId)
    setShowDeleteConfirm(null)
    loadData()
  }

  const handleEditMask = (mask: Mask) => {
    setEditingMask(mask)
  }

  const handleSaveEditMask = async () => {
    if (!editingMask) return
    await updateMask(editingMask.id, {
      nickname: editingMask.nickname,
      realName: editingMask.realName,
      signature: editingMask.signature,
      description: editingMask.description,
      persona: editingMask.persona
    })
    setEditingMask(null)
    loadData()
  }

  // ===== 通用操作 =====
  const resetModal = () => {
    // 小号
    setNewAccountName('')
    setNewAccountSignature('')
    setNewAccountAvatar('')
    // 面具
    setNewMaskNickname('')
    setNewMaskRealName('')
    setNewMaskSignature('')
    setNewMaskDescription('')
    setNewMaskPersona('')
    setNewMaskAvatar('')
    setShowCreateModal(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      if (editingAccount) {
        await updateAccountAsync(editingAccount.id, { avatar: base64 })
        setEditingAccount({ ...editingAccount, avatar: base64 })
        loadData()
      } else if (editingMask) {
        await updateMask(editingMask.id, { avatar: base64 })
        setEditingMask({ ...editingMask, avatar: base64 })
        loadData()
      } else if (activeTab === 'account') {
        setNewAccountAvatar(base64)
      } else {
        setNewMaskAvatar(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7]">
      {/* 顶部 */}
      <div className="bg-[#F5F5F7] sticky top-0 z-10">
        <StatusBar />
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center -ml-2 rounded-full hover:bg-black/5 transition-colors text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">切换身份</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-8 h-8 flex items-center justify-center -mr-2 rounded-full hover:bg-black/5 transition-colors text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="px-6 pb-4">
        <div className="flex bg-white/60 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('mask')}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              activeTab === 'mask' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            面具
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              activeTab === 'account' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            小号
          </button>
        </div>
        <p className="text-[12px] text-gray-400 mt-2 text-center">
          {activeTab === 'mask' ? '换个马甲，AI还认识你' : '独立身份，独立记录'}
        </p>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
        {activeTab === 'mask' ? (
          <>
            {/* 面具列表 */}
            {masks.map((mask) => (
              <div
                key={mask.id}
                className="group relative rounded-[24px] p-4 bg-white/60 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                    {mask.avatar ? (
                      <img src={mask.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-800 truncate">{mask.nickname}</h3>
                    <p className="text-[12px] text-gray-400 truncate">{mask.description || '(未填写描述)'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditMask(mask)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setDeleteType('mask'); setShowDeleteConfirm(mask.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* 创建面具按钮 */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[14px] font-medium">创建新面具</span>
            </button>
          </>
        ) : (
          <>
            {accounts.find(a => a.isMain) && (() => {
              const main = accounts.find(a => a.isMain)!
              return (
                <div
                  key={main.id}
                  className={`group relative rounded-[24px] p-4 transition-all cursor-pointer ${
                    main.id === currentAccountId
                      ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                      : 'bg-white/60 hover:bg-white'
                  }`}
                  onClick={() => handleSwitchAccount(main.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-gray-100">
                        {mainAccountAvatar ? (
                          <img src={mainAccountAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {main.id === currentAccountId && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-gray-800 truncate">{main.name}</h3>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-medium rounded-full">MAIN</span>
                      </div>
                      <p className="text-[12px] text-gray-400 truncate">{main.signature || '主账号'}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditAccount(main) }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* 小号列表（过滤掉主账号） */}
            {accounts.filter(a => !a.isMain).map((account) => (
              <div
                key={account.id}
                className={`group relative rounded-[24px] p-4 transition-all cursor-pointer ${
                  account.id === currentAccountId
                    ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                    : 'bg-white/60 hover:bg-white'
                }`}
                onClick={() => handleSwitchAccount(account.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-gray-100">
                      {(() => {
                        const avatarToShow = account.isMain ? mainAccountAvatar : account.avatar
                        return avatarToShow ? (
                          <img src={avatarToShow} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )
                      })()}
                    </div>
                    {account.id === currentAccountId && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-gray-800 truncate">{account.name}</h3>
                      {account.isMain && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-medium rounded-full">MAIN</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 truncate">
                      {account.signature || (account.isMain ? '主账号' : '独立小号')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditAccount(account) }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {!account.isMain && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteType('account'); setShowDeleteConfirm(account.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* 创建小号按钮 */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[14px] font-medium">创建小号</span>
            </button>
          </>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      {(showCreateModal || editingAccount || editingMask) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => { resetModal(); setEditingAccount(null); setEditingMask(null) }}
          />
          <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 text-center mb-4">
              {editingAccount ? '编辑小号' : editingMask ? '编辑面具' : (activeTab === 'mask' ? '新面具' : '新小号')}
            </h2>
            
            {/* 小号表单 */}
            {(editingAccount || (activeTab === 'account' && !editingMask)) && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-[24px] bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all group">
                    {(editingAccount?.avatar || newAccountAvatar) ? (
                      <img src={editingAccount?.avatar || newAccountAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    )}
                  </button>
                </div>
                <input type="text" value={editingAccount?.name || newAccountName} onChange={(e) => editingAccount ? setEditingAccount({ ...editingAccount, name: e.target.value }) : setNewAccountName(e.target.value)} placeholder="名称" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                <input type="text" value={editingAccount?.signature || newAccountSignature} onChange={(e) => editingAccount ? setEditingAccount({ ...editingAccount, signature: e.target.value }) : setNewAccountSignature(e.target.value)} placeholder="签名" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                <button onClick={() => editingAccount ? handleSaveEditAccount() : handleCreateAccount()} disabled={!(editingAccount?.name?.trim() || newAccountName.trim())} className="w-full py-3.5 rounded-xl bg-black text-white font-medium disabled:bg-gray-200 disabled:text-gray-400">
                  {editingAccount ? '保存' : '创建小号'}
                </button>
              </div>
            )}
            
            {/* 面具表单 */}
            {(editingMask || (activeTab === 'mask' && !editingAccount)) && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-[24px] bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all group">
                    {(editingMask?.avatar || newMaskAvatar) ? (
                      <img src={editingMask?.avatar || newMaskAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    )}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">网名 <span className="text-red-400">*</span></label>
                  <input type="text" value={editingMask?.nickname || newMaskNickname} onChange={(e) => editingMask ? setEditingMask({ ...editingMask, nickname: e.target.value }) : setNewMaskNickname(e.target.value)} placeholder="对外显示的名字" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">真名</label>
                  <input type="text" value={editingMask?.realName || newMaskRealName} onChange={(e) => editingMask ? setEditingMask({ ...editingMask, realName: e.target.value }) : setNewMaskRealName(e.target.value)} placeholder="AI知道的你的真名" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">签名</label>
                  <input type="text" value={editingMask?.signature || newMaskSignature} onChange={(e) => editingMask ? setEditingMask({ ...editingMask, signature: e.target.value }) : setNewMaskSignature(e.target.value)} placeholder="个性签名" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">面具描述</label>
                  <input type="text" value={editingMask?.description || newMaskDescription} onChange={(e) => editingMask ? setEditingMask({ ...editingMask, description: e.target.value }) : setNewMaskDescription(e.target.value)} placeholder="帮你区分不同面具" className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">人设（可选）</label>
                  <textarea value={editingMask?.persona || newMaskPersona} onChange={(e) => editingMask ? setEditingMask({ ...editingMask, persona: e.target.value }) : setNewMaskPersona(e.target.value)} placeholder="这个面具的人物设定..." rows={3} className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
                </div>
                <button onClick={() => editingMask ? handleSaveEditMask() : handleCreateMask()} disabled={!(editingMask?.nickname?.trim() || newMaskNickname.trim())} className="w-full py-3.5 rounded-xl bg-black text-white font-medium disabled:bg-gray-200 disabled:text-gray-400">
                  {editingMask ? '保存' : '创建面具'}
                </button>
              </div>
            )}
            
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-xs rounded-[28px] p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">删除{deleteType === 'mask' ? '面具' : '小号'}？</h3>
            <p className="text-[13px] text-gray-500 mb-5">删除后无法恢复</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium">取消</button>
              <button
                onClick={() => deleteType === 'mask' ? handleDeleteMask(showDeleteConfirm) : handleDeleteAccount(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SwitchAccount
