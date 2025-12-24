import { Player, Role, GameState } from './types';

// 初始化6人局：2狼，2民，1预，1女
export const INITIAL_ROLES: Role[] = [
  'werewolf', 'werewolf', 
  'villager', 'villager', 
  'seer', 'witch'
];

// 选定角色后初始化游戏
export interface SelectedCharacter {
  id: string;
  name: string;
  avatar: string;
  isNPC?: boolean;
}

// NPC名字池
const NPC_NAMES = [
  '路人甲', '路人乙', '路人丙', '路人丁', '路人戊',
  '小明', '小红', '小刚', '小丽', '小华',
  '阿强', '阿珍', '阿杰', '阿美', '阿龙'
];

// 生成NPC角色
export const generateNPCs = (count: number, excludeNames: string[]): SelectedCharacter[] => {
  const availableNames = NPC_NAMES.filter(n => !excludeNames.includes(n));
  const npcs: SelectedCharacter[] = [];
  
  for (let i = 0; i < count && i < availableNames.length; i++) {
    npcs.push({
      id: `npc_${i}_${Date.now()}`,
      name: availableNames[i],
      avatar: '', // NPC不使用头像，在UI中显示名字首字
      isNPC: true
    });
  }
  
  return npcs;
};

export const initializeGameWithCharacters = (
  selectedCharacters: SelectedCharacter[],
  userName: string,
  userAvatar: string
): GameState => {
  // 1. 随机洗牌角色
  const roles = [...INITIAL_ROLES];
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // 2. 创建玩家：用户 + 5个选定的AI角色
  const players: Player[] = [];
  
  // 用户
  players.push({
    id: 'user',
    name: userName || '我',
    avatar: userAvatar, // 如果为空，就让UI层去渲染首字，而不是强制使用DiceBear
    role: roles[0],
    isAlive: true,
    isUser: true
  });
  
  // AI角色
  selectedCharacters.slice(0, 5).forEach((char, index) => {
    players.push({
      id: char.id,
      name: char.name,
      avatar: char.avatar || '', // 移除DiceBear回退，强制使用空字符串以触发首字头像
      role: roles[index + 1],
      isAlive: true,
      isUser: false
    });
  });

  return {
    players,
    phase: 'setup',
    day: 0,
    log: [],
    deadThisNight: [],
    witchPotions: { heal: true, poison: true },
    winner: null,
    verifyResult: null
  };
};

// 检查游戏是否结束
export const checkGameOver = (players: Player[]): 'werewolf' | 'villager' | null => {
  const wolves = players.filter(p => p.isAlive && p.role === 'werewolf').length;
  const humans = players.filter(p => p.isAlive && p.role !== 'werewolf').length;
  
  // 屠城规则（简化）：所有狼死，好人赢；所有好人死，狼人赢
  if (wolves === 0) return 'villager';
  if (humans === 0) return 'werewolf'; // 实际规则通常是屠边，这里简化为屠城，或者屠神/屠民
  
  // 屠边判定：神死光 或 民死光
  const villagers = players.filter(p => p.isAlive && p.role === 'villager').length;
  const gods = players.filter(p => p.isAlive && (p.role === 'seer' || p.role === 'witch')).length;
  
  if (villagers === 0 || gods === 0) return 'werewolf';
  
  return null;
};

// 模拟AI狼人夜间行动（零Token方案）
export const simulateWerewolfKill = (players: Player[]): string | null => {
  const aliveNonWolves = players.filter(p => p.isAlive && p.role !== 'werewolf');
  if (aliveNonWolves.length === 0) return null;
  
  // 简单策略：随机杀一个非狼人
  // 进阶策略可以加入：优先杀已暴露的神职
  const target = aliveNonWolves[Math.floor(Math.random() * aliveNonWolves.length)];
  return target.id;
};

// 模拟AI女巫救人（零Token方案）
export const simulateWitchHeal = (
  players: Player[], 
  dyingPlayerId: string, 
  hasHealPotion: boolean
): boolean => {
  const witch = players.find(p => p.role === 'witch');
  // 如果女巫死了，或者没药了，或者被杀的是女巫自己（通常不能自救），则不救
  if (!witch || !witch.isAlive || !hasHealPotion) return false;
  if (dyingPlayerId === witch.id) return false; // 假设不可自救
  
  // 简单策略：第一晚必救，之后随机救
  // 这里简化为：只要有药就救
  return true;
};

// 模拟AI女巫毒人（零Token方案）
export const simulateWitchPoison = (
  players: Player[],
  hasPoisonPotion: boolean
): string | null => {
  const witch = players.find(p => p.role === 'witch');
  if (!witch || !witch.isAlive || !hasPoisonPotion) return null;
  
  // 简单策略：一般不开毒，除非有确定的狼人信息（这里简化为不随机开毒）
  return null; 
};

// 模拟AI预言家验人（零Token方案）
export const simulateSeerVerify = (players: Player[]): string | null => {
  const seer = players.find(p => p.role === 'seer');
  if (!seer || !seer.isAlive) return null;
  
  // 随机验一个未知的活人
  // 这里只是模拟动作，实际信息会在AI发言Prompt中用到
  const unknownAlive = players.filter(p => p.isAlive && p.id !== seer.id);
  if (unknownAlive.length === 0) return null;
  
  return unknownAlive[Math.floor(Math.random() * unknownAlive.length)].id;
};
