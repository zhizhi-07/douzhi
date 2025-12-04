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

  // 用户发送的判定请求卡片
  if (data.type === 'request') {
    return (
      <div 
        className={`max-w-[280px] rounded-2xl overflow-hidden ${
          isFromUser ? 'bg-blue-500' : 'bg-white border'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 头部 */}
        <div className={`px-4 py-3 flex items-center gap-2 ${
          isFromUser ? 'bg-blue-600' : 'bg-gray-50 border-b'
        }`}>
          <span className="text-xl">⚖️</span>
          <span className={`font-medium ${isFromUser ? 'text-white' : 'text-gray-800'}`}>
            谁对谁错
          </span>
        </div>
        
        {/* 内容 */}
        <div className="p-4">
          <div className={`text-sm mb-2 ${isFromUser ? 'text-blue-100' : 'text-gray-500'}`}>
            我的立场：
          </div>
          <div className={`text-sm leading-relaxed ${
            isFromUser ? 'text-white' : 'text-gray-700'
          } ${expanded ? '' : 'line-clamp-3'}`}>
            {data.userReason}
          </div>
          {!expanded && data.userReason && data.userReason.length > 100 && (
            <div className={`text-xs mt-1 ${isFromUser ? 'text-blue-200' : 'text-gray-400'}`}>
              点击展开全部
            </div>
          )}
        </div>
        
        {/* 偏向标签 */}
        {data.bias && data.bias !== 'neutral' && (
          <div className={`px-4 pb-3 ${isFromUser ? 'text-blue-200' : 'text-gray-400'}`}>
            <span className="text-xs">
              🎯 {data.bias === 'user' ? '偏向我' : `偏向${data.characterName}`}
            </span>
          </div>
        )}
      </div>
    )
  }

  // AI的回应卡片
  if (data.type === 'response') {
    return (
      <div 
        className="max-w-[280px] rounded-2xl overflow-hidden bg-white border"
        onClick={() => setExpanded(!expanded)}
      >
        {/* 头部 */}
        <div className="px-4 py-3 flex items-center gap-2 bg-pink-50 border-b">
          <span className="text-xl">💭</span>
          <span className="font-medium text-gray-800">
            {data.characterName}的立场
          </span>
        </div>
        
        {/* 内容 */}
        <div className="p-4">
          <div className={`text-sm leading-relaxed text-gray-700 ${expanded ? '' : 'line-clamp-4'}`}>
            {data.aiReason}
          </div>
          {!expanded && data.aiReason && data.aiReason.length > 120 && (
            <div className="text-xs mt-1 text-gray-400">
              点击展开全部
            </div>
          )}
        </div>
        
        {/* 判定按钮 */}
        {onRequestJudgment && (
          <div className="px-4 pb-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                playSystemSound()
                onRequestJudgment()
              }}
              disabled={isJudging}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition ${
                isJudging 
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
              }`}
            >
              {isJudging ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  判定中...
                </span>
              ) : (
                '⚖️ 请求判定'
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  // 判定结果卡片
  if (data.type === 'result' && data.result) {
    const { result } = data
    const isUserWin = result.winner === 'user'
    const isAiWin = result.winner === 'ai'
    // isDraw用于逻辑判断（else分支）
    
    return (
      <div className="max-w-[300px] rounded-2xl overflow-hidden bg-white border shadow-sm">
        {/* 头部 - 结果 */}
        <div className={`px-4 py-4 text-center ${
          isUserWin ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
          isAiWin ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
          'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          <div className="text-3xl mb-1">
            {isUserWin ? '🎉' : isAiWin ? '💗' : '🤝'}
          </div>
          <div className="text-white font-bold text-lg">
            {isUserWin ? `${data.userName}占理!` :
             isAiWin ? `${data.characterName}占理!` :
             '平局 - 双方各有道理'}
          </div>
        </div>
        
        {/* 得分 */}
        <div className="flex items-center px-4 py-3 bg-gray-50 border-b">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500">{data.userName}</div>
            <div className={`text-xl font-bold ${isUserWin ? 'text-blue-600' : 'text-gray-400'}`}>
              {result.userScore}
            </div>
          </div>
          <div className="text-gray-300 text-lg">VS</div>
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500">{data.characterName}</div>
            <div className={`text-xl font-bold ${isAiWin ? 'text-pink-600' : 'text-gray-400'}`}>
              {result.aiScore}
            </div>
          </div>
        </div>
        
        {/* 理由 */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
            <span>📋</span> 判定理由
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {result.reason}
          </div>
        </div>
        
        {/* 建议 */}
        <div className="p-4 bg-green-50">
          <div className="flex items-center gap-1 text-sm font-medium text-green-700 mb-2">
            <span>💡</span> 解决建议
          </div>
          <div className="text-sm text-green-600 leading-relaxed">
            {result.solution}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default JudgmentCard
