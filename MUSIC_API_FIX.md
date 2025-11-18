# 音乐搜索功能修复指南

## 问题描述

音乐搜索功能出现CORS错误和500错误，原因是：
1. Cloudflare Worker使用的第三方API（`api.vkeys.cn`）可能不稳定或失效
2. 缺少备用API源
3. 错误处理不够完善

## 解决方案

已更新 `cloudflare-worker.js`，添加了以下改进：

### ✅ 多个备用API源

现在支持3个API源，按优先级自动切换：

1. **injahow.cn** - 主要API源，基于Meting
2. **vkeys.cn** - 备用API源
3. **uomg.com** - 随机音乐API（有限支持）

### ✅ 改进的错误处理

- 所有响应都正确返回CORS头
- 添加了5秒超时控制，避免长时间等待
- 失败时自动切换到下一个API源
- 添加健康检查端点 `/health`

### ✅ 更好的日志输出

Worker现在会记录详细的调试信息，方便排查问题。

## 部署步骤

### 方法1：Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 找到你的Worker（`zhizhi-api`）
4. 点击 **Quick edit**
5. 复制 `cloudflare-worker.js` 的完整内容
6. 粘贴替换现有代码
7. 点击 **Save and Deploy**

### 方法2：使用Wrangler CLI

```bash
# 安装wrangler（如果未安装）
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 发布Worker
wrangler deploy cloudflare-worker.js --name zhizhi-api
```

## 验证部署

部署完成后，可以测试以下端点：

### 1. 健康检查
```
https://zhizhi-api.2373922440jhj.workers.dev/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "Music API Proxy is running",
  "timestamp": "2024-..."
}
```

### 2. 搜索测试
```
https://zhizhi-api.2373922440jhj.workers.dev/api/music/search?keyword=周杰伦
```

应该返回歌曲列表或错误信息。

## 常见问题

### Q: 部署后还是报CORS错误？

A: 检查以下几点：
- 确认代码已成功保存并部署
- 清除浏览器缓存（Ctrl+Shift+R）
- 检查Worker日志是否有错误

### Q: 搜索没有结果？

A: 可能的原因：
- 所有API源都暂时不可用
- 搜索关键词太特殊
- 网络连接问题

可以查看浏览器控制台，会显示详细的错误信息。

### Q: 如何查看Worker日志？

A: 
1. 进入Cloudflare Dashboard
2. 打开你的Worker
3. 点击 **Logs** 标签
4. 选择 **Begin log stream**

## 备注

- 该修复已添加API切换机制，提高了可用性
- 如果injahow API失效，会自动切换到vkeys
- 前端已有QQ音乐等备用方案，作为最后的fallback
- API源可能需要定期更新维护

## 监控建议

建议定期（每周）访问以下URL测试API可用性：
- https://zhizhi-api.2373922440jhj.workers.dev/health
- https://zhizhi-api.2373922440jhj.workers.dev/api/music/search?keyword=test

如果发现问题，可以考虑添加更多API源或使用付费API服务。
