import { TheatreTemplate } from '../../theatreTemplates'

export const receiptTemplate: TheatreTemplate = {
    id: 'receipt',
    category: '生活消费',
    name: '小票',
    keywords: ['小票', '发票', '账单', '收据'],
    fields: [
      { key: 'FOOD_NAME', label: '食物', placeholder: '炒饭' },
      { key: 'PRICE', label: '价格', placeholder: '25' },
      { key: 'SHOP_NAME', label: '商家', placeholder: '快餐店' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-21' },
      { key: 'TIME', label: '时间', placeholder: '13:45' },
    ],
    htmlTemplate: `
<div data-receipt style="max-width: 280px; margin: 0 auto; background: #fafafa; padding: 18px 16px; font-family: 'Courier New', monospace; border: 1px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
  <div style="text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 12px; margin-bottom: 14px;">
    <div style="font-size: 18px; font-weight: bold; color: #333;">{{SHOP_NAME}}</div>
    <div style="font-size: 11px; color: #999; margin-top: 4px;">电子小票</div>
  </div>
  
  <div style="font-size: 13px; line-height: 1.6; color: #333;">
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>商品</span>
      <span style="font-weight: 600;">{{FOOD_NAME}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>单价</span>
      <span>¥{{PRICE}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>数量</span>
      <span>x 1</span>
    </div>
    <div style="border-top: 1px solid #ddd; margin: 10px 0;"></div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0; font-size: 15px; font-weight: bold;">
      <span>合计</span>
      <span style="color: #d32f2f;">¥{{PRICE}}</span>
    </div>
  </div>
  
  <div style="border-top: 1px dashed #ccc; margin-top: 14px; padding-top: 12px; font-size: 11px; color: #999; text-align: center;">
    <div>{{DATE}} {{TIME}}</div>
    <div style="margin-top: 6px; letter-spacing: 1px;">感谢您的光临</div>
  </div>
</div>
    `.trim()
  }
