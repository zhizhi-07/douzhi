import React, { useState } from 'react';
import { 
  X, Heart, Share2, Gift, Camera, User, 
  Music, Coffee, BookOpen, Search, MoreHorizontal, 
  Zap, Mic, Radio
} from 'lucide-react';

interface LiveRoom {
  id: string;
  title: string;
  streamer: string;
  avatar?: string;
  viewers: number;
  category: string;
  coverImage?: string;
}

interface LiveStreamProps {
  onBack: () => void;
  userName?: string;
}

const MOCK_ROOMS: LiveRoom[] = [
  {
    id: '1',
    title: '深夜读诗 | 寻找内心的宁静',
    streamer: '林语',
    viewers: 1205,
    category: '读物',
    coverImage: 'linear-gradient(to bottom right, #e0c3fc, #8ec5fc)'
  },
  {
    id: '2',
    title: '钢琴练习曲 No.5',
    streamer: 'PianoLife',
    viewers: 850,
    category: '音乐',
    coverImage: 'linear-gradient(to bottom right, #f093fb, #f5576c)'
  },
  {
    id: '3',
    title: '雨夜闲聊',
    streamer: '云深不知处',
    viewers: 3420,
    category: '聊天',
    coverImage: 'linear-gradient(to bottom right, #4facfe, #00f2fe)'
  }
];

export default function LiveStream({ onBack, userName = '我' }: LiveStreamProps) {
  const [currentView, setCurrentView] = useState<'list' | 'room' | 'create'>('list');
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleEnterRoom = (room: LiveRoom) => {
    setActiveRoom(room);
    setCurrentView('room');
  };

  const handleStartStream = () => {
    setIsStreaming(true);
    setActiveRoom({
      id: 'user-stream',
      title: '我的直播间',
      streamer: userName,
      viewers: 0,
      category: '生活'
    });
    setCurrentView('room');
  };

  const handleExitRoom = () => {
    setActiveRoom(null);
    setIsStreaming(false);
    setCurrentView('list');
  };

  // --------------------------------------------------------------------------
  // 列表视图 (Discovery/List View)
  // --------------------------------------------------------------------------
  const renderListView = () => (
    <div className="w-full h-full bg-stone-50 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-4 pt-12 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-stone-600" />
            </button>
            <h1 className="text-xl font-serif font-bold text-stone-800 tracking-wide">LIVE</h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <Search className="w-5 h-5 text-stone-600" />
            </button>
            <button 
              onClick={() => setCurrentView('create')}
              className="p-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: '推荐', icon: <Zap className="w-3 h-3" /> },
            { label: '附近', icon: <Radio className="w-3 h-3" /> },
            { label: '音乐', icon: <Music className="w-3 h-3" /> },
            { label: '读物', icon: <BookOpen className="w-3 h-3" /> },
            { label: '生活', icon: <Coffee className="w-3 h-3" /> }
          ].map((tab, i) => (
            <button 
              key={tab.label}
              className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                i === 0 
                  ? 'text-stone-900 border-stone-900' 
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Featured Banner */}
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-sm group cursor-pointer" onClick={() => handleEnterRoom(MOCK_ROOMS[0])}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2">
              <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span className="text-xs font-medium">热门直播</span>
            </div>
            <h2 className="text-2xl font-serif font-bold mb-1">城市角落的爵士夜</h2>
            <p className="text-white/80 text-sm flex items-center gap-2">
              <User className="w-3 h-3" /> JazzLover · 5.2k 在看
            </p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4">
          {MOCK_ROOMS.map((room) => (
            <div 
              key={room.id}
              onClick={() => handleEnterRoom(room)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm cursor-pointer"
            >
              {/* Cover Placeholder */}
              <div 
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{ background: room.coverImage || '#eee' }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute top-3 right-3">
                <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white font-medium">{room.viewers}</span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs opacity-80 mb-1 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {room.streamer[0]}
                  </span>
                  {room.streamer}
                </p>
                <h3 className="text-sm font-medium line-clamp-2 leading-tight">{room.title}</h3>
              </div>
            </div>
          ))}
          
          {/* More placeholders to fill grid */}
          {[4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-stone-200 animate-pulse opacity-50" />
          ))}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // 直播间视图 (Room View)
  // --------------------------------------------------------------------------
  const renderRoomView = () => (
    <div className="w-full h-full bg-black text-white relative flex flex-col animate-in zoom-in-95 duration-300">
      {/* Background / Video Area */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
        {/* Ambient Light Effect */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-bounce">
            {isStreaming ? <Mic className="w-8 h-8 text-white/50" /> : <Radio className="w-8 h-8 text-white/50" />}
          </div>
          <span className="text-white/20 text-2xl font-serif italic">
            {isStreaming ? 'Live Streaming...' : 'Loading Stream...'}
          </span>
        </div>
      </div>

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-lg p-1 pr-4 rounded-full border border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center">
            <span className="text-sm font-bold">{activeRoom?.streamer[0]}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{activeRoom?.streamer}</span>
            <span className="text-[10px] opacity-70">{activeRoom?.viewers} 观看</span>
          </div>
          {!isStreaming && (
            <button className="ml-2 bg-white text-black text-xs px-3 py-1 rounded-full font-medium hover:bg-gray-200">
              关注
            </button>
          )}
        </div>

        <button 
          onClick={handleExitRoom}
          className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
        {/* Chat Area */}
        <div className="h-48 mb-4 overflow-y-auto mask-image-linear-to-t flex flex-col justify-end space-y-2 scrollbar-hide">
          <div className="flex items-start gap-2 opacity-80">
            <span className="text-yellow-400 text-xs font-bold mt-0.5">系统</span>
            <span className="text-white text-sm">欢迎来到直播间，请文明发言。</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-300 text-xs font-bold mt-0.5">User{9520+i}</span>
              <span className="text-white text-sm opacity-90">主播好有气质！喜欢这种风格。</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/20 backdrop-blur-md rounded-full h-10 px-4 flex items-center border border-white/10">
            <span className="text-white/50 text-sm">说点什么...</span>
          </div>
          
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 border border-white/10">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 border border-white/10">
            <Share2 className="w-5 h-5" />
          </button>

          <button className="w-10 h-10 rounded-full bg-pink-500/20 backdrop-blur-md flex items-center justify-center hover:bg-pink-500/40 border border-pink-500/30">
            <Gift className="w-5 h-5 text-pink-400" />
          </button>
          
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 border border-white/10">
            <Heart className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // 开播准备视图 (Create View)
  // --------------------------------------------------------------------------
  const renderCreateView = () => (
    <div className="w-full h-full bg-stone-900 text-white flex flex-col relative animate-in slide-in-from-bottom duration-300">
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center">
        <button onClick={() => setCurrentView('list')}>
          <X className="w-6 h-6" />
        </button>
        <span className="font-medium">开始直播</span>
        <div className="w-6" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
          <div className="mb-6 relative">
            <div className="w-24 h-24 rounded-2xl bg-stone-800 mx-auto flex items-center justify-center overflow-hidden border-2 border-white/20">
              <User className="w-10 h-10 text-white/50" />
            </div>
            <button className="absolute bottom-0 right-1/2 translate-x-8 translate-y-2 bg-white text-black p-1.5 rounded-full">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="给直播写个标题..." 
            className="w-full bg-transparent text-center text-lg font-medium placeholder:text-white/30 outline-none border-b border-white/10 pb-2 mb-8"
            defaultValue="在这个宁静的夜晚..."
          />

          <div className="grid grid-cols-2 gap-3 mb-8">
            {['聊天', '音乐', '阅读', '生活'].map(cat => (
              <button key={cat} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
                {cat}
              </button>
            ))}
          </div>

          <button 
            onClick={handleStartStream}
            className="w-full py-3 bg-gradient-to-r from-rose-400 to-orange-300 rounded-xl font-bold text-black shadow-lg hover:opacity-90 transition-opacity"
          >
            开始直播
          </button>
        </div>
      </div>
    </div>
  );

  if (currentView === 'room') return renderRoomView();
  if (currentView === 'create') return renderCreateView();
  return renderListView();
}
