/**
 * 名片选择器组件
 * 用于选择要发送名片的好友
 */

import { useState, useEffect } from 'react'
import { Character } from '../types/chat'
import { playSystemSound } from '../utils/soundManager'
import { getAllCharacters } from '../utils/characterManager'

interface ContactCardSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (character: Character) => void
  currentCharacterId: string  // 当前聊天的角色ID，不能选择自己
}

const ContactCardSelector = ({
  isOpen,
  onClose,
  onSelect,
  currentCharacterId
}: ContactCardSelectorProps) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchText, setSearchText] = useState('')

  // 加载所有角色
  useEffect(() => {
    if (!isOpen) return
    
    const loadCharacters = async () => {
      try {
        const allChars = await getAllCharacters()
        // 过滤掉当前聊天的角色
        const filtered = allChars.filter(c => c.id !== currentCharacterId)
        setCharacters(filtered)
      } catch (e) {
        console.error('加载角色列表失败:', e)
      }
    }
    loadCharacters()
  }, [isOpen, currentCharacterId])

  // 搜索过滤
  const filteredCharacters = characters.filter(c => {
    const name = c.nickname || c.realName
    return name.toLowerCase().includes(searchText.toLowerCase())
  })

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={() => {
          playSystemSound()
          onClose()
        }}
      />

      {/* 选择器面板 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-h-[70vh] flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">选择联系人</h3>
          <button
            onClick={() => {
              playSystemSound()
              onClose()
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索联系人"
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* 联系人列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">暂无其他联系人</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    playSystemSound()
                    onSelect(character)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  {/* 头像 */}
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {character.avatar ? (
                      <img
                        src={character.avatar}
                        alt={character.realName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {character.nickname || character.realName}
                    </div>
                    {character.signature && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {character.signature}
                      </div>
                    )}
                  </div>

                  {/* 箭头 */}
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ContactCardSelector
