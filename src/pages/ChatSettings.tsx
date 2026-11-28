/**
 * 聊天设置页面
 * 功能：消息条数控制、API设置等
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { blacklistManager } from '../utils/blacklistManager'
import { 
  setChatWallpaper, 
  createCustomWallpaper,
  clearChatWallpaper,
  hasChatWallpaper
} from '../utils/wallpaperManager'
import BubbleSettings from './ChatSettings/BubbleSettings'
import AvatarFrameSettings from './ChatSettings/AvatarFrameSettings'
import { clearMessages } from '../utils/simpleMessageManager'
import { testVoiceConfig } from '../utils/voiceApi'
import { voiceService } from '../services/voiceService'
import { exportCharacterData, downloadCharacterData } from '../utils/characterDataExporter'
import { getAllCharacters } from '../utils/characterManager'
import { getMasksWithAvatars, Mask } from '../utils/maskManager'

interface ChatSettingsData {
  messageLimit: number  // 读取的消息条数
  momentsVisibleCount: number  // AI可见的朋友圈条数
  aiCanPostMoments: boolean  // AI是否可以主动发朋友圈
  autoMemorySummary: boolean  // 是否启用自动记忆总结
  memorySummaryInterval: number  // 每N轮对话自动生成总结
  voiceId: string  // 角色专属音色ID
  hideTokenStats: boolean  // 是否隐藏Token统计
  enableTheatreCards: boolean  // 是否启用小剧场卡片功能（已废弃）
  hideTheatreHistory: boolean  // 是否隐藏小剧场历史记录（已废弃）
  enableHtmlTheatre: boolean  // 是否启用中插HTML小剧场
  htmlTheatreMode: 'off' | 'always' | 'smart'  // 小剧场模式：关闭/每条必发/根据语境
  characterIndependence: boolean  // 角色独立：AI可以选择不立即回复
  useMask: boolean  // 是否使用面具
  maskId: string | null  // 当前使用的面具ID
  groupChatSync: {
    enabled: boolean  // 是否启用群聊消息同步
    messageCount: number  // 同步消息条数
  }
  aiProactiveMessage: {
    enabled: boolean  // 是否启用AI主动发消息
    mode: 'fixed' | 'thinking'  // 模式：fixed=固定时间必发，thinking=AI思考是否发
    interval: number  // 时间间隔（分钟）
  }
  messageDelay: {
    enabled: boolean  // 是否启用消息延迟
    minDelay: number  // 最小延迟（秒）
    maxDelay: number  // 最大延迟（秒）
  }
}

const ChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 从localStorage读取设置
  const getSettings = (): ChatSettingsData => {
    const saved = localStorage.getItem(`chat_settings_${id}`)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        messageLimit: data.messageLimit ?? 50,
        momentsVisibleCount: data.momentsVisibleCount ?? 10,
        aiCanPostMoments: data.aiCanPostMoments ?? false,
        autoMemorySummary: data.autoMemorySummary ?? false,
        memorySummaryInterval: data.memorySummaryInterval ?? 30,
        voiceId: data.voiceId ?? '',
        hideTokenStats: data.hideTokenStats ?? false,
        enableTheatreCards: data.enableTheatreCards ?? false,
        hideTheatreHistory: data.hideTheatreHistory ?? false,
        enableHtmlTheatre: data.enableHtmlTheatre ?? false,
        htmlTheatreMode: data.htmlTheatreMode ?? 'off',
        characterIndependence: data.characterIndependence ?? false,
        useMask: data.useMask ?? false,
        maskId: data.maskId ?? null,
        groupChatSync: data.groupChatSync ?? {
          enabled: false,
          messageCount: 20
        },
        aiProactiveMessage: data.aiProactiveMessage ?? {
          enabled: false,
          mode: 'thinking',
          interval: 5
        },
        messageDelay: data.messageDelay ?? {
          enabled: false,
          minDelay: 1,
          maxDelay: 3
        }
      }
    }
    return {
      messageLimit: 50,
      momentsVisibleCount: 10,
      aiCanPostMoments: false,
      autoMemorySummary: false,
      memorySummaryInterval: 30,
      voiceId: '',
      hideTokenStats: false,
      enableTheatreCards: false,
      hideTheatreHistory: false,
      enableHtmlTheatre: false,
      htmlTheatreMode: 'off',
      characterIndependence: false,
      useMask: false,
      maskId: null,
      groupChatSync: {
        enabled: false,
        messageCount: 20
      },
      aiProactiveMessage: {
        enabled: false,
        mode: 'thinking',
        interval: 5
      },
      messageDelay: {
        enabled: false,
        minDelay: 1,
        maxDelay: 3
      }
    }
  }
  
  const [settings, setSettings] = useState<ChatSettingsData>(() => {
    // 🔥 使用函数形式初始化，确保id存在时才读取
    if (id) {
      const saved = localStorage.getItem(`chat_settings_${id}`)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          return {
            messageLimit: data.messageLimit ?? 50,
            momentsVisibleCount: data.momentsVisibleCount ?? 10,
            aiCanPostMoments: data.aiCanPostMoments ?? false,
            autoMemorySummary: data.autoMemorySummary ?? false,
            memorySummaryInterval: data.memorySummaryInterval ?? 30,
            voiceId: data.voiceId ?? '',
            hideTokenStats: data.hideTokenStats ?? false,
            enableTheatreCards: data.enableTheatreCards ?? false,
            hideTheatreHistory: data.hideTheatreHistory ?? false,
            enableHtmlTheatre: data.enableHtmlTheatre ?? false,
            htmlTheatreMode: data.htmlTheatreMode ?? 'off',
            characterIndependence: data.characterIndependence ?? false,
            useMask: data.useMask ?? false,
            maskId: data.maskId ?? null,
            groupChatSync: data.groupChatSync ?? {
              enabled: false,
              messageCount: 20
            },
            aiProactiveMessage: data.aiProactiveMessage ?? {
              enabled: false,
              mode: 'thinking',
              interval: 5
            },
            messageDelay: data.messageDelay ?? {
              enabled: false,
              minDelay: 1,
              maxDelay: 3
            }
          }
        } catch (e) {
          console.error('[ChatSettings] 解析设置失败:', e)
        }
      }
    }
    // 默认设置
    return {
      messageLimit: 50,
      momentsVisibleCount: 10,
      aiCanPostMoments: false,
      autoMemorySummary: false,
      memorySummaryInterval: 30,
      voiceId: '',
      hideTokenStats: false,
      enableTheatreCards: false,
      hideTheatreHistory: false,
      enableHtmlTheatre: false,
      htmlTheatreMode: 'off',
      characterIndependence: false,
      useMask: false,
      maskId: null,
      groupChatSync: {
        enabled: false,
        messageCount: 20
      },
      aiProactiveMessage: {
        enabled: false,
        mode: 'thinking',
        interval: 5
      },
      messageDelay: {
        enabled: false,
        minDelay: 1,
        maxDelay: 3
      }
    }
  })
  
  // 记忆总结间隔的输入框字符串状态（解决手机端无法临时删光数字的问题）
  const [memoryIntervalInput, setMemoryIntervalInput] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [testingVoice, setTestingVoice] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [character, setCharacter] = useState<any>(null)
  const [pokeSuffix, setPokeSuffix] = useState('')
  const [languageStyle, setLanguageStyle] = useState<'modern' | 'ancient' | 'noble' | 'fantasy' | 'auto'>('auto')
  const [masks, setMasks] = useState<Mask[]>([])
  const [hasWallpaper, setHasWallpaper] = useState(false)
  
  // 加载面具列表
  useEffect(() => {
    const loadMasks = async () => {
      const masksWithAvatars = await getMasksWithAvatars()
      setMasks(masksWithAvatars)
    }
    loadMasks()
  }, [])

  // 检查拉黑状态和置顶状态，加载角色信息
  useEffect(() => {
    if (id) {
      // 🔥 修复：使用 character_ 前缀，与 useChatAI.ts 中的检查保持一致
      const blocked = blacklistManager.isBlockedByMe('user', `character_${id}`)
      setIsBlocked(blocked)
      
      // 检查是否有自定义壁纸
      setHasWallpaper(hasChatWallpaper(id))
      
      // 加载角色信息
      const loadCharacter = async () => {
        const characters = await getAllCharacters()
        const char = characters.find(c => c.id === id)
        if (char) {
          setCharacter(char)
          setPokeSuffix(char.pokeSuffix || '')
          setLanguageStyle(char.languageStyle || 'auto')
        }
      }
      loadCharacter()
      
      // 读取置顶状态（从IndexedDB）
      const loadPinnedStatus = async () => {
        try {
          const { loadChatList } = await import('../utils/chatListManager')
          const chatList = await loadChatList()
          const currentChat = chatList.find((chat: any) => chat.id === id)
          setIsPinned(currentChat?.isPinned || false)
          console.log('📌 加载置顶状态:', { chatId: id, isPinned: currentChat?.isPinned || false })
        } catch (error) {
          console.error('❌ 加载置顶状态失败:', error)
        }
      }
      loadPinnedStatus()
    }
  }, [id])

  // 当内存中的设置发生变化（例如默认值或其他地方更新）时，同步到输入框
  useEffect(() => {
    setMemoryIntervalInput(String(settings.memorySummaryInterval))
  }, [settings.memorySummaryInterval])

  // 当id变化时重新加载设置
  useEffect(() => {
    if (id) {
      const loadedSettings = getSettings()
      setSettings(loadedSettings)
      // 同步输入框显示值
      setMemoryIntervalInput(String(loadedSettings.memorySummaryInterval))
      console.log('[ChatSettings] 🔄 重新加载设置:', {
        chatId: id,
        voiceId: loadedSettings.voiceId, // 🔥 调试voiceId
        aiProactiveMessage: loadedSettings.aiProactiveMessage,
        从localStorage读取: localStorage.getItem(`chat_settings_${id}`)?.substring(0, 100)
      })
      
      // 🔥 专门调试voiceId
      const rawData = localStorage.getItem(`chat_settings_${id}`)
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData)
          console.log('[ChatSettings] 🎤 VoiceId调试:', {
            原始数据中的voiceId: parsed.voiceId,
            加载后的voiceId: loadedSettings.voiceId,
            数据是否存在: !!parsed.voiceId
          })
        } catch (e) {
          console.error('[ChatSettings] JSON解析失败:', e)
        }
      } else {
        console.log('[ChatSettings] ⚠️ localStorage中没有找到设置数据')
      }
    }
  }, [id])
  
  // 保存设置
  const saveSettings = (newSettings: ChatSettingsData) => {
    localStorage.setItem(`chat_settings_${id}`, JSON.stringify(newSettings))
    setSettings(newSettings)
  }
  
  // 切换拉黑状态
  const toggleBlock = () => {
    if (!id) return
    // 🔥 修复：使用 character_ 前缀，与 useChatAI.ts 中的检查保持一致
    const newBlockStatus = blacklistManager.toggleBlock('user', `character_${id}`)
    setIsBlocked(newBlockStatus)
    // 触发拉黑状态变化事件
    window.dispatchEvent(new CustomEvent('blacklist-changed'))
  }

  // 测试语音配置
  const handleTestVoice = async () => {
    console.log('[聊天设置] 当前settings对象:', settings)
    console.log('[聊天设置] 音色ID:', settings.voiceId)
    console.log('[聊天设置] localStorage中的值:', localStorage.getItem(`chat_settings_${id}`))
    
    if (!settings.voiceId) {
      alert('请先输入音色ID')
      return
    }

    // 读取全局语音配置
    const voiceConfig = voiceService.getCurrent()
    if (!voiceConfig?.apiKey || !voiceConfig?.groupId) {
      alert('请先配置语音账号：\n\n系统设置 → 语音设置 → 填写API Key和Group ID')
      return
    }

    console.log('[聊天设置] 准备测试音色:', {
      voiceId: settings.voiceId,
      apiKey: voiceConfig.apiKey.substring(0, 10) + '...',
      groupId: voiceConfig.groupId
    })

    setTestingVoice(true)
    try {
      await testVoiceConfig(voiceConfig.apiKey, voiceConfig.groupId, settings.voiceId)
      alert('音色测试成功！配置正确，已播放测试音频。')
    } catch (error) {
      console.error('音色测试失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`音色测试失败：\n\n${errorMessage}\n\n请检查：\n1. 音色ID是否正确\n2. 账户余额是否充足`)
    } finally {
      setTestingVoice(false)
    }
  }
  
  // 上传自定义壁纸
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！')
      return
    }
    
    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB！')
      return
    }
    
    try {
      // 🔥 使用压缩功能减少存储空间占用（1920x1080，质量0.7）
      const { compressAndConvertToBase64 } = await import('../utils/imageUtils')
      const base64 = await compressAndConvertToBase64(file, 1920, 1080, 0.7)
      const imageUrl = `data:image/jpeg;base64,${base64}`
      
      const customWallpaper = createCustomWallpaper(imageUrl)
      const success = await setChatWallpaper(id, customWallpaper)
      
      if (success) {
        // 触发自定义事件通知聊天页面更新背景
        window.dispatchEvent(new CustomEvent('chatWallpaperChanged', { detail: { chatId: id } }))
        setHasWallpaper(true)
        alert('壁纸已设置！')
      } else {
        alert('壁纸保存失败：IndexedDB存储失败，请重试')
      }
    } catch (error) {
      console.error('壁纸保存失败:', error)
      alert('图片处理失败，请重试')
    }
  }
  
  // 恢复默认壁纸
  const handleRestoreDefaultWallpaper = async () => {
    if (!id) return
    
    const success = await clearChatWallpaper(id)
    if (success) {
      setHasWallpaper(false)
      window.dispatchEvent(new CustomEvent('chatWallpaperChanged', { detail: { chatId: id } }))
      alert('已恢复默认壁纸')
    } else {
      alert('恢复失败，请重试')
    }
  }
  
  // 导出角色数据
  const handleExportData = async () => {
    if (!id) return
    
    try {
      console.log('🚀 开始导出角色数据...')
      const data = await exportCharacterData(id)
      downloadCharacterData(data)
      alert(`✅ 导出成功！\n\n角色：${data.character.realName}\n聊天记录：${data.messages.length} 条\nAI随笔：${data.memos.length} 条\n记忆：${data.memories.length} 条\n朋友圈：${data.moments.length} 条\n世界书：${data.lorebook?.entries?.length || 0} 条\n表情包：${data.emojis.length} 个`)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    }
  }
  
  // 保存AI的拍一拍后缀
  const savePokeSuffix = async (newSuffix: string) => {
    if (!character || !id) return
    const { characterService } = await import('../services/characterService')
    const updatedCharacter = await characterService.update(id, { pokeSuffix: newSuffix })
    if (updatedCharacter) {
      setCharacter(updatedCharacter)
      console.log('AI拍一拍后缀已保存:', newSuffix)
      window.dispatchEvent(new CustomEvent('character-updated', { detail: { characterId: id } }))
    }
  }

  // 保存语言风格设置
  const saveLanguageStyle = async (style: 'modern' | 'ancient' | 'noble' | 'fantasy' | 'auto') => {
    if (!character || !id) return
    const { characterService } = await import('../services/characterService')
    const updatedCharacter = await characterService.update(id, { languageStyle: style })
    if (updatedCharacter) {
      setCharacter(updatedCharacter)
      setLanguageStyle(style)
      console.log('语言风格已保存:', style)
      window.dispatchEvent(new CustomEvent('character-updated', { detail: { characterId: id } }))
    }
  }

  // 切换置顶状态
  const togglePin = async () => {
    if (!id) return
    
    try {
      // 从IndexedDB加载聊天列表
      const { loadChatList, saveChatList } = await import('../utils/chatListManager')
      const chatList = await loadChatList()
      
      const newPinned = !isPinned
      const updatedList = chatList.map((chat: any) => {
        if (chat.id === id) {
          return { ...chat, isPinned: newPinned }
        }
        return chat
      })
      
      // 保存到IndexedDB
      await saveChatList(updatedList)
      setIsPinned(newPinned)
      
      console.log('📌 置顶状态已更新并保存:', { chatId: id, isPinned: newPinned })
      
      // 触发聊天列表更新 - 使用自定义事件
      window.dispatchEvent(new CustomEvent('chat-list-update'))
    } catch (error) {
      console.error('❌ 切换置顶状态失败:', error)
      alert('操作失败，请重试')
    }
  }
  
  // 清空聊天记录
  const clearChatHistory = async () => {
    if (!id) return
    
    if (window.confirm('确定要清空所有聊天记录吗？此操作不可恢复！')) {
      try {
        await clearMessages(id)
        alert('聊天记录已清空')
        // 触发消息加载事件，通知其他组件刷新
        window.dispatchEvent(new CustomEvent('messages-loaded', { detail: { chatId: id } }))
        navigate(`/chat/${id}`)
      } catch (error) {
        console.error('清空聊天记录失败:', error)
        alert('清空失败，请重试')
      }
    }
  }
  
  return (
    <div className="h-screen flex flex-col bg-[#f2f4f6] soft-page-enter">
      {/* 头部 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/chat/${id}`)}
            className="text-gray-700 p-2 rounded-full active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            聊天设置
          </h1>
          <div className="w-10" />
        </div>
      </div>
      
      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 搜索聊天记录 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <button
            onClick={() => navigate(`/chat/${id}/history`)}
            className="w-full flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div>
              <h2 className="text-sm font-semibold text-slate-700">搜索聊天记录</h2>
              <p className="text-xs text-slate-500 mt-0.5">按日期浏览和关键词搜索</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* 聊天置顶 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">聊天置顶</h2>
              <p className="text-xs text-slate-500 mt-0.5">在聊天列表中置顶显示</p>
            </div>
            <button
              onClick={togglePin}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: isPinned ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  isPinned ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
        </div>
        
        {/* 拉黑设置 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">拉黑此角色</span>
            <button
              onClick={toggleBlock}
              className={`relative w-11 h-6 rounded-full transition-all ${
                isBlocked 
                  ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                  : 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  isBlocked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* 面具设置 */}
        <div className="rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">身份设置</div>
          
          {/* 使用面具开关 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <div className="text-sm text-gray-900">使用面具</div>
              <div className="text-xs text-gray-400">换个马甲聊天，AI还是认识你</div>
            </div>
            <button
              onClick={() => {
                const newUseMask = !settings.useMask
                saveSettings({ 
                  ...settings, 
                  useMask: newUseMask,
                  maskId: newUseMask ? settings.maskId : null
                })
                // 触发头像重新加载
                window.dispatchEvent(new CustomEvent('maskSwitched', { detail: { maskId: newUseMask ? settings.maskId : null } }))
              }}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.useMask ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.useMask ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {/* 面具选择 */}
          {settings.useMask && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm text-slate-600 mb-2">选择面具</label>
              {masks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-2">还没有创建面具</p>
                  <button
                    onClick={() => navigate('/switch-account')}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    去创建面具
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {masks.map((mask) => (
                    <div
                      key={mask.id}
                      onClick={() => {
                      saveSettings({ ...settings, maskId: mask.id })
                      window.dispatchEvent(new CustomEvent('maskSwitched', { detail: { maskId: mask.id } }))
                    }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        settings.maskId === mask.id
                          ? 'bg-slate-100 ring-2 ring-slate-300'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
                        {mask.avatar ? (
                          <img src={mask.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{mask.nickname}</div>
                        {mask.description && (
                          <div className="text-xs text-gray-400 truncate">{mask.description}</div>
                        )}
                      </div>
                      {settings.maskId === mask.id && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 互动设置 */}
        <div className="rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">互动设置</div>
          
          {/* 拍一拍后缀 */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">拍一拍后缀</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pokeSuffix}
                onChange={(e) => {
                  setPokeSuffix(e.target.value)
                }}
                onBlur={(e) => {
                  // 失去焦点时保存
                  savePokeSuffix(e.target.value)
                }}
                placeholder="如：的小脑袋"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-[32px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              你拍{character?.nickname || character?.realName || 'TA'}时显示："你拍了拍{character?.nickname || character?.realName || 'TA'}{pokeSuffix && pokeSuffix.trim() ? pokeSuffix : '（示例：的小脑袋）'}"
            </p>
          </div>
          
          {/* 语言风格 */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">语言风格</label>
            <select
              value={languageStyle}
              onChange={(e) => saveLanguageStyle(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-[32px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="auto">默认</option>
              <option value="modern">现代</option>
              <option value="ancient">古风</option>
              <option value="noble">贵族</option>
              <option value="fantasy">奇幻</option>
            </select>
          </div>
        </div>
        
        {/* 语音设置 */}
        <div className="rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">语音设置</div>
          
          <div>
            <label className="block text-sm text-slate-600 mb-2">音色ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.voiceId}
                onChange={(e) => {
                  const newSettings = { ...settings, voiceId: e.target.value }
                  console.log('[ChatSettings] 🎤 保存音色ID:', {
                    输入值: e.target.value,
                    新设置: newSettings,
                    存储键: `chat_settings_${id}`
                  })
                  saveSettings(newSettings)
                }}
                placeholder="输入MiniMax音色ID"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-[32px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTestVoice}
                disabled={testingVoice || !settings.voiceId}
                className={`px-4 py-2.5 rounded-[32px] text-sm font-medium transition-colors ${
                  testingVoice || !settings.voiceId
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
              >
                {testingVoice ? '测试中...' : '测试'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              在MiniMax控制台找到你喜欢的音色ID，将用于该角色的语音消息和视频通话
            </p>
          </div>
          
          {/* 隐藏Token统计 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <div className="text-sm text-gray-900">隐藏Token统计</div>
              <div className="text-xs text-gray-400">隐藏聊天界面右上角的Token数值</div>
            </div>
            <button
              onClick={() => saveSettings({ ...settings, hideTokenStats: !settings.hideTokenStats })}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.hideTokenStats ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.hideTokenStats ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {/* 中插HTML小剧场 */}
          <div className="py-2 border-t border-gray-100 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm text-gray-900">中插HTML小剧场</div>
                <div className="text-xs text-gray-400">AI回复时插入HTML卡片（便利贴、聊天截图、账单等）</div>
              </div>
            </div>
            {/* 三选项按钮组 */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => saveSettings({ ...settings, htmlTheatreMode: 'off', enableHtmlTheatre: false })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  settings.htmlTheatreMode === 'off'
                    ? 'bg-slate-600 border-slate-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                关闭
              </button>
              <button
                onClick={() => saveSettings({ ...settings, htmlTheatreMode: 'smart', enableHtmlTheatre: true })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  settings.htmlTheatreMode === 'smart'
                    ? 'bg-slate-600 border-slate-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                根据语境
              </button>
              <button
                onClick={() => saveSettings({ ...settings, htmlTheatreMode: 'always', enableHtmlTheatre: true })}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  settings.htmlTheatreMode === 'always'
                    ? 'bg-slate-600 border-slate-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                每条必发
              </button>
            </div>
          </div>
          
          {/* 允许角色不回消息 */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3 mt-3">
            <div className="flex-1">
              <div className="text-sm text-gray-900">允许角色不回消息</div>
              <div className="text-xs text-gray-400">AI可以选择不回复（在忙、冷战、不想理你等）</div>
            </div>
            <button
              onClick={() => saveSettings({ ...settings, characterIndependence: !settings.characterIndependence })}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.characterIndependence ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.characterIndependence ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {/* 消息延迟 */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3 mt-3">
            <div className="flex-1">
              <div className="text-sm text-gray-900">消息延迟</div>
              <div className="text-xs text-gray-400">模拟真实聊天，AI回复前有打字延迟</div>
            </div>
            <button
              onClick={() => {
                const newSettings = { 
                  ...settings, 
                  messageDelay: {
                    ...settings.messageDelay,
                    enabled: !settings.messageDelay.enabled
                  }
                }
                saveSettings(newSettings)
              }}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.messageDelay.enabled ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.messageDelay.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {settings.messageDelay.enabled && (
            <div className="pt-3 space-y-3">
              {/* 延迟范围 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">延迟范围</span>
                  <span className="text-xs font-medium text-gray-900">{settings.messageDelay.minDelay}-{settings.messageDelay.maxDelay}秒</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-8">最小</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={settings.messageDelay.minDelay}
                    onChange={(e) => {
                      const minVal = parseFloat(e.target.value)
                      const newSettings = { 
                        ...settings, 
                        messageDelay: {
                          ...settings.messageDelay,
                          minDelay: minVal,
                          maxDelay: Math.max(minVal, settings.messageDelay.maxDelay)
                        }
                      }
                      saveSettings(newSettings)
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-[24px] appearance-none cursor-pointer accent-black"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 w-8">最大</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={settings.messageDelay.maxDelay}
                    onChange={(e) => {
                      const maxVal = parseFloat(e.target.value)
                      const newSettings = { 
                        ...settings, 
                        messageDelay: {
                          ...settings.messageDelay,
                          minDelay: Math.min(settings.messageDelay.minDelay, maxVal),
                          maxDelay: maxVal
                        }
                      }
                      saveSettings(newSettings)
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-[24px] appearance-none cursor-pointer accent-black"
                  />
                </div>
              </div>
              
              {/* 说明 */}
              <div className="p-3 bg-blue-50 rounded-[32px] border border-blue-200">
                <div className="flex items-start gap-2 text-blue-600 text-xs">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>AI回复前会随机等待{settings.messageDelay.minDelay}-{settings.messageDelay.maxDelay}秒，更像真人聊天</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* AI 记忆 */}
        <div className="rounded-2xl p-4 space-y-2 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-3">AI 记忆</div>
          
          <button
            onClick={() => navigate(`/chat/${id}/memory-summary`)}
            className="w-full flex items-center justify-between py-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl"></span>
              <div className="text-left">
                <div className="text-sm text-gray-900">记忆总结</div>
                <div className="text-xs text-gray-400">AI 总结当前对话的重要信息</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* 自动总结设置 */}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-900">自动总结</div>
                <div className="text-xs text-gray-400">每隔一定轮数自动生成记忆总结</div>
              </div>
              <button
                onClick={() => {
                  const newSettings = { ...settings, autoMemorySummary: !settings.autoMemorySummary }
                  saveSettings(newSettings)
                }}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ backgroundColor: settings.autoMemorySummary ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                    settings.autoMemorySummary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                  style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
                />
              </button>
            </div>
            
            {settings.autoMemorySummary && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">总结间隔</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={memoryIntervalInput}
                    onChange={(e) => {
                      // 仅更新输入框内容，允许用户暂时删光或输入不完整的数字
                      setMemoryIntervalInput(e.target.value)
                    }}
                    onBlur={() => {
                      let value = parseInt(memoryIntervalInput, 10)
                      if (Number.isNaN(value)) {
                        // 如果用户留空或输入非法内容，回退到默认30
                        value = 30
                      }
                      // 做区间限制
                      if (value < 1) value = 1
                      if (value > 100) value = 100

                      const newSettings = { ...settings, memorySummaryInterval: value }
                      saveSettings(newSettings)
                      // 同步输入框显示
                      setMemoryIntervalInput(String(value))
                    }}
                    className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-[24px]"
                  />
                  <span className="text-sm text-gray-600">轮对话</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 群聊消息同步 */}
        <div className="rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">群聊消息同步</div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">同步群聊消息</div>
              <div className="text-xs text-gray-400">让AI了解TA在群聊中的发言</div>
            </div>
            <button
              onClick={() => {
                const newSettings = { 
                  ...settings, 
                  groupChatSync: {
                    ...settings.groupChatSync,
                    enabled: !settings.groupChatSync.enabled
                  }
                }
                saveSettings(newSettings)
              }}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.groupChatSync.enabled ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.groupChatSync.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {settings.groupChatSync.enabled && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">同步消息条数</span>
                <span className="text-xs font-medium text-gray-900">{settings.groupChatSync.messageCount}条</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={settings.groupChatSync.messageCount}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value)
                  const newSettings = { 
                    ...settings, 
                    groupChatSync: {
                      ...settings.groupChatSync,
                      messageCount: newCount
                    }
                  }
                  saveSettings(newSettings)
                }}
                className="w-full h-2 bg-gray-200 rounded-[24px] appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10条</span>
                <span>50条</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                AI将读取TA在群聊中的最近{settings.groupChatSync.messageCount}条发言
              </p>
            </div>
          )}
        </div>
        
        {/* AI主动发消息 */}
        <div className="rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">AI主动发消息</div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-900">启用主动发消息</div>
              <div className="text-xs text-gray-400">AI会在你一段时间未回复时主动发消息</div>
            </div>
            <button
              onClick={() => {
                const newSettings = { 
                  ...settings, 
                  aiProactiveMessage: {
                    ...settings.aiProactiveMessage,
                    enabled: !settings.aiProactiveMessage.enabled
                  }
                }
                console.log('[ChatSettings] 保存主动发消息设置:', {
                  chatId: id,
                  newValue: !settings.aiProactiveMessage.enabled,
                  完整设置: newSettings.aiProactiveMessage
                })
                saveSettings(newSettings)
              }}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.aiProactiveMessage.enabled ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.aiProactiveMessage.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          
          {settings.aiProactiveMessage.enabled && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {/* 模式选择 */}
              <div>
                <div className="text-xs text-gray-600 mb-2">发消息模式</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        aiProactiveMessage: {
                          ...settings.aiProactiveMessage,
                          mode: 'fixed' as const
                        }
                      }
                      saveSettings(newSettings)
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                      settings.aiProactiveMessage.mode === 'fixed'
                        ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                        : 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                    }`}
                  >
                    固定时间
                  </button>
                  <button
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        aiProactiveMessage: {
                          ...settings.aiProactiveMessage,
                          mode: 'thinking' as const
                        }
                      }
                      saveSettings(newSettings)
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                      settings.aiProactiveMessage.mode === 'thinking'
                        ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                        : 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                    }`}
                  >
                    AI思考
                  </button>
                </div>
              </div>
              
              {/* 时间间隔 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">
                    {settings.aiProactiveMessage.mode === 'fixed' ? '固定间隔' : '思考间隔'}
                  </span>
                  <span className="text-xs font-medium text-gray-900">{settings.aiProactiveMessage.interval}分钟</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.aiProactiveMessage.interval}
                  onChange={(e) => {
                    const newInterval = parseInt(e.target.value)
                    const newSettings = { 
                      ...settings, 
                      aiProactiveMessage: {
                        ...settings.aiProactiveMessage,
                        interval: newInterval
                      }
                    }
                    saveSettings(newSettings)
                  }}
                  className="w-full h-2 bg-gray-200 rounded-[24px] appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1分钟</span>
                  <span>30分钟</span>
                </div>
              </div>
              
              {/* 说明文字 */}
              <div className="p-3 bg-green-50 rounded-[32px] border border-green-200">
                <div className="flex items-start gap-2 text-green-600 text-xs">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {settings.aiProactiveMessage.mode === 'fixed' ? (
                      <span>固定模式：{settings.aiProactiveMessage.interval}分钟后AI必定发送消息</span>
                    ) : (
                      <span>思考模式：{settings.aiProactiveMessage.interval}分钟后AI会思考是否需要发消息（使用副API）</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 气泡设置 */}
        {id && (
          <BubbleSettings 
            chatId={id} 
            onSaved={() => {
              // 设置已保存
            }} 
          />
        )}
        
        {/* 头像框设置 */}
        {id && (
          <AvatarFrameSettings 
            chatId={id} 
            onSaved={() => {
              // 设置已保存
            }} 
          />
        )}
        
        {/* 壁纸设置 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">聊天壁纸</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {hasWallpaper ? '已设置自定义壁纸' : '使用默认壁纸'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-sm font-medium rounded-full active:scale-[0.98] transition-transform"
            >
              上传壁纸
            </button>
            {hasWallpaper && (
              <button 
                onClick={handleRestoreDefaultWallpaper}
                className="flex-1 py-2.5 px-4 bg-slate-600 text-white text-sm font-medium rounded-full active:scale-[0.98] transition-transform"
              >
                恢复默认
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        {/* 消息条数设置 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                消息条数
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI读取的历史消息数量
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-gray-900">
                {settings.messageLimit === 0 ? '无限' : settings.messageLimit}
              </div>
            </div>
          </div>
          
          {/* 滑块 */}
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={settings.messageLimit}
              onChange={(e) => saveSettings({ ...settings, messageLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[50, 200, 500].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, messageLimit: num })}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                    settings.messageLimit === num
                      ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                      : 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                  }`}
                >
                  {num}条
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* AI主动发朋友圈 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                AI主动发朋友圈
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                开启后AI可以在聊天中发布朋友圈
              </p>
            </div>
            <button
              onClick={() => saveSettings({ ...settings, aiCanPostMoments: !settings.aiCanPostMoments })}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.aiCanPostMoments ? 'var(--switch-active-color, #475569)' : '#e2e8f0' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                  settings.aiCanPostMoments ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ backgroundColor: 'var(--switch-knob-color, #ffffff)' }}
              />
            </button>
          </div>
          {settings.aiCanPostMoments && (
            <div className="mt-4 p-3 bg-gray-500/10 backdrop-blur-sm rounded-[32px] border border-gray-300/30">
              <div className="flex items-start gap-2 text-gray-700 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>AI发送朋友圈后，其他AI角色可能会根据内容进行互动</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 朋友圈可见条数 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                朋友圈可见条数
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                AI可以看到用户发布的朋友圈数量
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-gray-900">
                {settings.momentsVisibleCount === 0 ? '无' : settings.momentsVisibleCount}
              </div>
            </div>
          </div>
          
          {/* 滑块 */}
          <div className="space-y-4">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={settings.momentsVisibleCount}
              onChange={(e) => saveSettings({ ...settings, momentsVisibleCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            
            {/* 快捷按钮 */}
            <div className="flex gap-2 pt-2">
              {[0, 10, 20, 50].map(num => (
                <button
                  key={num}
                  onClick={() => saveSettings({ ...settings, momentsVisibleCount: num })}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                    settings.momentsVisibleCount === num
                      ? 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]'
                      : 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                  }`}
                >
                  {num === 0 ? '不可见' : `${num}条`}
                </button>
              ))}
            </div>
          </div>
          
          {settings.momentsVisibleCount > 0 && (
            <div className="mt-4 p-3 bg-gray-500/10 backdrop-blur-sm rounded-[32px] border border-gray-300/30">
              <div className="flex items-start gap-2 text-gray-700 text-xs">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>朋友圈内容将加入对话上下文，会额外消耗 Token</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 导出角色数据 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              导出角色完整数据
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              导出角色的所有信息，包括聊天记录、随笔、记忆、朋友圈、世界书、表情包等
            </p>
          </div>
          
          <button
            onClick={handleExportData}
            className="w-full py-3 px-4 bg-slate-700 text-white font-medium rounded-[32px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出完整数据
          </button>
          
          <div className="mt-3 p-3 bg-blue-500/10 backdrop-blur-sm rounded-[32px] border border-blue-300/30">
            <div className="flex items-start gap-2 text-gray-700 text-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>导出的JSON文件可以在创建角色时上传导入，完整恢复所有数据</span>
            </div>
          </div>
        </div>
        
        {/* 清空聊天记录 */}
        <div className="rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              清空聊天记录
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              删除所有历史消息，不可恢复
            </p>
          </div>
          
          <button
            onClick={clearChatHistory}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium rounded-[32px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空所有消息
          </button>
          
          <div className="mt-3 p-3 bg-gray-500/10 backdrop-blur-sm rounded-[32px] border border-gray-300/30">
            <div className="flex items-start gap-2 text-gray-700 text-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>此操作将永久删除所有聊天记录，包括视频通话记录，且无法恢复！</span>
            </div>
          </div>
        </div>
        
        {/* 底部间距 */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default ChatSettings
