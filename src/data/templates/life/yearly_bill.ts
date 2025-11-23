import { TheatreTemplate } from '../../theatreTemplates'

export const yearlyBillTemplate: TheatreTemplate = {
  id: 'yearly_bill',
  category: '生活消费',
  name: '年度账单',
  keywords: ['年度账单', '消费分析', '支付宝'],
  fields: [
    { key: 'YEAR', label: '年份', placeholder: '2024' },
    { key: 'TOTAL_SPEND', label: '总支出', placeholder: '88888.88' },
    { key: 'TOTAL_INCOME', label: '总收入', placeholder: '123456.00' },
    { key: 'TOP_CATEGORY', label: '消费最多', placeholder: '餐饮美食' },
    { key: 'TOP_AMOUNT', label: '该类金额', placeholder: '32000.00' },
    { key: 'FOOD_AMOUNT', label: '餐饮金额', placeholder: '32000.00' },
    { key: 'SHOPPING_AMOUNT', label: '购物金额', placeholder: '25000.00' },
    { key: 'TRANSPORT_AMOUNT', label: '交通金额', placeholder: '5000.00' },
    { key: 'ENTERTAINMENT_AMOUNT', label: '娱乐金额', placeholder: '8000.00' },
  ],
  htmlTemplate: `
<div data-yearly-bill style="background: linear-gradient(135deg, #1e2140 0%, #0d1117 100%); padding: 25px; border-radius: 16px; color: #fff; font-family: sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; overflow: hidden; user-select: none;">
  <!-- Background Particles -->
  <div style="position: absolute; width: 200px; height: 200px; background: radial-gradient(circle, rgba(64,169,255,0.2) 0%, transparent 70%); top: -50px; right: -50px; border-radius: 50%;"></div>
  <div style="position: absolute; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,100,100,0.15) 0%, transparent 70%); bottom: 20px; left: -30px; border-radius: 50%;"></div>

  <div style="text-align: center; margin-bottom: 30px; position: relative; z-index: 1;">
    <div style="font-size: 16px; opacity: 0.8; letter-spacing: 2px;">{{YEAR}} BILL</div>
    <div style="font-size: 36px; font-weight: bold; margin: 10px 0; background: linear-gradient(90deg, #ffd700, #f1c40f); -webkit-background-clip: text; color: transparent;">¥{{TOTAL_SPEND}}</div>
    <div style="font-size: 12px; color: #aaa;">总支出</div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 25px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
    <div style="text-align: center; flex: 1; border-right: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 18px; font-weight: bold; color: #52c41a;">¥{{TOTAL_INCOME}}</div>
      <div style="font-size: 12px; color: #aaa; margin-top: 4px;">总收入</div>
    </div>
    <div style="text-align: center; flex: 1;">
      <div style="font-size: 18px; font-weight: bold; color: #ff4d4f;">{{TOP_CATEGORY}}</div>
      <div style="font-size: 12px; color: #aaa; margin-top: 4px;">消费最多</div>
    </div>
  </div>

  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #ddd; margin-bottom: 5px;">
      <span>餐饮美食</span>
      <span>¥{{FOOD_AMOUNT}}</span>
    </div>
    <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
      <div style="width: 80%; height: 100%; background: linear-gradient(90deg, #ff9c6e, #ff7a45); border-radius: 4px; animation: slideRight 1s ease-out;"></div>
    </div>
  </div>

  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #ddd; margin-bottom: 5px;">
      <span>购物消费</span>
      <span>¥{{SHOPPING_AMOUNT}}</span>
    </div>
    <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
      <div style="width: 60%; height: 100%; background: linear-gradient(90deg, #95de64, #52c41a); border-radius: 4px; animation: slideRight 1.2s ease-out;"></div>
    </div>
  </div>

  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #ddd; margin-bottom: 5px;">
      <span>交通出行</span>
      <span>¥{{TRANSPORT_AMOUNT}}</span>
    </div>
    <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
      <div style="width: 30%; height: 100%; background: linear-gradient(90deg, #69c0ff, #1890ff); border-radius: 4px; animation: slideRight 1.4s ease-out;"></div>
    </div>
  </div>

  <div style="margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #ddd; margin-bottom: 5px;">
      <span>休闲娱乐</span>
      <span>¥{{ENTERTAINMENT_AMOUNT}}</span>
    </div>
    <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
      <div style="width: 45%; height: 100%; background: linear-gradient(90deg, #b37feb, #722ed1); border-radius: 4px; animation: slideRight 1.6s ease-out;"></div>
    </div>
  </div>

  <div data-share-btn style="text-align: center; margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.3s;">
    点击生成海报
  </div>
</div>
  `.trim()
}
