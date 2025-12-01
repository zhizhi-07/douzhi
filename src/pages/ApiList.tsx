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
    if (confirm('确认要删除这个API吗？')) {
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
      custom: 'Custom Node'
    }
    return labels[provider.toLowerCase()] || provider
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      <StatusBar />

      {/* 顶部导航栏 - 玻璃态 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800">API设置</h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/add-api')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:scale-105 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* API列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide space-y-4">

        {/* 副API（固定） */}
        <div
          onClick={() => navigate('/edit-summary-api')}
          className="group relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm cursor-pointer hover:shadow-md transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-purple-200/50" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 text-sm">副API</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-light leading-relaxed pl-11">
                用于记忆提取、情感分析和智能总结
              </p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 text-slate-400 group-hover:bg-white group-hover:text-purple-500 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200/50 mx-2" />

        {/* 主API列表 */}
        {apiConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/40">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-sm font-light">暂无API</p>
            <p className="text-xs mt-2 opacity-60 font-light">点击右上角添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiConfigs.map(api => {
              const isCurrent = currentApiId === api.id
              return (
                <div
                  key={api.id}
                  onClick={() => handleSwitchApi(api.id)}
                  className={`group relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${isCurrent
                      ? 'bg-white/80 backdrop-blur-xl border-blue-200/50 shadow-md ring-1 ring-blue-100'
                      : 'bg-white/40 backdrop-blur-md border-white/50 shadow-sm hover:bg-white/60'
                    }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-300'}`} />
                        <h3 className={`font-medium text-sm tracking-wide ${isCurrent ? 'text-slate-800' : 'text-slate-600'}`}>
                          {api.name}
                        </h3>
                        {api.isBuiltIn && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full border border-slate-200/50">
                            CORE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 pl-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-light">
                          <span className="w-16 text-slate-400">供应商</span>
                          <span className="text-slate-700">{getProviderLabel(api.provider)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-light">
                          <span className="w-16 text-slate-400">模型</span>
                          <span className="text-slate-700 font-mono text-[10px]">{api.model}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/edit-api/${api.id}`)
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteApi(api.id, e)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 选中状态的光效 */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-transparent pointer-events-none" />
                  )}
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
