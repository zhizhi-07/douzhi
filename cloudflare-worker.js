/**
 * Cloudflare Worker - 音乐API代理
 * 用于代理网易云音乐API，解决CORS和Mixed Content问题
 * 
 * 部署说明：
 * 1. 登录 Cloudflare Dashboard
 * 2. 进入 Workers & Pages
 * 3. 创建新的 Worker
 * 4. 复制此代码并部署
 * 5. 设置自定义域名（可选）
 */

// 网易云音乐API基础URL
const NETEASE_API_BASE = 'https://music.163.com/api'
const NETEASE_WEAPI_BASE = 'https://music.163.com/weapi'

// CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 路由处理
    if (url.pathname === '/api/music/search') {
      return await handleSearch(url)
    } else if (url.pathname === '/api/music/url') {
      return await handleMusicUrl(url)
    } else if (url.pathname === '/song/lyric') {
      return await handleLyric(url)
    } else if (url.pathname === '/song/enhance/player/url') {
      return await handleEnhanceUrl(url)
    } else if (url.pathname.startsWith('/proxy/')) {
      // 音乐文件代理
      return await proxyMusic(url)
    } else if (url.pathname === '/health' || url.pathname === '/') {
      // 健康检查端点
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Music API Proxy is running',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Not Found',
      availableEndpoints: [
        '/api/music/search?keyword=xxx',
        '/api/music/url?id=xxx',
        '/song/lyric?id=xxx',
        '/health'
      ]
    }), { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Worker Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 搜索音乐 - 使用多个备用API源
 */
async function handleSearch(url) {
  const keyword = url.searchParams.get('keyword')
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少关键词' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // API源列表（按优先级排序）
  const apiSources = [
    {
      name: 'injahow',
      url: `https://api.injahow.cn/meting/?type=search&id=${encodeURIComponent(keyword)}&source=netease`,
      transform: (data) => {
        if (Array.isArray(data)) {
          return data.map(song => ({
            id: song.id,
            name: song.name || song.title,
            artists: [{ name: song.artist || song.artists || '未知歌手' }],
            album: {
              name: song.album || '未知专辑',
              picUrl: song.pic || song.cover || ''
            },
            duration: (song.time || 0) * 1000,
            fee: 0
          }))
        }
        return null
      }
    },
    {
      name: 'vkeys',
      url: `https://api.vkeys.cn/v2/music/netease?word=${encodeURIComponent(keyword)}`,
      transform: (data) => {
        if (data.code === 200 && data.data && Array.isArray(data.data)) {
          return data.data.map(song => ({
            id: song.id,
            name: song.song || song.name,
            artists: [{ name: song.singer || song.artists || '未知歌手' }],
            album: {
              name: song.album || '未知专辑',
              picUrl: song.cover || ''
            },
            duration: 0,
            fee: 0
          }))
        }
        return null
      }
    },
    {
      name: 'uomg',
      url: `https://api.uomg.com/api/rand.music?sort=热歌榜&format=json`,
      transform: (data) => {
        // UOMG返回单首歌曲，需要特殊处理
        if (data.code === 1 && data.data) {
          const song = data.data
          // 检查关键词匹配
          if (song.name.includes(keyword) || song.artistsname.includes(keyword)) {
            return [{
              id: Date.now(),
              name: song.name,
              artists: [{ name: song.artistsname }],
              album: {
                name: '未知专辑',
                picUrl: song.picurl || ''
              },
              duration: 0,
              fee: 0
            }]
          }
        }
        return null
      }
    }
  ]

  // 尝试每个API源
  for (const source of apiSources) {
    try {
      console.log(`🔍 尝试使用 ${source.name} API`)
      
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        // 添加超时控制
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        console.log(`❌ ${source.name} API 响应失败:`, response.status)
        continue
      }

      const data = await response.json()
      const songs = source.transform(data)
      
      if (songs && songs.length > 0) {
        console.log(`✅ ${source.name} API 成功，找到 ${songs.length} 首歌`)
        return new Response(JSON.stringify({
          result: { songs },
          source: source.name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      console.log(`⚠️ ${source.name} API 返回空结果`)
    } catch (error) {
      console.log(`❌ ${source.name} API 失败:`, error.message)
      continue
    }
  }
  
  // 所有API都失败
  return new Response(JSON.stringify({
    error: '所有音乐API都无法访问',
    result: { songs: [] }
  }), {
    status: 200, // 返回200避免触发前端错误
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * 获取音乐播放URL - 使用 api.injahow.cn
 */
async function handleMusicUrl(url) {
  const id = url.searchParams.get('id')
  if (!id) {
    return new Response(JSON.stringify({ error: '缺少歌曲ID' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // 直接用网易云 ID 获取播放链接
    // 这个接口返回的是 302 重定向到真实音频 URL，我们直接用这个 URL
    const apiUrl = `https://api.injahow.cn/meting/?type=url&id=${id}&source=netease`
    
    // 直接返回这个 URL（它会自动重定向到真实的音频文件）
    return new Response(JSON.stringify({ url: apiUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '无法获取播放链接',
      message: error.message,
      apiUrl: `https://api.injahow.cn/meting/?type=url&id=${id}&source=netease`
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 获取增强播放URL（旧接口，保持兼容）
 */
async function handleEnhanceUrl(url) {
  const id = url.searchParams.get('id')
  const ids = url.searchParams.get('ids') || `[${id}]`
  const br = url.searchParams.get('br') || '320000'

  const musicUrl = `${NETEASE_API_BASE}/song/enhance/player/url?id=${id}&ids=${ids}&br=${br}`
  
  const response = await fetch(musicUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  })

  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * 获取歌词
 */
async function handleLyric(url) {
  const id = url.searchParams.get('id')
  const lv = url.searchParams.get('lv') || '-1'
  const tv = url.searchParams.get('tv') || '-1'

  const lyricUrl = `${NETEASE_API_BASE}/song/lyric?id=${id}&lv=${lv}&tv=${tv}`
  
  const response = await fetch(lyricUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  })

  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * 代理音乐文件（HTTP转HTTPS）
 */
async function proxyMusic(url) {
  const encodedUrl = url.pathname.replace('/proxy/', '')
  const musicUrl = decodeURIComponent(encodedUrl)
  
  console.log('🎵 代理音乐URL:', musicUrl)

  const response = await fetch(musicUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  })

  // 复制响应头
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}
