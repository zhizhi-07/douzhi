/**
 * 批量导入URL对话框
 */

interface BatchImportDialogProps {
  batchImportText: string
  setBatchImportText: (text: string) => void
  onImport: () => void
  onClose: () => void
}

export const BatchImportDialog = ({
  batchImportText,
  setBatchImportText,
  onImport,
  onClose
}: BatchImportDialogProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[999] transition-all"
        onClick={onClose}
      />
      <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[1000] bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-medium text-slate-800 mb-4 text-center tracking-wide">批量导入表情包</h2>
        
        <div className="mb-4 p-3 bg-slate-50/80 rounded-xl text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-600">格式说明：</div>
          <div>每行一个，格式：<span className="text-blue-600">名称：URL</span></div>
          <div className="text-slate-400">例：萌物：https://example.com/1.jpg</div>
        </div>

        <textarea
          value={batchImportText}
          onChange={(e) => setBatchImportText(e.target.value)}
          placeholder={`开心：https://example.com/happy.jpg\n难过：https://example.com/sad.jpg\n生气：https://example.com/angry.jpg`}
          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm font-mono"
        />

        <div className="text-xs text-slate-400 mt-2 text-right">
          {batchImportText.split('\n').filter(l => l.trim()).length} 条
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onImport}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
          >
            开始导入
          </button>
        </div>
      </div>
    </>
  )
}
