import { TheatreTemplate } from '../../theatreTemplates'

export const countdownTemplate: TheatreTemplate = {
    id: 'countdown',
    category: '工具应用',
    name: '倒计时',
    keywords: ['倒计时', '距离', '还有多久', '天数'],
    fields: [
      { key: 'EVENT', label: '事件名称', placeholder: '同学聚会' },
      { key: 'DAYS', label: '剩余天数', placeholder: '55' },
      { key: 'DATE', label: '目标日期', placeholder: '2025-06-07' },
      { key: 'MEANING', label: '倒计时含义', placeholder: '四年的青春即将画上句号。这是我们最后一次以学生的身份相聚，从此各奔东西。珍惜每一天，留下最美好的回忆。' },
    ],
    htmlTemplate: `
<div data-countdown style="max-width: 280px; margin: 0 auto; perspective: 1000px; cursor: pointer; font-family: -apple-system, 'PingFang SC', sans-serif;">
  <div data-flip-card style="position: relative; width: 100%; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);">
    
    <!-- 正面：倒计时 -->
    <div data-front style="backface-visibility: hidden; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
      <div style="background: #5eb5a6; color: white; padding: 10px 16px; font-size: 14px; text-align: center;">
        {{EVENT}} 还有
      </div>
      
      <div style="padding: 40px 20px; text-align: center; background: white;">
        <div style="font-size: 72px; font-weight: bold; color: #2d3436; line-height: 1;">{{DAYS}}</div>
      </div>
      
      <div style="background: #e8e8e8; padding: 8px 16px; text-align: center; font-size: 13px; color: #666;">
        {{DATE}}
      </div>
    </div>
    
    <!-- 背面：含义 -->
    <div data-back style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); background: white; border-radius: 8px; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
      <div style="font-size: 14px; line-height: 1.8; color: #333; text-align: center; white-space: pre-wrap;">{{MEANING}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
