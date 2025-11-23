import { TheatreTemplate } from '../../theatreTemplates'

export const barBillTemplate: TheatreTemplate = {
    id: 'bar_bill',
    category: '生活消费',
    name: '酒吧账单',
    keywords: ['酒吧', '夜店', '账单', '酒水'],
    fields: [
      { key: 'BAR_NAME', label: '酒吧名称', placeholder: 'Muse Club' },
      { key: 'TABLE_NO', label: '桌号', placeholder: 'V888' },
      { key: 'TIME', label: '时间', placeholder: '02:30 AM' },
      { key: 'DRINK1_NAME', label: '酒水1', placeholder: '黑桃A香槟' },
      { key: 'DRINK1_QUANTITY', label: '数量1', placeholder: '2' },
      { key: 'DRINK1_PRICE', label: '单价1', placeholder: '8800' },
      { key: 'DRINK2_NAME', label: '酒水2（可选）', placeholder: '果盘大份' },
      { key: 'DRINK2_QUANTITY', label: '数量2', placeholder: '1' },
      { key: 'DRINK2_PRICE', label: '单价2', placeholder: '580' },
      { key: 'SERVICE_FEE', label: '服务费', placeholder: '1818' },
      { key: 'TOTAL_AMOUNT', label: '总金额', placeholder: '19998' }
    ],
    htmlTemplate: `
<div data-bar-bill style="max-width: 350px; margin: 0 auto; background: #1a1a1a; padding: 20px; font-family: 'Courier New', monospace; position: relative; overflow: hidden;">
  <!-- 背景光效 -->
  <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(155, 89, 182, 0.2), transparent); pointer-events: none;"></div>
  <div style="position: absolute; bottom: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(52, 152, 219, 0.2), transparent); pointer-events: none;"></div>

  <!-- 账单主体 -->
  <div style="background: #fff; padding: 20px; transform: rotate(-1deg); box-shadow: 0 5px 15px rgba(0,0,0,0.5); position: relative;">
    <!-- 湿痕/污渍 -->
    <div style="position: absolute; top: 40px; right: 30px; width: 60px; height: 60px; border: 4px solid rgba(139, 69, 19, 0.1); border-radius: 50%; pointer-events: none; transform: scale(1.2);"></div>
    
    <div style="text-align: center; border-bottom: 1px dashed #333; padding-bottom: 15px; margin-bottom: 15px;">
      <div style="font-size: 20px; font-weight: bold; text-transform: uppercase;">{{BAR_NAME}}</div>
      <div style="font-size: 12px; margin-top: 5px;">Receipt / INVOICE</div>
      <div style="font-size: 12px; margin-top: 5px;">{{TIME}} | Table: {{TABLE_NO}}</div>
    </div>
    
    <div style="font-size: 13px; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>{{DRINK1_NAME}} x{{DRINK1_QUANTITY}}</span>
        <span>{{DRINK1_PRICE}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; display: {{DRINK2_NAME}} ? 'flex' : 'none';">
        <span>{{DRINK2_NAME}} x{{DRINK2_QUANTITY}}</span>
        <span>{{DRINK2_PRICE}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px; color: #666; font-size: 12px;">
        <span>Service Charge (10%)</span>
        <span>{{SERVICE_FEE}}</span>
      </div>
    </div>
    
    <div style="border-top: 2px solid #333; margin-top: 15px; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
        <span>TOTAL</span>
        <span>¥{{TOTAL_AMOUNT}}</span>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 12px;">
      <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; transform: rotate(-10deg); color: #2c3e50;">Thank You!</div>
      <div style="margin-top: 10px;">*** CARD **** 8888</div>
    </div>
    
    <!-- AA计算器 (默认折叠) -->
    <div data-aa-panel style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; display: none;">
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Split Bill (AA)</div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <div style="flex: 1; text-align: center; border: 1px solid #eee; padding: 5px; cursor: pointer;" data-split="2">2人</div>
        <div style="flex: 1; text-align: center; border: 1px solid #eee; padding: 5px; cursor: pointer;" data-split="3">3人</div>
        <div style="flex: 1; text-align: center; border: 1px solid #eee; padding: 5px; cursor: pointer;" data-split="4">4人</div>
        <div style="flex: 1; text-align: center; border: 1px solid #eee; padding: 5px; cursor: pointer;" data-split="5">5人</div>
      </div>
      <div data-split-result style="text-align: center; margin-top: 10px; font-weight: bold; color: #e74c3c;"></div>
    </div>
    
    <div data-toggle-aa style="text-align: center; margin-top: 15px; cursor: pointer; color: #3498db; font-size: 12px;">
      Tap to Split Bill
    </div>
  </div>
</div>
    `.trim()
}
