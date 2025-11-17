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
    try {
      // 使用默认音色测试账号配置
      await testVoiceConfig(config.apiKey, config.groupId, 'male-qn-qingse')
      alert('✅ 账号测试成功！\n\n配置正确，可以正常使用。\n请在各角色的聊天设置中配置专属音色。')
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误'
      
      // 友好的错误提示
      let errorTitle = '❌ 测试失败'
      let errorDetails = msg
      
      if (msg.includes('CORS') || msg.includes('跨域')) {
        errorTitle = '⚠️ 跨域限制'
        errorDetails = '当前环境遇到浏览器跨域限制\n\n解决方案：\n1. 部署到生产环境（自动使用代理）\n2. 本地开发时使用浏览器CORS插件\n3. 或等待部署后再测试'
      } else if (msg.includes('not allowed') || msg.includes('permission')) {
        errorTitle = '🔐 权限错误'
        errorDetails = 'API权限验证失败\n\n请检查：\n1. API Key是否正确\n2. Group ID是否正确\n3. 账户余额是否充足\n4. API Key是否已激活'
      } else if (msg.includes('网络') || msg.includes('Network')) {
        errorTitle = '🌐 网络错误'
        errorDetails = '无法连接到语音服务\n\n请检查：\n1. 网络连接是否正常\n2. 是否在生产环境\n3. 代理服务是否正常'
      }
      
      alert(`${errorTitle}\n\n${errorDetails}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">语音设置</h1>
          <button
            onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
          >
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 帮助说明 */}
      {showApiKeyHelp && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-4 rounded">
          <div className="ml-3 text-sm text-blue-700">
            <p className="font-bold mb-2">📝 如何获取MiniMax API：</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>访问 <a href="https://platform.minimaxi.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">platform.minimaxi.com</a></li>
              <li>注册账号并登录</li>
              <li>控制台 → API Keys → 创建新Key</li>
              <li>复制 <strong>API Key</strong> 和 <strong>Group ID</strong></li>
            </ol>
            <p className="mt-2 text-xs">💡 音色ID请在各角色的聊天设置中单独配置</p>
            <p className="text-xs">🎤 支持声音克隆，可为每个角色创建专属音色</p>
          </div>
        </div>
      )}

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl p-6 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="输入MiniMax API Key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Group ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.groupId}
              onChange={(e) => setConfig({ ...config, groupId: e.target.value })}
              placeholder="输入Group ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 py-3 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 disabled:opacity-50"
            >
              {isTesting ? '测试中...' : '测试语音'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceSettings
