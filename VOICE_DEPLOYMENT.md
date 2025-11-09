# 🎤 语音系统部署指南

由于浏览器CORS跨域限制，MiniMax TTS需要通过后端代理调用。

## 📦 方案：Vercel Serverless Functions（免费）

### 第一步：安装Vercel CLI

```bash
npm install -g vercel
```

### 第二步：登录Vercel

```bash
vercel login
```

（会打开浏览器，用GitHub/GitLab/Email登录）

### 第三步：部署项目

在项目根目录运行：

```bash
vercel
```

按照提示：
1. Set up and deploy? **Yes**
2. Which scope? 选择你的账户
3. Link to existing project? **No**
4. What's your project's name? 输入项目名（或直接回车）
5. In which directory is your code? **./ (当前目录)**
6. 检测到Vite项目，确认配置
7. 等待部署完成

### 第四步：获取部署URL

部署成功后会显示：
```
✅ Production: https://your-app.vercel.app
```

### 第五步：测试语音功能

1. 访问部署的网址
2. 进入"系统设置 → 语音设置"
3. 配置API Key和Group ID
4. 测试语音功能

---

## 🔧 本地开发测试

如果想在本地测试Serverless函数：

```bash
vercel dev
```

这会在本地启动开发服务器，Serverless函数也能正常工作。

---

## ⚡ 快速部署命令

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署（一键完成）
vercel --prod
```

---

## ✅ 部署检查清单

- [x] ✅ 创建了 `/api/minimax-tts.js` 代理文件
- [x] ✅ 前端代码已修改为调用代理
- [x] ✅ vercel.json 配置已就绪
- [ ] 🚀 运行 `vercel` 部署项目
- [ ] 🎤 测试语音功能

---

## 💡 注意事项

1. **免费额度**：Vercel免费版完全够用
2. **域名**：部署后会得到 `xxx.vercel.app` 域名
3. **自动部署**：关联GitHub后，每次push自动部署
4. **API密钥安全**：API Key仅在前端→代理时传输，代理→MiniMax时使用

---

## 🆘 常见问题

**Q: 本地开发怎么测试？**
A: 运行 `vercel dev` 而不是 `npm run dev`

**Q: 部署失败怎么办？**
A: 检查是否安装了依赖 `npm install`

**Q: 能换其他部署平台吗？**
A: 可以，但需要修改Serverless函数格式

---

## 🎉 完成！

部署后，语音功能就能正常使用了！
