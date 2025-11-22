# 角色卡世界书导入修复

## 问题描述

导入角色卡时，有些角色卡带世界书能成功导入，有些却不能导入世界书。

## 根本原因

在 `characterCardParser.ts` 中，世界书检测逻辑过于严格：

### 原代码问题
```typescript
if (characterBook && Array.isArray(characterBook.entries) && characterBook.entries.length > 0) {
  // 只有当 entries 是数组且非空时才导入
}
```

这个检查有两个问题：
1. **不支持对象格式的 entries**：有些角色卡使用对象格式存储 entries（如 `{0: {...}, 1: {...}}`）
2. **没有转换逻辑**：即使检测到对象格式，也没有将其转换为数组

## 修复方案

### 1. 支持对象格式的 entries
```typescript
let entriesArray: any[] = []
if (Array.isArray(characterBook.entries)) {
  entriesArray = characterBook.entries
} else if (typeof characterBook.entries === 'object' && characterBook.entries !== null) {
  // 对象格式，转换为数组
  entriesArray = Object.values(characterBook.entries)
}
```

### 2. 标准化世界书格式
```typescript
const normalizedBook = {
  ...characterBook,
  entries: entriesArray  // 确保 entries 始终是数组
}
```

### 3. 增强调试日志
添加了详细的调试信息，帮助诊断问题：
- 检查哪些字段存在（`character_book`、`characterBook`、`extensions.character_book`）
- 显示 entries 的类型和格式
- 显示转换过程

## 修改文件

- `src/utils/characterCardParser.ts` (第329-383行)

## 测试建议

1. **测试数组格式的世界书**：导入使用标准数组格式的角色卡
2. **测试对象格式的世界书**：导入使用对象格式的角色卡
3. **测试不同字段名**：
   - `data.character_book`
   - `data.characterBook`
   - `data.extensions.character_book`
4. **查看控制台日志**：导入时查看浏览器控制台，确认世界书检测和转换过程

## 预期效果

修复后，所有带世界书的角色卡都应该能够正确导入世界书，无论其使用何种格式存储 entries。

## 注意事项

- 修复不会影响已导入的角色，只影响新导入的角色卡
- 如果之前导入失败的角色卡，需要重新导入才能获得世界书
- 控制台日志会显示详细的导入过程，便于排查问题
