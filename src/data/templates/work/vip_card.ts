import { TheatreTemplate } from '../../theatreTemplates'

export const vipCardTemplate: TheatreTemplate = {
  id: 'vip_card',
  category: '工作学习',
  name: '会员卡',
  keywords: ['会员', 'VIP', '卡片'],
  fields: [
    { key: 'CARD_NAME', label: '卡名', placeholder: '黑金至尊卡' },
    { key: 'MEMBER_NAME', label: '姓名', placeholder: '张三' },
    { key: 'CARD_NO', label: '卡号', placeholder: '8888 8888 8888' },
    { key: 'LEVEL', label: '等级', placeholder: 'V10' },
    { key: 'POINTS', label: '积分', placeholder: '12580' },
    { key: 'EXPIRE_DATE', label: '有效期', placeholder: '2099-12-31' },
    { key: 'BENEFITS', label: '权益', placeholder: '全场8折' },
  ],
  htmlTemplate: `
<div data-vip-card style="background: linear-gradient(135deg, #1f1f1f 0%, #000 100%); width: 100%; max-width: 320px; height: 190px; margin: 0 auto; font-family: 'Didot', serif; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); position: relative; color: #e0c38c; border: 1px solid #333;">
  <!-- Gold Texture -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, rgba(224, 195, 140, 0.05) 0px, rgba(224, 195, 140, 0.05) 2px, transparent 2px, transparent 10px); pointer-events: none;"></div>
  
  <div style="padding: 25px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
      <div style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">{{CARD_NAME}}</div>
      <div style="font-style: italic; font-weight: bold; font-size: 24px;">VIP</div>
    </div>
    
    <div style="display: flex; align-items: center; margin-bottom: 30px;">
      <div style="width: 40px; height: 25px; background: linear-gradient(135deg, #e0c38c 0%, #bfa16d 100%); border-radius: 4px; margin-right: 10px; opacity: 0.8;"></div>
      <div style="font-size: 12px; letter-spacing: 2px;">{{CARD_NO}}</div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 10px; opacity: 0.6; margin-bottom: 4px;">MEMBER NAME</div>
        <div style="font-size: 14px; letter-spacing: 1px;">{{MEMBER_NAME}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; opacity: 0.6; margin-bottom: 4px;">LEVEL</div>
        <div style="font-size: 18px; font-weight: bold;">{{LEVEL}}</div>
      </div>
    </div>
  </div>
  
  <!-- Shine Effect -->
  <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%); pointer-events: none;"></div>
</div>
  `.trim()
}
