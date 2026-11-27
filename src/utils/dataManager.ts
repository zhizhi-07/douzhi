/** Offline maintenance only: no app services, cached connections, AI timers or implicit reloads. */
import { CORE_CHAT_DATABASES, OWNED_DATABASES, STYLE_DATABASES, encodeBackupValue, normalizeBackup } from './backupSchema'
import type { DatabaseBackup, StoreBackup } from './backupSchema'

export type ProgressCallback = (stage: string, percent: number) => void
const JOURNAL = 'douzhi_maintenance_rollback'
let busy = false
function requireMaintenancePage() {
  if (window.location.pathname !== '/data-manager.html') throw new Error('请先进入独立数据管理页再导入或清除，以关闭旧数据库连接')
}
async function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  if (busy) throw new Error('已有数据操作正在进行，请等待完成')
  busy = true
  try {
    if (navigator.locks) return await navigator.locks.request('douzhi-data-maintenance', { ifAvailable: true }, lock => {
      if (!lock) throw new Error('另一个豆织标签页正在管理数据，请先关闭或完成该操作')
      return operation()
    })
    return await operation()
  } finally { busy = false }
}
function localSnapshot(): Record<string, string> {
  return Object.fromEntries(Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)!).filter(Boolean).map(key => [key, localStorage.getItem(key)!]))
}
function isAuthKey(key: string): boolean {
  return ['douzhi-auth', 'cf_auth_token', 'cf_auth_user', 'auth_channel'].includes(key) || /^sb-.*-auth-token/.test(key)
}
function openExisting(name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name)
    let absent = false
    let cancelled = false
    request.onupgradeneeded = event => {
      if (event.oldVersion === 0) { absent = true; request.transaction!.abort() }
    }
    request.onerror = () => absent ? resolve(null) : reject(request.error)
    request.onblocked = () => { cancelled = true; reject(new Error(`数据库 ${name} 正在升级，请关闭其他豆织标签页后重试`)) }
    request.onsuccess = () => {
      if (cancelled) { request.result.close(); return }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}
async function readDatabase(name: string): Promise<DatabaseBackup | null> {
  const db = await openExisting(name)
  if (!db) return null
  try {
    const names = Array.from(db.objectStoreNames)
    const stores: Record<string, StoreBackup> = {}
    if (!names.length) return { version: db.version, stores }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(names, 'readonly')
      transaction.oncomplete = () => resolve()
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error(`读取 ${name} 失败`))
      for (const storeName of names) {
        const store = transaction.objectStore(storeName)
        const data: StoreBackup = { keyPath: store.keyPath, autoIncrement: store.autoIncrement, indexes: Array.from(store.indexNames).map(indexName => {
          const index = store.index(indexName)
          return { name: indexName, keyPath: index.keyPath, unique: index.unique, multiEntry: index.multiEntry }
        }), keys: [], values: [] }
        stores[storeName] = data
        const request = store.openCursor()
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor) return
          data.keys.push(cursor.primaryKey)
          data.values.push(cursor.value)
          cursor.continue()
        }
      }
    })
    return { version: db.version, stores }
  } finally { db.close() }
}
function deleteDatabase(name: string, onProgress?: ProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error || new Error(`删除 ${name} 失败`))
    // A blocked delete is still pending, NOT successful. Deletion requests cannot be cancelled.
    request.onblocked = () => onProgress?.(`等待 ${name} 释放连接，请关闭其他豆织标签页；尚未完成`, 35)
  })
}
async function writeDatabase(name: string, data: DatabaseBackup): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, data.version)
    request.onerror = () => reject(request.error)
    request.onblocked = () => { /* The preceding delete must finish before this creation can run. */ }
    request.onupgradeneeded = () => {
      const db = request.result
      for (const [storeName, schema] of Object.entries(data.stores)) {
        const store = db.createObjectStore(storeName, { keyPath: schema.keyPath, autoIncrement: schema.autoIncrement || false })
        for (const index of schema.indexes) store.createIndex(index.name, index.keyPath, { unique: !!index.unique, multiEntry: !!index.multiEntry })
      }
    }
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result) }
  })
  try {
    const names = Object.keys(data.stores)
    if (!names.length) return
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(names, 'readwrite')
      transaction.oncomplete = () => resolve()
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error(`写入 ${name} 的事务失败`))
      try {
        for (const [storeName, entries] of Object.entries(data.stores)) {
          const store = transaction.objectStore(storeName)
          entries.values.forEach((value, index) => {
            if (store.keyPath !== null) store.put(value)
            else store.put(value, entries.keys[index])
          })
        }
      } catch (error) { transaction.abort(); reject(error) }
    })
    // Verify committed counts; never report partial import as success.
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(names, 'readonly')
      transaction.oncomplete = () => resolve()
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('验证导入失败'))
      for (const [storeName, entries] of Object.entries(data.stores)) {
        const request = transaction.objectStore(storeName).count()
        request.onsuccess = () => { if (request.result !== entries.keys.length) { transaction.abort(); reject(new Error(`${name}/${storeName} 导入条数不完整`)) } }
      }
    })
  } finally { db.close() }
}
interface ImportJournal { targets: string[]; databases: Record<string, DatabaseBackup>; localStorage: Record<string, string> }
async function readJournal(): Promise<ImportJournal | null> {
  const db = await openExisting(JOURNAL)
  if (!db) return null
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('snapshot').objectStore('snapshot').get('before-import')
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}
export async function hasPendingImport(): Promise<boolean> { return !!await readJournal() }
async function saveJournal(snapshot: ImportJournal): Promise<void> {
  await writeDatabase(JOURNAL, { version: 1, stores: { snapshot: { keyPath: null, indexes: [], keys: ['before-import'], values: [snapshot] } } })
}
async function restoreSnapshot(snapshot: ImportJournal, onProgress?: ProgressCallback) {
  for (const name of snapshot.targets) await deleteDatabase(name, onProgress)
  for (const [name, database] of Object.entries(snapshot.databases)) await writeDatabase(name, database)
  localStorage.clear()
  for (const [key, value] of Object.entries(snapshot.localStorage)) localStorage.setItem(key, value)
  sessionStorage.clear()
}
export async function restoreInterruptedImport(onProgress?: ProgressCallback): Promise<void> {
  requireMaintenancePage()
  await exclusive(async () => {
    const journal = await readJournal()
    if (!journal) throw new Error('没有可恢复的导入前快照')
    onProgress?.('正在恢复导入前的数据...', 10)
    await restoreSnapshot(journal, onProgress)
    await deleteDatabase(JOURNAL, onProgress)
    onProgress?.('恢复完成，请返回应用', 100)
  })
}
async function exportData(type: 'chat' | 'style', onProgress?: ProgressCallback): Promise<void> {
  await exclusive(async () => {
    if (await hasPendingImport()) throw new Error('有未完成的导入，请先恢复导入前数据，再导出')
    const names = type === 'chat' ? OWNED_DATABASES : STYLE_DATABASES
    const chunks: BlobPart[] = ['{"type":', JSON.stringify(type), ',"version":"3.0","exportTime":', JSON.stringify(new Date().toISOString())]
    if (type === 'chat') chunks.push(',"localStorage":', JSON.stringify(Object.fromEntries(Object.entries(localSnapshot()).filter(([key]) => !isAuthKey(key)))))
    chunks.push(',"indexedDB":{')
    let count = 0
    for (let index = 0; index < names.length; index++) {
      const name = names[index]
      onProgress?.(`导出 ${name}...`, Math.round(index / names.length * 90))
      const database = await readDatabase(name)
      if (!database) continue
      if (count++) chunks.push(',')
      chunks.push(JSON.stringify(name), ':{"version":', String(database.version), ',"stores":{')
      let storeCount = 0
      for (const [storeName, store] of Object.entries(database.stores)) {
        if (storeCount++) chunks.push(',')
        const { keys, values, ...schema } = store
        chunks.push(JSON.stringify(storeName), ':', JSON.stringify(schema).slice(0, -1), ',"keys":', JSON.stringify(await encodeBackupValue(keys)), ',"values":[')
        for (let record = 0; record < values.length; record++) {
          if (record) chunks.push(',')
          const encoded = JSON.stringify(await encodeBackupValue(values[record]))
          if (encoded === undefined) throw new Error(`${name}/${storeName} 含有无法备份的记录`)
          chunks.push(encoded)
        }
        chunks.push(']}')
      }
      chunks.push('}}')
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    chunks.push('}}')
    const url = URL.createObjectURL(new Blob(chunks, { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = type === 'chat' ? 'douzhi_chat_backup.json' : 'douzhi_style_backup.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    onProgress?.('导出完成，请妥善保管含API配置的备份文件', 100)
  })
}
export const exportChatData = (onProgress?: ProgressCallback) => exportData('chat', onProgress)
export const exportStyleData = (onProgress?: ProgressCallback) => exportData('style', onProgress)

export async function importAllData(file: File, onProgress?: ProgressCallback): Promise<void> {
  requireMaintenancePage()
  await exclusive(async () => {
    if (await hasPendingImport()) throw new Error('上一次导入未完成，请先恢复导入前数据')
    onProgress?.('校验备份文件，尚未修改现有数据...', 5)
    let raw: unknown
    try { raw = JSON.parse(await file.text()) } catch { throw new Error('备份文件不是有效JSON，现有数据未修改') }
    const plan = normalizeBackup(raw)
    const targets = [...new Set([...(plan.type === 'chat' ? CORE_CHAT_DATABASES : []), ...Object.keys(plan.databases)])]
    const before: ImportJournal = { targets, databases: {}, localStorage: localSnapshot() }
    for (const name of targets) {
      const database = await readDatabase(name)
      if (database) before.databases[name] = database
    }
    onProgress?.('保存可恢复快照，需要额外存储空间...', 20)
    await saveJournal(before)
    try {
      for (const name of targets) await deleteDatabase(name, onProgress)
      for (const [name, database] of Object.entries(plan.databases)) {
        onProgress?.(`导入并验证 ${name}...`, 55)
        await writeDatabase(name, database)
      }
      if (plan.type === 'chat') {
        const auth = Object.entries(before.localStorage).filter(([key]) => isAuthKey(key))
        localStorage.clear()
        for (const [key, value] of Object.entries(plan.localStorage)) if (!isAuthKey(key)) localStorage.setItem(key, value)
        for (const [key, value] of auth) localStorage.setItem(key, value)
        localStorage.setItem('indexeddb_migration_completed', '1.0')
      }
      sessionStorage.clear()
      await deleteDatabase(JOURNAL, onProgress)
      onProgress?.('导入和验证完成，请返回应用', 100)
    } catch (error) {
      try {
        onProgress?.('导入失败，正在恢复原数据...', 80)
        await restoreSnapshot(before, onProgress)
        await deleteDatabase(JOURNAL, onProgress)
      } catch (rollbackError) {
        throw new Error(`导入失败且恢复未完成，快照已保留，请勿清除站点数据。${String(error)}；${String(rollbackError)}`)
      }
      throw new Error(`导入失败，已恢复导入前数据：${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
export async function clearAllData(onProgress?: ProgressCallback): Promise<void> {
  requireMaintenancePage()
  await exclusive(async () => {
    // Close the actual application by navigating here first, then delete both modern and legacy DBs.
    for (const name of [...OWNED_DATABASES, JOURNAL]) {
      onProgress?.(`清除 ${name}...`, 30)
      await deleteDatabase(name, onProgress)
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }
    if ('caches' in window) for (const name of await caches.keys()) if (!await caches.delete(name)) throw new Error(`清除缓存 ${name} 失败`)
    localStorage.clear()
    sessionStorage.clear()
    if (typeof indexedDB.databases === 'function') {
      const remaining = (await indexedDB.databases()).filter(db => [...OWNED_DATABASES, JOURNAL].includes(db.name || ''))
      if (remaining.length) throw new Error(`尚有数据库未删除：${remaining.map(db => db.name).join('、')}`)
    }
    onProgress?.('全部应用数据已清除，请返回应用', 100)
  })
}
