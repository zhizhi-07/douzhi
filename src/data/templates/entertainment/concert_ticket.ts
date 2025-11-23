import { TheatreTemplate } from '../../theatreTemplates'

export const concertTicketTemplate: TheatreTemplate = {
    id: 'concert_ticket',
    category: '娱乐休闲',
    name: '演唱会门票',
    keywords: ['演唱会', '门票', '演出票', '音乐会'],
    fields: [
      { key: 'ARTIST', label: '艺人/乐队', placeholder: '周杰伦 Jay Chou' },
      { key: 'TOUR_NAME', label: '巡演名称', placeholder: '嘉年华世界巡回演唱会' },
      { key: 'VENUE', label: '场馆', placeholder: '国家体育场（鸟巢）' },
      { key: 'DATE', label: '日期', placeholder: '2025.05.20' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'GATE', label: '入场口', placeholder: 'North' },
      { key: 'ZONE', label: '区域', placeholder: 'VIP区' },
      { key: 'ROW', label: '排号', placeholder: '1排' },
      { key: 'SEAT', label: '座号', placeholder: '01座' },
      { key: 'PRICE', label: '票价', placeholder: '1280' },
      { key: 'TICKET_ID', label: '票号', placeholder: 'NO.88888888' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; font-family: 'Montserrat', -apple-system, sans-serif; position: relative; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));">
  <div style="display: flex; background: #1e1e1e; border-radius: 12px; overflow: hidden; height: 200px;">
    
    <!-- 主券 (左侧 70%) -->
    <div style="flex: 7; position: relative; background: radial-gradient(circle at top right, #3a1c71 0%, #000000 100%); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-right: 2px dashed rgba(255,255,255,0.2);">
      <!-- 背景纹理 -->
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg=='); opacity: 0.5; pointer-events: none;"></div>
      
      <!-- 顶部信息 -->
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 10px; letter-spacing: 2px; color: #ff6b81; font-weight: bold; margin-bottom: 4px;">LIVE CONCERT TICKET</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{{ARTIST}}</div>
        <div style="font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 1px;">{{TOUR_NAME}}</div>
      </div>
      
      <!-- 中间详细信息 -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; gap: 8px; position: relative; z-index: 1;">
        <div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.4);">DATE</div>
          <div style="font-size: 12px; color: #fff; font-weight: 600;">{{DATE}}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.4);">TIME</div>
          <div style="font-size: 12px; color: #fff; font-weight: 600;">{{TIME}}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.4);">GATE</div>
          <div style="font-size: 12px; color: #ff6b81; font-weight: 600;">{{GATE}}</div>
        </div>
        
        <div style="grid-column: 1 / -1; margin-top: 4px;">
          <div style="font-size: 9px; color: rgba(255,255,255,0.4);">VENUE</div>
          <div style="font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{VENUE}}</div>
        </div>
      </div>
      
      <!-- 底部防伪条 -->
      <div style="height: 24px; background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); margin: 0 -20px -20px -20px; display: flex; align-items: center; padding: 0 20px;">
        <div style="font-size: 10px; font-weight: bold; color: #333; letter-spacing: 3px;">OFFICIAL TICKET</div>
      </div>
    </div>
    
    <!-- 副券 (右侧 30%) -->
    <div style="flex: 3; background: #fff; padding: 15px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
      <!-- 半圆切口 -->
      <div style="position: absolute; top: -6px; left: -6px; width: 12px; height: 12px; background: #222; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -6px; left: -6px; width: 12px; height: 12px; background: #222; border-radius: 50%;"></div>
      
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 16px; font-weight: 900; color: #000;">{{ZONE}}</div>
        <div style="font-size: 10px; color: #666;">{{ROW}} - {{SEAT}}</div>
      </div>
      
      <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 12px;">¥{{PRICE}}</div>
      
      <!-- 模拟条形码 -->
      <div style="width: 100%; height: 30px; background: repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px); transform: scaleX(0.8);"></div>
      <div style="font-size: 8px; color: #999; margin-top: 4px; font-family: monospace;">{{TICKET_ID}}</div>
    </div>
    
  </div>
</div>
    `.trim()
  }
