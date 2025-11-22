import { TheatreTemplate } from '../../theatreTemplates'

export const watchQqTemplate: TheatreTemplate = {
    id: 'watch_qq',
    category: '社交通讯',
    name: '手表',
    keywords: ['手表', '旧消息', '已读未回'],
    fields: [
      { key: 'CHARACTER_NAME', label: '角色昵称', placeholder: '示例' },
      { key: 'DATE', label: '日期', placeholder: '2018-11-21' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
      { key: 'MSG1', label: '消息1', placeholder: '在吗' },
      { key: 'MSG2', label: '消息2', placeholder: '...' },
      { key: 'MSG3', label: '消息3', placeholder: '你还好吗' },
      { key: 'MSG4', label: '消息4', placeholder: '我一直在等你' },
    ],
    htmlTemplate: `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#e3f2fd;font-family:SimSun,serif;padding:10px}.qq-window{width:100%;max-width:380px;margin:0 auto;background:#fff;border:2px solid #4169e1;box-shadow:3px 3px 0 rgba(0,0,0,0.2);opacity:0.85}.title-bar{background:linear-gradient(180deg,#6495ed 0%,#4169e1 100%);padding:4px 8px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e3a8a}.title-text{color:#fff;font-size:12px;font-weight:bold}.title-buttons{display:flex;gap:4px}.title-btn{width:16px;height:16px;background:#ddd;border:1px solid #999;font-size:10px;line-height:14px;text-align:center;cursor:pointer}.menu-bar{background:#f0f0f0;padding:2px 4px;border-bottom:1px solid #ccc;font-size:11px;color:#333}.chat-info{background:#fffacd;padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;color:#666}.chat-content{background:#fff;padding:8px;min-height:200px;max-height:300px;overflow-y:auto}.msg{margin-bottom:8px;font-size:12px;line-height:1.6;text-align:left}.msg-time{color:#999;font-size:10px;text-align:center;margin:8px 0}.msg-sender{color:#00f;font-weight:bold}.msg-text{color:#000;margin-left:4px}.msg-unread{color:#f44336;font-size:10px;margin-left:6px;font-weight:bold}.input-bar{background:#f5f5f5;border-top:2px solid #ccc;padding:6px}.input-tools{background:#e8e8e8;padding:3px;border:1px solid #ccc;margin-bottom:4px;font-size:10px;color:#666}.input-box{background:#fff;border:1px solid #999;padding:6px;min-height:50px;font-size:12px;font-family:SimSun,serif}.send-btn{background:linear-gradient(180deg,#f0f0f0 0%,#d0d0d0 100%);border:1px solid #999;padding:4px 16px;font-size:12px;margin-top:4px;cursor:pointer;float:right}</style></head><body><div class="qq-window"><div class="title-bar"><div class="title-text">与 {{CHARACTER_NAME}} 聊天中</div><div class="title-buttons"><div class="title-btn">_</div><div class="title-btn">□</div><div class="title-btn">×</div></div></div><div class="menu-bar">消息(M) 查看(V) 工具(T) 帮助(H)</div><div class="chat-info">{{CHARACTER_NAME}} ({{DATE}} {{TIME}})</div><div class="chat-content"><div class="msg-time">{{DATE}} {{TIME}}</div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG1}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG2}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG3}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG4}}</span><span class="msg-unread">未读</span></div></div><div class="input-bar"><div class="input-tools">字体 表情 截图 抖动窗口 发送文件</div><div class="input-box">对方长时间未回复...</div><button class="send-btn">发送(S)</button></div></div></body></html>
    `.trim()
  }
