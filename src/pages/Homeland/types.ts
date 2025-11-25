
// 坐标
export interface Position {
  x: number;
  y: number;
}

// 地块类型
export type TileBase = 'grass' | 'dirt';
export type TileObjectType = 'crop' | 'rock' | 'wood' | 'weed' | null;

// 土地状态（借鉴开源项目的状态机设计）
export enum LandState {
  EMPTY = 'empty',       // 空地/草地
  PLOWED = 'plowed',     // 已耕种（干土）
  PLANTED = 'planted',   // 已种植
  GROWING = 'growing',   // 生长中
  READY = 'ready',       // 成熟可收获
  WITHERED = 'withered'  // 枯萎
}

export interface TileObject {
  type: TileObjectType;
  id: string; // 物体ID（carrot, rock_1等）
  stage: number; // 作物生长阶段 0-3
  plantedAt: number; // 种植时间戳
  ripeTime?: number; // 剩余成熟时间（毫秒）
  deathTime?: number; // 剩余枯萎时间（毫秒）
  lastWateredAt?: number; // 上次浇水时间
}

// 作物配置
export interface CropConfig {
  id: string;
  name: string;
  stages: number; // 总生长阶段数
  growthTimePerStage: number; // 每个阶段所需时间(ms)
  regrowable: boolean; // 是否可重复收获
  price: number;
}

// 地块数据结构
export interface GameTile {
  x: number;
  y: number;
  base: TileBase; // 基础层：草地/泥土
  isHoed: boolean; // 是否被锄过
  isWatered: boolean; // 是否浇过水
  landState: LandState; // 土地状态（新增）
  
  // 地面物体（作物/障碍物）
  object: TileObject | null;
}

// 玩家工具
export type ToolType = 'hoe' | 'water_can' | 'axe' | 'pickaxe' | 'seed' | 'hand';

// 物品栏槽位
export interface InventorySlot {
  id?: string;
  type: 'tool' | 'seed' | 'crop' | 'misc' | 'hand' | 'hoe' | 'water'; // 扩展类型
  name: string;
  count: number; // -1 表示无限
  selected: boolean;
  cropType?: string; // 种子对应的作物ID
}

// 游戏状态
export interface GameState {
  player: {
    pos: Position;
    direction: 'up' | 'down' | 'left' | 'right';
    isMoving: boolean;
  };
  map: {
    width: number;
    height: number;
    tiles: GameTile[]; // 一维数组存储，通过 index = y * width + x 访问
  };
  inventory: InventorySlot[];
  coins: number;
  day: number;
}
