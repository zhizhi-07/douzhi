/**
 * 编辑描述对话框
 */

import type { Emoji } from '../../../utils/emojiStorage'

interface EditDescDialogProps {
  emoji: Emoji
  editDesc: string
  setEditDesc: (desc: string) => void
  onSave: () => void
  onClose: () => void
}

export const EditDescDialog = ({
  emoji,
  editDesc,
  setEditDesc,
  onSave,
  onClose
}: EditDescDialogProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[999] transition-all"
        onClick={onClose}
      />
      <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[1000] bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 max-w-md mx-auto">
        <h2 className="text-lg font-medium text-slate-800 mb-4 text-center">编辑描述</h2>
        
        <div className="mb-4 flex justify-center">
          <img src={emoji.url} alt="" className="w-20 h-20 object-cover rounded-xl shadow-sm" />
        </div>

        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          placeholder="输入表情包的描述..."
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition-all text-sm font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </>
  )
}
