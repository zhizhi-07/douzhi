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
    request.onsuccess = () => resolve(songWithId.id)
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
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 迁移 localStorage 中的旧数据到 IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  const oldData = localStorage.getItem('customSongs')
  if (!oldData) return

  try {
    const oldSongs = JSON.parse(oldData)
    if (!Array.isArray(oldSongs) || oldSongs.length === 0) return

    for (const song of oldSongs) {
      if (song.audioUrl && song.audioUrl.startsWith('data:')) {
        // 将 base64 转换为 Blob
        const response = await fetch(song.audioUrl)
        const blob = await response.blob()
        
        await saveSong({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          duration: song.duration,
          cover: song.cover,
          audioBlob: blob,
          lyrics: song.lyrics
        })
      }
    }
    
    // 迁移成功后删除 localStorage 数据
    localStorage.removeItem('customSongs')
    console.log('音乐数据已迁移到 IndexedDB')
  } catch (error) {
    console.error('迁移失败:', error)
  }
}
