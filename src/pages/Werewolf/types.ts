export type Role = 'werewolf' | 'villager' | 'seer' | 'witch';
export type GamePhase = 'setup' | 'night' | 'day_discussion' | 'day_voting' | 'game_over';
export type ActionType = 'kill' | 'heal' | 'poison' | 'verify' | 'vote' | 'none';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: Role;
  isAlive: boolean;
  isUser: boolean;
  status?: string; // e.g. "查杀", "金水" (public knowledge)
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  day: number;
  log: string[];
  deadThisNight: string[]; // IDs of players who died last night
  witchPotions: {
    heal: boolean;
    poison: boolean;
  };
  winner: 'werewolf' | 'villager' | null;
  verifyResult?: { targetId: string; isWerewolf: boolean } | null; // Result for seer (user)
}

export interface ChatMessage {
  id: string;
  speakerId: string;
  content: string;
  isSystem?: boolean;
}

// AI生成的一轮发言脚本结构
export interface AIDiscussionScript {
  discussions: {
    speakerId: string;
    content: string;
    targetId?: string; // 只有在针对某人发言时才有
  }[];
  votes: Record<string, string>; // AI的投票意向 { voterId: targetId }
}
