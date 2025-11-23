import { TheatreTemplate } from '../../theatreTemplates'

export const spaMembershipTemplate: TheatreTemplate = {
  id: 'spa_membership',
  category: '工作学习',
  name: '会所会员',
  keywords: ['会所', 'SPA', '会员', '充值'],
  fields: [
    { key: 'CLUB_NAME', label: '会所', placeholder: '云顶·SPA会所' },
    { key: 'MEMBER_NAME', label: '姓名', placeholder: '李总' },
    { key: 'CARD_NO', label: '卡号', placeholder: '8888' },
    { key: 'LEVEL', label: '等级', placeholder: '钻石会员' },
    { key: 'BALANCE', label: '余额', placeholder: '58800' },
    { key: 'SERVICES', label: '权益', placeholder: '全身精油SPA、足疗' },
    { key: 'EXPIRE_DATE', label: '有效期', placeholder: '长期有效' },
  ],
  htmlTemplate: `
<div data-spa-card style="background: linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%); width: 100%; max-width: 320px; height: 190px; margin: 0 auto; font-family: sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; color: white;">
  <!-- Water Ripples -->
  <div style="position: absolute; top: 50%; left: 50%; width: 300px; height: 300px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-50%, -50%) scale(0.8);"></div>
  <div style="position: absolute; top: 50%; left: 50%; width: 300px; height: 300px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-50%, -50%) scale(1.2);"></div>
  
  <div style="padding: 25px; position: relative; z-index: 1; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">{{CLUB_NAME}}</div>
        <div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">Luxury Wellness Club</div>
      </div>
      <div style="font-size: 24px;">💎</div>
    </div>
    
    <div style="text-align: center; margin: 10px 0;">
      <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">账户余额 (CNY)</div>
      <div style="font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">¥{{BALANCE}}</div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px;">
      <div>
        <div style="margin-bottom: 3px;">NO. {{CARD_NO}}</div>
        <div style="opacity: 0.8;">{{MEMBER_NAME}}</div>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 10px;">
        {{LEVEL}}
      </div>
    </div>
  </div>
</div>
  `.trim()
}
