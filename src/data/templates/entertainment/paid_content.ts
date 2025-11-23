import { TheatreTemplate } from '../../theatreTemplates'

export const paidContentTemplate: TheatreTemplate = {
  id: 'paid_content',
  category: '娱乐休闲',
  name: '付费内容',
  keywords: ['付费', '解锁', '订阅', '查看'],
  fields: [
    { key: 'PLATFORM_NAME', label: '平台', placeholder: 'OnlyFans' },
    { key: 'CONTENT_TITLE', label: '标题', placeholder: 'Exclusive Photoset' },
    { key: 'CONTENT_TYPE', label: '类型', placeholder: '10 Photos • 1 Video' },
    { key: 'PRICE', label: '价格', placeholder: '$15.00' },
    { key: 'PAYMENT_METHOD', label: '支付', placeholder: 'Credit Card' },
    { key: 'ORDER_NO', label: '单号', placeholder: 'TX998877' },
  ],
  htmlTemplate: `
<div data-paid-content style="background: #fff; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative; border: 1px solid #eee;">
  <div style="padding: 15px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-weight: bold; color: #00aff0;">{{PLATFORM_NAME}}</div>
    <div style="font-size: 12px; color: #999;">Secured</div>
  </div>
  
  <div style="position: relative; height: 200px; background: #f0f0f0; overflow: hidden;">
    <!-- Blurred Content Simulation -->
    <div style="position: absolute; inset: 0; background: url('https://via.placeholder.com/300x200/ccc/999?text=Content'); filter: blur(15px); transform: scale(1.1);"></div>
    
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.3);">
      <div style="font-size: 40px; margin-bottom: 10px;">🔒</div>
      <div style="color: white; font-weight: bold; margin-bottom: 5px;">LOCKED CONTENT</div>
      <div style="color: white; font-size: 12px; opacity: 0.9;">{{CONTENT_TYPE}}</div>
    </div>
  </div>
  
  <div style="padding: 20px;">
    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">{{CONTENT_TITLE}}</div>
    <div style="font-size: 12px; color: #666; margin-bottom: 20px;">Unlock to view full content immediately.</div>
    
    <button style="width: 100%; background: #00aff0; color: white; border: none; padding: 12px; border-radius: 25px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 10px rgba(0,175,240,0.3);">
      UNLOCK FOR {{PRICE}}
    </button>
    
    <div style="text-align: center; font-size: 10px; color: #999; margin-top: 10px;">
      {{PAYMENT_METHOD}} • {{ORDER_NO}}
    </div>
  </div>
</div>
  `.trim()
}
