import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { liveStreamService, LiveStream, GIFT_LIST, GiftType } from '../services/liveStreamService';
import { getUserInfo } from '../utils/userUtils';

interface Message {
    id: string;
    user: string;
    text: string;
    isStreamer?: boolean;
    isGift?: boolean;
    giftIcon?: string;
    giftName?: string;
    giftCount?: number;
}

interface FloatingHeart {
    id: number;
    left: number;
    animationDuration: number;
}

// 礼物展示状态
interface GiftState {
    id: string;
    sender: string;
    senderAvatar?: string;
    giftName: string;
    giftIcon: string;
    giftColor: string;
    count: number;
    timestamp: number;
}

const formatViewers = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
};

const LiveRoom = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [stream, setStream] = useState<LiveStream | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
    const [showGiftPanel, setShowGiftPanel] = useState(false);
    // 弹幕列表
    const [danmakuList, setDanmakuList] = useState<{id: string, text: string, user: string, top: number, duration: number, color: string}[]>([]);
    
    // 旁白状态
    const [narration, setNarration] = useState<string>('');
    
    // 新的礼物系统 State
    const [currentGift, setCurrentGift] = useState<GiftState | null>(null);
    const [fullScreenEffect, setFullScreenEffect] = useState<GiftType['animationType'] | null>(null);
    
    const userInfo = getUserInfo();

    const heartIdCounter = useRef(0);
    const giftTimerRef = useRef<NodeJS.Timeout | null>(null);
    const effectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load stream data
    useEffect(() => {
        const loadStream = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                await liveStreamService.initialize();
                const streamData = liveStreamService.getStream(id);
                if (streamData) {
                    setStream(streamData);
                    liveStreamService.addViewer(id);
                    loadInitialComments();
                    // 设置初始旁白
                    setNarration(streamData.description || '');
                }
            } catch (e) {
                console.error('Load stream failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadStream();

        return () => {
            if (giftTimerRef.current) {
                clearTimeout(giftTimerRef.current);
            }
            if (effectTimerRef.current) {
                clearTimeout(effectTimerRef.current);
            }
        };
    }, [id]);

    // Load initial comments from stream data
    const loadInitialComments = () => {
        if (!id) return;
        
        const streamData = liveStreamService.getStream(id);
        if (streamData?.comments?.length) {
            const existingMsgs: Message[] = streamData.comments.map(c => ({
                id: c.id,
                user: c.userName,
                text: c.content,
                isStreamer: c.userId === streamData.streamerId
            }));
            
            // 初始弹幕随机飘过
            existingMsgs.forEach((msg, index) => {
                setTimeout(() => {
                   addDanmaku(msg);
                }, index * 800 + Math.random() * 1000);
            });
        }
    };

    // 添加弹幕到屏幕
    const addDanmaku = (msg: Message) => {
        const newDanmaku = {
            id: `danmaku_${msg.id}_${Date.now()}`,
            text: msg.isGift ? `${msg.giftIcon} ${msg.giftName}` : msg.text,
            user: msg.user,
            top: 15 + Math.random() * 40, // 15% - 55% 区域，避开顶部信息和底部
            duration: 8 + Math.random() * 4, // 8-12s
            color: msg.isStreamer ? '#ff69b4' : (msg.isGift ? '#fbbf24' : '#ffffff')
        };
        
        setDanmakuList(prev => [...prev, newDanmaku]);
        
        // 动画结束后清理
        setTimeout(() => {
            setDanmakuList(prev => prev.filter(d => d.id !== newDanmaku.id));
        }, newDanmaku.duration * 1000);
    };

    // 刷新直播内容
    const handleRefresh = async () => {
        if (!id || isRefreshing) return;
        setIsRefreshing(true);
        try {
            await liveStreamService.initialize(true);
            const streamData = liveStreamService.getStream(id);
            if (streamData) {
                setStream(streamData);
                setDanmakuList([]); // 清空弹幕
                loadInitialComments();
            }
        } catch (e) {
            console.error('刷新失败:', e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLiked(!liked);
        if (id) liveStreamService.addLike(id);
        triggerHeartAnimation();
    };

    const triggerHeartAnimation = () => {
        const heartId = heartIdCounter.current++;
        const newHeart: FloatingHeart = {
            id: heartId,
            left: 50 + (Math.random() * 40 - 20),
            animationDuration: 1.5 + Math.random(),
        };
        setFloatingHearts(prev => [...prev, newHeart]);
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
        }, 2500);
    };

    // Send gift
    const handleSendGift = async (gift: GiftType) => {
        if (!id || !stream) return;
        
        const userName = userInfo.nickname || '我';
        
        if (currentGift && currentGift.sender === userName && currentGift.giftName === gift.name) {
            setCurrentGift(prev => prev ? {
                ...prev, 
                count: prev.count + 1,
                timestamp: Date.now() 
            } : null);
            
            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            giftTimerRef.current = setTimeout(() => setCurrentGift(null), 4000);
        } else {
            const newGiftState: GiftState = {
                id: `gift_banner_${Date.now()}`,
                sender: userName,
                giftName: gift.name,
                giftIcon: gift.icon,
                giftColor: gift.color,
                count: 1,
                timestamp: Date.now()
            };
            setCurrentGift(newGiftState);
            
            if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
            giftTimerRef.current = setTimeout(() => setCurrentGift(null), 4000);
        }

        if (gift.animationType !== 'normal') {
            setFullScreenEffect(null);
            if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
            setTimeout(() => {
                setFullScreenEffect(gift.animationType);
            }, 50);
            effectTimerRef.current = setTimeout(() => setFullScreenEffect(null), 4000);
        }

        const giftMsg: Message = {
            id: `gift_${Date.now()}`,
            user: userName,
            text: `送出了 ${gift.name}`,
            isGift: true,
            giftIcon: gift.icon,
            giftName: gift.name,
            giftCount: 1
        };
        addDanmaku(giftMsg);
        
        liveStreamService.sendGift(id, 'user', userName, gift, 1);
        
        if (Math.random() > 0.6) {
            setTimeout(async () => {
                const reply = await liveStreamService.generateStreamerReply(id, `${userName} 送了 ${gift.name}`);
                const replyMsg: Message = {
                    id: `streamer_${Date.now()}`,
                    user: stream.streamerName,
                    text: reply,
                    isStreamer: true
                };
                addDanmaku(replyMsg);
                // 更新旁白
                setNarration(`${stream.streamerName} 看到礼物后露出了开心的笑容`);
            }, 2000);
        }
        
        setShowGiftPanel(false);
    };

    const handleSendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() && id && stream) {
            const userName = userInfo.nickname || '我';
            const msgText = inputValue.trim();
            
            const newMessage: Message = {
                id: `msg_${Date.now()}`,
                user: userName,
                text: msgText
            };
            addDanmaku(newMessage);
            setInputValue('');
            
            setTimeout(async () => {
                const reply = await liveStreamService.generateStreamerReply(id, msgText);
                const replyMsg: Message = {
                    id: `streamer_${Date.now()}`,
                    user: stream.streamerName,
                    text: reply,
                    isStreamer: true
                };
                addDanmaku(replyMsg);
                // 更新旁白
                setNarration(`${stream.streamerName} 看着弹幕，认真地回复了观众`);
            }, 2000);
        }
    };

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowed(!isFollowed);
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-black">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white">
                <p className="text-white/60 mb-4">Live stream not found</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-full text-sm">Go Back</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-black text-white font-serif overflow-hidden">
            {/* Background with stream color */}
            <div className="absolute inset-0 z-0">
                <div className={`w-full h-full bg-gradient-to-br ${stream.color.replace('to-', 'to-black/80 ')} animate-pulse-slow`}>
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>
            </div>

            {/* 弹幕层 - 全屏飘屏 */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {danmakuList.map(d => (
                    <div 
                        key={d.id}
                        className="absolute animate-danmaku px-4 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 flex items-center space-x-2"
                        style={{ 
                            top: `${d.top}%`, 
                            animationDuration: `${d.duration}s`,
                            left: '100%', // 初始位置在屏幕右侧外
                        }}
                    >
                        <span className="text-xs text-white/70 font-medium whitespace-nowrap">{d.user}:</span>
                        <span className="text-sm font-medium whitespace-nowrap shadow-sm" style={{ color: d.color }}>{d.text}</span>
                    </div>
                ))}
            </div>

            {/* 角色展示区域 (Centered) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pb-20 pointer-events-none">
                {/* 角色头像/形象 - 大尺寸 + 呼吸动画 */}
                <div className="relative animate-breathe">
                    {stream.streamerAvatar ? (
                        <img 
                            src={stream.streamerAvatar} 
                            alt={stream.streamerName} 
                            className="w-48 h-48 rounded-full object-cover border-4 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.2)]" 
                        />
                    ) : (
                        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-amber-200 to-amber-500 flex items-center justify-center border-4 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                           <span className="text-4xl">👤</span>
                        </div>
                    )}
                    {/* 状态指示点 */}
                    <div className="absolute bottom-2 right-4 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                </div>
                
                <h2 className="mt-4 text-xl font-medium tracking-wide text-white/90">{stream.streamerName}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-red-500/80 rounded text-[10px]">LIVE</span>
                    <span className="text-xs text-white/60">{formatViewers(stream.viewers)} watching</span>
                </div>
            </div>

            {/* Floating Hearts */}
            <div className="absolute bottom-20 right-4 w-20 h-64 pointer-events-none z-10 overflow-hidden">
                {floatingHearts.map(heart => (
                    <div
                        key={heart.id}
                        className="absolute bottom-0 text-red-500 animate-float-up opacity-0"
                        style={{ left: `${heart.left}%`, animationDuration: `${heart.animationDuration}s` }}
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                ))}
            </div>

            {/* 礼物横幅 Gift Banner */}
            {currentGift && (
                <div key={currentGift.id} className="absolute left-4 top-24 z-30 animate-gift-banner pointer-events-none">
                    <div className={`flex items-center bg-gradient-to-r ${currentGift.giftColor} backdrop-blur-md rounded-full p-1 pr-6 shadow-xl border border-white/20 overflow-hidden`}>
                        <div className="w-10 h-10 rounded-full bg-black/20 mr-2 flex items-center justify-center overflow-hidden border border-white/10">
                            <div className="text-lg">👤</div>
                        </div>
                        <div className="flex flex-col mr-6 min-w-[80px]">
                            <span className="text-xs text-white/95 font-bold tracking-wide">{currentGift.sender}</span>
                            <span className="text-[10px] text-white/80">送出 {currentGift.giftName}</span>
                        </div>
                        <div className="text-3xl mr-3 filter drop-shadow-md animate-bounce">{currentGift.giftIcon}</div>
                        <div className="flex items-end italic">
                            <span className="text-lg font-bold text-white mr-1 opacity-90">x</span>
                            {/* 使用 key 强制触发连击动画 */}
                            <span key={currentGift.count} className="text-4xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-combo">
                                {currentGift.count}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Title */}
            <div className="absolute top-24 left-4 right-4 z-20 pointer-events-none">
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10 inline-block">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-500/80 rounded text-[10px]">LIVE</span>
                        <span className="text-[10px] text-white/60">{stream.category}</span>
                    </div>
                    <h2 className="text-sm font-medium">{stream.title}</h2>
                </div>
            </div>

            {/* 旁白气泡 - 显示在底部输入框上方，像字幕一样 */}
            {narration && (
                <div className="absolute bottom-24 left-4 right-4 z-20 flex justify-center pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 max-w-sm animate-fade-in-up">
                        <p className="text-sm text-white/95 italic text-center font-light leading-relaxed">
                            "{narration}"
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Controls Area - 仅保留输入框和按钮 */}
            <div className="absolute bottom-0 left-0 w-full z-20 p-4 pb-8 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleSendMessage}
                            placeholder="发送弹幕..."
                            className="w-full h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 text-white text-sm font-light placeholder-white/50 focus:outline-none focus:bg-black/40 focus:border-white/30 transition-all"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Share */}
                        <button className="p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        
                        {/* Gift Button */}
                        <button 
                            onClick={() => setShowGiftPanel(true)}
                            className="p-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all active:scale-95"
                        >
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </button>
                        
                        {/* Like */}
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

            {/* Gift Panel */}
            {showGiftPanel && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowGiftPanel(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-medium text-white mb-6 text-center tracking-wider">礼物超市</h3>
                        
                        <div className="grid grid-cols-4 gap-4">
                            {GIFT_LIST.map(gift => (
                                <button
                                    key={gift.id}
                                    onClick={() => handleSendGift(gift)}
                                    className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 group"
                                >
                                    <span className="text-3xl mb-2 transition-transform group-hover:scale-110">{gift.icon}</span>
                                    <span className="text-xs text-white/80 font-medium">{gift.name}</span>
                                    <span className="text-[10px] text-yellow-400 mt-1">{gift.price} 金币</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveRoom;
