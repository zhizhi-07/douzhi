import { getFromIndexedDB, saveToIndexedDB } from './unifiedStorage'
export function legacyFrameKeys(chatId: string): string[] {
  return ['avatar_shape', 'avatar_size', 'hide_avatar', 'avatar_frame_image', 'avatar_frame_size', 'avatar_frame_offset_x', 'avatar_frame_offset_y', ...['user', 'ai'].flatMap(prefix => [`${prefix}_avatar_frame`, `${prefix}_avatar_frame_image`, `${prefix}_avatar_frame_size`, `${prefix}_avatar_frame_offset_x`, `${prefix}_avatar_frame_offset_y`])].map(key => `${key}_${chatId}`)
}
export async function loadAvatarFrameSettings(chatId: string): Promise<Record<string, string>> {
  const saved = await getFromIndexedDB('SETTINGS', `avatar_frame_settings_${chatId}`)
  if (saved) return saved
  return Object.fromEntries(legacyFrameKeys(chatId).map(key => [key, localStorage.getItem(key)]).filter((entry): entry is [string, string] => entry[1] !== null))
}
export async function saveAvatarFrameSettings(chatId: string, settings: Record<string, string>): Promise<void> {
  const legacy = legacyFrameKeys(chatId).map(key => [key, localStorage.getItem(key)] as const)
  await saveToIndexedDB('SETTINGS', `avatar_frame_settings_${chatId}`, settings)
  for (const [key, raw] of legacy) if (localStorage.getItem(key) === raw) localStorage.removeItem(key)
  window.dispatchEvent(new Event('avatarFrameUpdate'))
}
