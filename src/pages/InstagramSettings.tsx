import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StatusBar from '../components/StatusBar'

// Instagram设置存储key
const INSTAGRAM_SETTINGS_KEY = 'instagram_settings'

export interface InstagramSettings {
  allowRoastPost: boolean  // 允许NPC挂帖
}

// 获取设置
export function getInstagramSettings(): InstagramSettings {
  const stored = localStorage.getItem(INSTAGRAM_SETTINGS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { allowRoastPost: true }
    }
  }
  return { allowRoastPost: true }  // 默认开启
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <StatusBar />
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold">设置</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto">
        {/* 隐私设置 */}
        <div className="mt-4">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
            隐私设置
          </div>
          <div className="bg-white">
            {/* 允许挂帖 */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <div className="text-base text-gray-900">允许NPC挂帖</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  关闭后，其他网友不会发帖挂你（节省API调用）
                </div>
              </div>
              <button
                onClick={() => handleToggle('allowRoastPost')}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  settings.allowRoastPost 
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                    : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                    settings.allowRoastPost ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="px-4 py-3 text-xs text-gray-400">
          挂帖功能：当你发的帖子引起争议时，其他网友可能会发帖讨论或挂你。
          开启此功能会额外消耗一次API调用来生成挂人帖的评论。
        </div>
      </div>
    </div>
  )
}

export default InstagramSettingsPage
