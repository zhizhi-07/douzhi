import * as IDB from './indexedDBManager'
import type { UserInfo } from './userUtils'
let cached: UserInfo | null = null
let loading: Promise<void> | null = null
function legacyProfile(): UserInfo {
  const raw = localStorage.getItem('user_info')
  if (!raw) return { nickname: '', realName: '用户' }
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('用户资料格式错误，原数据已保留')
  return parsed
}
export function getStoredUserProfile(): UserInfo { return structuredClone(cached || legacyProfile()) }
export function getStoredUserProfileJSON(): string { return JSON.stringify(getStoredUserProfile()) }
export function initializeUserProfile(): Promise<void> {
  if (!loading) loading = (async () => {
    const stored = await IDB.getItem<UserInfo>(IDB.STORES.USER_INFO, 'profile', true)
    cached = stored || legacyProfile()
  })().catch(error => { loading = null; throw error })
  return loading
}
export async function saveStoredUserProfile(profile: UserInfo): Promise<void> {
  await initializeUserProfile()
  const snapshot = structuredClone(profile)
  await IDB.setItem(IDB.STORES.USER_INFO, 'profile', snapshot)
  cached = snapshot
  // Compatibility mirror only. Quota in the small store cannot invalidate a committed profile.
  try { localStorage.setItem('user_info', JSON.stringify(snapshot)) } catch (error) { console.warn('资料已保存到IndexedDB，旧版兼容副本空间不足:', error) }
}
