import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StatusBar from '../components/StatusBar'

// Instagram设置存储key
const INSTAGRAM_SETTINGS_KEY = 'instagram_settings'

export interface InstagramSettings {
  allowRoastPost: boolean  // 允许NPC挂帖
  worldview: string  // 论坛世界观设定
}

// 获取设置
export function getInstagramSettings(): InstagramSettings {
  const stored = localStorage.getItem(INSTAGRAM_SETTINGS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { allowRoastPost: true, worldview: '' }
    }
  }
  return { allowRoastPost: true, worldview: '' }  // 默认开启
}

// 保存设置
export function saveInstagramSettings(settings: InstagramSettings) {
  localStorage.setItem(INSTAGRAM_SETTINGS_KEY, JSON.stringify(settings))
}

const InstagramSettingsPage = () => {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<InstagramSettings>(getInstagramSettings())

  const handleToggle = (key: keyof InstagramSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    saveInstagramSettings(newSettings)
  }

  const handleWorldviewChange = (value: string) => {
    const newSettings = { ...settings, worldview: value }
    setSettings(newSettings)
    saveInstagramSettings(newSettings)
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] soft-page-enter">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700 p-2 rounded-full active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">社区设置</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 隐私设置 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-3">隐私设置</div>
          {/* 允许挂帖 */}
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm text-gray-900">允许NPC挂帖</div>
              <div className="text-xs text-gray-400 mt-0.5">
                关闭后，其他网友不会发帖挂你（节省API调用）
              </div>
            </div>
            <button
              onClick={() => handleToggle('allowRoastPost')}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.allowRoastPost ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.allowRoastPost ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            挂帖功能：当你发的帖子引起争议时，其他网友可能会发帖讨论或挂你。
            开启此功能会额外消耗一次API调用来生成挂人帖的评论。
          </p>
        </div>

        {/* 世界观设定 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-3">世界观设定</div>
          <div className="text-sm text-gray-900 mb-1">自定义论坛世界观</div>
          <div className="text-xs text-gray-400 mb-3">
            设定论坛的世界观背景，所有AI评论将根据这个世界观生成
          </div>
          <textarea
            value={settings.worldview || ''}
            onChange={(e) => handleWorldviewChange(e.target.value)}
            placeholder="例如：这是一个魔法世界的论坛，所有人都是魔法师或魔法生物，讨论的话题围绕魔法、咒语、魔法学院的日常等..."
            className="w-full h-32 p-3 text-sm bg-white/60 border border-white/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-3">
            世界观设定会影响整个论坛的AI评论风格。例如设定为"修仙世界"，
            网友评论会使用修仙词汇；设定为"赛博朋克世界"，网友会用赛博朋克口吻。
          </p>
        </div>
      </div>
    </div>
  )
}

export default InstagramSettingsPage
