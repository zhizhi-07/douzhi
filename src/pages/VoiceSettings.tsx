import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { voiceService, VoiceConfig } from '../services/voiceService'
import { testVoiceConfig } from '../utils/voiceApi'

const VoiceSettings = () => {
  const navigate = useNavigate()
  const [configs, setConfigs] = useState<VoiceConfig[]>([])
  const [currentId, setCurrentId] = useState('')
  const [editingConfig, setEditingConfig] = useState<VoiceConfig | null>(null)
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = () => {
    const allConfigs = voiceService.getAll()
    setConfigs(allConfigs)
    setCurrentId(voiceService.getCurrentId())
  }

  const handleSelectConfig = (config: VoiceConfig) => {
    voiceService.setCurrentId(config.id)
    setCurrentId(config.id)
  }

  const handleEditConfig = (config: VoiceConfig, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConfig({ ...config })
  }

  const handleSaveConfig = () => {
    if (!editingConfig) return

    voiceService.update(editingConfig.id, {
      apiKey: editingConfig.apiKey,
      groupId: editingConfig.groupId,
      baseUrl: editingConfig.baseUrl
    })

    setEditingConfig(null)
    loadConfigs()
  }

  const handleTestVoice = async () => {
    if (!editingConfig?.apiKey || !editingConfig?.groupId) {
      alert('请先填写API Key和Group ID')
      return
    }

    try {
      console.log('🎤 开始测试语音账号...')
      // 使用一个测试音色来验证账号
      await testVoiceConfig(
        editingConfig.apiKey,
        editingConfig.groupId,
        'male-qn-qingse'  // 测试用的默认音色
      )
      alert('✅ 账号测试成功！API Key和Group ID配置正确。\n\n请在聊天设置中为每个角色配置专属音色。')
    } catch (error) {
      console.error('❌ 账号测试失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`❌ 账号测试失败：\n\n${errorMessage}\n\n请检查：\n1. API Key是否正确\n2. Group ID是否正确\n3. 账户余额是否充足`)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <StatusBar />
      
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">语音设置</h1>
          <button
            onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
            className="p-1"
          >
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 帮助说明 */}
      {showApiKeyHelp && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm text-blue-700">
              <p className="font-bold mb-2">📝 如何获取MiniMax API Key：</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li><strong>国际版（推荐）：</strong><a href="https://platform.minimaxi.com" target="_blank" rel="noopener noreferrer" className="underline ml-1">https://platform.minimaxi.com</a></li>
                <li>注册/登录账号</li>
                <li>进入控制台 → API Keys</li>
                <li>创建新的API Key，复制 API Key 和 Group ID</li>
                <li>🎤 <strong>克隆音色</strong>：在"声音管理"中上传音频克隆专属音色</li>
              </ol>
              <p className="mt-2 text-xs">💡 <strong>国际版支持声音克隆</strong>，可创建你自己的专属音色</p>
              <p className="text-xs">🇨🇳 国内版：<a href="https://www.minimax.chat" target="_blank" rel="noopener noreferrer" className="underline">https://www.minimax.chat</a>（仅预设音色）</p>
            </div>
          </div>
        </div>
      )}

      {/* 配置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {configs.map(config => (
            <div
              key={config.id}
              onClick={() => handleSelectConfig(config)}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                currentId === config.id 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    {config.provider === 'minimax' && (
                      <>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          MiniMax
                        </span>
                        {config.baseUrl?.includes('minimaxi.com') ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            🌍 国际版
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            🇨🇳 国内版
                          </span>
                        )}
                      </>
                    )}
                    {currentId === config.id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        使用中
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.apiKey ? `API Key: ${config.apiKey.substring(0, 8)}...` : '未配置API Key'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {config.groupId ? `Group ID: ${config.groupId}` : '未配置Group ID'}
                  </p>
                </div>
                <button
                  onClick={(e) => handleEditConfig(config, e)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">配置语音服务</h2>
              <button onClick={() => setEditingConfig(null)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* API 版本选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 版本 <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingConfig.baseUrl || 'https://api.minimaxi.com/v1'}
                  onChange={(e) => setEditingConfig({ ...editingConfig, baseUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="https://api.minimaxi.com/v1">🌍 国际版 (支持声音克隆)</option>
                  <option value="https://api.minimax.chat/v1">🇨🇳 国内版 (仅预设声音)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 国际版支持自定义克隆音色，推荐使用
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingConfig.apiKey}
                  onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
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
                  value={editingConfig.groupId || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, groupId: e.target.value })}
                  placeholder="输入Group ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 音色ID请在每个角色的聊天设置中单独配置
                </p>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleTestVoice}
                  className="flex-1 py-3 border border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50"
                >
                  测试语音
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceSettings
