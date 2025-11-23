import { TheatreTemplate } from '../../theatreTemplates'

export const sleepReportTemplate: TheatreTemplate = {
  id: 'sleep_report',
  category: '健康医疗',
  name: '睡眠报告',
  keywords: ['睡眠', '健康', '报告'],
  fields: [
    { key: 'DATE', label: '日期', placeholder: '11月22日' },
    { key: 'SLEEP_SCORE', label: '睡眠得分', placeholder: '85' },
    { key: 'TOTAL_HOURS', label: '总时长', placeholder: '7小时45分' },
    { key: 'DEEP_SLEEP', label: '深睡', placeholder: '2小时10分' },
    { key: 'LIGHT_SLEEP', label: '浅睡', placeholder: '5小时35分' },
    { key: 'WAKE_TIME', label: '醒来时间', placeholder: '07:30' },
    { key: 'SLEEP_TIME', label: '入睡时间', placeholder: '23:45' },
  ],
  htmlTemplate: `
<div data-sleep-report style="background: #101025; color: #fff; padding: 25px; border-radius: 20px; font-family: sans-serif; width: 100%; max-width: 300px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <div style="font-size: 14px; color: #888;">{{DATE}}</div>
    <div style="padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 12px; font-size: 12px;">Excellent</div>
  </div>
  
  <div style="text-align: center; position: relative; width: 160px; height: 160px; margin: 0 auto 30px;">
    <!-- Ring Chart Background -->
    <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#222" stroke-width="3" />
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#gradient)" stroke-width="3" stroke-dasharray="{{SLEEP_SCORE}}, 100" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6a11cb" />
          <stop offset="100%" stop-color="#2575fc" />
        </linearGradient>
      </defs>
    </svg>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
      <div style="font-size: 42px; font-weight: bold;">{{SLEEP_SCORE}}</div>
      <div style="font-size: 12px; color: #aaa;">睡眠得分</div>
    </div>
  </div>
  
  <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #888; margin-bottom: 5px;">入睡</div>
      <div style="font-size: 16px; font-weight: bold;">{{SLEEP_TIME}}</div>
    </div>
    <div style="width: 1px; height: 30px; background: #333;"></div>
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #888; margin-bottom: 5px;">总时长</div>
      <div style="font-size: 16px; font-weight: bold;">{{TOTAL_HOURS}}</div>
    </div>
    <div style="width: 1px; height: 30px; background: #333;"></div>
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #888; margin-bottom: 5px;">起床</div>
      <div style="font-size: 16px; font-weight: bold;">{{WAKE_TIME}}</div>
    </div>
  </div>
  
  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
      <span>深睡</span>
      <span>{{DEEP_SLEEP}}</span>
    </div>
    <div style="height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
      <div style="width: 30%; height: 100%; background: #6a11cb; border-radius: 3px;"></div>
    </div>
  </div>
  
  <div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-bottom: 5px;">
      <span>浅睡</span>
      <span>{{LIGHT_SLEEP}}</span>
    </div>
    <div style="height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
      <div style="width: 70%; height: 100%; background: #2575fc; border-radius: 3px;"></div>
    </div>
  </div>
</div>
  `.trim()
}
