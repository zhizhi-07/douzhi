export const STORAGE_KEYS = {
  API_SETTINGS: 'apiSettings',
  API_CONFIGS: 'apiConfigs',
  CURRENT_API_ID: 'currentApiId'
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`存储失败 (${key}):`, error)
  }
}

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`读取失败 (${key}):`, error)
    return defaultValue
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`删除失败 (${key}):`, error)
  }
}
