import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface PetAdoptionCardProps {
  userProposal: string
  userGender: '男' | '女'
  aiProposal?: string
  aiGender?: '男' | '女'
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'disputed' | 'processed'
  isSent?: boolean
  guardianName?: string // AI的名字
  onConfirm?: (finalName: string, finalGender: '男' | '女') => void
  onDispute?: (newName: string, newGender: '男' | '女') => void // 用户表示异议，重新协商
}

// SVG 蛋 (带相框效果)
const EggPhoto = ({ gender }: { gender?: '男' | '女' }) => (
  <div className="relative w-14 h-18 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
    <svg viewBox="0 0 60 75" className="w-10 h-14 relative z-10">
      <defs>
        <radialGradient id="eggGradID" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={gender === '女' ? '#fff0f5' : '#f0f5ff'} />
          <stop offset="100%" stopColor={gender === '女' ? '#fce4ec' : '#e3f2fd'} />
        </radialGradient>
      </defs>
      <path 
        d="M30 5 C 50 5, 58 30, 58 45 C 58 65, 45 72, 30 72 C 15 72, 2 65, 2 45 C 2 30, 10 5, 30 5 Z" 
        fill="url(#eggGradID)"
        stroke={gender === '女' ? '#f8bbd0' : '#90caf9'}
        strokeWidth="1.5"
      />
      <ellipse cx="20" cy="22" rx="6" ry="10" fill="white" fillOpacity="0.5" transform="rotate(-15 20 22)" />
    </svg>
    {/* 性别角标 */}
    <div className={`absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold rounded-tl-md ${
      gender === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
    }`}>
      {gender === '女' ? '♀' : '♂'}
    </div>
  </div>
)

const PetAdoptionCard = ({
  userProposal,
  userGender,
  aiProposal,
  aiGender,
  status,
  isSent = false,
  guardianName = 'AI',
  onConfirm,
  onDispute
}: PetAdoptionCardProps) => {
  const navigate = useNavigate()
  const [finalName, setFinalName] = useState(aiProposal || userProposal)
  const [finalGender, setFinalGender] = useState<'男' | '女'>(aiGender || userGender)

  useEffect(() => {
    if (aiProposal) setFinalName(aiProposal)
    if (aiGender) setFinalGender(aiGender)
  }, [aiProposal, aiGender])

  const handleConfirm = () => {
    if (finalName && onConfirm) {
      onConfirm(finalName, finalGender)
    }
  }

  const namesMatch = aiProposal && userProposal === aiProposal
  const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')

  // 拒绝状态保持简单卡片
  if (status === 'rejected') {
    return (
      <div className="w-72 bg-[#fff5f5] rounded-xl shadow-sm border border-[#ffcdd2] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ffebee] rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#e57373]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#c62828] text-sm">领养申请未通过</h3>
            <p className="text-xs text-[#e57373] mt-0.5">对方暂时还没有准备好</p>
          </div>
        </div>
      </div>
    )
  }

  // 已处理状态 (原申请卡片变更为此状态)
  if (status === 'processed') {
    return (
      <div className="w-64 bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-3 opacity-80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
             <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 text-sm">申请已受理</h3>
            <p className="text-xs text-gray-500 mt-0.5">对方已回应你的领养申请</p>
          </div>
        </div>
      </div>
    )
  }

  // 异议状态 - 已被重新协商
  if (status === 'disputed') {
    return (
      <div className="w-72 bg-[#fff8e1] rounded-xl shadow-sm border border-[#ffe082] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fff3e0] rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#ff9800]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#e65100] text-sm">已提出异议</h3>
            <p className="text-xs text-[#ff9800] mt-0.5">正在重新协商中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-[#fdfbf7] rounded-xl shadow-lg border border-[#e0dcd5] overflow-hidden relative group">
      {/* 背景纹理 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '12px 12px' }} 
      />
      
      {/* 顶部标题栏 - 身份证风格 */}
      <div className="h-10 bg-[#8b7355] flex items-center justify-between px-3 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
        </div>
        <div className="flex items-center gap-1.5 z-10">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <span className="text-white font-serif tracking-wider text-xs font-bold">宠物居民证</span>
        </div>
        <div className="text-[8px] text-white/60 font-mono z-10">PET ID</div>
      </div>

      <div className="p-3">
        <div className="flex gap-3">
          {/* 左侧照片区 */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <EggPhoto gender={status === 'accepted' || status === 'confirmed' ? finalGender : userGender} />
            <div className="px-1.5 py-0.5 bg-[#f0ebe5] rounded text-[8px] text-[#8b7355] font-mono">
              NO.{(Date.now() % 1000000).toString().padStart(6, '0')}
            </div>
          </div>

          {/* 右侧信息区 */}
          <div className="flex-1 space-y-2 pt-0.5">
            <div>
              <div className="text-[9px] text-[#bcaaa4] mb-0.5">姓名</div>
              {status === 'pending' ? (
                <div className="text-sm font-bold text-[#5d4037] border-b border-dashed border-[#d7ccc8] pb-0.5">
                  {userProposal} <span className="text-[10px] font-normal text-[#9e9e9e]">(申请中)</span>
                </div>
              ) : status === 'accepted' && !namesMatch ? (
                <input
                  type="text"
                  value={finalName}
                  onChange={(e) => setFinalName(e.target.value)}
                  className="w-full text-sm font-bold text-[#5d4037] bg-transparent border-b border-[#8b7355] pb-0.5 outline-none focus:border-blue-500 transition-colors"
                  maxLength={10}
                />
              ) : (
                <div className="text-sm font-serif font-bold text-[#5d4037]">
                  {finalName}
                </div>
              )}
            </div>

            <div>
              <div className="text-[9px] text-[#bcaaa4] mb-0.5">监护人</div>
              <div className="text-xs font-medium text-[#5d4037]">
                我 & {guardianName}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-[#bcaaa4] mb-0.5">登记日期</div>
              <div className="text-xs font-mono text-[#5d4037]">{dateStr}</div>
            </div>
          </div>
        </div>

        {/* 状态印章 */}
        <div className="absolute right-2 bottom-14 opacity-20 pointer-events-none transform rotate-[-15deg]">
          <div className="w-12 h-12 border-2 border-[#5d4037] rounded-full flex items-center justify-center p-0.5">
            <div className="w-full h-full border border-[#5d4037] rounded-full flex items-center justify-center text-[8px] font-bold tracking-wider text-[#5d4037]">
              {status === 'confirmed' ? '已认证' : '审查中'}
            </div>
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="mt-3 border-t border-[#f0ebe5] pt-3">
          {status === 'pending' && isSent && (
            <div className="text-center">
              <span className="text-xs text-[#8b7355] flex items-center justify-center gap-2 bg-[#f8f5f2] py-2 rounded-lg">
                <span className="w-1.5 h-1.5 bg-[#8b7355] rounded-full animate-pulse"></span>
                等待 {guardianName} 签署...
              </span>
            </div>
          )}

          {status === 'accepted' && (
            <div className="space-y-2">
              {/* AI提议展示区 */}
              {namesMatch ? (
                <div className="flex items-center gap-2 text-[10px] text-[#5d4037] bg-[#fff8e1] p-2 rounded-lg border border-[#ffe082]">
                  <span className="text-base">🎉</span>
                  <span>心有灵犀！名字一样：<span className="font-bold text-xs">{aiProposal}</span></span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[10px] text-[#5d4037] bg-[#f0f9eb] p-2 rounded-lg border border-[#c5e1a5]">
                  <span className="text-base">✨</span>
                  <div className="flex-1">
                    <div className="text-[#33691e] font-medium">{guardianName}的提议：</div>
                    <div className="font-bold text-xs">{aiProposal} <span className="font-normal text-[#558b2f]">({aiGender === '女' ? '女' : '男'})</span></div>
                  </div>
                </div>
              )}
              
              {/* 交互区域：只有收到的消息才显示操作按钮 */}
              {!isSent && (
                <>
                  {!namesMatch && (
                    <div className="bg-white rounded-lg border border-[#eee] p-2 shadow-sm space-y-2">
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={finalName}
                          onChange={(e) => setFinalName(e.target.value)}
                          placeholder="输入最终名字"
                          className="w-full text-xs font-bold text-[#5d4037] bg-[#f9f9f9] border border-[#e0e0e0] rounded px-2 py-1.5 outline-none focus:border-[#8b7355] focus:bg-white transition-all placeholder:font-normal"
                          maxLength={10}
                        />
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setFinalGender('男')} 
                            className={`flex-1 py-1.5 text-[10px] rounded border font-bold transition-all ${
                              finalGender === '男' 
                                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                : 'bg-white border-[#e0e0e0] text-gray-400'
                            }`}
                          >
                            ♂ 男
                          </button>
                          <button 
                            onClick={() => setFinalGender('女')} 
                            className={`flex-1 py-1.5 text-[10px] rounded border font-bold transition-all ${
                              finalGender === '女' 
                                ? 'bg-pink-50 border-pink-200 text-pink-600' 
                                : 'bg-white border-[#e0e0e0] text-gray-400'
                            }`}
                          >
                            ♀ 女
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {!namesMatch && onDispute && (
                      <button
                        onClick={() => onDispute(finalName, finalGender)}
                        className="px-2 py-1.5 bg-white border border-[#ffab91] text-[#e64a19] rounded text-[10px] font-bold active:scale-[0.98] transition-all shrink-0"
                      >
                        异议
                      </button>
                    )}
                    <button
                      onClick={handleConfirm}
                      className="flex-1 py-1.5 bg-[#5d4037] text-white rounded text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>确认</span>
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {status === 'confirmed' && (
            <button
              onClick={() => navigate('/couple-pet')}
              className="w-full py-1.5 bg-[#8b7355] text-white rounded text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1"
            >
              <span>查看证件</span>
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetAdoptionCard
