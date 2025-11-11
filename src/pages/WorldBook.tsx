import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { BackIcon, AddIcon, SearchIcon, MoreIcon, BookIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { lorebookManager, Lorebook } from '../utils/lorebookSystem'

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

  const handleImport = () => {
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BackIcon size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            世界书
          </h1>
          <button
            onClick={handleCreate}
            className="p-2 hover:bg-blue-50 rounded-full transition-colors"
          >
            <AddIcon size={24} className="text-blue-500" />
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 pt-3 pb-2 bg-gray-50">
        <div className="bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
          <SearchIcon size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="搜索世界书"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredLorebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <BookIcon size={64} className="mb-4 text-gray-300" />
            <div className="text-base mb-2">暂无世界书</div>
            <div className="text-xs text-gray-400 mb-6 text-center">
              创建世界书或导入现有的世界书<br />
              支持 SillyTavern 格式
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="bg-blue-500 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors"
              >
                创建世界书
              </button>
              <button
                onClick={handleImport}
                className="bg-white text-gray-700 rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
              >
                导入世界书
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filteredLorebooks.map((lorebook) => (
              <div
                key={lorebook.id}
                className="bg-white rounded-2xl p-4 relative shadow-sm hover:shadow-md transition-shadow"
                onClick={() => handleEdit(lorebook.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookIcon size={20} className="text-blue-500" />
                      <h3 className="text-base font-semibold text-gray-900">
                        {lorebook.name}
                      </h3>
                      {lorebook.is_global && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                          全局
                        </span>
                      )}
                    </div>
                    {lorebook.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 ml-6">
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
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                  >
                    <MoreIcon size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 ml-6">
                  <span>{lorebook.entries.length} 条目</span>
                  {!lorebook.is_global && lorebook.character_ids && lorebook.character_ids.length > 0 && (
                    <span className="text-blue-500">{lorebook.character_ids.length} 个角色</span>
                  )}
                  <span>扫描深度 {lorebook.scan_depth}</span>
                  <span>预算 {lorebook.token_budget}</span>
                </div>

                {/* 菜单 */}
                {showMenu === lorebook.id && (
                  <div 
                    ref={menuRef}
                    className="fixed bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 overflow-hidden z-[9999]"
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
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExport(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      导出
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
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

      {/* 底部操作栏 */}
      {lorebooks.length > 0 && (
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/50">
          <button
            onClick={handleImport}
            className="w-full bg-white text-gray-700 rounded-xl py-3 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            导入世界书
          </button>
        </div>
      )}
    </div>
  )
}

export default WorldBook
