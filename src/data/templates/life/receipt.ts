import { TheatreTemplate } from '../../theatreTemplates'

export const receiptTemplate: TheatreTemplate = {
    id: 'receipt',
    category: '生活消费',
    name: '小票',
    keywords: ['小票', '发票', '账单', '收据'],
    fields: [
      { key: 'SHOP_NAME', label: '商家', placeholder: '罗森便利店' },
      { key: 'ITEM_NAME', label: '商品', placeholder: '冰美式' },
      { key: 'PRICE', label: '价格', placeholder: '12.5' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-23' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
    ],
    htmlTemplate: `
<div data-receipt style="width: 300px; margin: 0 auto; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); font-family: 'Consolas', 'Courier New', monospace; perspective: 1000px;">
  <div style="background: #fff; padding: 30px 20px; position: relative; clip-path: polygon(0 0, 100% 0, 100% 100%, 95% 98%, 90% 100%, 85% 98%, 80% 100%, 75% 98%, 70% 100%, 65% 98%, 60% 100%, 55% 98%, 50% 100%, 45% 98%, 40% 100%, 35% 98%, 30% 100%, 25% 98%, 20% 100%, 15% 98%, 10% 100%, 5% 98%, 0 100%); background-image: linear-gradient(to bottom, #ffffff 0%, #fcfcfc 100%);">
    
    <!-- 纸张质感遮罩 -->
    <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4='); pointer-events: none;"></div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px; position: relative; z-index: 1;">
      <div style="width: 40px; height: 40px; margin: 0 auto 10px; border: 3px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
         <span style="font-size: 20px; color: #333;">★</span>
      </div>
      <div style="font-size: 22px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 1px; line-height: 1.2;">{{SHOP_NAME}}</div>
      <div style="font-size: 10px; color: #666; margin-top: 5px; letter-spacing: 2px;">SALES RECEIPT</div>
    </div>

    <!-- Info -->
    <div style="font-size: 11px; color: #555; margin-bottom: 15px; line-height: 1.6; position: relative; z-index: 1;">
      <div style="display: flex; justify-content: space-between;">
        <span>DATE: {{DATE}}</span>
        <span>TIME: {{TIME}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>POS: #01</span>
        <span>CASHIER: AI</span>
      </div>
    </div>

    <!-- Divider -->
    <div style="border-bottom: 2px dashed #333; margin-bottom: 15px; position: relative; z-index: 1;"></div>

    <!-- Items -->
    <div style="font-size: 13px; line-height: 1.5; color: #000; position: relative; z-index: 1;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-bottom: 10px; color: #444;">
        <span style="flex: 1;">ITEM</span>
        <span style="width: 30px; text-align: center;">QTY</span>
        <span style="width: 60px; text-align: right;">PRICE</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: flex-start;">
        <span style="flex: 1; padding-right: 10px; font-weight: 600;">{{ITEM_NAME}}</span>
        <span style="width: 30px; text-align: center;">1</span>
        <span style="width: 60px; text-align: right;">¥{{PRICE}}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-top: 4px;">
        <span style="flex: 1;">Tax (0%)</span>
        <span style="width: 30px; text-align: center;"></span>
        <span style="width: 60px; text-align: right;">¥0.00</span>
      </div>
    </div>

    <!-- Divider -->
    <div style="border-bottom: 2px dashed #333; margin: 15px 0; position: relative; z-index: 1;"></div>

    <!-- Total -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; position: relative; z-index: 1;">
      <span style="font-size: 15px; font-weight: 900; letter-spacing: 1px;">TOTAL</span>
      <span style="font-size: 26px; font-weight: 900;">¥{{PRICE}}</span>
    </div>
    
    <div style="margin-bottom: 20px; font-size: 11px; color: #444; display: flex; justify-content: space-between; position: relative; z-index: 1;">
      <span>PAYMENT:</span>
      <span style="font-weight: bold;">ELECTRONIC CASH</span>
    </div>

    <!-- Footer -->
    <div style="text-align: center; position: relative; z-index: 1;">
      <div style="margin-bottom: 15px;">
        <!-- Barcode Simulation -->
        <div style="height: 45px; background: repeating-linear-gradient(to right, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 9px, #000 9px, #000 11px, transparent 11px, transparent 13px, #000 13px, #000 14px); width: 85%; margin: 0 auto; opacity: 0.9;"></div>
        <div style="font-size: 10px; letter-spacing: 4px; margin-top: 4px; font-family: monospace;">* 2025 8888 9999 *</div>
      </div>
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">Thank you for shopping!</div>
      <div style="font-size: 10px; color: #888;">Follow us on social media</div>
    </div>

  </div>
</div>
    `.trim()
  }
