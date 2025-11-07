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
  
  // 构建提示词
  const prompt = buildDirectorPrompt(moment, charactersInfo, momentsHistory, aiMemory)
  
  console.log('\n' + '='.repeat(80))
  console.log('🎬 AI导演编排场景 - 完整输入')
  console.log('='.repeat(80))
  console.log(prompt)
  console.log('='.repeat(80) + '\n')
  
  try {
    const apiUrl = `${apiConfig.baseUrl}/chat/completions`
    console.log(`🚀 开始调用API编排场景: ${apiConfig.model}`)
    
    const requestBody = {
      model: apiConfig.model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1.2
      // 不限制max_tokens，让AI完整输出
    }
    
    console.log('\n📤 发送给AI的完整请求:')
    console.log('System Prompt:', SYSTEM_PROMPT)
    console.log('Temperature:', requestBody.temperature)
    console.log('Max Tokens: 无限制（完整输出）')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
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
      console.log(`  输出: ${usage.completion_tokens} tokens (文本: ${usage.completion_tokens_details?.text_tokens || 0}, 思考: ${usage.completion_tokens_details?.reasoning_tokens || 0})`)
      console.log(`  总计: ${usage.total_tokens} tokens\n`)
    }
    
    // 解析响应
    const scene = parseDirectorResponse(content)
    
    if (scene) {
      console.log('🎬 场景编排完成:', scene)
      
      // 过滤掉发布者本人的动作（双重保险）
      const publisherId = moment.userId
      const originalCount = scene.actions.length
      scene.actions = scene.actions.filter(action => action.characterId !== publisherId)
      
      if (scene.actions.length < originalCount) {
        console.warn(`⚠️ 过滤掉了发布者本人的动作: ${originalCount - scene.actions.length} 个`)
        console.log(`🚫 发布者ID: ${publisherId}`)
      }
    }
    
    return scene
  } catch (error) {
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
  // 先通过ID查找，找不到则通过角色名查找
  let character = characters.find(c => c.id === action.characterId)
  
  if (!character) {
    // 尝试通过角色名查找
    character = characters.find(c => 
      c.realName === action.characterName || 
      c.nickname === action.characterName
    )
  }
  
  if (!character) {
    console.error(`❌ 找不到角色: ID=${action.characterId}, Name=${action.characterName}`)
    console.log('可用角色:', characters.map(c => ({ id: c.id, name: c.realName })))
    return
  }
  
  console.log(`✅ 找到角色: ${character.realName} (ID: ${character.id})`)
  
  switch (action.action) {
    case 'like':
      executeLikeAction(action, moment, character)
      break
    case 'comment':
      executeCommentAction(action, moment, character, allActions)
      break
    case 'dm':
      executeDMAction(action, character)
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
  
  // 过滤掉朋友圈发布者本人（AI不会给自己的朋友圈点赞评论）
  const characters = allCharacters.filter(c => c.id !== newMoment.userId)
  
  if (characters.length === 0) {
    console.warn('⚠️ 没有其他AI角色可以互动')
    return
  }
  
  console.log(`✅ 过滤后可参与互动的角色: ${characters.map(c => c.realName).join('、')}`)
  if (newMoment.userId !== 'user') {
    console.log(`🚫 已排除发布者本人: ${newMoment.userName}`)
  }
  
  // 延迟一会儿，让AI导演思考
  setTimeout(async () => {
    const isUserPost = newMoment.userId === 'user'
    
    console.log('\n' + '🎬'.repeat(40))
    console.log('🎭 AI导演开始工作...')
    console.log(`📱 朋友圈发布者: ${newMoment.userName} ${isUserPost ? '（用户本人）' : `（AI角色，ID: ${newMoment.userId}）`}`)
    console.log('📱 朋友圈内容:', newMoment.content)
    console.log('👥 参与编排的角色:', characters.map(c => c.realName).join('、'))
    if (!isUserPost) {
      console.log(`🚫 已排除发布者: ${newMoment.userName}`)
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
