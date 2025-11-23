import { TheatreTemplate } from '../../theatreTemplates'

export const leaveRequestTemplate: TheatreTemplate = {
    id: 'leave_request',
    category: '工作学习',
    name: '请假条',
    keywords: ['请假条', '请假', '假条', '请假申请'],
    fields: [
      { key: 'TO', label: '收件人', placeholder: '王老师' },
      { key: 'FROM', label: '请假人', placeholder: '张三' },
      { key: 'REASON', label: '请假事由', placeholder: '身体不适，需要就医' },
      { key: 'START_DATE', label: '开始日期', placeholder: '2025-01-15' },
      { key: 'END_DATE', label: '结束日期', placeholder: '2025-01-16' },
      { key: 'DAYS', label: '请假天数', placeholder: '2' },
      { key: 'DATE', label: '申请日期', placeholder: '2025-01-14' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background-color: #fdfbf7; background-image: repeating-linear-gradient(#fdfbf7 0px, #fdfbf7 24px, #a2d9f5 25px); padding: 40px 24px; border-radius: 2px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: 'Kaiti SC', 'KaiTi', 'STKaiti', serif; position: relative; color: #2c3e50; line-height: 25px;">
  <!-- 顶部回形针 -->
  <div style="position: absolute; top: -10px; right: 30px; width: 12px; height: 40px; border: 2px solid #bdc3c7; border-radius: 10px; border-bottom: none; transform: rotate(15deg); background: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0));"></div>
  <div style="position: absolute; top: -10px; right: 30px; width: 12px; height: 40px; border: 2px solid #bdc3c7; border-radius: 10px; border-top: none; transform: rotate(15deg); z-index: 1;"></div>

  <!-- 标题 -->
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #34495e;">请假条</div>
  </div>
  
  <!-- 称呼 -->
  <div style="margin-bottom: 10px; font-size: 16px;">
    <span>{{TO}}：</span>
  </div>
  
  <!-- 正文 -->
  <div style="margin-bottom: 20px; text-indent: 2em; font-size: 16px;">
    本人因 <span style="text-decoration: underline; text-decoration-color: #95a5a6; padding: 0 4px;">{{REASON}}</span>，需请假 <span style="text-decoration: underline; text-decoration-color: #95a5a6; padding: 0 4px;">{{DAYS}}</span> 天，时间为 <span style="text-decoration: underline; text-decoration-color: #95a5a6; padding: 0 4px;">{{START_DATE}}</span> 至 <span style="text-decoration: underline; text-decoration-color: #95a5a6; padding: 0 4px;">{{END_DATE}}</span>。
  </div>
  <div style="margin-bottom: 40px; text-indent: 2em; font-size: 16px;">
    恳请批准。
  </div>
  
  <!-- 落款 -->
  <div style="text-align: right; font-size: 16px;">
    <div style="margin-bottom: 5px;">请假人：<span style="font-family: 'Brush Script MT', cursive; font-size: 20px;">{{FROM}}</span></div>
    <div>{{DATE}}</div>
  </div>
  
  <!-- 底部印章 -->
  <div style="position: absolute; bottom: 40px; right: 60px; width: 80px; height: 80px; border: 3px solid rgba(231, 76, 60, 0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-20deg); opacity: 0.8; pointer-events: none;">
    <div style="width: 70px; height: 70px; border: 1px solid rgba(231, 76, 60, 0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 18px; color: rgba(231, 76, 60, 0.8); font-weight: bold; letter-spacing: 2px;">批准</span>
    </div>
  </div>
</div>
    `.trim()
  }
