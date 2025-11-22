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
<div style="max-width: 360px; margin: 0 auto; background: #fff9e6; padding: 28px 24px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.1); font-family: 'Georgia', 'Noto Serif SC', serif; border: 2px solid #f1c40f;">
  <!-- 标题 -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 26px; font-weight: bold; color: #2d3436;">请假条</div>
    <div style="width: 40px; height: 3px; background: #f1c40f; margin: 8px auto 0;"></div>
  </div>
  
  <!-- 称呼 -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 16px; color: #2d3436;">{{TO}}：</div>
  </div>
  
  <!-- 正文 -->
  <div style="background: white; padding: 18px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f1c40f;">
    <div style="font-size: 15px; color: #2d3436; line-height: 1.8; text-indent: 2em;">
      本人因{{REASON}}，特向您请假，请假时间为{{START_DATE}}至{{END_DATE}}，共{{DAYS}}天。请予批准。
    </div>
  </div>
  
  <!-- 落款 -->
  <div style="text-align: right; margin-top: 24px;">
    <div style="font-size: 15px; color: #2d3436; margin-bottom: 8px;">请假人：{{FROM}}</div>
    <div style="font-size: 14px; color: #636e72;">{{DATE}}</div>
  </div>
  
  <!-- 底部印章装饰 -->
  <div style="text-align: right; margin-top: 16px;">
    <div style="display: inline-block; width: 60px; height: 60px; border: 2px solid #e74c3c; border-radius: 50%; color: #e74c3c; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; transform: rotate(-15deg);">同意</div>
  </div>
</div>
    `.trim()
  }
