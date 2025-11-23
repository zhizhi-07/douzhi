import { TheatreTemplate } from '../../theatreTemplates'

export const luxuryPurchaseTemplate: TheatreTemplate = {
  id: 'luxury_purchase',
  category: '生活消费',
  name: '高端消费',
  keywords: ['奢侈品', '购物', '小票', '高端'],
  fields: [
    { key: 'STORE_NAME', label: '店铺', placeholder: 'HERMÈS' },
    { key: 'PRODUCT_NAME', label: '商品', placeholder: 'Birkin 30' },
    { key: 'PRODUCT_MODEL', label: '型号', placeholder: 'Togo Leather / Gold Hardware' },
    { key: 'PRICE', label: '价格', placeholder: '88000.00' },
    { key: 'ORDER_NO', label: '单号', placeholder: 'H20241122001' },
    { key: 'PURCHASE_DATE', label: '日期', placeholder: '22 NOV 2024' },
    { key: 'VIP_LEVEL', label: 'VIP等级', placeholder: 'VIC' },
  ],
  htmlTemplate: `
<div data-luxury-receipt style="background: #f8f8f8; padding: 40px 30px; width: 100%; max-width: 320px; margin: 0 auto; font-family: 'Times New Roman', serif; color: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; position: relative;">
  
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="font-size: 28px; letter-spacing: 3px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px;">{{STORE_NAME}}</div>
    <div style="font-size: 10px; letter-spacing: 2px; color: #666;">PARIS • TOKYO • NEW YORK</div>
  </div>
  
  <div style="margin-bottom: 30px; font-size: 12px; letter-spacing: 1px; line-height: 1.8;">
    <div style="display: flex; justify-content: space-between;">
      <span>DATE:</span>
      <span>{{PURCHASE_DATE}}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>RECEIPT NO:</span>
      <span>{{ORDER_NO}}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>CLIENT:</span>
      <span>{{VIP_LEVEL}} MEMBER</span>
    </div>
  </div>
  
  <div style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 20px 0; margin-bottom: 30px;">
    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px;">{{PRODUCT_NAME}}</div>
    <div style="font-size: 12px; color: #666; margin-bottom: 15px; font-style: italic;">{{PRODUCT_MODEL}}</div>
    <div style="text-align: right; font-size: 16px; font-weight: bold;">USD {{PRICE}}</div>
  </div>
  
  <div style="margin-bottom: 40px;">
    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 10px;">
      <span>TOTAL</span>
      <span>USD {{PRICE}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
      <span>VAT INCLUDED</span>
      <span>USD 0.00</span>
    </div>
  </div>
  
  <div style="text-align: center; font-size: 10px; color: #999; letter-spacing: 1px;">
    <div style="margin-bottom: 5px;">THANK YOU FOR SHOPPING WITH US</div>
    <div style="font-family: 'Courier New', monospace;">Signature: _________________</div>
  </div>
  
  <!-- Gold Foil Effect -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(90deg, #ffd700, #f1c40f, #ffd700);"></div>
</div>
  `.trim()
}
