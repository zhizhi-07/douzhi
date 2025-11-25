import React from 'react';
import { GameTile, GameState } from './types';
import { TILE_SIZE, MAP_WIDTH } from './config';

interface GameMapProps {
  tiles: GameTile[];
  player: GameState['player'];
  onTileClick: (tile: GameTile) => void;
  onOpenShop: () => void;
  bubbles: {id: string, x: number, y: number, text: string}[];
}

const GameMap: React.FC<GameMapProps> = ({ tiles, player, onTileClick, onOpenShop, bubbles }) => {
  return (
    <div 
      className="relative"
      style={{
        width: MAP_WIDTH * TILE_SIZE,
      }}
    >

      {/* --- 游戏主区域 --- */}
      <div 
        className="relative"
        style={{
          backgroundImage: 'url(/homeland/tiles/ground_grass_2.png)',
          backgroundSize: '64px 64px',
          backgroundRepeat: 'repeat',
          imageRendering: 'pixelated',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* 地面层 Tiles */}
        <div 
          className="grid overflow-visible absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            gridTemplateColumns: `repeat(${MAP_WIDTH}, ${TILE_SIZE}px)`,
            position: 'relative',
          }}
        >
          {tiles.map((tile) => {
            const isDirt = tile.base === 'dirt';
            const isTilled = tile.isHoed;
            const isWet = tile.isWatered;
            
            // 特殊建筑位置判断
            const isShopTile = tile.x === 0 && tile.y === 0; // 商店占据左上角(0,0)位置
            const isTreeTile = tile.x === MAP_WIDTH - 2 && tile.y === 0; // 大树在右上角
            
            
            return (
              <div
                key={`${tile.x}-${tile.y}`}
                onClick={() => {
                  if (isShopTile) {
                    onOpenShop();
                  } else {
                    onTileClick(tile);
                  }
                }}
                className="relative cursor-pointer overflow-visible"
                style={{ width: TILE_SIZE, height: TILE_SIZE }}
              >
                {/* 商店建筑（占据左上角） */}
                {isShopTile && (
                  <div 
                    className="absolute inset-0 flex items-end justify-center pointer-events-auto z-20"
                    onClick={() => onOpenShop && onOpenShop()}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src="/homeland/buildings/kitchen_building_final.png" 
                      alt="商店"
                      style={{
                        width: `${TILE_SIZE * 5}px`,
                        height: `${TILE_SIZE * 5}px`,
                        imageRendering: 'pixelated',
                        objectFit: 'contain',
                        filter: 'drop-shadow(10px 20px 20px rgba(0,0,0,0.6))',
                        marginBottom: '-20px',
                      }}
                    />
                  </div>
                )}

                {/* 大树（占据右上角） */}
                {isTreeTile && (
                  <div 
                    className="absolute inset-0 flex items-end justify-center z-40 pointer-events-none"
                  >
                    <img 
                      src="/homeland/buildings/decotree_01.png"
                      alt="树"
                      style={{
                        width: `${TILE_SIZE * 6}px`,
                        height: `${TILE_SIZE * 6}px`,
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(15px 30px 30px rgba(0,0,0,0.5))',
                        marginBottom: '-40px',
                      }}
                    />
                  </div>
                )}


                {/* 地形层 */}
                {isDirt && !isTilled ? (
                  // 土地（未翻土）- 使用 bare_land 贴图
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'url(/homeland/crops/bare_land.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      imageRendering: 'pixelated',
                    }}
                  />
                ) : isTilled ? (
                  // 翻土 - 使用 plowed 贴图
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'url(/homeland/crops/plowed.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      imageRendering: 'pixelated',
                      filter: isWet ? 'brightness(0.7) saturate(1.2)' : 'brightness(1.0)',
                    }}
                  />
                ) : null}

                {/* 固定草地装饰 */}
                {(() => {
                  // 使用坐标生成伪随机装饰
                  const seed = (tile.x * 7 + tile.y * 13) % 100;
                  const hasDecoration = seed < 20 && !tile.object && tile.base === 'grass' && !isShopTile && !isTreeTile;
                  if (!hasDecoration) return null;
                  
                  const decorationType = (seed % 7) + 1;
                  return (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
                      <img 
                        src={`/homeland/decoration/grass_${decorationType}.png`}
                        alt="草"
                        style={{
                          width: '28px',
                          height: '28px',
                          imageRendering: 'pixelated',
                          opacity: 0.8
                        }}
                      />
                    </div>
                  );
                })()}

                {/* 物体层 */}
                {tile.object && (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10 overflow-visible">
                     {getTileObjectRender(tile)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 气泡提示层 - 在grid内部，使用相同坐标系 */}
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className="absolute z-[999] pointer-events-none"
              style={{
                left: bubble.x * TILE_SIZE + TILE_SIZE / 2,
                top: bubble.y * TILE_SIZE - 50,
                transform: 'translateX(-50%)',
                animation: 'bounce 1s infinite',
              }}
            >
              <div 
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '3px solid #5D4037',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#5D4037' }}>
                  {bubble.text}
                </div>
                {/* 小三角 */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-8px',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #5D4037',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 玩家实体层 - 暂时隐藏 */}
      </div>
    </div>
  );
};

const getTileObjectRender = (tile: GameTile) => {
  if (!tile.object) return null;

  const { type, stage, id } = tile.object;

  const emojiStyle = { filter: 'drop-shadow(2px 4px 0px rgba(0,0,0,0.2))' };
  if (type === 'rock') return <div className="text-3xl" style={emojiStyle}>🪨</div>;
  if (type === 'wood') return <div className="text-3xl" style={emojiStyle}>🪵</div>;
  if (type === 'weed') return <div className="text-3xl" style={emojiStyle}>🌿</div>;
  
  if (type === 'crop') {
    console.log(`🎨 渲染作物: ID=${id}, stage=${stage}`);
    
    // Stage 0: 种子（小棕点）
    if (stage === 0) {
      return (
        <div 
          className="mx-auto"
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#8B4513',
            borderRadius: '50%',
            border: '2px solid #654321',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            marginTop: '12px'
          }}
        />
      );
    }
    
    // Stage 1-4: 使用Unity高质量素材
    const cropFileMap: Record<string, string> = {
      'corn': 'corn_stage',
      'lettuce': 'lettuce_stage', 
      'carrot': 'carrot_stage',
      'tomato': 'pepper_stage', // 用辣椒替代番茄
      'pepper': 'pepper_stage',
    };
    
    const cropFile = cropFileMap[id];
    if (!cropFile) {
      return <div className="text-2xl">🌿</div>; // 备用显示
    }
    
    const imageUrl = `/homeland/crops/${cropFile}_${stage}.png`;
    console.log(`🖼️ 使用Unity素材: ${imageUrl}`);
    
    return (
      <img
        src={imageUrl}
        alt={`${id} stage ${stage}`}
        style={{
          width: '48px',
          height: '48px',
          imageRendering: 'pixelated',
          objectFit: 'contain',
          marginTop: '-8px',
          filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.3))',
        }}
        onError={(e) => {
          console.log(`❌ 图片加载失败: ${imageUrl}`);
          // fallback to emoji
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return null;
};

export default GameMap;
