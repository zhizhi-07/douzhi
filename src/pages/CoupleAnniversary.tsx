/**
 * 情侣空间 - 纪念日
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCoupleAnniversaries, 
  addCoupleAnniversary, 
  deleteCoupleAnniversary,
  getDaysUntil,
  formatAnniversaryDate,
  type CoupleAnniversary 
} from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'

const CoupleAnniversaryPage = () => {
  const navigate = useNavigate()
  const [anniversaries, setAnniversaries] = useState<CoupleAnniversary[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: ''
  })

  useEffect(() => {
    loadAnniversaries()
  }, [])

  const loadAnniversaries = () => {
    const all = getCoupleAnniversaries()
    setAnniversaries(all)
  }

  const handleAdd = () => {
    if (!formData.date || !formData.title.trim()) {
      alert('请填写日期和标题')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    addCoupleAnniversary(
      relation.characterId,
      relation.characterName,
      formData.date,
      formData.title.trim(),
      formData.description.trim() || undefined
    )

    setFormData({ date: '', title: '', description: '' })
    setShowAddModal(false)
    loadAnniversaries()
    alert('纪念日已添加！')
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个纪念日吗？')) {
      deleteCoupleAnniversary(id)
      loadAnniversaries()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部栏 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate('/couple-space')}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">纪念日</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-blue-500 font-medium"
          >
            添加
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        {anniversaries.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无纪念日</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                点击右上角添加按钮
                <br />
                记录你们的重要时刻
              </p>
            </div>
          </div>
        ) : (
          /* 纪念日网格 */
          <div className="grid grid-cols-2 gap-4 pb-6">
            {anniversaries.map((anniversary) => {
              const daysUntil = getDaysUntil(anniversary.date)
              
              return (
                <div 
                  key={anniversary.id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  onClick={() => handleDelete(anniversary.id)}
                >
                  {/* 白色标题栏 */}
                  <div className="bg-white text-gray-900 text-center py-3 px-2 text-sm font-medium border-b border-gray-100">
                    {anniversary.title}
                  </div>
                  
                  {/* 天数大数字 */}
                  <div className="bg-white py-8 text-center">
                    <div className="text-5xl font-bold text-gray-900">
                      {Math.abs(daysUntil)}
                    </div>
                  </div>
                  
                  {/* 灰色日期栏 */}
                  <div className="bg-gray-200 text-gray-700 text-center py-2 text-xs">
                    {anniversary.date}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加纪念日弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">添加纪念日</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：在一起100天"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">备注（可选）</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="写下你想说的话..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-full bg-gray-200 text-gray-900 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-3 rounded-full bg-blue-500 text-white font-medium"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoupleAnniversaryPage
