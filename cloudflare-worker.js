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
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 搜索音乐
 */
async function handleSearch(url) {
  const keyword = url.searchParams.get('keyword')
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少关键词' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const searchUrl = `${NETEASE_API_BASE}/search/get/web?s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=50`
  
  const response = await fetch(searchUrl, {
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
 * 获取音乐播放URL（新接口，返回代理URL）
 */
async function handleMusicUrl(url) {
  const id = url.searchParams.get('id')
  if (!id) {
    return new Response(JSON.stringify({ error: '缺少歌曲ID' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 获取网易云音乐URL
  const musicUrl = `${NETEASE_API_BASE}/song/enhance/player/url?id=${id}&ids=[${id}]&br=320000`
  
  const response = await fetch(musicUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  })

  const data = await response.json()
  
  // 如果获取到URL，返回代理URL
  if (data.data && data.data.length > 0 && data.data[0].url) {
    const originalUrl = data.data[0].url
    
    // 如果是HTTP，通过Worker代理转为HTTPS
    if (originalUrl.startsWith('http://')) {
      const proxyUrl = `${url.origin}/proxy/${encodeURIComponent(originalUrl)}`
      return new Response(JSON.stringify({ url: proxyUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 如果已经是HTTPS，直接返回
    return new Response(JSON.stringify({ url: originalUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: '无法获取播放链接' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
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
