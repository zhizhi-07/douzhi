import { TheatreTemplate } from '../../theatreTemplates'

export const sleepReportTemplate: TheatreTemplate = {
    id: 'sleep_report',
    category: '生活服务',
    name: '睡眠报告',
    keywords: ['睡眠', '睡觉', '睡眠质量', '健康报告'],
    fields: [
      { key: 'DATE', label: '日期', placeholder: '11月20日 周三' },
      { key: 'SLEEP_SCORE', label: '睡眠得分', placeholder: '85' },
      { key: 'TOTAL_HOURS', label: '总睡眠时长', placeholder: '7小时42分' },
      { key: 'DEEP_SLEEP', label: '深睡', placeholder: '1小时50分' },
      { key: 'LIGHT_SLEEP', label: '浅睡', placeholder: '5小时52分' },
      { key: 'WAKE_TIME', label: '入睡/醒来', placeholder: '23:30 - 07:12' },
      { key: 'HEART_RATE', label: '平均心率', placeholder: '62 bpm' },
      { key: 'DREAM_LOG', label: '梦境记录', placeholder: '梦见在一片发光的森林里飞行，遇到了一只像猫一样的云...' },
      { key: 'ADVICE', label: '助眠建议', placeholder: '深睡比例略低，建议睡前减少蓝光摄入，尝试4-7-8呼吸法。' },
      { key: 'EVALUATION', label: '评价', placeholder: '昨晚睡得不错，精力充沛！' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: linear-gradient(180deg, #141e30 0%, #243b55 100%); border-radius: 20px; overflow: hidden; font-family: -apple-system, sans-serif; color: white; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
  <!-- 星空背景 -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px); background-size: 20px 20px; background-position: 0 0, 10px 10px; opacity: 0.1;"></div>
  <!-- 月亮 -->
  <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; background: #f1c40f; border-radius: 50%; box-shadow: 0 0 20px rgba(241, 196, 15, 0.5); cursor: pointer;" data-action="toggle-dream"></div>
  <div style="position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; background: #141e30; border-radius: 50%; pointer-events: none;"></div>

  <div style="padding: 30px 20px; position: relative; z-index: 1;">
    <div style="font-size: 14px; opacity: 0.7; margin-bottom: 5px;">{{DATE}}</div>
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 30px;">睡眠分析</div>

    <!-- 得分圆环 -->
    <div style="text-align: center; margin-bottom: 30px; cursor: pointer;" data-action="show-advice">
      <div style="position: relative; width: 150px; height: 150px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <svg width="150" height="150" style="transform: rotate(-90deg);">
          <circle cx="75" cy="75" r="65" fill="transparent" stroke="rgba(255,255,255,0.1)" stroke-width="10"></circle>
          <circle cx="75" cy="75" r="65" fill="transparent" stroke="#a29bfe" stroke-width="10" stroke-dasharray="408" stroke-dashoffset="60" stroke-linecap="round"></circle>
        </svg>
        <div style="position: absolute; text-align: center;">
          <div style="font-size: 48px; font-weight: bold; background: linear-gradient(to bottom, #fff, #a29bfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{{SLEEP_SCORE}}</div>
          <div style="font-size: 12px; opacity: 0.7;">分</div>
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 14px; color: #a29bfe;">{{EVALUATION}} <span style="font-size:12px">ⓘ</span></div>
    </div>

    <!-- 数据网格 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">总时长</div>
        <div style="font-size: 16px; font-weight: bold;">{{TOTAL_HOURS}}</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">心率</div>
        <div style="font-size: 16px; font-weight: bold; color: #ff7675;">❤ {{HEART_RATE}}</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">深睡 (20%)</div>
        <div style="font-size: 16px; font-weight: bold; color: #6c5ce7;">{{DEEP_SLEEP}}</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">浅睡 (80%)</div>
        <div style="font-size: 16px; font-weight: bold; color: #74b9ff;">{{LIGHT_SLEEP}}</div>
      </div>
    </div>

    <!-- 梦境记录 (初始折叠) -->
    <div class="dream-log" style="margin-top: 20px; background: rgba(162, 155, 254, 0.1); border-radius: 12px; overflow: hidden; transition: all 0.3s; height: 40px; cursor: pointer;" data-action="toggle-dream">
      <div style="padding: 10px 15px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 13px; font-weight: bold; color: #a29bfe;">☁️ 梦境记录</div>
        <div style="font-size: 12px; opacity: 0.5;">▼</div>
      </div>
      <div style="padding: 0 15px 15px; font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.5;">
        {{DREAM_LOG}}
      </div>
    </div>

  </div>
  
  <!-- 隐藏建议数据 -->
  <div hidden data-advice>{{ADVICE}}</div>
</div>
    `.trim()
  }
