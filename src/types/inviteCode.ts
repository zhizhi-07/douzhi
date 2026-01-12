/**
 * 邀请码类型定义
 */

export interface InviteCode {
  id: string;
  code: string;
  status: 'unbound' | 'bound';
  deviceFingerprint?: string;
  boundAt?: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

// 生成唯一邀请码
export function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 序列化邀请码
export function serializeInviteCode(code: InviteCode): string {
  return JSON.stringify(code);
}

// 反序列化邀请码
export function deserializeInviteCode(str: string): InviteCode {
  return JSON.parse(str);
}
