import { TheatreTemplate } from '../../theatreTemplates'

export const couponTemplate: TheatreTemplate = {
    id: 'coupon',
    category: '生活消费',
    name: '优惠券',
    keywords: ['优惠券', '折扣券', '代金券', '券'],
    fields: [
      { key: 'BRAND_NAME', label: '品牌名称', placeholder: '星巴克 Starbucks' },
      { key: 'TITLE', label: '优惠标题', placeholder: '冬日暖饮特权券' },
      { key: 'AMOUNT', label: '优惠金额', placeholder: '30' },
      { key: 'UNIT', label: '单位', placeholder: '元' },
      { key: 'CONDITION', label: '使用条件', placeholder: '满60元可用' },
      { key: 'EXPIRE_DATE', label: '过期日期', placeholder: '2024-12-31' },
      { key: 'CODE', label: '券码', placeholder: 'COFFEE2024' },
      { key: 'USAGE_LIMIT', label: '使用限制', placeholder: '仅限饮品类商品，不与其他优惠同享' },
    ],
    htmlTemplate: `
<div data-coupon style="max-width: 360px; margin: 0 auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1)); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; user-select: none;">
  <div style="display: flex; background: white; border-radius: 12px; overflow: hidden; position: relative; min-height: 140px;">
    <!-- Left: Main Content -->
    <div style="flex: 1; background: linear-gradient(135deg, #fff5f5 0%, #fff 100%); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-right: 2px dashed #ffccc7;">
      <!-- Top/Bottom Semicircles for Perforation Effect -->
      <div style="position: absolute; right: -10px; top: -10px; width: 20px; height: 20px; background: #f2f4f7; border-radius: 50%;"></div>
      <div style="position: absolute; right: -10px; bottom: -10px; width: 20px; height: 20px; background: #f2f4f7; border-radius: 50%;"></div>

      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="width: 16px; height: 16px; background: #ff4d4f; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">券</span>
          {{BRAND_NAME}}
        </div>
        <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px;">{{TITLE}}</div>
        <div style="font-size: 12px; color: #666; background: rgba(255, 77, 79, 0.08); display: inline-block; padding: 2px 8px; border-radius: 4px; color: #ff4d4f;">{{USAGE_LIMIT}}</div>
      </div>
      
      <div style="margin-top: 16px;">
        <div style="font-size: 11px; color: #999;">有效期至 {{EXPIRE_DATE}}</div>
        <!-- Countdown (Optional if logic supports) -->
        <div data-countdown style="font-size: 11px; color: #ff4d4f; margin-top: 2px; display: flex; gap: 4px;">
          <span>剩余</span>
          <span data-days style="font-weight: bold;">--</span>天
          <span data-hours style="font-weight: bold;">--</span>时
        </div>
      </div>
    </div>

    <!-- Right: Amount & Action -->
    <div style="width: 110px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; position: relative;">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="color: #ff4d4f; font-weight: bold; line-height: 1; display: flex; align-items: flex-end; justify-content: center;">
          <span style="font-size: 18px; margin-bottom: 4px; font-weight: 600;">{{UNIT}}</span>
          <span style="font-size: 36px; font-family: 'DIN Alternate', sans-serif;">{{AMOUNT}}</span>
        </div>
        <div style="font-size: 12px; color: #999; margin-top: 4px;">{{CONDITION}}</div>
      </div>
      
      <div data-use-btn style="background: #ff4d4f; color: white; font-size: 13px; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 10px rgba(255, 77, 79, 0.3); white-space: nowrap;">立即使用</div>
      
      <!-- Used Stamp (Hidden by default) -->
      <div data-used-stamp style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg); border: 3px solid #ccc; padding: 4px 8px; color: #ccc; font-weight: bold; font-size: 24px; border-radius: 8px; pointer-events: none; opacity: 0.8; white-space: nowrap;">已使用</div>
    </div>
  </div>
</div>
    `.trim()
  }
