/**
 * 线下预设模块管理器
 * 管理文风和人称模块
 */

import { useState, useEffect } from 'react'
import { 
  loadOfflineModules, 
  saveOfflineModules, 
  DEFAULT_STYLE_MODULE,
  type OfflinePresetModules,
  type PersonType 
} from '../constants/offlinePresetModules'

interface OfflineModulesManagerProps {
  onClose: () => void
}

export default function OfflineModulesManager({ onClose }: OfflineModulesManagerProps) {
  const [modules, setModules] = useState<OfflinePresetModules>(loadOfflineModules())
  const [styleInput, setStyleInput] = useState('')

  useEffect(() => {
    // 只在自定义时显示内容，否则为空
    setStyleInput(modules.style.isCustom ? modules.style.content : '')
  }, [modules.style.content, modules.style.isCustom])

  // 切换文风模块开关
  const toggleStyleModule = () => {
    const updated = {
      ...modules,
      style: {
        ...modules.style,
        enabled: !modules.style.enabled
      }
    }
    setModules(updated)
    saveOfflineModules(updated)
  }

  // 保存自定义文风
  const saveCustomStyle = () => {
    if (!styleInput.trim()) {
      alert('⚠️ 文风内容不能为空')
      return
    }
    const updated = {
      ...modules,
      style: {
        enabled: true,
        content: styleInput,
        isCustom: true
      }
    }
    setModules(updated)
    saveOfflineModules(updated)
    alert('✅ 自定义文风已保存')
  }

  // 清空文风
  const clearStyle = () => {
    if (confirm('确定清空自定义文风吗？')) {
      setStyleInput('')
      const updated = {
        ...modules,
        style: {
          enabled: false,
          content: DEFAULT_STYLE_MODULE,
          isCustom: false
        }
      }
      setModules(updated)
      saveOfflineModules(updated)
    }
  }

  // 切换人称
  const handlePersonChange = (type: PersonType) => {
    const updated = {
      ...modules,
      person: { type }
    }
    setModules(updated)
    saveOfflineModules(updated)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">线下预设模块</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 文风模块 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-gray-800">自定义文风</h3>
                {modules.style.isCustom && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">已设置</span>
                )}
              </div>
              <button
                onClick={toggleStyleModule}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  modules.style.enabled 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    modules.style.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <textarea
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="在这里粘贴你的自定义文风要求...&#10;&#10;留空则使用系统默认文风"
            />
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={saveCustomStyle}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                保存自定义文风
              </button>
              
              {modules.style.isCustom && (
                <button
                  onClick={clearStyle}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* 人称选择 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">人称</h3>
            
            <div className="space-y-3">
              {/* 第一人称 */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="person"
                  checked={modules.person.type === 'first'}
                  onChange={() => handlePersonChange('first')}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-800">第一人称</div>
                  <div className="text-sm text-gray-500">用"我"来叙述（我坐在沙发上...）</div>
                </div>
              </label>

              {/* 第二人称 */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="person"
                  checked={modules.person.type === 'second'}
                  onChange={() => handlePersonChange('second')}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-800">第二人称</div>
                  <div className="text-sm text-gray-500">用"你"来叙述（你坐在沙发上...）</div>
                </div>
              </label>

              {/* 第三人称 */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="person"
                  checked={modules.person.type === 'third'}
                  onChange={() => handlePersonChange('third')}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-800">第三人称</div>
                  <div className="text-sm text-gray-500">用角色名来叙述（他/她坐在沙发上...）</div>
                </div>
              </label>
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">使用说明</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• <strong>文风</strong>：可以上传自定义文风文件（.txt 或 .md），或直接在编辑器里修改</li>
                  <li>• <strong>人称</strong>：选择叙事视角，会影响整体叙述风格</li>
                  <li>• <strong>去八股和结构</strong>：使用系统默认规则，不可替换</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
