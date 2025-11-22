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
      { key: 'POSITION_COUNT', label: '体位数', placeholder: '5' },
      { key: 'RATING', label: '体验评分', placeholder: '9.5' },
      { key: 'PARTNER_RATING', label: '对方评分', placeholder: '9.8' },
      { key: 'CLIMAX', label: '高潮次数', placeholder: '3' },
      { key: 'LOCATION', label: '地点', placeholder: '卧室' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#000;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.3)">
  <div style="background:#ff3b30;padding:20px;text-align:center">
    <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-bottom:6px;font-weight:500">性爱记录</div>
    <div style="font-size:48px;font-weight:700;color:#fff;line-height:1;margin-bottom:10px;font-variant-numeric:tabular-nums">{{DURATION}}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.85)">{{DATE}}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px">{{START_TIME}} - {{END_TIME}}</div>
  </div>
  
  <div style="padding:16px;background:#1c1c1e">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#2c2c2e;padding:14px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#ff3b30;margin-bottom:4px;font-variant-numeric:tabular-nums">{{RATING}}</div>
        <div style="font-size:11px;color:#8e8e93;font-weight:500">我的评分</div>
      </div>
      <div style="background:#2c2c2e;padding:14px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#ff3b30;margin-bottom:4px;font-variant-numeric:tabular-nums">{{PARTNER_RATING}}</div>
        <div style="font-size:11px;color:#8e8e93;font-weight:500">对方评分</div>
      </div>
    </div>
    
    <div style="background:#2c2c2e;padding:14px;border-radius:10px;margin-bottom:16px">
      <div style="font-size:12px;color:#8e8e93;margin-bottom:10px;font-weight:600">时长分布</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#fff">前戏</div>
        <div style="font-size:15px;color:#ff9500;font-weight:600">{{FOREPLAY}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#fff">主要过程</div>
        <div style="font-size:15px;color:#ff3b30;font-weight:600">{{MAIN}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;color:#fff">后戏</div>
        <div style="font-size:15px;color:#af52de;font-weight:600">{{AFTERCARE}}</div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:2px">{{POSITION_COUNT}}</div>
        <div style="font-size:10px;color:#8e8e93">体位</div>
      </div>
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:2px">{{CLIMAX}}</div>
        <div style="font-size:10px;color:#8e8e93">高潮</div>
      </div>
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:11px;font-weight:600;color:#fff;margin-bottom:2px">{{LOCATION}}</div>
        <div style="font-size:10px;color:#8e8e93">地点</div>
      </div>
    </div>
    
    <div style="background:#2c2c2e;padding:10px;border-radius:8px;text-align:center">
      <div style="font-size:11px;color:#8e8e93">数据已加密保存</div>
    </div>
  </div>
</div>
    `.trim()
  }
