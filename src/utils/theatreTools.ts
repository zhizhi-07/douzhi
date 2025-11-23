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
        description: '模板ID，用下划线命名。常用：shopping_cart(购物车)、express_delivery(物流)、food_delivery(外卖订单)、transfer(转账)、movie_ticket(电影票)。'
      },
      data: {
        type: 'object',
        description: '模板数据，根据模板类型填充。如购物车需要items数组，物流需要courier/tracking_number/updates等。'
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
export function convertTheatreToolCallToMessage(toolCall: TheatreToolCall) {
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
    chat_screenshot: '聊天记录',
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
    bargain: '砍价'
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
    case 'group_chat':
    case 'private_chat':
      const chatTitle = fields.title || fields.name || '群聊'
      const memberCount = fields.member_count || fields.count
      const messages = fields.messages || []
      const isGroup = !!memberCount || (fields.type === 'group')
      
      const renderMessage = (msg: any) => {
        const isMe = msg.is_me || msg.sender === 'me' || msg.role === 'user'
        const senderName = msg.sender_name || msg.name || ''
        const avatar = msg.avatar || `https://ui-avatars.com/api/?name=${senderName || (isMe ? 'Me' : 'User')}&background=random&color=fff&size=100`
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
          <div style="padding: 16px 12px; min-height: 200px; background: #f2f2f2;">
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

    case 'home_screen':
    case 'mobile_desktop':
    case 'phone_desktop':
    case 'phone_homescreen': // 添加 AI 猜的这个 ID
      const apps = fields.apps || fields.icons || fields.items || [] // 添加 items 支持
      const dockApps = fields.dock_apps || fields.dock || []
      const wallpaper = fields.wallpaper || 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=600&q=80'
      const currentTime = fields.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      
      // 常用图标映射
      const iconMap: Record<string, string> = {
        wechat: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png',
        qq: 'https://cdn-icons-png.flaticon.com/512/3670/3670023.png',
        alipay: 'https://cdn-icons-png.flaticon.com/512/10475/10475961.png',
        taobao: 'https://cdn-icons-png.flaticon.com/512/10475/10475988.png',
        camera: 'https://cdn-icons-png.flaticon.com/512/3617/3617279.png',
        photos: 'https://cdn-icons-png.flaticon.com/512/2659/2659360.png',
        settings: 'https://cdn-icons-png.flaticon.com/512/3067/3067451.png',
        calendar: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
        phone: 'https://cdn-icons-png.flaticon.com/512/724/724664.png',
        messages: 'https://cdn-icons-png.flaticon.com/512/3059/3059561.png',
        browser: 'https://cdn-icons-png.flaticon.com/512/3617/3617169.png',
        music: 'https://cdn-icons-png.flaticon.com/512/3616/3616075.png'
      }

      const renderAppIcon = (app: any) => {
        const name = app.name || 'App'
        // 尝试从 iconMap 获取，或者使用传入的 URL，或者生成默认头像
        let iconUrl = app.icon
        if (iconUrl && !iconUrl.startsWith('http')) {
          // 如果是关键词（如 "wechat"），尝试查找映射
          const key = iconUrl.toLowerCase().replace(/[^a-z0-9]/g, '')
          iconUrl = iconMap[key] || `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&size=100&font-size=0.5`
        } else if (!iconUrl) {
          iconUrl = `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&size=100&font-size=0.5`
        }

        const badge = app.badge ? `<div style="position: absolute; top: -5px; right: -5px; background: #ff3b30; color: white; font-size: 10px; padding: 0 4px; min-width: 14px; height: 14px; border-radius: 7px; display: flex; align-items: center; justify-content: center; line-height: 1;">${app.badge}</div>` : ''
        
        return `
          <div style="display: flex; flex-direction: column; align-items: center; width: 25%;">
            <div style="position: relative; width: 48px; height: 48px; margin-bottom: 4px;">
              <img src="${iconUrl}" style="width: 100%; height: 100%; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.2);" />
              ${badge}
            </div>
            <div style="font-size: 10px; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5); text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
          </div>
        `
      }

      // 默认应用填充（如果 AI 没给够）
      const defaultApps = [
        { name: '相机', icon: 'https://cdn-icons-png.flaticon.com/512/3617/3617279.png' },
        { name: '照片', icon: 'https://cdn-icons-png.flaticon.com/512/2659/2659360.png' },
        { name: '设置', icon: 'https://cdn-icons-png.flaticon.com/512/3067/3067451.png' },
        { name: '日历', icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png', badge: 2 }
      ]
      
      // 默认 Dock 应用
      const defaultDock = [
        { name: '电话', icon: 'https://cdn-icons-png.flaticon.com/512/724/724664.png' },
        { name: '信息', icon: 'https://cdn-icons-png.flaticon.com/512/3059/3059561.png', badge: 5 },
        { name: '浏览器', icon: 'https://cdn-icons-png.flaticon.com/512/3617/3617169.png' },
        { name: '音乐', icon: 'https://cdn-icons-png.flaticon.com/512/3616/3616075.png' }
      ]

      const displayApps = apps.length > 0 ? apps : defaultApps
      const displayDock = dockApps.length > 0 ? dockApps : defaultDock

      const appsHTML = displayApps.map(renderAppIcon).join('')
      const dockHTML = displayDock.map(renderAppIcon).join('')

      return `
        <div style="position: relative; border-radius: 16px; overflow: hidden; font-family: system-ui; width: 100%; padding-top: 177.77%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${wallpaper}'); background-size: cover; background-position: center;"></div>
          
          <!-- 状态栏 -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 30px; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; color: white; font-size: 12px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
            <div>${currentTime}</div>
            <div style="display: flex; gap: 4px;">
              <span>5G</span>
              <span>🔋</span>
            </div>
          </div>
          
          <!-- 应用区域 -->
          <div style="position: absolute; top: 40px; left: 16px; right: 16px; display: flex; flex-wrap: wrap; row-gap: 16px;">
            ${appsHTML}
          </div>
          
          <!-- Dock 栏 -->
          <div style="position: absolute; bottom: 16px; left: 12px; right: 12px; height: 80px; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border-radius: 24px; display: flex; align-items: center; justify-content: space-around; padding: 0 8px;">
            ${dockHTML}
          </div>
        </div>
      `

    case 'express_delivery':
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
