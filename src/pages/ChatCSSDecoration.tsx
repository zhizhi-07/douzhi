/**
 * 聊天CSS自定义页面
 * 允许用户自定义聊天界面的顶栏、底栏输入框等CSS样式
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { playSystemSound } from '../utils/soundManager'

// 预览类型
type PreviewType = 'none' | 'status' | 'transfer' | 'bubble' | 'custom'

const ChatCSSDecoration = () => {
  const navigate = useNavigate()
  
  // 当前预览的组件
  const [previewType, setPreviewType] = useState<PreviewType>('none')
  
  // 自定义CSS
  const [customCSS, setCustomCSS] = useState({
    topBar: '',
    bottomBar: '',
    inputBox: '',
    sendButton: '',
    messageBubble: '',
    freeCSS: '',
    statusModal: '', // 状态弹窗CSS
    transferCard: '', // 转账卡片CSS
    globalBubble: '' // 全局气泡CSS
  })

  // 加载已保存的设置
  useEffect(() => {
    const saved = localStorage.getItem('chat_custom_css')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setCustomCSS(data.custom || {})
      } catch (e) {
        console.error('加载CSS设置失败:', e)
      }
    }
  }, [])

  // 保存设置
  const saveSettings = () => {
    const data = {
      custom: customCSS,
      mode: 'custom'
    }
    localStorage.setItem('chat_custom_css', JSON.stringify(data))
    
    // 应用CSS
    applyCSS()
    
    playSystemSound()
    alert('✅ CSS样式已保存！')
  }

  // 应用CSS到页面
  const applyCSS = () => {
    // 移除旧的样式
    const oldStyle = document.getElementById('chat-custom-css')
    if (oldStyle) oldStyle.remove()

    let cssText = customCSS.freeCSS || ''
    // 添加状态弹窗CSS
    if (customCSS.statusModal) cssText += '\n' + customCSS.statusModal
    // 添加转账卡片CSS
    if (customCSS.transferCard) cssText += '\n' + customCSS.transferCard
    // 添加全局气泡CSS
    if (customCSS.globalBubble) cssText += '\n' + customCSS.globalBubble

    if (cssText.trim()) {
      const style = document.createElement('style')
      style.id = 'chat-custom-css'
      style.textContent = cssText
      document.head.appendChild(style)
      console.log('✅ 聊天CSS已注入:', cssText)
    }

    // 通知其他组件CSS已更新
    window.dispatchEvent(new Event('chatCSSUpdate'))
  }

  // 重置全部设置
  const resetSettings = () => {
    setCustomCSS({
      topBar: '',
      bottomBar: '',
      inputBox: '',
      sendButton: '',
      messageBubble: '',
      freeCSS: '',
      statusModal: '',
      transferCard: '',
      globalBubble: ''
    })
    localStorage.removeItem('chat_custom_css')
    
    // 移除自定义样式
    const oldStyle = document.getElementById('chat-custom-css')
    if (oldStyle) oldStyle.remove()
    
    window.dispatchEvent(new Event('chatCSSUpdate'))
    playSystemSound()
  }

  // 单独重置某个CSS区域
  const resetSingleCSS = (field: keyof typeof customCSS) => {
    const newCSS = { ...customCSS, [field]: '' }
    setCustomCSS(newCSS)
    
    // 保存到localStorage
    const data = { custom: newCSS, mode: 'custom' }
    localStorage.setItem('chat_custom_css', JSON.stringify(data))
    
    // 重新应用CSS
    const oldStyle = document.getElementById('chat-custom-css')
    if (oldStyle) oldStyle.remove()

    let cssText = newCSS.freeCSS || ''
    if (newCSS.statusModal) cssText += '\n' + newCSS.statusModal
    if (newCSS.transferCard) cssText += '\n' + newCSS.transferCard
    if (newCSS.globalBubble) cssText += '\n' + newCSS.globalBubble

    if (cssText.trim()) {
      const style = document.createElement('style')
      style.id = 'chat-custom-css'
      style.textContent = cssText
      document.head.appendChild(style)
    }
    
    window.dispatchEvent(new Event('chatCSSUpdate'))
    playSystemSound()
  }

  // 切换预览
  const togglePreview = (type: PreviewType) => {
    setPreviewType(prev => prev === type ? 'none' : type)
    playSystemSound()
  }

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans">
      <StatusBar />

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSystemSound()
              navigate('/decoration')
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-slate-800 tracking-wide">聊天CSS</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-light tracking-wider">CHAT CSS CUSTOMIZATION</p>
          </div>
        </div>
        
        {/* 保存按钮 */}
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors shadow-sm"
        >
          保存
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        {/* 单一CSS输入框 */}
        <div className="space-y-4">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  自定义CSS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePreview('custom')}
                    className={`p-1.5 rounded-lg transition-colors ${previewType === 'custom' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="预览"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {customCSS.freeCSS && (
                    <button
                      onClick={() => resetSingleCSS('freeCSS')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="清除此项"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={customCSS.freeCSS}
                onChange={(e) => setCustomCSS({ ...customCSS, freeCSS: e.target.value })}
                placeholder={`/* 直接写CSS规则 */
.chat-topbar {
  background: #f6f6f6;
}
.chat-bottombar {
  background: #f6f6f6;
}
.chat-input-box {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 18px;
}
.chat-send-btn {
  background: #007aff;
}
.chat-emoji-btn {
  display: none;
}`}
                className="w-full h-64 px-3 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 font-mono"
              />
            </div>

            {/* 状态弹窗CSS输入框 */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  状态弹窗CSS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePreview('status')}
                    className={`p-1.5 rounded-lg transition-colors ${previewType === 'status' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="预览"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {customCSS.statusModal && (
                    <button
                      onClick={() => resetSingleCSS('statusModal')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="清除此项"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={customCSS.statusModal}
                onChange={(e) => setCustomCSS({ ...customCSS, statusModal: e.target.value })}
                placeholder={`/* 状态弹窗样式 */
.ai-status-modal {
  background: #fff !important;
  border: 2px solid #f8bbd9 !important;
}
.ai-status-outfit,
.ai-status-mood,
.ai-status-location,
.ai-status-action {
  background: #fff !important;
}`}
                className="w-full h-40 px-3 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {['.ai-status-modal', '.ai-status-outfit', '.ai-status-mood', '.ai-status-location', '.ai-status-action'].map(cls => (
                  <span key={cls} className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">{cls}</span>
                ))}
              </div>
            </div>

            {/* 转账卡片CSS输入框 */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  转账卡片CSS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePreview('transfer')}
                    className={`p-1.5 rounded-lg transition-colors ${previewType === 'transfer' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="预览"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {customCSS.transferCard && (
                    <button
                      onClick={() => resetSingleCSS('transferCard')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="清除此项"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={customCSS.transferCard}
                onChange={(e) => setCustomCSS({ ...customCSS, transferCard: e.target.value })}
                placeholder={`/* 转账卡片样式 */
.transfer-card { width: 220px; }
.transfer-card-header { background: #fea834; }
.transfer-card-amount { font-size: 24px; }`}
                className="w-full h-32 px-3 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {['.transfer-card', '.transfer-card-header', '.transfer-card-icon', '.transfer-card-title', '.transfer-card-message', '.transfer-card-body', '.transfer-card-amount', '.transfer-card-footer'].map(cls => (
                  <span key={cls} className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">{cls}</span>
                ))}
              </div>
            </div>

            {/* 全局气泡CSS输入框 */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  全局气泡CSS
                  <span className="ml-2 text-xs text-slate-400 font-normal">（角色单独设置优先级更高）</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePreview('bubble')}
                    className={`p-1.5 rounded-lg transition-colors ${previewType === 'bubble' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="预览"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {customCSS.globalBubble && (
                    <button
                      onClick={() => resetSingleCSS('globalBubble')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="清除此项"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={customCSS.globalBubble}
                onChange={(e) => setCustomCSS({ ...customCSS, globalBubble: e.target.value })}
                placeholder={`/* 全局气泡样式 - 所有角色通用 */
.message-bubble-sent {
  background: #95ec69 !important;
  border-radius: 18px 18px 4px 18px !important;
}
.message-bubble-received {
  background: #fff !important;
  border-radius: 18px 18px 18px 4px !important;
}`}
                className="w-full h-40 px-3 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {['.message-bubble-sent', '.message-bubble-received'].map(cls => (
                  <span key={cls} className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">{cls}</span>
                ))}
              </div>
            </div>

            {/* 可用类名 */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/50">
              <p className="text-xs text-slate-600 font-medium mb-2">聊天界面类名：</p>
              <div className="flex flex-wrap gap-1">
                {['.chat-topbar', '.chat-bottombar', '.chat-input-row', '.chat-input-box', '.chat-add-btn', '.chat-emoji-btn', '.chat-send-btn', '.chat-ai-btn', '.message-bubble-sent', '.message-bubble-received'].map(cls => (
                  <span key={cls} className="px-2 py-0.5 bg-white rounded text-xs font-mono text-slate-700">{cls}</span>
                ))}
              </div>
            </div>
          </div>

        {/* 重置按钮 */}
        <div className="mt-6">
          <button
            onClick={resetSettings}
            className="w-full py-3 text-sm text-red-500 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 hover:bg-red-50/50 transition-colors"
          >
            重置为默认
          </button>
        </div>

        {/* 预览弹窗 */}
        {previewType !== 'none' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setPreviewType('none')}
          >
            <div 
              className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗标题 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-slate-800">
                  {previewType === 'status' ? '状态弹窗预览' : previewType === 'transfer' ? '转账卡片预览' : previewType === 'bubble' ? '气泡样式预览' : '聊天界面预览'}
                </h3>
                <button
                  onClick={() => setPreviewType('none')}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 预览内容 */}
              <div className="bg-slate-100 rounded-xl p-4">
                {/* 状态弹窗预览 */}
                {previewType === 'status' && (
                  <div className="ai-status-modal bg-white rounded-2xl p-4 shadow-lg">
                    <div className="text-center mb-3">
                      <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-2" />
                      <div className="text-sm font-medium">角色名</div>
                    </div>
                    <div className="space-y-2">
                      <div className="ai-status-outfit bg-slate-50 rounded-lg p-2 text-xs">
                        <span className="text-slate-500">穿着：</span>白色T恤
                      </div>
                      <div className="ai-status-mood bg-slate-50 rounded-lg p-2 text-xs">
                        <span className="text-slate-500">心情：</span>开心 😊
                      </div>
                      <div className="ai-status-location bg-slate-50 rounded-lg p-2 text-xs">
                        <span className="text-slate-500">地点：</span>家里
                      </div>
                      <div className="ai-status-action bg-slate-50 rounded-lg p-2 text-xs">
                        <span className="text-slate-500">正在：</span>看电视
                      </div>
                    </div>
                  </div>
                )}

                {/* 转账卡片预览 */}
                {previewType === 'transfer' && (
                  <div className="flex justify-center">
                    <div 
                      className="transfer-card overflow-hidden bg-white shadow-sm"
                      style={{ width: '200px', borderRadius: '16px' }}
                    >
                      <div className="transfer-card-content" style={{ padding: '16px' }}>
                        <div className="transfer-card-header flex items-center gap-3 mb-3">
                          <div className="transfer-card-icon w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            ¥
                          </div>
                          <div className="transfer-card-info flex-1">
                            <div className="transfer-card-title text-sm text-gray-900 font-medium">转账</div>
                            <div className="transfer-card-message text-xs text-gray-500 mt-0.5">
                              你发起了一笔转账
                            </div>
                          </div>
                        </div>
                        <div className="transfer-card-body border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="transfer-card-amount text-2xl font-semibold text-gray-900">
                              ¥66.00
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 气泡样式预览 */}
                {previewType === 'bubble' && (
                  <div className="space-y-3 py-2">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex-shrink-0" />
                      <div className="message-bubble-received bg-white rounded-2xl rounded-tl-none px-3 py-2 text-sm max-w-[80%]">
                        这是对方发的消息～
                      </div>
                    </div>
                    <div className="flex items-start gap-2 flex-row-reverse">
                      <div className="w-8 h-8 bg-green-400 rounded-full flex-shrink-0" />
                      <div className="message-bubble-sent bg-green-500 text-white rounded-2xl rounded-tr-none px-3 py-2 text-sm max-w-[80%]">
                        这是我发的消息
                      </div>
                    </div>
                  </div>
                )}

                {/* 聊天界面预览 */}
                {previewType === 'custom' && (
                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="chat-topbar bg-white px-4 py-2 flex items-center justify-between border-b border-slate-100">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-xs font-medium">联系人</span>
                      <div className="w-4" />
                    </div>
                    <div className="p-2 space-y-2 bg-slate-50" style={{ minHeight: '100px' }}>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-slate-200 rounded-full" />
                        <div className="message-bubble bg-white rounded-xl rounded-tl-none px-2 py-1 text-xs">
                          你好呀～
                        </div>
                      </div>
                      <div className="flex items-start gap-2 flex-row-reverse">
                        <div className="w-6 h-6 bg-green-400 rounded-full" />
                        <div className="message-bubble bg-green-500 text-white rounded-xl rounded-tr-none px-2 py-1 text-xs">
                          嗨！
                        </div>
                      </div>
                    </div>
                    <div className="chat-bottombar bg-white px-2 py-1.5 flex items-center gap-1 border-t border-slate-100">
                      <div className="chat-add-btn w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-slate-400 text-[10px]">+</span>
                      </div>
                      <div className="chat-input-box flex-1 h-6 bg-slate-100 rounded-full px-2 text-[10px] text-slate-400 flex items-center">
                        输入消息...
                      </div>
                      <div className="chat-send-btn w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setPreviewType('none')}
                className="w-full mt-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatCSSDecoration
