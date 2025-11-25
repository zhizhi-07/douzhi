import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '../../components/Icons';
import GameMap from './GameMap';
import Toolbar from './Toolbar';
import { GameState, GameTile, InventorySlot, LandState } from './types';
import { MAP_WIDTH, MAP_HEIGHT, CROPS } from './config';

// 初始数据生成器
const generateInitialMap = (): GameTile[] => {
  const tiles: GameTile[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      // 随机生成一些障碍物
      const rand = Math.random();
      let object = null;
      
      // 10% 几率有石头
      if (rand < 0.1) {
        object = { type: 'rock' as const, id: `rock_${x}_${y}`, stage: 0, plantedAt: 0 };
      }
      // 10% 几率有杂草
      else if (rand < 0.2) {
        object = { type: 'weed' as const, id: `weed_${x}_${y}`, stage: 0, plantedAt: 0 };
      }

      tiles.push({
        x,
        y,
        base: 'grass', // 初始全是草地
        isHoed: false, // 不预设耕地
        isWatered: false,
        landState: LandState.EMPTY,
        object
      });
    }
  }
  return tiles;
};

const initialInventory: InventorySlot[] = [
  { id: 'hand', type: 'hand', name: '手', count: -1, selected: true },
  { id: 'hoe', type: 'hoe', name: '锄头', count: -1, selected: false },
  { id: 'water_can', type: 'water', name: '喷壶', count: -1, selected: false }, // type fixed
  { id: 'corn_seed', type: 'seed', name: '玉米种子', count: 5, selected: false, cropType: 'corn' },
  { id: 'tomato_seed', type: 'seed', name: '番茄种子', count: 5, selected: false, cropType: 'tomato' },
];

const HomelandGame: React.FC = () => {
  const navigate = useNavigate();
  
  // --- Game State ---
  const [tiles, setTiles] = useState<GameTile[]>(() => {
    const saved = localStorage.getItem('homeland_tiles_v2');
    return saved ? JSON.parse(saved) : generateInitialMap();
  });

  const [player, setPlayer] = useState<GameState['player']>({
    pos: { x: 4, y: 4 },
    direction: 'down',
    isMoving: false
  });

  const [inventory, setInventory] = useState<InventorySlot[]>(initialInventory);
  const [coins, setCoins] = useState(100);

  const [isShopOpen, setIsShopOpen] = useState(false);
  
  // 气泡提示状态
  const [bubbles, setBubbles] = useState<{id: string, x: number, y: number, text: string}[]>([]);

  // 商店商品配置 (暂时使用现有素材)
  const SHOP_ITEMS = [
    { id: 'seed_corn', name: '玉米种子', price: 20, cropId: 'corn', icon: '/homeland/crops/corn.png' },
    { id: 'seed_tomato', name: '番茄种子', price: 30, cropId: 'tomato', icon: '/homeland/crops/tomato.png' },
    { id: 'seed_lettuce', name: '生菜种子', price: 15, cropId: 'lettuce', icon: '/homeland/crops/lettuce.png' },
  ];

  const buyItem = (item: typeof SHOP_ITEMS[0]) => {
    if (coins >= item.price) {
      setCoins(prev => prev - item.price);
      // 添加到物品栏 (简化逻辑：如果已有则增加数量，没有则添加)
      setInventory(prev => {
        const existing = prev.find(s => s.id === item.id);
        if (existing) {
          return prev.map(s => s.id === item.id ? { ...s, count: s.count + 1 } : s);
        }
        // 找空位
        const emptyIndex = prev.findIndex(s => !s.id);
        if (emptyIndex !== -1) {
          const newInv = [...prev];
          newInv[emptyIndex] = {
            id: item.id,
            type: 'seed',
            name: item.name,
            count: 1,
            selected: false,
            cropType: item.cropId
          };
          return newInv;
        }
        return prev;
      });
    } else {
      alert('金币不足！');
    }
  };

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('homeland_tiles_v2', JSON.stringify(tiles));
  }, [tiles]);

  // --- Helper: Get Tile at (x,y) ---
  const updateTile = (x: number, y: number, updater: (t: GameTile) => GameTile) => {
    setTiles(prev => {
      const newTiles = [...prev];
      const index = y * MAP_WIDTH + x;
      if (index >= 0 && index < newTiles.length) {
        newTiles[index] = updater(newTiles[index]);
      }
      return newTiles;
    });
  };

  // --- Interaction Logic ---
  const handleTileClick = (targetTile: GameTile) => {
    // 1. 移动玩家到目标附近 (这里简化为瞬间移动到旁边，或者不移动直接操作)
    // 计算距离
    const dx = Math.abs(targetTile.x - player.pos.x);
    const dy = Math.abs(targetTile.y - player.pos.y);
    
    // 只有相邻格子才能操作 (距离 <= 1.5)
    if (dx > 1 || dy > 1) {
      // 远距离：只移动玩家，不操作
      movePlayerTo(targetTile.x, targetTile.y);
      return;
    }

    // 面对目标
    let newDir = player.direction;
    if (targetTile.x > player.pos.x) newDir = 'right';
    if (targetTile.x < player.pos.x) newDir = 'left';
    if (targetTile.y > player.pos.y) newDir = 'down';
    if (targetTile.y < player.pos.y) newDir = 'up';
    
    setPlayer(prev => ({ ...prev, direction: newDir }));

    // 执行工具动作
    const selectedTool = inventory.find(s => s.selected);
    if (!selectedTool) return;

    // --- 工具逻辑 ---
    
    // 1. 锄头 (Hoe): 草地 -> 土地 -> 翻土
    if (selectedTool.type === 'hoe') {
      if (targetTile.base === 'grass' && !targetTile.object) {
        // 第一次点击：草地变成土地（未翻土）
        updateTile(targetTile.x, targetTile.y, t => ({ ...t, base: 'dirt', isHoed: false }));
      } else if (targetTile.base === 'dirt' && !targetTile.isHoed && !targetTile.object) {
        // 第二次点击：土地变成翻土
        updateTile(targetTile.x, targetTile.y, t => ({ ...t, isHoed: true }));
      }
    }

    // 2. 喷壶 (Water Can): 浇水
    else if (selectedTool.type === 'water') {
      if (targetTile.isHoed) {
        updateTile(targetTile.x, targetTile.y, t => ({ ...t, isWatered: true }));
      }
    }

    // 3. 种子 (Seed): 播种
    else if (selectedTool.type === 'seed' && selectedTool.cropType && selectedTool.count > 0) {
      console.log('🌱 尝试播种:', { isHoed: targetTile.isHoed, hasObject: !!targetTile.object, cropType: selectedTool.cropType });
      
      if (targetTile.isHoed && !targetTile.object) {
        const cropConfig = CROPS[selectedTool.cropType];
        console.log('✅ 播种成功!', cropConfig);
        
        updateTile(targetTile.x, targetTile.y, t => ({
          ...t,
          object: { type: 'crop', id: selectedTool.cropType!, stage: 0, plantedAt: Date.now() }
        }));
        // 扣除种子
        setInventory(inv => inv.map(slot => 
          slot.id === selectedTool.id ? { ...slot, count: slot.count - 1 } : slot
        ));
        
        // 显示成熟时间气泡
        const maturityTime = Math.ceil((cropConfig.growthTimePerStage * cropConfig.stages) / 1000 / 60); // 转换为分钟
        const bubbleId = Date.now().toString();
        console.log('💬 创建气泡:', { x: targetTile.x, y: targetTile.y, text: `${maturityTime}分钟后成熟` });
        
        setBubbles(prev => [...prev, {
          id: bubbleId,
          x: targetTile.x,
          y: targetTile.y,
          text: `${maturityTime}分钟后成熟`
        }]);
        
        // 3秒后移除气泡
        setTimeout(() => {
          console.log('⏱️ 移除气泡:', bubbleId);
          setBubbles(prev => {
            const newBubbles = prev.filter(b => b.id !== bubbleId);
            console.log('📊 剩余气泡数:', newBubbles.length);
            return newBubbles;
          });
        }, 3000);
      } else {
        console.log('❌ 播种失败: 必须在翻过的土地上播种!');
      }
    }

    // 4. 手 (Hand): 收获 / 清理杂草
    else if (selectedTool.type === 'hand') {
      if (targetTile.object) {
        // 收获作物
        if (targetTile.object.type === 'crop') {
          const cropConfig = CROPS[targetTile.object.id];
          // 安全检查
          if (!cropConfig) {
            // 清除无效作物
            updateTile(targetTile.x, targetTile.y, t => ({ ...t, object: null }));
            return;
          }
          if (targetTile.object.stage >= cropConfig.stages - 1) {
            // 卖钱
            setCoins(c => c + cropConfig.price);
            // 清空或重置
            updateTile(targetTile.x, targetTile.y, t => ({
              ...t,
              object: null,
              isHoed: true, // 收获后还是耕地
              isWatered: false // 水分重置
            }));
          }
        }
        // 清理杂物
        else if (targetTile.object.type === 'weed' || targetTile.object.type === 'rock') {
           updateTile(targetTile.x, targetTile.y, t => ({ ...t, object: null }));
        }
      }
    }
  };

  // 简单的移动逻辑 (点击远处移动)
  const movePlayerTo = (tx: number, ty: number) => {
    // 更新方向
    setPlayer(prev => {
      let newDir = prev.direction;
      const dx = tx - prev.pos.x;
      const dy = ty - prev.pos.y;
      
      // 根据移动方向更新朝向
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? 'right' : 'left';
      } else {
        newDir = dy > 0 ? 'down' : 'up';
      }
      
      return {
        ...prev,
        pos: { x: tx, y: ty },
        direction: newDir,
        isMoving: true
      };
    });
    setTimeout(() => setPlayer(prev => ({ ...prev, isMoving: false })), 200);
  };

  // 切换工具
  const handleSelectTool = (slotId: string) => {
    setInventory(prev => prev.map(slot => ({
      ...slot,
      selected: slot.id === slotId
    })));
  };

  // 生长循环 (每秒检查)
  useEffect(() => {
    console.log('🌱 启动作物生长循环');
    const timer = setInterval(() => {
      const now = Date.now();
      let growthCount = 0;
      setTiles(currentTiles => currentTiles.map(tile => {
        if (tile.object?.type === 'crop') {
          const config = CROPS[tile.object.id];
          // 安全检查：如果作物配置不存在（可能是旧数据），跳过
          if (!config) {
            return tile;
          }
          const timePassed = now - tile.object.plantedAt;
          const currentStage = Math.floor(timePassed / config.growthTimePerStage);
          const maxStage = config.stages - 1;
          
          if (currentStage !== tile.object.stage && currentStage <= maxStage) {
             growthCount++;
             console.log(`🌾 作物生长! ID: ${tile.object.id}, 从 stage ${tile.object.stage} → ${currentStage}, 时间: ${Math.floor(timePassed/1000)}秒`);
             return {
               ...tile,
               object: { ...tile.object, stage: currentStage }
             };
          }
        }
        return tile;
      }));
      if (growthCount > 0) {
        console.log(`✨ 本次循环共 ${growthCount} 个作物生长`);
      }
    }, 1000);
    return () => {
      console.log('🛑 停止作物生长循环');
      clearInterval(timer);
    };
  }, []);

  return (
      <div 
        className="min-h-screen overflow-hidden relative"
      >


        {/* 商店界面 Overlay */}
        {isShopOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
              className="bg-[#FFE0B2] border-4 border-[#5D4037] rounded-lg p-6 w-[400px] max-w-[90vw] shadow-2xl relative"
              style={{ imageRendering: 'pixelated' }}
            >
              {/* 标题 */}
              <div className="text-center text-[#5D4037] font-bold text-2xl mb-6 border-b-2 border-[#D7CCC8] pb-2">
                杂货铺
              </div>

              {/* 关闭按钮 */}
              <button 
                onClick={() => setIsShopOpen(false)}
                className="absolute top-2 right-2 text-[#5D4037] hover:bg-[#FFCC80] w-8 h-8 rounded-full font-bold flex items-center justify-center"
              >
                ✕
              </button>

              {/* 商品列表 */}
              <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {SHOP_ITEMS.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-4 bg-[#FFF3E0] p-3 rounded border-2 border-[#E65100] hover:bg-[#FFE0B2] transition-colors"
                  >
                    {/* 商品图标 */}
                    <div className="w-12 h-12 bg-[#8D6E63] rounded border border-[#5D4037] flex items-center justify-center overflow-hidden relative shrink-0">
                      <img 
                        src={item.icon} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1">
                      <div className="font-bold text-[#5D4037]">{item.name}</div>
                      <div className="text-sm text-[#E65100] font-bold flex items-center">
                        💰 {item.price} G
                      </div>
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={() => buyItem(item)}
                      className="bg-[#66BB6A] text-white px-4 py-2 rounded font-bold border-b-4 border-[#388E3C] active:border-b-0 active:translate-y-1 hover:bg-[#4CAF50] shrink-0"
                    >
                      购买
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 底部金币显示 */}
              <div className="mt-6 text-right font-bold text-[#E65100] bg-[#FFF8E1] p-2 rounded border border-[#FFECB3]">
                持有金币: {coins} G
              </div>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <button 
          onClick={() => navigate(-1)} 
          className="fixed top-4 left-4 z-50 w-12 h-12 bg-[#E8C089] border-2 border-[#5D4037] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
          style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
        >
          <BackIcon className="text-[#5D4037]" />
        </button>

        {/* Game Map Container - Full Screen */}
        <GameMap 
          tiles={tiles} 
          player={player}
          onTileClick={handleTileClick}
          onOpenShop={() => setIsShopOpen(true)}
          bubbles={bubbles}
        />

        {/* Toolbar (底部居中) */}
        <Toolbar 
          inventory={inventory}
          onSelect={handleSelectTool}
        />
        
        {/* --- 底部 UI 面板 (参考图布局) --- */}

        {/* 左下角：时间/日期 */}
        <div 
          className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-1 font-mono"
          style={{ imageRendering: 'pixelated' }}
        >
           {/* 像素风时间面板 */}
           <div className="bg-[#FFE0B2] border-4 border-[#5D4037] p-3 rounded-lg shadow-lg relative">
             {/* 装饰钉子 */}
             <div className="absolute top-1 left-1 w-1 h-1 bg-[#5D4037] rounded-full"/>
             <div className="absolute top-1 right-1 w-1 h-1 bg-[#5D4037] rounded-full"/>
             
             <div className="text-[#E65100] font-bold text-xs tracking-widest mb-1">SUMMER 2</div>
             <div className="text-[#5D4037] font-bold text-3xl leading-none tracking-wider">12:00</div>
             {/* 暂停/播放按钮装饰 */}
             <div className="flex gap-2 mt-2">
               <div className="w-6 h-6 bg-[#FFCC80] border-2 border-[#E65100] rounded-sm flex items-center justify-center text-[#E65100] text-xs">⏸</div>
               <div className="w-6 h-6 bg-[#FFCC80] border-2 border-[#E65100] rounded-sm flex items-center justify-center text-[#E65100] text-xs">⟳</div>
             </div>
           </div>
        </div>

        {/* 右下角：金币 */}
        <div 
          className="fixed bottom-4 right-4 z-50 font-mono"
          style={{ imageRendering: 'pixelated' }}
        >
           <div className="bg-[#FFE0B2] border-4 border-[#5D4037] px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-6 h-6 bg-[#FFD700] border-2 border-[#FFA000] rounded-full flex items-center justify-center text-[10px] font-bold text-[#E65100]">$</div>
              <span className="text-[#5D4037] font-bold text-2xl tracking-wider">{coins}</span>
           </div>
        </div>

        {/* Instructions Overlay - 移到顶部或者不遮挡的地方 */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#FFE0B2]/80 border-2 border-[#E65100] px-4 py-1 rounded-full shadow-sm pointer-events-none z-40">
          <p className="text-[#E65100] text-xs font-bold text-center font-mono">
             点击左上角小屋进入商店
          </p>
        </div>
      </div>
  );
};

export default HomelandGame;
