// 测试引用消息保存的脚本
// 在浏览器控制台运行

async function testQuoteSave() {
  const { loadMessages } = await import('./src/utils/simpleMessageManager.js')
  
  // 获取所有聊天ID
  const allChats = Object.keys(localStorage).filter(k => k.startsWith('messages_'))
  
  console.log('🔍 检查所有聊天中的引用消息...')
  
  for (const key of allChats) {
    const chatId = key.replace('messages_', '')
    const messages = loadMessages(chatId)
    
    const quotedMessages = messages.filter(m => m.quotedMessage)
    if (quotedMessages.length > 0) {
      console.log(`📎 找到引用消息: chatId=${chatId}`)
      quotedMessages.forEach(msg => {
        console.log('  - 消息ID:', msg.id)
        console.log('  - 内容:', msg.content?.substring(0, 50))
        console.log('  - 引用:', msg.quotedMessage)
      })
    }
  }
  
  console.log('✅ 检查完成')
}

testQuoteSave()
