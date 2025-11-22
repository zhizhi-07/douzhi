const fs = require('fs');
const path = require('path');

const CATEGORY_FOLDERS = {
  '社交通讯': 'social',
  '生活消费': 'life',
  '工作学习': 'work',
  '情感关系': 'emotion',
  '娱乐休闲': 'entertainment',
  '健康医疗': 'health',
  '证件文书': 'document',
  '交通出行': 'transport',
  '隐私安全': 'privacy',
  '工具应用': 'tool'
};

const basePath = 'G:/douzhi/src/data/templates';

// 创建文件夹
Object.values(CATEGORY_FOLDERS).forEach(folder => {
  const folderPath = path.join(basePath, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// 读取原文件
const content = fs.readFileSync('G:/douzhi/src/data/theatreTemplates.ts', 'utf8');

// 按模板分割（寻找 },\n\n  { 作为分隔符）
const templatePattern = /\{\s+id:\s*'([^']+)',\s+category:\s*'([^']+)',\s+name:\s*'([^']+)',[\s\S]*?\.trim\(\)\s+\}/g;

const templates = [];
let match;
let count = 0;

while ((match = templatePattern.exec(content)) !== null) {
  const templateBlock = match[0];
  const id = match[1];
  const category = match[2];
  const name = match[3];
  
  const folder = CATEGORY_FOLDERS[category];
  if (!folder) {
    console.log(`⚠️  未知分类: ${category} (${name})`);
    continue;
  }
  
  // 生成变量名 (camelCase)
  const varName = id.split('_')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Template';
  
  // 生成文件内容
  const fileContent = `import { TheatreTemplate } from '../../theatreTemplates'\n\nexport const ${varName}: TheatreTemplate = ${templateBlock}\n`;
  
  // 写入文件
  const filePath = path.join(basePath, folder, `${id}.ts`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  
  templates.push({ id, name, category, folder, varName });
  count++;
  console.log(`✅ [${count}] ${name} -> templates/${folder}/${id}.ts`);
}

// 生成 index.ts
const imports = [];
const exportList = [];

Object.entries(CATEGORY_FOLDERS).forEach(([catName, folder]) => {
  const catTemplates = templates.filter(t => t.category === catName);
  if (catTemplates.length > 0) {
    imports.push(`\n// ${catName}`);
    catTemplates.forEach(t => {
      imports.push(`import { ${t.varName} } from './${folder}/${t.id}'`);
      exportList.push(t.varName);
    });
  }
});

const indexContent = `/**
 * 自动生成 - 请勿手动编辑
 * 生成时间: ${new Date().toLocaleString('zh-CN')}
 * 模板总数: ${templates.length}
 */

import { TheatreTemplate } from '../theatreTemplates'
${imports.join('\n')}

// 所有模板
export const allTemplates: TheatreTemplate[] = [
  ${exportList.join(',\n  ')}
]

// 按分类索引
export const templatesByCategory = {
  '社交通讯': allTemplates.filter(t => t.category === '社交通讯'),
  '生活消费': allTemplates.filter(t => t.category === '生活消费'),
  '工作学习': allTemplates.filter(t => t.category === '工作学习'),
  '情感关系': allTemplates.filter(t => t.category === '情感关系'),
  '娱乐休闲': allTemplates.filter(t => t.category === '娱乐休闲'),
  '健康医疗': allTemplates.filter(t => t.category === '健康医疗'),
  '证件文书': allTemplates.filter(t => t.category === '证件文书'),
  '交通出行': allTemplates.filter(t => t.category === '交通出行'),
  '隐私安全': allTemplates.filter(t => t.category === '隐私安全'),
  '工具应用': allTemplates.filter(t => t.category === '工具应用')
}

// 按ID快速查找
export const templatesById = allTemplates.reduce((acc, t) => {
  acc[t.id] = t
  return acc
}, {} as Record<string, TheatreTemplate>)
`;

fs.writeFileSync(path.join(basePath, 'index.ts'), indexContent, 'utf8');

console.log(`\n🎉 迁移完成！共 ${templates.length} 个模板`);
console.log(`📝 已生成 templates/index.ts`);
console.log(`\n📊 分类统计:`);
Object.keys(CATEGORY_FOLDERS).forEach(cat => {
  const count = templates.filter(t => t.category === cat).length;
  if (count > 0) console.log(`  ${cat}: ${count}个`);
});
