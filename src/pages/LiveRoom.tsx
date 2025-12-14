import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { liveStreamService, LiveStream, GIFT_LIST, GiftType, LeaderboardEntry, FanClubMembership } from '../services/liveStreamService';
import { getUserInfo } from '../utils/userUtils';
import { getBalance, setBalance, addTransaction, getIntimatePayRelation, useIntimatePay, IntimatePayRelation } from '../utils/walletUtils';

interface Message {
    id: string;
    user: string;
    text: string;
    isStreamer?: boolean;
    isGift?: boolean;
    giftIcon?: string;
    giftName?: string;
    giftCount?: number;
    isSystem?: boolean;
    isEntrance?: boolean;
    userLevel?: number;
    fanBadge?: { name: string; level: number; color: string };
    isRoomAdmin?: boolean;
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

// 入场特效类型
type EntranceEffect = 'normal' | 'fan' | 'admin' | 'top1';

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
    const [danmakuList, setDanmakuList] = useState<{id: string, text: string, user: string, top: number, duration: number, color: string, isEntrance?: boolean, entranceType?: EntranceEffect}[]>([]);
    
    // 旁白状态
    const [narration, setNarration] = useState<string>('');
    
    // 新的礼物系统 State
    const [currentGift, setCurrentGift] = useState<GiftState | null>(null);
    const [fullScreenEffect, setFullScreenEffect] = useState<GiftType['animationType'] | null>(null);
    
    // 榜单系统
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    
    // 粉丝团
    const [fanClub, setFanClub] = useState<FanClubMembership | null>(null);
    const [showFanClubPanel, setShowFanClubPanel] = useState(false);
    
    // 用户直播数据
    const [userLevel, setUserLevel] = useState(1);
    const [isRoomAdmin, setIsRoomAdmin] = useState(false);
    
    // 入场特效
    const [entranceEffect, setEntranceEffect] = useState<{show: boolean, type: EntranceEffect, userName: string}>({show: false, type: 'normal', userName: ''});
    
    // 福袋和购物车
    const [showCart, setShowCart] = useState(false);
    const [redPacketTimer, setRedPacketTimer] = useState(600); // 10分钟倒计时
    const [showRedPacket, setShowRedPacket] = useState(false);
    const [showRecharge, setShowRecharge] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [intimacyPayRelation, setIntimacyPayRelation] = useState<IntimatePayRelation | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'intimacy'>('wallet');
    const [paymentNotification, setPaymentNotification] = useState<{show: boolean, type: 'wallet' | 'intimacy', amount: number, item: string} | null>(null);

    const userInfo = getUserInfo();

    const heartIdCounter = useRef(0);
    const giftTimerRef = useRef<NodeJS.Timeout | null>(null);
    const effectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 福袋倒计时
    useEffect(() => {
        const timer = setInterval(() => {
            setRedPacketTimer(prev => prev > 0 ? prev - 1 : 600);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 格式化时间 mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

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
                    
                    // 加载用户直播数据
                    const userData = liveStreamService.getUserLiveData();
                    setUserLevel(userData.odiumLevel);
                    setIsRoomAdmin(liveStreamService.isRoomAdmin(streamData.streamerId));
                    
                    // 加载粉丝团信息
                    const membership = liveStreamService.getFanClubMembership(streamData.streamerId);
                    if (membership) setFanClub(membership);
                    
                    // 加载榜单
                    setLeaderboard(liveStreamService.generateLeaderboard(id));
                    
                    // 加载钱包余额
                    setWalletBalance(getBalance());
                    
                    // 加载亲密付关系（角色给用户的）
                    const intimacyRel = getIntimatePayRelation(streamData.streamerId, 'character_to_user');
                    if (intimacyRel) {
                        setIntimacyPayRelation(intimacyRel);
                    }
                    
                    // 触发入场特效
                    triggerEntranceEffect(userData, membership);
                    
                    loadInitialComments();
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

    // 触发入场特效
    const triggerEntranceEffect = (_userData: any, membership: FanClubMembership | null | undefined) => {
        const userName = userInfo.nickname || '我';
        let effectType: EntranceEffect = 'normal';
        
        // 判断入场类型
        if (leaderboard[0]?.userName === userName) {
            effectType = 'top1';
        } else if (isRoomAdmin) {
            effectType = 'admin';
        } else if (membership) {
            effectType = 'fan';
        }
        
        setEntranceEffect({ show: true, type: effectType, userName });
        
        // 添加入场弹幕
        const entranceMsg = getEntranceMessage(effectType, userName);
        setTimeout(() => {
            addEntranceDanmaku(entranceMsg, effectType);
        }, 500);
        
        // 3秒后隐藏入场特效
        setTimeout(() => {
            setEntranceEffect(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // 获取入场消息
    const getEntranceMessage = (type: EntranceEffect, userName: string) => {
        switch (type) {
            case 'top1':
                return `🎉🎉🎉 榜一大哥 ${userName} 闪亮登场！全场起立！`;
            case 'admin':
                return `✨ 房管大大 ${userName} 驾到！`;
            case 'fan':
                return `💕 粉丝团成员 ${userName} 来啦~`;
            default:
                return `${userName} 进入了直播间`;
        }
    };

    // 添加入场弹幕
    const addEntranceDanmaku = (text: string, type: EntranceEffect) => {
        const colors: Record<EntranceEffect, string> = {
            top1: '#ffd700',
            admin: '#ff69b4',
            fan: '#87ceeb',
            normal: '#ffffff'
        };
        
        const newDanmaku = {
            id: `entrance_${Date.now()}`,
            text,
            user: '',
            top: 45,
            duration: 10,
            color: colors[type],
            isEntrance: true,
            entranceType: type
        };
        
        setDanmakuList(prev => [...prev, newDanmaku]);
        setTimeout(() => {
            setDanmakuList(prev => prev.filter(d => d.id !== newDanmaku.id));
        }, 10000);
    };

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
    // const handleRefresh = async () => {
    //     if (!id || isRefreshing) return;
    //     setIsRefreshing(true);
    //     try {
    //         await liveStreamService.initialize(true);
    //         const streamData = liveStreamService.getStream(id);
    //         if (streamData) {
    //             setStream(streamData);
    //             setDanmakuList([]); // 清空弹幕
    //             loadInitialComments();
    //         }
    //     } catch (e) {
    //         console.error('刷新失败:', e);
    //     } finally {
    //         setIsRefreshing(false);
    //     }
    // };

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
        
        // 记录送礼数据（经验、亲密度等）
        if (stream) {
            liveStreamService.recordGiftSent(stream.streamerId, gift.price);
            // 更新本地状态
            const userData = liveStreamService.getUserLiveData();
            setUserLevel(userData.odiumLevel);
            const membership = liveStreamService.getFanClubMembership(stream.streamerId);
            if (membership) setFanClub(membership);
        }
        
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
        <div className="h-full w-full relative bg-black text-white font-serif overflow-hidden soft-page-enter">
            {/* Background with stream color */}
            <div className="absolute inset-0 z-0">
                <div className={`w-full h-full bg-gradient-to-br ${stream.color.replace('to-', 'to-black/80 ')} animate-pulse-slow`}>
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>
            </div>

            {/* Top Bar - 仿抖音布局 */}
            <div className="absolute top-0 left-0 w-full p-2 pt-12 flex items-start justify-between z-20 pointer-events-auto bg-gradient-to-b from-black/40 to-transparent pb-8">
                {/* 左上角：主播信息胶囊 */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 pr-1.5 border border-white/5 h-9">
                        <div className="relative cursor-pointer" onClick={() => setShowFanClubPanel(true)}>
                            {stream.streamerAvatar ? (
                                <img src={stream.streamerAvatar} alt={stream.streamerName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center border border-white/20">
                                    <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col px-2 min-w-[60px] max-w-[120px]">
                            <span className="text-[11px] font-medium text-white truncate leading-tight">{stream.streamerName}</span>
                            <span className="text-[9px] text-white/70 leading-tight">{formatViewers(stream.followers || 0)} 粉丝</span>
                        </div>
                        
                        <button
                            onClick={handleFollow}
                            className={`h-7 px-3 rounded-full text-[11px] font-medium transition-all flex items-center justify-center ${
                                isFollowed 
                                    ? 'bg-white/10 text-white/60 w-auto min-w-[50px]' 
                                    : 'bg-[#ff2c55] text-white w-auto min-w-[50px]'
                            }`}
                        >
                            {isFollowed ? '已关注' : '关注'}
                        </button>
                    </div>

                    {/* 粉丝团小入口 - 放在胶囊下方 */}
                    <div className="flex items-center gap-2 pl-1">
                        <button 
                            onClick={() => setShowFanClubPanel(true)}
                            className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/5"
                        >
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#ff2c55] to-[#ff4d79] flex items-center justify-center mr-1">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </div>
                            <span className="text-[9px] text-white/90">
                                {fanClub ? `${fanClub.badgeName} · Lv.${fanClub.level}` : '加入粉丝团'}
                            </span>
                            <svg className="w-2.5 h-2.5 ml-0.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                            <span className="text-[9px] text-white/90">{formatViewers(stream.viewers)}</span>
                        </div>
                    </div>
                </div>

                {/* 右上角：观众头像 + 关闭 */}
                <div className="flex items-center gap-3">
                    {/* 观众头像堆叠 */}
                    <div 
                        className="flex -space-x-2 mr-1"
                        onClick={() => setShowLeaderboard(true)}
                    >
                        {leaderboard.slice(0, 3).map((_, i) => (
                            <div 
                                key={i}
                                className={`w-8 h-8 rounded-full border border-black/50 flex items-center justify-center text-[10px] relative z-10 ${
                                    i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                    'bg-gradient-to-br from-amber-600 to-amber-700'
                                }`}
                            >
                                <span className="text-white font-bold text-[9px]">{i + 1}</span>
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[10px] text-white/80 z-0">
                            {formatViewers(stream.viewers)}
                        </div>
                    </div>

                    {/* 关闭按钮 */}
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 榜单入口 - 显示在左侧中间 */}
            <div className="absolute top-36 left-4 z-20 pointer-events-auto">
                <button 
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center bg-gradient-to-r from-[#ffb800] to-[#ff8c00] rounded-full px-2 py-0.5 shadow-lg shadow-orange-500/20"
                >
                    <span className="text-[10px] font-bold text-white mr-1">榜单</span>
                    <span className="text-[10px] text-white/90">TOP 10 &gt;</span>
                </button>
            </div>

            {/* 房间ID水印 */}
            <div className="absolute top-28 right-4 z-10 pointer-events-none opacity-30 text-right">
                <p className="text-[10px] text-white font-mono">ID: {stream.streamerId.slice(-6)}</p>
            </div>

            {/* 福袋入口 - 悬浮在左侧 */}
            <div className="absolute top-48 left-3 z-30 pointer-events-auto">
                <div className="relative">
                    <button 
                        onClick={() => setShowRedPacket(true)}
                        className="w-11 h-14 bg-gradient-to-b from-[#ff4d4d] to-[#cc0000] rounded-xl flex flex-col items-center justify-center shadow-xl border border-red-300/30 active:scale-95 transition-transform"
                    >
                        <svg className="w-5 h-5 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/>
                        </svg>
                        <span className="text-[9px] text-yellow-100 font-bold mt-0.5">{formatTime(redPacketTimer)}</span>
                    </button>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full"></div>
                </div>
            </div>

            {/* 福袋弹窗 */}
            {showRedPacket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowRedPacket(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div 
                        className="relative w-[280px] animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 福袋主体 */}
                        <div className="bg-gradient-to-b from-[#ff4d4d] to-[#cc0000] rounded-2xl p-6 pt-8 text-center border border-red-300/30 shadow-2xl">
                            {/* 顶部装饰 */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-gradient-to-b from-[#ffcc00] to-[#ff9900] rounded-t-xl border-2 border-yellow-300/50"></div>
                            
                            <h3 className="text-xl font-bold text-yellow-100 mb-2">主播福袋</h3>
                            <p className="text-sm text-white/80 mb-4">{stream.streamerName} 的专属福利</p>
                            
                            {/* 奖励内容 */}
                            <div className="bg-black/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
                                    </svg>
                                    <span className="text-2xl font-bold text-yellow-300">100-500</span>
                                    <span className="text-yellow-100">钻石</span>
                                </div>
                                <p className="text-[11px] text-white/60">随机获得钻石奖励</p>
                            </div>
                            
                            {/* 倒计时 */}
                            <div className="mb-4">
                                <p className="text-xs text-white/60 mb-1">开奖倒计时</p>
                                <div className="text-3xl font-bold text-yellow-100 font-mono">
                                    {formatTime(redPacketTimer)}
                                </div>
                            </div>
                            
                            {/* 参与条件 */}
                            <div className="bg-white/10 rounded-lg p-3 mb-4 text-left">
                                <p className="text-xs text-white/80 mb-2">参与条件：</p>
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                    </svg>
                                    <span>关注主播</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                    </svg>
                                    <span>发送1条弹幕</span>
                                </div>
                            </div>
                            
                            {/* 参与按钮 */}
                            <button 
                                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
                                onClick={() => {
                                    setShowRedPacket(false);
                                    // 模拟参与成功
                                }}
                            >
                                立即参与
                            </button>
                            
                            <p className="text-[10px] text-white/40 mt-3">已有 {Math.floor(stream.viewers * 0.3)} 人参与</p>
                        </div>
                        
                        {/* 关闭按钮 */}
                        <button 
                            onClick={() => setShowRedPacket(false)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}


            {/* 购物车面板 */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowCart(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#f5f5f5] rounded-t-2xl p-0 h-[60vh] animate-slide-up overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 顶部标题 */}
                        <div className="bg-white p-3 flex items-center justify-between border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800">全部商品 (12)</h3>
                            <button onClick={() => setShowCart(false)} className="text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* 商品列表 */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f5f5f5]">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="bg-white rounded-xl p-2.5 flex gap-3 shadow-sm relative overflow-hidden">
                                    {/* 讲解中标签 */}
                                    {item === 1 && (
                                        <div className="absolute top-0 right-0 bg-[#ff2c55] text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-medium animate-pulse">
                                            讲解中
                                        </div>
                                    )}
                                    
                                    {/* 商品图 */}
                                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-br-lg font-medium">
                                            {item}
                                        </div>
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {/* 信息 */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-800 line-clamp-2">
                                                {['潮流宽松T恤夏季新款', '丝绒雾面哑光口红', '最新款智能手机Pro Max', '透气运动跑步鞋', '时尚百搭斜挎包'][item - 1]}
                                            </h4>
                                            <div className="flex gap-1 mt-1">
                                                <span className="text-[9px] text-[#ff2c55] border border-[#ff2c55] px-1 rounded">秒杀</span>
                                                <span className="text-[9px] text-gray-500 border border-gray-200 px-1 rounded">包邮</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs text-[#ff2c55] font-bold">¥</span>
                                                <span className="text-lg text-[#ff2c55] font-bold leading-none">{[99, 199, 5999, 299, 399][item - 1]}</span>
                                                <span className="text-[10px] text-gray-400 line-through decoration-gray-400">¥{[199, 299, 6999, 499, 699][item - 1]}</span>
                                            </div>
                                            <button className="bg-gradient-to-r from-[#ff6b00] to-[#ff2c55] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
                                                去抢购
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Title - 调整位置 */}
            <div className="absolute top-28 left-4 z-20 pointer-events-none opacity-0">
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-2.5 border border-white/10 inline-block max-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-red-500/80 rounded text-[9px]">LIVE</span>
                        <span className="text-[9px] text-white/60 truncate">{stream.category}</span>
                    </div>
                    <h2 className="text-xs font-medium truncate">{stream.title}</h2>
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
                            left: '100%',
                        }}
                    >
                        <span className="text-xs text-white/70 font-medium whitespace-nowrap">{d.user}:</span>
                        <span className="text-sm font-medium whitespace-nowrap shadow-sm" style={{ color: d.color }}>{d.text}</span>
                    </div>
                ))}
            </div>

            {/* 立绘区域 - 预留给后续添加 */}
            <div className="absolute inset-0 flex flex-col items-center justify-end z-0 pb-32 pointer-events-none">
                {/* 这里后续放立绘 */}
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
                <div key={currentGift.id} className="absolute left-4 top-44 z-30 animate-gift-banner pointer-events-none">
                    <div className={`flex items-center bg-gradient-to-r ${currentGift.giftColor} backdrop-blur-md rounded-full p-1 pr-6 shadow-xl border border-white/20 overflow-hidden`}>
                        <div className="w-10 h-10 rounded-full bg-black/20 mr-2 flex items-center justify-center overflow-hidden border border-white/10">
                            <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                        <div className="flex flex-col mr-6 min-w-[80px]">
                            <span className="text-xs text-white/95 font-bold tracking-wide">{currentGift.sender}</span>
                            <span className="text-[10px] text-white/80">送出 {currentGift.giftName}</span>
                        </div>
                        <div className="w-10 h-10 mr-3 flex items-center justify-center rounded-full bg-white/20 filter drop-shadow-md animate-bounce">
                            <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>
                            </svg>
                        </div>
                        <div className="flex items-end italic">
                            <span className="text-lg font-bold text-white mr-1 opacity-90">x</span>
                            <span key={currentGift.count} className="text-4xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-combo">
                                {currentGift.count}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 全屏特效 */}
            {fullScreenEffect && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
                    {fullScreenEffect === 'rocket' && (
                        <div className="animate-rocket filter drop-shadow-[0_0_50px_rgba(59,130,246,0.6)]">
                            <svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.75 3.03c3.94.48 7.16 3.7 7.64 7.64a.75.75 0 01-1.48.23 6.749 6.749 0 00-6.15-6.15.75.75 0 01.23-1.48c-.15-.01-.15-.01-.24-.24zm-9.5 9.5a.75.75 0 01-.23 1.48 8.749 8.749 0 007.64 7.64.75.75 0 01-.23 1.48c-4.94-.48-8.89-4.43-9.37-9.37a.75.75 0 011.48-.23c.01.15.01.15.24.24-.15.01-.15.01-.24-.24a.75.75 0 01.71-.76z"/>
                            </svg>
                        </div>
                    )}
                    {fullScreenEffect === 'crown' && (
                        <div className="relative animate-crown">
                            <svg className="w-28 h-28 text-yellow-400 animate-crown-shine filter drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>
                            </svg>
                        </div>
                    )}
                    {fullScreenEffect === 'castle' && (
                        <div className="animate-castle filter drop-shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                            <svg className="w-32 h-32 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 10h-2V4h1V2H4v2h1v6H3v2h1v10h6v-4a2 2 0 114 0v4h6V12h1v-2zM8 12v-2h8v2H8zm0 6v-4h2v4H8zm6 0v-4h2v4h-2z"/>
                            </svg>
                        </div>
                    )}
                    {fullScreenEffect === 'galaxy' && (
                        <div className="animate-galaxy filter drop-shadow-[0_0_80px_rgba(139,92,246,0.8)]">
                            <svg className="w-36 h-36 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                    )}
                </div>
            )}

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

                    <div className="flex items-center space-x-2">
                        {/* 购物车 - 移到底部 */}
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                            <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[#ff2c55] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                12
                            </div>
                        </button>

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
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                        
                        {/* 顶部：标题和余额 */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white tracking-wider">礼物超市</h3>
                            <button 
                                onClick={() => {
                                    setShowGiftPanel(false);
                                    setShowRecharge(true);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-3 py-1.5"
                            >
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                                </svg>
                                <span className="text-sm text-green-400 font-medium">¥{walletBalance.toFixed(2)}</span>
                                <span className="text-xs text-yellow-400/60">充值</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            {GIFT_LIST.map(gift => {
                                const giftCost = gift.price / 10; // 10金币=1元
                                const canAfford = walletBalance >= giftCost;
                                return (
                                    <button
                                        key={gift.id}
                                        onClick={() => {
                                            if (canAfford) {
                                                // 扣除零钱
                                                const newBalance = walletBalance - giftCost;
                                                setBalance(newBalance);
                                                setWalletBalance(newBalance);
                                                // 添加交易记录
                                                addTransaction({
                                                    type: 'intimate_pay',
                                                    amount: giftCost.toFixed(2),
                                                    description: `直播间送礼 - ${gift.name}`,
                                                    characterName: stream?.streamerName
                                                });
                                                handleSendGift(gift);
                                            } else {
                                                setShowGiftPanel(false);
                                                setShowRecharge(true);
                                            }
                                        }}
                                        className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 group ${canAfford ? 'bg-white/5 hover:bg-white/10' : 'bg-white/5 opacity-60'}`}
                                    >
                                        <div className="w-10 h-10 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-white/80 font-medium">{gift.name}</span>
                                        <span className={`text-[10px] mt-1 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>¥{giftCost.toFixed(1)}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* 余额不足提示 */}
                        {walletBalance < 1 && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-xs text-yellow-400 text-center">
                                    余额不足，
                                    <button 
                                        onClick={() => {
                                            setShowGiftPanel(false);
                                            setShowRecharge(true);
                                        }}
                                        className="underline font-medium"
                                    >
                                        立即充值
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 充值面板 */}
            {showRecharge && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowRecharge(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                        
                        {/* 当前零钱余额 */}
                        <div className="text-center mb-6">
                            <p className="text-xs text-white/40 mb-1">零钱余额</p>
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                                </svg>
                                <span className="text-3xl font-bold text-green-400">¥{walletBalance.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <h3 className="text-sm font-medium text-white/80 mb-3">充值零钱</h3>
                        
                        {/* 充值选项 - 直接充值到零钱 */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                                { amount: 10 },
                                { amount: 50 },
                                { amount: 100 },
                                { amount: 200 },
                                { amount: 500 },
                                { amount: 1000 },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (paymentMethod === 'wallet') {
                                            // 零钱充值（模拟）
                                            const newBalance = walletBalance + item.amount;
                                            setBalance(newBalance);
                                            setWalletBalance(newBalance);
                                            // 添加交易记录
                                            addTransaction({
                                                type: 'recharge',
                                                amount: item.amount.toFixed(2),
                                                description: '零钱充值'
                                            });
                                            setShowRecharge(false);
                                            setPaymentNotification({
                                                show: true,
                                                type: 'wallet',
                                                amount: item.amount,
                                                item: `¥${item.amount}`
                                            });
                                        } else {
                                            // 亲密付支付
                                            const remaining = intimacyPayRelation 
                                                ? intimacyPayRelation.monthlyLimit - intimacyPayRelation.usedAmount 
                                                : 0;
                                            if (remaining >= item.amount && stream) {
                                                // 使用亲密付
                                                const success = useIntimatePay(stream.streamerName, item.amount);
                                                if (success) {
                                                    // 充值到零钱
                                                    const newBalance = walletBalance + item.amount;
                                                    setBalance(newBalance);
                                                    setWalletBalance(newBalance);
                                                    // 添加交易记录
                                                    addTransaction({
                                                        type: 'intimate_pay',
                                                        amount: item.amount.toFixed(2),
                                                        description: `${stream.streamerName}的亲密付充值`,
                                                        characterName: stream.streamerName
                                                    });
                                                    // 刷新亲密付关系
                                                    const updatedRel = getIntimatePayRelation(stream.streamerId, 'character_to_user');
                                                    if (updatedRel) setIntimacyPayRelation(updatedRel);
                                                    
                                                    setShowRecharge(false);
                                                    setPaymentNotification({
                                                        show: true,
                                                        type: 'intimacy',
                                                        amount: item.amount,
                                                        item: `¥${item.amount}`
                                                    });
                                                    // AI会知道用户使用了亲密付
                                                    setTimeout(() => {
                                                        const replyMsg: Message = {
                                                            id: `streamer_intimacy_${Date.now()}`,
                                                            user: stream.streamerName,
                                                            text: `谢谢你用我送的亲密付充值呀～我好开心！`,
                                                            isStreamer: true
                                                        };
                                                        addDanmaku(replyMsg);
                                                    }, 2000);
                                                }
                                            }
                                        }
                                    }}
                                    className="relative p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center transition-all active:scale-95"
                                >
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                                        </svg>
                                        <span className="text-lg font-bold text-green-400">¥{item.amount}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        {/* 支付方式 */}
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <p className="text-xs text-white/40">支付方式</p>
                            
                            {/* 零钱支付 */}
                            <button 
                                onClick={() => setPaymentMethod('wallet')}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${paymentMethod === 'wallet' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm text-white font-medium">零钱支付</p>
                                    <p className="text-[10px] text-white/40">微信零钱余额</p>
                                </div>
                                {paymentMethod === 'wallet' && (
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                    </svg>
                                )}
                            </button>
                            
                            {/* 亲密付 - 只有当角色开通了亲密付时才显示 */}
                            {intimacyPayRelation && (
                                <button 
                                    onClick={() => setPaymentMethod('intimacy')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${paymentMethod === 'intimacy' ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30' : 'bg-white/5 border border-white/10'}`}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm text-white font-medium">亲密付</p>
                                        <p className="text-[10px] text-pink-300">
                                            {stream?.streamerName} 送你的额度：¥{intimacyPayRelation.monthlyLimit - intimacyPayRelation.usedAmount}
                                        </p>
                                    </div>
                                    {paymentMethod === 'intimacy' && (
                                        <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                        
                        <p className="text-[10px] text-white/30 text-center mt-4">充值即表示同意《用户充值协议》</p>
                    </div>
                </div>
            )}

            {/* 支付通知弹窗 */}
            {paymentNotification?.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setPaymentNotification(null)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div 
                        className="relative w-[300px] bg-white rounded-2xl p-6 animate-slide-up shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 图标 */}
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${paymentNotification.type === 'wallet' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'}`}>
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">支付成功</h3>
                        
                        {/* 扣费详情 */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500">支付方式</span>
                                <span className="text-sm text-gray-800 font-medium">
                                    {paymentNotification.type === 'wallet' ? '微信零钱' : `${stream?.streamerName}的亲密付`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500">扣费金额</span>
                                <span className={`text-lg font-bold ${paymentNotification.type === 'wallet' ? 'text-green-600' : 'text-pink-500'}`}>
                                    -¥{paymentNotification.amount}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">充值内容</span>
                                <span className="text-sm text-gray-800">{paymentNotification.item}</span>
                            </div>
                        </div>
                        
                        {/* 亲密付特殊提示 */}
                        {paymentNotification.type === 'intimacy' && (
                            <div className="bg-pink-50 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <svg className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                <p className="text-xs text-pink-600">
                                    {stream?.streamerName} 会收到你使用亲密付的通知哦～
                                </p>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setPaymentNotification(null)}
                            className={`w-full py-3 rounded-full text-white font-medium ${paymentNotification.type === 'wallet' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`}
                        >
                            确定
                        </button>
                    </div>
                </div>
            )}

            {/* Leaderboard Panel - 榜单面板 */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowLeaderboard(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2 text-center tracking-wider">贡献榜</h3>
                        <p className="text-xs text-white/40 text-center mb-6">本场直播贡献排行</p>
                        
                        <div className="space-y-3">
                            {leaderboard.map((entry, i) => (
                                <div 
                                    key={entry.odiumUserId}
                                    className={`flex items-center p-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-white/5'}`}
                                >
                                    {/* 排名 */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        i === 0 ? 'bg-gradient-to-tr from-yellow-400 to-orange-500 text-white' :
                                        i === 1 ? 'bg-gradient-to-tr from-gray-300 to-gray-400 text-gray-800' :
                                        i === 2 ? 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white' :
                                        'bg-white/10 text-white/60'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    
                                    {/* 头像 */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 flex items-center justify-center ml-3">
                                        <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                    
                                    {/* 信息 */}
                                    <div className="flex-1 ml-3">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium text-white">{entry.userName}</span>
                                            {entry.isRoomAdmin && (
                                                <span className="ml-2 px-1.5 py-0.5 bg-pink-500/30 rounded text-[8px] text-pink-300">房管</span>
                                            )}
                                        </div>
                                        <div className="flex items-center mt-0.5">
                                            <span className="text-[10px] text-white/40">粉丝牌 Lv.{entry.fanLevel}</span>
                                        </div>
                                    </div>
                                    
                                    {/* 贡献值 */}
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-yellow-400">{formatViewers(entry.giftValue)}</span>
                                        <span className="text-[10px] text-white/40 ml-1">金币</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Fan Club Panel - 粉丝团面板 */}
            {showFanClubPanel && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowFanClubPanel(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2 text-center tracking-wider">粉丝团</h3>
                        <p className="text-xs text-white/40 text-center mb-6">{stream.streamerName} 的粉丝团</p>
                        
                        {fanClub ? (
                            <div className="space-y-4">
                                {/* 粉丝牌展示 */}
                                <div className={`p-4 rounded-2xl bg-gradient-to-r ${fanClub.badgeColor} relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative">
                                        <div className="text-2xl font-bold text-white mb-1">{fanClub.badgeName}</div>
                                        <div className="text-white/80 text-sm">Lv.{fanClub.level}</div>
                                    </div>
                                </div>
                                
                                {/* 数据 */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-white">{fanClub.level}</div>
                                        <div className="text-[10px] text-white/40">粉丝牌等级</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-white">{fanClub.intimacy}</div>
                                        <div className="text-[10px] text-white/40">亲密度</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-yellow-400">{formatViewers(fanClub.giftValue)}</div>
                                        <div className="text-[10px] text-white/40">累计送礼</div>
                                    </div>
                                </div>
                                
                                {/* 升级进度 */}
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-white/60">升级进度</span>
                                        <span className="text-white/80">{fanClub.intimacy % 100}/100</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${fanClub.badgeColor} transition-all`}
                                            style={{ width: `${fanClub.intimacy % 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                </div>
                                <p className="text-white/60 mb-6">加入粉丝团，获得专属粉丝牌</p>
                                <button
                                    onClick={() => {
                                        if (stream) {
                                            liveStreamService.joinFanClub(
                                                stream.streamerId,
                                                stream.streamerName,
                                                stream.fanBadgeName || stream.streamerName.slice(0, 2) + '粉'
                                            );
                                            const membership = liveStreamService.getFanClubMembership(stream.streamerId);
                                            if (membership) setFanClub(membership);
                                        }
                                    }}
                                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white font-medium hover:opacity-90 transition-all"
                                >
                                    免费加入
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 入场特效 */}
            {entranceEffect.show && entranceEffect.type === 'top1' && (
                <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
                    <div className="animate-bounce">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>
                                </svg>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text text-2xl font-bold animate-pulse">
                                榜一大哥驾到！
                            </div>
                            <div className="text-white text-lg mt-2">{entranceEffect.userName}</div>
                        </div>
                    </div>
                    {/* 金色粒子效果 */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${1 + Math.random()}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveRoom;
