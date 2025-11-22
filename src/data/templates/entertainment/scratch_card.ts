import { TheatreTemplate } from '../../theatreTemplates'

export const scratchCardTemplate: TheatreTemplate = {
    id: 'scratch_card',
    category: '娱乐休闲',
    name: '刮刮乐',
    keywords: ['刮刮乐', '刮奖', '刮卡', '幸运'],
    fields: [
      { key: 'PRIZE', label: '奖品', placeholder: '一等奖' },
      { key: 'AMOUNT', label: '金额', placeholder: '100' },
      { key: 'CODE', label: '兑奖码', placeholder: 'LK2025' },
    ],
    htmlTemplate: `
<div data-scratch-card style="max-width: 340px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部标题 -->
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px;">刮刮乐</div>
    <div style="font-size: 12px; color: #999;">刮开涂层查看奖品</div>
  </div>
  
  <!-- 刮奖区域 -->
  <div style="position: relative; background: #f8f8f8; border-radius: 8px; overflow: hidden; border: 2px solid #e5e5e5;">
    <!-- 奖品内容（底层） -->
    <div data-prize-content style="padding: 50px 30px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #ff6b6b; margin-bottom: 12px;">{{PRIZE}}</div>
      <div style="font-size: 42px; font-weight: bold; color: #ff4444; margin-bottom: 16px;">¥{{AMOUNT}}</div>
      <div style="font-size: 13px; color: #666; padding: 10px; background: white; border-radius: 6px; margin-top: 12px;">
        <div style="font-size: 11px; margin-bottom: 4px; color: #999;">兑奖码</div>
        <div style="font-weight: 600; letter-spacing: 2px; color: #333;">{{CODE}}</div>
      </div>
    </div>
    
    <!-- Canvas刮层（顶层覆盖） -->
    <canvas 
      data-scratch-canvas
      width="280" 
      height="200"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair;"
    ></canvas>
  </div>
  
  <!-- 底部提示 -->
  <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #999;">
    刮开30%自动显示全部内容
  </div>
</div>
    `.trim()
  }
