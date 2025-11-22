import { TheatreTemplate } from '../../theatreTemplates'

export const smsScreenshotTemplate: TheatreTemplate = {
    id: 'sms_screenshot',
    category: '社交通讯',
    name: '短信截图',
    keywords: ['短信', '验证码', '短信截图', '消息通知'],
    fields: [
      { key: 'SENDER', label: '发送方', placeholder: '10086' },
      { key: 'CONTENT', label: '短信内容', placeholder: '您的验证码是123456，请在5分钟内完成验证' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #f8f9fa; padding: 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部状态栏 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: white; border-radius: 8px 8px 0 0; font-size: 12px; color: #666;">
    <div>{{TIME}}</div>
    <div>●●●●</div>
  </div>
  
  <!-- 短信内容 -->
  <div style="background: white; padding: 16px; border-radius: 0 0 8px 8px;">
    <!-- 发送方 -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #00b894; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
        短
      </div>
      <div>
        <div style="font-size: 16px; font-weight: 600; color: #2d3436;">{{SENDER}}</div>
        <div style="font-size: 12px; color: #999;">短信消息</div>
      </div>
    </div>
    
    <!-- 短信正文 -->
    <div style="background: #f8f9fa; padding: 14px; border-radius: 8px;">
      <div style="font-size: 15px; color: #2d3436; line-height: 1.6; white-space: pre-wrap;">{{CONTENT}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
