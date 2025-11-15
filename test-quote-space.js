// 测试引用正则表达式（带空格）
const pattern = /[\[【]?(?:引用了?(?:你的消息)?[:\：]?\s*["「『"'"]?([^\]】]+?)["」』"'"]?|引用[:\：]\s*([^\]】]+)|回复[:\：]\s*([^\]】]+))[\]】]/g

const text = `[引用: 哈？妈咪你一大早的在干嘛？]
[引用: 哈？重新来？重新来什么啊妈咪？]`

const matches = text.match(pattern)

console.log('找到的引用:')
matches?.forEach((match, i) => {
  console.log(`${i + 1}. ${match}`)
  
  // 提取引用内容
  const contentMatch = match.match(/[\[【]?(?:引用了?(?:你的消息)?[:\：]?\s*["「『"'"]?([^\]】]+?)["」』"'"]?|引用[:\：]\s*([^\]】]+)|回复[:\：]\s*([^\]】]+))[\]】]/)
  const content = (contentMatch[1] || contentMatch[2] || contentMatch[3] || '').trim()
  console.log(`   内容: "${content}"`)
})
