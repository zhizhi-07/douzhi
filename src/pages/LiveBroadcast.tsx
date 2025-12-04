import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LiveBroadcast = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('推荐');

    const tabs = ['推荐', '音乐', '情感', '助眠', '二次元'];

    // Mock data for live streams
    const heroStream = {
        id: 1,
        title: '深夜的爵士乐与红酒',
        streamer: 'JazzVibe',
        viewers: '12.5k',
        color: 'from-purple-900 to-indigo-900',
        tag: '音乐'
    };

    const streams = [
        { id: 2, title: '雨夜读书会', streamer: '文艺青年', viewers: '8.2k', color: 'from-slate-800 to-gray-800', tag: '情感' },
        { id: 3, title: '古风琵琶演奏', streamer: '清音阁', viewers: '5.6k', color: 'from-amber-900 to-orange-900', tag: '音乐' },
        { id: 4, title: '助眠白噪音：海浪', streamer: 'SleepWell', viewers: '20k', color: 'from-blue-900 to-cyan-900', tag: '助眠' },
        { id: 5, title: '老电影放映室', streamer: '怀旧时光', viewers: '3.4k', color: 'from-neutral-800 to-stone-800', tag: '二次元' },
        { id: 6, title: '城市夜景漫游', streamer: 'CityWalker', viewers: '15k', color: 'from-emerald-900 to-teal-900', tag: '情感' },
    ];

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white font-serif overflow-hidden relative">
            {/* Background Ambient Light */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                >
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-light tracking-[0.2em] text-white/90">直播 · LIVE</h1>
                <div className="w-10" /> {/* Spacer */}
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

                {/* Hero Section */}
                <div
                    className="mb-8 relative group cursor-pointer"
                    onClick={() => navigate(`/live/${heroStream.id}`)}
                >
                    <div className={`w-full aspect-[16/10] rounded-2xl bg-gradient-to-br ${heroStream.color} relative overflow-hidden shadow-2xl shadow-purple-900/20`}>
                        {/* Abstract Shapes/Noise */}
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        <div className="absolute top-0 right-0 p-4">
                            <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center space-x-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs text-white/90 tracking-wider">LIVE</span>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <div className="flex items-end justify-between">
                                <div>
                                    <span className="inline-block px-2 py-0.5 mb-2 text-[10px] border border-white/20 rounded text-white/60 tracking-wider uppercase">
                                        {heroStream.tag}
                                    </span>
                                    <h2 className="text-2xl font-medium text-white mb-1 tracking-wide leading-tight">
                                        {heroStream.title}
                                    </h2>
                                    <p className="text-sm text-white/60 font-light flex items-center">
                                        <span className="w-4 h-4 rounded-full bg-white/20 mr-2" />
                                        {heroStream.streamer}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/50 font-light tracking-wider mb-1">观众</p>
                                    <p className="text-lg font-medium text-white/90 tabular-nums">{heroStream.viewers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-2 gap-4">
                    {streams.map((stream) => (
                        <div
                            key={stream.id}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/live/${stream.id}`)}
                        >
                            <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${stream.color} relative overflow-hidden mb-3 shadow-lg transition-transform duration-500 group-hover:scale-[1.02]`}>
                                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                <div className="absolute top-2 right-2">
                                    <div className="px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm border border-white/5 text-[10px] text-white/80">
                                        {stream.viewers}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-sm font-medium text-white mb-0.5 line-clamp-1">{stream.title}</h3>
                                    <p className="text-[10px] text-white/50">{stream.streamer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer/Loading Hint */}
                <div className="py-8 text-center">
                    <p className="text-xs text-white/20 tracking-[0.3em] font-light">THE END</p>
                </div>
            </div>
        </div>
    );
};

export default LiveBroadcast;
