/**
 * 自定义提示词设置页面
 * 允许用户自定义私聊系统提示词
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

// 默认提示词模块
const DEFAULT_PROMPT_MODULES: PromptModules = {
  roleIntro: `你是「{charName}」，正拿着手机回复 {userNickname}。

**【场景逻辑锁定】**
1. **物理隔绝**：你们**不在**同一空间，**严禁**描写对方的动作、神态或身体接触（你看不见）。
2. **状态感知**：你的困意、情绪与行为必须符合当前 **{hour}点** 的作息逻辑。
3. **视角限制**：仅描写你身边的环境和此刻自己在做什么。

## ❗ 禁止输出（系统自动标记，你绝对不要写）
- 「(19秒后)」「(5分钟后)」「(1小时后)」← 这是**系统自动加的时间间隔**，你**绝对禁止**输出
- 「[20:57]」「[HH:MM]」← 时间戳也是系统加的，**禁止输出**
- 这些标记只是让你知道过了多久，不是让你写出来！`,

  identitySettings: `## [核心身份设定]
- **角色真名**：{charRealName}
- **角色网名**：{charNickname}
- **性格**：{personality}  
- **世界**：{world}
- **签名**：{signature}
- **状态**：{statusText}
- **时空**：{dateStr}（{weekdayStr}）{timeOfDay} {currentTime}

## [用户信息]
- **用户真名**：{userRealName}
- **用户网名**：{userNickname}
- **用户人设**：{userPersona}`,

  commands: `【可用指令】

- [状态:在哪|服装:穿什么|心理:想什么|动作:做什么] — 更新状态
- [网名:xxx] — 修改网名
- [个性签名:xxx] — 修改签名
- [换头像:用户头像] / [换头像:图片:消息ID] — 换头像（用对方头像/用对方发的图片）
- [撤回消息:内容:理由] — 撤回消息
- [引用:关键词 回复:内容] — 引用回复，如[引用:吃饭了吗 回复:吃了呀，你呢]
- [随笔:内容] — 记录随笔
{aiMemosContext}
- [转账:金额:说明] — 转账
- [亲密付:月额度] — 开通亲密付
- [外卖:商品,价格:备注] — 点外卖
- [代付:商品,价格:备注] — 请求代付
- [语音:话] — 发语音
- [照片:描述] — 发照片
- [位置:地点] — 发位置
- [表情:描述] — 发表情包
{emojiListPrompt}
- [发帖:内容] — 发论坛帖子
{aiMomentsPostPrompt}
- [拍一拍:后缀] — 拍对方，后缀必填！如[拍一拍:的小脑袋]显示"XX拍了拍YY的小脑袋"
- [分享音乐:歌名:歌手] — 分享音乐
- [一起听:歌名:歌手] — 邀请一起听歌
- [忙碌:场景描述] — 忙碌状态
- [拉黑] / [解除拉黑] — 拉黑操作
- [视频通话:旁白:说的话] — 发起视频通话`,

  customPrompt: `# 💬 自定义提示词
在这里填写你的自定义提示词，可以覆盖或补充系统默认的提示词。

## 示例用法：

### 1. 聊天风格
每次回复不要超过3条消息
说话简洁有力

### 2. 核心原则  
永远不要主动提起前任
遇到敏感话题就转移话题

### 3. 情绪设定
今天心情很好，说话会更活泼
最近在减肥，看到美食会纠结

### 4. 语言习惯
喜欢用"哈哈哈"而不是"哈哈"
经常说"完了""救命"之类的口头禅

你可以在这里自由发挥，添加任何你想要的提示词！`,

  statusBar: `# ⏳ 状态栏
**当前**：{statusText}
**距上次**：{timeSinceLastMessage}
{lastGapHint}

⚠️ 【状态指令】(必须严格执行)
必须包含4个维度，格式如下：
[状态:在哪里|服装:穿什么|心理:想什么|动作:做什么]
例：[状态:家里客厅|服装:灰色卫衣+黑色短裤|心理:今天好累...|动作:躺在沙发上刷手机]

❌ **格式禁区**：
- 严禁缺项！心理描写必须30字以上。
- 严禁只有地点没有细节。

⏱️ **你的世界是流动的，不以用户为中心！**
**🔥 严禁表现得像"用户一不说话，你就静止在原地"！**

**1. 拒绝"时间暂停"**
如果用户隔了一会儿才回（哪怕只有几分钟），你的生活必须已经向前推进了。
- ❌ 错误："你终于回了，我还在看着这锅面。"
- ✅ 正确："你回得太慢，面早糊了，我已经倒掉叫外卖了。"

**2. 状态自然演变**：
- 煮面 → 吃面 → 吃完在刷碗
- 洗澡 → 擦头发 → 躺床上刷手机
- 开会 → 会议结束 → 走出会议室

**3. 时间间隔判断**：
- **几分钟**：小动作推进
- **10-30分钟**：事情应该有进展或结束了
- **1小时+**：可以大场景转换

📝 **四维度填写指南**：
- **地点**：具体且真实（不要只写"外面"，要写"出租车后排"）
- **服装**：上衣+下装+状态
- **心理**：🔴每轮必须重新填写！30-50字新内容
- **动作**：身体姿态 + 手部微动作`
}

const STORAGE_KEY = 'custom_chat_prompt'

interface PromptModules {
  roleIntro: string
  identitySettings: string
  commands: string
  customPrompt: string
  statusBar: string
}

// 模块元信息
const MODULE_META: Record<keyof PromptModules, { label: string; desc: string }> = {
  roleIntro: { label: '角色开场', desc: '「你是xxx」场景逻辑和禁止输出规则' },
  identitySettings: { label: '身份设定', desc: '角色名、性格、世界、状态等核心信息' },
  customPrompt: { label: '自定义提示词', desc: '自由添加任何你想要的提示词' },
  statusBar: { label: '状态栏', desc: '当前状态、距上次间隔等信息' },
  commands: { label: '功能指令', desc: '状态、转账、媒体、论坛等可用指令' }
}

const CustomPromptSettings = () => {
  const navigate = useNavigate()
  const [showStatusBar] = useState(() => {
    const saved = localStorage.getItem('show_status_bar')
    return saved !== 'false'
  })
  
  const [modules, setModules] = useState<PromptModules>(DEFAULT_PROMPT_MODULES)
  const [activeTab, setActiveTab] = useState<keyof PromptModules>('roleIntro')
  const [enableCustomPrompt, setEnableCustomPrompt] = useState(false)
  const [saved, setSaved] = useState(false)

  // 加载保存的设置
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setEnableCustomPrompt(parsed.enabled ?? false)
        if (parsed.modules) {
          setModules({ ...DEFAULT_PROMPT_MODULES, ...parsed.modules })
        }
      }
    } catch (e) {
      console.error('加载自定义提示词失败:', e)
    }
  }, [])

  // 保存设置
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: enableCustomPrompt,
        modules
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('保存失败:', e)
    }
  }

  // 重置为默认值
  const handleReset = () => {
    if (confirm('确定要重置为默认提示词吗？')) {
      setModules(DEFAULT_PROMPT_MODULES)
    }
  }

  // 构建 tabs 数组
  const tabs = Object.keys(MODULE_META).map(key => ({
    key: key as keyof PromptModules,
    ...MODULE_META[key as keyof PromptModules]
  }))

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] relative overflow-hidden font-sans soft-page-enter">
      {showStatusBar && <StatusBar />}

      {/* 顶部导航栏 */}
      <div className="relative z-20 px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customize')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-all text-slate-600 shadow-sm border border-white/60"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">自定义提示词</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-all"
            title="重置默认"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`h-9 px-5 text-sm font-semibold rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 ${
              saved 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105'
            }`}
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>已保存</span>
              </>
            ) : (
              <span>保存</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        {/* 控制区背景 */}
        <div className="bg-white/40 backdrop-blur-md border-b border-white/50 px-6 py-4 space-y-4">
          
          {/* 开关行 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner ${
                 enableCustomPrompt ? 'bg-blue-500 text-white shadow-blue-500/30' : 'bg-slate-200 text-slate-400'
               }`}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
               </div>
               <div>
                <h3 className="font-semibold text-slate-800 text-sm">启用自定义提示词</h3>
                <p className="text-[10px] text-slate-500 font-medium">覆盖系统默认逻辑</p>
              </div>
            </div>
            
            <button
              onClick={() => setEnableCustomPrompt(!enableCustomPrompt)}
              className={`w-12 h-7 rounded-full transition-all duration-300 relative shadow-inner ${
                enableCustomPrompt ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${
                enableCustomPrompt ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Tab 导航 - 胶囊样式 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-linear-fade -mx-2 px-2">
            {tabs.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md shadow-slate-200 transform scale-[1.02]'
                      : 'bg-white/60 text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 编辑区域 - 沉浸式 */}
        <div className="flex-1 overflow-hidden relative bg-white/30">
          <div className="absolute inset-0 p-6 pb-24 overflow-y-auto custom-scrollbar">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 min-h-full flex flex-col overflow-hidden relative">
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="px-5 py-4 border-b border-slate-100/80 relative z-10 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">EDITING</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{tabs.find(t => t.key === activeTab)?.desc}</span>
                  </div>
                </div>
              </div>

              <textarea
                value={modules[activeTab]}
                onChange={(e) => setModules(prev => ({
                  ...prev,
                  [activeTab]: e.target.value
                }))}
                placeholder="在此输入内容..."
                className="flex-1 w-full bg-transparent p-5 text-sm text-slate-700 focus:outline-none font-mono leading-relaxed placeholder:text-slate-300 resize-none relative z-10"
                spellCheck={false}
              />
            </div>

             {/* 提示信息 - 放在底部 */}
            <div className="mt-6 px-2 mb-8">
              <div className="flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  提示：支持使用 <code className="bg-slate-200/50 px-1 rounded text-slate-600">{'{charName}'}</code> 等变量。修改核心逻辑可能会影响 AI 的稳定性，请谨慎操作。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomPromptSettings
