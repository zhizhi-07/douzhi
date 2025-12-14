# 简单导入指南

## 当前问题
- 文件太大导致内存溢出
- 数据库被占用导致超时

## 临时解决方案

### 步骤 1：清理浏览器
1. 关闭所有其他标签页
2. 打开开发者工具（F12）
3. 进入 Application 标签
4. 清除所有网站数据（Clear site data）

### 步骤 2：重新导出（使用新版本）
1. 刷新页面
2. 点击"导出聊天数据"
3. 文件名应该是 `douzhi_chat_backup.json`
4. 文件大小应该在 100MB 以下

### 步骤 3：导入
1. 刷新页面
2. 等待 5 秒（让页面完全加载）
3. 点击"导入数据"
4. 选择刚才导出的 JSON 文件
5. 等待导入完成

## 如果还是失败

### 方案 A：使用隐私模式
1. 打开隐私/无痕浏览模式
2. 访问 localhost:3000
3. 直接导入文件

### 方案 B：手动清理数据库
1. F12 打开控制台
2. 粘贴运行：
```javascript
// 删除所有 IndexedDB
const dbs = ['DouzhiDB', 'AILocationDB', 'forum_db', 'EmojiDB'];
for(const db of dbs) {
  indexedDB.deleteDatabase(db);
}
// 清空 localStorage  
localStorage.clear();
alert('已清空所有数据，请刷新页面');
```
3. 刷新页面
4. 重新导入

## 最终方案（如果以上都失败）

我会创建一个独立的导入页面，避免所有冲突。
