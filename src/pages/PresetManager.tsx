import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BackIcon, AddIcon, SearchIcon, MoreIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'

interface Preset {
  id: string
  name: string
  content: string
}

const PresetManager = () => {
  const navigate = useNavigate()
  const [presetList, setPresetList] = useState<Preset[]>([])
  const [activePreset, setActivePreset] = useState<string>('默认')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPresets()
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

  const loadPresets = useCallback(() => {
    const stored = localStorage.getItem('offline-presets')
    if (stored) {
      try {
        let presets = JSON.parse(stored)
        // 兼容旧数据：如果没有id字段，添加id
        presets = presets.map((p: any) => {
          if (!p.id) {
            return { ...p, id: Date.now().toString() + Math.random().toString(36) }
          }
          return p
        })
        setPresetList(presets)
        // 更新localStorage
        localStorage.setItem('offline-presets', JSON.stringify(presets))
      } catch (e) {
        console.error('预设列表加载失败:', e)
      }
    }

    const savedActive = localStorage.getItem('offline-active-preset')
    if (savedActive) {
      setActivePreset(savedActive)
    }
  }, [])

  const handleCreate = () => {
    navigate('/edit-preset/new')
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
        try {
          const content = event.target?.result as string
          const preset = JSON.parse(content)
          const presetName = preset.name || file.name.replace('.json', '')
          const presetId = Date.now().toString()

          // 检查是否已存在
          const existingIndex = presetList.findIndex(p => p.name === presetName)
          let updatedList: Preset[]

          if (existingIndex >= 0) {
            updatedList = [...presetList]
            updatedList[existingIndex] = { id: updatedList[existingIndex].id, name: presetName, content }
            alert(`预设「${presetName}」已更新`)
          } else {
            updatedList = [...presetList, { id: presetId, name: presetName, content }]
            alert(`预设「${presetName}」已导入`)
          }

          setPresetList(updatedList)
          localStorage.setItem('offline-presets', JSON.stringify(updatedList))

          console.log('✅ 预设已导入:', presetName)
        } catch (error) {
          console.error('预设解析失败:', error)
          alert('预设文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleEdit = (id: string) => {
    navigate(`/edit-preset/${id}`)
  }

  const handleSwitch = (presetName: string) => {
    const preset = presetList.find(p => p.name === presetName)
    if (preset) {
      localStorage.setItem('offline-preset', preset.content)
      localStorage.setItem('offline-active-preset', presetName)
      setActivePreset(presetName)
      console.log('✅ 已切换到预设:', presetName)
      alert(`已切换到预设「${presetName}」`)
    } else if (presetName === '默认') {
      localStorage.removeItem('offline-preset')
      localStorage.setItem('offline-active-preset', '默认')
      setActivePreset('默认')
      console.log('✅ 已切换到默认预设')
      alert('已切换到默认预设')
    }
    setShowMenu(null)
  }

  const handleExport = (id: string) => {
    const preset = presetList.find(p => p.id === id)
    if (!preset) return

    const blob = new Blob([preset.content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(null)
  }

  const handleDelete = (id: string) => {
    const preset = presetList.find(p => p.id === id)
    if (!preset) return

    if (confirm(`确定删除预设「${preset.name}」？`)) {
      const updatedList = presetList.filter(p => p.id !== id)
      setPresetList(updatedList)
      localStorage.setItem('offline-presets', JSON.stringify(updatedList))

      if (activePreset === preset.name) {
        handleSwitch('默认')
      }

      console.log('✅ 预设已删除:', preset.name)
      setShowMenu(null)
    }
  }

  const filteredPresets = presetList.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 soft-page-enter">
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
            预设管理
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
      <div className="px-4 pt-3 pb-2 bg-slate-50/50">
        <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_2px_8px_rgba(148,163,184,0.08)]">
          <SearchIcon size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="搜索预设"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* 默认预设 */}
        <div className="space-y-3 mt-3">
          <div
            className="glass-card rounded-xl p-4 relative shadow-[0_2px_12px_rgba(148,163,184,0.1)] hover:shadow-[0_4px_16px_rgba(148,163,184,0.15)] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1" onClick={() => handleEdit('default')}>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <h3 className="text-base font-semibold text-slate-700">
                    默认
                  </h3>
                  {activePreset === '默认' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-white font-medium shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                      使用中
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 ml-6">
                  系统默认小说叙事风格，适合大多数场景
                </p>
              </div>
              <button
                onClick={() => handleSwitch('默认')}
                className="px-3 py-2 text-xs bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all ml-2 font-medium shadow-[0_2px_6px_rgba(71,85,105,0.2)]"
              >
                {activePreset === '默认' ? '使用中' : '切换使用'}
              </button>
            </div>
          </div>

          {/* 用户预设列表 */}
          {filteredPresets.map((preset) => {
            // 解析预设内容
            let presetData: any = {}
            try {
              presetData = JSON.parse(preset.content)
            } catch (e) {
              console.error('预设解析失败:', e)
            }
            
            // 提取描述信息
            const description = presetData.description || ''
            const systemPrompt = presetData.system_prompt || presetData.systemPrompt || ''
            
            // 如果有prompts数组，提取第一个enabled的prompt
            let promptsInfo = ''
            if (presetData.prompts && Array.isArray(presetData.prompts)) {
              const enabledPrompts = presetData.prompts.filter((p: any) => p.enabled)
              promptsInfo = `${presetData.prompts.length}个提示词`
              if (enabledPrompts.length > 0) {
                promptsInfo += ` (${enabledPrompts.length}个启用)`
              }
            }
            
            const preview = description || (systemPrompt ? systemPrompt.substring(0, 100) + '...' : (promptsInfo || 'SillyTavern预设'))
            
            return (
              <div
                key={preset.id}
                className="glass-card rounded-xl p-4 relative shadow-[0_2px_12px_rgba(148,163,184,0.1)] hover:shadow-[0_4px_16px_rgba(148,163,184,0.15)] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1" onClick={() => handleEdit(preset.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <h3 className="text-base font-semibold text-slate-700 truncate">
                        {preset.name}
                      </h3>
                      {activePreset === preset.name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-white font-medium flex-shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                          使用中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 ml-6">
                      {preview}
                    </p>
                    {presetData.temperature && (
                      <div className="flex items-center gap-3 text-xs text-slate-400 ml-6 mt-1">
                        <span>温度 {presetData.temperature}</span>
                        {presetData.max_tokens && <span>最大tokens {presetData.max_tokens}</span>}
                      </div>
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
                    setShowMenu(showMenu === preset.id ? null : preset.id)
                  }}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors ml-2"
                >
                  <MoreIcon size={20} className="text-gray-400" />
                </button>
              </div>

              {/* 菜单 */}
              {showMenu === preset.id && (
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
                    onClick={() => handleSwitch(preset.name)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {activePreset === preset.name ? '当前使用' : '切换使用'}
                  </button>
                  <button
                    onClick={() => handleEdit(preset.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleExport(preset.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    导出
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
            )
          })}
        </div>

        {filteredPresets.length === 0 && presetList.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-base mb-2">未找到匹配的预设</div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/50 space-y-3">
        <button
          onClick={handleImport}
          className="w-full bg-white text-gray-700 rounded-xl py-3 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          导入预设
        </button>
      </div>
    </div>
  )
}

export default PresetManager
