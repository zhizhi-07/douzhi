/**
 * 修复损坏的备份文件
 * 用法: node fix-backup.js <备份文件路径>
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];

if (!inputFile) {
  console.log('用法: node fix-backup.js <备份文件路径>');
  console.log('例如: node fix-backup.js douzhi_chat_backup.json');
  process.exit(1);
}

console.log(`📦 读取文件: ${inputFile}`);

// 读取文件
let content;
try {
  content = fs.readFileSync(inputFile, 'utf8');
  console.log(`📦 文件大小: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
} catch (e) {
  console.error('❌ 无法读取文件:', e.message);
  process.exit(1);
}

// 尝试解析 JSON
console.log('🔍 尝试解析 JSON...');
let data;
try {
  data = JSON.parse(content);
  console.log('✅ JSON 格式正确！');
} catch (e) {
  console.log('⚠️ JSON 损坏，尝试修复...');
  
  // 尝试找到最后一个完整的对象
  let lastValidPos = 0;
  let braceCount = 0;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escape = true;
      continue;
    }
    
    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastValidPos = i + 1;
        }
      }
    }
  }
  
  if (lastValidPos > 0 && lastValidPos < content.length) {
    console.log(`🔧 截断到位置 ${lastValidPos} (原长度 ${content.length})`);
    content = content.substring(0, lastValidPos);
    
    try {
      data = JSON.parse(content);
      console.log('✅ 修复成功！');
    } catch (e2) {
      console.log('⚠️ 简单截断失败，尝试手动修复...');
      
      // 尝试补全 JSON
      let fixed = content;
      
      // 计算未闭合的括号
      braceCount = 0;
      let bracketCount = 0;
      inString = false;
      escape = false;
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        
        if (escape) {
          escape = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          escape = true;
          continue;
        }
        
        if (char === '"' && !escape) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }
      
      // 如果在字符串中间截断，先闭合字符串
      if (inString) {
        fixed += '"';
      }
      
      // 闭合括号
      for (let i = 0; i < bracketCount; i++) {
        fixed += ']';
      }
      for (let i = 0; i < braceCount; i++) {
        fixed += '}';
      }
      
      try {
        data = JSON.parse(fixed);
        console.log('✅ 手动修复成功！');
        content = fixed;
      } catch (e3) {
        console.error('❌ 无法修复 JSON，文件损坏太严重');
        console.log('');
        console.log('💡 建议：');
        console.log('1. 如果你有其他备份，请使用其他备份');
        console.log('2. 如果应用里还有数据，用新版本重新导出');
        process.exit(1);
      }
    }
  } else {
    console.error('❌ 无法找到有效的 JSON 结构');
    process.exit(1);
  }
}

// 分析数据
console.log('');
console.log('📊 数据分析:');
console.log(`  - 版本: ${data.version || '未知'}`);
console.log(`  - 类型: ${data.type || '未知'}`);
console.log(`  - 导出时间: ${data.exportTime || '未知'}`);

if (data.localStorage) {
  console.log(`  - localStorage: ${Object.keys(data.localStorage).length} 项`);
}

if (data.indexedDB) {
  console.log(`  - IndexedDB 数据库:`);
  for (const dbName of Object.keys(data.indexedDB)) {
    const db = data.indexedDB[dbName];
    const stores = Object.keys(db);
    console.log(`    - ${dbName}: ${stores.length} 个 store`);
    
    // 检查角色数据
    if (dbName === 'DouzhiDB' && db.characters) {
      const chars = db.characters;
      if (chars.keys && chars.values && chars.values[0]) {
        const charArray = chars.values[0];
        if (Array.isArray(charArray)) {
          console.log(`      👤 角色: ${charArray.length} 个`);
        }
      }
    }
  }
}

// 清理大数据（base64 图片）
console.log('');
console.log('🧹 清理 base64 数据...');

let cleaned = 0;

function cleanObject(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      // 清理 base64 图片
      if (value.startsWith('data:image/') && value.length > 1000) {
        obj[key] = '[已清理的图片]';
        cleaned++;
      }
      // 清理 base64 音频
      else if (value.startsWith('data:audio/') && value.length > 1000) {
        obj[key] = '[已清理的音频]';
        cleaned++;
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => cleanObject(item, `${path}[${i}]`));
    } else if (typeof value === 'object' && value !== null) {
      cleanObject(value, `${path}.${key}`);
    }
  }
}

cleanObject(data);
console.log(`  - 清理了 ${cleaned} 个 base64 数据`);

// 保存修复后的文件
const outputFile = inputFile.replace('.json', '_fixed.json');
console.log('');
console.log(`💾 保存修复后的文件: ${outputFile}`);

const output = JSON.stringify(data);
fs.writeFileSync(outputFile, output);

const newSize = output.length / 1024 / 1024;
console.log(`✅ 完成！新文件大小: ${newSize.toFixed(2)} MB`);
console.log('');
console.log('📝 下一步：');
console.log(`   用修复后的文件 "${path.basename(outputFile)}" 进行导入`);
