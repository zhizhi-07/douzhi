#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动迁移模板脚本
从 theatreTemplates.ts 拆分成独立文件
"""

import re
import os

# 分类到文件夹的映射
CATEGORY_FOLDERS = {
    '社交通讯': 'social',
    '生活消费': 'life',
    '工作学习': 'work',
    '情感关系': 'emotion',
    '娱乐休闲': 'entertainment',
    '健康医疗': 'health',
    '证件文书': 'document',
    '交通出行': 'transport',
    '隐私安全': 'privacy',
    '工具应用': 'tool',
}

# 创建所有分类文件夹
base_path = 'G:/douzhi/src/data/templates'
for folder in CATEGORY_FOLDERS.values():
    os.makedirs(f'{base_path}/{folder}', exist_ok=True)

# 读取原文件
with open('G:/douzhi/src/data/theatreTemplates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取所有模板（匹配 { id: 'xxx', ... } 完整对象）
pattern = r'\{\s*id:\s*\'([^\']+)\',\s*category:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',[^}]*?keywords:[^}]*?fields:[^}]*?htmlTemplate:[^`]*?`[^`]*?`\.trim\(\)\s*\}'

templates = []
for match in re.finditer(pattern, content, re.DOTALL):
    template_str = match.group(0)
    template_id = match.group(1)
    category = match.group(2)
    name = match.group(3)
    
    # 生成变量名（驼峰命名）
    var_name = ''.join(word.capitalize() for word in template_id.split('_')) + 'Template'
    var_name = var_name[0].lower() + var_name[1:]
    
    # 获取文件夹
    folder = CATEGORY_FOLDERS.get(category, 'other')
    
    # 生成文件内容
    file_content = f"""import {{ TheatreTemplate }} from '../../theatreTemplates'

export const {var_name}: TheatreTemplate = {template_str}
"""
    
    # 写入文件
    file_path = f'{base_path}/{folder}/{template_id}.ts'
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(file_content)
    
    templates.append({
        'id': template_id,
        'name': name,
        'category': category,
        'folder': folder,
        'var_name': var_name
    })
    
    print(f'✅ {name} -> templates/{folder}/{template_id}.ts')

# 生成 index.ts
imports = []
exports = []

for cat, folder in CATEGORY_FOLDERS.items():
    cat_templates = [t for t in templates if t['category'] == cat]
    if cat_templates:
        imports.append(f'\n// {cat}')
        for t in cat_templates:
            imports.append(f"import {{ {t['var_name']} }} from './{folder}/{t['id']}'")
            exports.append(t['var_name'])

index_content = f"""/**
 * 自动生成 - 请勿手动编辑
 * 生成时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
 */

import {{ TheatreTemplate }} from '../theatreTemplates'
{''.join(imports)}

// 所有模板
export const allTemplates: TheatreTemplate[] = [
  {',\n  '.join(exports)}
]

// 按分类索引
export const templatesByCategory = {{
  '社交通讯': allTemplates.filter(t => t.category === '社交通讯'),
  '生活消费': allTemplates.filter(t => t.category === '生活消费'),
  '工作学习': allTemplates.filter(t => t.category === '工作学习'),
  '情感关系': allTemplates.filter(t => t.category === '情感关系'),
  '娱乐休闲': allTemplates.filter(t => t.category === '娱乐休闲'),
  '健康医疗': allTemplates.filter(t => t.category === '健康医疗'),
  '证件文书': allTemplates.filter(t => t.category === '证件文书'),
  '交通出行': allTemplates.filter(t => t.category === '交通出行'),
  '隐私安全': allTemplates.filter(t => t.category === '隐私安全'),
  '工具应用': allTemplates.filter(t => t.category === '工具应用'),
}}

// 按ID快速查找
export const templatesById = allTemplates.reduce((acc, t) => {{
  acc[t.id] = t
  return acc
}}, {{}} as Record<string, TheatreTemplate>)
"""

with open(f'{base_path}/index.ts', 'w', encoding='utf-8') as f:
    f.write(index_content)

print(f'\n🎉 迁移完成！共 {len(templates)} 个模板')
print(f'📝 已更新 templates/index.ts')
