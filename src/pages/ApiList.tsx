import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { apiService, ApiConfig } from '../services/apiService'

const ApiList = () => {
  const navigate = useNavigate()
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [currentApiId, setCurrentApiId] = useState<string>('')

  useEffect(() => {
    loadApis()
  }, [])

  const loadApis = () => {
    const configs = apiService.getAll()
    const currentId = apiService.getCurrentId()
    setApiConfigs(configs)
    setCurrentApiId(currentId)
  }

  const handleSwitchApi = (apiId: string) => {
    apiService.setCurrentId(apiId)
    setCurrentApiId(apiId)
  }

  const handleDeleteApi = (apiId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个API配置吗？')) {
      apiService.delete(apiId)
      loadApis()
    }
  }

  const getProviderLabel = (provider: string) => {
    const labels: { [key: string]: string } = {
      google: 'Google Gemini',
      openai: 'OpenAI',
      siliconflow: 'SiliconFlow',
      claude: 'Claude',
      custom: '自定义'
    }
    return labels[provider.toLowerCase()] || provider
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
          <h1 className="text-lg font-semibold text-gray-900">API管理</h1>
          <button onClick={() => navigate('/add-api')} className="text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* API列表 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        {apiConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-base">暂无API配置</p>
            <p className="text-sm mt-2">点击右上角"+"添加API</p>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {apiConfigs.map(api => {
              const isCurrent = currentApiId === api.id
              return (
                <div
                  key={api.id}
                  onClick={() => handleSwitchApi(api.id)}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm cursor-pointer active:scale-[0.98] transition-transform ${
                    isCurrent ? 'border-blue-500' : 'border-gray-200/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{api.name}</h3>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                            当前
                          </span>
                        )}
                        {api.isBuiltIn && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            内置
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">提供商：</span>
                          {getProviderLabel(api.provider)}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">模型：</span>
                          {api.model}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          <span className="font-medium">地址：</span>
                          {api.baseUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      {!api.isBuiltIn && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/edit-api/${api.id}`)
                            }}
                            className="px-3 py-1 text-xs text-blue-600"
                          >
                            编辑
                          </button>
                          <button
                            onClick={(e) => handleDeleteApi(api.id, e)}
                            className="px-3 py-1 text-xs text-red-500"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiList
