/**
 * 汁汁代付API配置中心
 * 集中管理所有代付搜索API，方便查看和维护
 */

export interface ZhizhiApiConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
}

/**
 * 所有代付API配置
 * 每次随机选一个使用，如果失败就换下一个
 * 
 * 当前收集到的代付API：
 * - PaymentRequest.tsx（代付搜索）
 * - OnlineShopping.tsx（在线购物）
 * - usePostGenerator.ts（帖子生成）
 * 
 * 使用的地方：
 * - landlordAI.ts（斗地主右侧AI）
 * - usePostGenerator.ts（帖子生成）
 * - PaymentRequest.tsx（代付搜索）
 * - OnlineShopping.tsx（在线购物）
 */
export const ZHIZHI_APIS: ZhizhiApiConfig[] = [
  {
    id: 'zhizhi-2',
    name: '代付API #2',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-yfuugzeefzqqttdqtjdwhtxrzvuletrazjkuvzfzwgxcvfkn',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-3',
    name: '代付API #3',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-ypzuyzjbzsserfiabytebescietibsroddioylpynxibrsbx',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-4',
    name: '代付API #4',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-sbezodevupiswrtberhdplsjuxstxgfyyetubglfmrwrokfd',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-5',
    name: '代付API #5',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-kpwelahgxbwwgjdnrzhvjzrobvzpiasweovqabnqhrzgymrq',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-6',
    name: '代付API #6',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-gsubfwanpeejintfutwgnowvoxbcticwbkvbmtczcuekkixz',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-7',
    name: '代付API #7',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-jwdafvlqgdimdrbjfvookteedgismgqxfzepwrqryvyewpxq',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-8',
    name: '代付API #8',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-ehcfanjrcwruwfmsbtfztjpfpcftcfyrkgsobwdfzdrbzsjh',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-9',
    name: '代付API #9',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-lbvlrhajzjtanwebrquflsavuauilapewncskihginciyiin',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-10',
    name: '代付API #10',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-hwxgdhirbcupgpqngizrrualserzqbmjewxvgemjidfcdqtr',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-11',
    name: '代付API #11',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-xhlkwwzznnkgntydaowfnuqwifwwqgexcdpjiqxughzsqpof',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-12',
    name: '代付API #12',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-gpalkppqzkvgcfheuhacnuhchzxpaigevwxzmorvxkubtzgn',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  {
    id: 'zhizhi-13',
    name: '代付API #13',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-lvxmfnujsoputohqadherddebwwmyohwcheuonibssptjgxg',
    model: 'deepseek-ai/DeepSeek-V3'
  }
]

/**
 * 随机获取一个可用的代付API
 */
export const getRandomZhizhiApi = (): ZhizhiApiConfig => {
  const randomIndex = Math.floor(Math.random() * ZHIZHI_APIS.length)
  return ZHIZHI_APIS[randomIndex]
}

/**
 * 获取所有代付API
 */
export const getAllZhizhiApis = (): ZhizhiApiConfig[] => {
  return ZHIZHI_APIS
}

/**
 * 获取代付API总数
 */
export const getZhizhiApiCount = (): number => {
  return ZHIZHI_APIS.length
}

/**
 * 调用代付API（带降级重试）
 */
export const callZhizhiApi = async (
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number
    max_tokens?: number
  }
): Promise<string> => {
  const { temperature = 0.7, max_tokens = 2000 } = options || {}
  
  console.log('📤 [汁汁API] 请求参数:', {
    messages: messages.map(m => ({
      role: m.role,
      content: m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content
    })),
    temperature,
    max_tokens
  })
  
  // 尝试所有API，直到成功
  for (let i = 0; i < ZHIZHI_APIS.length; i++) {
    const api = ZHIZHI_APIS[i]
    console.log(`🎮 [汁汁API] 尝试使用: ${api.name}`)
    
    try {
      const response = await fetch(`${api.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.apiKey}`
        },
        body: JSON.stringify({
          model: api.model,
          messages,
          temperature,
          max_tokens
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      console.log(`✅ [汁汁API] ${api.name} 调用成功`)
      console.log('📥 [汁汁API] 完整回复数据:', data)
      console.log('📝 [汁汁API] 提取的内容:', content)
      
      return content
      
    } catch (error) {
      console.error(`❌ [汁汁API] ${api.name} 调用失败:`, error)
      
      // 如果还有其他API，继续尝试
      if (i < ZHIZHI_APIS.length - 1) {
        console.log(`⚠️ [汁汁API] 切换到下一个API...`)
        continue
      } else {
        // 所有API都失败了
        throw new Error('所有代付API都调用失败')
      }
    }
  }
  
  throw new Error('没有可用的代付API')
}
