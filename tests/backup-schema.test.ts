import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { encodeBackupValue, decodeBackupValue, normalizeBackup } from '../src/utils/backupSchema'

it('round trips binary files, typed arrays, dates, collections and escaped marker objects', async () => {
  const original = { blob: new Blob(['bytes'], { type: 'image/png' }), file: new File(['file'], 'example.txt', { lastModified: 123 }),
    typed: new Uint16Array([12, 65535]), date: new Date('2026-11-27T00:00:00Z'), map: new Map([['a', 1]]), set: new Set([1, 2]),
    optional: undefined, infinity: Infinity, marker: { __douzhiType: 'Blob', base64: 'ordinary text, not binary' } }
  const restored = decodeBackupValue(JSON.parse(JSON.stringify(await encodeBackupValue(original))))
  expect(await restored.blob.text()).toBe('bytes')
  expect(restored.blob.type).toBe('image/png')
  expect(restored.file.name).toBe('example.txt')
  expect(restored.file.lastModified).toBe(123)
  expect(restored.typed).toEqual(original.typed)
  expect(restored.date).toEqual(original.date)
  expect(restored.map).toEqual(original.map)
  expect(restored.set).toEqual(original.set)
  expect(restored.optional).toBeUndefined()
  expect(restored.infinity).toBe(Infinity)
  expect(restored.marker).toEqual(original.marker)
})

it('creates the complete real schema when importing a legacy subset', () => {
  const backup = normalizeBackup({ type: 'style', indexedDB: { AppStorage: { images: { keys: [], values: [] } }, EmojiDB: { emojis: { keys: [], values: [] } } } })
  expect(backup.databases.AppStorage.version).toBe(2)
  expect(backup.databases.AppStorage.stores.settings).toBeDefined()
  expect(backup.databases.EmojiDB.version).toBe(3)
})

it('normalizes old individually keyed roles to the current all-roles record', () => {
  const backup = normalizeBackup({ type: 'chat', indexedDB: { 'characters-db': { all_characters: [{ id: 1, realName: 'Role' }] } } })
  expect(backup.databases.DouzhiDB.stores.characters.keys).toEqual(['all'])
  expect(backup.databases.DouzhiDB.stores.characters.values).toEqual([[{ id: '1', realName: 'Role' }]])
})

it('does not let an archived legacy role list overwrite modern roles', () => {
  const backup = normalizeBackup({ type: 'chat', indexedDB: {
    DouzhiDB: { characters: { keys: ['all'], values: [[{ id: '1', realName: 'Modern Role' }]] } },
    'characters-db': { all_characters: [{ id: '1', realName: 'Old Role' }] },
  } })
  expect(backup.databases.DouzhiDB.stores.characters.values[0][0].realName).toBe('Modern Role')
  expect(backup.databases['characters-db']).toBeDefined()
})

it('rejects mismatched records, invalid role shapes and malformed critical configuration before writes', () => {
  expect(() => normalizeBackup({ type: 'chat', indexedDB: { DouzhiDB: { messages: { keys: ['chat'], values: [] } } } })).toThrow()
  expect(() => normalizeBackup({ type: 'chat', indexedDB: { DouzhiDB: { characters: { keys: ['all'], values: [[{ id: '1' }]] } } } })).toThrow('角色')
  expect(() => normalizeBackup({ type: 'chat', localStorage: { focus_mode: '{bad' }, indexedDB: {} })).toThrow('focus_mode')
  expect(() => normalizeBackup({ type: 'chat', localStorage: { apiConfigs: '{}' }, indexedDB: {} })).toThrow('apiConfigs')
})

it('rejects corrupted binary payloads and unexpected database targets', () => {
  expect(() => decodeBackupValue({ __douzhiType: 'Blob', base64: 'not valid base64!' })).toThrow()
  expect(() => normalizeBackup({ type: 'chat', indexedDB: { 'unrelated-other-app': {} } })).toThrow('不支持')
})
