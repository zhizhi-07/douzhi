/**
 * 表情包网格列表组件
 */

import type { Emoji } from '../../../utils/emojiStorage'

interface EmojiGridProps {
  emojis: Emoji[]
  isEditMode: boolean
  selectedEmojis: Set<number>
  onToggleSelect: (id: number) => void
  onDelete: (id: number) => void
  onEditDesc: (emoji: Emoji) => void
}

export const EmojiGrid = ({
  emojis,
  isEditMode,
  selectedEmojis,
  onToggleSelect,
  onDelete,
  onEditDesc
}: EmojiGridProps) => {
  if (emojis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/40">
          <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-sm font-light tracking-widest">暂无收藏</div>
        <div className="text-xs mt-2 opacity-60 font-light">点击右上角添加</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          onClick={() => isEditMode && onToggleSelect(emoji.id)}
          className={`group relative transition-all duration-300 ${
            isEditMode 
              ? selectedEmojis.has(emoji.id) 
                ? 'ring-2 ring-blue-500' 
                : 'cursor-pointer'
              : 'hover:scale-[1.02]'
          }`}
        >
          {/* 图片区域 */}
          <div className="aspect-square relative rounded-xl overflow-hidden">
            <img
              src={emoji.url}
              alt={emoji.description}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            
            {/* 编辑模式下的选中标记 */}
            {isEditMode && (
              <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedEmojis.has(emoji.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white/50 border-white/80'
              }`}>
                {selectedEmojis.has(emoji.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )}

            {/* 编辑模式下的编辑按钮 */}
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditDesc(emoji)
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}

            {/* 非编辑模式下的删除按钮 */}
            {!isEditMode && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                  onClick={() => onDelete(emoji.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* 描述区域 */}
          <p className="text-[10px] text-slate-500 text-center truncate mt-1" title={emoji.description}>
            {emoji.description || emoji.name}
          </p>
        </div>
      ))}
    </div>
  )
}
