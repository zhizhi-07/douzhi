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
<div data-shopping-cart style="width: 100%; background: #f4f4f4; border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; user-select: none;">
  <!-- Status Bar Placeholder -->
  <div style="height: 44px; background: #fff; display: flex; align-items: flex-end; padding: 0 16px 8px; justify-content: space-between; position: sticky; top: 0; z-index: 10;">
    <div style="font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 6px;">
      购物车
      <span style="font-size: 12px; font-weight: normal; color: #666; background: #eee; padding: 1px 6px; border-radius: 10px;">3</span>
    </div>
    <div style="font-size: 14px; color: #333;">管理</div>
  </div>

  <!-- Content Scroll Area -->
  <div style="padding: 12px;">
    
    <!-- Store Card -->
    <div style="background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
      <!-- Store Header -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <div style="width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; background: #ff5000; border-color: #ff5000;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="font-weight: 600; font-size: 15px; color: #333; flex: 1; display: flex; align-items: center; gap: 4px;">
          <span style="background: #ff5000; color: white; font-size: 10px; padding: 1px 4px; border-radius: 4px; font-weight: normal;">天猫</span>
          {{STORE_NAME}}
          <span style="color: #999; font-size: 12px;">></span>
        </div>
      </div>

      <!-- Item 1 -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; margin-top: 32px; flex-shrink: 0; background: #ff5000; border-color: #ff5000; display: flex; align-items: center; justify-content: center;">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="width: 90px; height: 90px; background: #f8f8f8; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 40px; overflow: hidden;">
          {{ITEM1_IMG}}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
          <div>
            <div style="font-size: 14px; color: #333; line-height: 1.4; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM1}}</div>
            <div style="display: inline-block; background: #f5f5f5; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #999; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ITEM1_DESC}} <span style="font-family: sans-serif;">▼</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="color: #ff5000; font-weight: 600; font-size: 16px;"><span style="font-size: 11px;">¥</span>{{ITEM1_PRICE}}</div>
            <div style="border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; height: 22px;">
              <div style="width: 24px; text-align: center; color: #ccc; font-size: 14px;">-</div>
              <div style="padding: 0 4px; font-size: 12px; color: #333; border-left: 1px solid #eee; border-right: 1px solid #eee; height: 100%; display: flex; align-items: center;">{{ITEM1_COUNT}}</div>
              <div style="width: 24px; text-align: center; color: #333; font-size: 14px;">+</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Item 2 -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; margin-top: 32px; flex-shrink: 0; background: #ff5000; border-color: #ff5000; display: flex; align-items: center; justify-content: center;">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="width: 90px; height: 90px; background: #f8f8f8; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 40px; overflow: hidden;">
          {{ITEM2_IMG}}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
          <div>
            <div style="font-size: 14px; color: #333; line-height: 1.4; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM2}}</div>
            <div style="display: inline-block; background: #f5f5f5; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #999; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ITEM2_DESC}} <span style="font-family: sans-serif;">▼</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="color: #ff5000; font-weight: 600; font-size: 16px;"><span style="font-size: 11px;">¥</span>{{ITEM2_PRICE}}</div>
            <div style="border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; height: 22px;">
              <div style="width: 24px; text-align: center; color: #ccc; font-size: 14px;">-</div>
              <div style="padding: 0 4px; font-size: 12px; color: #333; border-left: 1px solid #eee; border-right: 1px solid #eee; height: 100%; display: flex; align-items: center;">{{ITEM2_COUNT}}</div>
              <div style="width: 24px; text-align: center; color: #333; font-size: 14px;">+</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Item 3 -->
      <div style="display: flex; gap: 10px;">
        <div style="width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; margin-top: 32px; flex-shrink: 0; background: #ff5000; border-color: #ff5000; display: flex; align-items: center; justify-content: center;">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div style="width: 90px; height: 90px; background: #f8f8f8; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 40px; overflow: hidden;">
          {{ITEM3_IMG}}
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
          <div>
            <div style="font-size: 14px; color: #333; line-height: 1.4; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ITEM3}}</div>
            <div style="display: inline-block; background: #f5f5f5; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #999; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ITEM3_DESC}} <span style="font-family: sans-serif;">▼</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="color: #ff5000; font-weight: 600; font-size: 16px;"><span style="font-size: 11px;">¥</span>{{ITEM3_PRICE}}</div>
            <div style="border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; height: 22px;">
              <div style="width: 24px; text-align: center; color: #ccc; font-size: 14px;">-</div>
              <div style="padding: 0 4px; font-size: 12px; color: #333; border-left: 1px solid #eee; border-right: 1px solid #eee; height: 100%; display: flex; align-items: center;">{{ITEM3_COUNT}}</div>
              <div style="width: 24px; text-align: center; color: #333; font-size: 14px;">+</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Details -->
    <div style="background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 70px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #666;">
        <span>商品金额</span>
        <span>¥{{TOTAL}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #666;">
        <span>立减优惠</span>
        <span style="color: #ff5000;">-¥{{DISCOUNT}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666;">
        <span>运费</span>
        <span>+¥{{SHIPPING}}</span>
      </div>
      <div style="border-top: 1px dashed #eee; margin-top: 12px; padding-top: 12px; text-align: right; font-size: 12px; color: #999;">
        优惠券已抵扣 <span style="color: #ff5000;">{{DISCOUNT}}</span> 元
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #fff; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f0f0f0; z-index: 20;">
    <div style="display: flex; align-items: center; gap: 8px;">
       <div style="width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #ff5000; border-color: #ff5000;">
         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
       </div>
       <span style="font-size: 12px; color: #666;">全选</span>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #333;">
          合计: <span style="color: #ff5000; font-weight: 600; font-size: 16px;"><span style="font-size: 12px;">¥</span>{{TOTAL}}</span>
        </div>
        <div style="font-size: 10px; color: #ff5000;">优惠减 ¥{{DISCOUNT}}</div>
      </div>
      <div style="background: linear-gradient(90deg, #ff9000, #ff5000); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">
        结算(3)
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
