/**
 * 自动物流服务
 * 使用zhizhiapi根据商品信息自动生成完整的物流流程
 */

import { callZhizhiApi } from './zhizhiapi'

export interface LogisticsStep {
  status: string
  detail: string
  timestamp: number
  icon: string
}

export interface AutoLogisticsResult {
  type: 'takeout' | 'package'
  productName: string
  price: number
  steps: LogisticsStep[]
  estimatedDeliveryTime: number // 预计送达时间戳
}

/**
 * 自动生成物流信息
 */
export async function generateAutoLogistics(
  productName: string,
  price: number,
  quantity: number = 1
): Promise<AutoLogisticsResult> {
  try {
    console.log('🚚 [自动物流] 开始生成:', { productName, price, quantity })

    const prompt = `你是一个物流系统AI。根据以下商品信息，生成真实的物流流程。

**商品信息**：
- 商品名称：${productName}
- 单价：¥${price}
- 数量：${quantity}
- 总价：¥${price * quantity}

**任务**：
1. 判断这是外卖还是快递（根据商品名称判断）
2. 生成完整的物流流程（每个步骤包含状态、详细描述、时间间隔）
3. 根据商品价格和类型，合理安排时间

**外卖流程示例**（便宜的快餐15-30分钟，贵的餐厅30-60分钟）：
- 商家已接单（0分钟）
- 备餐中（5-10分钟后）
- 等待骑手接单（10-15分钟后）
- 骑手已接单（15-20分钟后）
- 骑手取餐中（20-25分钟后）
- 配送中（25-35分钟后）
- 骑手即将到达（35-40分钟后）
- 已送达（40-50分钟后）

**快递流程示例**（普通快递2-3天，贵重物品可能更快）：
- 已下单（0小时）
- 商家已发货（2-6小时后）
- 快递揽收（6-12小时后）
- 运输中（1-2天后）
- 到达本地（2-3天后）
- 派送中（2-3天后）
- 已签收（2-3天后）

**输出格式**（JSON）：
\`\`\`json
{
  "type": "takeout" 或 "package",
  "steps": [
    {
      "status": "状态名称",
      "detail": "详细描述（要真实、具体，包含地点、人名等细节）",
      "minutesAfter": 相对于购买时间的分钟数,
      "icon": "emoji图标"
    }
  ],
  "estimatedMinutes": 预计总时长（分钟）
}
\`\`\`

**要求**：
1. 时间要合理（外卖30-60分钟，快递2-3天）
2. 描述要真实具体（如："骑手张师傅已到店取餐"、"快递已到达北京分拨中心"）
3. 根据价格调整：贵的商品可能更快、服务更好
4. ⚠️ 收货地址不要写具体地址！只能写模糊的收货点：
   - 外卖："已送达楼下"、"已放置取餐点"
   - 快递："已投递至蜂巢柜"、"已送达快递驿站"、"已放置小区快递站"
5. 发货地可以写具体城市和仓库
6. 只输出JSON，不要其他内容`

    const response = await callZhizhiApi([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('🤖 [自动物流] API响应:', response)

    // 解析JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析物流数据')
    }

    const logisticsData = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // 转换为标准格式
    const now = Date.now()
    const steps: LogisticsStep[] = logisticsData.steps.map((step: any) => ({
      status: step.status,
      detail: step.detail,
      timestamp: now + (step.minutesAfter * 60 * 1000),
      icon: step.icon || (logisticsData.type === 'takeout' ? '🍔' : '📦')
    }))

    const result: AutoLogisticsResult = {
      type: logisticsData.type,
      productName,
      price: price * quantity,
      steps,
      estimatedDeliveryTime: now + (logisticsData.estimatedMinutes * 60 * 1000)
    }

    console.log('✅ [自动物流] 生成成功:', result)
    return result

  } catch (error) {
    console.error('❌ [自动物流] 生成失败:', error)
    
    // 降级方案：生成默认物流
    return generateDefaultLogistics(productName, price, quantity)
  }
}

/**
 * 降级方案：生成默认物流
 */
function generateDefaultLogistics(
  productName: string,
  price: number,
  quantity: number
): AutoLogisticsResult {
  const now = Date.now()
  const isTakeout = /外卖|饭|餐|菜|饮|吃|饮料|咖啡|奶茶|烧烤|火锅|麦当劳|肯德基|美团|饿了么/.test(productName)
  
  if (isTakeout) {
    // 外卖默认流程（40分钟）
    return {
      type: 'takeout',
      productName,
      price: price * quantity,
      steps: [
        { status: '商家已接单', detail: '商家正在备餐中，预计10-15分钟出餐', timestamp: now, icon: '👨‍🍳' },
        { status: '备餐中', detail: '商家正在紧张备餐，很快就好', timestamp: now + 5 * 60 * 1000, icon: '🍳' },
        { status: '等待骑手接单', detail: '餐品已出餐，正在等待骑手接单', timestamp: now + 15 * 60 * 1000, icon: '📦' },
        { status: '骑手已接单', detail: '骑手已接单，正在前往商家取餐', timestamp: now + 20 * 60 * 1000, icon: '🏍️' },
        { status: '配送中', detail: '骑手已取餐，正在快马加鞭送往目的地', timestamp: now + 25 * 60 * 1000, icon: '🛵' },
        { status: '骑手即将到达', detail: '骑手距离您不到500米，请准备取餐', timestamp: now + 35 * 60 * 1000, icon: '📍' },
        { status: '已送达', detail: '外卖已送达，请及时取餐', timestamp: now + 40 * 60 * 1000, icon: '✅' }
      ],
      estimatedDeliveryTime: now + 40 * 60 * 1000
    }
  } else {
    // 快递默认流程（2天）
    return {
      type: 'package',
      productName,
      price: price * quantity,
      steps: [
        { status: '已下单', detail: '订单已提交，等待商家发货', timestamp: now, icon: '🛒' },
        { status: '已发货', detail: '商家已发货，快递正在揽收', timestamp: now + 6 * 60 * 60 * 1000, icon: '📦' },
        { status: '运输中', detail: '快递正在运输途中', timestamp: now + 24 * 60 * 60 * 1000, icon: '🚚' },
        { status: '到达本地', detail: '快递已到达您所在的城市', timestamp: now + 48 * 60 * 60 * 1000, icon: '🏙️' },
        { status: '派送中', detail: '快递员正在派送，请保持电话畅通', timestamp: now + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, icon: '🛵' },
        { status: '已签收', detail: '快递已签收', timestamp: now + 48 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000, icon: '✅' }
      ],
      estimatedDeliveryTime: now + 52 * 60 * 60 * 1000
    }
  }
}

/**
 * 保存物流信息到localStorage
 */
export function saveLogistics(chatId: string, messageId: number, logistics: AutoLogisticsResult) {
  const key = `logistics_${chatId}_${messageId}`
  localStorage.setItem(key, JSON.stringify(logistics))
  console.log('💾 [自动物流] 已保存:', key)
}

/**
 * 读取物流信息
 */
export function getLogistics(chatId: string, messageId: number): AutoLogisticsResult | null {
  const key = `logistics_${chatId}_${messageId}`
  const data = localStorage.getItem(key)
  if (!data) return null
  
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * 获取当前物流状态（根据时间自动更新）
 */
export function getCurrentLogisticsStatus(logistics: AutoLogisticsResult): {
  currentStep: LogisticsStep
  progress: number // 0-100
  isCompleted: boolean
} {
  const now = Date.now()
  
  // 找到当前应该显示的步骤
  let currentStep = logistics.steps[0]
  let currentIndex = 0
  
  for (let i = 0; i < logistics.steps.length; i++) {
    if (now >= logistics.steps[i].timestamp) {
      currentStep = logistics.steps[i]
      currentIndex = i
    } else {
      break
    }
  }
  
  const progress = ((currentIndex + 1) / logistics.steps.length) * 100
  const isCompleted = currentIndex === logistics.steps.length - 1
  
  return { currentStep, progress, isCompleted }
}
