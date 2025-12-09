import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { voiceService, VoiceConfig } from '../services/voiceService'
import { testVoiceConfig } from '../utils/voiceApi'

const VoiceSettings = () => {
  const navigate = useNavigate()
  const [config, setConfig] = useState<VoiceConfig>({
    apiKey: '',
    groupId: '',
    baseUrl: 'https://api.minimaxi.com/v1'
  })
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

  useEffect(() => {
    const savedConfig = voiceService.getCurrent()
    setConfig(savedConfig)
  }, [])

  const handleSave = () => {
    try {
      voiceService.save(config)
      alert('✅ 配置已保存')
    } catch (error) {
      alert('❌ 保存失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleTest = async () => {
    if (!config.apiKey || !config.groupId) {
      alert('请填写API Key和Group ID')
      return
    }

    setIsTesting(true)

    // 设置30秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时（30秒）\n\n可能原因：\n1. 网络连接慢\n2. 代理服务响应慢\n3. MiniMax API 响应慢\n\n请稍后重试')), 30000)
    })

    try {
      // 使用默认音色测试账号配置，带超时
      await Promise.race([
        testVoiceConfig(config.apiKey, config.groupId, 'male-qn-qingse'),
        timeoutPromise
      ])
      alert('✅ 账号测试成功！\n\n配置正确，可以正常使用。\n请在各角色的聊天设置中配置专属音色。')
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误'

      // 友好的错误提示
      let errorTitle = '❌ 测试失败'
      let errorDetails = msg

      if (msg.includes('超时')) {
        errorTitle = '⏱️ 请求超时'
        errorDetails = msg
      } else if (msg.includes('CORS') || msg.includes('跨域')) {
        errorTitle = '⚠️ 跨域限制'
        errorDetails = '当前环境遇到浏览器跨域限制\n\n解决方案：\n1. 部署到生产环境（自动使用代理）\n2. 本地开发时使用浏览器CORS插件\n3. 或等待部署后再测试'
      } else if (msg.includes('not allowed') || msg.includes('permission')) {
        errorTitle = '🔐 权限错误'
        errorDetails = 'API权限验证失败\n\n请检查：\n1. API Key是否正确\n2. Group ID是否正确\n3. 账户余额是否充足\n4. API Key是否已激活'
      } else if (msg.includes('网络') || msg.includes('Network') || msg.includes('Failed to fetch')) {
        errorTitle = '🌐 网络错误'
        errorDetails = '无法连接到语音服务\n\n请检查：\n1. 网络连接是否正常\n2. 代理服务是否正常\n3. 是否被防火墙阻止'
      }

      alert(`${errorTitle}\n\n${errorDetails}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">
      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customize')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">语音设置</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">VOICE CONFIG</p>
          </div>
        </div>
        <button
          onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${showApiKeyHelp ? 'bg-blue-100 text-blue-600' : 'bg-white/40 text-slate-600 hover:bg-white/60'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* 帮助说明 */}
      {showApiKeyHelp && (
        <div className="px-6 mb-4">
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-100 p-4 rounded-2xl shadow-sm">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📝</span> 如何获取 MiniMax API：
              </p>
              <ol className="list-decimal ml-5 space-y-1.5 text-blue-700/80">
                <li>访问 <a href="https://platform.minimaxi.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">platform.minimaxi.com</a></li>
                <li>注册账号并登录</li>
                <li>控制台 → API Keys → 创建新Key</li>
                <li>复制 <strong>API Key</strong> 和 <strong>Group ID</strong></li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-100/50 space-y-1">
                <p className="text-xs text-blue-600 flex items-center gap-1.5">
                  <span>💡</span> 音色ID请在各角色的聊天设置中单独配置
                </p>
                <p className="text-xs text-blue-600 flex items-center gap-1.5">
                  <span>🎤</span> 支持声音克隆，可为每个角色创建专属音色
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm space-y-5">
            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="输入 MiniMax API Key"
                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all placeholder:text-slate-400 font-mono"
              />
            </div>

            {/* Group ID */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Group ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.groupId}
                onChange={(e) => setConfig({ ...config, groupId: e.target.value })}
                placeholder="输入 Group ID"
                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white/80 transition-all placeholder:text-slate-400 font-mono"
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="flex-1 py-3 bg-white/50 hover:bg-white/80 border border-blue-200 text-blue-600 rounded-xl transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    测试中...
                  </>
                ) : (
                  '测试语音'
                )}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-medium shadow-md active:scale-[0.98]"
              >
                保存配置
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 font-light">
              Powered by MiniMax Voice API
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceSettings
