/**
 * 副API设置页面
 * 用于配置智能总结等功能的API（独立于主API）
 */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import { summaryApiService } from '../services/summaryApiService'
import { fetchModels } from '../utils/api'

const EditSummaryApi = () => {
  const navigate = useNavigate()

  const [config, setConfig] = useState(summaryApiService.get())
  const [fetchingModels, setFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [showModelList, setShowModelList] = useState(false)
  const [fetchResult, setFetchResult] = useState<{ success: boolean; message: string } | null>(null)

  const providers = [
    { value: 'siliconflow', label: 'SiliconFlow (Recommended)' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'custom', label: 'Custom Node' }
  ]

  const handleSave = () => {
    if (!config.baseUrl || !config.apiKey || !config.model) {
      alert('请填写完整的配置')
      return
    }

    summaryApiService.save(config)
    alert('潜意识节点已更新')
    navigate(-1)
  }

  const handleReset = () => {
    if (confirm('确定要重置潜意识节点吗？')) {
      const defaultConfig = summaryApiService.getDefault()
      setConfig(defaultConfig)
      summaryApiService.reset()
      alert('已恢复初始状态')
    }
  }

  const handleFetchModels = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先填写API地址和密钥')
      return
    }

    if (fetchingModels) return

    setFetchingModels(true)
    setFetchResult(null)

    try {
      const models = await fetchModels(config as any)
      if (models.length === 0) {
        setFetchResult({ success: false, message: '未找到可用模型，请手动输入' })
      } else {
        setAvailableModels(models)
        setShowModelList(true)
        if (!config.model && models.length > 0) {
          setConfig({ ...config, model: models[0] })
        }
        setFetchResult({ success: true, message: `成功拉取 ${models.length} 个模型` })
      }
    } catch (error: any) {
      setFetchResult({ success: false, message: error.message || '拉取模型失败' })
    } finally {
      setFetchingModels(false)
    }
  }

  const handleSelectModel = (model: string) => {
    setConfig({ ...config, model })
    setShowModelList(false)
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      <StatusBar />

      {/* 顶部导航栏 - 玻璃态 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-medium text-slate-800">副API</h1>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-full bg-slate-800 text-white text-sm font-medium shadow-lg hover:bg-slate-700 hover:scale-105 transition-all active:scale-95"
        >
          保存
        </button>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide space-y-6">

        {/* 说明卡片 */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm">
          <h3 className="text-sm font-medium text-slate-800 mb-2">关于副API</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            副API独立于主API，负责后台的记忆整理、情感分析与智能总结。
            建议使用响应速度快且成本较低的模型（如 DeepSeek-V3, Gemini Flash）。
          </p>
        </div>

        {/* 供应商选择 */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-slate-400 ml-1">供应商</h2>
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-1 border border-white/50 shadow-sm">
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
              className="w-full px-4 py-3 bg-transparent border-none outline-none text-slate-800 text-sm font-medium appearance-none"
            >
              {providers.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 连接配置 */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">连接配置 <span className="text-[10px] opacity-50">CONFIGURATION</span></h2>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-light ml-1">接口地址 (Endpoint URL)</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://api.siliconflow.cn/v1"
                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all placeholder:text-slate-300 text-sm text-slate-700 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-light ml-1">API密钥 (API Key)</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all placeholder:text-slate-300 text-sm text-slate-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 模型名称 */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">模型 <span className="text-[10px] opacity-50">MODEL</span></h2>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-1 border border-white/50 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="deepseek-ai/DeepSeek-V3"
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
              />
              <button
                onClick={handleFetchModels}
                disabled={fetchingModels}
                className="px-4 py-2 mr-2 bg-purple-500/80 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              >
                {fetchingModels ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    拉取中
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    拉取模型
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 拉取结果提示 */}
          {fetchResult && (
            <div className={`px-4 py-2 rounded-xl text-xs font-medium ${fetchResult.success ? 'bg-green-100/60 text-green-700' : 'bg-red-100/60 text-red-700'}`}>
              {fetchResult.message}
            </div>
          )}

          {/* 模型列表 */}
          {showModelList && availableModels.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-h-60 overflow-y-auto">
              {availableModels.map((model, index) => (
                <button
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-purple-50/50 transition-colors flex items-center justify-between ${
                    index !== availableModels.length - 1 ? 'border-b border-slate-100' : ''
                  } ${config.model === model ? 'bg-purple-50/70 text-purple-700' : 'text-slate-700'}`}
                >
                  <span className="font-mono text-xs">{model}</span>
                  {config.model === model && (
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="px-2">
            <p className="text-[10px] text-slate-400 font-light leading-relaxed">
              推荐模型：
              <span className="block mt-1 text-slate-500">• deepseek-ai/DeepSeek-V3 (SiliconFlow)</span>
              <span className="block text-slate-500">• gpt-4o-mini (OpenAI)</span>
              <span className="block text-slate-500">• gemini-2.0-flash (Google)</span>
            </p>
          </div>
        </div>

        {/* 恢复默认按钮 */}
        <div className="pt-4">
          <button
            onClick={handleReset}
            className="w-full py-3 bg-white/30 hover:bg-white/50 text-slate-500 rounded-xl text-xs font-medium border border-white/40 transition-all active:scale-95"
          >
            重置为默认状态
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditSummaryApi
