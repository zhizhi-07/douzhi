import { TheatreTemplate } from '../../theatreTemplates'

export const couponTemplate: TheatreTemplate = {
    id: 'coupon',
    category: '生活消费',
    name: '优惠券',
    keywords: ['优惠券', '折扣券', '代金券', '券'],
    fields: [
      { key: 'TITLE', label: '优惠标题', placeholder: '满100减50' },
      { key: 'AMOUNT', label: '优惠金额', placeholder: '50' },
      { key: 'CONDITION', label: '使用条件', placeholder: '满100元可用' },
      { key: 'EXPIRE_DATE', label: '过期日期', placeholder: '2025-12-31' },
      { key: 'CODE', label: '券码', placeholder: 'SAVE50' },
    ],
    htmlTemplate: `
<div data-coupon style="max-width: 360px; margin: 0 auto; background: white; position: relative; font-family: -apple-system, 'PingFang SC', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
  <!-- 左侧主体 -->
  <div style="display: flex; border-radius: 12px 0 0 12px; overflow: hidden;">
    <div style="flex: 1; background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); padding: 24px; color: white; position: relative;">
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">优惠</div>
      <div style="font-size: 48px; font-weight: bold; line-height: 1; margin-bottom: 8px;">¥{{AMOUNT}}</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">{{TITLE}}</div>
      <div style="font-size: 12px; opacity: 0.8;">{{CONDITION}}</div>
      
      <!-- 倒计时 -->
      <div data-countdown style="position: absolute; bottom: 16px; left: 24px; font-size: 12px; opacity: 0.9;">
        剩余: <span data-days>--</span>天 <span data-hours>--</span>时 <span data-minutes>--</span>分
      </div>
    </div>
    
    <!-- 右侧操作区 -->
    <div style="width: 100px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; border-left: 2px dashed #ff6b6b; position: relative;">
      <div style="position: absolute; top: -10px; left: -11px; width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -10px; left: -11px; width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%;"></div>
      
      <div data-use-btn style="writing-mode: vertical-rl; font-size: 16px; font-weight: bold; color: #ff6b6b; cursor: pointer; user-select: none; transition: transform 0.2s;">立即使用</div>
      
      <div style="margin-top: 20px; font-size: 10px; color: #999; writing-mode: vertical-rl;">{{CODE}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
