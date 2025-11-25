import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '../components/Icons';

// --- Types ---
interface FarmPlot {
  id: number;
  status: 'empty' | 'planted' | 'withered';
  cropId: string | null;
  plantedAt: number;
  stage: number; // 0: 种子, 1: 发芽, 2: 生长, 3: 成熟
}

interface CropConfig {
  id: string;
  name: string;
  growthTime: number; // 毫秒
  price: number;
  color: string;
  stages: number;
}

// --- Config ---
const CROPS_CONFIG: Record<string, CropConfig> = {
  carrot: {
    id: 'carrot',
    name: '胡萝卜',
    growthTime: 10 * 1000, // 测试用：10秒成熟
    price: 10,
    color: 'bg-orange-500',
    stages: 3,
  },
  corn: {
    id: 'corn',
    name: '玉米',
    growthTime: 20 * 1000, // 测试用：20秒成熟
    price: 20,
    color: 'bg-yellow-400',
    stages: 4,
  },
  tomato: {
    id: 'tomato',
    name: '番茄',
    growthTime: 30 * 1000, // 测试用：30秒成熟
    price: 30,
    color: 'bg-red-500',
    stages: 4,
  }
};

// --- Helper Hook ---
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const Homeland: React.FC = () => {
  const navigate = useNavigate();
  
  // 初始化12块地
  const [plots, setPlots] = useState<FarmPlot[]>(() => {
    const saved = localStorage.getItem('homeland_plots');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      status: 'empty',
      cropId: null,
      plantedAt: 0,
      stage: 0
    }));
  });

  const [selectedSeed, setSelectedSeed] = useState<string>('carrot');
  const [coins, setCoins] = useState<number>(() => {
    return parseInt(localStorage.getItem('homeland_coins') || '100');
  });

  // 持久化保存
  useEffect(() => {
    localStorage.setItem('homeland_plots', JSON.stringify(plots));
    localStorage.setItem('homeland_coins', coins.toString());
  }, [plots, coins]);

  // 游戏循环：每秒更新作物状态
  useInterval(() => {
    const now = Date.now();
    setPlots(currentPlots => currentPlots.map(plot => {
      if (plot.status !== 'planted' || !plot.cropId) return plot;
      
      const config = CROPS_CONFIG[plot.cropId];
      const timePassed = now - plot.plantedAt;
      
      // 计算生长进度 (0 to 1)
      const progress = Math.min(timePassed / config.growthTime, 1);
      // 计算当前阶段
      const currentStage = Math.floor(progress * config.stages);
      
      if (plot.stage !== currentStage) {
        return { ...plot, stage: currentStage };
      }
      return plot;
    }));
  }, 1000);

  const handlePlotClick = (plot: FarmPlot) => {
    const now = Date.now();

    // 1. 如果是空地，种植
    if (plot.status === 'empty') {
      setPlots(prev => prev.map(p => {
        if (p.id === plot.id) {
          return {
            ...p,
            status: 'planted',
            cropId: selectedSeed,
            plantedAt: now,
            stage: 0
          };
        }
        return p;
      }));
      return;
    }

    // 2. 如果已成熟，收获
    if (plot.status === 'planted' && plot.cropId) {
      const config = CROPS_CONFIG[plot.cropId];
      if (plot.stage >= config.stages) {
        // 收获逻辑
        setCoins(c => c + config.price);
        setPlots(prev => prev.map(p => {
          if (p.id === plot.id) {
            return {
              ...p,
              status: 'empty',
              cropId: null,
              plantedAt: 0,
              stage: 0
            };
          }
          return p;
        }));
        // 这里可以播放音效
      }
    }
  };

  const getPlotContent = (plot: FarmPlot) => {
    if (plot.status === 'empty') {
      return <div className="text-gray-300 text-xs">空闲</div>;
    }

    if (plot.status === 'planted' && plot.cropId) {
      const config = CROPS_CONFIG[plot.cropId];
      const isMature = plot.stage >= config.stages;
      
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          {/* 这里将来替换为图片素材 */}
          {isMature ? (
            <div className={`w-12 h-12 rounded-full ${config.color} animate-bounce flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xs">收!</span>
            </div>
          ) : (
            <div className="relative w-10 h-10 flex items-end justify-center">
              {/* 模拟生长阶段: 这里的样式只是示意 */}
              <div 
                className={`w-2 bg-green-500 rounded-t-full transition-all duration-500`}
                style={{ height: `${(plot.stage + 1) * 25}%` }}
              />
              {plot.stage >= 1 && <div className="absolute -left-1 bottom-2 w-3 h-1 bg-green-500 rotate-45 rounded-full" />}
              {plot.stage >= 2 && <div className="absolute -right-1 bottom-4 w-3 h-1 bg-green-500 -rotate-45 rounded-full" />}
            </div>
          )}
          <span className="text-[10px] text-gray-500 mt-1 scale-75">
            {config.name} ({Math.min(plot.stage, config.stages)}/{config.stages})
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 active:opacity-70">
            <BackIcon className="text-gray-800" />
          </button>
          <h1 className="text-lg font-medium text-gray-800">我的家园</h1>
        </div>
        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
          <span className="text-yellow-600">🪙</span>
          <span className="font-bold text-yellow-700 text-sm">{coins}</span>
        </div>
      </div>

      {/* Main Farm Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-20">
          <div className="grid grid-cols-3 gap-3 aspect-[3/4]">
            {plots.map(plot => (
              <div 
                key={plot.id}
                onClick={() => handlePlotClick(plot)}
                className={`
                  relative aspect-square rounded-xl border-2 transition-all active:scale-95 cursor-pointer
                  flex items-center justify-center overflow-hidden
                  ${plot.status === 'empty' 
                    ? 'bg-[#e8e1d5] border-[#d6cbb8] hover:bg-[#ded4c4]' 
                    : 'bg-[#5c4033] border-[#4a332a]'}
                `}
              >
                {/* 土地纹理装饰 */}
                {plot.status !== 'empty' && (
                  <div className="absolute inset-0 opacity-20" 
                       style={{backgroundImage: 'radial-gradient(#3e2b22 2px, transparent 0)', backgroundSize: '8px 8px'}}>
                  </div>
                )}
                
                {getPlotContent(plot)}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-400 text-xs mb-8">
          点击空地种植，点击成熟作物收获
          <br/>
          (目前是测试倍速，10-30秒成熟)
        </div>
      </div>

      {/* Seeds Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-center gap-6">
          {Object.values(CROPS_CONFIG).map(crop => (
            <button
              key={crop.id}
              onClick={() => setSelectedSeed(crop.id)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16
                ${selectedSeed === crop.id ? 'bg-green-50 ring-2 ring-green-500 scale-110' : 'hover:bg-gray-50'}
              `}
            >
              <div className={`w-10 h-10 rounded-full ${crop.color} flex items-center justify-center text-white shadow-sm`}>
                {crop.name[0]}
              </div>
              <span className="text-xs text-gray-600 font-medium">{crop.name}</span>
              <span className="text-[10px] text-gray-400 scale-90">{crop.growthTime/1000}s</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homeland;
