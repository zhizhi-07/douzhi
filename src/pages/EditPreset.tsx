import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon, SaveIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { DEFAULT_OFFLINE_PROMPT_TEMPLATE } from '../constants/defaultOfflinePrompt'

interface Preset {
  id: string
  name: string
  content: string
}

const EditPreset = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState<number>(0.85)
  const [maxTokens, setMaxTokens] = useState<number>(800)
  const [rawJson, setRawJson] = useState('')
  const [editMode, setEditMode] = useState<'simple' | 'advanced'>('simple')
  const [prompts, setPrompts] = useState<any[]>([])

  useEffect(() => {
    if (id === 'default') {
      // 加载默认预设
      setName('系统默认预设')
      setSystemPrompt(DEFAULT_OFFLINE_PROMPT_TEMPLATE)
      setEditMode('simple')
    } else if (id && id !== 'new') {
      loadPreset(id)
    }
  }, [id])

  const loadPreset = (presetId: string) => {
    const stored = localStorage.getItem('offline-presets')
    console.log('🔍 开始加载预设, ID:', presetId)
    if (stored) {
      try {
        const presets: Preset[] = JSON.parse(stored)
        console.log('📋 所有预设:', presets.map(p => ({ id: p.id, name: p.name })))
        const preset = presets.find(p => p.id === presetId)
        console.log('✅ 找到预设:', preset ? preset.name : '未找到')
        if (preset) {
          setName(preset.name)
          setRawJson(preset.content)
          
          // 解析内容
          const data = JSON.parse(preset.content)
          console.log('📦 预设数据:', data)
          
          // 提取系统提示词
          if (data.system_prompt) {
            setSystemPrompt(data.system_prompt)
          } else if (data.prompts && Array.isArray(data.prompts)) {
            // 找到第一个enabled的system prompt
            const systemPrompts = data.prompts.filter((p: any) => 
              p.role === 'system' && p.enabled
            )
            if (systemPrompts.length > 0) {
              setSystemPrompt(systemPrompts[0].content)
            }
          }
          
          // 提取prompts数组
          if (data.prompts && Array.isArray(data.prompts)) {
            console.log('🎯 找到prompts数组，长度:', data.prompts.length)
            console.log('📝 前3个prompts:', data.prompts.slice(0, 3))
            setPrompts(data.prompts)
          } else {
            console.log('⚠️ 没有找到prompts数组')
          }
          
          // 提取参数
          if (data.temperature !== undefined) setTemperature(data.temperature)
          if (data.openai_max_tokens !== undefined) setMaxTokens(data.openai_max_tokens)
          if (data.max_tokens !== undefined) setMaxTokens(data.max_tokens)
        } else {
          console.log('❌ 未找到匹配的预设')
        }
      } catch (e) {
        console.error('❌ 加载预设失败:', e)
      }
    } else {
      console.log('❌ localStorage中没有预设数据')
    }
  }

  const handleSave = () => {
    // 默认预设不允许保存
    if (id === 'default') {
      alert('系统默认预设不可修改')
      return
    }
    
    if (!name.trim()) {
      alert('请输入预设名称')
      return
    }

    try {
      let content: string
      
      if (editMode === 'advanced') {
        // 高级模式：直接保存JSON
        JSON.parse(rawJson) // 验证JSON格式
        content = rawJson
      } else {
        // 简单模式：构建JSON
        const data: any = {
          name: name.trim(),
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens
        }
        
        // 如果有prompts数组，保留它
        if (prompts.length > 0) {
          data.prompts = prompts
        }
        
        content = JSON.stringify(data, null, 2)
      }

      const stored = localStorage.getItem('offline-presets')
      let presets: Preset[] = stored ? JSON.parse(stored) : []

      if (id === 'new') {
        // 新建
        const newPreset: Preset = {
          id: Date.now().toString(),
          name: name.trim(),
          content
        }
        presets.push(newPreset)
        alert('创建成功！')
      } else if (id) {
        // 更新
        const index = presets.findIndex(p => p.id === id)
        if (index >= 0) {
          presets[index] = {
            ...presets[index],
            name: name.trim(),
            content
          }
          alert('保存成功！')
        }
      }

      localStorage.setItem('offline-presets', JSON.stringify(presets))
      navigate(-1)
    } catch (e) {
      alert('保存失败：JSON格式错误')
      console.error(e)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BackIcon size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {id === 'default' ? '查看默认预设' : id === 'new' ? '新建预设' : '编辑预设'}
          </h1>
          {id !== 'default' && (
            <button
              onClick={handleSave}
              className="p-2 hover:bg-blue-50 rounded-full transition-colors"
            >
              <SaveIcon size={24} className="text-blue-500" />
            </button>
          )}
        </div>
      </div>

      {/* 编辑模式切换 */}
      <div className="px-4 pt-3 pb-2 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode('simple')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              editMode === 'simple'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            简单模式
          </button>
          <button
            onClick={() => setEditMode('advanced')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              editMode === 'advanced'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            高级模式
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4 mt-3">
          {/* 基础信息 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预设名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入预设名称"
              disabled={id === 'default'}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {editMode === 'simple' ? (
            <>
              {/* 系统提示词 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系统提示词
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="输入系统提示词，定义AI的叙事风格和行为..."
                  disabled={id === 'default'}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  rows={15}
                />
                <p className="text-xs text-gray-400 mt-2">
                  提示：支持使用 {'{{'} char {'}}'} {'{{'} user {'}}'} 等变量
                </p>
              </div>

              {/* 参数设置 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <h3 className="text-sm font-medium text-gray-700">参数设置</h3>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">温度 (Temperature)</label>
                    <span className="text-sm font-medium text-blue-500">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    控制创造性：较低更精确，较高更随机
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    最大Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    控制AI回复的最大长度
                  </p>
                </div>
              </div>

              {/* Prompts条目列表 */}
              {prompts.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">提示词条目</h3>
                    <span className="text-xs text-gray-400">
                      {prompts.filter(p => p.enabled).length}/{prompts.length} 启用
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {prompts.map((prompt, index) => (
                      <div
                        key={prompt.identifier || index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl transition-colors"
                      >
                        <div 
                          onClick={() => {
                            const updated = [...prompts]
                            updated[index] = { ...updated[index], enabled: !updated[index].enabled }
                            setPrompts(updated)
                          }}
                          className="flex items-center cursor-pointer flex-shrink-0"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            prompt.enabled 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'bg-white border-gray-300'
                          }`}>
                            {prompt.enabled && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {prompt.name || '未命名条目'}
                          </div>
                          {prompt.content && (
                            <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {prompt.content.substring(0, 100)}...
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                              {prompt.role || 'system'}
                            </span>
                            {prompt.injection_position !== undefined && (
                              <span className="text-xs text-gray-400">
                                位置: {prompt.injection_position}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    💡 切换开关可启用/禁用提示词条目
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 高级模式 - JSON编辑 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON配置
                </label>
                <textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder='{"name": "预设名称", "system_prompt": "..."}'
                  className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none font-mono"
                  rows={20}
                />
                <p className="text-xs text-gray-400 mt-2">
                  ⚠️ 高级模式：直接编辑JSON配置，支持SillyTavern完整格式
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/50">
        <div className="text-xs text-gray-500 text-center">
          {id === 'default' 
            ? '📖 这是系统默认预设，不可修改'
            : '💡 修改后需要在线下模式中重新选择预设才能生效'
          }
        </div>
      </div>
    </div>
  )
}

export default EditPreset
