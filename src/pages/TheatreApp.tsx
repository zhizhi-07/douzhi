import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { theatreTemplates, fillTemplate } from '../data/templates'
import StatusBar from '../components/StatusBar'

export default function TheatreApp() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  // 每个模板的启用状态
  const [templateEnabled, setTemplateEnabled] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('theatre_template_enabled')
    return saved ? JSON.parse(saved) : {}
  })
  
  // 自定义关键词（从localStorage读取）
  const [customKeywords, setCustomKeywords] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('theatre_custom_keywords')
    return saved ? JSON.parse(saved) : {}
  })
  
  // 编辑关键词状态
  const [editingKeywords, setEditingKeywords] = useState<string | null>(null)
  const [keywordsInput, setKeywordsInput] = useState('')
  
  // 自定义模板
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('theatre_custom_templates')
    return saved ? JSON.parse(saved) : []
  })
  
  // 上传模板弹窗状态
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    keywords: '',
    fields: '',
    htmlTemplate: ''
  })

  // 切换模板开关
  const handleToggleTemplate = (templateId: string) => {
    const newEnabled = { ...templateEnabled, [templateId]: !templateEnabled[templateId] }
    setTemplateEnabled(newEnabled)
    localStorage.setItem('theatre_template_enabled', JSON.stringify(newEnabled))
  }
  
  // 获取模板关键词（优先使用用户自定义）
  const getTemplateKeywords = (templateId: string) => {
    return customKeywords[templateId] || theatreTemplates.find(t => t.id === templateId)?.keywords || []
  }
  
  // 开始编辑关键词
  const handleEditKeywords = (templateId: string) => {
    setEditingKeywords(templateId)
    setKeywordsInput(getTemplateKeywords(templateId).join('、'))
  }
  
  // 保存关键词
  const handleSaveKeywords = (templateId: string) => {
    const keywords = keywordsInput.split(/[、，,]/).map(k => k.trim()).filter(k => k)
    const newCustomKeywords = { ...customKeywords, [templateId]: keywords }
    setCustomKeywords(newCustomKeywords)
    localStorage.setItem('theatre_custom_keywords', JSON.stringify(newCustomKeywords))
    setEditingKeywords(null)
  }
  
  // 重置为默认关键词
  const handleResetKeywords = (templateId: string) => {
    const newCustomKeywords = { ...customKeywords }
    delete newCustomKeywords[templateId]
    setCustomKeywords(newCustomKeywords)
    localStorage.setItem('theatre_custom_keywords', JSON.stringify(newCustomKeywords))
    setEditingKeywords(null)
  }
  
  // 保存自定义模板
  const handleSaveCustomTemplate = () => {
    if (!uploadForm.name || !uploadForm.keywords || !uploadForm.htmlTemplate) {
      alert('请填写必填项：模板名称、关键词、HTML代码')
      return
    }
    
    // 解析字段
    const fieldsArray = uploadForm.fields
      .split('\n')
      .map(line => {
        const match = line.match(/^(.+?)[:：]\s*(.+)$/)
        if (match) {
          return {
            key: match[1].trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
            label: match[1].trim(),
            placeholder: match[2].trim()
          }
        }
        return null
      })
      .filter(f => f !== null)
    
    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: uploadForm.name,
      keywords: uploadForm.keywords.split(/[、，,]/).map(k => k.trim()).filter(k => k),
      fields: fieldsArray,
      htmlTemplate: uploadForm.htmlTemplate,
      isCustom: true
    }
    
    const newCustomTemplates = [...customTemplates, newTemplate]
    setCustomTemplates(newCustomTemplates)
    localStorage.setItem('theatre_custom_templates', JSON.stringify(newCustomTemplates))
    
    // 重置表单
    setUploadForm({ name: '', keywords: '', fields: '', htmlTemplate: '' })
    setShowUploadModal(false)
    alert('模板上传成功！')
  }
  
  // 删除自定义模板
  const handleDeleteCustomTemplate = (templateId: string) => {
    if (!confirm('确定要删除这个自定义模板吗？')) return
    
    const newCustomTemplates = customTemplates.filter(t => t.id !== templateId)
    setCustomTemplates(newCustomTemplates)
    localStorage.setItem('theatre_custom_templates', JSON.stringify(newCustomTemplates))
    
    // 同时删除该模板的启用状态和自定义关键词
    const newEnabled = { ...templateEnabled }
    delete newEnabled[templateId]
    setTemplateEnabled(newEnabled)
    localStorage.setItem('theatre_template_enabled', JSON.stringify(newEnabled))
    
    const newKeywords = { ...customKeywords }
    delete newKeywords[templateId]
    setCustomKeywords(newKeywords)
    localStorage.setItem('theatre_custom_keywords', JSON.stringify(newKeywords))
  }
  
  // 合并内置模板和自定义模板
  const allTemplates = [...theatreTemplates, ...customTemplates]

  // 获取模板示例HTML
  const getExampleHtml = (template: any) => {
    const exampleData: Record<string, string> = {
      receipt: `食物：炒饭
价格：25
商家：快餐店
日期：2025-11-21
时间：13:45`,
      diary: `标题：平凡的一天
内容：今天早上起床后，阳光透过窗帘洒进来，感觉特别温暖。下午去了咖啡店坐了会儿，点了一杯拿铁，翻看着手边的书。生活虽然平淡，但这样的时刻让人觉得很满足。
日期：2025年11月21日
星期：星期四
天气：晴
心情：开心`,
      menu: `菜品1：红烧肉
价格1：38
菜品2：糖醋排骨
价格2：42
菜品3：清炒时蔬
价格3：18
餐厅名：家常菜馆`,
      group_chat: `群名：好友群
群成员数：8
消息1发送者：张三
消息1内容：大家好啊
消息2发送者：李四
消息2内容：在吗
消息3发送者：张三
消息3内容：今天天气不错
消息4发送者：王五
消息4内容：确实
消息5发送者：赵六
消息5内容：出去玩吗
消息6发送者：李四
消息6内容：去哪
消息7发送者：张三
消息7内容：爬山怎么样
消息8发送者：王五
消息8内容：好主意
时间：14:30`,
      private_chat: `对方昵称：小美
消息1发送者：我
消息1内容：在吗
消息2发送者：小美
消息2内容：在呢
消息3发送者：我
消息3内容：干嘛呢
消息4发送者：小美
消息4内容：看电视
消息5发送者：小美
消息5内容：还好看吗
消息6发送者：我
消息6内容：挺好的
消息7发送者：我
消息7内容：什么类型
消息8发送者：小美
消息8内容：悬疑剧
消息9发送者：我
消息9内容：推荐吗
消息10发送者：小美
消息10内容：值得一看
时间：15:20`,
      memo: `标题：今日待办
事项1：买菜
事项2：开会
事项3：健身
日期：11月21日`,
      lucky_draw: `结果：大吉
寄语：今日诸事顺利
幸运数字：7
幸运颜色：蓝色`,
      love_letter: `收信人：亲爱的你
内容：遇见你是我最美的意外，从那天起，我的世界多了一抹温暖的色彩。
寄信人：想你的人
日期：2025.11.21`
    }
    
    return fillTemplate(template, exampleData[template.id] || '')
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 合并的状态栏+导航栏 */}
      <div className="bg-white">
        {/* 状态栏 */}
        <StatusBar />
        
        {/* 导航栏 */}
        <div className="px-6 pb-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-base font-medium text-black">小剧场</h1>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* 说明卡片 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="text-sm font-medium text-black mb-2">功能说明</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              为每个模板单独开启/关闭。启用后，AI在聊天中识别到关键词时，会自动生成对应的HTML小剧场。
              你可以点击"编辑"按钮自定义每个模板的触发关键词（用、或,分隔）。
            </p>
          </div>

          {/* 模板网格 */}
          <div className="grid grid-cols-1 gap-4">
            {allTemplates.map(template => {
              const exampleHtml = getExampleHtml(template)
              const isExpanded = selectedTemplate?.id === template.id
              
              return (
                <div key={template.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* 模板头部 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    {/* 左侧：模板信息（可点击展开） */}
                    <button
                      onClick={() => setSelectedTemplate(isExpanded ? null : template)}
                      className="flex items-center gap-3 flex-1 hover:opacity-70 transition-opacity text-left"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-black">{template.name}</h3>
                        
                        {/* 关键词编辑 */}
                        {editingKeywords === template.id ? (
                          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={keywordsInput}
                              onChange={(e) => setKeywordsInput(e.target.value)}
                              placeholder="用、或,分隔关键词"
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                            />
                            <button
                              onClick={() => handleSaveKeywords(template.id)}
                              className="px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => handleResetKeywords(template.id)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                            >
                              重置
                            </button>
                            <button
                              onClick={() => setEditingKeywords(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">
                              关键词：{getTemplateKeywords(template.id).join('、')}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditKeywords(template.id)
                              }}
                              className="text-xs text-gray-400 hover:text-black transition-colors"
                            >
                              编辑
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* 右侧：按钮组 */}
                    <div className="flex items-center gap-2">
                      {template.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomTemplate(template.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="删除模板"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          templateEnabled[template.id]
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {templateEnabled[template.id] ? '已启用' : '未启用'}
                      </button>
                    </div>
                  </div>

                  {/* 展开的预览内容 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-black mb-2">预览效果</h4>
                        <div 
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                          dangerouslySetInnerHTML={{ __html: exampleHtml }}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-black mb-2">需要的字段</h4>
                        <div className="space-y-1.5">
                          {template.fields.map((field: any) => (
                            <div key={field.key} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{field.label}</span>
                              <span className="text-gray-400 font-mono">示例：{field.placeholder}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
      
      {/* 上传模板弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-medium text-black mb-4">上传自定义模板</h2>
              
              {/* 模板名称 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">模板名称 *</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="例如：购物清单"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                />
              </div>
              
              {/* 关键词 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">触发关键词 *（用、或,分隔）</label>
                <input
                  type="text"
                  value={uploadForm.keywords}
                  onChange={(e) => setUploadForm({ ...uploadForm, keywords: e.target.value })}
                  placeholder="例如：购物、清单、买东西"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                />
              </div>
              
              {/* 字段定义 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">需要的字段（每行一个，格式：字段名:示例值）</label>
                <textarea
                  value={uploadForm.fields}
                  onChange={(e) => setUploadForm({ ...uploadForm, fields: e.target.value })}
                  placeholder="商品1:苹果\n商品2:香蕉\n商品3:牛奶"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm font-mono resize-none"
                />
              </div>
              
              {/* HTML模板 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">HTML模板代码 *</label>
                <p className="text-xs text-gray-500 mb-2">使用 {'{{'} {'{'} 字段名 {'}'} {'}'} 作为占位符，例如：{'{{'} {'{'} ITEM1 {'}'} {'}'}</p>
                <textarea
                  value={uploadForm.htmlTemplate}
                  onChange={(e) => setUploadForm({ ...uploadForm, htmlTemplate: e.target.value })}
                  placeholder={`<div style="max-width: 350px; padding: 20px;">
  <h3>{{ITEM1}}</h3>
  <p>{{ITEM2}}</p>
</div>`}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-xs font-mono resize-none"
                />
              </div>
              
              {/* 按钮 */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCustomTemplate}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  保存模板
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
