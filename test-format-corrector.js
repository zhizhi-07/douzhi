// 测试格式修正器

const testMessage = `[引用了我的消息: "？最后四个看不懂"] 看不懂？装什么傻。你不是最懂这个吗。要我给你翻译翻译？就是字面意思。`;

let fixed = testMessage;
const corrections = [];

// 步骤1：修正引用变体
fixed = fixed.replace(/\[([^[\]]*?引用[^[\]]*?)\]/g, (match, content) => {
  let cleaned = content
    .replace(/引用了?(?:我|你)的?消息[:\：]?\s*/g, '')
    .replace(/^引用[:\：]?\s*/g, '')
    .replace(/[""]([^""]+)[""]/, '$1')
    .trim()
  
  if (cleaned) {
    corrections.push(`引用格式：统一为标准格式`)
    console.log('步骤1 - 修正引用变体:');
    console.log('  匹配到:', match);
    console.log('  提取到:', content);
    console.log('  清理后:', cleaned);
    console.log('  修正为:', `[引用:${cleaned}]`);
    return `[引用:${cleaned}]`
  }
  return match
});

console.log('\n步骤1后的结果:', fixed);
console.log('');

// 步骤2：合并引用和回复
fixed = fixed.replace(/(\[引用[:\：]\s*[^\]]+\])[\s\n]+([^\[]+?)(?=\n\[|$)/g, (fullMatch, quote, reply, offset, string) => {
  const trimmedReply = reply.trim()
  console.log('步骤2 - 合并引用和回复:');
  console.log('  完整匹配:', fullMatch);
  console.log('  引用部分:', quote);
  console.log('  回复部分:', reply);
  console.log('  trim后:', trimmedReply);
  
  if (trimmedReply) {
    corrections.push(`引用格式：将分离的引用和回复合并`)
    const quoteContent = quote.slice(1, -1)
    const result = `[${quoteContent} 回复:${trimmedReply}]`;
    console.log('  修正为:', result);
    return result
  }
  return quote + '\n' + reply
});

console.log('\n最终结果:', fixed);
console.log('\n修正项:', corrections);
console.log('\n是否修正:', corrections.length > 0);
