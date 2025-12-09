/**
 * 添加表情包对话框
 */

interface AddEmojiDialogProps {
  uploadMode: 'url' | 'file'
  setUploadMode: (mode: 'url' | 'file') => void
  newEmojiUrl: string
  setNewEmojiUrl: (url: string) => void
  newEmojiName: string
  setNewEmojiName: (name: string) => void
  newEmojiDesc: string
  setNewEmojiDesc: (desc: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onClose: () => void
}

export const AddEmojiDialog = ({
  uploadMode,
  setUploadMode,
  newEmojiUrl,
  setNewEmojiUrl,
  newEmojiName,
  setNewEmojiName,
  newEmojiDesc,
  setNewEmojiDesc,
  onFileUpload,
  onSubmit,
  onClose
}: AddEmojiDialogProps) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[999] transition-all"
        onClick={onClose}
      />
      <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[1000] bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-medium text-slate-800 mb-6 text-center tracking-wide">新添收藏</h2>

        <div className="space-y-5">
          {/* 切换器 */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl">
            <button
              onClick={() => {
                setUploadMode('url')
                setNewEmojiUrl('')
              }}
              className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${uploadMode === 'url'
                  ? 'bg-white shadow-sm text-slate-800 font-medium'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              网络链接
            </button>
            <button
              onClick={() => {
                setUploadMode('file')
                setNewEmojiUrl('')
              }}
              className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 ${uploadMode === 'file'
                  ? 'bg-white shadow-sm text-slate-800 font-medium'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              本地选取
            </button>
          </div>

          {/* 输入区域 */}
          {uploadMode === 'url' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 ml-1">图片链接</label>
              <input
                type="text"
                value={newEmojiUrl}
                onChange={(e) => setNewEmojiUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 ml-1">选取文件</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                >
                  {newEmojiUrl ? (
                    <img src={newEmojiUrl} alt="预览" className="h-20 object-contain rounded-lg shadow-sm" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-slate-400">点击选择图片</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">名称 (可选)</label>
            <input
              type="text"
              value={newEmojiName}
              onChange={(e) => setNewEmojiName(e.target.value)}
              placeholder="给它起个名字..."
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">
              描述与含义 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={newEmojiDesc}
              onChange={(e) => setNewEmojiDesc(e.target.value)}
              placeholder="描述这个图片的含义，帮助AI理解何时使用它..."
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-3 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
          >
            确认收藏
          </button>
        </div>
      </div>
    </>
  )
}
