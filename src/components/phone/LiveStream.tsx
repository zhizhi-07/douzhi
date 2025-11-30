import { useState } from 'react';
import { X, Heart, Gift, User, Search, MoreHorizontal, Zap } from 'lucide-react';

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
    coverImage: 'bg-gradient-to-br from-indigo-500 to-purple-600'
  },
  {
    id: '2',
    title: '钢琴练习曲 No.5',
    streamer: 'PianoLife',
    viewers: 850,
    category: '音乐',
    coverImage: 'bg-gradient-to-br from-rose-400 to-orange-500'
  },
  {
    id: '3',
    title: '雨夜闲聊',
    streamer: '云深不知处',
    viewers: 3420,
    category: '聊天',
    coverImage: 'bg-gradient-to-br from-blue-400 to-cyan-500'
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
    <div className="w-full h-full bg-[#111] flex flex-col font-sans text-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 sticky top-0 z-10 bg-[#111]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-6 text-[16px] font-medium">
            <span className="text-gray-400">关注</span>
            <span className="text-white border-b-2 border-white pb-1">推荐</span>
            <span className="text-gray-400">同城</span>
          </div>
          <div className="flex gap-4">
            <Search className="w-5 h-5 text-white" />
            <User className="w-5 h-5 text-white" onClick={() => setCurrentView('create')} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {MOCK_ROOMS.map((room) => (
            <div
              key={room.id}
              onClick={() => handleEnterRoom(room)}
              className={`aspect-[3/4] rounded-lg overflow-hidden relative cursor-pointer ${room.coverImage}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>

              <div className="absolute top-2 left-2 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FA5151] animate-pulse"></div>
                <span className="text-[10px] text-white">直播中</span>
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-[13px] font-medium text-white line-clamp-1 mb-1">{room.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/80">{room.streamer}</span>
                  <div className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-white/80" />
                    <span className="text-[10px] text-white/80">{room.viewers}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Placeholders */}
          {[4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // 直播间视图 (Room View)
  // --------------------------------------------------------------------------
  const renderRoomView = () => (
    <div className="w-full h-full bg-black text-white relative flex flex-col">
      {/* Background / Video Area */}
      <div className="absolute inset-0 bg-gray-900 overflow-hidden">
        {/* Simulated Video Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-white/5 animate-ping absolute"></div>
          <div className="text-white/20 text-lg font-medium">直播画面加载中...</div>
        </div>
      </div>

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex items-start justify-between z-10 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-1 pr-3 rounded-full">
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <span className="text-xs font-bold">{activeRoom?.streamer[0]}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold leading-tight">{activeRoom?.streamer}</span>
            <span className="text-[9px] text-white/80 leading-tight">{activeRoom?.viewers} 观看</span>
          </div>
          {!isStreaming && (
            <button className="ml-1 bg-[#FA5151] text-white text-[10px] px-2 py-0.5 rounded-full">
              关注
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-600 border border-black flex items-center justify-center text-[10px]">{i}</div>
            ))}
          </div>
          <button
            onClick={handleExitRoom}
            className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-10 bg-gradient-to-t from-black/60 to-transparent">
        {/* Chat Area */}
        <div className="h-40 mb-4 overflow-y-auto flex flex-col justify-end space-y-1.5 mask-image-linear-to-t">
          <div className="bg-black/20 self-start px-2 py-1 rounded-[4px]">
            <span className="text-[#FA5151] text-[12px] font-bold mr-1">系统</span>
            <span className="text-white/90 text-[12px]">严禁未成年人直播、打赏。</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/20 self-start px-2 py-1 rounded-[4px]">
              <span className="text-blue-300 text-[12px] font-bold mr-1">用户{9520 + i}:</span>
              <span className="text-white/90 text-[12px]">主播好！</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/30 backdrop-blur-md rounded-full h-9 px-4 flex items-center">
            <span className="text-white/50 text-[13px]">说点什么...</span>
          </div>

          <button className="w-9 h-9 rounded-full flex items-center justify-center">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </button>

          <button className="w-9 h-9 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-[#FA5151]" />
          </button>

          <button className="w-9 h-9 rounded-full bg-[#FA5151] flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white fill-white" />
          </button>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // 开播准备视图 (Create View)
  // --------------------------------------------------------------------------
  const renderCreateView = () => (
    <div className="w-full h-full bg-[#111] text-white flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center z-10">
        <button onClick={() => setCurrentView('list')}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-xl bg-gray-800 flex items-center justify-center border border-white/10 relative">
              <User className="w-10 h-10 text-white/30" />
              <div className="absolute -bottom-2 -right-2 bg-white text-black p-1.5 rounded-full">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="输入直播标题"
            className="w-full bg-transparent text-center text-lg font-medium placeholder:text-white/30 outline-none border-b border-white/10 pb-2 mb-8"
            defaultValue="我的直播间"
          />

          <div className="flex justify-center gap-4 mb-10">
            <span className="text-sm text-white/60"># 添加话题</span>
            <span className="text-sm text-white/60">@ 提醒谁看</span>
          </div>

          <button
            onClick={handleStartStream}
            className="w-full py-3 bg-[#07C160] rounded-[8px] font-medium text-white shadow-lg active:opacity-90 transition-opacity"
          >
            开始直播
          </button>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-white/30">
              开播即代表同意《直播协议》
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentView === 'room') return renderRoomView();
  if (currentView === 'create') return renderCreateView();
  return renderListView();
}
