import { AIPhoneContent } from './aiPhoneGenerator'

// 解析文本格式的手机内容
export const parsePhoneContent = (text: string, characterId: string, characterName: string): AIPhoneContent => {
  console.log('📱 [手机解析] 开始解析，文本长度:', text.length)
  console.log('📱 [手机解析] 文本前500字符:', text.substring(0, 500))
  
  // 清理AI返回的内容（去除可能的markdown代码块）
  let cleanedText = text.replace(/```[\w]*\n?/g, '').trim()
  console.log('📱 [手机解析] 清理后长度:', cleanedText.length)
  
  const sections = cleanedText.split('===').filter(s => s.trim())
  console.log('📱 [手机解析] 分段数量:', sections.length)
  
  const result: AIPhoneContent = {
    characterId,
    characterName,
    generatedAt: Date.now(),
    contacts: [],
    wechatChats: [],
    browserHistory: [],
    taobaoOrders: [],
    alipayBills: [],
    photos: [],
    notes: [],
    musicPlaylist: [],
    footprints: [],
    forumPosts: []
  }

  sections.forEach((section, index) => {
    const lines = section.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      console.log(`📱 [手机解析] 跳过段落${index}，行数不足`)
      return
    }

    const type = lines[0].trim()
    console.log(`📱 [手机解析] 处理段落${index}: ${type}, 总行数: ${lines.length}`)
    
    // 过滤掉标题行、示例行、提示行和空行
    const dataLines = lines.slice(1).filter(l => {
      const trimmed = l.trim()
      return trimmed && 
        !trimmed.startsWith('姓名') && 
        !trimmed.startsWith('标题') && 
        !trimmed.startsWith('聊天') && 
        !trimmed.startsWith('商品') && 
        !trimmed.startsWith('描述') && 
        !trimmed.startsWith('歌曲') && 
        !trimmed.startsWith('地点') &&
        !trimmed.includes('|||示例') &&
        !trimmed.includes('继续生成') &&
        !trimmed.includes('(') && 
        !trimmed.includes('）')
    })
    
    console.log(`📱 [手机解析] ${type} 有效数据行数: ${dataLines.length}`)
    if (dataLines.length > 0) {
      console.log(`📱 [手机解析] ${type} 第一条数据:`, dataLines[0].substring(0, 100))
    }

    switch (type) {
      case '通讯录':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {  // 放宽条件，至少3个字段
            result.contacts.push({
              name: parts[0].trim(),
              phone: parts[1].trim(),
              relation: parts[2].trim(),
              notes: parts[3]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 通讯录解析完成: ${result.contacts.length}条`)
        break

      case '微信聊天':
        let currentChat: any = null
        dataLines.forEach(line => {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('对话：')) {
            if (currentChat) {
              const parts = trimmedLine.substring(3).split('|||')
              if (parts.length >= 3) {
                currentChat.messages.push({
                  content: parts[1].trim(),
                  isSelf: parts[0].trim() === 'self',
                  time: parts[2].trim(),
                  type: 'text'
                })
              }
            }
          } else {
            const parts = trimmedLine.split('|||')
            if (parts.length >= 4) {
              // 保存上一个聊天
              if (currentChat && currentChat.messages.length > 0) {
                result.wechatChats.push(currentChat)
              }
              // 创建新聊天
              currentChat = {
                name: parts[0].trim(),
                lastMessage: parts[1].trim(),
                time: parts[2].trim(),
                unread: parseInt(parts[3]) || 0,
                messages: []
              }
            }
          }
        })
        // 保存最后一个聊天（只有有消息的才保存）
        if (currentChat && currentChat.messages.length > 0) {
          result.wechatChats.push(currentChat)
        }
        console.log(`📱 [手机解析] 微信聊天解析完成: ${result.wechatChats.length}个会话`)
        break

      case '浏览器历史':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {  // 放宽条件
            result.browserHistory.push({
              title: parts[0].trim(),
              url: parts[1].trim(),
              time: parts[2].trim(),
              reason: parts[3]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 浏览器历史解析完成: ${result.browserHistory.length}条`)
        break

      case '淘宝订单':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {  // 放宽条件
            result.taobaoOrders.push({
              title: parts[0].trim(),
              price: parts[1].trim(),
              status: parts[2].trim(),
              reason: parts[3]?.trim() || '',
              thought: parts[4]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 淘宝订单解析完成: ${result.taobaoOrders.length}条`)
        break

      case '支付宝账单':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 4) {  // 放宽条件
            result.alipayBills.push({
              title: parts[0].trim(),
              amount: parts[1].trim(),
              type: parts[2].trim().includes('收入') ? 'income' : 'expense',
              time: parts[3].trim(),
              reason: parts[4]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 支付宝账单解析完成: ${result.alipayBills.length}条`)
        break

      case '相册':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {
            result.photos.push({
              description: parts[0].trim(),
              location: parts[1].trim(),
              time: parts[2].trim()
            })
          }
        })
        console.log(`📱 [手机解析] 相册解析完成: ${result.photos.length}条`)
        break

      case '备忘录':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {
            result.notes.push({
              title: parts[0].trim(),
              content: parts[1].trim(),
              time: parts[2].trim()
            })
          }
        })
        console.log(`📱 [手机解析] 备忘录解析完成: ${result.notes.length}条`)
        break

      case '音乐播放列表':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 2) {  // 放宽条件
            result.musicPlaylist.push({
              title: parts[0].trim(),
              artist: parts[1].trim(),
              mood: parts[2]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 音乐播放列表解析完成: ${result.musicPlaylist.length}首`)
        break

      case '足迹':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 5) {  // 放宽条件
            result.footprints.push({
              location: parts[0].trim(),
              address: parts[1].trim(),
              time: parts[2].trim(),
              duration: parts[3].trim(),
              activity: parts[4].trim(),
              mood: parts[5]?.trim() || '',
              companion: parts[6]?.trim() || ''
            })
          }
        })
        console.log(`📱 [手机解析] 足迹解析完成: ${result.footprints.length}条`)
        break

      case '论坛':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 5) {  // 至少需要标题、论坛、内容、时间、是否评论
            const hasCommented = parts[4].trim() === '是'
            result.forumPosts.push({
              title: parts[0].trim(),
              forum: parts[1].trim(),
              content: parts[2].trim(),
              time: parts[3].trim(),
              hasCommented,
              comment: hasCommented && parts[5] ? parts[5].trim() : undefined,
              reason: parts[6]?.trim() || undefined
            })
          }
        })
        console.log(`📱 [手机解析] 论坛解析完成: ${result.forumPosts.length}条`)
        break
    }
  })

  // 输出最终统计
  console.log('📱 [手机解析] 解析完成，数据统计:', {
    通讯录: result.contacts.length,
    微信聊天: result.wechatChats.length,
    浏览器历史: result.browserHistory.length,
    淘宝订单: result.taobaoOrders.length,
    支付宝账单: result.alipayBills.length,
    相册: result.photos.length,
    备忘录: result.notes.length,
    音乐: result.musicPlaylist.length,
    足迹: result.footprints.length,
    论坛: result.forumPosts.length
  })

  return result
}
