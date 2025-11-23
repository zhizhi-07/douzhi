import { TheatreTemplate } from '../../theatreTemplates'

export const liveDonationTemplate: TheatreTemplate = {
  id: 'live_donation',
  category: '社交通讯',
  name: '直播打赏',
  keywords: ['直播', '打赏', '礼物', '榜一大哥'],
  fields: [
    { key: 'STREAMER_NAME', label: '主播', placeholder: '小甜甜' },
    { key: 'GIFT_NAME', label: '礼物', placeholder: '超级火箭' },
    { key: 'GIFT_QUANTITY', label: '数量', placeholder: '1' },
    { key: 'MESSAGE', label: '留言', placeholder: '主播唱得真好听！' },
    { key: 'TOTAL_AMOUNT', label: '价值', placeholder: '2000' },
  ],
  htmlTemplate: `
<div data-live-donation style="background: rgba(0,0,0,0.6); width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 20px; overflow: hidden; color: white; position: relative; padding: 15px; border: 1px solid rgba(255,255,255,0.2);">
  <div style="display: flex; align-items: flex-start;">
    <div style="width: 40px; height: 40px; border-radius: 50%; background: gold; border: 2px solid #fff; margin-right: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #d35400; box-shadow: 0 0 10px gold;">
      👑
    </div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: bold; color: gold; margin-bottom: 2px; text-shadow: 0 0 2px rgba(0,0,0,0.5);">我 送出 {{GIFT_NAME}}</div>
      <div style="font-size: 12px; color: #fff; opacity: 0.9; margin-bottom: 5px;">"{{MESSAGE}}"</div>
    </div>
    <div style="font-size: 24px; font-weight: bold; color: #ff4d4f; font-style: italic; text-shadow: 2px 2px 0 #fff;">
      x{{GIFT_QUANTITY}}
    </div>
  </div>
  
  <!-- Rocket Animation Placeholder -->
  <div style="position: absolute; right: -20px; bottom: -20px; font-size: 80px; opacity: 0.2; transform: rotate(-45deg);">🚀</div>
  
  <div style="margin-top: 10px; background: linear-gradient(90deg, rgba(255,215,0,0.2), transparent); padding: 5px; border-radius: 4px; font-size: 10px; color: gold;">
    感谢老板的支持！老板大气！
  </div>
</div>
  `.trim()
}
