import { TheatreTemplate } from '../../theatreTemplates'

export const phoneRechargeTemplate: TheatreTemplate = {
  id: 'phone_recharge',
  category: '生活消费',
  name: '话费充值',
  keywords: ['充话费', '充值', '缴费'],
  fields: [
    { key: 'PHONE_NUMBER', label: '手机号', placeholder: '138 0000 0000' },
    { key: 'AMOUNT', label: '充值金额', placeholder: '100' },
    { key: 'OPERATOR', label: '运营商', placeholder: '中国移动' },
    { key: 'ORDER_NO', label: '订单号', placeholder: 'P202411221001' },
    { key: 'PAY_TIME', label: '支付时间', placeholder: '2024-11-22 10:30:00' },
    { key: 'STATUS', label: '状态', placeholder: '充值成功' },
  ],
  htmlTemplate: `
<div data-phone-recharge style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); font-family: sans-serif; width: 100%; max-width: 320px; margin: 0 auto; border: 1px solid #eee;">
  <div style="background: #52c41a; color: white; padding: 30px 20px; text-align: center; position: relative;">
    <div style="width: 50px; height: 50px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #52c41a; font-size: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      ✓
    </div>
    <div style="font-size: 18px; font-weight: bold;">{{STATUS}}</div>
    <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">¥{{AMOUNT}}.00 立即到账</div>
  </div>
  
  <div style="padding: 20px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;">
      <span style="color: #999;">充值号码</span>
      <span style="color: #333; font-weight: 500;">{{PHONE_NUMBER}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;">
      <span style="color: #999;">运营商</span>
      <span style="color: #333;">{{OPERATOR}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px;">
      <span style="color: #999;">订单编号</span>
      <span style="color: #333; font-size: 12px;">{{ORDER_NO}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
      <span style="color: #999;">支付时间</span>
      <span style="color: #333; font-size: 12px;">{{PAY_TIME}}</span>
    </div>
  </div>
  
  <div style="border-top: 1px dashed #eee; padding: 15px; text-align: center;">
    <button data-action="complete" style="background: white; border: 1px solid #ddd; padding: 6px 20px; border-radius: 15px; color: #666; font-size: 13px; cursor: pointer; transition: all 0.2s;">完成</button>
  </div>
</div>
  `.trim()
}
