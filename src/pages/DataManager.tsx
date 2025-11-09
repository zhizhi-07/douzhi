/**
 * 数据管理页面
 * 导出、导入、清除数据
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { exportAllData, importAllData, clearAllData } from '../utils/dataManager'

const DataManager = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })

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
  const handleClearData = () => {
    if (window.confirm('⚠️ 确定要清除所有数据吗？此操作不可恢复！\n\n建议先导出数据备份。')) {
      if (window.confirm('🚨 最后确认：真的要清除所有数据吗？')) {
        clearAllData()
        alert('✅ 所有数据已清除！页面即将刷新')
        setTimeout(() => window.location.reload(), 1000)
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

        {/* 说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 数据说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 导出数据：保存所有聊天记录、朋友圈、设置等</li>
            <li>• 导入数据：从备份文件恢复所有数据</li>
            <li>• 清除数据：删除所有本地数据，慎用！</li>
          </ul>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500 text-center">
          💡 建议定期导出数据备份
        </p>
      </div>
    </div>
  )
}

export default DataManager
