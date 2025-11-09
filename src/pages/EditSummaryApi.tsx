/**
 * 副API设置页面
 * 用于配置智能总结等功能的API（独立于主API）
 */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import { summaryApiService } from '../services/summaryApiService'

const EditSummaryApi = () => {
  const navigate = useNavigate()
  
  const [config, setConfig] = useState(summaryApiService.get())
  
  const providers = [
    { value: 'siliconflow', label: 'SiliconFlow（推荐）' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'custom', label: '自定义API' }
  ]
  
  const handleSave = () => {
    if (!config.baseUrl || !config.apiKey || !config.model) {
      alert('请填写完整的配置')
      return
    }
    
    summaryApiService.save(config)
    alert('保存成功')
    navigate(-1)
  }
  
  const handleReset = () => {
    if (confirm('确定要恢复为默认配置吗？')) {
      const defaultConfig = summaryApiService.getDefault()
      setConfig(defaultConfig)
      summaryApiService.reset()
      alert('已恢复默认配置')
    }
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
          <h1 className="text-lg font-semibold text-gray-900">副API设置</h1>
          <button onClick={handleSave} className="text-blue-600 font-medium">
            保存
          </button>
        </div>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-6">
        {/* 说明卡片 */}
        <div className="mb-3 bg-blue-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-1">什么是副API？</h3>
          <p className="text-xs text-blue-700 leading-relaxed">
            副API专门用于智能总结、记忆提取等辅助功能，建议使用便宜且快速的模型。主API用于对话创作，副API用于后台分析。
          </p>
        </div>

        {/* 供应商选择 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">供应商</span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
              className="w-full bg-transparent border-none outline-none text-gray-900"
            >
              {providers.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
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
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.siliconflow.cn/v1"
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
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
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
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="deepseek-ai/DeepSeek-V3"
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-2">
              推荐模型：
              <br />• deepseek-ai/DeepSeek-V3（硅基流动，推荐）
              <br />• gpt-4o-mini（OpenAI）
              <br />• gemini-2.0-flash（Google）
            </p>
          </div>
        </div>

        {/* 恢复默认按钮 */}
        <div className="px-3 mt-6">
          <button
            onClick={handleReset}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-all"
          >
            恢复默认配置
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditSummaryApi
