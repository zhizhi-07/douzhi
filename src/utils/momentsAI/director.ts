/**
 * AI导演主控制器
 * 协调各个模块，编排和执行朋友圈互动场景
 */

import type { Moment } from '../../types/moments'
import type { AIScene, AIAction } from '../../types/momentsAI'
import { apiService } from '../../services/apiService'
import { characterService } from '../../services/characterService'
import { collectCharactersInfo, formatMomentsHistory, formatAIMemory } from './dataCollector'
import { buildDirectorPrompt, SYSTEM_PROMPT } from './promptTemplate'
import { parseDirectorResponse } from './responseParser'
import { executeLikeAction, executeCommentAction, executeDMAction } from './actionExecutor'

/**
 * 压缩图片
 */
async function compressImage(base64: string, quality: number = 0.6, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法获取canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed)
    }
    img.onerror = reject
    img.src = base64
  })
}

/**
 * 获取当前API配置
 */
function getCurrentApiConfig() {
  const currentId = apiService.getCurrentId()
  return apiService.getById(currentId)
}

/**
 * AI导演编排场景
 */
export async function aiDirectorArrangeScene(
  characters: any[],
  moment: Moment
): Promise<AIScene | null> {
  console.log(`🎬 AI导演开始编排场景...`)
  
  const apiConfig = getCurrentApiConfig()
  if (!apiConfig) {
    console.error('❌ 没有配置API')
    return null
  }
  
  console.log(`🔑 使用API: ${apiConfig.name}`)
  
  // 收集数据
  const momentsHistory = formatMomentsHistory()
  console.log(`📱 读取朋友圈历史: ${momentsHistory.split('\n\n').length} 条`)
  
  const aiMemory = formatAIMemory()
  console.log(`🧠 读取AI互动记忆`)
  
  const charactersInfo = collectCharactersInfo(characters)
  
  // 判断是用户还是AI发的朋友圈
  const isUserPost = moment.userId === 'user'
  let publisherPersonality = ''
  
  if (!isUserPost) {
    // AI发朋友圈时，传递发布者的完整人设
    const publisher = characterService.getById(moment.userId)
    if (publisher) {
      console.log(`👤 ${moment.userName} 发的朋友圈，传递其人设供AI导演参考`)
      publisherPersonality = publisher.personality || ''
    }
  }
  
  // 🔥 修复：手动触发朋友圈图片收集
  // 由于buildMomentsListPrompt是内部函数，我们直接调用朋友圈相关逻辑
  const { loadMoments } = await import('../momentsManager')
  
  // 获取朋友圈数据并触发图片收集逻辑
  const allMoments = loadMoments()
  const visibleMoments = allMoments.filter(m => m.userId === 'user' || charactersInfo.some(c => c.id === m.userId))
  
  // 初始化图片数组
  if (!(window as any).__momentImages) {
    (window as any).__momentImages = []
  } else {
    (window as any).__momentImages = []
  }
  
  // 🔥 智能图片识别缓存系统
  // 获取或初始化图片识别缓存
  if (!(window as any).__imageDescriptionCache) {
    (window as any).__imageDescriptionCache = new Map()
  }
  const imageCache = (window as any).__imageDescriptionCache
  
  // 收集所有用户朋友圈图片，区分已识别和未识别
  const newImages = [] // 需要识别的新图片
  const cachedDescriptions = [] // 已缓存的图片描述
  
  visibleMoments.forEach((m, index) => {
    if (m.userId === 'user' && m.images && Array.isArray(m.images) && m.images.length > 0) {
      const number = String(index + 1).padStart(2, '0')
      
      m.images.forEach((img, imgIndex) => {
        if (img && img.url && typeof img.url === 'string') {
          // 生成图片的唯一标识（基于URL的hash）
          const imageId = btoa(img.url.substring(0, 100)).substring(0, 16)
          
          if (imageCache.has(imageId)) {
            // 图片已识别，使用缓存
            const cachedDesc = imageCache.get(imageId)
            cachedDescriptions.push(`图${index + 1}-${imgIndex + 1}: ${cachedDesc}`)
            console.log(`📋 [朋友圈导演] 使用缓存描述: 朋友圈${number}图片${imgIndex + 1}`)
          } else {
            // 新图片，需要识别
            const imgData: any = {
              momentIndex: index + 1,
              imageIndex: imgIndex + 1,
              imageUrl: img.url,
              imageId: imageId,
              description: `朋友圈${number}的第${imgIndex + 1}张图片`
            }
            
            newImages.push(imgData)
            ;(window as any).__momentImages.push(imgData)
            console.log(`🆕 [朋友圈导演] 发现新图片: 朋友圈${number}图片${imgIndex + 1}`)
          }
        }
      })
    }
  })
  
  console.log(`🔥 [朋友圈导演] 图片分析完成`)
  console.log(`📋 缓存图片: ${cachedDescriptions.length}张`)
  console.log(`🆕 新图片: ${newImages.length}张`)
  console.log(`🎯 需要AI识别: ${(window as any).__momentImages?.length || 0}张`)
  
  // 🔥 第一步：如果有新图片，先一次性识别所有图片内容
  const newImageDescriptions: string[] = []
  if (newImages.length > 0) {
    console.log(`🔍 [朋友圈导演] 第1步：识别 ${newImages.length} 张新图片...`)
    
    // 🔥 检查并压缩图片
    const compressedImages: any[] = []
    for (let idx = 0; idx < newImages.length; idx++) {
      const imgData = newImages[idx]
      const url = imgData.imageUrl
      const isBase64 = url.startsWith('data:')
      const originalSize = isBase64 ? Math.round(url.length / 1024) : 0
      
      console.log(`📸 图片${idx + 1}: ${isBase64 ? `base64 (${originalSize}KB)` : 'URL'}`)
      
      if (isBase64 && originalSize > 200) {
        // 图片过大，压缩后再识别
        console.log(`🔧 压缩图片${idx + 1}...`)
        try {
          const compressed = await compressImage(url, 0.6, 800)
          const compressedSize = Math.round(compressed.length / 1024)
          console.log(`✅ 压缩完成: ${originalSize}KB → ${compressedSize}KB`)
          compressedImages.push({
            ...imgData,
            imageUrl: compressed
          })
        } catch (error) {
          console.error(`❌ 压缩失败，使用原图:`, error)
          compressedImages.push(imgData)
        }
      } else {
        compressedImages.push(imgData)
      }
    }
    
    try {
      const { callAIApi } = await import('../chatApi')
      
      // 构建包含所有图片的识别请求
      const contentParts: any[] = [
        {
          type: 'text' as const,
          text: newImages.length === 1 
            ? '请用一句话简短描述这张图片的内容（20字以内）' 
            : `请分别用一句话简短描述以下${newImages.length}张图片的内容（每张20字以内），按顺序输出，格式：\n图1: xxx\n图2: xxx`
        }
      ]
      
      // 添加所有压缩后的图片
      compressedImages.forEach(imgData => {
        contentParts.push({
          type: 'image_url' as const,
          image_url: {
            url: imgData.imageUrl
          }
        })
      })
      
      const recognitionMessages = [
        {
          role: 'user' as const,
          content: contentParts
        }
      ]
      
      const recognitionSettings = {
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        model: apiConfig.model,
        provider: apiConfig.provider,
        temperature: 0.3,
        maxTokens: 500
      }
      
      const response = await callAIApi(recognitionMessages, recognitionSettings)
      
      if (newImages.length === 1) {
        // 单张图片，直接用返回内容
        const description = response.content.trim()
        const imgData = newImages[0]
        imageCache.set(imgData.imageId, description)
        newImageDescriptions.push(`图${imgData.momentIndex}-${imgData.imageIndex}: ${description}`)
        console.log(`✅ 识别完成: ${description}`)
      } else {
        // 多张图片，按行解析
        const descriptions = response.content.trim().split('\n')
        newImages.forEach((imgData, index) => {
          let description = descriptions[index] || '[图片内容]'
          description = description.replace(/^图\d+[:：]\s*/, '').trim()
          
          imageCache.set(imgData.imageId, description)
          newImageDescriptions.push(`图${imgData.momentIndex}-${imgData.imageIndex}: ${description}`)
          console.log(`✅ 图${imgData.momentIndex}-${imgData.imageIndex}: ${description}`)
        })
      }
      
      console.log(`✅ [朋友圈导演] 图片识别完成`)
    } catch (error) {
      console.error(`❌ [朋友圈导演] 图片识别失败:`, error)
      // 识别失败时使用占位符
      newImages.forEach(imgData => {
        newImageDescriptions.push(`图${imgData.momentIndex}-${imgData.imageIndex}: [图片内容]`)
      })
    }
  }
  
  // 🔥 构建图片描述（缓存 + 新识别）
  let imageDescriptions = ''
  if (cachedDescriptions.length > 0 || newImageDescriptions.length > 0) {
    imageDescriptions = `\n\n## 朋友圈图片内容\n⚠️ 以下是朋友圈中图片的内容描述，AI角色可以基于这些信息做出自然反应：\n\n`
    
    const allDescriptions = [...cachedDescriptions, ...newImageDescriptions]
    allDescriptions.forEach(desc => {
      imageDescriptions += `${desc}\n`
    })
    imageDescriptions += `\n💡 提示：AI角色应该基于图片内容做出符合角色性格的自然反应，而不是机械地描述图片。`
  }
  
  // 构建提示词（包含图片描述）
  const prompt = buildDirectorPrompt(moment, charactersInfo, momentsHistory, aiMemory, publisherPersonality) + imageDescriptions
  
  console.log('\n' + '='.repeat(80))
  console.log('🎬 AI导演编排场景 - 完整输入')
  console.log('='.repeat(80))
  console.log(prompt)
  console.log('='.repeat(80) + '\n')
  
  // 🔥 第二步：编排互动时禁用图片base64发送（只发文字描述）
  // 原因：prompt + 图片base64会导致请求体过大(503)
  const savedMomentImages = (window as any).__momentImages
  ;(window as any).__momentImages = []
  console.log(`🎬 [朋友圈导演] 第2步：编排互动（禁用图片base64，使用文字描述）`)
  
  try {
    // 🔥 修复：使用callAIApi函数，支持朋友圈图片识别
    const { callAIApi } = await import('../chatApi')
    
    console.log(`🚀 开始调用API编排场景: ${apiConfig.model}`)
    
    const messages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]
    
    const apiSettings = {
      baseUrl: apiConfig.baseUrl,
      apiKey: apiConfig.apiKey,
      model: apiConfig.model,
      provider: apiConfig.provider,
      temperature: 1.2,
      maxTokens: undefined // 不限制max_tokens，让AI完整输出
    }
    
    console.log('\n📤 发送给AI的完整请求:')
    console.log('System Prompt 长度:', SYSTEM_PROMPT.length, '字符')
    console.log('User Prompt 长度:', prompt.length, '字符')
    console.log('总Prompt长度:', SYSTEM_PROMPT.length + prompt.length, '字符')
    console.log('Temperature:', apiSettings.temperature)
    console.log('Max Tokens: 无限制（完整输出）')
    
    const response = await callAIApi(messages, apiSettings)
    
    // 🔥 恢复图片数据
    ;(window as any).__momentImages = savedMomentImages
    console.log(`✅ [朋友圈导演] 已恢复图片数据`)
    
    // 构造兼容的数据格式
    const data = {
      choices: [{
        message: {
          content: response.content,
          reasoning_content: null // callAIApi不返回reasoning
        }
      }],
      usage: response.usage
    }
    
    // 🔥 TODO: 解析AI识别结果并保存到缓存
    // 这里需要从AI的回复中提取图片描述，然后保存到imageCache中
    // 格式：图1-1: 粉色像素猫咪 → 保存到缓存
    console.log(`💾 [朋友圈导演] TODO: 解析AI识别结果并保存到缓存，供下次使用`)
    
    console.log('\n' + '='.repeat(80))
    console.log('📦 API返回的完整数据')
    console.log('='.repeat(80))
    console.log(JSON.stringify(data, null, 2))
    console.log('='.repeat(80) + '\n')
    
    // 提取内容和思考过程
    const message = data.choices?.[0]?.message
    const content = message?.content || ''
    const reasoning = message?.reasoning_content || null
    const usage = data.usage
    
    console.log('\n' + '='.repeat(80))
    console.log('💬 AI导演的回复内容')
    console.log('='.repeat(80))
    console.log(content)
    console.log('='.repeat(80) + '\n')
    
    if (reasoning) {
      console.log('\n' + '🧠'.repeat(40))
      console.log('🧠 AI导演的思考过程（reasoning）')
      console.log('🧠'.repeat(40))
      console.log(reasoning)
      console.log('🧠'.repeat(40) + '\n')
    }
    
    if (usage) {
      console.log('\n📊 Token使用统计:')
      console.log(`  输入: ${usage.prompt_tokens} tokens`)
      console.log(`  输出: ${usage.completion_tokens} tokens`)
      console.log(`  总计: ${usage.total_tokens} tokens\n`)
    }
    
    // 解析响应
    const scene = parseDirectorResponse(content)
    
    if (scene) {
      console.log('🎬 场景编排完成:', scene)
      
      // 只过滤发布者的点赞和直接评论，保留回复评论
      const publisherId = moment.userId
      const originalCount = scene.actions.length
      scene.actions = scene.actions.filter(action => {
        // 不是发布者，通过
        if (action.characterId !== publisherId) return true
        
        // 是发布者，检查动作类型
        if (action.action === 'like') {
          // 过滤掉点赞
          console.log(`🚫 过滤: ${action.characterName} 不能给自己点赞`)
          return false
        }
        
        if (action.action === 'comment' && !action.replyTo) {
          // 过滤掉直接评论（没有回复对象）
          console.log(`🚫 过滤: ${action.characterName} 不能直接评论自己的朋友圈`)
          return false
        }
        
        // 保留回复评论
        if (action.action === 'comment' && action.replyTo) {
          console.log(`✅ 保留: ${action.characterName} 回复 ${action.replyTo} 的评论`)
          return true
        }
        
        // 其他动作保留
        return true
      })
      
      if (scene.actions.length < originalCount) {
        console.log(`📝 过滤后剩余动作: ${scene.actions.length}/${originalCount}`)
      }
    }
    
    return scene
  } catch (error) {
    // 🔥 错误时也要恢复图片数据
    ;(window as any).__momentImages = savedMomentImages
    console.log(`✅ [朋友圈导演] 错误处理：已恢复图片数据`)
    console.error('❌ 场景编排失败:', error)
    return null
  }
}

/**
 * 执行单个动作
 */
function executeAction(
  action: AIAction,
  moment: Moment,
  characters: any[],
  allActions: AIAction[]
): void {
  // 检查是否是NPC（ID格式: npc-所属角色ID-NPC名字）
  const isNPC = action.characterId.startsWith('npc-')
  
  if (isNPC) {
    // NPC动作，构造虚拟角色对象
    const npcParts = action.characterId.split('-')
    const npcName = npcParts.slice(2).join('-')  // 支持名字中有连字符
    
    console.log(`👤 检测到NPC互动: ${npcName}`)
    
    const virtualCharacter = {
      id: action.characterId,
      realName: npcName,
      nickname: npcName,
      avatar: '👤'  // NPC默认头像
    }
    
    // 执行NPC动作（只支持点赞和评论，不支持私聊）
    switch (action.action) {
      case 'like':
        executeLikeAction(action, moment, virtualCharacter)
        break
      case 'comment':
        executeCommentAction(action, moment, virtualCharacter, allActions)
        break
      case 'none':
        console.log(`👀 NPC ${npcName} 选择沉默`)
        break
      default:
        console.warn(`⚠️ NPC不支持此动作: ${action.action}`)
    }
    return
  }
  
  // 普通角色处理
  let character = characters.find(c => c.id === action.characterId)
  
  if (!character) {
    // 尝试通过角色名查找（优先匹配网名）
    character = characters.find(c => 
      c.nickname === action.characterName || 
      c.realName === action.characterName
    )
  }
  
  if (!character) {
    console.error(`❌ 找不到角色: ID=${action.characterId}, Name=${action.characterName}`)
    console.log('可用角色:', characters.map(c => ({ id: c.id, name: c.nickname || c.realName })))
    return
  }
  
  console.log(`✅ 找到角色: ${character.nickname || character.realName} (ID: ${character.id})`)
  
  switch (action.action) {
    case 'like':
      executeLikeAction(action, moment, character)
      break
    case 'comment':
      executeCommentAction(action, moment, character, allActions)
      break
    case 'dm':
      executeDMAction(action, character, moment)
      break
    case 'none':
      console.log(`👀 ${action.characterName} 选择沉默`)
      break
  }
}

/**
 * 触发AI朋友圈互动
 * 用户发布朋友圈后调用此函数
 */
export async function triggerAIMomentsInteraction(newMoment: Moment): Promise<void> {
  const allCharacters = characterService.getAll()
  
  console.log(`🎬 朋友圈发布，准备让AI导演编排互动场景...`)
  console.log(`📱 朋友圈发布者: ${newMoment.userName} (ID: ${newMoment.userId})`)
  
  // 不再过滤发布者，因为发布者可以回复评论
  const characters = allCharacters
  
  if (characters.length === 0) {
    console.warn('⚠️ 没有AI角色可以互动')
    return
  }
  
  console.log(`✅ 可参与互动的角色: ${characters.map(c => c.nickname || c.realName).join('、')}`)
  
  // 延迟一会儿，让AI导演思考
  setTimeout(async () => {
    const isUserPost = newMoment.userId === 'user'
    
    console.log('\n' + '🎬'.repeat(40))
    console.log('🎭 AI导演开始工作...')
    console.log(`📱 朋友圈发布者: ${newMoment.userName} ${isUserPost ? '（用户本人）' : `（AI角色，ID: ${newMoment.userId}）`}`)
    console.log('📱 朋友圈内容:', newMoment.content)
    console.log('👥 参与编排的角色:', characters.map(c => c.nickname || c.realName).join('、'))
    if (!isUserPost) {
      console.log(`✅ 发布者 ${newMoment.userName} 可以回复评论`)
    }
    console.log('🎬'.repeat(40) + '\n')
    
    // AI导演一次性编排所有角色的互动
    const scene = await aiDirectorArrangeScene(characters, newMoment)
    
    if (!scene || !scene.actions) {
      console.warn('⚠️ 导演没有编排出场景')
      return
    }
    
    console.log('\n' + '✨'.repeat(40))
    console.log(`✨ 场景编排结果`)
    console.log('✨'.repeat(40))
    console.log(`🎬 场景: ${scene.scene}`)
    console.log(`📖 戏剧分析: ${scene.dramatic_analysis || '无'}`)
    console.log(`📋 共编排了 ${scene.actions.length} 个动作`)
    console.log('✨'.repeat(40) + '\n')
    
    // 按照导演编排的剧本执行
    console.log('📅 动作时间表:')
    scene.actions.forEach((action: AIAction, index: number) => {
      const delay = (action.delay || 0) * 1000
      
      const actionText = action.action === 'like' ? '点赞' : 
                         action.action === 'comment' ? '评论' : 
                         action.action === 'dm' ? '私聊' : '不互动'
      console.log(`\n${index + 1}. ⏱️ ${action.characterName} - ${action.delay}秒后${actionText}`)
      console.log(`   📝 理由: ${action.reason}`)
      if (action.commentContent) {
        console.log(`   💬 评论: ${action.commentContent}`)
      }
      if (action.replyTo) {
        console.log(`   ↪️  回复: ${action.replyTo}`)
      }
      if (action.dmContent) {
        console.log(`   📱 私聊: ${action.dmContent}`)
      }
      
      setTimeout(() => {
        console.log(`\n${'▶️'.repeat(20)}`)
        console.log(`▶️  执行动作: ${action.characterName} ${actionText}`)
        console.log(`${'▶️'.repeat(20)}`)
        executeAction(action, newMoment, characters, scene.actions)
      }, delay)
    })
  }, 3000)  // 3秒后让导演开始工作
}
