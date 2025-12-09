/**
 * 统计与操作栏组件
 */

interface StatsBarProps {
  count: number
  isEditMode: boolean
  selectedCount: number
  onBatchDelete: () => void
  onExitEdit: () => void
  onEnterEdit: () => void
  onClearAll: () => void
}

export const StatsBar = ({
  count,
  isEditMode,
  selectedCount,
  onBatchDelete,
  onExitEdit,
  onEnterEdit,
  onClearAll
}: StatsBarProps) => {
  return (
    <div className="px-6 mb-6 relative">
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-light text-slate-800">{count}</span>
          <span className="text-xs text-slate-500 font-light">ITEMS</span>
        </div>
        <div className="flex gap-3">
          {isEditMode ? (
            <>
              <button
                onClick={onBatchDelete}
                disabled={selectedCount === 0}
                className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                删除({selectedCount})
              </button>
              <button
                onClick={onExitEdit}
                className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-xs transition-all"
              >
                完成
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEnterEdit}
                disabled={count === 0}
                className="px-4 py-1.5 rounded-full bg-white/50 hover:bg-white/80 text-slate-600 text-xs border border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                编辑
              </button>
              <button
                onClick={onClearAll}
                disabled={count === 0}
                className="px-4 py-1.5 rounded-full bg-white/50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs border border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清空
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
