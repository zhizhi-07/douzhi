import { TheatreTemplate } from '../../theatreTemplates'

export const sexTimerTemplate: TheatreTemplate = {
    id: 'sex_timer',
    category: '情感关系',
    name: '性爱时长',
    keywords: ['性爱时长', '性爱记录', '时长统计', '性生活'],
    fields: [
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'START_TIME', label: '开始时间', placeholder: '23:15' },
      { key: 'END_TIME', label: '结束时间', placeholder: '00:48' },
      { key: 'DURATION', label: '总时长', placeholder: '1小时33分' },
      { key: 'FOREPLAY', label: '前戏时长', placeholder: '18分钟' },
      { key: 'MAIN', label: '主要时长', placeholder: '45分钟' },
      { key: 'AFTERCARE', label: '后戏时长', placeholder: '30分钟' },
      { key: 'FOREPLAY_DETAIL', label: '前戏详情', placeholder: '（不少于50字）详细描述前戏的过程和感受...' },
      { key: 'MAIN_DETAIL', label: '正题详情', placeholder: '（不少于50字）详细描述主要过程的体验...' },
      { key: 'AFTERCARE_DETAIL', label: '后戏详情', placeholder: '（不少于50字）详细描述后戏的温存和对话...' },
      { key: 'POSITION_COUNT', label: '体位数', placeholder: '5' },
      { key: 'RATING', label: '体验评分', placeholder: '9.5' },

      { key: 'PARTNER_RATING', label: '对方评分', placeholder: '9.8' },
      { key: 'CLIMAX', label: '高潮次数', placeholder: '3' },
      { key: 'POSITIONS_DETAIL', label: '详细体位列表', placeholder: '正常位、后入位' },
      { key: 'CLIMAX_DETAIL', label: '高潮详情描述', placeholder: '2次阴蒂高潮、1次混合高潮' },
      { key: 'LOCATION', label: '地点', placeholder: '卧室' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#0f0f12;border-radius:24px;overflow:hidden;font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,Roboto,sans-serif;box-shadow:0 20px 40px -10px rgba(0,0,0,0.5);position:relative;border:1px solid rgba(255,255,255,0.06)">
  <!-- 背景装饰 -->
  <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.15), transparent 60%);pointer-events:none"></div>
  <div style="position:absolute;bottom:0;right:0;width:150px;height:150px;background:radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1), transparent 60%);pointer-events:none"></div>

  <!-- 头部：日期与地点 -->
  <div style="position:relative;padding:24px 24px 0;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">DATE</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.9);font-weight:500">{{DATE}}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">LOCATION</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.9);font-weight:500;display:flex;align-items:center;justify-content:flex-end;gap:4px">
        {{LOCATION}}
      </div>
    </div>
  </div>

  <!-- 核心：总时长 -->
  <div style="position:relative;padding:32px 0 40px;text-align:center">
    <div style="font-size:12px;color:#ec4899;letter-spacing:2px;margin-bottom:8px;font-weight:600;opacity:0.8">TOTAL DURATION</div>
    <div style="font-size:56px;font-weight:800;line-height:1;background:linear-gradient(135deg, #fff 0%, #e0e0e0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-2px;text-shadow:0 10px 20px rgba(0,0,0,0.2);font-variant-numeric:tabular-nums">
      {{DURATION}}
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.3);margin-top:8px;font-family:monospace">{{START_TIME}} — {{END_TIME}}</div>
  </div>

  <!-- 节奏分析 -->
  <div style="position:relative;padding:0 24px 24px;">
    <div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.03)">
      <!-- 可视化条 -->
      <div style="display:flex;height:6px;width:100%;border-radius:3px;overflow:hidden;margin-bottom:16px">
        <div style="flex:1;background:linear-gradient(90deg, #6366f1, #8b5cf6);opacity:0.8"></div>
        <div style="flex:2;background:linear-gradient(90deg, #ec4899, #f43f5e);margin:0 2px"></div>
        <div style="flex:1;background:linear-gradient(90deg, #f59e0b, #fbbf24);opacity:0.8"></div>
      </div>
      
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div data-action="toggle-foreplay" style="text-align:left;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          <div style="font-size:10px;color:#8b5cf6;margin-bottom:2px">前戏 <span style="font-size:8px">▼</span></div>
          <div style="font-size:16px;color:rgba(255,255,255,0.9);font-weight:600">{{FOREPLAY}}</div>
        </div>
        <div data-action="toggle-main" style="text-align:center;transform:scale(1.1);cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          <div style="font-size:10px;color:#f43f5e;margin-bottom:2px">正题 <span style="font-size:8px">▼</span></div>
          <div style="font-size:18px;color:#fff;font-weight:700">{{MAIN}}</div>
        </div>
        <div data-action="toggle-aftercare" style="text-align:right;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          <div style="font-size:10px;color:#fbbf24;margin-bottom:2px">后戏 <span style="font-size:8px">▼</span></div>
          <div style="font-size:16px;color:rgba(255,255,255,0.9);font-weight:600">{{AFTERCARE}}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 数据矩阵 -->
  <div style="position:relative;padding:0 24px 32px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <!-- 评分 -->
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:4px;height:40px;background:#ec4899;border-radius:2px"></div>
        <div>
          <div style="font-size:24px;font-weight:700;color:#fff;line-height:1.1">{{RATING}}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4)">我的体验</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;justify-content:flex-end">
        <div style="text-align:right">
          <div style="font-size:24px;font-weight:700;color:#fff;line-height:1.1">{{PARTNER_RATING}}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4)">伴侣体验</div>
        </div>
        <div style="width:4px;height:40px;background:#3b82f6;border-radius:2px"></div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div style="display:flex;justify-content:space-between;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)">
      <!-- 体位点击区域 -->
      <div data-action="toggle-positions" style="text-align:center;cursor:pointer;padding:8px;border-radius:12px;transition:background 0.2s;user-select:none" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;letter-spacing:1px">POSITIONS</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.9);font-weight:600">{{POSITION_COUNT}} 种体位 <span style="font-size:10px;opacity:0.5">▼</span></div>
      </div>
      
      <div style="width:1px;height:30px;background:rgba(255,255,255,0.06);margin:auto 0"></div>
      
      <!-- 高潮点击区域 -->
      <div data-action="toggle-climax" style="text-align:center;cursor:pointer;padding:8px;border-radius:12px;transition:background 0.2s;user-select:none" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;letter-spacing:1px">CLIMAX</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.9);font-weight:600">{{CLIMAX}} 次高潮 <span style="font-size:10px;opacity:0.5">▼</span></div>
      </div>
    </div>
    
    <!-- 隐藏详情区域：前戏 -->
    <div data-detail="foreplay" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadeIn 0.3s ease-out">
      <div style="font-size:12px;color:#8b5cf6;margin-bottom:8px;font-weight:600">前戏详情</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;text-align:justify">
        {{FOREPLAY_DETAIL}}
      </div>
    </div>

    <!-- 隐藏详情区域：正题 -->
    <div data-detail="main" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadeIn 0.3s ease-out">
      <div style="font-size:12px;color:#f43f5e;margin-bottom:8px;font-weight:600">正题详情</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;text-align:justify">
        {{MAIN_DETAIL}}
      </div>
    </div>

    <!-- 隐藏详情区域：后戏 -->
    <div data-detail="aftercare" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadeIn 0.3s ease-out">
      <div style="font-size:12px;color:#fbbf24;margin-bottom:8px;font-weight:600">后戏详情</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;text-align:justify">
        {{AFTERCARE_DETAIL}}
      </div>
    </div>
    
    <!-- 隐藏详情区域：体位 -->
    <div data-detail="positions" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadeIn 0.3s ease-out">
      <div style="font-size:12px;color:#8b5cf6;margin-bottom:8px;font-weight:600">体位记录</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;text-align:justify">
        {{POSITIONS_DETAIL}}
      </div>
    </div>

    <!-- 隐藏详情区域：高潮 -->
    <div data-detail="climax" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadeIn 0.3s ease-out">
      <div style="font-size:12px;color:#f43f5e;margin-bottom:8px;font-weight:600">高潮记录</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;text-align:justify">
        {{CLIMAX_DETAIL}}
      </div>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  </div>
</div>
    `.trim()
  }
