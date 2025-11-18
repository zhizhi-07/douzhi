/**
 * 音乐API服务
 * 支持网易云音乐搜索和在线播放
 * 自动切换到备用API（QQ音乐、酷狗音乐）
 */

import { searchOnlineMusicFallback, getSongUrlFallback } from './musicApiFallback'

export interface OnlineSong {
  id: number
  name: string
  artists: string
  album: string
  duration: number
  cover: string
  url?: string
  fee?: number // 0: 免费, 1: VIP, 4: 购买, 8: 非会员可免费播放低音质
}

interface NetEaseSong {
  id: number
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    picUrl: string
  }
  duration: number
  fee: number
}

/**
 * 搜索歌曲（网易云音乐）
 * 开发环境使用Vite代理，生产环境使用Cloudflare Worker
 * 失败时自动切换到备用API（QQ音乐）
 */
export async function searchOnlineMusic(keyword: string, limit: number = 50): Promise<OnlineSong[]> {
  try {
    console.log('🔍 尝试使用网易云API搜索:', keyword)
    
    // 根据环境选择API URL
    const isDev = import.meta.env.DEV
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/search/get/web`
      params = new URLSearchParams({
        s: keyword,
        type: '1',
        offset: '0',
        limit: limit.toString()
      })
    } else {
      // 生产环境：使用Cloudflare Worker
      console.log('🌐 使用Cloudflare Worker')
      apiUrl = `https://zhizhi-api.2373922440jhj.workers.dev/api/music/search`
      params = new URLSearchParams({
        keyword: keyword
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      console.error('❌ Worker请求失败:', response.status, response.statusText)
      throw new Error('网易云API请求失败')
    }

    const data = await response.json()
    console.log('📦 Worker返回数据:', data)
    
    // Worker返回错误但状态码200的情况（所有API都失败）
    if (data.error && (!data.result || !data.result.songs || data.result.songs.length === 0)) {
      console.log('⚠️ Worker所有API都失败:', data.error)
      throw new Error(data.error)
    }
    
    if (data.result && data.result.songs && data.result.songs.length > 0) {
      console.log(`✅ 网易云搜索成功，找到 ${data.result.songs.length} 首（来源: ${data.source || '未知'}）`)
      return data.result.songs.map((song: NetEaseSong) => ({
        id: song.id,
        name: song.name,
        artists: song.artists.map((a: any) => a.name).join(' / '),
        album: song.album.name,
        duration: Math.floor(song.duration / 1000),
        cover: song.album.picUrl,
        fee: song.fee
      }))
    }

    throw new Error('网易云API返回空结果')
  } catch (error) {
    console.log('⚠️ 网易云API失败，切换到QQ音乐:', error)
    
    // 自动切换到QQ音乐
    try {
      const fallbackResults = await searchOnlineMusicFallback(keyword, limit)
      if (fallbackResults.length > 0) {
        return fallbackResults
      }
    } catch (fallbackError) {
      console.error('❌ QQ音乐也失败了:', fallbackError)
    }
    
    return []
  }
}

/**
 * 获取歌曲播放URL
 * 注意：网易云音乐的部分歌曲可能有版权限制
 * 生产环境会通过Cloudflare Worker代理，确保HTTPS
 */
export async function getSongUrl(id: number): Promise<string | null> {
  try {
    const isDev = import.meta.env.DEV
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/song/enhance/player/url`
      params = new URLSearchParams({
        id: id.toString(),
        ids: `[${id}]`,
        br: '320000'
      })
    } else {
      // 生产环境：使用Cloudflare Worker
      apiUrl = `https://zhizhi-api.2373922440jhj.workers.dev/api/music/url`
      params = new URLSearchParams({
        id: id.toString()
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      console.error('❌ 获取音乐URL失败:', response.status)
      return null
    }

    const data = await response.json()
    console.log('🎵 获取到音乐URL:', data)
    
    if (isDev) {
      // 开发环境：直接返回网易云URL
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return data.data[0].url
      }
    } else {
      // 生产环境：返回Worker代理的HTTPS URL
      if (data.url) {
        console.log('✅ 使用Worker代理URL:', data.url)
        return data.url
      }
    }

    return null
  } catch (error) {
    console.error('获取播放链接失败，尝试使用备用方案:', error)
    // 网易云失败，尝试QQ音乐
    return getSongUrlFallback(id)
  }
}

/**
 * 获取歌词
 */
export async function getLyric(id: number): Promise<string | null> {
  try {
    const isDev = import.meta.env.DEV
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/song/lyric`
      params = new URLSearchParams({
        id: id.toString(),
        lv: '-1',
        tv: '-1'
      })
    } else {
      // 生产环境：使用Cloudflare Worker
      apiUrl = `https://zhizhi-api.2373922440jhj.workers.dev/song/lyric`
      params = new URLSearchParams({
        id: id.toString(),
        lv: '-1',
        tv: '-1'
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.lrc && data.lrc.lyric) {
      return data.lrc.lyric
    }

    return null
  } catch (error) {
    console.error('获取歌词失败:', error)
    return null
  }
}
