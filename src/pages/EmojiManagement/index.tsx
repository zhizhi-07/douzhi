/**
 * 表情包管理页面
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../../components/StatusBar'
import { useEmojiManagement } from './hooks'
import {
  AddMenu,
  StatsBar,
  EmojiGrid,
  AddEmojiDialog,
  EditDescDialog,
  BatchImportDialog
} from './components'

const EmojiManagement = () => {
  const navigate = useNavigate()
  const {
    emojis,
    showAddDialog,
    setShowAddDialog,
    showAddMenu,
    setShowAddMenu,
    uploadMode,
    setUploadMode,
    newEmojiUrl,
    setNewEmojiUrl,
    newEmojiName,
    setNewEmojiName,
    newEmojiDesc,
    setNewEmojiDesc,
    showBatchImportDialog,
    setShowBatchImportDialog,
    batchImportText,
    setBatchImportText,
    isEditMode,
    setIsEditMode,
    selectedEmojis,
    editingEmoji,
    setEditingEmoji,
    editDesc,
    setEditDesc,
    handleFileUpload,
    handleAddEmoji,
    handleDeleteEmoji,
    toggleSelectEmoji,
    handleBatchDelete,
    openEditDescDialog,
    handleSaveDesc,
    exitEditMode,
    handleBatchImportFromUrl,
    handleImportTxt,
    handleClearAll,
  } = useEmojiManagement()

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5] relative overflow-hidden font-sans soft-page-enter">
      <StatusBar />

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800">表情管理</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:scale-105 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {showAddMenu && (
            <AddMenu
              onClose={() => setShowAddMenu(false)}
              onAddSingle={() => setShowAddDialog(true)}
              onBatchImport={() => setShowBatchImportDialog(true)}
              onImportTxt={handleImportTxt}
            />
          )}
        </div>
      </div>

      {/* 统计操作栏 */}
      <StatsBar
        count={emojis.length}
        isEditMode={isEditMode}
        selectedCount={selectedEmojis.size}
        onBatchDelete={handleBatchDelete}
        onExitEdit={exitEditMode}
        onEnterEdit={() => setIsEditMode(true)}
        onClearAll={handleClearAll}
      />

      {/* 表情列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <EmojiGrid
          emojis={emojis}
          isEditMode={isEditMode}
          selectedEmojis={selectedEmojis}
          onToggleSelect={toggleSelectEmoji}
          onDelete={handleDeleteEmoji}
          onEditDesc={openEditDescDialog}
        />
      </div>

      {/* 添加对话框 */}
      {showAddDialog && (
        <AddEmojiDialog
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          newEmojiUrl={newEmojiUrl}
          setNewEmojiUrl={setNewEmojiUrl}
          newEmojiName={newEmojiName}
          setNewEmojiName={setNewEmojiName}
          newEmojiDesc={newEmojiDesc}
          setNewEmojiDesc={setNewEmojiDesc}
          onFileUpload={handleFileUpload}
          onSubmit={handleAddEmoji}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {/* 编辑描述对话框 */}
      {editingEmoji && (
        <EditDescDialog
          emoji={editingEmoji}
          editDesc={editDesc}
          setEditDesc={setEditDesc}
          onSave={handleSaveDesc}
          onClose={() => setEditingEmoji(null)}
        />
      )}

      {/* 批量导入对话框 */}
      {showBatchImportDialog && (
        <BatchImportDialog
          batchImportText={batchImportText}
          setBatchImportText={setBatchImportText}
          onImport={handleBatchImportFromUrl}
          onClose={() => setShowBatchImportDialog(false)}
        />
      )}
    </div>
  )
}

export default EmojiManagement
