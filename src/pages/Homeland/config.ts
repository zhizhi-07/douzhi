import { CropConfig } from './types';

export const CROPS: Record<string, CropConfig> = {
  carrot: {
    id: 'carrot',
    name: '胡萝卜',
    stages: 4,
    growthTimePerStage: 5000, // 测试用：5秒一个阶段
    regrowable: false,
    price: 20,
  },
  pumpkin: {
    id: 'pumpkin',
    name: '南瓜',
    stages: 5,
    growthTimePerStage: 10000, // 10秒一个阶段
    regrowable: false,
    price: 50,
  },
  corn: {
    id: 'corn',
    name: '玉米',
    stages: 4,
    growthTimePerStage: 3000, // 3秒一级，快速测试
    regrowable: true,
    price: 35,
  },
  tomato: {
    id: 'tomato',
    name: '番茄',
    stages: 4,
    growthTimePerStage: 3000, // 3秒一级
    regrowable: true,
    price: 40,
  },
  lettuce: {
    id: 'lettuce',
    name: '生菜',
    stages: 3,
    growthTimePerStage: 3000, // 3秒一级
    regrowable: false,
    price: 25,
  }
};

// 初始地图尺寸
export const MAP_WIDTH = 10;
export const MAP_HEIGHT = 10;

// 瓦片像素大小（用于渲染计算）
export const TILE_SIZE = 48; 
