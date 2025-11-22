import { TheatreTemplate } from '../../theatreTemplates'

export const shoppingCartTemplate: TheatreTemplate = {
    id: 'shopping_cart',
    category: '生活消费',
    name: '购物车',
    keywords: ['购物车', '结算', '购物', '下单'],
    fields: [
      { key: 'ITEM1', label: '商品1', placeholder: 'iPhone 15 Pro' },
      { key: 'PRICE1', label: '价格1', placeholder: '8999' },
      { key: 'ITEM2', label: '商品2', placeholder: 'AirPods Pro' },
      { key: 'PRICE2', label: '价格2', placeholder: '1999' },
      { key: 'ITEM3', label: '商品3', placeholder: 'MacBook保护壳' },
      { key: 'PRICE3', label: '价格3', placeholder: '199' },
      { key: 'TOTAL', label: '总价', placeholder: '11197' },
    ],
    htmlTemplate: `
<div data-shopping-cart style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部 -->
  <div style="background: #ff6b6b; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 18px; font-weight: bold;">购物车</div>
      <div style="font-size: 12px; opacity: 0.9;">共3件商品</div>
    </div>
    <div data-select-all style="font-size: 13px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 16px;">全选</div>
  </div>
  
  <!-- 商品列表 -->
  <div style="padding: 14px;">
    <!-- 商品1 -->
    <div data-item="1" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="1" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM1}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE1}}</div>
    </div>
    
    <!-- 商品2 -->
    <div data-item="2" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="2" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM2}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE2}}</div>
    </div>
    
    <!-- 商品3 -->
    <div data-item="3" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 14px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="3" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM3}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE3}}</div>
    </div>
  </div>
  
  <!-- 底部结算栏 -->
  <div style="background: #f8f9fa; padding: 14px 20px; border-top: 1px solid #e5e5e5;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="font-size: 14px; color: #636e72;">合计</div>
      <div data-total style="font-size: 24px; font-weight: bold; color: #ff6b6b;">¥{{TOTAL}}</div>
    </div>
    <div data-checkout-btn style="background: #ff6b6b; color: white; text-align: center; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: all 0.2s;">结算 (3件)</div>
  </div>
</div>
    `.trim()
  }
