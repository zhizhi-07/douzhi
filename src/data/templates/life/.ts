import { TheatreTemplate } from '../../theatreTemplates'

export const : TheatreTemplate =   {
    id: 'screen_time',
    category: '健康医疗',
    name: '屏幕时间',
    keywords: ['屏幕时间', '手机使用', '使用时长', '手机统计'],
    fields: [
      { key: 'TIME', label: '时间', placeholder: '15:30' },
      { key: 'DATE', label: '日期', placeholder: '11月22日' },
      { key: 'WEEK', label: '星期', placeholder: '周五' },
      { key: 'TOTAL_TIME', label: '总使用时长', placeholder: '8小时32分' },
      { key: 'COMPARE_TEXT', label: '对比上周', placeholder: '较上周增加25%' },
      { key: 'UNLOCK_COUNT', label: '解锁次数', placeholder: '156' },
      { key: 'FIRST_UNLOCK', label: '首次拿起', placeholder: '07:30' },
      { key: 'APP1_NAME', label: 'APP1名称', placeholder: '微信' },
      { key: 'APP1_TIME', label: 'APP1时长', placeholder: '3小时12分' },
      { key: 'APP1_PERCENT', label: 'APP1占比', placeholder: '38' },
      { key: 'APP2_NAME', label: 'APP2名称', placeholder: '抖音' },
      { key: 'APP2_TIME', label: 'APP2时长', placeholder: '2小时45分' },
      { key: 'APP2_PERCENT', label: 'APP2占比', placeholder: '32' },
      { key: 'APP3_NAME', label: 'APP3名称', placeholder: 'Safari' },
      { key: 'APP3_TIME', label: 'APP3时长', placeholder: '1小时28分' },
      { key: 'APP3_PERCENT', label: 'APP3占比', placeholder: '17' }
    ],
    htmlTemplate: `
<div style="max-width: 375px; margin: 0 auto; background: #000; border-radius: 20px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
  <!-- 状态栏 -->
  <div style="background: #000; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: #fff;">
    <div style="flex: 1;">{{TIME}}</div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" style="opacity: 0.5;">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <svg width="14" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="opacity: 0.7;">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <path d="M12 20h.01"/>
      </svg>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 3px;">
      <span style="font-size: 11px;">100%</span>
      <svg width="20" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <rect x="2" y="7" width="18" height="10" rx="2"/>
        <rect x="4" y="9" width="14" height="6" fill="#fff"/>
        <line x1="21" y1="10" x2="21" y2="14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
  
  <!-- 导航栏 -->
  <div style="background: #1c1c1e; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5px solid #38383a;">
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span style="font-size: 15px; font-weight: 600; color: #fff;">屏幕时间</span>
    </div>
  </div>
  
  <!-- 内容区 -->
  <div style="background: #000; min-height: 500px; padding-bottom: 20px;">
    <!-- 日期选择器 -->
    <div style="display: flex; align-items: center; justify-content: center; padding: 12px 0; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span style="color: #fff; font-size: 16px; font-weight: 600;">{{DATE}} {{WEEK}}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>
    
    <!-- 总使用时长卡片 -->
    <div style="margin: 0 16px 20px 16px; background: #1c1c1e; border-radius: 12px; padding: 24px; text-align: center;">
      <div style="font-size: 48px; font-weight: 700; color: #fff; margin-bottom: 4px; font-family: -apple-system-headline;">{{TOTAL_TIME}}</div>
      <div style="font-size: 14px; color: #8e8e93; margin-bottom: 12px;">总使用时长</div>
      <div style="font-size: 13px; color: #ff9500;">{{COMPARE_TEXT}}</div>
    </div>
    
    <!-- 统计信息 -->
    <div style="margin: 0 16px 20px 16px; background: #1c1c1e; border-radius: 12px; padding: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">{{UNLOCK_COUNT}}</div>
          <div style="font-size: 12px; color: #8e8e93;">拿起次数</div>
        </div>
        <div style="width: 1px; background: #38383a; margin: 0 12px;"></div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">{{FIRST_UNLOCK}}</div>
          <div style="font-size: 12px; color: #8e8e93;">首次拿起</div>
        </div>
      </div>
    </div>
    
    <!-- 最常使用 -->
    <div style="margin: 0 16px 20px 16px;">
      <div style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px;">最常使用</div>
      
      <!-- APP1 -->
      <div style="background: #1c1c1e; border-radius: 12px; padding: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
        <div style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #07c160 0%, #06ae56 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px;">{{APP1_NAME}}</div>
          <div style="font-size: 14px; color: #8e8e93;">{{APP1_TIME}}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 22px; font-weight: 700; color: #fff;">{{APP1_PERCENT}}%</div>
        </div>
      </div>
      
      <!-- APP2 -->
      <div style="background: #1c1c1e; border-radius: 12px; padding: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
        <div style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #000 0%, #333 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px;">{{APP2_NAME}}</div>
          <div style="font-size: 14px; color: #8e8e93;">{{APP2_TIME}}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 22px; font-weight: 700; color: #fff;">{{APP2_PERCENT}}%</div>
        </div>
      </div>
      
      <!-- APP3 -->
      <div style="background: #1c1c1e; border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px;">
        <div style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #007aff 0%, #0051d5 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px;">{{APP3_NAME}}</div>
          <div style="font-size: 14px; color: #8e8e93;">{{APP3_TIME}}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 22px; font-weight: 700; color: #fff;">{{APP3_PERCENT}}%</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
