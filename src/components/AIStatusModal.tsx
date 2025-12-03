import React from 'react'
import { AIStatus } from '../utils/aiStatusManager'

interface AIStatusModalProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  characterId?: string
  characterAvatar?: string
  status: AIStatus | null
  onForceUpdate?: () => void
}

const AIStatusModal: React.FC<AIStatusModalProps> = ({
  isOpen,
  onClose,
  characterName,
  status,
  onForceUpdate
}) => {
  if (!isOpen || !status) return null

  return (
    <>
      {/* 🔥 从顶部滑下的状态详情卡片 */}
      <div
        className="fixed top-[60px] right-4 z-50 w-80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] modal-slide-down transition-all duration-300"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - 名字和按钮 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-medium text-slate-800 tracking-wide">
            {characterName}
            <span className="ml-2 text-xs text-slate-400 font-normal tracking-wider uppercase">Status</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* 修正状态按钮 */}
            {onForceUpdate && (
              <button
                onClick={() => {
                  onForceUpdate()
                  onClose()
                }}
                className="px-3 py-1 rounded-full bg-white/40 border border-white/50 text-xs text-slate-600 hover:bg-white/80 transition-all duration-300 font-serif hover:shadow-sm"
              >
                修正
              </button>
            )}
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/40 border border-white/50 flex items-center justify-center text-slate-500 hover:bg-white/80 hover:text-slate-700 transition-all duration-300 hover:shadow-sm"
            >
              <span className="text-sm font-light">✕</span>
            </button>
          </div>
        </div>

        {/* 当前状态 - 4个维度 */}
        <div className="space-y-3">
          {/* 服装 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50/60 to-white/20 p-4 border border-white/60 shadow-sm group hover:shadow-md transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-100/30 rounded-full blur-2xl pointer-events-none group-hover:bg-pink-100/50 transition-colors duration-500"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-pink-200/60 flex items-center justify-center text-[10px] text-pink-600 font-medium">衣</span>
                <span className="text-[10px] font-serif text-slate-500 tracking-widest uppercase">outfit</span>
              </div>
              <p className="text-sm text-slate-700 font-serif leading-relaxed break-words pl-2.5 border-l-2 border-pink-300/40">
                {status.outfit || <span className="text-slate-400 italic">未知</span>}
              </p>
            </div>
          </div>

          {/* 心理 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50/60 to-white/20 p-4 border border-white/60 shadow-sm group hover:shadow-md transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-100/30 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-100/50 transition-colors duration-500"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-purple-200/60 flex items-center justify-center text-[10px] text-purple-600 font-medium">心</span>
                <span className="text-[10px] font-serif text-slate-500 tracking-widest uppercase">mood</span>
              </div>
              <p className="text-sm text-slate-700 font-serif leading-relaxed break-words pl-2.5 border-l-2 border-purple-300/40">
                {status.mood || <span className="text-slate-400 italic">未知</span>}
              </p>
            </div>
          </div>

          {/* 行程/地点 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50/60 to-white/20 p-4 border border-white/60 shadow-sm group hover:shadow-md transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-100/50 transition-colors duration-500"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-200/60 flex items-center justify-center text-[10px] text-emerald-600 font-medium">行</span>
                <span className="text-[10px] font-serif text-slate-500 tracking-widest uppercase">location</span>
              </div>
              <p className="text-sm text-slate-700 font-serif leading-relaxed break-words pl-2.5 border-l-2 border-emerald-300/40">
                {status.location || <span className="text-slate-400 italic">未知</span>}
              </p>
            </div>
          </div>

          {/* 动作 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50/60 to-white/20 p-4 border border-white/60 shadow-sm group hover:shadow-md transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-colors duration-500"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-indigo-200/60 flex items-center justify-center text-[10px] text-indigo-600 font-medium">动</span>
                <span className="text-[10px] font-serif text-slate-500 tracking-widest uppercase">action</span>
              </div>
              <p className="text-sm text-slate-700 font-serif leading-relaxed break-words pl-2.5 border-l-2 border-indigo-300/40">
                {status.action || <span className="text-slate-400 italic">未知</span>}
              </p>
            </div>
          </div>

          {/* 更新时间 */}
          <div className="flex justify-end items-center pt-2 border-t border-slate-200/30">
            <span className="w-1 h-1 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            <p className="text-[10px] font-serif text-slate-400 tracking-wider">
              更新于 {new Date(status.updatedAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIStatusModal

