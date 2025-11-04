import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { apiService } from '../services/apiService'

const EditApi = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const existingApi = id ? apiService.getById(id) : null

  const [formData, setFormData] = useState({
    name: existingApi?.name || '',
    baseUrl: existingApi?.baseUrl || '',
    apiKey: existingApi?.apiKey || '',
    model: existingApi?.model || '',
    provider: existingApi?.provider || 'openai' as const,
    temperature: existingApi?.temperature ?? 0.7,
    maxTokens: existingApi?.maxTokens ?? 8000
  })

  useEffect(() => {
    if (!existingApi) {
      navigate('/api-list')
    }
  }, [existingApi, navigate])

  const providers = [
    { value: 'google', label: 'Google Gemini', example: 'https://generativelanguage.googleapis.com/v1beta' },
    { value: 'openai', label: 'OpenAI', example: 'https://api.openai.com/v1' },
    { value: 'siliconflow', label: 'SiliconFlow', example: 'https://api.siliconflow.cn/v1' },
    { value: 'custom', label: '自定义API', example: '' },
  ]

  const handleProviderChange = (provider: string) => {
    const selectedProvider = providers.find(p => p.value === provider)
    setFormData({
      ...formData,
      provider: provider as any,
      baseUrl: provider === 'custom' ? '' : (selectedProvider?.example || '')
    })
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入API名称')
      return
    }
    if (!formData.baseUrl || !formData.apiKey || !formData.model) {
      alert('请填写完整的API配置')
      return
    }

    if (id) {
      apiService.update(id, formData)
    }
    navigate('/api-list', { replace: true })
  }

  if (!existingApi) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">编辑API</h1>
          <button onClick={handleSave} className="text-blue-600 font-medium">
            保存
          </button>
        </div>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6">
        {/* API名称 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API名称</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 我的Gemini API"
              maxLength={30}
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* API提供商 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API提供商</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
            {providers.map((provider, index) => (
              <div key={provider.value}>
                <button
                  onClick={() => handleProviderChange(provider.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${
                    index < providers.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-gray-900 font-medium">{provider.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.provider === provider.value 
                      ? 'border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {formData.provider === provider.value && (
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* API地址 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API地址</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* API密钥 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API密钥</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 模型名称 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">模型名称</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="例如: gpt-3.5-turbo"
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 高级设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">高级设置</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs text-gray-500 mb-2">温度 (Temperature)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-gray-900 font-mono text-sm w-10 text-right">
                  {formData.temperature.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <label className="block text-xs text-gray-500 mb-2">最大Token数</label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                placeholder="8000"
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditApi
