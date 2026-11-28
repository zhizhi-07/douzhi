export interface IndexSchema { name: string; keyPath: string | string[]; unique?: boolean; multiEntry?: boolean }
export interface StoreSchema { keyPath: string | string[] | null; autoIncrement?: boolean; indexes: IndexSchema[] }
export interface StoreBackup extends StoreSchema { keys: IDBValidKey[]; values: any[] }
export interface DatabaseBackup { version: number; stores: Record<string, StoreBackup> }
const keyed = (keyPath: string | null = null, indexes: Array<string | [string, string]> = []): StoreSchema => ({
  keyPath, indexes: indexes.map(index => typeof index === 'string' ? { name: index, keyPath: index } : { name: index[0], keyPath: index[1] })
})
const stores = (names: string[]) => Object.fromEntries(names.map(name => [name, keyed()]))

// Legacy v2 files lack schema metadata. These definitions match the actual owning modules.
export const DATABASE_SCHEMAS: Record<string, { version: number; stores: Record<string, StoreSchema> }> = {
  DouzhiDB: { version: 4, stores: stores(['messages', 'moments', 'characters', 'userInfo', 'wallet', 'emojis', 'settings', 'misc', 'dmMessages', 'dmConversations']) },
  AppStorage: { version: 2, stores: stores(['images', 'audio', 'messages', 'moments', 'characters', 'settings']) },
  EmojiDB: { version: 3, stores: { emojis: keyed() } },
  BubbleStyleDB: { version: 1, stores: { styles: keyed('key') } },
  FontStorage: { version: 1, stores: { fonts: keyed('name') } },
  IconStorage: { version: 2, stores: stores(['ui_icons', 'desktop_icons']) },
  BackgroundStorage: { version: 1, stores: { backgrounds: keyed() } },
  AvatarStorage: { version: 1, stores: { avatars: keyed('id') } },
  MusicStorageDB: { version: 1, stores: { songs: keyed('id') } },
  AILocationDB: { version: 1, stores: { locations: keyed('id', ['characterId', 'timestamp', 'areaId']), areas: keyed('id') } },
  CouplePhotosDB: { version: 1, stores: { photos: keyed('id', ['characterId', 'timestamp']) } },
  UnifiedMemoryDB: { version: 1, stores: { memories: keyed('id', [['by-character', 'characterId'], ['by-domain', 'domain'], ['by-timestamp', 'timestamp'], ['by-importance', 'importance']]) } },
  kiro_avatar_library: { version: 3, stores: { avatars: keyed('id', ['createdAt', 'tagId']), tags: { keyPath: 'id', indexes: [{ name: 'name', keyPath: 'name', unique: true }] } } },
  forum_db: { version: 1, stores: { posts: keyed('id') } },
  'forum-comments-db': { version: 1, stores: { comments: keyed('id', [['by-postId', 'postId'], ['by-timestamp', 'timestamp']]) } },
  topic_chat_db: { version: 1, stores: { topic_chats: keyed('topicName') } },
  douzhi_device: { version: 1, stores: { device: keyed() } },
  WeChatAppDB: { version: 3, stores: {
    characters: keyed('id', ['name']), chats: keyed('id', ['characterId', 'lastMessageTime']), messages: keyed('id', ['chatId', 'timestamp']),
    settings: keyed('key'), lorebooks: keyed('id', ['name']), moments: keyed('id', ['characterId', 'timestamp']), groups: keyed('id'), emojis: keyed('id', ['addTime'])
  } },
}
export const LEGACY_NAMES = ['simple-chat-messages', 'moments-storage', 'characters-db', 'BubbleDB', 'LocationDB', 'ChatListDB', 'IconDB', 'BackgroundDB', 'ForumCommentsDB', 'InstagramDMDB']
export const OWNED_DATABASES = [...Object.keys(DATABASE_SCHEMAS), ...LEGACY_NAMES]
export const STYLE_DATABASES = ['AppStorage', 'AvatarStorage', 'BackgroundStorage', 'IconStorage', 'FontStorage', 'BubbleStyleDB', 'EmojiDB', 'kiro_avatar_library', 'MusicStorageDB']
export const CORE_CHAT_DATABASES = OWNED_DATABASES.filter(name => !STYLE_DATABASES.includes(name))

export async function encodeBackupValue(value: any): Promise<any> {
  if (value === undefined) return { __douzhiType: 'Undefined' }
  if (typeof value === 'number' && !Number.isFinite(value)) return { __douzhiType: 'Number', value: String(value) }
  if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes = value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
    return { __douzhiType: typeof File !== 'undefined' && value instanceof File ? 'File' : value instanceof Blob ? 'Blob' : 'ArrayBuffer', mimeType: value instanceof Blob ? value.type : '', base64: btoa(binary),
      ...(ArrayBuffer.isView(value) ? { arrayType: value.constructor.name } : {}),
      ...(typeof File !== 'undefined' && value instanceof File ? { name: value.name, lastModified: value.lastModified } : {}) }
  }
  if (value instanceof Date) return { __douzhiType: 'Date', value: value.toISOString() }
  if (value instanceof Map) return { __douzhiType: 'Map', entries: await encodeBackupValue([...value.entries()]) }
  if (value instanceof Set) return { __douzhiType: 'Set', values: await encodeBackupValue([...value]) }
  if (Array.isArray(value)) return Promise.all(value.map(encodeBackupValue))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await encodeBackupValue(item)]))
    return Object.prototype.hasOwnProperty.call(value, '__douzhiType') ? { __douzhiType: 'Object', entries } : Object.fromEntries(entries)
  }
  return value
}

export function decodeBackupValue(value: any): any {
  if (Array.isArray(value)) return value.map(decodeBackupValue)
  if (value && typeof value === 'object') {
    if (value.__douzhiType === 'Undefined') return undefined
    if (value.__douzhiType === 'Number') {
      if (!['NaN', 'Infinity', '-Infinity'].includes(value.value)) throw new Error('备份数字格式损坏')
      return Number(value.value)
    }
    if (value.__douzhiType === 'Object') return Object.fromEntries(value.entries.map(([key, item]: [string, any]) => [key, decodeBackupValue(item)]))
    if (value.__douzhiType === 'Map') return new Map(decodeBackupValue(value.entries))
    if (value.__douzhiType === 'Set') return new Set(decodeBackupValue(value.values))
    if (value.__douzhiType === 'Blob' || value.__douzhiType === 'File' || value.__douzhiType === 'ArrayBuffer') {
      if (typeof value.base64 !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.base64)) throw new Error('备份二进制数据损坏')
      const bytes = Uint8Array.from(atob(value.base64), character => character.charCodeAt(0))
      if (value.__douzhiType === 'File') return new File([bytes], value.name, { type: value.mimeType, lastModified: value.lastModified })
      if (value.__douzhiType === 'Blob') return new Blob([bytes], { type: typeof value.mimeType === 'string' ? value.mimeType : '' })
      if (value.arrayType) {
        const constructors: Record<string, new (buffer: ArrayBuffer) => ArrayBufferView> = { Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, DataView }
        const Constructor = Object.prototype.hasOwnProperty.call(constructors, value.arrayType) ? constructors[value.arrayType as keyof typeof constructors] : undefined
        if (!Constructor) throw new Error('不支持的二进制数组类型')
        return new Constructor(bytes.buffer)
      }
      return bytes.buffer
    }
    if (value.__douzhiType === 'Date') {
      const date = new Date(value.value)
      if (!Number.isFinite(date.getTime())) throw new Error('备份日期数据损坏')
      return date
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeBackupValue(item)]))
  }
  return value
}

export function valueAtPath(value: any, path: string | string[]): any {
  return Array.isArray(path) ? path.map(part => valueAtPath(value, part)) : path.split('.').reduce((item, part) => item?.[part], value)
}

export function normalizeBackup(data: any): { type: 'chat' | 'style'; localStorage: Record<string, string>; databases: Record<string, DatabaseBackup> } {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.indexedDB || typeof data.indexedDB !== 'object' || Array.isArray(data.indexedDB)) throw new Error('无效备份：缺少数据库数据')
  if (data.type && !['chat', 'style'].includes(data.type)) throw new Error('无法识别的备份类型')
  if (!data.type && !(data.version && data.exportTime)) throw new Error('无法识别的备份格式，现有数据未修改')
  const local: Record<string, string> = {}
  if (data.localStorage !== undefined && (!data.localStorage || typeof data.localStorage !== 'object' || Array.isArray(data.localStorage))) throw new Error('localStorage备份格式错误')
  for (const [key, value] of Object.entries(data.localStorage || {})) {
    if (typeof value !== 'string') throw new Error(`配置 ${key} 不是字符串，未修改现有数据`)
    if (['focus_mode', 'user_info', 'user_accounts', 'apiConfigs', 'apiSettings'].includes(key)) {
      let parsed: any
      try { parsed = JSON.parse(value) } catch { throw new Error(`配置 ${key} 的JSON损坏，未修改现有数据`) }
      if (['user_accounts', 'apiConfigs'].includes(key) && !Array.isArray(parsed)) throw new Error(`配置 ${key} 应为数组`)
      if (['user_info', 'apiSettings'].includes(key) && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error(`配置 ${key} 应为对象`)
    }
    local[key] = value
  }
  const databases: Record<string, DatabaseBackup> = {}
  const aliases: Record<string, string> = { 'simple-chat-messages': 'DouzhiDB', 'moments-storage': 'DouzhiDB', 'characters-db': 'DouzhiDB', BubbleDB: 'BubbleStyleDB', LocationDB: 'AILocationDB' }
  const storeAliases: Record<string, string> = { chats: 'messages', chat_messages: 'messages', all_characters: 'characters', character_list: 'characters' }
  for (const [sourceName, raw] of Object.entries(data.indexedDB) as Array<[string, any]>) {
    if (!OWNED_DATABASES.includes(sourceName)) throw new Error(`不支持的数据库：${sourceName}`)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`数据库 ${sourceName} 格式错误`)
    // Keep archived legacy DBs separate when a canonical DB is already present.
    // Otherwise stale archives could overwrite the modern role list or restore deleted chats.
    const target = aliases[sourceName]
    const name = target && !Object.prototype.hasOwnProperty.call(data.indexedDB, target) ? target : sourceName
    const definition = DATABASE_SCHEMAS[name]
    const version = definition?.version || raw.version || 1
    if (!Number.isSafeInteger(version) || version < 1) throw new Error(`数据库 ${name} 版本无效`)
    const database = databases[name] ||= { version, stores: {} }
    const rawStores = raw.stores || raw
    for (const [sourceStore, encoded] of Object.entries(rawStores) as Array<[string, any]>) {
      const storeName = name !== sourceName ? storeAliases[sourceStore] || sourceStore : sourceStore
      if (!encoded || (!Array.isArray(encoded) && (!Array.isArray(encoded.keys) || !Array.isArray(encoded.values) || encoded.keys.length !== encoded.values.length))) throw new Error(`${name}/${storeName} 的keys与values不匹配`)
      const schema: StoreSchema = definition?.stores[storeName] || { keyPath: encoded.keyPath ?? null, autoIncrement: encoded.autoIncrement || false, indexes: encoded.indexes || [] }
      if (schema.keyPath !== null && typeof schema.keyPath !== 'string' && !Array.isArray(schema.keyPath)) throw new Error('无效的主键定义')
      if (Array.isArray(schema.keyPath) && !schema.keyPath.every(part => typeof part === 'string')) throw new Error('无效的复合主键定义')
      if (!Array.isArray(schema.indexes) || schema.indexes.some(index => !index || typeof index.name !== 'string' || !(typeof index.keyPath === 'string' || Array.isArray(index.keyPath) && index.keyPath.every(part => typeof part === 'string')))) throw new Error('无效的索引定义')
      const values = decodeBackupValue(Array.isArray(encoded) ? encoded : encoded.values)
      const keys: IDBValidKey[] = decodeBackupValue(Array.isArray(encoded) ? values.map((record: any) => record?.id ?? record?.chatId) : encoded.keys)
      if (name === 'DouzhiDB' && storeName === 'characters') {
        const characters = values.flatMap((value: any) => Array.isArray(value) ? value : [value])
        if (characters.some((character: any) => !character || !['string', 'number'].includes(typeof character.id) || typeof character.realName !== 'string' || !character.realName.trim())) throw new Error('角色备份格式错误：缺少id或真实名字')
        const existing = database.stores.characters?.values[0] || []
        const merged = new Map([...existing, ...characters].map((character: any) => [String(character.id), { ...character, id: String(character.id) }]))
        database.stores.characters = { ...schema, keys: ['all'], values: [Array.from(merged.values())] }
        continue
      }
      for (let index = 0; index < keys.length; index++) {
        try { indexedDB.cmp(keys[index], keys[index]) } catch { throw new Error(`${name}/${storeName} 存在无效主键`) }
        if (schema.keyPath !== null) {
          const inlineKey = valueAtPath(values[index], schema.keyPath)
          try { if (indexedDB.cmp(inlineKey, keys[index]) !== 0) throw new Error() } catch { throw new Error(`${name}/${storeName} 记录主键与数据不匹配`) }
        }
        if (name === 'DouzhiDB' && storeName === 'messages' && !Array.isArray(values[index])) throw new Error('聊天记录必须按会话保存为数组')
      }
      const previous = database.stores[storeName]
      if (previous) {
        const map = new Map(previous.keys.map((key, index) => [JSON.stringify(key), { key, value: previous.values[index] }]))
        keys.forEach((key, index) => map.set(JSON.stringify(key), { key, value: values[index] }))
        database.stores[storeName] = { ...schema, keys: [...map.values()].map(item => item.key), values: [...map.values()].map(item => item.value) }
      } else database.stores[storeName] = { ...schema, keys, values }
    }
    for (const [storeName, schema] of Object.entries(definition?.stores || {})) database.stores[storeName] ||= { ...schema, keys: [], values: [] }
  }
  return { type: data.type || 'chat', localStorage: local, databases }
}
