const fs = require('fs');
const content = fs.readFileSync('g:/douzhi/src/pages/ChatSettings.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let lineNum = 0;

for (const line of lines) {
  lineNum++;
  
  // 匹配开标签
  const openMatches = line.matchAll(/<div[^>]*>/g);
  for (const match of openMatches) {
    stack.push({ line: lineNum, tag: match[0] });
  }
  
  // 匹配闭标签
  const closeMatches = line.matchAll(/<\/div>/g);
  for (const _ of closeMatches) {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log(`❌ Line ${lineNum}: 多余的闭标签`);
    }
  }
}

console.log(`\n未闭合的div标签 (${stack.length}个):`);
stack.forEach(item => {
  console.log(`Line ${item.line}: ${item.tag.substring(0, 50)}`);
});
