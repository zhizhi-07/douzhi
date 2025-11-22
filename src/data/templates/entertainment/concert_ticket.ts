import { TheatreTemplate } from '../../theatreTemplates'

export const concertTicketTemplate: TheatreTemplate = {
    id: 'concert_ticket',
    category: '娱乐休闲',
    name: '演唱会门票',
    keywords: ['演唱会', '门票', '演出票', '音乐会'],
    fields: [
      { key: 'ARTIST', label: '演出艺人', placeholder: '周杰伦' },
      { key: 'TITLE', label: '演唱会名称', placeholder: '地表最强演唱会' },
      { key: 'VENUE', label: '场馆', placeholder: '鸟巢体育场' },
      { key: 'DATE', label: '日期', placeholder: '2025-05-20' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'SEAT', label: '座位', placeholder: 'A区10排15座' },
      { key: 'PRICE', label: '票价', placeholder: '880' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.3); font-family: -apple-system, 'PingFang SC', sans-serif; position: relative;">
  <!-- 背景装饰 -->
  <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,107,107,0.1); border-radius: 50%; filter: blur(40px);"></div>
  <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: rgba(107,107,255,0.1); border-radius: 50%; filter: blur(40px);"></div>
  
  <div style="position: relative; z-index: 1; padding: 30px 24px;">
    <!-- 顶部标签 -->
    <div style="display: inline-block; background: #ff6b6b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-bottom: 16px;">LIVE CONCERT</div>
    
    <!-- 艺人名称 -->
    <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 8px;">{{ARTIST}}</div>
    <div style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 24px;">{{TITLE}}</div>
    
    <!-- 演出信息 -->
    <div style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px);">
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">场馆 VENUE</div>
        <div style="font-size: 16px; color: white; font-weight: 500;">{{VENUE}}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">日期 DATE</div>
          <div style="font-size: 14px; color: white; font-weight: 500;">{{DATE}}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">时间 TIME</div>
          <div style="font-size: 14px; color: white; font-weight: 500;">{{TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 座位和价格 -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.2);">
      <div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">座位 SEAT</div>
        <div style="font-size: 16px; color: white; font-weight: 600;">{{SEAT}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">票价 PRICE</div>
        <div style="font-size: 20px; color: #ff6b6b; font-weight: bold;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
