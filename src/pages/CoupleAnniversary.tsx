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
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl p-8 text-center space-y-6 shadow-xl">
                <div className="w-24 h-24 mx-auto rounded-full bg-pink-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </div>
          </div>
        ) : (
          /* 纪念日列表 */
          <div className="space-y-4 pb-6">
            {anniversaries.map(anniversary => {
              const daysUntil = getDaysUntil(anniversary.date)
              const isPast = daysUntil < 0
              const isToday = daysUntil === 0
              
              return (
                <div key={anniversary.id} className="bg-white rounded-2xl p-5 shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {anniversary.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatAnniversaryDate(anniversary.date)}
                      </p>
                    </div>
                    
                    {/* 天数倒计时 */}
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      isToday ? 'bg-pink-100 text-pink-600' :
                      isPast ? 'bg-gray-100 text-gray-500' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {isToday ? '今天' : 
                       isPast ? `已过${Math.abs(daysUntil)}天` : 
                       `还有${daysUntil}天`}
                    </div>
                  </div>
                  
                  {anniversary.description && (
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                      {anniversary.description}
                    </p>
                  )}
                  
                  <button
                    onClick={() => handleDelete(anniversary.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    删除
                  </button>
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
