/**
 * AI气泡编辑器 - 生成、粘贴、可视化编辑
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BubbleStyle, defaultBubbleStyle, parseCSS, generateCSS } from '../utils/cssParser'
import { apiService } from '../services/apiService'
import BubbleControls from '../components/BubbleControls'

const BubbleEditor = () => {
  const navigate = useNavigate()
  
  // 用户和AI的气泡样式
  const [userStyle, setUserStyle] = useState<BubbleStyle>(defaultBubbleStyle)
  const [aiStyle, setAiStyle] = useState<BubbleStyle>({
    ...defaultBubbleStyle,
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderWidth: 1
  })
  
  // UI状态
  const [activeTab, setActiveTab] = useState<'user' | 'ai'>('user')
  const [aiPrompt, setAiPrompt] = useState('')
  const [cssInput, setCssInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // AI生成CSS
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert('请输入气泡描述')
      return
    }
    
    setIsGenerating(true)
    try {
      const apis = apiService.getAll()
      const currentApiId = apiService.getCurrentId()
      const currentApi = apis.find(api => api.id === currentApiId)
      
      if (!currentApi) {
        alert('请先在API列表中配置API')
        return
      }
      
      const systemPrompt = `你是一个CSS样式专家。用户会描述想要的聊天气泡样式，你需要生成对应的CSS代码。

要求：
1. 只输出CSS代码，不要任何解释
2. 使用 .message-container.sent .message-bubble 选择器（用户气泡）或 .message-container.received .message-bubble 选择器（AI气泡）
3. 所有属性都加 !important
4. 支持渐变、透明度、阴影等效果
5. 气泡使用水滴形状：用户气泡右下角小圆角 (18px 18px 4px 18px)，AI气泡左下角小圆角 (18px 18px 18px 4px)
6. 示例输出：
\`\`\`css
.message-container.sent .message-bubble {
  background: linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%) !important;
  color: rgba(255, 255, 255, 0.95) !important;
  border-radius: 18px 18px 4px 18px !important;
  padding: 12px 16px !important;
  box-shadow: 0 4px 12px rgba(192, 108, 132, 0.3) !important;
}
\`\`\``

      const apiUrl = currentApi.provider === 'custom' 
        ? `${currentApi.baseUrl}/chat/completions`
        : currentApi.baseUrl
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApi.apiKey}`
        },
        body: JSON.stringify({
          model: currentApi.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })
      
      const data = await response.json()
      const cssCode = data.choices?.[0]?.message?.content || ''
      
      // 提取CSS代码块
      let cleanCSS = cssCode.replace(/```css\n?/g, '').replace(/```/g, '').trim()
      
      // 解析CSS并应用到当前样式
      const parsed = parseCSS(cleanCSS)
      if (activeTab === 'user') {
        setUserStyle({ ...userStyle, ...parsed })
      } else {
        setAiStyle({ ...aiStyle, ...parsed })
      }
      
      alert('✅ AI生成成功！')
    } catch (err) {
      console.error('AI生成失败:', err)
      alert('❌ AI生成失败，请检查API配置')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 解析粘贴的CSS
  const handleParseCSS = () => {
    if (!cssInput.trim()) {
      alert('请粘贴CSS代码')
      return
    }
    
    const parsed = parseCSS(cssInput)
    if (activeTab === 'user') {
      setUserStyle({ ...userStyle, ...parsed })
    } else {
      setAiStyle({ ...aiStyle, ...parsed })
    }
    
    alert('✅ CSS解析成功！')
  }
  
  // 复制CSS代码
  const handleCopyCSS = () => {
    const userCSS = generateCSS(userStyle, true)
    const aiCSS = generateCSS(aiStyle, false)
    const fullCSS = `/* 用户消息气泡 */\n${userCSS}\n\n/* AI消息气泡 */\n${aiCSS}`
    
    navigator.clipboard.writeText(fullCSS)
    alert('✅ CSS已复制到剪贴板！')
  }
  
  // 保存样式
  const handleSave = () => {
    const userCSS = generateCSS(userStyle, true)
    const aiCSS = generateCSS(aiStyle, false)
    
    localStorage.setItem('user_bubble_css', userCSS)
    localStorage.setItem('ai_bubble_css', aiCSS)
    
    window.dispatchEvent(new Event('bubbleStyleUpdate'))
    alert('✅ 样式已保存并应用！')
  }
  
  // 当前编辑的样式
  const currentStyle = activeTab === 'user' ? userStyle : aiStyle
  const setCurrentStyle = activeTab === 'user' ? setUserStyle : setAiStyle
  
  return (
    <div className="min-h-screen bg-[#F5F5F0] soft-page-enter">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-bold text-gray-900">气泡编辑器</h1>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyCSS}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-full transition-all active:scale-95"
            >
              复制CSS
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#FF6B35] hover:bg-[#FF5520] text-white text-sm font-semibold rounded-full transition-all active:scale-95"
            >
              保存样式
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          {/* AI生成 */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-3">AI生成气泡</h2>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="描述你想要的气泡样式，例如：&#10;&#10;粉色半透明渐变气泡，带柔和阴影&#10;科技感蓝色气泡，发光效果&#10;可爱的紫色圆润气泡"
              className="w-full h-32 px-3 py-2 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="w-full mt-3 py-3 bg-[#FF6B35] hover:bg-[#FF5520] disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all active:scale-95"
            >
              {isGenerating ? '生成中...' : '🤖 AI生成'}
            </button>
          </div>

          {/* CSS粘贴 */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-3">粘贴CSS代码</h2>
            <textarea
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              placeholder=".message-container.sent .message-bubble {&#10;  background: #FF6B9D;&#10;  color: white;&#10;  border-radius: 20px;&#10;  ...&#10;}"
              className="w-full h-32 px-3 py-2 bg-gray-50 rounded-xl text-xs font-mono resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <button
              onClick={handleParseCSS}
              className="w-full mt-3 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-semibold rounded-xl transition-all active:scale-95"
            >
              📋 解析CSS
            </button>
          </div>

          {/* 切换标签 */}
          <div className="bg-white rounded-2xl p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('user')}
                className={`py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'user'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                用户气泡
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'ai'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                AI气泡
              </button>
            </div>
          </div>
        </div>

        {/* 中间：可视化控制器 */}
        <BubbleControls
          style={currentStyle}
          onChange={setCurrentStyle}
        />

        {/* 右侧：实时预览 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg sticky top-24">
            <h2 className="text-base font-bold text-gray-900 mb-4">实时预览</h2>
            <style>
              {generateCSS(userStyle, true)}
              {'\n'}
              {generateCSS(aiStyle, false)}
            </style>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 min-h-[500px]">
              <div className="flex justify-end">
                <div className="message-container sent">
                  <div className="message-bubble">你好！这是用户消息</div>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="message-container received">
                  <div className="message-bubble">你好！这是AI回复</div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="message-container sent">
                  <div className="message-bubble">这个气泡样式怎么样？可以调整透明度、圆角、阴影等所有属性哦</div>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="message-container received">
                  <div className="message-bubble">看起来很不错！你可以在左侧输入描述让AI生成，或者直接粘贴CSS代码 ✨</div>
                </div>
              </div>
            </div>
          </div>

          {/* CSS代码预览 */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-3">生成的CSS</h2>
            <pre className="bg-[#1A1A1A] text-[#F5F5F0] p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-[400px] overflow-y-auto">
              {`/* 用户消息气泡 */\n${generateCSS(userStyle, true)}\n\n/* AI消息气泡 */\n${generateCSS(aiStyle, false)}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BubbleEditor
