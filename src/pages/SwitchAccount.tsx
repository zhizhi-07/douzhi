import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import {
  getAccounts,
  getCurrentAccountId,
  switchAccount,
  createSubAccount,
  deleteSubAccount,
  updateAccount,
  Account
} from '../utils/accountManager'
import { getUserAvatar } from '../utils/avatarStorage'

const SwitchAccount = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccountId, setCurrentAccountId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountSignature, setNewAccountSignature] = useState('')
  const [newAccountAvatar, setNewAccountAvatar] = useState<string>('')
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mainAccountAvatar, setMainAccountAvatar] = useState<string>('')

  useEffect(() => {
    loadAccounts()
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

  const loadAccounts = () => {
    setAccounts(getAccounts())
    setCurrentAccountId(getCurrentAccountId())
  }

  const handleSwitchAccount = (accountId: string) => {
    if (accountId === currentAccountId) return
    switchAccount(accountId)
    setCurrentAccountId(accountId)
    loadAccounts()
    navigate('/wechat')
  }

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) return

    createSubAccount(
      newAccountName.trim(),
      newAccountAvatar || undefined,
      newAccountSignature.trim() || undefined
    )

    setNewAccountName('')
    setNewAccountSignature('')
    setNewAccountAvatar('')
    setShowCreateModal(false)
    loadAccounts()
  }

  const handleDeleteAccount = (accountId: string) => {
    deleteSubAccount(accountId)
    setShowDeleteConfirm(null)
    loadAccounts()
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (editingAccount) {
        updateAccount(editingAccount.id, { avatar: base64 })
        setEditingAccount({ ...editingAccount, avatar: base64 })
        loadAccounts()
      } else {
        setNewAccountAvatar(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleEditAccount = (account: Account) => {
    if (account.isMain) {
      navigate('/user-profile')
      return
    }
    setEditingAccount(account)
  }

  const handleSaveEdit = () => {
    if (!editingAccount) return
    updateAccount(editingAccount.id, {
      name: editingAccount.name,
      signature: editingAccount.signature
    })
    setEditingAccount(null)
    loadAccounts()
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
          <h1 className="text-[17px] font-semibold text-gray-900">切换账号</h1>
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

      {/* 说明文字 */}
      <div className="px-6 pb-4">
        <p className="text-[13px] text-gray-400 font-medium tracking-wide">
          独立身份 · 独立记录
        </p>
      </div>

      {/* 账号列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`group relative rounded-[24px] p-5 transition-all duration-300 ${account.id === currentAccountId
                ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] scale-[1.02]'
                : 'bg-white/60 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
              }`}
            onClick={() => handleSwitchAccount(account.id)}
          >
            <div className="flex items-center gap-4">
              {/* 头像 - 主账号从IndexedDB加载 */}
              <div className="relative">
                <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-gray-100 shadow-inner">
                  {(() => {
                    // 主账号用单独加载的头像，其他账号用account.avatar
                    const avatarToShow = account.isMain ? mainAccountAvatar : account.avatar
                    return avatarToShow && avatarToShow.startsWith('data:') ? (
                      <img src={avatarToShow} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )
                  })()}
                </div>
                {account.id === currentAccountId && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-[17px] font-semibold truncate ${account.id === currentAccountId ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                    {account.name}
                  </h3>
                  {account.isMain && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full tracking-wide">
                      MAIN
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-400 truncate font-light">
                  {account.signature || (account.isMain ? '主账号身份' : '独立分身账号')}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditAccount(account)
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {!account.isMain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(account.id)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 添加账号按钮 */}
        {accounts.length <= 1 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-4 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[15px] font-medium">创建新身份</span>
          </button>
        )}
      </div>

      {/* 创建/编辑账号弹窗 - 极简风格 */}
      {(showCreateModal || editingAccount) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowCreateModal(false)
              setEditingAccount(null)
            }}
          />
          <div className="relative bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-slide-up">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {editingAccount ? '编辑身份' : '新身份'}
              </h2>
            </div>

            <div className="space-y-6">
              {/* 头像 */}
              <div className="flex justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-[28px] bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-all shadow-sm group relative"
                >
                  {(editingAccount ? editingAccount.avatar : newAccountAvatar) ? (
                    <img
                      src={editingAccount ? editingAccount.avatar : newAccountAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-300 group-hover:text-gray-400 transition-colors">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] font-medium tracking-wide uppercase">Avatar</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* 名称 */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider ml-1">
                  名称
                </label>
                <input
                  type="text"
                  value={editingAccount ? editingAccount.name : newAccountName}
                  onChange={(e) => editingAccount
                    ? setEditingAccount({ ...editingAccount, name: e.target.value })
                    : setNewAccountName(e.target.value)
                  }
                  placeholder="输入身份名称"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black/5 text-gray-900 placeholder-gray-400 transition-all outline-none font-medium text-[15px]"
                />
              </div>

              {/* 签名 */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider ml-1">
                  签名
                </label>
                <input
                  type="text"
                  value={editingAccount ? (editingAccount.signature || '') : newAccountSignature}
                  onChange={(e) => editingAccount
                    ? setEditingAccount({ ...editingAccount, signature: e.target.value })
                    : setNewAccountSignature(e.target.value)
                  }
                  placeholder="写一句签名..."
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black/5 text-gray-900 placeholder-gray-400 transition-all outline-none text-[15px]"
                />
              </div>

              <button
                onClick={editingAccount ? handleSaveEdit : handleCreateAccount}
                disabled={editingAccount ? !editingAccount.name.trim() : !newAccountName.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-[15px] text-white shadow-lg transition-all mt-4 ${(editingAccount ? !editingAccount.name.trim() : !newAccountName.trim())
                    ? 'bg-gray-200 cursor-not-allowed shadow-none text-gray-400'
                    : 'bg-black hover:bg-gray-800 active:scale-[0.98] shadow-black/20'
                  }`}
              >
                {editingAccount ? '保存修改' : '创建身份'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 - 极简风格 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl animate-scale-in text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">删除此身份？</h3>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
              删除后，该身份的所有数据和聊天记录将无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteAccount(showDeleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SwitchAccount
