/**
 * 判定对错卡片组件
 * 在聊天中显示判定请求、回应和结果
 */

import { useState } from 'react'
import { playSystemSound } from '../utils/soundManager'
import type { BiasType, JudgmentResult } from '../services/judgmentService'

// 判定消息数据类型
export interface JudgmentData {
  type: 'request' | 'response' | 'result'
  userReason?: string          // 用户的立场
  aiReason?: string            // AI的立场
  bias?: BiasType              // 判定偏向
  result?: JudgmentResult      // 判定结果
  userName?: string            // 用户名
  characterName?: string       // 角色名
}

interface JudgmentCardProps {
  data: JudgmentData
  isFromUser: boolean
  onRequestJudgment?: () => void  // 点击请求判定
  isJudging?: boolean              // 是否正在判定中
}

const JudgmentCard = ({ data, isFromUser, onRequestJudgment, isJudging }: JudgmentCardProps) => {
  const [expanded, setExpanded] = useState(false)

  // 模拟案号
  const caseNo = `(2025) 情仲字第${Math.floor(Math.random() * 10000)}号`
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  // 通用纸张样式
  const paperStyle = "bg-[#fdfbf7] shadow-sm border border-[#e8e4d8] relative overflow-hidden"
  const stampStyle = "absolute opacity-80 mix-blend-multiply pointer-events-none select-none border-[3px] border-red-700 text-red-700 rounded-lg px-2 py-1 font-bold transform -rotate-12 text-sm tracking-widest uppercase flex items-center justify-center"

  // 用户发送的判定请求卡片 - 传票/起诉书
  if (data.type === 'request') {
    return (
      <div
        className={`${paperStyle} max-w-[300px] rounded-[2px]`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 顶部红线 */}
        <div className="h-1 w-full border-b border-red-800/20 mb-3" />

        {/* 头部 */}
        <div className="px-5 pt-2 pb-1 text-center">
          <div className="font-serif font-bold text-lg text-gray-900 tracking-widest mb-1">
            情感仲裁庭
          </div>
          <div className="font-serif font-bold text-xl text-gray-900 tracking-[0.2em] border-b-2 border-gray-900 inline-block pb-1 mb-2">
            传 票
          </div>
          <div className="text-[10px] font-serif text-gray-500 text-right w-full">
            {caseNo}
          </div>
        </div>

        {/* 印章 - 已立案 */}
        <div className={`${stampStyle} top-12 right-4 w-16 h-16 rounded-full border-4`}>
          <div className="w-14 h-14 border border-red-700 rounded-full flex items-center justify-center text-[10px] text-center leading-tight">
            情感<br />仲裁庭<br />立案专章
          </div>
        </div>

        {/* 内容 */}
        <div className="px-5 py-3">
          <div className="space-y-3 font-serif text-gray-800">
            <div className="flex text-xs">
              <span className="font-bold w-12 flex-shrink-0 text-gray-900">原告：</span>
              <span className="border-b border-gray-300 flex-1 px-1">我</span>
            </div>
            <div className="flex text-xs">
              <span className="font-bold w-12 flex-shrink-0 text-gray-900">被告：</span>
              <span className="border-b border-gray-300 flex-1 px-1">{data.characterName}</span>
            </div>
            <div className="flex text-xs">
              <span className="font-bold w-12 flex-shrink-0 text-gray-900">案由：</span>
              <span className="border-b border-gray-300 flex-1 px-1">情感纠纷</span>
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-gray-900 mb-1">诉讼请求与事实：</div>
              <div className={`text-sm leading-relaxed text-gray-800 text-justify ${expanded ? '' : 'line-clamp-4'}`} style={{ textIndent: '2em' }}>
                {data.userReason}
              </div>
              {!expanded && data.userReason && data.userReason.length > 100 && (
                <div className="text-[10px] text-gray-400 mt-1 text-center cursor-pointer">
                  - 点击展开 -
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-5 pb-4 pt-2">
          {data.bias && data.bias !== 'neutral' && (
            <div className="text-[10px] font-serif text-gray-500 border-t border-gray-200 pt-2 mt-2">
              备注：申请人主张{data.bias === 'user' ? '己方无责' : '对方情有可原'}
            </div>
          )}
          <div className="text-right text-[10px] font-serif text-gray-400 mt-2">
            {dateStr}
          </div>
        </div>
      </div>
    )
  }

  // AI的回应卡片 - 答辩状
  if (data.type === 'response') {
    return (
      <div
        className={`${paperStyle} max-w-[300px] rounded-[2px]`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 头部 */}
        <div className="px-5 pt-4 pb-2 text-center border-b border-dashed border-gray-300 mx-2">
          <div className="font-serif font-bold text-lg text-gray-900 tracking-widest">
            答 辩 状
          </div>
        </div>

        {/* 印章 - 收到 */}
        <div className={`${stampStyle} top-2 right-2 border-2 rounded px-2 py-0.5 text-xs rotate-0`}>
          已收悉
        </div>

        {/* 内容 */}
        <div className="px-5 py-4">
          <div className="font-serif text-gray-800">
            <div className="text-xs font-bold text-gray-900 mb-2">答辩意见：</div>
            <div className={`text-sm leading-relaxed text-gray-800 text-justify ${expanded ? '' : 'line-clamp-5'}`} style={{ textIndent: '2em' }}>
              {data.aiReason}
            </div>
            {!expanded && data.aiReason && data.aiReason.length > 120 && (
              <div className="text-[10px] text-gray-400 mt-2 text-center cursor-pointer">
                - 点击展开 -
              </div>
            )}
          </div>
        </div>

        {/* 判定按钮区域 - 模拟签字栏 */}
        {onRequestJudgment && (
          <div className="px-4 pb-4 pt-2 bg-[#f4f1e9]/50 border-t border-[#e8e4d8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-serif text-gray-500">请审判长裁示：</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                playSystemSound()
                onRequestJudgment()
              }}
              disabled={isJudging}
              className={`w-full py-2 rounded-[2px] font-serif font-bold text-sm tracking-widest transition-all border ${isJudging
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-red-900 text-[#fdfbf7] border-red-950 hover:bg-red-800 shadow-sm active:translate-y-[1px]'
                }`}
            >
              {isJudging ? '正在开庭审理...' : '宣 判'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // 判定结果卡片 - 判决书
  if (data.type === 'result' && data.result) {
    const { result } = data
    const isUserWin = result.winner === 'user'
    const isAiWin = result.winner === 'ai'

    return (
      <div className={`${paperStyle} max-w-[320px] rounded-[2px]`}>
        {/* 国徽/法院徽章占位 */}
        <div className="pt-5 pb-2 flex justify-center opacity-80">
          <div className="w-12 h-12 rounded-full border-2 border-red-900 flex items-center justify-center">
            <div className="w-10 h-10 border border-red-900 rounded-full flex items-center justify-center text-red-900 font-serif font-bold text-xs">
              法
            </div>
          </div>
        </div>

        {/* 头部 */}
        <div className="px-5 pb-4 text-center">
          <div className="font-serif font-bold text-xl text-gray-900 tracking-widest mb-1">
            情感仲裁庭
          </div>
          <div className="font-serif font-bold text-2xl text-gray-900 tracking-[0.3em] mb-2">
            民事判决书
          </div>
          <div className="text-[10px] font-serif text-gray-500">
            {caseNo}
          </div>
        </div>

        {/* 胜诉/败诉 大印章 */}
        <div className="absolute top-32 right-6 transform rotate-[-20deg] opacity-90 mix-blend-multiply pointer-events-none z-10">
          <div className={`w-28 h-28 rounded-full border-[6px] border-double flex items-center justify-center ${isUserWin ? 'border-red-600 text-red-600' :
              isAiWin ? 'border-blue-800 text-blue-800' :
                'border-gray-600 text-gray-600'
            }`}>
            <div className="w-24 h-24 rounded-full border border-dashed border-current flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="font-serif font-black text-2xl tracking-widest mb-1">
                  {isUserWin ? '胜 诉' : isAiWin ? '胜 诉' : '调 解'}
                </span>
                <span className="text-[10px] tracking-tighter uppercase">
                  {isUserWin ? 'PLAINTIFF WINS' : isAiWin ? 'DEFENDANT WINS' : 'SETTLEMENT'}
                </span>
                {isAiWin && <span className="text-[10px] mt-1 font-bold">(被告)</span>}
                {isUserWin && <span className="text-[10px] mt-1 font-bold">(原告)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 正文 */}
        <div className="px-6 py-2">
          <div className="font-serif text-gray-800 space-y-4">

            {/* 判决结果 */}
            <div className="border-b border-gray-200 pb-4">
              <div className="text-xs font-bold text-gray-900 mb-2">本院认为：</div>
              <div className="text-sm leading-relaxed text-justify indent-8">
                {result.reason}
              </div>
            </div>

            {/* 判决主文 */}
            <div className="bg-[#f4f1e9] p-3 border border-[#e8e4d8]">
              <div className="text-xs font-bold text-gray-900 mb-2 text-center">判决如下：</div>
              <div className="text-sm leading-relaxed text-justify font-bold text-gray-900">
                {result.solution}
              </div>
            </div>

            {/* 比分展示 - 既然是法院传票风格，比分可以做得像"赔偿金额"或者"责任比例" */}
            <div className="flex justify-around items-center pt-2 text-xs font-serif text-gray-500">
              <div className="text-center">
                <div>原告责任占比</div>
                <div className="text-lg font-bold text-gray-900">{100 - result.userScore}%</div>
              </div>
              <div className="h-8 w-[1px] bg-gray-300"></div>
              <div className="text-center">
                <div>被告责任占比</div>
                <div className="text-lg font-bold text-gray-900">{100 - result.aiScore}%</div>
              </div>
            </div>

          </div>
        </div>

        {/* 落款 */}
        <div className="px-6 py-6 mt-2 text-right font-serif text-gray-800 relative">
          <div className="mb-1">审判长：AI Justice</div>
          <div className="mb-1">陪审员：豆汁儿</div>
          <div className="mt-2">{dateStr}</div>

          {/* 底部红章 */}
          <div className="absolute right-4 bottom-4 w-24 h-24 opacity-60 mix-blend-multiply pointer-events-none">
            <div className="w-full h-full rounded-full border-4 border-red-700 flex items-center justify-center text-red-700 text-[10px] font-bold rotate-[-15deg]">
              <div className="text-center leading-tight">
                情感仲裁庭<br />专用章
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default JudgmentCard
