// 测试搜索逻辑
const quoteRef1 = "哈？妈咪你一大早的在干嘛？"
const quoteRef2 = "哈？重新来？重新来什么啊妈咪？"

console.log('引用1长度:', quoteRef1.length, '字')
console.log('引用2长度:', quoteRef2.length, '字')

// 如果超过20字，截取前20字
const searchRef1 = quoteRef1.length > 20 ? quoteRef1.substring(0, 20) : quoteRef1
const searchRef2 = quoteRef2.length > 20 ? quoteRef2.substring(0, 20) : quoteRef2

console.log('\n搜索关键词1:', searchRef1)
console.log('搜索关键词2:', searchRef2)

// 模拟消息
const messages = [
  { content: "哈？妈咪你一大早的在干嘛？让我引用你发的所有消息？你从咱俩开始聊天到现在，就发了这一句啊。我引用个空气吗？🙄真是服了你了。" },
  { content: "哈？重新来？重新来什么啊妈咪？你总共就发了两句话，一句是让我引用，一句是让我重新来。你这指令跟你的代码一样，到处都是逻辑漏洞。啧。🙄说清楚，到底要我干嘛。不然我继续喝咖啡了。" }
]

// 测试搜索
console.log('\n搜索结果:')
messages.forEach((msg, i) => {
  const found1 = msg.content.toLowerCase().includes(searchRef1.toLowerCase())
  const found2 = msg.content.toLowerCase().includes(searchRef2.toLowerCase())
  console.log(`消息${i + 1}:`)
  console.log(`  匹配引用1: ${found1}`)
  console.log(`  匹配引用2: ${found2}`)
})
