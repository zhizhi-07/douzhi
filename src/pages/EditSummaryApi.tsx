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

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      {/* 背景装饰 */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[80px] pointer-events-none" />

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
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">潜意识层</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">SUBCONSCIOUS</p>
          </div>
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
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <h3 className="text-sm font-medium text-slate-800 mb-2 relative z-10">关于潜意识层</h3>
          <p className="text-xs text-slate-500 leading-relaxed relative z-10 font-light">
            潜意识节点独立于主意识（主API），负责后台的记忆整理、情感分析与智能总结。
            建议使用响应速度快且成本较低的模型（如 DeepSeek-V3, Gemini Flash）。
          </p>
        </div>

        {/* 供应商选择 */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">供应商 <span className="text-[10px] opacity-50">PROVIDER</span></h2>
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
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="deepseek-ai/DeepSeek-V3"
              className="w-full px-4 py-3 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
            />
          </div>

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
