/**
 * 信封页面 - 匿名秘密信功能
 * 沉浸式写信体验，拟物化设计
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCharacterById } from '../utils/characterManager'
import type { Character } from '../services/characterService'
import { playSystemSound } from '../utils/soundManager'
import { ChevronLeft, PenTool, Send, Mail, X } from 'lucide-react'

// 信件数据结构
interface Letter {
  id: string
  characterId: string
  content: string
  anonymous: boolean
  timestamp: number
  reply?: string
  replyTimestamp?: number
  read: boolean
}

// 从localStorage加载信件
const loadLetters = (characterId: string): Letter[] => {
  try {
    const data = localStorage.getItem(`letters_${characterId}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保存信件到localStorage
const saveLetters = (characterId: string, letters: Letter[]) => {
  localStorage.setItem(`letters_${characterId}`, JSON.stringify(letters))
}

export default function Envelope() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const characterId = searchParams.get('characterId') || ''

  const [character, setCharacter] = useState<Character | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [viewState, setViewState] = useState<'list' | 'writing' | 'reading' | 'sealing'>('list')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)

  // 加载角色和信件
  useEffect(() => {
    const loadData = async () => {
      if (characterId) {
        const char = await getCharacterById(characterId)
        setCharacter(char)
        setLetters(loadLetters(characterId))
      }
    }
    loadData()
  }, [characterId])

  // 发送信件
  const handleSendLetter = async () => {
    if (!content.trim() || content.length < 10) {
      alert('信件内容至少需要10个字哦~')
      return
    }

    setViewState('sealing')
    playSystemSound()

    // 模拟封装动画时间
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 创建新信件
    const newLetter: Letter = {
      id: `letter_${Date.now()}`,
      characterId,
      content: content.trim(),
      anonymous: isAnonymous,
      timestamp: Date.now(),
      read: false
    }

    const updatedLetters = [newLetter, ...letters]
    setLetters(updatedLetters)
    saveLetters(characterId, updatedLetters)

    setContent('')
    setViewState('list')
  }

  // 打开信件
  const handleOpenLetter = (letter: Letter) => {
    playSystemSound()
    setSelectedLetter(letter)
    setViewState('reading')

    // 标记为已读
    if (!letter.read) {
      const updatedLetters = letters.map(l =>
        l.id === letter.id ? { ...l, read: true } : l
      )
      setLetters(updatedLetters)
      saveLetters(characterId, updatedLetters)
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  if (!character) return null

  return (
    <div className="min-h-screen bg-[#2c241b] text-[#4a3b2a] font-serif relative overflow-hidden">
      {/* 木纹背景纹理 */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")` }}></div>

      {/* 顶部导航栏 (悬浮) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-white/90 font-medium text-lg drop-shadow-md tracking-widest">
          {character.nickname || character.realName}的信箱
        </div>
        <div className="w-10" />
      </div>

      {/* 主内容区域 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 pt-20">

        {/* 列表视图：展示信箱和写信按钮 */}
        {viewState === 'list' && (
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            {/* 写信入口 - 拟物化信封 */}
            <div
              onClick={() => setViewState('writing')}
              className="group relative cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="absolute inset-0 bg-[#e6dcc3] transform rotate-1 rounded-sm shadow-xl"></div>
              <div className="relative bg-[#f3e9d2] p-6 rounded-sm shadow-2xl border border-[#d4c5a5]">
                <div className="border-2 border-dashed border-[#d4c5a5]/50 p-4 flex flex-col items-center justify-center h-48 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#4a3b2a]/5 flex items-center justify-center group-hover:bg-[#4a3b2a]/10 transition-colors">
                    <PenTool size={32} className="text-[#8c7b66]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-[#5c4d3c] tracking-widest mb-1">提笔写信</h3>
                    <p className="text-sm text-[#8c7b66]">寄出一份秘密心意</p>
                  </div>
                </div>
                {/* 邮票装饰 */}
                <div className="absolute top-4 right-4 w-16 h-20 bg-white shadow-sm border-4 border-double border-[#e6dcc3] flex items-center justify-center overflow-hidden transform rotate-3">
                  <img src={character.avatar} alt="stamp" className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all" />
                </div>
                {/* 邮戳 */}
                <div className="absolute top-12 right-16 w-24 h-24 border-2 border-[#4a3b2a]/20 rounded-full flex items-center justify-center transform -rotate-12 pointer-events-none">
                  <div className="text-[10px] text-[#4a3b2a]/30 font-bold tracking-widest uppercase text-center leading-tight">
                    POST OFFICE<br />{new Date().toDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 历史信件列表 */}
            <div className="space-y-4">
              <h3 className="text-white/60 text-sm font-medium tracking-widest uppercase ml-2">往来书信</h3>
              {letters.length === 0 ? (
                <div className="text-center py-10 text-white/30 italic">
                  暂无书信往来...
                </div>
              ) : (
                <div className="grid gap-4">
                  {letters.map((letter, index) => (
                    <div
                      key={letter.id}
                      onClick={() => handleOpenLetter(letter)}
                      className="relative bg-[#fcfaf5] p-4 rounded shadow-lg cursor-pointer transform hover:scale-[1.02] transition-all"
                      style={{ transform: `rotate(${index % 2 === 0 ? '1deg' : '-1deg'})` }}
                    >
                      <div className="flex justify-between items-start border-b border-[#e6dcc3] pb-2 mb-2">
                        <span className="font-bold text-[#5c4d3c] text-lg">
                          {letter.anonymous ? '匿名信' : '署名信'}
                        </span>
                        <span className="text-xs text-[#8c7b66] font-mono mt-1">
                          {formatTime(letter.timestamp)}
                        </span>
                      </div>
                      <p className="text-[#5c4d3c]/80 line-clamp-2 text-sm leading-relaxed">
                        {letter.content}
                      </p>
                      {letter.reply && (
                        <div className="absolute -right-2 -top-2 bg-[#b22222] text-white text-[10px] px-2 py-1 rounded shadow-md transform rotate-12">
                          已回信
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 写信视图 */}
        {viewState === 'writing' && (
          <div className="w-full max-w-2xl animate-slide-up">
            <div className="bg-[#fcfaf5] min-h-[70vh] p-8 md:p-12 shadow-2xl relative rounded-sm mx-auto transform rotate-[0.5deg]">
              {/* 纸张纹理 */}
              <div className="absolute inset-0 opacity-50 pointer-events-none"
                style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }}></div>

              {/* 顶部工具栏 */}
              <div className="flex justify-between items-center mb-8 relative z-10">
                <button
                  onClick={() => setViewState('list')}
                  className="text-[#8c7b66] hover:text-[#5c4d3c] transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="text-[#8c7b66] text-sm tracking-widest uppercase">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* 写信区域 */}
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-6 text-[#5c4d3c] font-bold text-xl">
                  致 {character.nickname || character.realName}：
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="在此写下你的心声..."
                  className="flex-1 w-full bg-transparent resize-none outline-none text-[#4a3b2a] text-lg leading-loose placeholder:text-[#d4c5a5]"
                  style={{
                    fontFamily: '"ZCOOL XiaoWei", "KaiTi", serif',
                    backgroundImage: 'linear-gradient(transparent 31px, #e6dcc3 32px)',
                    backgroundSize: '100% 32px',
                    lineHeight: '32px',
                    minHeight: '400px'
                  }}
                />

                {/* 底部操作栏 */}
                <div className="mt-8 flex items-center justify-between border-t border-[#e6dcc3] pt-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${isAnonymous ? 'border-[#5c4d3c] bg-[#5c4d3c]' : 'border-[#d4c5a5]'}`}>
                      {isAnonymous && <CheckIcon />}
                    </div>
                    <span className="text-[#8c7b66] text-sm group-hover:text-[#5c4d3c] transition-colors">匿名发送</span>
                    <input type="checkbox" className="hidden" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                  </label>

                  <button
                    onClick={handleSendLetter}
                    disabled={content.length < 10}
                    className={`px-8 py-3 rounded-full font-bold tracking-widest transition-all transform hover:scale-105 active:scale-95 ${content.length >= 10
                        ? 'bg-[#8b4513] text-[#fcfaf5] shadow-lg hover:bg-[#6d360f]'
                        : 'bg-[#d4c5a5] text-[#fcfaf5]/80 cursor-not-allowed'
                      }`}
                  >
                    封缄寄出
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 封缄动画视图 */}
        {viewState === 'sealing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative animate-bounce-slow">
              <div className="w-64 h-40 bg-[#f3e9d2] shadow-2xl rounded-sm flex items-center justify-center relative overflow-hidden">
                {/* 信封折痕 */}
                <div className="absolute inset-0 border-[20px] border-[#e6dcc3] border-t-[#d4c5a5] border-b-[#d4c5a5]"></div>
                {/* 蜡封动画 */}
                <div className="absolute z-10 w-16 h-16 bg-[#b22222] rounded-full shadow-lg flex items-center justify-center animate-scale-in">
                  <span className="text-[#fcfaf5] font-serif font-bold text-2xl">密</span>
                </div>
              </div>
              <p className="text-center text-white/80 mt-8 tracking-widest animate-pulse">正在封存信件...</p>
            </div>
          </div>
        )}

        {/* 读信视图 */}
        {viewState === 'reading' && selectedLetter && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="bg-[#fcfaf5] min-h-[70vh] p-8 md:p-12 shadow-2xl relative rounded-sm mx-auto transform rotate-[-0.5deg]">
              {/* 纸张纹理 */}
              <div className="absolute inset-0 opacity-50 pointer-events-none"
                style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }}></div>

              <button
                onClick={() => setViewState('list')}
                className="absolute top-6 right-6 text-[#8c7b66] hover:text-[#5c4d3c] transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="relative z-10">
                <div className="flex justify-between items-end border-b-2 border-[#5c4d3c] pb-4 mb-8">
                  <h2 className="text-2xl font-bold text-[#5c4d3c]">
                    {selectedLetter.anonymous ? '一封匿名信' : '我的来信'}
                  </h2>
                  <span className="text-[#8c7b66] font-mono text-sm">
                    {formatTime(selectedLetter.timestamp)}
                  </span>
                </div>

                <div className="text-[#4a3b2a] text-lg leading-loose whitespace-pre-wrap font-serif mb-12"
                  style={{ fontFamily: '"ZCOOL XiaoWei", "KaiTi", serif' }}>
                  {selectedLetter.content}
                </div>

                {selectedLetter.reply && (
                  <div className="mt-12 relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#fcfaf5] px-4 text-[#8c7b66] text-sm tracking-widest">
                      回信
                    </div>
                    <div className="border-t border-[#d4c5a5] pt-8">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={character.avatar} className="w-10 h-10 rounded-full border-2 border-[#d4c5a5]" alt="avatar" />
                        <span className="font-bold text-[#5c4d3c]">{character.nickname || character.realName}</span>
                      </div>
                      <div className="text-[#5c4d3c] italic leading-relaxed bg-[#f3e9d2]/30 p-6 rounded-lg border border-[#e6dcc3]">
                        {selectedLetter.reply}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 全局样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap');
        
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s ease-out; }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-bounce-slow { animation: bounceSlow 2s infinite; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
