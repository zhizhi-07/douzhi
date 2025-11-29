import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon, SaveIcon, AddIcon, EditIcon, DeleteIcon, CloseIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { lorebookManager, Lorebook, LorebookEntry } from '../utils/lorebookSystem'
import { characterService } from '../services/characterService'

const EditWorldBook = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scanDepth, setScanDepth] = useState(10)
  const [tokenBudget, setTokenBudget] = useState(2000)
  const [recursiveScanning, setRecursiveScanning] = useState(false)
  const [entries, setEntries] = useState<LorebookEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null)
  const [showEntryEditor, setShowEntryEditor] = useState(false)
  const [isGlobal, setIsGlobal] = useState(false)
  const [characterIds, setCharacterIds] = useState<string[]>([])
  const [showCharacterSelector, setShowCharacterSelector] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      const lorebook = lorebookManager.getLorebook(id)
      if (lorebook) {
        setName(lorebook.name)
        setDescription(lorebook.description)
        setScanDepth(lorebook.scan_depth)
        setTokenBudget(lorebook.token_budget)
        setRecursiveScanning(lorebook.recursive_scanning)
        setEntries(lorebook.entries)
        setIsGlobal(lorebook.is_global)
        setCharacterIds(lorebook.character_ids || [])
      }
    }
  }, [id, isNew])

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入世界书名称')
      return
    }

    if (isNew) {
      lorebookManager.createLorebook({
        name: name.trim(),
        description: description.trim(),
        entries,
        scan_depth: scanDepth,
        token_budget: tokenBudget,
        recursive_scanning: recursiveScanning,
        is_global: isGlobal,
        character_ids: isGlobal ? [] : characterIds
      })
      alert('创建成功！')
    } else if (id) {
      lorebookManager.updateLorebook(id, {
        name: name.trim(),
        description: description.trim(),
        entries,
        scan_depth: scanDepth,
        token_budget: tokenBudget,
        recursive_scanning: recursiveScanning,
        is_global: isGlobal,
        character_ids: isGlobal ? [] : characterIds
      })
      alert('保存成功！')
    }

    navigate(-1)
  }

  const handleAddEntry = () => {
    setEditingEntry({
      id: '',
      name: '',
      keys: [],
      content: '',
      enabled: true,
      priority: 500,
      insertion_order: entries.length,
      case_sensitive: false,
      use_regex: false,
      token_budget: 200,
      constant: false,
      selective: false,
      position: 'before_char',
      comment: '',
      category: '',
      created_at: Date.now(),
      updated_at: Date.now()
    })
    setShowEntryEditor(true)
  }

  const handleEditEntry = (entry: LorebookEntry) => {
    setEditingEntry({ ...entry })
    setShowEntryEditor(true)
  }

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('确定要删除这个条目吗？')) {
      setEntries(entries.filter(e => e.id !== entryId))
    }
  }

  const handleToggleEntry = (entryId: string) => {
    setEntries(entries.map(e => 
      e.id === entryId ? { ...e, enabled: !e.enabled } : e
    ))
  }

  const handleSaveEntry = (entry: LorebookEntry) => {
    if (entry.id) {
      // 更新现有条目
      setEntries(entries.map(e => e.id === entry.id ? entry : e))
    } else {
      // 添加新条目
      const newEntry = {
        ...entry,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      setEntries([...entries, newEntry])
    }
    setShowEntryEditor(false)
    setEditingEntry(null)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" data-worldbook>
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
            {isNew ? '创建世界书' : '编辑世界书'}
          </h1>
          <button
            onClick={handleSave}
            className="p-2 hover:bg-blue-50 rounded-full transition-colors"
          >
            <SaveIcon size={24} className="text-blue-500" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 基本信息 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">基本信息</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：修仙世界"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要说明用途"
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* 角色绑定 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">适用范围</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700 font-medium">全局世界书</span>
                <p className="text-xs text-gray-500 mt-0.5">对所有角色生效</p>
              </div>
              <button
                onClick={() => {
                  setIsGlobal(!isGlobal)
                  if (!isGlobal) {
                    setCharacterIds([])
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isGlobal ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isGlobal ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!isGlobal && (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">绑定角色 ({characterIds.length})</span>
                    <button
                      onClick={() => setShowCharacterSelector(true)}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      + 添加角色
                    </button>
                  </div>
                  
                  {characterIds.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-2">
                      未绑定任何角色
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {characterIds.map(charId => {
                        const character = characterService.getById(charId)
                        if (!character) return null
                        return (
                          <div
                            key={charId}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs"
                          >
                            <span>{character.nickname || character.realName}</span>
                            <button
                              onClick={() => setCharacterIds(characterIds.filter(id => id !== charId))}
                              className="hover:bg-blue-100 rounded-full p-0.5"
                            >
                              <CloseIcon size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 全局设置 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">全局设置</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">扫描深度（最近N条消息）</label>
              <input
                type="number"
                value={scanDepth}
                onChange={(e) => setScanDepth(Number(e.target.value))}
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Token 预算</label>
              <input
                type="number"
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                min="100"
                max="10000"
                step="100"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700">递归扫描</span>
              <button
                onClick={() => setRecursiveScanning(!recursiveScanning)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  recursiveScanning ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    recursiveScanning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 条目列表 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">条目 ({entries.length})</h2>
            <button
              onClick={handleAddEntry}
              className="p-1.5 hover:bg-blue-50 rounded-full transition-colors"
            >
              <AddIcon size={20} className="text-blue-500" />
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              暂无条目，点击右上角 + 添加
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{entry.name}</h3>
                      <div className="text-xs text-gray-500 mb-2">
                        关键词: {entry.keys.length > 0 ? entry.keys.join(', ') : '无'}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {entry.content}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-1.5 hover:bg-white rounded-full transition-colors"
                      >
                        <EditIcon size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <DeleteIcon size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-400">
                      <span>优先级 {entry.priority}</span>
                      <span>{entry.position === 'before_char' ? '角色前' : entry.position === 'after_char' ? '角色后' : entry.position === 'top' ? '顶部' : '底部'}</span>
                      {entry.constant && <span className="text-blue-500">始终注入</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{entry.enabled ? '已启用' : '已禁用'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleEntry(entry.id)
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          entry.enabled ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            entry.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 条目编辑器模态框 */}
      {showEntryEditor && editingEntry && (
        <EntryEditor
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => {
            setShowEntryEditor(false)
            setEditingEntry(null)
          }}
        />
      )}

      {/* 角色选择器模态框 */}
      {showCharacterSelector && (
        <CharacterSelector
          selectedIds={characterIds}
          onConfirm={(ids) => {
            setCharacterIds(ids)
            setShowCharacterSelector(false)
          }}
          onCancel={() => setShowCharacterSelector(false)}
        />
      )}
    </div>
  )
}

// 条目编辑器组件
interface EntryEditorProps {
  entry: LorebookEntry
  onSave: (entry: LorebookEntry) => void
  onCancel: () => void
}

const EntryEditor = ({ entry: initialEntry, onSave, onCancel }: EntryEditorProps) => {
  const [entry, setEntry] = useState(initialEntry)
  const [keyInput, setKeyInput] = useState('')

  const handleAddKey = () => {
    if (keyInput.trim()) {
      setEntry({
        ...entry,
        keys: [...entry.keys, keyInput.trim()]
      })
      setKeyInput('')
    }
  }

  const handleRemoveKey = (index: number) => {
    setEntry({
      ...entry,
      keys: entry.keys.filter((_, i) => i !== index)
    })
  }

  const handleSave = () => {
    if (!entry.name.trim()) {
      alert('请输入条目名称')
      return
    }
    if (entry.keys.length === 0 && !entry.constant) {
      alert('请添加至少一个关键词，或启用"始终注入"')
      return
    }
    if (!entry.content.trim()) {
      alert('请输入内容')
      return
    }
    onSave(entry)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {entry.id ? '编辑条目' : '新建条目'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseIcon size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 基本信息 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">条目名称</label>
            <input
              type="text"
              value={entry.name}
              onChange={(e) => setEntry({ ...entry, name: e.target.value })}
              placeholder="例如：境界设定"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 关键词 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">触发关键词</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
                placeholder="输入关键词后按回车"
                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleAddKey}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.keys.map((key, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                >
                  {key}
                  <button
                    onClick={() => handleRemoveKey(index)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <CloseIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">内容</label>
            <textarea
              value={entry.content}
              onChange={(e) => setEntry({ ...entry, content: e.target.value })}
              placeholder="输入要注入的内容..."
              rows={8}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* 高级选项 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">优先级（0-999）</label>
              <input
                type="number"
                value={entry.priority}
                onChange={(e) => setEntry({ ...entry, priority: Number(e.target.value) })}
                min="0"
                max="999"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">插入位置</label>
              <select
                value={entry.position}
                onChange={(e) => setEntry({ ...entry, position: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="top">顶部</option>
                <option value="before_char">角色前</option>
                <option value="after_char">角色后</option>
                <option value="bottom">底部</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">启用</span>
                <button
                  onClick={() => setEntry({ ...entry, enabled: !entry.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    entry.enabled ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      entry.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">始终注入</span>
                <button
                  onClick={() => setEntry({ ...entry, constant: !entry.constant })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    entry.constant ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      entry.constant ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">大小写敏感</span>
                <button
                  onClick={() => setEntry({ ...entry, case_sensitive: !entry.case_sensitive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    entry.case_sensitive ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      entry.case_sensitive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-4 py-3 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// 角色选择器组件
interface CharacterSelectorProps {
  selectedIds: string[]
  onConfirm: (ids: string[]) => void
  onCancel: () => void
}

const CharacterSelector = ({ selectedIds, onConfirm, onCancel }: CharacterSelectorProps) => {
  const [selected, setSelected] = useState<string[]>(selectedIds)
  const allCharacters = characterService.getAll()

  const toggleCharacter = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(cid => cid !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">选择角色</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseIcon size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          {allCharacters.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无角色，请先创建角色
            </div>
          ) : (
            <div className="space-y-2">
              {allCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => toggleCharacter(character.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selected.includes(character.id)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {character.avatar ? (
                      <img src={character.avatar} alt={character.nickname || character.realName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {(character.nickname || character.realName).charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">{character.nickname || character.realName}</div>
                    {character.signature && (
                      <div className="text-xs text-gray-500 truncate">{character.signature}</div>
                    )}
                  </div>

                  {/* 选中图标 */}
                  {selected.includes(character.id) && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-4 py-3 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
          >
            确定 {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditWorldBook
