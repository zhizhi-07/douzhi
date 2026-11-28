/** Durable private messages. Keep complete histories separate from paginated UI state. */
import type { Message } from '../types/chat'
import * as IDB from './indexedDBManager'
import { getCurrentAccountId } from './accountManager'
import { mergeMessages, repairDuplicateMessageIds } from './mergeMessages'
import { nextMessageId } from './messageId'

const messageCache = new Map<string, Message[]>()
const loaded = new Set<string>()
const loading = new Map<string, Promise<Message[]>>()
const writes = new Map<string, Promise<void>>()
const retryWrites = new Map<string, Array<(current: Message[]) => Message[]>>()
const revisions = new Map<string, number>()
let cacheGeneration = 0

function getAccountChatKey(chatId: string): string {
  const accountId = getCurrentAccountId()
  return accountId === 'main' ? chatId : `${chatId}_${accountId}`
}

export function getMainAccountChatKey(chatId: string): string { return chatId }

function legacyKeys(key: string): string[] {
  return [`msg_backup_${key}`, `chat_messages_${key}`, `messages_${key}`]
}

function notifyFailure(chatId: string, error: unknown): void {
  console.error('消息未保存，请导出备份后重试:', error)
  window.dispatchEvent(new CustomEvent('message-save-error', { detail: { chatId } }))
}

async function readStorage(key: string): Promise<Message[]> {
  if (loaded.has(key)) return messageCache.get(key) || []
  const pending = loading.get(key)
  if (pending) return pending
  const generation = cacheGeneration
  const promise = (async () => {
    let messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, key, true) || []
    if (!Array.isArray(messages)) throw new Error('聊天记录格式错误，已保留原始数据')
    if (repairDuplicateMessageIds(messages, nextMessageId) !== messages) {
      messages = await IDB.updateItem<Message[]>(IDB.STORES.MESSAGES, key,
        current => repairDuplicateMessageIds(current || [], nextMessageId))
    }
    const backups: Array<[string, string]> = []
    let legacy: Message[] = []
    for (const backupKey of legacyKeys(key)) {
      const raw = localStorage.getItem(backupKey)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        const items = Array.isArray(parsed) ? parsed : parsed.messages
        if (!Array.isArray(items)) continue
        legacy = mergeMessages(legacy, repairDuplicateMessageIds(items, nextMessageId))
        backups.push([backupKey, raw])
      } catch (error) {
        console.warn('旧备份无法读取，已保留:', backupKey, error)
      }
    }
    if (backups.length) {
      messages = await IDB.updateItem<Message[]>(IDB.STORES.MESSAGES, key,
        current => mergeMessages(legacy, current || []))
      // Remove only the exact backup successfully committed, not a newer recovery copy.
      for (const [backupKey, raw] of backups) {
        if (localStorage.getItem(backupKey) === raw) localStorage.removeItem(backupKey)
      }
    }
    if (generation === cacheGeneration) {
      messageCache.set(key, mergeMessages(messages, messageCache.get(key) || []))
      loaded.add(key)
      return messageCache.get(key)!
    }
    return messages
  })()
  loading.set(key, promise)
  try { return await promise } finally { if (loading.get(key) === promise) loading.delete(key) }
}

// Each operation retains its key, payload and overwrite semantics until committed.
function enqueue(chatId: string, key: string, update: (current: Message[]) => Message[]): Promise<void> {
  const revision = (revisions.get(key) || 0) + 1
  revisions.set(key, revision)
  const promise = (writes.get(key) || Promise.resolve()).catch(() => {}).then(async () => {
    const operations = retryWrites.get(key) || []
    operations.push(update)
    retryWrites.set(key, operations)
    await readStorage(key)
    let saved: Message[] = []
    while (operations.length) {
      saved = await IDB.updateItem<Message[]>(IDB.STORES.MESSAGES, key, current => operations[0](current || []))
      operations.shift()
    }
    retryWrites.delete(key)
    if (revisions.get(key) === revision) {
      messageCache.set(key, saved)
      for (const backupKey of legacyKeys(key)) localStorage.removeItem(backupKey)
    }
    window.dispatchEvent(new CustomEvent('chat-message-saved', { detail: { chatId } }))
  })
  writes.set(key, promise)
  // Keep the rejection observable to awaiters without creating unhandled rejections for legacy void callers.
  void promise.catch(error => {
    try {
      localStorage.setItem(`msg_backup_${key}`, JSON.stringify({ messages: messageCache.get(key) || [], timestamp: Date.now() }))
    } catch { /* The error notification remains visible even when both stores are full. */ }
    notifyFailure(chatId, error)
  }).finally(() => { if (writes.get(key) === promise) writes.delete(key) })
  return promise
}

export function clearMessageCache(): void {
  cacheGeneration++
  messageCache.clear()
  loaded.clear()
  loading.clear()
}

export function loadMessages(chatId: string): Message[] {
  const key = getAccountChatKey(chatId)
  if (!loaded.has(key)) void readStorage(key).catch(error => notifyFailure(chatId, error))
  return messageCache.get(key) || []
}

export function loadMainAccountMessages(chatId: string): Message[] {
  if (!loaded.has(chatId)) void readStorage(chatId).catch(error => notifyFailure(chatId, error))
  return messageCache.get(chatId) || []
}

export async function ensureMessagesLoaded(chatId: string): Promise<Message[]> {
  const key = getAccountChatKey(chatId)
  await writes.get(key)
  return readStorage(key)
}

export async function loadMessagesPaginated(chatId: string, limit = 50, offset = 0) {
  const messages = await ensureMessagesLoaded(chatId)
  const total = messages.length
  const end = Math.max(0, total - Math.max(0, offset))
  const start = Math.max(0, end - Math.max(0, limit))
  return { messages: messages.slice(start, end), total, hasMore: start > 0 }
}

export async function getMessageCount(chatId: string): Promise<number> {
  return (await ensureMessagesLoaded(chatId)).length
}

function cleanMessage(message: Message): Message {
  // Clean only changed messages; ordinary reads and appends never stringify the whole history.
  const seen = new WeakSet<object>()
  return JSON.parse(JSON.stringify(message, (_key, value) => {
    if (typeof value === 'function') return undefined
    if (value && typeof value === 'object') {
      if (value instanceof Event || (typeof Node !== 'undefined' && value instanceof Node)) return undefined
      if (seen.has(value)) return undefined
      seen.add(value)
    }
    return value
  }))
}

export function saveMessages(chatId: string, messages: Message[], forceOverwrite = false): Promise<void> {
  const key = getAccountChatKey(chatId)
  const incoming = messages.filter(m => m?.id != null).map(cleanMessage)
  messageCache.set(key, forceOverwrite ? incoming : mergeMessages(messageCache.get(key) || [], incoming))
  return enqueue(chatId, key, current => forceOverwrite ? incoming : mergeMessages(current, incoming))
}

export function addMessage(chatId: string, message: Message): Promise<void> {
  return addMessages(chatId, [message])
}

export function addMessages(chatId: string, messages: Message[]): Promise<void> {
  const previousIds = new Set((messageCache.get(getAccountChatKey(chatId)) || []).map(m => m.id))
  const promise = saveMessages(chatId, messages)
  for (const message of messages) {
    if (!previousIds.has(message.id)) window.dispatchEvent(new CustomEvent('new-message', { detail: { chatId, message } }))
  }
  return promise
}

export function deleteMessage(chatId: string, messageId: number): Promise<void> {
  const key = getAccountChatKey(chatId)
  messageCache.set(key, (messageCache.get(key) || []).filter(m => m.id !== messageId))
  return enqueue(chatId, key, current => current.filter(m => m.id !== messageId))
}

export function updateMessage(chatId: string, message: Message): Promise<void> {
  return saveMessages(chatId, [message])
}

export function clearMessages(chatId: string): Promise<void> {
  return saveMessages(chatId, [], true)
}

export async function forceRecoverFromIndexedDB(): Promise<void> {
  const keys = await IDB.getAllKeys(IDB.STORES.MESSAGES)
  // Do not load group histories into the private-chat cache or rewrite them as localStorage backups.
  await Promise.all(keys.filter(key => !key.startsWith('group_')).map(key => readStorage(key)))
}

// Kept for older callers; writes already persist continuously, not only on page unload.
export function forceBackupAllMessages(): void {}

export function createTextMessage(content: string, type: 'sent' | 'received'): Message {
  const now = Date.now()
  return { id: nextMessageId(), type, content, timestamp: now,
    time: new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), messageType: 'text' }
}

export async function flushCharacterMessages(characterId: string): Promise<void> {
  await Promise.all([...writes].filter(([key]) => key === characterId || key.startsWith(`${characterId}_`)).map(([, pending]) => pending))
}
export function forgetCharacterMessages(characterId: string): void {
  cacheGeneration++
  for (const key of messageCache.keys()) if (key === characterId || key.startsWith(`${characterId}_`)) {
    messageCache.delete(key); loaded.delete(key); loading.delete(key); retryWrites.delete(key)
  }
}
