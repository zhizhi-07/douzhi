/**
 * 视频通话工具函数
 */

export interface CallCommand {
  type: 'mute' | 'unmute' | 'camera-off' | 'camera-on' | 'hang-up'
  pattern: RegExp
  message: (charName: string) => string
  emoji: string
}

/**
 * 通话控制指令配置
 */
export const CALL_COMMANDS: CallCommand[] = [
  {
    type: 'mute',
    pattern: /[\[【]静音[\]】]/,
    message: (name) => `${name}静音了，你听不见${name}的声音了`,
    emoji: '🔇'
  },
  {
    type: 'unmute',
    pattern: /[\[【]取消静音[\]】]/,
    message: (name) => `${name}取消静音了，你可以听见${name}的声音了`,
    emoji: '🔊'
  },
  {
    type: 'camera-off',
    pattern: /[\[【]关闭摄像头[\]】]/,
    message: (name) => `${name}关闭了摄像头，你看不见${name}了`,
    emoji: '📵'
  },
  {
    type: 'camera-on',
    pattern: /[\[【]打开摄像头[\]】]/,
    message: (name) => `${name}打开了摄像头，你可以看见${name}了`,
    emoji: '📹'
  },
  {
    type: 'hang-up',
    pattern: /[\[【]挂断电话[\]】]/,
    message: () => 'AI要挂断电话',
    emoji: '📴'
  }
]

/**
 * 从AI回复中移除所有控制指令
 */
export function removeControlCommands(text: string): string {
  let cleaned = text
  for (const cmd of CALL_COMMANDS) {
    cleaned = cleaned.replace(cmd.pattern, '')
  }
  return cleaned
}

/**
 * 检测AI回复中的控制指令
 */
export function detectCommands(aiReply: string) {
  const detected: { command: CallCommand; match: RegExpMatchArray }[] = []
  
  for (const cmd of CALL_COMMANDS) {
    const match = aiReply.match(cmd.pattern)
    if (match) {
      detected.push({ command: cmd, match })
    }
  }
  
  return detected
}

/**
 * 解析对话内容（分离画面描述和普通对话）
 */
export function parseDialogueLines(text: string): {
  type: 'narrator' | 'message'
  content: string
}[] {
  const lines = text.split('\n').filter(l => l.trim())
  const result: { type: 'narrator' | 'message'; content: string }[] = []
  
  for (const line of lines) {
    // 检测画面描述 [画面:...] 或 【画面：...】
    const narratorMatch = line.match(/[\[【]画面[:\：](.+?)[\]】]/)
    if (narratorMatch) {
      result.push({
        type: 'narrator',
        content: narratorMatch[1].trim()
      })
    } else if (line.trim()) {
      result.push({
        type: 'message',
        content: line.trim()
      })
    }
  }
  
  return result
}

/**
 * 格式化控制台日志
 */
export function logApiContext(params: {
  title: string
  systemPrompt: string
  chatContext: any[]
  callContext: any[]
}) {
  const { title, systemPrompt, chatContext, callContext } = params
  
  console.group(`🤖 ${title}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 系统提示词：')
  console.log(systemPrompt)
  
  if (chatContext.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`💭 最近聊天记录（${chatContext.length} 条）：`)
    console.table(chatContext.map((msg, i) => ({
      序号: i + 1,
      角色: msg.role === 'user' ? '用户' : 'AI',
      内容: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
    })))
  }
  
  if (callContext.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📞 当前通话记录：')
    console.table(callContext.map((msg, i) => ({
      序号: i + 1,
      角色: msg.role === 'system' ? '旁白' : (msg.role === 'user' ? '用户' : 'AI'),
      内容: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
    })))
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 统计信息：', {
    系统提示词长度: systemPrompt.length,
    聊天记录条数: chatContext.length,
    通话记录条数: callContext.length,
    总消息数: 1 + chatContext.length + callContext.length
  })
  console.groupEnd()
}
