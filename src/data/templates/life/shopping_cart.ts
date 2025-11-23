import { TheatreTemplate } from '../../theatreTemplates'

export const shoppingCartTemplate: TheatreTemplate = {
    id: 'shopping_cart',
    category: '生活消费',
    name: '购物车',
    keywords: ['购物车', '结算', '购物', '下单'],
    fields: [
      { key: 'STORE_NAME', label: '店铺名称', placeholder: 'Apple 官方旗舰店' },
      { key: 'ITEM1', label: '商品1名称', placeholder: 'iPhone 15 Pro' },
      { key: 'ITEM1_DESC', label: '商品1描述', placeholder: '256G 钛金属原色' },
      { key: 'ITEM1_PRICE', label: '商品1价格', placeholder: '8999' },
      { key: 'ITEM1_IMG', label: '商品1图片(Emoji/URL)', placeholder: '📱' },
      { key: 'ITEM1_COUNT', label: '商品1数量', placeholder: '1' },
      
      { key: 'ITEM2', label: '商品2名称', placeholder: 'AirPods Pro' },
      { key: 'ITEM2_DESC', label: '商品2描述', placeholder: '第二代 配MagSafe充电盒' },
      { key: 'ITEM2_PRICE', label: '商品2价格', placeholder: '1899' },
      { key: 'ITEM2_IMG', label: '商品2图片(Emoji/URL)', placeholder: '🎧' },
      { key: 'ITEM2_COUNT', label: '商品2数量', placeholder: '1' },
      
      { key: 'ITEM3', label: '商品3名称', placeholder: '20W USB-C 电源适配器' },
      { key: 'ITEM3_DESC', label: '商品3描述', placeholder: '支持快充' },
      { key: 'ITEM3_PRICE', label: '商品3价格', placeholder: '149' },
      { key: 'ITEM3_IMG', label: '商品3图片(Emoji/URL)', placeholder: '🔌' },
      { key: 'ITEM3_COUNT', label: '商品3数量', placeholder: '1' },
      
      { key: 'DISCOUNT', label: '优惠金额', placeholder: '100' },
      { key: 'SHIPPING', label: '运费', placeholder: '0' },
      { key: 'TOTAL', label: '总价', placeholder: '10947' },
    ],
    htmlTemplate: `
<div data-shopping-cart style="max-width: 350px; margin: 0 auto; background: #f2f4f7; border-radius: 20px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.08); user-select: none;">
  <!-- Header -->
  <div style="background: linear-gradient(180deg, #fff 0%, #f2f4f7 100%); padding: 16px 16px 8px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.03);">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="font-size: 18px; font-weight: 600; color: #1a1a1a;">购物车</div>
      <div style="background: #ff4d4f; color: white; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold; box-shadow: 0 2px 6px rgba(255, 77, 79, 0.3);">3</div>
    </div>
    <div style="font-size: 14px; color: #333; font-weight: 500;">管理</div>
  </div>

  <!-- Store Section -->
  <div style="background: white; margin: 12px; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.02);">
    <!-- Store Header -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f5f5f5;">
      <div data-select-all style="width: 20px; height: 20px; border: 2px solid #ff4d4f; background: #ff4d4f; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);"><span style="color: white; font-size: 12px; font-weight: bold;">✓</span></div>
      <div style="font-weight: 600; font-size: 15px; color: #333; display: flex; align-items: center; gap: 4px;">
        {{STORE_NAME}} 
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ccc;"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>

    <!-- Item 1 -->
    <div data-item="1" data-price="{{ITEM1_PRICE}}" style="display: flex; gap: 12px; margin-bottom: 24px; position: relative;">
       <div data-checkbox="1" style="width: 20px; height: 20px; border: 2px solid #ff4d4f; background: #ff4d4f; border-radius: 50%; margin-top: 30px; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);"><span style="color: white; font-size: 12px; font-weight: bold;">✓</span></div>
       <div style="width: 88px; height: 88px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; border: 1px solid #eee;">
         {{ITEM1_IMG}}
       </div>
       <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 4px;">
         <div>
           <div style="font-size: 15px; font-weight: 500; color: #333; margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM1}}</div>
           <div style="font-size: 11px; color: #999; background: #f5f5f5; display: inline-flex; padding: 4px 8px; border-radius: 6px; align-items: center; gap: 4px;">
             <span>{{ITEM1_DESC}}</span>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
           </div>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
           <div style="font-size: 17px; font-weight: 700; color: #ff4d4f; font-family: 'DIN Alternate', sans-serif;">
             <span style="font-size: 12px; font-weight: 500;">¥</span>{{ITEM1_PRICE}}
           </div>
           <div style="border: 1px solid #eee; border-radius: 6px; display: flex; align-items: center; height: 26px; background: white;">
             <div style="padding: 0 8px; color: #ccc; font-size: 14px; cursor: pointer;">-</div>
             <div style="font-size: 13px; color: #333; min-width: 24px; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee; line-height: 24px; background: #fcfcfc;">{{ITEM1_COUNT}}</div>
             <div style="padding: 0 8px; color: #333; font-size: 14px; cursor: pointer;">+</div>
           </div>
         </div>
       </div>
    </div>

    <!-- Item 2 -->
    <div data-item="2" data-price="{{ITEM2_PRICE}}" style="display: flex; gap: 12px; margin-bottom: 24px; position: relative;">
       <div data-checkbox="2" style="width: 20px; height: 20px; border: 2px solid #ff4d4f; background: #ff4d4f; border-radius: 50%; margin-top: 30px; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);"><span style="color: white; font-size: 12px; font-weight: bold;">✓</span></div>
       <div style="width: 88px; height: 88px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; border: 1px solid #eee;">
         {{ITEM2_IMG}}
       </div>
       <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 4px;">
         <div>
           <div style="font-size: 15px; font-weight: 500; color: #333; margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM2}}</div>
           <div style="font-size: 11px; color: #999; background: #f5f5f5; display: inline-flex; padding: 4px 8px; border-radius: 6px; align-items: center; gap: 4px;">
             <span>{{ITEM2_DESC}}</span>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
           </div>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
           <div style="font-size: 17px; font-weight: 700; color: #ff4d4f; font-family: 'DIN Alternate', sans-serif;">
             <span style="font-size: 12px; font-weight: 500;">¥</span>{{ITEM2_PRICE}}
           </div>
           <div style="border: 1px solid #eee; border-radius: 6px; display: flex; align-items: center; height: 26px; background: white;">
             <div style="padding: 0 8px; color: #ccc; font-size: 14px; cursor: pointer;">-</div>
             <div style="font-size: 13px; color: #333; min-width: 24px; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee; line-height: 24px; background: #fcfcfc;">{{ITEM2_COUNT}}</div>
             <div style="padding: 0 8px; color: #333; font-size: 14px; cursor: pointer;">+</div>
           </div>
         </div>
       </div>
    </div>

    <!-- Item 3 -->
    <div data-item="3" data-price="{{ITEM3_PRICE}}" style="display: flex; gap: 12px; margin-bottom: 8px; position: relative;">
       <div data-checkbox="3" style="width: 20px; height: 20px; border: 2px solid #ff4d4f; background: #ff4d4f; border-radius: 50%; margin-top: 30px; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);"><span style="color: white; font-size: 12px; font-weight: bold;">✓</span></div>
       <div style="width: 88px; height: 88px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 40px; flex-shrink: 0; border: 1px solid #eee;">
         {{ITEM3_IMG}}
       </div>
       <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 4px;">
         <div>
           <div style="font-size: 15px; font-weight: 500; color: #333; margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM3}}</div>
           <div style="font-size: 11px; color: #999; background: #f5f5f5; display: inline-flex; padding: 4px 8px; border-radius: 6px; align-items: center; gap: 4px;">
             <span>{{ITEM3_DESC}}</span>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
           </div>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
           <div style="font-size: 17px; font-weight: 700; color: #ff4d4f; font-family: 'DIN Alternate', sans-serif;">
             <span style="font-size: 12px; font-weight: 500;">¥</span>{{ITEM3_PRICE}}
           </div>
           <div style="border: 1px solid #eee; border-radius: 6px; display: flex; align-items: center; height: 26px; background: white;">
             <div style="padding: 0 8px; color: #ccc; font-size: 14px; cursor: pointer;">-</div>
             <div style="font-size: 13px; color: #333; min-width: 24px; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee; line-height: 24px; background: #fcfcfc;">{{ITEM3_COUNT}}</div>
             <div style="padding: 0 8px; color: #333; font-size: 14px; cursor: pointer;">+</div>
           </div>
         </div>
       </div>
    </div>
  </div>

  <!-- Summary Section -->
  <div style="padding: 0 16px 16px;">
    <div style="background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.02); font-size: 13px; color: #666;">
       <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
         <span>商品金额</span>
         <span style="font-family: 'DIN Alternate', sans-serif;">¥{{TOTAL}}</span>
       </div>
       <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
         <span>立减优惠</span>
         <span style="color: #ff4d4f; font-family: 'DIN Alternate', sans-serif;">-¥{{DISCOUNT}}</span>
       </div>
       <div style="display: flex; justify-content: space-between;">
         <span>运费</span>
         <span style="font-family: 'DIN Alternate', sans-serif;">+¥{{SHIPPING}}</span>
       </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); position: relative; z-index: 10;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="font-size: 13px; color: #666;">已选 <span style="color: #333; font-weight: bold;">3</span> 件</div>
      <div style="display: flex; align-items: baseline;">
        <div style="font-size: 13px; color: #333; margin-right: 4px;">合计:</div>
        <div style="font-size: 14px; color: #ff4d4f; font-weight: bold; font-family: 'DIN Alternate', sans-serif;">¥</div>
        <div data-total style="font-size: 24px; color: #ff4d4f; font-weight: 700; font-family: 'DIN Alternate', sans-serif; letter-spacing: -0.5px;">{{TOTAL}}</div>
      </div>
    </div>
    <div data-checkout-btn style="background: linear-gradient(135deg, #ff6b6b, #ff4d4f); color: white; padding: 12px 32px; border-radius: 30px; font-weight: 600; font-size: 15px; box-shadow: 0 8px 20px rgba(255, 77, 79, 0.3); cursor: pointer; transition: all 0.2s;">
      提交订单
    </div>
  </div>
</div>
    `.trim()
  }
