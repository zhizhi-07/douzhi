// 使用 IndexedDB 存储音乐文件，避免 localStorage 容量限制

const DB_NAME = 'MusicStorageDB'
const DB_VERSION = 1
const STORE_NAME = 'songs'

interface StoredSong {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string // base64 或默认占位符
  audioBlob: Blob // 音频文件存储为Blob
  lyrics?: string
}

export interface Song {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  audioUrl?: string
  lyrics?: string
}

let dbInstance: IDBDatabase | null = null

// 打开数据库
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

// 保存歌曲
export const saveSong = async (song: Omit<StoredSong, 'id'> & { id?: number }): Promise<number> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const songWithId = {
      ...song,
      id: song.id || Date.now()
    }
    
    const request = store.put(songWithId)
    transaction.oncomplete = () => resolve(songWithId.id)
    transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('歌曲保存事务失败'))
    request.onerror = () => reject(request.error)
  })
}

// 获取所有歌曲
export const getAllSongs = async (): Promise<Song[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const storedSongs: StoredSong[] = request.result
      // 将 Blob 转换为 Object URL
      const songs: Song[] = storedSongs.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        cover: s.cover,
        audioUrl: URL.createObjectURL(s.audioBlob),
        lyrics: s.lyrics
      }))
      resolve(songs)
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取单首歌曲
export const getSong = async (id: number): Promise<Song | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      const s: StoredSong | undefined = request.result
      if (!s) {
        resolve(null)
        return
      }
      resolve({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        cover: s.cover,
        audioUrl: URL.createObjectURL(s.audioBlob),
        lyrics: s.lyrics
      })
    }
    request.onerror = () => reject(request.error)
  })
}

// 删除歌曲
export const deleteSong = async (id: number): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error || new Error('音乐删除事务中止'))
    request.onerror = () => reject(request.error)
  })
}

// 迁移 localStorage 中的旧数据到 IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  const raw = localStorage.getItem('customSongs')
  if (!raw) return
  const songs = JSON.parse(raw)
  if (!Array.isArray(songs)) throw new Error('旧音乐列表格式错误，原数据已保留')
  const remaining = []
  const links = JSON.parse(localStorage.getItem('customSongs_url') || '[]')
  for (const song of songs) {
    try {
      if (/^https?:/.test(song.audioUrl || '')) {
        if (!links.some((s: Song) => s.id === song.id)) links.push(song)
      } else if (/^(data:|blob:)/.test(song.audioUrl || '')) {
        const response = await fetch(song.audioUrl)
        if (!response.ok) throw new Error('原音频不可用，请重新选择文件')
        await saveSong({ ...song, audioBlob: await response.blob() })
      } else remaining.push(song)
    } catch (error) {
      remaining.push(song)
      console.warn('旧歌曲未迁移，原条目已保留:', error)
    }
  }
  localStorage.setItem('customSongs_url', JSON.stringify(links))
  if (remaining.length) localStorage.setItem('customSongs', JSON.stringify(remaining))
  else if (localStorage.getItem('customSongs') === raw) localStorage.removeItem('customSongs')
}
