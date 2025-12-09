/**
 * 添加菜单下拉组件
 */

interface AddMenuProps {
  onClose: () => void
  onAddSingle: () => void
  onBatchImport: () => void
  onImportTxt: () => void
}

export const AddMenu = ({ onClose, onAddSingle, onBatchImport, onImportTxt }: AddMenuProps) => {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-3 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 z-50 overflow-hidden transform origin-top-right transition-all">
        <button
          onClick={() => {
            onClose()
            onAddSingle()
          }}
          className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
        >
          <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <span className="text-sm text-slate-700">新增图片</span>
        </button>
        <button
          onClick={() => {
            onClose()
            onBatchImport()
          }}
          className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
        >
          <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <span className="text-sm text-slate-700">批量导入URL</span>
        </button>
        <div className="h-px bg-slate-100 mx-4" />
        <button
          onClick={() => {
            onClose()
            onImportTxt()
          }}
          className="w-full px-5 py-3.5 text-left hover:bg-white/50 flex items-center gap-3 transition-colors group"
        >
          <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <span className="text-sm text-slate-700">导入TXT</span>
        </button>
      </div>
    </>
  )
}
