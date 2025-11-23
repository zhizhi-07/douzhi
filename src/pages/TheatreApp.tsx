import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { theatreTemplates, fillTemplate } from '../data/theatreTemplates'
import StatusBar from '../components/StatusBar'
import TheatreMessage from '../components/TheatreMessage'
import { Message } from '../types/chat'

export default function TheatreApp() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({})
  
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
  
  // 搜索过滤
  const filteredTemplates = allTemplates.filter(template => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query) ||
      getTemplateKeywords(template.id).some(k => k.toLowerCase().includes(query))
    )
  })
  
  // 按分类分组
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    const category = template.category || '其他'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, any[]>)

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
日期：2025.11.21`,
      tarot_reading: `问题：我的运势如何
牌1名称：愚者
牌1解读：新的开始，充满无限可能
牌2名称：力量
牌2解读：内在的力量，克服困难
牌3名称：命运之轮
牌3解读：转机即将到来，把握机会`,
      newspaper: `报纸名称：豆汁日报
日期：2025年11月23日
头条标题：小剧场大更新
副标题：六款新模板震撼上线
正文内容：今日，豆汁小剧场迎来了重大更新，新增了塔罗牌、复古游戏机、通缉令等六款精美模板。用户纷纷表示：太好玩了！
图片说明：更新发布会现场`,
      retro_game: `游戏名称：TETRIS
得分：12345
关卡：05
玩家：PLAYER1`,
      wanted_poster: `姓名：路飞
赏金：3,000,000,000
罪名：偷走我的心
状态：DEAD OR ALIVE`,
      polaroid_photo: `手写备注：美好的一天
日期：2025.11.23
地点：迪士尼乐园`,
      award_certificate: `获奖人：张三
奖项名称：最佳摸鱼奖
获奖原因：在工作中表现出色的摸鱼技巧，特发此证，以资鼓励。
颁发机构：豆汁摸鱼委员会
日期：二〇二五年十一月二十三日`
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

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* 搜索框 */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板、分类或关键词..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 按分类展示模板 */}
          {Object.entries(templatesByCategory).map(([category, templates]) => {
            const templateList = templates as any[]
            return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <h2 className="text-sm font-medium text-gray-900">{category}</h2>
                <span className="text-xs text-gray-400">({templateList.length})</span>
              </div>
              
              <div className="space-y-2">
                {templateList.map((template: any) => {
                  const exampleHtml = getExampleHtml(template)
                  const isExpanded = selectedTemplate?.id === template.id
                  const fieldsExpanded = expandedFields[template.id]
              
              return (
                <div key={template.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100"
                            />
                            <button
                              onClick={() => handleSaveKeywords(template.id)}
                              className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => handleResetKeywords(template.id)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                            >
                              重置
                            </button>
                            <button
                              onClick={() => setEditingKeywords(null)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {getTemplateKeywords(template.id).join(' · ')}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditKeywords(template.id)
                              }}
                              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
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
                    <div className="px-4 pb-4 pt-3 bg-gray-50/50">
                      <div className="mt-1">
                        <h4 className="text-xs font-medium text-gray-700 mb-3">预览效果</h4>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <TheatreMessage 
                            message={{
                              id: Date.now(),
                              type: 'received',
                              sender: 'ai',
                              content: '',
                              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                              timestamp: Date.now(),
                              theatre: {
                                templateId: template.id,
                                templateName: template.name,
                                htmlContent: exampleHtml,
                                rawData: ''
                              }
                            } as Message}
                          />
                        </div>
                      </div>
                      
                      {/* 字段区域：默认折叠 */}
                      <div className="mt-4">
                        <button
                          onClick={() => setExpandedFields({
                            ...expandedFields,
                            [template.id]: !fieldsExpanded
                          })}
                          className="flex items-center justify-between w-full text-left hover:opacity-70"
                        >
                          <h4 className="text-xs font-medium text-black">需要的字段 ({template.fields.length})</h4>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              fieldsExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {fieldsExpanded && (
                          <div className="space-y-1.5 mt-2">
                            {template.fields.map((field: any) => (
                              <div key={field.key} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{field.label}</span>
                                <span className="text-gray-400 font-mono">示例：{field.placeholder}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
              </div>
            </div>
            )
          })}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">模板名称 *</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="例如：购物清单"
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100 text-sm"
                />
              </div>
              
              {/* 关键词 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">触发关键词 *（用、或,分隔）</label>
                <input
                  type="text"
                  value={uploadForm.keywords}
                  onChange={(e) => setUploadForm({ ...uploadForm, keywords: e.target.value })}
                  placeholder="例如：购物、清单、买东西"
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100 text-sm"
                />
              </div>
              
              {/* 字段定义 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">需要的字段（每行一个，格式：字段名:示例值）</label>
                <textarea
                  value={uploadForm.fields}
                  onChange={(e) => setUploadForm({ ...uploadForm, fields: e.target.value })}
                  placeholder="商品1:苹果\n商品2:香蕉\n商品3:牛奶"
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100 text-sm font-mono resize-none"
                />
              </div>
              
              {/* HTML模板 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">HTML模板代码 *</label>
                <p className="text-xs text-gray-500 mb-2">使用 {'{{'} {'{'} 字段名 {'}'} {'}'} 作为占位符，例如：{'{{'} {'{'} ITEM1 {'}'} {'}'}</p>
                <textarea
                  value={uploadForm.htmlTemplate}
                  onChange={(e) => setUploadForm({ ...uploadForm, htmlTemplate: e.target.value })}
                  placeholder={`<div style="max-width: 350px; padding: 20px;">
  <h3>{{ITEM1}}</h3>
  <p>{{ITEM2}}</p>
</div>`}
                  rows={10}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100 text-xs font-mono resize-none"
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
