/**
 * 小剧场 Function Calling 工具定义
 */

/**
 * Gemini Function Calling 工具定义
 * 文档：https://ai.google.dev/gemini-api/docs/function-calling
 */
export const THEATRE_TOOL = {
  name: 'send_theatre_card',
  description: '生成逼真的手机截图给对方看。当你需要展示手机屏幕内容（如外卖订单、购物车、聊天记录、通话记录、手机桌面、物流进度等）时，请使用此工具。这比用文字描述"我发了张图"更有代入感，就像你真的把手机屏幕亮给对方看一样。',
  parameters: {
    type: 'object',
    properties: {
      template_id: {
        type: 'string',
        description: '模板ID，用下划线命名。常用：phone_desktop(手机桌面)、wechat_chat(聊天记录)、payment_success(支付成功)、moments_post(朋友圈)、red_packet(红包)、weather(天气)、poll(投票)、universal_card(万能卡片)、memo_list(备忘录/清单)、shopping_cart(购物车)、express_delivery(物流)、call_log(通话记录)。'
      },
      data: {
        type: 'object',
        description: '模板数据。memo_list需title/items(text/checked)，可选date/folder；universal_card需title/content...；其他按需填充。'
      }
    },
    required: ['template_id', 'data']
  }
}

/**
 * Tool Call 响应类型
 */
export interface TheatreToolCall {
  template_id: string
  data: Record<string, any>
}

/**
 * 解析 Gemini 的 tool_calls 响应
 */
export function parseTheatreToolCalls(response: any): TheatreToolCall[] {
  const toolCalls: TheatreToolCall[] = []
  
  // Gemini 格式：candidates[0].content.parts 中可能包含 functionCall
  const parts = response.candidates?.[0]?.content?.parts || []
  
  for (const part of parts) {
    if (part.functionCall && part.functionCall.name === 'send_theatre_card') {
      const args = part.functionCall.args
      if (args && args.template_id && args.data) {
        toolCalls.push({
          template_id: args.template_id,
          data: args.data
        })
      }
    }
  }
  
  // OpenAI 格式：choices[0].message.tool_calls
  const openaiToolCalls = response.choices?.[0]?.message?.tool_calls || []
  for (const call of openaiToolCalls) {
    if (call.function?.name === 'send_theatre_card') {
      try {
        const args = typeof call.function.arguments === 'string' 
          ? JSON.parse(call.function.arguments)
          : call.function.arguments
        
        if (args && args.template_id && args.data) {
          toolCalls.push({
            template_id: args.template_id,
            data: args.data
          })
        }
      } catch (e) {
        console.error('解析 tool call 参数失败:', e)
      }
    }
  }
  
  return toolCalls
}

/**
 * 将小剧场 tool call 转换为消息格式
 */
export function convertTheatreToolCallToMessage(toolCall: TheatreToolCall, characterAvatar?: string) {
  // 如果是聊天记录类模板且提供了角色头像，注入到data中
  const chatTemplates = ['chat_screenshot', 'wechat_chat', 'group_chat', 'private_chat']
  if (characterAvatar && chatTemplates.includes(toolCall.template_id)) {
    toolCall.data._characterAvatar = characterAvatar
  }
  
  // 根据 template_id 生成对应的 HTML 内容
  const htmlContent = generateTheatreHTML(toolCall.template_id, toolCall.data)
  
  // 卡片类型名称映射
  const typeNameMap: Record<string, string> = {
    shopping_cart: '购物车',
    food_delivery: '外卖订单',
    call_incoming: '通话记录',
    call_log: '通话记录',
    call_detail: '通话详情',
    call_conversation: '通话详情',
    mobile_desktop: '手机桌面',
    home_screen: '手机桌面',
    phone_desktop: '手机桌面',
    phone_homescreen: '手机桌面',
    phone_home_screen: '手机桌面',
    chat_screenshot: '聊天记录',
    wechat_chat: '微信聊天',
    group_chat: '群聊',
    private_chat: '私聊',
    express_delivery: '物流信息',
    receipt: '收据',
    transfer: '转账记录',
    hotel_booking: '酒店订单',
    movie_ticket: '电影票',
    concert_ticket: '演唱会票',
    coupon: '优惠券',
    group_buy: '拼团',
    bargain: '砍价',
    payment_success: '支付成功',
    moments_post: '朋友圈',
    red_packet: '红包记录',
    weather: '天气预报',
    poll: '投票',
    universal_card: '万能卡片',
    memo_list: '备忘录'
  }
  
  return {
    messageType: 'theatre' as const,
    theatre: {
      templateId: toolCall.template_id,
      templateName: typeNameMap[toolCall.template_id] || '卡片',
      htmlContent: htmlContent,
      rawData: JSON.stringify(toolCall.data)
    },
    timestamp: Date.now()
  }
}

/**
 * 根据卡片类型和字段生成 HTML 内容
 */
function generateTheatreHTML(cardType: string, fields: Record<string, any>): string {
  // 这里先返回一个简单的 HTML，后续可以根据实际模板优化
  switch (cardType) {
    case 'shopping_cart':
      const items = fields.items || []
      const itemsHTML = Array.isArray(items)
        ? items.map((item: any) => {
            const name = item.name || item.title || '商品'
            const price = item.price || '0.00'
            const count = item.count || item.quantity || 1
            const image = item.image || 'https://via.placeholder.com/80'
            const sku = item.sku || item.desc || '默认规格'
            
            return `
              <div style="display: flex; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
                <div style="width: 70px; height: 70px; background: #f3f4f6; border-radius: 8px; overflow: hidden; flex-shrink: 0;">
                  <img src="${image}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';this.parentNode.style.background='#e5e7eb'"/>
                </div>
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 13px; color: #1f2937; line-height: 1.4; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${name}</div>
                    <div style="font-size: 10px; color: #9ca3af; background: #f9fafb; padding: 2px 6px; border-radius: 4px; display: inline-block;">${sku}</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px;">
                    <div style="font-size: 14px; color: #ef4444; font-weight: bold;">
                      <span style="font-size: 10px;">¥</span>${price}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 4px; padding: 0 6px; height: 20px; line-height: 18px;">x${count}</div>
                  </div>
                </div>
              </div>
            `
          }).join('')
        : '<div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">购物车是空的</div>'

      // 计算总价
      let total = '0.00'
      if (fields.total) {
        total = fields.total
      } else if (Array.isArray(items)) {
        const sum = items.reduce((acc: number, item: any) => {
          const p = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, ''))
          const c = parseInt(String(item.count || item.quantity || '1'))
          return acc + (isNaN(p) ? 0 : p) * (isNaN(c) ? 1 : c)
        }, 0)
        total = sum.toFixed(2)
      }

      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; max-width: 100%; box-sizing: border-box; font-family: system-ui;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
            <div style="font-size: 14px; font-weight: bold; color: #1f2937;">🛒 购物车 <span style="font-size: 12px; color: #9ca3af; font-weight: normal;">(${items.length})</span></div>
            <div style="font-size: 12px; color: #4b5563;">管理</div>
          </div>
          
          <div style="margin-bottom: 4px;">
            ${itemsHTML}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <span style="font-size: 12px; color: #4b5563;">合计:</span>
              <span style="font-size: 16px; color: #ef4444; font-weight: bold;"><span style="font-size: 12px;">¥</span>${total}</span>
            </div>
            <div style="background: linear-gradient(135deg, #ff9000 0%, #ff5000 100%); color: white; font-size: 12px; padding: 6px 16px; border-radius: 16px; font-weight: bold;">去结算</div>
          </div>
        </div>
      `
    
    case 'food_delivery':
      const dishes = fields.items || fields.dishes || []
      const dishesHTML = Array.isArray(dishes)
        ? dishes.map((item: any) => {
            const name = item.name || item.title || '餐品'
            const price = item.price || '0'
            const count = item.count || item.quantity || 1
            const image = item.image || 'https://via.placeholder.com/60'
            
            return `
              <div style="display: flex; margin-bottom: 12px; gap: 8px;">
                <div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                  <img src="${image}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';this.parentNode.style.background='#e5e7eb'"/>
                </div>
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="display: flex; justify-content: space-between;">
                    <div style="font-size: 13px; color: #1f2937; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
                    <div style="font-size: 13px; color: #1f2937; font-weight: 500;">¥${price}</div>
                  </div>
                  <div style="font-size: 11px; color: #9ca3af;">x${count}</div>
                </div>
              </div>
            `
          }).join('')
        : ''

      // 自动计算总价（如果 AI 没写 total）
      let foodTotal = fields.total
      if (!foodTotal && Array.isArray(dishes)) {
        // 菜品小计
        const dishesSum = dishes.reduce((acc: number, item: any) => {
          const p = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, ''))
          const c = parseInt(String(item.count || item.quantity || '1'))
          return acc + (isNaN(p) ? 0 : p) * (isNaN(c) ? 1 : c)
        }, 0)
        
        // 打包费
        const packingFee = parseFloat(String(fields.packing_fee || '2').replace(/[^0-9.]/g, '')) || 2
        // 配送费
        const deliveryFee = parseFloat(String(fields.delivery_fee || '0').replace(/[^0-9.]/g, '')) || 0
        // 优惠
        const discount = parseFloat(String(fields.discount || '0').replace(/[^0-9.]/g, '')) || 0
        
        foodTotal = (dishesSum + packingFee + deliveryFee - discount).toFixed(2)
      }

      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; max-width: 100%; box-sizing: border-box; font-family: system-ui;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6;">
            <div style="font-size: 14px; font-weight: bold; color: #1f2937; display: flex; align-items: center; gap: 4px;">
              ${fields.merchant || '美团外卖'} <span style="color: #9ca3af; font-size: 12px;">></span>
            </div>
            <div style="font-size: 12px; color: #6b7280;">${fields.status || '已送达'}</div>
          </div>
          
          <div style="margin-bottom: 8px;">
            ${dishesHTML}
          </div>
          
          <div style="border-top: 1px solid #f9fafb; padding-top: 8px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 4px;">
              <span>打包费</span>
              <span>¥${fields.packing_fee || '2'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 4px;">
              <span>配送费</span>
              <span>¥${fields.delivery_fee || '0'}</span>
            </div>
            ${fields.discount ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ef4444; margin-bottom: 4px;">
              <span>满减优惠</span>
              <span>-¥${fields.discount}</span>
            </div>` : ''}
          </div>
          
          <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 4px; margin-top: 12px; padding-top: 8px; border-top: 1px dotted #e5e7eb;">
            <span style="font-size: 11px; color: #4b5563;">实付</span>
            <span style="font-size: 18px; color: #1f2937; font-weight: bold;"><span style="font-size: 12px;">¥</span>${foodTotal || '0.00'}</span>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <div style="font-size: 12px; color: #4b5563; border: 1px solid #d1d5db; padding: 4px 12px; border-radius: 14px;">再来一单</div>
          </div>
        </div>
      `
    
    case 'call_detail':
    case 'call_conversation':
      const conversation = fields.messages || fields.conversation || []
      const conversationHTML = Array.isArray(conversation)
        ? conversation.map((msg: any) => {
            const speaker = msg.speaker || msg.from || 'user'
            const text = msg.text || msg.content || ''
            const isUser = speaker === 'user' || speaker === 'me'
            
            return `
              <div style="display: flex; ${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'} margin-bottom: 8px;">
                <div style="max-width: 70%; background: ${isUser ? '#007aff' : '#f3f4f6'}; color: ${isUser ? 'white' : '#1f2937'}; padding: 8px 12px; border-radius: 16px; font-size: 13px; line-height: 1.4; word-break: break-word;">
                  ${text}
                </div>
              </div>
            `
          }).join('')
        : ''

      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; max-width: 100%; box-sizing: border-box; font-family: system-ui;">
          <div style="text-align: center; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; margin-bottom: 12px;">
            <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 4px;">${fields.contact || fields.name || '对方'}</div>
            <div style="font-size: 12px; color: #9ca3af;">${fields.type === 'video' ? '📹 视频通话' : '📞 语音通话'} · ${fields.duration || '0:00'}</div>
            ${fields.time ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">${fields.time}</div>` : ''}
          </div>
          
          <div style="max-height: 300px; overflow-y: auto; padding: 0 4px;">
            ${conversationHTML || '<div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">暂无通话记录</div>'}
          </div>
          
          <div style="text-align: center; padding-top: 12px; margin-top: 12px; border-top: 1px solid #f3f4f6;">
            <div style="font-size: 12px; color: #9ca3af;">${fields.status || '通话已结束'}</div>
          </div>
        </div>
      `
    
    case 'call_incoming':
    case 'call_log':
      const calls = fields.calls || fields.records || []
      const callsHTML = Array.isArray(calls)
        ? calls.map((call: any) => {
            const name = call.name || call.contact || '未知号码'
            const type = call.type || 'outgoing' // incoming, outgoing, missed
            const duration = call.duration || ''
            const time = call.time || call.timestamp || ''
            const firstChar = name.charAt(0).toUpperCase()
            
            // 图标和颜色
            let typeIcon = '↗' // 呼出
            let typeColor = '#9ca3af' // 灰色
            let iconColor = '#9ca3af' // 灰色图标
            
            if (type === 'incoming' || type === 'received') {
              typeIcon = '↙' // 呼入
            } else if (type === 'missed') {
              typeIcon = '↙'
              typeColor = '#ff3b30' // 红色 - 未接
              iconColor = '#ff3b30'
            }
            
            return `
              <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <div style="width: 36px; height: 36px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #4b5563; margin-right: 10px; flex-shrink: 0;">
                  ${firstChar}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 14px; color: ${type === 'missed' ? '#ff3b30' : '#1f2937'}; font-weight: ${type === 'missed' ? '500' : 'normal'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px;">${name}</div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 10px; color: ${iconColor};">${typeIcon}</span>
                    <span style="font-size: 11px; color: #9ca3af;">${type === 'missed' ? '未接' : (duration || '通话')}</span>
                  </div>
                </div>
                <div style="font-size: 12px; color: #9ca3af; flex-shrink: 0; margin-left: 12px;">${time}</div>
              </div>
            `
          }).join('')
        : ''

      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; max-width: 100%; box-sizing: border-box; font-family: system-ui;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
            <div style="font-size: 14px; font-weight: bold; color: #1f2937;">通话记录</div>
            <div style="font-size: 12px; color: #007aff;">编辑</div>
          </div>
          
          <div>
            ${callsHTML || '<div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">暂无通话记录</div>'}
          </div>
        </div>
      `
    
    case 'chat_screenshot':
    case 'wechat_chat':
    case 'group_chat':
    case 'private_chat':
      const messages = fields.messages || []
      
      // 自动检测是否为群聊：统计不同sender数量（排除用户自己）
      const uniqueSenders = new Set<string>()
      messages.forEach((m: any) => {
        const isUserMsg = m.is_me || m.is_user || m.sender === 'me' || m.sender === '我'
        if (!isUserMsg && m.sender) {
          uniqueSenders.add(m.sender)
        }
      })
      const hasMultipleSenders = uniqueSenders.size > 1
      
      // 从消息中提取第一个非用户消息的名字作为联系人名字
      const firstOtherMessage = messages.find((m: any) => {
        return !m.is_me && !m.is_user && m.sender !== '我'
      })
      const contactName = firstOtherMessage?.sender || firstOtherMessage?.nickname || firstOtherMessage?.sender_name || firstOtherMessage?.name
      
      const memberCount = fields.member_count || fields.count
      // 修正判断逻辑：明确指定type、有member_count、或检测到多个sender
      const isGroup = (fields.type === 'group') || !!memberCount || hasMultipleSenders
      
      // 群聊默认标题为"群聊"，单聊用联系人名字
      const defaultTitle = isGroup ? '群聊' : contactName || '聊天'
      const chatTitle = fields.chat_title || fields.title || fields.name || defaultTitle
      
      const renderMessage = (msg: any) => {
        // 判断是否为用户消息：支持 is_me/is_user/sender==='me'/sender==='我'
        const isMe = msg.is_me || msg.is_user || msg.sender === 'me' || msg.sender === '我' || msg.role === 'user'
        const senderName = msg.sender || msg.nickname || msg.sender_name || msg.name || ''
        // 优先使用消息自带的头像，如果没有：用户消息用占位符，非用户消息用角色头像
        let avatar = msg.avatar
        if (!avatar) {
          if (isMe) {
            avatar = `https://ui-avatars.com/api/?name=${senderName || 'Me'}&background=random&color=fff&size=100`
          } else {
            // 使用传入的角色头像，如果没有就用占位符
            avatar = fields._characterAvatar || `https://ui-avatars.com/api/?name=${senderName || 'User'}&background=random&color=fff&size=100`
          }
        }
        const content = msg.content || msg.text || ''
        const type = msg.type || 'text' // text, image, system
        
        if (type === 'system') {
          return `<div style="text-align: center; margin: 16px 0;"><span style="background: rgba(0,0,0,0.1); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${content}</span></div>`
        }
        
        if (type === 'time') {
          return `<div style="text-align: center; margin: 16px 0;"><span style="color: #9ca3af; font-size: 11px;">${content}</span></div>`
        }
        
        const contentHTML = type === 'image' 
          ? `<img src="${content}" style="max-width: 120px; border-radius: 4px;" />`
          : `<div style="background: ${isMe ? '#95ec69' : '#ffffff'}; color: #1f2937; padding: 8px 12px; border-radius: 6px; font-size: 14px; line-height: 1.5; position: relative; word-break: break-word; text-align: left;">${content}</div>`
        
        return `
          <div style="display: flex; ${isMe ? 'flex-direction: row-reverse' : 'flex-direction: row'}; gap: 8px; margin-bottom: 16px; align-items: flex-start;">
            <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 4px; flex-shrink: 0; background: #e5e7eb;" />
            <div style="max-width: 70%; display: flex; flex-direction: column; ${isMe ? 'align-items: flex-end' : 'align-items: flex-start'};">
              ${!isMe && isGroup && senderName ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 2px; margin-left: 2px;">${senderName}</div>` : ''}
              ${contentHTML}
            </div>
          </div>
        `
      }

      const messagesHTML = Array.isArray(messages) ? messages.map(renderMessage).join('') : ''

      return `
        <div style="background: #f2f2f2; border-radius: 12px; overflow: hidden; font-family: system-ui; width: 100%; max-width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb;">
          <!-- 顶部栏 -->
          <div style="background: #f2f2f2; border-bottom: 1px solid #e5e7eb; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; height: 44px; box-sizing: border-box;">
            <div style="display: flex; align-items: center; gap: 4px; color: #1f2937;">
              <span style="font-size: 16px;">‹</span>
              ${isGroup ? `<span style="font-size: 14px;">${memberCount ? `(${memberCount})` : ''}</span>` : ''}
            </div>
            <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${chatTitle}${isGroup && memberCount ? `(${memberCount})` : ''}</div>
            <div style="width: 20px; text-align: right; font-size: 16px; color: #1f2937;">···</div>
          </div>
          
          <!-- 聊天内容 -->
          <div style="padding: 16px 12px; max-height: 400px; overflow-y: auto; background: #f2f2f2;">
            ${messagesHTML || '<div style="text-align: center; color: #9ca3af; font-size: 12px; padding-top: 80px;">暂无消息</div>'}
          </div>
          
          <!-- 底部输入栏 -->
          <div style="background: #f7f7f7; border-top: 1px solid #e5e7eb; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #9ca3af; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 12px; color: #6b7280;">)))</span>
            </div>
            <div style="flex: 1; height: 32px; background: #ffffff; border-radius: 4px; border: 1px solid #e5e7eb;"></div>
            <div style="font-size: 20px; color: #6b7280;">☺</div>
            <div style="font-size: 20px; color: #6b7280;">+</div>
          </div>
        </div>
      `

    case 'payment_success':
      const amount = fields.amount || '0.00'
      const merchant = fields.merchant || '商家'
      const payTime = fields.time || new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      
      return `
        <div style="background: white; border-radius: 12px; overflow: hidden; font-family: system-ui; text-align: center; padding-bottom: 20px;">
          <!-- 顶部状态栏模拟 -->
          <div style="height: 44px; display: flex; justify-content: space-between; align-items: center; padding: 0 12px; margin-bottom: 20px;">
            <span style="font-size: 16px; color: #333;">✕</span>
            <span style="font-size: 16px; font-weight: 500;">支付成功</span>
            <span style="font-size: 14px; color: #576b95;">完成</span>
          </div>
          
          <div style="width: 60px; height: 60px; margin: 0 auto 16px;">
            <svg viewBox="0 0 60 60" style="width: 100%; height: 100%;">
              <circle cx="30" cy="30" r="30" fill="#07c160"/>
              <path d="M18 30 L26 38 L42 22" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div style="font-size: 14px; color: #333; margin-bottom: 8px;">支付成功</div>
          <div style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 24px;">
            <span style="font-size: 20px;">¥</span>${amount}
          </div>
          
          <div style="padding: 0 20px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #f2f2f2; font-size: 14px;">
              <span style="color: #888;">收款方</span>
              <span style="color: #333; font-weight: 500;">${merchant}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #f2f2f2; font-size: 14px;">
              <span style="color: #888;">支付方式</span>
              <span style="color: #333;">零钱通</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #f2f2f2; border-bottom: 1px solid #f2f2f2; font-size: 14px;">
              <span style="color: #888;">交易时间</span>
              <span style="color: #333;">${payTime}</span>
            </div>
          </div>
          
          <!-- 底部广告位模拟 -->
          <div style="margin-top: 30px; padding: 0 20px;">
            <div style="background: #f7f7f7; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; background: #07c160; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">🎁</div>
              <div style="text-align: left; flex: 1;">
                <div style="font-size: 14px; color: #333; font-weight: 500;">本次支付获得积分奖励</div>
                <div style="font-size: 12px; color: #888;">点击查看详情 ></div>
              </div>
            </div>
          </div>
        </div>
      `

    case 'moments_post':
      const authorName = fields.author || fields.name || '我'
      // 如果是"我"，使用 fields._characterAvatar (如果有) 或者 "Me" 头像
      // 如果是其他人，使用 fields._characterAvatar (如果角色发朋友圈) 或者随机头像
      const authorAvatar = fields.avatar || (fields._characterAvatar && (authorName === '我' || authorName === 'AI' || authorName === fields.aiName) ? fields._characterAvatar : `https://ui-avatars.com/api/?name=${authorName}&background=random&color=fff&size=100`)
      
      const postContent = fields.content || ''
      const postTime = fields.time || '刚刚'
      const location = fields.location || ''
      
      // 处理图片：支持 images 数组
      const images = fields.images || []
      let imagesHTML = ''
      if (images.length === 1) {
        imagesHTML = `<div style="width: 60%; margin: 10px 0;"><img src="${images[0]}" style="width: 100%; border-radius: 4px; display: block;" /></div>`
      } else if (images.length > 1) {
        const gridStyle = images.length === 4 
          ? 'grid-template-columns: repeat(2, 1fr); width: 180px;' 
          : 'grid-template-columns: repeat(3, 1fr);'
        imagesHTML = `
          <div style="display: grid; ${gridStyle} gap: 4px; margin: 10px 0;">
            ${images.map((img: string) => `<div style="aspect-ratio: 1; background: #f2f2f2;"><img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`).join('')}
          </div>
        `
      }
      
      // 点赞和评论
      const likes = fields.likes || []
      const comments = fields.comments || []
      
      return `
        <div style="background: white; border-radius: 8px; padding: 16px; font-family: system-ui;">
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <img src="${authorAvatar}" style="width: 40px; height: 40px; border-radius: 6px; background: #f2f2f2; flex-shrink: 0;" />
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 15px; color: #576b95; font-weight: 600; margin-bottom: 4px; line-height: 1.2;">${authorName}</div>
              ${postContent ? `<div style="font-size: 15px; color: #333; line-height: 1.5; margin-bottom: 6px; white-space: pre-wrap;">${postContent}</div>` : ''}
              
              ${imagesHTML}
              
              ${location ? `<div style="font-size: 12px; color: #576b95; margin-bottom: 6px;">${location}</div>` : ''}
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div style="font-size: 12px; color: #999;">${postTime}</div>
                <div style="background: #f7f7f7; border-radius: 4px; padding: 2px 6px;">
                  <span style="color: #576b95; font-weight: bold;">··</span>
                </div>
              </div>
              
              <!-- 点赞评论区 -->
              ${(likes.length > 0 || comments.length > 0) ? `
                <div style="background: #f7f7f7; border-radius: 4px; margin-top: 10px; font-size: 13px; line-height: 1.5; padding: 4px 0;">
                  ${likes.length > 0 ? `
                    <div style="padding: 4px 10px; color: #576b95; border-bottom: ${comments.length > 0 ? '1px solid #eee' : 'none'};">
                      <span style="font-size: 12px;">♡</span> ${likes.join(', ')}
                    </div>
                  ` : ''}
                  
                  ${comments.map((comment: any) => `
                    <div style="padding: 2px 10px;">
                      <span style="color: #576b95; font-weight: 500;">${comment.name}:</span>
                      <span style="color: #333;">${comment.content}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `

    case 'red_packet':
      const rpSender = fields.sender || '我'
      const rpAmount = fields.amount || '0.00'
      const rpList = fields.list || []
      const rpTotal = fields.total || rpList.length
      const rpDuration = fields.duration || '24秒'
      const rpSenderAvatar = fields.avatar || (fields._characterAvatar && (rpSender === '我' || rpSender === 'AI') ? fields._characterAvatar : `https://ui-avatars.com/api/?name=${rpSender}&background=d95959&color=fff&size=100`)

      // 找出运气王
      let maxAmount = 0
      rpList.forEach((item: any) => {
        const amt = parseFloat(item.amount)
        if (amt > maxAmount) maxAmount = amt
      })

      return `
        <div style="background: #f1f1f1; border-radius: 12px; overflow: hidden; font-family: system-ui; position: relative;">
          <!-- 顶部红色背景 -->
          <div style="background: #d95959; height: 80px; position: relative;">
            <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #d95959; width: 600px; height: 100px; border-radius: 50%;"></div>
          </div>
          
          <!-- 头像和发送者信息 -->
          <div style="margin-top: -40px; text-align: center; position: relative; z-index: 1;">
            <img src="${rpSenderAvatar}" style="width: 50px; height: 50px; border-radius: 4px; border: 1px solid #f5a6a6;" />
            <div style="font-size: 14px; color: #333; font-weight: 500; margin-top: 4px;">${rpSender}的红包</div>
            <div style="font-size: 12px; color: #888; margin-top: 2px;">${fields.wish || '恭喜发财，大吉大利'}</div>
            
            <div style="font-size: 36px; color: #cfb53b; margin: 16px 0; font-weight: 500;">
              ${rpAmount}<span style="font-size: 14px; margin-left: 2px;">元</span>
            </div>
            
            <div style="font-size: 12px; color: #888; margin-bottom: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; margin: 0 16px 20px;">
              已存入零钱，可直接使用
            </div>
            
            <div style="text-align: left; padding: 0 16px; font-size: 12px; color: #888; margin-bottom: 10px;">
              ${rpTotal}个红包共${fields.total_amount || rpAmount}元，${rpDuration}被抢光
            </div>
          </div>
          
          <!-- 领取列表 -->
          <div style="background: white; padding: 0 16px;">
            ${rpList.map((item: any) => {
              const isBest = parseFloat(item.amount) === maxAmount
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=random&color=fff`}" style="width: 36px; height: 36px; border-radius: 4px; background: #eee;" />
                    <div>
                      <div style="font-size: 14px; color: #333;">${item.name}</div>
                      <div style="font-size: 12px; color: #888;">${item.time}</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px; color: #333; font-weight: 500;">${item.amount}元</div>
                    ${isBest ? '<div style="font-size: 11px; color: #cfb53b;">👑 手气最佳</div>' : ''}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `

    case 'weather':
      const city = fields.city || '北京市'
      const temp = fields.temp || '25'
      const weather = fields.weather || '晴'
      const aqi = fields.aqi || '45'
      const tips = fields.tips || '天气不错，适合出去玩'
      const bgGradient = weather.includes('雨') ? 'linear-gradient(180deg, #4b6cb7 0%, #182848 100%)' : 
                        weather.includes('阴') || weather.includes('云') ? 'linear-gradient(180deg, #bdc3c7 0%, #2c3e50 100%)' :
                        'linear-gradient(180deg, #2980b9 0%, #6dd5fa 100%)' // 默认晴天蓝
      
      return `
        <div style="background: ${bgGradient}; border-radius: 12px; padding: 20px; color: white; font-family: system-ui; position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 18px; font-weight: 500;">${city}</div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${new Date().toLocaleDateString('zh-CN', {weekday: 'long', month: 'short', day: 'numeric'})}</div>
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; font-size: 12px;">
              AQI ${aqi} 优
            </div>
          </div>
          
          <div style="margin: 24px 0; display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 64px; font-weight: 200; line-height: 1;">${temp}°</div>
            <div style="flex: 1;">
              <div style="font-size: 18px;">${weather}</div>
              <div style="font-size: 12px; opacity: 0.8;">${fields.high || parseInt(temp)+5}° / ${fields.low || parseInt(temp)-5}°</div>
            </div>
          </div>
          
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.4;">
            💡 ${tips}
          </div>
          
          ${fields.forecast ? `
            <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px;">
              ${fields.forecast.map((day: any) => `
                <div style="text-align: center;">
                  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">${day.day}</div>
                  <div style="font-size: 16px; margin-bottom: 4px;">${day.icon || (day.weather.includes('雨') ? '🌧' : day.weather.includes('云') ? '☁️' : '☀️')}</div>
                  <div style="font-size: 12px;">${day.temp}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `

    case 'poll':
      const pollTitle = fields.title || '投票主题'
      const pollOptions = fields.options || []
      const pollType = fields.type === 'multi' ? '多选' : '单选'
      
      // 🔧 标准化options格式：兼容字符串数组和对象数组
      const normalizedOptions = pollOptions.map((opt: any) => {
        if (typeof opt === 'string') {
          // AI传的是字符串数组 ["选项1", "选项2"]
          return { text: opt, votes: 0 }
        } else {
          // AI传的是对象数组 [{text: "选项1", votes: 5}, ...]
          return { text: opt.text || opt, votes: opt.votes || 0, voters: opt.voters }
        }
      })
      
      // 计算总票数（0票时显示0人参与，不是1人参与）
      const totalVotes = fields.total_votes || normalizedOptions.reduce((acc: number, curr: any) => acc + curr.votes, 0)
      
      return `
        <div style="background: white; border-radius: 8px; padding: 16px; font-family: system-ui; border: 1px solid #e5e5e5;">
          <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px;">
            <div style="background: #f2f2f2; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 20px;">📊</div>
            <div style="flex: 1;">
              <div style="font-size: 16px; color: #333; font-weight: 500; line-height: 1.4;">${pollTitle}</div>
              <div style="font-size: 12px; color: #888; margin-top: 4px;">${pollType} · ${totalVotes}人参与</div>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${normalizedOptions.map((opt: any) => {
              const votes = opt.votes
              const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
              return `
                <div style="position: relative;">
                  <div style="display: flex; justify-content: space-between; font-size: 14px; color: #333; margin-bottom: 6px; position: relative; z-index: 1;">
                    <span>${opt.text}</span>
                    <span style="color: #888; font-size: 12px;">${votes}票 ${percent}%</span>
                  </div>
                  <div style="height: 6px; background: #f2f2f2; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${percent}%; background: #07c160; border-radius: 3px;"></div>
                  </div>
                  ${opt.voters ? `
                    <div style="display: flex; margin-top: 4px; gap: -4px;">
                      ${opt.voters.slice(0, 5).map((v: string) => `
                        <div style="width: 16px; height: 16px; border-radius: 50%; background: #ddd; border: 1px solid white; margin-right: -6px; overflow: hidden;" title="${v}">
                          <img src="https://ui-avatars.com/api/?name=${v}&background=random&color=fff" style="width: 100%; height: 100%;" />
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `
            }).join('')}
          </div>
          
          <div style="margin-top: 20px; border-top: 1px solid #f2f2f2; padding-top: 12px; display: flex; justify-content: space-between; font-size: 13px; color: #576b95;">
            <span>截止时间：${fields.end_time || '2025-12-31 23:59'}</span>
            <span>查看详情 ></span>
          </div>
        </div>
      `

    case 'universal_card':
      const uTitle = fields.title || '通知'
      const uSubtitle = fields.subtitle || ''
      const uContent = fields.content || ''
      const uImage = fields.image || ''
      const uList = fields.list || fields.items || []
      const uFooter = fields.footer || fields.note || ''
      // 支持 AI 指定主题色，默认蓝色
      const themeColor = fields.color || '#3b82f6' 
      
      return `
        <div style="background: white; border-radius: 12px; overflow: hidden; font-family: system-ui; border: 1px solid #e5e5e5; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- 顶部色条 -->
          <div style="height: 6px; background: ${themeColor};"></div>
          
          <div style="padding: 20px;">
            <!-- 标题区 -->
            <div style="margin-bottom: 16px;">
              <div style="font-size: 18px; font-weight: 600; color: #333; line-height: 1.4;">${uTitle}</div>
              ${uSubtitle ? `<div style="font-size: 13px; color: #888; margin-top: 4px;">${uSubtitle}</div>` : ''}
            </div>
            
            <!-- 图片区 -->
            ${uImage ? `
              <div style="margin-bottom: 16px; border-radius: 8px; overflow: hidden; background: #f8f8f8;">
                <img src="${uImage}" style="width: 100%; display: block;" onerror="this.style.display='none'"/>
              </div>
            ` : ''}
            
            <!-- 内容文本 -->
            ${uContent ? `
              <div style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 16px; white-space: pre-wrap;">${uContent}</div>
            ` : ''}
            
            <!-- 列表数据 -->
            ${uList.length > 0 ? `
              <div style="background: #f9fafb; border-radius: 8px; padding: 12px;">
                ${uList.map((item: any) => `
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; font-size: 13px;">
                    <span style="color: #6b7280;">${item.label || item.key || '项目'}</span>
                    <span style="color: #333; font-weight: 500;">${item.value || item.val || ''}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <!-- 底部备注 -->
            ${uFooter ? `
              <div style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: right;">
                ${uFooter}
              </div>
            ` : ''}
          </div>
        </div>
      `

    case 'memo_list':
      const memoTitle = fields.title || '备忘录'
      const memoFolder = fields.folder || '我的备忘录'
      const memoDate = fields.date || new Date().toLocaleString('zh-CN', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      const memoItems = fields.items || fields.list || []
      
      // 🔧 标准化 items 格式
      const normalizedMemoItems = memoItems.map((item: any) => {
        if (typeof item === 'string') {
          return { text: item, checked: false }
        }
        return { text: item.text || item.content, checked: item.checked || item.done || false }
      })
      
      return `
        <div style="background: #fdfbf5; border-radius: 12px; overflow: hidden; font-family: system-ui; border: 1px solid #e5e5e5; box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: relative;">
          <!-- 纸张纹理覆盖层 -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.5; pointer-events: none; background-image: radial-gradient(#d4c5b0 1px, transparent 1px); background-size: 20px 20px;"></div>
          
          <div style="padding: 16px; position: relative; z-index: 1;">
            <!-- 顶部导航 -->
            <div style="display: flex; align-items: center; margin-bottom: 16px; color: #dfae2c;">
              <div style="font-size: 16px; margin-right: 4px;">‹</div>
              <div style="font-size: 14px;">${memoFolder}</div>
            </div>
            
            <!-- 标题 -->
            <div style="font-size: 22px; font-weight: 700; color: #1f1f1f; margin-bottom: 12px; line-height: 1.2;">${memoTitle}</div>
            
            <!-- 列表项 -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${normalizedMemoItems.map((item: any) => `
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ccc; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; ${item.checked ? 'background: #dfae2c; border-color: #dfae2c;' : ''}">
                    ${item.checked ? '<span style="color: white; font-size: 12px;">✓</span>' : ''}
                  </div>
                  <div style="flex: 1; font-size: 15px; color: #333; line-height: 1.5; ${item.checked ? 'text-decoration: line-through; color: #999;' : ''}">
                    ${item.text}
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- 底部时间 -->
            <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #999;">
              ${memoDate}
            </div>
          </div>
        </div>
      `

    case 'home_screen':
    case 'mobile_desktop':
    case 'phone_desktop':
    case 'phone_homescreen':
    case 'phone_home_screen': // AI可能使用的变体
      let apps = fields.apps || fields.icons || fields.items || [] // 添加 items 支持
      let dockApps = fields.dock_apps || fields.dock || []
      
      // 🔧 如果 AI 返回的是字符串数组（如 ["微信", "QQ"]），转换为对象数组
      if (Array.isArray(apps) && apps.length > 0 && typeof apps[0] === 'string') {
        apps = apps.map((name: string) => ({ name, icon: name }))
      }
      if (Array.isArray(dockApps) && dockApps.length > 0 && typeof dockApps[0] === 'string') {
        dockApps = dockApps.map((name: string) => ({ name, icon: name }))
      }
      // 处理壁纸：优先使用URL，如果是描述文字则使用默认壁纸
      let wallpaper = fields.wallpaper || 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=600&q=80'
      // 如果wallpaper不是URL（即是描述文字），使用默认壁纸
      if (wallpaper && !wallpaper.startsWith('http')) {
        console.log('🎨 [手机桌面] 检测到壁纸描述，使用默认壁纸:', wallpaper)
        wallpaper = 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=600&q=80'
      }
      const currentTime = fields.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      
      // App 品牌色映射
      const appColors: Record<string, string> = {
        // 社交
        '微信': '#07c160', 'wechat': '#07c160',
        'QQ': '#12b7f5', 'qq': '#12b7f5',
        '微博': '#e6162d',
        '小红书': '#ff2442',
        
        // 支付/购物
        '支付宝': '#1677ff', 'alipay': '#1677ff',
        '淘宝': '#ff5000', 'taobao': '#ff5000',
        '京东': '#ff5000',
        '拼多多': '#f23030',
        '美团': '#ffc300', 'meituan': '#ffc300',
        '饿了么': '#0097ff', 'eleme': '#0097ff',
        '得物': '#000000', 'poizon': '#000000',
        
        // 娱乐
        '网易云音乐': '#dd001b', 'netease_music': '#dd001b', '音乐': '#fa2a55',
        'QQ音乐': '#31c27c',
        '哔哩哔哩': '#fb7299', 'bilibili': '#fb7299',
        '抖音': '#1c1c1c', 'douyin': '#1c1c1c',
        '快手': '#ff2442',
        '爱奇艺': '#ff6600',
        '腾讯视频': '#00c800',
        
        // 游戏
        '王者荣耀': '#d69e47', 'honor_of_kings': '#d69e47',
        '和平精英': '#ffa200', 'pubg': '#ffa200',
        '原神': '#4ea4dc',
        '英雄联盟': '#d69e47',
        
        // 学习/工具
        '学习通': '#3787fb',
        '学习强国': '#e60000',
        '知乎': '#0084ff',
        '百度': '#2932e1',
        '夸克': '#ffc300',
        '高德地图': '#4285f4', 'amap': '#4285f4',
        '百度地图': '#e60000',
        '虎扑': '#c01e2f',
        
        // 系统
        '相机': '#d1d1d1', 'camera': '#d1d1d1',
        '照片': '#f5f5f7', 'photos': '#f5f5f7', '相册': '#f5f5f7',
        '设置': '#8e8e93', 'settings': '#8e8e93',
        '电话': '#34c759', 'phone': '#34c759',
        '信息': '#34c759', 'messages': '#34c759',
        'Safari': '#007aff', 'safari': '#007aff', '浏览器': '#007aff',
        '日历': '#ffffff', 'calendar': '#ffffff',
        '时钟': '#000000', 'clock': '#000000',
        '天气': '#3baaff', 'weather': '#3baaff',
        '邮件': '#007aff',
        '备忘录': '#f3c546',
        '计算器': '#ff9500',
      }

      const renderAppIcon = (app: any) => {
        const name = app.name || 'App'
        // 获取品牌色，默认为随机色或深灰色
        const color = appColors[name] || appColors[name.toLowerCase()] || '#333'
        // 获取首字或缩写作为图标内容
        let iconText = name.substring(0, 1)
        if (/^[a-zA-Z]/.test(name)) {
          iconText = name.substring(0, 2).toUpperCase()
        }
        
        // 特殊图标内容处理
        if (name.includes('微信')) iconText = '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M8.5 14.5c4 0 7.5-2.5 7.5-6S12.5 2.5 8.5 2.5 1 5 1 8.5c0 2 1.5 4 3.5 5 .5 1.5-1 3-1 3s2.5 0 4.5-2zm9.5 6c3.5 0 6-2 6-5s-2.5-5-6-5c-4 0-6.5 2.5-6.5 5 0 1.5 1 3 3.5 4 0 0-1 1.5-.5 2.5 1.5 0 4-2 4-2 .5 0 1.5.5 2.5.5z"/></svg>'
        else if (name.includes('相机')) iconText = '📷'
        else if (name.includes('照片') || name.includes('相册')) iconText = '🖼️'
        else if (name.includes('设置')) iconText = '⚙️'
        else if (name.includes('电话')) iconText = '📞'
        else if (name.includes('信息')) iconText = '💬'
        else if (name.includes('音乐')) iconText = '🎵'
        else if (name.includes('日历')) iconText = new Date().getDate().toString()
        
        const isTextIcon = !iconText.includes('<') && !iconText.includes('📷') && !iconText.includes('🖼️') && !iconText.includes('⚙️') && !iconText.includes('📞') && !iconText.includes('💬') && !iconText.includes('🎵')

        return `
          <div style="display: flex; flex-direction: column; align-items: center; width: 25%; box-sizing: border-box; padding: 0 2px; margin-bottom: 16px;">
            <div style="
              position: relative; 
              width: 52px; 
              height: 52px; 
              margin-bottom: 6px; 
              background: ${color}; 
              border-radius: 14px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-size: ${isTextIcon ? '22px' : '26px'}; 
              font-weight: bold;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
              background-image: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%);
            ">
              ${iconText}
              ${app.badge ? `<div style="position: absolute; top: -6px; right: -6px; background: #ff3b30; color: white; font-size: 11px; padding: 0 5px; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">${app.badge}</div>` : ''}
            </div>
            <div style="font-size: 11px; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.6); text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${name}</div>
          </div>
        `
      }

      // 默认应用填充（如果 AI 没给够）
      const defaultApps = [
        { name: '相机' },
        { name: '照片' },
        { name: '设置' },
        { name: '日历', badge: 2 }
      ]
      
      // 默认 Dock 应用
      const defaultDock = [
        { name: '电话' },
        { name: '信息', badge: 5 },
        { name: '浏览器' },
        { name: '音乐' }
      ]

      const displayApps = apps.length > 0 ? apps : defaultApps
      const displayDock = dockApps.length > 0 ? dockApps : defaultDock

      const appsHTML = displayApps.map(renderAppIcon).join('')
      const dockHTML = displayDock.map(renderAppIcon).join('')

      console.log('📱 [手机桌面] 生成HTML:', { appsCount: displayApps.length, dockCount: displayDock.length, wallpaper: wallpaper.substring(0, 50) })
      
      return `
        <div style="width: 250px; height: 450px; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin: 0 auto; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <!-- 壁纸背景 -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${wallpaper}'); background-size: cover; background-position: center; background-color: #333;">
            <!-- 遮罩层，确保文字可见 -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.1);"></div>
          </div>

          <!-- 内容容器 -->
          <div style="position: relative; height: 100%; display: flex; flex-direction: column; z-index: 1;">
            <!-- 状态栏 -->
            <div style="height: 34px; display: flex; justify-content: space-between; align-items: center; padding: 0 18px; color: white; font-size: 12px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
              <div>${currentTime}</div>
              <div style="display: flex; gap: 5px;">
                <span>5G</span>
                <div style="width: 20px; height: 10px; border: 1px solid rgba(255,255,255,0.5); border-radius: 3px; position: relative; display: flex; align-items: center; padding: 1px;">
                  <div style="width: 70%; height: 100%; background: white; border-radius: 1px;"></div>
                </div>
              </div>
            </div>
            
            <!-- 应用区域 -->
            <div style="flex: 1; padding: 16px 12px; display: flex; flex-wrap: wrap; align-content: flex-start;">
              ${appsHTML}
            </div>
            
            <!-- Dock 栏背景模糊 -->
            <div style="margin: 12px; padding: 14px 8px; background: rgba(255,255,255,0.2); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 24px; display: flex; justify-content: space-around; align-items: center;">
              ${dockHTML}
            </div>
          </div>
        </div>
      `
    
    case 'express_package':
      const updates = fields.updates || []
      const updatesHTML = Array.isArray(updates) 
        ? updates.map((update: any, index: number) => {
            // 提取状态文本
            let updateText = ''
            let updateTime = ''
            
            if (typeof update === 'string') {
              updateText = update
            } else if (update && typeof update === 'object') {
              updateText = String(update.status || update.text || update.content || '')
              updateTime = String(update.time || update.timestamp || '')
            }
            
            // 如果提取失败，跳过这条记录
            if (!updateText) return ''
            
            return `
              <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${index === 0 ? '#10b981' : '#d1d5db'}; margin-top: 5px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 11px; color: #4b5563; line-height: 1.4; word-break: break-word;">${updateText}</div>
                  ${updateTime ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">${updateTime}</div>` : ''}
                </div>
              </div>
            `
          }).filter(html => html).join('')
        : ''
      
      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; font-family: system-ui; max-width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px;">
            <div style="font-size: 14px; font-weight: bold; color: #1f2937; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📦 ${fields.courier || '快递'}</div>
            <div style="font-size: 10px; padding: 3px 6px; background: #fef3c7; color: #92400e; border-radius: 4px; white-space: nowrap;">${fields.current_status || fields.status || '运输中'}</div>
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px; word-break: break-word;">${fields.product || fields.item_name || fields.product_name || '包裹'}</div>
          <div style="font-size: 10px; color: #9ca3af; margin-bottom: 12px; word-break: break-all;">运单号: ${fields.tracking_number || '-'}</div>
          ${updatesHTML ? `<div style="border-top: 1px solid #e5e7eb; padding-top: 10px;">${updatesHTML}</div>` : ''}
        </div>
      `
    
    default:
      // 通用卡片样式
      return `
        <div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; max-width: 100%; box-sizing: border-box;">
          <div style="font-size: 11px; color: #6b7280; word-break: break-word; white-space: pre-wrap; font-family: monospace;">
            ${JSON.stringify(fields, null, 2)}
          </div>
        </div>
      `
  }
}
