/**
 * 数据管理页面
 * 导出、导入、清除数据、存储诊断
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { exportAllData, importAllData, clearAllData } from '../utils/dataManager'
import { analyzeLocalStorage, analyzeIndexedDB, cleanupOldMessages, clearEmojis, clearImages, emergencyCleanup } from '../utils/storageDiagnostic'

interface StorageInfo {
  localStorageSize: string
  localStorageItems: Array<{ key: string; sizeStr: string }>
  indexedDBSize: string
  browserQuota?: { used: string; total: string; percent: string }
}

const DataManager = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showStorageDetail, setShowStorageDetail] = useState(false)

  // 加载存储信息
  const loadStorageInfo = async () => {
    setLoading(true)
    try {
      const ls = analyzeLocalStorage()
      const idb = await analyzeIndexedDB()
      
      let browserQuota
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        browserQuota = {
          used: formatSize(estimate.usage || 0),
          total: formatSize(estimate.quota || 0),
          percent: ((estimate.usage || 0) / (estimate.quota || 1) * 100).toFixed(1)
        }
      }

      setStorageInfo({
        localStorageSize: ls.sizeStr,
        localStorageItems: ls.items.slice(0, 5).map(i => ({ key: i.key, sizeStr: i.sizeStr })),
        indexedDBSize: idb.totalEstimatedSize,
        browserQuota
      })
    } catch (e) {
      console.error('加载存储信息失败:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadStorageInfo()
  }, [])

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // 导出数据
  const handleExportData = async () => {
    try {
      await exportAllData()
      alert('✅ 数据导出成功！文件已保存为 douzhi.备份')
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('❌ 数据导出失败，请重试')
    }
  }

  // 导入数据
  const handleImportData = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.备份'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          await importAllData(file)
          alert('✅ 数据导入成功！页面即将刷新')
          setTimeout(() => window.location.reload(), 1000)
        }
      }
      input.click()
    } catch (error) {
      console.error('导入数据失败:', error)
      alert('❌ 数据导入失败，请重试')
    }
  }

  // 清除数据
  const handleClearData = async () => {
    if (window.confirm('⚠️ 确定要清除所有数据吗？此操作不可恢复！\n\n建议先导出数据备份。')) {
      if (window.confirm('🚨 最后确认：真的要清除所有数据吗？')) {
        try {
          await clearAllData()
          alert('✅ 所有数据已清除！页面即将刷新')
          window.location.reload()
        } catch (error) {
          console.error('清除数据失败:', error)
          alert('❌ 清除失败，请重试')
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 状态栏 + 导航栏一体 */}
      <div className="glass-effect border-b border-gray-200/50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(-1)
            }}
            className="text-gray-700 hover:text-gray-900 p-2 -ml-2 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">数据管理</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 数据管理功能 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* 导出数据 */}
          <button
            onClick={handleExportData}
            className="w-full glass-card rounded-2xl p-4 text-left hover:shadow-lg transition-all backdrop-blur-md bg-white/80 border border-white/50 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">导出数据</h3>
                <p className="text-sm text-gray-500 mt-0.5">保存所有数据为备份文件</p>
              </div>
            </div>
          </button>

          {/* 导入数据 */}
          <button
            onClick={handleImportData}
            className="w-full glass-card rounded-2xl p-4 text-left hover:shadow-lg transition-all backdrop-blur-md bg-white/80 border border-white/50 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">导入数据</h3>
                <p className="text-sm text-gray-500 mt-0.5">从备份文件恢复数据</p>
              </div>
            </div>
          </button>

          {/* 清除数据 */}
          <button
            onClick={handleClearData}
            className="w-full glass-card rounded-2xl p-4 text-left hover:shadow-lg transition-all backdrop-blur-md bg-white/80 border border-red-200/50 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-600">清除所有数据</h3>
                <p className="text-sm text-gray-500 mt-0.5">删除所有数据（不可恢复）</p>
              </div>
            </div>
          </button>
        </div>

        {/* 存储空间诊断 */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">📊 存储空间</h3>
          
          {loading ? (
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : storageInfo ? (
            <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
              {/* 浏览器配额 */}
              {storageInfo.browserQuota && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">总使用量</span>
                    <span className="font-medium">{storageInfo.browserQuota.used} / {storageInfo.browserQuota.total}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        parseFloat(storageInfo.browserQuota.percent) > 80 ? 'bg-red-500' : 
                        parseFloat(storageInfo.browserQuota.percent) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(parseFloat(storageInfo.browserQuota.percent), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{storageInfo.browserQuota.percent}% 已使用</p>
                </div>
              )}
              
              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-blue-600 font-medium">LocalStorage</p>
                  <p className="text-lg font-bold text-blue-800">{storageInfo.localStorageSize}</p>
                  <p className="text-xs text-blue-500">限制 ~5MB</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-purple-600 font-medium">IndexedDB</p>
                  <p className="text-lg font-bold text-purple-800">{storageInfo.indexedDBSize}</p>
                  <p className="text-xs text-purple-500">大文件存储</p>
                </div>
              </div>

              {/* 展开/收起大文件列表 */}
              <button 
                onClick={() => setShowStorageDetail(!showStorageDetail)}
                className="w-full mt-3 text-sm text-blue-600 py-2"
              >
                {showStorageDetail ? '收起详情 ▲' : '查看大文件 ▼'}
              </button>
              
              {showStorageDetail && storageInfo.localStorageItems.length > 0 && (
                <div className="mt-2 text-xs bg-gray-50 rounded-xl p-3">
                  <p className="font-medium text-gray-700 mb-2">localStorage 大文件：</p>
                  {storageInfo.localStorageItems.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600 truncate mr-2" style={{maxWidth: '70%'}}>{item.key}</span>
                      <span className="text-gray-900 font-medium">{item.sizeStr}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-gray-500">无法获取存储信息</p>
            </div>
          )}
        </div>

        {/* 清理选项 */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">🧹 清理空间</h3>
          <div className="space-y-2">
            <button
              onClick={async () => {
                if (confirm('确定清理旧消息吗？将保留每个对话最近100条消息。')) {
                  await cleanupOldMessages(100)
                  await loadStorageInfo()
                  alert('✅ 旧消息已清理')
                }
              }}
              className="w-full glass-card rounded-2xl p-3 text-left flex items-center gap-3 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span>💬</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">清理旧消息</p>
                <p className="text-xs text-gray-500">保留最近100条</p>
              </div>
            </button>

            <button
              onClick={async () => {
                if (confirm('确定清理所有表情包吗？')) {
                  await clearEmojis()
                  await loadStorageInfo()
                  alert('✅ 表情包已清理')
                }
              }}
              className="w-full glass-card rounded-2xl p-3 text-left flex items-center gap-3 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <span>😀</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">清理表情包</p>
                <p className="text-xs text-gray-500">删除所有自定义表情</p>
              </div>
            </button>

            <button
              onClick={async () => {
                if (confirm('确定清理所有壁纸图片吗？')) {
                  await clearImages()
                  await loadStorageInfo()
                  alert('✅ 壁纸已清理')
                }
              }}
              className="w-full glass-card rounded-2xl p-3 text-left flex items-center gap-3 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span>🖼️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">清理壁纸</p>
                <p className="text-xs text-gray-500">删除自定义背景</p>
              </div>
            </button>

            <button
              onClick={async () => {
                if (confirm('⚠️ 紧急清理将删除大量数据，包括旧消息、表情包等，确定继续吗？')) {
                  await emergencyCleanup()
                  await loadStorageInfo()
                  alert('✅ 紧急清理完成，建议刷新页面')
                }
              }}
              className="w-full glass-card rounded-2xl p-3 text-left flex items-center gap-3 border border-red-200 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span>🚨</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">紧急清理</p>
                <p className="text-xs text-gray-500">释放最大空间</p>
              </div>
            </button>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 数据说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 导出数据：保存所有角色、聊天记录、朋友圈、设置等</li>
            <li>• 导入数据：从备份文件恢复所有数据</li>
            <li>• 清除数据：删除所有本地数据，慎用！</li>
            <li>• 手机存储空间有限，建议定期清理旧数据</li>
          </ul>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500 text-center">
          💡 建议定期导出数据备份，存储满时可使用清理功能
        </p>
      </div>
    </div>
  )
}

export default DataManager
