import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: number;
    user: string;
    text: string;
}

interface FloatingHeart {
    id: number;
    left: number; // percentage
    animationDuration: number;
}

const LiveRoom = () => {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFollowed, setIsFollowed] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

    // Mock chat messages
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, user: 'MoonWalker', text: '这首曲子太美了...' },
        { id: 2, user: 'Susu', text: '晚上好，主播' },
        { id: 3, user: 'CoffeeLover', text: '氛围感拉满' },
    ]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const heartIdCounter = useRef(0);

    // Auto-hide controls timer
    useEffect(() => {
        if (!showControls) return;
        const timer = setTimeout(() => setShowControls(false), 5000); // Extended to 5s
        return () => clearTimeout(timer);
    }, [showControls]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleScreenClick = () => {
        setShowControls(!showControls);
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLiked(!liked);
        triggerHeartAnimation();
    };

    const triggerHeartAnimation = () => {
        const id = heartIdCounter.current++;
        const newHeart: FloatingHeart = {
            id,
            left: 50 + (Math.random() * 40 - 20), // Random horizontal position near center-right
            animationDuration: 1.5 + Math.random(),
        };

        setFloatingHearts(prev => [...prev, newHeart]);

        // Remove heart after animation
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== id));
        }, 2500);
    };

    const handleSendMessage = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            const newMessage: Message = {
                id: Date.now(),
                user: 'Me',
                text: inputValue.trim()
            };
            setMessages(prev => [...prev, newMessage]);
            setInputValue('');
            // Reset auto-hide timer
            setShowControls(true);
        }
    };

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowed(!isFollowed);
    };

    return (
        <div
            className="h-full w-full relative bg-black text-white font-serif overflow-hidden"
            onClick={handleScreenClick}
        >
            {/* Background / Video Feed Simulation */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-pulse-slow">
                    {/* Abstract visual noise/texture */}
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    {/* Simulated light spots */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
                </div>

                {/* Placeholder for actual video content */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/10 text-9xl font-serif tracking-widest opacity-20">LIVE</span>
                </div>
            </div>

            {/* Floating Hearts Container */}
            <div className="absolute bottom-20 right-4 w-20 h-64 pointer-events-none z-10 overflow-hidden">
                {floatingHearts.map(heart => (
                    <div
                        key={heart.id}
                        className="absolute bottom-0 text-red-500 animate-float-up opacity-0"
                        style={{
                            left: `${heart.left}%`,
                            animationDuration: `${heart.animationDuration}s`
                        }}
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                ))}
            </div>

            {/* Top Bar - Streamer Info */}
            <div className={`absolute top-0 left-0 w-full p-4 pt-12 flex items-center justify-between z-20 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div
                    className="flex items-center bg-black/20 backdrop-blur-md rounded-full pl-1 pr-4 py-1 border border-white/10 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-amber-500 mr-3" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide">JazzVibe</span>
                        <span className="text-[10px] text-white/60">12.5k 观看</span>
                    </div>
                    <button
                        onClick={handleFollow}
                        className={`ml-4 px-3 py-0.5 rounded-full text-[10px] transition-all duration-300 ${isFollowed
                                ? 'bg-white/10 text-white/60'
                                : 'bg-red-500/80 text-white hover:bg-red-600'
                            }`}
                    >
                        {isFollowed ? '已关注' : '关注'}
                    </button>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Viewer List Preview */}
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border border-black bg-white/10 backdrop-blur-sm" />
                        ))}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Bottom Area - Chat & Controls */}
            <div
                className={`absolute bottom-0 left-0 w-full z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-8 px-4 transition-transform duration-500 ${showControls ? 'translate-y-0' : 'translate-y-[20%]'}`}
                onClick={(e) => e.stopPropagation()}
            >

                {/* Chat Messages */}
                <div
                    ref={chatContainerRef}
                    className="w-3/4 max-h-48 overflow-y-auto mb-6 space-y-2 mask-image-linear-gradient-to-t scrollbar-hide"
                >
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start space-x-2 animate-fade-in-up">
                            <span className="text-white/60 text-sm font-medium whitespace-nowrap">{msg.user}:</span>
                            <span className="text-white/90 text-sm font-light leading-relaxed shadow-black drop-shadow-md">{msg.text}</span>
                        </div>
                    ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleSendMessage}
                            placeholder="说点什么..."
                            className="w-full h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 text-white text-sm font-light placeholder-white/40 focus:outline-none focus:bg-black/40 focus:border-white/20 transition-all"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        <button className="p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleLike}
                            className={`p-2 rounded-full backdrop-blur-sm border transition-all duration-300 active:scale-90 ${liked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                            <svg className={`w-6 h-6 ${liked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveRoom;
