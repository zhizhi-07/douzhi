import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { BackIcon, AddIcon, SearchIcon, MoreIcon, BookIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { lorebookManager, Lorebook } from '../utils/lorebookSystem'
import { promptPassword } from '../utils/passwordProtection'

const WorldBook = () => {
  const navigate = useNavigate()
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLorebooks()
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const loadLorebooks = () => {
    const all = lorebookManager.getAllLorebooks()
    setLorebooks(all)
  }

  const handleCreate = () => {
    navigate('/edit-world-book/new')
  }

  const handleEdit = (id: string) => {
    navigate(`/edit-world-book/${id}`)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个世界书吗？')) {
      lorebookManager.deleteLorebook(id)
      loadLorebooks()
    }
  }

  const handleExport = (id: string) => {
    const json = lorebookManager.exportLorebook(id)
    if (!json) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lorebook_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    // 需要密码验证才能导入世界书
    const verified = await promptPassword()
    if (!verified) {
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const result = lorebookManager.importLorebook(content)
        if (result && result.lorebook) {
          loadLorebooks()

          // 如果有被禁用的条目，显示详细提示
          if (result.disabledEntries.length > 0) {
            const disabledList = result.disabledEntries.map(e => `• ${e.name}`).join('\n')
            alert(`✅ 世界书导入成功！\n\n⚠️ 已自动禁用 ${result.disabledEntries.length} 个栏目：\n${disabledList}\n\n原因：${result.disabledEntries[0].reason}\n\n💡 如需重新启用，请点击世界书进行编辑`)
          } else {
            alert('✅ 导入成功！')
          }
        } else {
          alert('❌ 导入失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const filteredLorebooks = lorebooks.filter(lb =>
    lb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lb.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-serif soft-page-enter" data-worldbook>
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />

      {/* 顶部导航 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <BackIcon size={20} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide font-serif">世界书</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider font-sans">WORLD BOOK</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
        >
          <AddIcon size={20} />
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="px-6 pb-4 relative z-10">
        <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm transition-all focus-within:bg-white/60 focus-within:shadow-md">
          <SearchIcon size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="搜索记忆..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 font-sans"
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 z-0 scrollbar-hide">
        {filteredLorebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/40 shadow-sm">
              <BookIcon size={32} className="text-slate-300 opacity-80" />
            </div>
            <div className="text-lg font-serif text-slate-600 mb-2 tracking-wide">暂无记录</div>
            <div className="text-xs text-slate-400 mb-8 text-center font-sans leading-relaxed max-w-[200px]">
              这里是一片荒芜之地<br />
              等待着您来书写新的篇章
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={handleCreate}
                className="w-full bg-slate-800 text-white rounded-xl px-6 py-3 text-sm font-medium shadow-lg shadow-slate-200 active:scale-95 transition-all font-sans tracking-wide"
              >
                创建新篇章
              </button>
              <button
                onClick={handleImport}
                className="w-full bg-white/50 backdrop-blur-sm text-slate-600 rounded-xl px-6 py-3 text-sm font-medium border border-white/60 hover:bg-white/70 active:scale-95 transition-all font-sans tracking-wide"
              >
                导入世界书
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLorebooks.map((lorebook) => (
              <div
                key={lorebook.id}
                className="group bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 relative shadow-sm hover:shadow-md hover:bg-white/50 transition-all duration-300"
                onClick={() => handleEdit(lorebook.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-medium text-slate-800 font-serif tracking-wide group-hover:text-slate-900 transition-colors">
                        {lorebook.name}
                      </h3>
                      {lorebook.is_global && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/50 text-slate-600 font-medium border border-white/50 backdrop-blur-sm">
                          全局
                        </span>
                      )}
                    </div>
                    {lorebook.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-sans leading-relaxed opacity-80">
                        {lorebook.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMenuPosition({
                        top: rect.bottom + 4,
                        right: window.innerWidth - rect.right
                      })
                      setShowMenu(showMenu === lorebook.id ? null : lorebook.id)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <MoreIcon size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-sans uppercase tracking-wider border-t border-slate-100/50 pt-3 mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    {lorebook.entries.length} 条目
                  </span>
                  {!lorebook.is_global && lorebook.character_ids && lorebook.character_ids.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                      {lorebook.character_ids.length} 关联
                    </span>
                  )}
                  <span className="ml-auto opacity-60">预算 {lorebook.token_budget}</span>
                </div>

                {/* 菜单 */}
                {showMenu === lorebook.id && (
                  <div
                    ref={menuRef}
                    className="fixed bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/60 overflow-hidden z-[9999] min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50/80 transition-colors font-sans"
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExport(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50/80 transition-colors font-sans"
                    >
                      导出
                    </button>
                    <div className="h-px bg-slate-100 mx-2 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50/50 transition-colors font-sans"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作栏 - 仅在有列表时显示 */}
      {lorebooks.length > 0 && (
        <div className="px-6 py-4 bg-white/30 backdrop-blur-md border-t border-white/50">
          <button
            onClick={handleImport}
            className="w-full bg-white/60 backdrop-blur-md text-slate-600 rounded-xl py-3 text-sm font-medium shadow-sm border border-white/60 hover:bg-white/80 active:scale-95 transition-all font-sans tracking-wide"
          >
            导入世界书
          </button>
        </div>
      )}
    </div>
  )
}

export default WorldBook
