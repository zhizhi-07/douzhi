import { TheatreTemplate } from '../../theatreTemplates'

export const movieTicketTemplate: TheatreTemplate = {
    id: 'movie_ticket',
    category: '娱乐休闲',
    name: '电影票',
    keywords: ['电影票', '看电影', '电影院', '观影'],
    fields: [
      { key: 'MOVIE_NAME', label: '电影名', placeholder: '流浪地球3' },
      { key: 'CINEMA', label: '影院', placeholder: '万达影城' },
      { key: 'HALL', label: '影厅', placeholder: '7号厅' },
      { key: 'SEAT', label: '座位', placeholder: '5排8座' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-21' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'PRICE', label: '价格', placeholder: '45' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部区域 -->
  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-bottom: 2px dashed rgba(255,255,255,0.3);">
    <div style="color: white; text-align: center;">
      <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px; letter-spacing: 1px;">CINEMA TICKET</div>
      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: bold; line-height: 1.3;">{{MOVIE_NAME}}</h2>
      <div style="font-size: 13px; opacity: 0.9;">{{CINEMA}}</div>
    </div>
  </div>
  
  <!-- 信息区域 -->
  <div style="padding: 20px; color: white;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">放映厅</div>
        <div style="font-size: 16px; font-weight: 600;">{{HALL}}</div>
      </div>
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">座位号</div>
        <div style="font-size: 16px; font-weight: 600;">{{SEAT}}</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">放映时间</div>
        <div style="font-size: 14px; font-weight: 500;">{{DATE}} {{TIME}}</div>
      </div>
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">票价</div>
        <div style="font-size: 16px; font-weight: 600; color: #ffd700;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部条形码 -->
  <div style="background: white; padding: 15px; text-align: center;">
    <div style="display: flex; justify-content: center; gap: 2px; margin-bottom: 8px;">
      ${Array(20).fill(0).map((_, i) => `<div style="width: 3px; height: ${15 + Math.random() * 20}px; background: #333;"></div>`).join('')}
    </div>
    <div style="font-size: 10px; color: #666; letter-spacing: 2px; font-family: 'Courier New', monospace;">{{TICKET_NO}}</div>
  </div>
</div>
    `.trim()
  }
