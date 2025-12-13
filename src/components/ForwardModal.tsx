/**
 * 转发消息弹窗
 * 选择要转发的好友
 */

import { useState } from 'react'
import { characterService } from '../services/characterService'

interface ForwardModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (characterId: string) => void
}

const ForwardModal = ({ isOpen, onClose, onConfirm }: ForwardModalProps) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const characters = characterService.getAll()

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 标题 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">选择转发对象</h3>
          </div>

          {/* 好友列表 */}
          <div className="max-h-[60vh] overflow-y-auto">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character.id)}
                className={`w-full px-6 py-4 flex items-center gap-3 transition-colors ${
                  selectedCharacter === character.id
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* 头像 */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">
                      {character.realName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 名称 */}
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">
                    {character.remark || character.nickname || character.realName}
                  </div>
                  {character.nickname && (
                    <div className="text-sm text-gray-500">{character.realName}</div>
                  )}
                </div>

                {/* 选中标记 */}
                {selectedCharacter === character.id && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selectedCharacter) {
                  onConfirm(selectedCharacter)
                  onClose()
                }
              }}
              disabled={!selectedCharacter}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                selectedCharacter
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForwardModal
