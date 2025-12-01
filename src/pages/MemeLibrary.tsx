import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

interface Meme {
    id: string
    name: string
    keywords: string
    description: string
    createdAt: number
    priority?: number // 1-3，3最高
}

const MemeLibrary = () => {
    const navigate = useNavigate()
    const [memes, setMemes] = useState<Meme[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newMeme, setNewMeme] = useState({ name: '', keywords: '', description: '', priority: 2 })
    const [searchQuery, setSearchQuery] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem('meme_library_data')
        if (saved) {
            try {
                setMemes(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load memes', e)
            }
        }
    }, [])

    const handleSave = () => {
        if (!newMeme.name.trim() || !newMeme.keywords.trim() || !newMeme.description.trim()) return

        let updatedMemes: Meme[]
        
        if (editingId) {
            // 编辑模式
            updatedMemes = memes.map(m => m.id === editingId ? {
                ...m,
                name: newMeme.name,
                keywords: newMeme.keywords,
                description: newMeme.description,
                priority: newMeme.priority,
            } : m)
        } else {
            // 新增模式
            const meme: Meme = {
                id: Date.now().toString(),
                name: newMeme.name,
                keywords: newMeme.keywords,
                description: newMeme.description,
                createdAt: Date.now(),
                priority: newMeme.priority,
            }
            updatedMemes = [meme, ...memes]
        }

        setMemes(updatedMemes)
        localStorage.setItem('meme_library_data', JSON.stringify(updatedMemes))

        setNewMeme({ name: '', keywords: '', description: '', priority: 2 })
        setEditingId(null)
        setIsModalOpen(false)
    }

    const handleEdit = (meme: Meme) => {
        setNewMeme({
            name: meme.name,
            keywords: meme.keywords,
            description: meme.description,
            priority: meme.priority || 2
        })
        setEditingId(meme.id)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        const updatedMemes = memes.filter(m => m.id !== id)
        setMemes(updatedMemes)
        localStorage.setItem('meme_library_data', JSON.stringify(updatedMemes))
    }

    // 搜索过滤
    const filteredMemes = useMemo(() => {
        if (!searchQuery.trim()) return memes
        const query = searchQuery.toLowerCase()
        return memes.filter(meme =>
            meme.name.toLowerCase().includes(query) ||
            meme.keywords.toLowerCase().includes(query) ||
            meme.description.toLowerCase().includes(query)
        )
    }, [memes, searchQuery])

    return (
        <div className="h-screen flex flex-col bg-[#F5F5F5]">
            {/* 顶部导航 - 纯色背景，不透明，确保状态栏清晰 */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
                <StatusBar />
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">梗库</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2 -mr-2 text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border-none rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                            placeholder="搜索梗、关键词..."
                        />
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredMemes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm text-gray-500">
                            {searchQuery ? '没有找到相关内容' : '暂无收录'}
                        </p>
                    </div>
                ) : (
                    filteredMemes.map(meme => (
                        <div
                            key={meme.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{meme.name}</h3>
                                    {(meme.priority || 1) >= 3 && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">常用</span>}
                                    {(meme.priority || 1) === 2 && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">普通</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(meme)
                                        }}
                                        className="text-gray-400 hover:text-blue-500 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm('确定要删除这个梗吗？')) handleDelete(meme.id)
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {(meme.keywords || '').split(/[,，\s]+/).filter(Boolean).map((kw, i) => (
                                    <span key={i} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        #{kw}
                                    </span>
                                ))}
                            </div>

                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {meme.description}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                    {new Date(meme.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 模态框 - 使用标准样式 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">{editingId ? '编辑梗' : '添加新梗'}</h2>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingId(null); setNewMeme({ name: '', keywords: '', description: '', priority: 2 }) }}
                                className="p-2 -mr-2 text-gray-500 hover:text-gray-800"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    名称
                                </label>
                                <input
                                    type="text"
                                    value={newMeme.name}
                                    onChange={e => setNewMeme({ ...newMeme, name: e.target.value })}
                                    placeholder="例如：肯德基疯狂星期四"
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    关键词
                                </label>
                                <input
                                    type="text"
                                    value={newMeme.keywords}
                                    onChange={e => setNewMeme({ ...newMeme, keywords: e.target.value })}
                                    placeholder="例如：v我50, 疯狂星期四 (用逗号分隔)"
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    描述
                                </label>
                                <textarea
                                    value={newMeme.description}
                                    onChange={e => setNewMeme({ ...newMeme, description: e.target.value })}
                                    placeholder="解释这个梗的意思..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-all outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    优先级
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewMeme({ ...newMeme, priority: p })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                                newMeme.priority === p
                                                    ? p === 3 ? 'bg-orange-500 text-white' : p === 2 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {p === 3 ? '常用' : p === 2 ? '普通' : '偶尔'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!newMeme.name.trim() || !newMeme.keywords.trim() || !newMeme.description.trim()}
                                className={`w-full py-3 rounded-lg font-semibold text-white shadow-sm transition-all mt-2 ${!newMeme.name.trim() || !newMeme.keywords.trim() || !newMeme.description.trim()
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                                    }`}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MemeLibrary
