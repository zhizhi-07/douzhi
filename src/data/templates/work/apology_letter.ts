import { TheatreTemplate } from '../../theatreTemplates'

export const apologyLetterTemplate: TheatreTemplate = {
    id: 'apology_letter',
    category: '工作学习',
    name: '检讨书',
    keywords: ['检讨书', '检讨', '认错', '道歉信', '反省'],
    fields: [
      { key: 'TO_WHO', label: '写给谁', placeholder: '老师/领导/对象' },
      { key: 'MISTAKE', label: '错误内容', placeholder: '我做错了什么' },
      { key: 'REASON', label: '犯错原因', placeholder: '为什么会犯错' },
      { key: 'REFLECTION', label: '深刻反思', placeholder: '我的认识' },
      { key: 'PROMISE', label: '保证措施', placeholder: '以后怎么做' },
      { key: 'SIGNATURE', label: '署名', placeholder: '你的名字' },
      { key: 'DATE', label: '日期', placeholder: '2024年11月21日' },
    ],
    htmlTemplate: `
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.paper{width:100%;max-width:360px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;border:1px solid #e5e5e5}.header{background:#fff;color:#2d3436;padding:20px;text-align:center;border-bottom:2px solid #f0f0f0}.header h1{font-size:20px;margin-bottom:8px;font-weight:600}.header p{font-size:12px;color:#999}.content{padding:20px}.section{margin-bottom:20px}.section-title{font-size:14px;color:#666;margin-bottom:8px;font-weight:600}.section-content{font-size:14px;line-height:1.8;color:#333;background:#f9f9f9;padding:12px;border-radius:6px;border-left:3px solid #2d3436;white-space:pre-wrap;word-wrap:break-word;opacity:0;animation:typing 2s steps(60,end) forwards,fadeIn 0.5s forwards}.footer{display:flex;justify-content:space-between;align-items:center;padding:0 20px 20px;font-size:13px;color:#666}.signature{text-align:right}.btn-group{padding:20px;border-top:1px solid #f0f0f0;display:flex;gap:10px}.btn{flex:1;padding:10px;border:none;border-radius:6px;font-size:14px;cursor:pointer;transition:all 0.3s}.btn-accept{background:#2d3436;color:#fff}.btn-accept:active{background:#1a1d1f;transform:scale(0.98)}.btn-reject{background:#f0f0f0;color:#666}.btn-reject:active{background:#e0e0e0;transform:scale(0.98)}@keyframes fadeIn{to{opacity:1}}@keyframes typing{from{max-height:0}to{max-height:500px}}.折叠{display:none}.展开按钮{text-align:center;padding:10px;color:#2d3436;cursor:pointer;font-size:13px;user-select:none}.展开按钮:active{opacity:0.7}input[type="checkbox"]{display:none}#toggle:checked~.content .折叠{display:block}#toggle:checked~.展开按钮 .展开文字{display:none}#toggle:checked~.展开按钮 .折叠文字{display:inline}#toggle:not(:checked)~.展开按钮 .折叠文字{display:none}</style></head><body><div class="paper"><div class="header"><h1>检讨书</h1><p>深刻反省 · 诚恳道歉</p></div><input type="checkbox" id="toggle"><label for="toggle" class="展开按钮"><span class="展开文字">▼ 点击展开完整内容</span><span class="折叠文字">▲ 点击收起</span></label><div class="content"><div class="section"><div class="section-title">致：{{TO_WHO}}</div></div><div class="section"><div class="section-title">我犯的错误</div><div class="section-content">{{MISTAKE}}</div></div><div class="section 折叠"><div class="section-title">犯错原因</div><div class="section-content" style="animation-delay:0.5s">{{REASON}}</div></div><div class="section 折叠"><div class="section-title">深刻反思</div><div class="section-content" style="animation-delay:1s">{{REFLECTION}}</div></div><div class="section 折叠"><div class="section-title">改正措施</div><div class="section-content" style="animation-delay:1.5s">{{PROMISE}}</div></div></div><div class="footer 折叠"><div class="signature">检讨人：{{SIGNATURE}}<br>{{DATE}}</div></div><div class="btn-group 折叠"><button class="btn btn-accept" onclick="this.textContent='已接受检讨';this.disabled=true">接受检讨</button><button class="btn btn-reject" onclick="this.textContent='不够深刻';this.disabled=true">需要重写</button></div></div></body></html>
    `.trim()
  }
