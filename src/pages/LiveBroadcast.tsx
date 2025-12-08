import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar';
import { liveStreamService, LiveStream, LIVE_CATEGORIES } from '../services/liveStreamService';

// 格式化观众数
const formatViewers = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
};

const LiveBroadcast = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('推荐');
    const [streams, setStreams] = useState<LiveStream[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStreamer, setNewStreamer] = useState({ name: '', personality: '', category: '聊天' });

    const tabs = LIVE_CATEGORIES;

    // 初始化加载直播数据
    useEffect(() => {
        const loadStreams = async () => {
            setIsLoading(true);
            try {
                const data = await liveStreamService.initialize();
                setStreams(data);
            } catch (e) {
                console.error('加载直播失败:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadStreams();
    }, []);

    // 按分类筛选
    const filteredStreams = activeTab === '推荐' 
        ? streams 
        : streams.filter(s => s.category === activeTab);

    const heroStream = filteredStreams[0];
    const gridStreams = filteredStreams.slice(1);

    // 刷新直播
    const handleRefresh = async () => {
        setIsLoading(true);
        liveStreamService.clearCache();
        try {
            const data = await liveStreamService.initialize(true);
            setStreams(data);
        } catch (e) {
            console.error('刷新失败:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // 添加主播
    const handleAddStreamer = () => {
        if (!newStreamer.name.trim()) return;
        liveStreamService.addCustomStreamer({
            name: newStreamer.name,
            personality: newStreamer.personality,
            category: newStreamer.category
        });
        setNewStreamer({ name: '', personality: '', category: '聊天' });
        setShowAddModal(false);
        // 刷新直播列表
        handleRefresh();
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white font-serif overflow-hidden relative">
            {/* Background Ambient Light */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

            {/* 合并的状态栏+导航栏 */}
            <div className="relative z-10 bg-gradient-to-b from-black/60 to-transparent">
                <StatusBar theme="dark" />
                <div className="px-6 pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                >
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-light tracking-[0.2em] text-white/90">直播 · LIVE</h1>
                <div className="flex items-center gap-2">
                    {/* 刷新按钮 */}
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                    >
                        <svg className={`w-5 h-5 text-white/80 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {/* 添加按钮 */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                    >
                        <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
                </div>
            </div>

            {/* Categories */}
            <div className="relative z-10 px-6 mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm tracking-widest pb-2 transition-all duration-300 relative ${activeTab === tab ? 'text-white font-medium' : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 relative z-10 scrollbar-hide">
                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-4" />
                        <p className="text-white/40 text-sm tracking-wider">正在加载直播...</p>
                    </div>
                ) : filteredStreams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <p className="text-white/40 text-sm tracking-wider">暂无直播</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs text-white/70 hover:bg-white/20 transition-all"
                        >
                            刷新
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Hero Section */}
                        {heroStream && (
                            <div
                                className="mb-8 relative group cursor-pointer"
                                onClick={() => navigate(`/live/${heroStream.id}`)}
                            >
                                <div className={`w-full aspect-[16/10] rounded-2xl bg-gradient-to-br ${heroStream.color} relative overflow-hidden shadow-2xl shadow-purple-900/20`}>
                                    <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-xs text-white/90 tracking-wider">LIVE</span>
                                        </div>
                                    </div>

                                    {/* 主播头像 */}
                                    {heroStream.streamerAvatar && (
                                        <div className="absolute top-4 left-4">
                                            <img src={heroStream.streamerAvatar} alt="" className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" />
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <span className="inline-block px-2 py-0.5 mb-2 text-[10px] border border-white/20 rounded text-white/60 tracking-wider uppercase">
                                                    {heroStream.category}
                                                </span>
                                                <h2 className="text-2xl font-medium text-white mb-1 tracking-wide leading-tight">
                                                    {heroStream.title}
                                                </h2>
                                                <p className="text-sm text-white/60 font-light flex items-center">
                                                    {!heroStream.streamerAvatar && <span className="w-4 h-4 rounded-full bg-white/20 mr-2" />}
                                                    {heroStream.streamerName}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-white/50 font-light tracking-wider mb-1">观众</p>
                                                <p className="text-lg font-medium text-white/90 tabular-nums">{formatViewers(heroStream.viewers)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid Section */}
                        <div className="grid grid-cols-2 gap-4">
                            {gridStreams.map((stream) => (
                                <div
                                    key={stream.id}
                                    className="group cursor-pointer"
                                    onClick={() => navigate(`/live/${stream.id}`)}
                                >
                                    <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${stream.color} relative overflow-hidden mb-3 shadow-lg transition-transform duration-500 group-hover:scale-[1.02]`}>
                                        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        
                                        {/* 主播头像 */}
                                        {stream.streamerAvatar && (
                                            <div className="absolute top-2 left-2">
                                                <img src={stream.streamerAvatar} alt="" className="w-8 h-8 rounded-full border border-white/30 object-cover" />
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                            <div className="px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm border border-white/5 text-[10px] text-white/80">
                                                {formatViewers(stream.viewers)}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <h3 className="text-sm font-medium text-white mb-0.5 line-clamp-1">{stream.title}</h3>
                                            <p className="text-[10px] text-white/50">{stream.streamerName}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 刷新按钮 */}
                        <div className="py-8 text-center">
                            <button
                                onClick={handleRefresh}
                                className="px-6 py-2 bg-white/5 rounded-full text-xs text-white/40 hover:bg-white/10 hover:text-white/60 transition-all tracking-wider"
                            >
                                换一批
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 添加主播弹窗 */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-medium text-white mb-6 text-center tracking-wider">添加主播</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/50 mb-2 block">主播名称</label>
                                <input
                                    type="text"
                                    value={newStreamer.name}
                                    onChange={e => setNewStreamer({ ...newStreamer, name: e.target.value })}
                                    placeholder="输入主播名称"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs text-white/50 mb-2 block">主播人设</label>
                                <textarea
                                    value={newStreamer.personality}
                                    onChange={e => setNewStreamer({ ...newStreamer, personality: e.target.value })}
                                    placeholder="描述主播的性格、风格、擅长内容..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs text-white/50 mb-2 block">直播分类</label>
                                <div className="flex flex-wrap gap-2">
                                    {LIVE_CATEGORIES.filter(c => c !== '推荐').map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewStreamer({ ...newStreamer, category: cat })}
                                            className={`px-4 py-2 rounded-full text-xs transition-all ${
                                                newStreamer.category === cat
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleAddStreamer}
                            disabled={!newStreamer.name.trim()}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                        >
                            添加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveBroadcast;
