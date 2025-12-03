import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCharacterById } from '../utils/characterManager'
import {
  ChevronLeft, Edit2, Check,
  Sun, Cloud, CloudRain, CloudLightning, CloudSnow, Wind, CloudFog, CloudDrizzle,
  Thermometer, RefreshCw, Loader2
} from 'lucide-react'
import { callZhizhiApi } from '../services/zhizhiapi'
import { lorebookManager } from '../utils/lorebookSystem'

// --- Types & Constants ---

const WEATHER_TYPES = [
  { id: 'sunny', label: '晴', icon: Sun, bg: 'from-blue-400 to-blue-200', text: 'text-yellow-100' },
  { id: 'cloudy', label: '多云', icon: Cloud, bg: 'from-blue-300 to-gray-200', text: 'text-white' },
  { id: 'overcast', label: '阴', icon: Cloud, bg: 'from-gray-400 to-gray-300', text: 'text-gray-100' },
  { id: 'rain', label: '小雨', icon: CloudDrizzle, bg: 'from-slate-700 to-slate-500', text: 'text-blue-100' },
  { id: 'heavy_rain', label: '大雨', icon: CloudRain, bg: 'from-slate-800 to-slate-600', text: 'text-blue-200' },
  { id: 'thunder', label: '雷阵雨', icon: CloudLightning, bg: 'from-indigo-900 to-purple-800', text: 'text-purple-100' },
  { id: 'snow', label: '雪', icon: CloudSnow, bg: 'from-blue-100 to-white', text: 'text-blue-800' },
  { id: 'fog', label: '雾', icon: CloudFog, bg: 'from-gray-300 to-gray-100', text: 'text-gray-600' },
  { id: 'wind', label: '大风', icon: Wind, bg: 'from-teal-600 to-teal-400', text: 'text-teal-100' },
]

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface DayWeather {
  date: string
  weekday: string
  weather: string
  tempHigh: number
  tempLow: number
}

interface WeatherData {
  location: string
  week: DayWeather[]
}

// --- Helper Components ---

// ☁️ SVG Cloud Component for effects
const CloudShape = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.14,0.006-0.279,0.017-0.418C11.606,13.049,11.309,13,11,13c-2.761,0-5,2.239-5,5c0,0.14,0.006,0.279,0.017,0.418C6.006,18.463,6,18.5,6,18.5c0,0,0,0.5,0,0.5h11.5c3.037,0,5.5-2.463,5.5-5.5S20.537,8,17.5,8c-0.14,0-0.279,0.006-0.418,0.017C16.963,4.994,14.463,3,11.5,3C7.91,3,5,5.91,5,9.5c0,0.14,0.006,0.279,0.017,0.418C4.963,9.906,4.91,9.9,4.857,9.9C2.174,9.9,0,12.074,0,14.757c0,2.683,2.174,4.857,4.857,4.857h0.643" />
  </svg>
)

// 🔥 预生成随机数据，避免每次渲染重新计算导致内存问题
const generateRainDrops = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 120 - 10,
    top: Math.random() * 20,
    duration: 0.4 + Math.random() * 0.3,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.3
  }))

const generateSnowFlakes = (count: number, layer: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `snow-${layer}-${i}`,
    size: layer === 1 ? Math.random() * 2 + 1 : layer === 2 ? Math.random() * 3 + 2 : Math.random() * 4 + 4,
    left: Math.random() * 100,
    top: Math.random() * 20,
    opacity: layer === 1 ? Math.random() * 0.5 + 0.1 : layer === 2 ? Math.random() * 0.8 + 0.2 : Math.random() * 0.9 + 0.4,
    duration: layer === 1 ? 8 + Math.random() * 5 : layer === 2 ? 5 + Math.random() * 3 : 3 + Math.random() * 2,
    delay: Math.random() * 5
  }))

const generateWindLines = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    width: 150 + Math.random() * 300,
    top: Math.random() * 100,
    duration: 0.8 + Math.random() * 1.2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.2
  }))

const generateWindDebris = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `leaf-${i}`,
    top: Math.random() * 100,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 3
  }))

// 🔥 静态数据，只生成一次
const RAIN_DROPS_LIGHT = generateRainDrops(30)
const RAIN_DROPS_HEAVY = generateRainDrops(60)
const SNOW_LAYER_1 = generateSnowFlakes(30, 1)
const SNOW_LAYER_2 = generateSnowFlakes(20, 2)
const SNOW_LAYER_3 = generateSnowFlakes(10, 3)
const WIND_LINES = generateWindLines(12)
const WIND_DEBRIS = generateWindDebris(8)

// 🌧️ Weather Effects Layer
const WeatherEffects = ({ type }: { type: string }) => {
  const rainDrops = (type === 'heavy_rain' || type === 'thunder') ? RAIN_DROPS_HEAVY : RAIN_DROPS_LIGHT
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sunny Effect */}
      {type === 'sunny' && (
        <>
          <div className="absolute top-[-20%] right-[-20%] w-[80vh] h-[80vh] bg-yellow-200/20 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute top-[10%] right-[10%] text-yellow-100/80 animate-spin-slow">
            <Sun size={120} strokeWidth={1} />
          </div>
          <div className="absolute top-[10%] right-[10%] w-[120px] h-[120px] bg-yellow-100/10 rounded-full blur-xl animate-pulse" />
        </>
      )}

      {/* Rain Effect */}
      {(type === 'rain' || type === 'heavy_rain' || type === 'thunder') && (
        <div className="rain-container absolute inset-0 transform -skew-x-12">
          {rainDrops.map(drop => (
            <div
              key={drop.id}
              className="absolute bg-white/60 w-[1px] h-[40px] animate-rain"
              style={{
                left: `${drop.left}%`,
                top: `-${drop.top}%`,
                animationDuration: `${drop.duration}s`,
                animationDelay: `${drop.delay}s`,
                opacity: drop.opacity
              }}
            />
          ))}
        </div>
      )}

      {/* Thunder Flash */}
      {type === 'thunder' && (
        <div className="absolute inset-0 bg-white/30 animate-lightning z-0" />
      )}

      {/* Snow Effect */}
      {type === 'snow' && (
        <div className="snow-container absolute inset-0">
          {SNOW_LAYER_1.map(flake => (
            <div
              key={flake.id}
              className="absolute bg-white rounded-full animate-snow blur-[1px]"
              style={{
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                left: `${flake.left}%`,
                top: `-${flake.top}%`,
                opacity: flake.opacity,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`
              }}
            />
          ))}
          {SNOW_LAYER_2.map(flake => (
            <div
              key={flake.id}
              className="absolute bg-white rounded-full animate-snow-sway"
              style={{
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                left: `${flake.left}%`,
                top: `-${flake.top}%`,
                opacity: flake.opacity,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`
              }}
            />
          ))}
          {SNOW_LAYER_3.map(flake => (
            <div
              key={flake.id}
              className="absolute bg-white/90 rounded-full animate-snow-fast blur-[0.5px]"
              style={{
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                left: `${flake.left}%`,
                top: `-${flake.top}%`,
                opacity: flake.opacity,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Cloud/Fog Moving Effect */}
      {(type === 'cloudy' || type === 'overcast' || type === 'fog') && (
        <div className="absolute inset-0">
          <CloudShape className="absolute top-[10%] left-[-10%] w-64 h-64 text-white/20 animate-float-slow" />
          <CloudShape className="absolute top-[30%] right-[-20%] w-96 h-96 text-white/10 animate-float-slower" />
          {type === 'overcast' && (
            <CloudShape className="absolute top-[5%] right-[20%] w-48 h-48 text-gray-800/10 animate-float-medium" />
          )}
          {type === 'fog' && (
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/10 to-transparent animate-pulse-slow" />
          )}
        </div>
      )}

      {/* Wind Effect */}
      {type === 'wind' && (
        <div className="absolute inset-0">
          {WIND_LINES.map(line => (
            <div
              key={line.id}
              className="absolute h-[1px] bg-white/40 rounded-full animate-wind"
              style={{
                width: `${line.width}px`,
                top: `${line.top}%`,
                left: '-400px',
                animationDuration: `${line.duration}s`,
                animationDelay: `${line.delay}s`,
                opacity: line.opacity
              }}
            />
          ))}
          {WIND_DEBRIS.map(debris => (
            <div
              key={debris.id}
              className="absolute w-1.5 h-1.5 bg-white/60 rounded-sm animate-wind-debris"
              style={{
                top: `${debris.top}%`,
                left: '-50px',
                animationDuration: `${debris.duration}s`,
                animationDelay: `${debris.delay}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

const Weather = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State
  const [activeTab, setActiveTab] = useState<'user' | 'ai'>('user')
  const [editMode, setEditMode] = useState(false)
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [character, setCharacter] = useState<any>(null)

  // Temp editing state
  const [tempHighInput, setTempHighInput] = useState<number>(0)
  const [tempLowInput, setTempLowInput] = useState<number>(0)

  // Data
  const [userWeather, setUserWeather] = useState<WeatherData>(() => {
    const saved = localStorage.getItem('user_weather')
    return saved ? JSON.parse(saved) : generateDefaultWeather('我的位置')
  })

  const [aiWeather, setAIWeather] = useState<WeatherData>(() => {
    const saved = localStorage.getItem(`ai_weather_${id}`)
    return saved ? JSON.parse(saved) : generateDefaultWeather('TA的位置')
  })

  // Load Character
  useEffect(() => {
    const loadCharacter = async () => {
      if (id) {
        const char = await getCharacterById(id)
        if (char) {
          setCharacter(char)
          // 只有当 location 是默认值"TA的位置"时才更新为角色名字
          // 如果已经有推断出的城市名，保留它
          setAIWeather(prev => ({
            ...prev,
            location: prev.location === 'TA的位置' 
              ? (char.nickname || char.realName || 'TA的位置')
              : prev.location
          }))
        }
      }
    }
    loadCharacter()
  }, [id])

  // Persistence
  useEffect(() => {
    localStorage.setItem('user_weather', JSON.stringify(userWeather))
  }, [userWeather])

  useEffect(() => {
    if (id) {
      localStorage.setItem(`ai_weather_${id}`, JSON.stringify(aiWeather))
    }
  }, [id, aiWeather])

  // Initialize temp inputs when editing starts
  useEffect(() => {
    if (editingDayIndex !== null) {
      const currentData = activeTab === 'user' ? userWeather : aiWeather
      const day = currentData.week[editingDayIndex]
      setTempHighInput(day.tempHigh)
      setTempLowInput(day.tempLow)
    }
  }, [editingDayIndex, activeTab, userWeather, aiWeather])

  // Helpers
  function generateDefaultWeather(location: string): WeatherData {
    const today = new Date()
    const week: DayWeather[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      week.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        weekday: i === 0 ? '今天' : WEEKDAYS[date.getDay()],
        weather: 'sunny',
        tempHigh: 20 + Math.floor(Math.random() * 10),
        tempLow: 10 + Math.floor(Math.random() * 8),
      })
    }
    return { location, week }
  }

  const updateWeather = (dayIndex: number, updates: Partial<DayWeather>) => {
    const updater = activeTab === 'user' ? setUserWeather : setAIWeather
    updater(prev => ({
      ...prev,
      week: prev.week.map((day, i) =>
        i === dayIndex ? { ...day, ...updates } : day
      )
    }))
  }

  const handleSaveEdit = () => {
    if (editingDayIndex !== null) {
      updateWeather(editingDayIndex, {
        tempHigh: tempHighInput,
        tempLow: tempLowInput
      })
      setEditingDayIndex(null)
    }
  }

  // 🌤️ AI推断天气
  const generateWeatherFromAI = async () => {
    if (!id || !character || isGenerating) return

    setIsGenerating(true)
    console.log('🌤️ 开始AI推断天气...')
    console.log('📌 角色信息:', {
      id,
      nickname: character.nickname,
      realName: character.realName,
      personality: character.personality
    })

    try {
      // 获取角色关联的世界书（不含全局）
      const lorebooks = lorebookManager.getCharacterLorebooks(id)
      const characterLorebooks = lorebooks.filter(lb => !lb.is_global)

      // 收集世界书内容
      let worldbookContext = ''
      for (const lb of characterLorebooks) {
        const enabledEntries = lb.entries.filter(e => e.enabled)
        for (const entry of enabledEntries) {
          worldbookContext += `【${entry.name}】\n${entry.content}\n\n`
        }
      }

      console.log('📖 世界书统计:', {
        allLorebookCount: lorebooks.length,
        characterLorebookCount: characterLorebooks.length,
        worldbookTextLength: worldbookContext.length
      })

      // 获取今天日期
      const today = new Date()
      const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      console.log('📅 今天日期字符串:', dateStr)

      // 构建prompt
      const prompt = `你是一个天气推断专家。根据角色的人设和世界观，推断这个角色所在位置的天气。

角色名：${character.nickname || character.realName}
角色人设：${character.personality || '无'}

关联世界书内容：
${worldbookContext || '无'}

今天是${dateStr}（真实世界时间）。

请根据以上信息：
1. 推断角色最可能所在的地点/城市
2. 推断该地点未来7天的天气（从今天开始）

天气类型只能是以下之一：sunny(晴), cloudy(多云), overcast(阴), rain(小雨), heavy_rain(大雨), thunder(雷阵雨), snow(雪), fog(雾), wind(大风)

请严格按以下JSON格式输出，不要有任何其他内容：
{
  "location": "推断的地点名称",
  "week": [
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 }
  ]
}`

      console.log('🧾 最终发送给 zhizhiapi 的 prompt:', prompt)

      const result = await callZhizhiApi([{ role: 'user', content: prompt }], { temperature: 0.7 })
      console.log('🌤️ AI原始返回内容:', result)

      // 解析JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonText = jsonMatch[0]
        console.log('🧩 提取到的 JSON 文本:', jsonText)
        const parsed = JSON.parse(jsonText)
        console.log('✅ 解析后的 JSON 对象:', parsed)

        // 更新天气数据
        const newWeek = parsed.week.map((day: any, index: number) => {
          const date = new Date(today)
          date.setDate(today.getDate() + index)
          return {
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            weekday: index === 0 ? '今天' : WEEKDAYS[date.getDay()],
            weather: day.weather,
            tempHigh: day.tempHigh,
            tempLow: day.tempLow
          }
        })

        // 如果AI推断出了城市名就用城市名，否则保持角色名字
        const newLocation = (parsed.location && parsed.location !== '未知')
          ? parsed.location
          : (character.nickname || character.realName || 'TA的位置')
        
        setAIWeather({
          location: newLocation,
          week: newWeek
        })

        console.log('✅ AI天气推断完成，位置:', newLocation)
      }
    } catch (error) {
      console.error('❌ AI天气推断失败:', error)
      alert('天气推断失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  // 🌤️ 用户天气推断（根据用户人设）
  const generateUserWeatherFromAI = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    console.log('🌤️ 开始推断用户天气...')

    try {
      // 获取用户信息
      const userInfoStr = localStorage.getItem('user_info')
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {}
      
      console.log('📌 用户信息:', {
        nickname: userInfo.nickname,
        realName: userInfo.realName,
        signature: userInfo.signature
      })

      // 如果用户没有设置人设，提示设置
      if (!userInfo.signature && !userInfo.nickname) {
        alert('请先在"我的"页面设置你的人设信息')
        setIsGenerating(false)
        return
      }

      // 获取今天日期
      const today = new Date()
      const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      console.log('📅 今天日期字符串:', dateStr)

      // 构建prompt
      const prompt = `你是一个天气推断专家。根据用户的人设信息，推断这个用户所在位置的天气。

用户昵称：${userInfo.nickname || '未设置'}
用户真名：${userInfo.realName || '未设置'}
用户签名/人设：${userInfo.signature || '未设置'}

今天是${dateStr}（真实世界时间）。

请根据以上信息：
1. 推断用户所在的地点/城市（如果人设中有明确的位置/城市信息就填写，如果没有明确位置信息，location字段填"未知"，不要瞎猜）
2. 推断未来7天的天气（从今天开始，根据当前季节合理推断）

天气类型只能是以下之一：sunny(晴), cloudy(多云), overcast(阴), rain(小雨), heavy_rain(大雨), thunder(雷阵雨), snow(雪), fog(雾), wind(大风)

请严格按以下JSON格式输出，不要有任何其他内容：
{
  "location": "推断的地点名称",
  "week": [
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 },
    { "weather": "天气类型id", "tempHigh": 最高温数字, "tempLow": 最低温数字 }
  ]
}`

      console.log('🧾 最终发送给 zhizhiapi 的 prompt:', prompt)

      const result = await callZhizhiApi([{ role: 'user', content: prompt }], { temperature: 0.7 })
      console.log('🌤️ AI原始返回内容:', result)

      // 解析JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonText = jsonMatch[0]
        console.log('🧩 提取到的 JSON 文本:', jsonText)
        const parsed = JSON.parse(jsonText)
        console.log('✅ 解析后的 JSON 对象:', parsed)

        // 更新天气数据
        const newWeek = parsed.week.map((day: any, index: number) => {
          const date = new Date(today)
          date.setDate(today.getDate() + index)
          return {
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            weekday: index === 0 ? '今天' : WEEKDAYS[date.getDay()],
            weather: day.weather,
            tempHigh: day.tempHigh,
            tempLow: day.tempLow
          }
        })

        // 如果AI返回"未知"或空，保持"我的位置"不变
        const newLocation = (parsed.location && parsed.location !== '未知') 
          ? parsed.location 
          : userWeather.location
        
        setUserWeather({
          location: newLocation,
          week: newWeek
        })

        console.log('✅ 用户天气推断完成:', parsed.location)
      }
    } catch (error) {
      console.error('❌ 用户天气推断失败:', error)
      alert('天气推断失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  // Derived State
  const currentData = activeTab === 'user' ? userWeather : aiWeather
  const currentWeather = currentData.week[0]
  const weatherConfig = WEATHER_TYPES.find(w => w.id === currentWeather.weather) || WEATHER_TYPES[0]

  // 🔥 设置正确的移动端视口高度
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    setVH()
    window.addEventListener('resize', setVH)
    return () => window.removeEventListener('resize', setVH)
  }, [])

  return (
    <div 
      className={`relative w-full overflow-hidden transition-colors duration-1000 bg-gradient-to-br ${weatherConfig.bg}`}
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', height: 'calc(var(--vh, 1vh) * 100)' }}
    >

      {/* Dynamic Weather Effects */}
      <WeatherEffects type={currentWeather.weather} />

      {/* Header / Navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Toggle Switch */}
        <div className="flex bg-black/20 backdrop-blur-lg rounded-full p-1">
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'user' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
          >
            我
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
          >
            TA
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 天气刷新按钮 - 两个标签页都显示 */}
          <button
            onClick={activeTab === 'user' ? generateUserWeatherFromAI : generateWeatherFromAI}
            disabled={isGenerating}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all ${isGenerating ? 'bg-white/30 text-white/50' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all ${editMode ? 'bg-white text-blue-600' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {editMode ? <Check size={20} /> : <Edit2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-10 pb-20 px-6 text-center">

        {/* Location & Date */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-light tracking-wide text-white drop-shadow-md">
            {currentData.location}
          </h2>
          <p className="text-white/80 mt-1 text-sm font-light tracking-widest uppercase">
            {currentWeather.weekday} • {currentWeather.date}
          </p>
        </div>

        {/* Main Weather Display */}
        <div className="relative mb-12 animate-fade-in-up delay-100">
          <div className="text-[8rem] leading-none font-thin text-white drop-shadow-lg select-none">
            {currentWeather.tempHigh}°
          </div>
          <p className="text-xl text-white/90 font-medium mt-2 tracking-widest">
            {weatherConfig.label}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-sm">
            <span>L: {currentWeather.tempLow}°</span>
            <span>H: {currentWeather.tempHigh}°</span>
          </div>
        </div>

        {/* Edit Tip */}
        {editMode && (
          <div className="mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs animate-pulse">
            点击下方日期修改天气
          </div>
        )}

      </div>

      {/* Bottom Forecast Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6">
        <div 
          className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}
        >
          {currentData.week.map((day, index) => {
            const DayIcon = WEATHER_TYPES.find(w => w.id === day.weather)?.icon || Sun
            return (
              <div
                key={index}
                onClick={() => editMode && setEditingDayIndex(index)}
                className={`flex-shrink-0 w-[4.5rem] flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${index === 0 ? 'bg-white/20 shadow-inner' : 'hover:bg-white/5'
                  } ${editMode ? 'cursor-pointer ring-1 ring-white/30 hover:ring-white/60' : ''}`}
              >
                <span className="text-xs text-white/70 mb-2">{day.weekday}</span>
                <span className="mb-2 text-white">
                  <DayIcon size={24} strokeWidth={1.5} />
                </span>
                <span className="text-sm font-medium text-white">
                  {day.tempHigh}°
                </span>
                <span className="text-xs text-white/50 mt-1">
                  {day.tempLow}°
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weather Selector Modal (Edit Mode) */}
      {editMode && editingDayIndex !== null && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                修改 {currentData.week[editingDayIndex].weekday} 的天气
              </h3>
              <button
                onClick={() => setEditingDayIndex(null)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 no-scrollbar">
              {/* Temperature Editing */}
              <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
                  <Thermometer size={16} />
                  <span>温度设置</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">最高温</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tempHighInput}
                        onChange={(e) => setTempHighInput(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">°</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">最低温</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tempLowInput}
                        onChange={(e) => setTempLowInput(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">°</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Type Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {WEATHER_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      updateWeather(editingDayIndex, {
                        weather: type.id,
                        tempHigh: tempHighInput,
                        tempLow: tempLowInput
                      })
                      setEditingDayIndex(null)
                    }}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${currentData.week[editingDayIndex].weather === type.id
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                  >
                    <span className="mb-2 text-gray-700">
                      <type.icon size={32} strokeWidth={1.5} />
                    </span>
                    <span className="text-xs text-gray-600 font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveEdit}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors mt-2 flex-shrink-0"
            >
              保存修改
            </button>
          </div>
        </div>
      )}

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes rain {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes snow {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes snow-sway {
          0% { transform: translateY(-100%) translateX(0) rotate(0deg); opacity: 0; }
          25% { transform: translateY(0) translateX(15px) rotate(90deg); opacity: 1; }
          50% { transform: translateY(50vh) translateX(-15px) rotate(180deg); opacity: 0.8; }
          75% { transform: translateY(75vh) translateX(15px) rotate(270deg); opacity: 0.9; }
          100% { transform: translateY(100vh) translateX(0) rotate(360deg); opacity: 0; }
        }
        @keyframes snow-fast {
          0% { transform: translateY(-100%) translateX(0); opacity: 0; }
          100% { transform: translateY(100vh) translateX(-20px); opacity: 0; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-15px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes wind {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes wind-debris {
          0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100vw) rotate(720deg); opacity: 0; }
        }
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          92% { opacity: 0.8; }
          93% { opacity: 0; }
          94% { opacity: 0.5; }
          96% { opacity: 0; }
        }
        .animate-rain { animation: rain 1s linear infinite; }
        .animate-snow { animation: snow 5s linear infinite; }
        .animate-snow-sway { animation: snow-sway 6s linear infinite; }
        .animate-snow-fast { animation: snow-fast 3s linear infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-wind { animation: wind 2s linear infinite; }
        .animate-wind-debris { animation: wind-debris 3s linear infinite; }
        .animate-lightning { animation: lightning 5s infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

export default Weather
