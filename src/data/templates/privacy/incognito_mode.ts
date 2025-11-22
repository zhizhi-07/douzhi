import { TheatreTemplate } from '../../theatreTemplates'

export const incognitoModeTemplate: TheatreTemplate = {
    id: 'incognito_mode',
    category: '隐私安全',
    name: '隐私浏览',
    keywords: ['无痕浏览', '隐私模式', '隐私浏览', '私密浏览'],
    fields: [
      { key: 'SITE1_TITLE', label: '网站1标题', placeholder: '成人内容网站' },
      { key: 'SITE1_URL', label: '网站1地址', placeholder: 'adult-site.com' },
      { key: 'SITE1_TIME', label: '访问时间1', placeholder: '23:15' },
      { key: 'SITE1_THOUGHT', label: '网站1心理活动', placeholder: '心跳加速，偷偷看了一眼门口，确认没人后点开...' },
      { key: 'SITE2_TITLE', label: '网站2标题', placeholder: '在线视频' },
      { key: 'SITE2_URL', label: '网站2地址', placeholder: 'video.com' },
      { key: 'SITE2_TIME', label: '访问时间2', placeholder: '23:42' },
      { key: 'SITE2_THOUGHT', label: '网站2心理活动', placeholder: '手心出汗，音量调到最低，耳朵警惕地听着外面的动静' },
      { key: 'SITE3_TITLE', label: '网站3标题', placeholder: '私密社区' },
      { key: 'SITE3_URL', label: '网站3地址', placeholder: 'secret.com' },
      { key: 'SITE3_TIME', label: '访问时间3', placeholder: '00:18' },
      { key: 'SITE3_THOUGHT', label: '网站3心理活动', placeholder: '呼吸变得急促，身体开始发热，手指颤抖着滑动屏幕' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#f2f2f7;border-radius:12px;overflow:hidden;font-family:-apple-system,'SF Pro Text','PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#fff;padding:14px 16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="width:24px;height:24px;background:#ffd60a;border-radius:6px;display:flex;align-items:center;justify-content:center">
        <div style="width:10px;height:10px;border:2px solid #000;border-radius:2px"></div>
      </div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:600;color:#000">隐私浏览</div>
      </div>
      <div style="font-size:13px;color:#007aff;font-weight:500;cursor:pointer">清除</div>
    </div>
    <div style="background:#fff9e6;padding:10px;border-radius:8px;border-left:3px solid #ffd60a">
      <div style="font-size:12px;color:#8e8e93;line-height:1.5">Safari 不会记住你访问的网站、搜索历史或自动填充信息</div>
    </div>
  </div>
  
  <div style="background:#fff">
    <div style="padding:10px 16px;background:#f2f2f7">
      <div style="font-size:13px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px">今天晚上</div>
    </div>
    
    <div style="padding:12px 16px;border-bottom:0.5px solid #c6c6c8;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#ff3b30;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">A</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE1_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE1_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE1_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #ff3b30">
        <div style="font-size:11px;color:#ff3b30;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE1_THOUGHT}}</div>
      </div>
    </div>
    
    <div style="padding:12px 16px;border-bottom:0.5px solid #c6c6c8;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#ff9500;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">V</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE2_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE2_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE2_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #ff9500">
        <div style="font-size:11px;color:#ff9500;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE2_THOUGHT}}</div>
      </div>
    </div>
    
    <div style="padding:12px 16px;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#af52de;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">S</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE3_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE3_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE3_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #af52de">
        <div style="font-size:11px;color:#af52de;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE3_THOUGHT}}</div>
      </div>
    </div>
  </div>
  
  <div style="background:#f2f2f7;padding:12px 16px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:6px;background:#fff;padding:8px 16px;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <div style="font-size:13px;color:#ff3b30;font-weight:500">⚠</div>
      <div style="font-size:13px;color:#8e8e93">点击网站查看心理活动</div>
    </div>
  </div>
</div>
    `.trim()
  }
