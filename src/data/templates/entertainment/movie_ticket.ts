import { TheatreTemplate } from '../../theatreTemplates'

export const movieTicketTemplate: TheatreTemplate = {
    id: 'movie_ticket',
    category: '娱乐休闲',
    name: '电影票',
    keywords: ['电影票', '看电影', '电影院', '观影'],
    fields: [
      { key: 'MOVIE_NAME', label: '电影名', placeholder: '流浪地球3' },
      { key: 'CINEMA', label: '影院', placeholder: '万达国际影城(CBD店)' },
      { key: 'HALL', label: '影厅', placeholder: '7号厅' },
      { key: 'HALL_TYPE', label: '影厅类型', placeholder: 'IMAX Laser' },
      { key: 'SEAT', label: '座位', placeholder: '5排8座' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-21' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'PRICE', label: '价格', placeholder: '68.0 (含服务费)' },
      { key: 'DURATION', label: '时长', placeholder: '173分钟' },
      { key: 'TICKET_CODE', label: '取票码', placeholder: '8839 2201' },
      { key: 'ORDER_ID', label: '订单号', placeholder: 'WD20251121001' },
    ],
    htmlTemplate: `
<div style="max-width: 320px; margin: 0 auto; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); font-family: 'Courier New', Courier, monospace;">
  <!-- 票据主体 -->
  <div style="background: #fff; position: relative; padding: 30px 20px; clip-path: polygon(
    0% 10px, 5% 10px, 5% 0%, 10% 0%, 10% 10px, 15% 10px, 15% 0%, 20% 0%, 20% 10px, 25% 10px, 25% 0%, 30% 0%, 30% 10px, 35% 10px, 35% 0%, 40% 0%, 40% 10px, 45% 10px, 45% 0%, 50% 0%, 50% 10px, 55% 10px, 55% 0%, 60% 0%, 60% 10px, 65% 10px, 65% 0%, 70% 0%, 70% 10px, 75% 10px, 75% 0%, 80% 0%, 80% 10px, 85% 10px, 85% 0%, 90% 0%, 90% 10px, 95% 10px, 95% 0%, 100% 0%, 100% 10px,
    100% 100%, 0% 100%
  );">
    
    <!-- 顶部影院信息 -->
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #333; padding-bottom: 15px;">
      <div style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 4px;">{{CINEMA}}</div>
      <div style="font-size: 10px; color: #666;">欢迎光临 / WELCOME</div>
    </div>
    
    <!-- 电影信息 -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 20px; font-weight: 900; color: #000; line-height: 1.3; margin-bottom: 8px;">{{MOVIE_NAME}}</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <span style="background: #000; color: #fff; font-size: 10px; padding: 2px 4px; border-radius: 2px; font-weight: bold;">{{HALL_TYPE}}</span>
        <span style="font-size: 11px; color: #666; display: flex; align-items: center;">{{DURATION}}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #000;">{{TIME}}</div>
        <div style="font-size: 12px; color: #333;">{{DATE}}</div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 10px; border-radius: 4px;">
        <div>
          <div style="font-size: 10px; color: #666; margin-bottom: 2px;">影厅 HALL</div>
          <div style="font-size: 14px; font-weight: bold;">{{HALL}}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; color: #666; margin-bottom: 2px;">座位 SEAT</div>
          <div style="font-size: 14px; font-weight: bold;">{{SEAT}}</div>
        </div>
      </div>
    </div>
    
    <!-- 价格和订单 -->
    <div style="margin-bottom: 20px; font-size: 12px; color: #333; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between;">
        <span>票价 Price:</span>
        <span style="font-weight: bold;">¥{{PRICE}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>订单 Order:</span>
        <span style="font-family: monospace;">{{ORDER_ID}}</span>
      </div>
    </div>
    
    <!-- 二维码区域 -->
    <div style="text-align: center; border-top: 2px dashed #333; padding-top: 20px;">
      <div style="width: 100px; height: 100px; background: #000; margin: 0 auto 10px; position: relative;">
        <!-- 模拟二维码 -->
        <div style="position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; background: #fff;">
           <div style="width: 100%; height: 100%; background-image: radial-gradient(#000 30%, transparent 31%), radial-gradient(#000 30%, transparent 31%); background-size: 10px 10px; background-position: 0 0, 5px 5px;"></div>
           <div style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; border: 3px solid #000;"></div>
           <div style="position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border: 3px solid #000;"></div>
           <div style="position: absolute; bottom: 10px; left: 10px; width: 20px; height: 20px; border: 3px solid #000;"></div>
        </div>
      </div>
      <div style="font-size: 14px; font-weight: bold; letter-spacing: 2px;">{{TICKET_CODE}}</div>
      <div style="font-size: 10px; color: #999; margin-top: 4px;">凭二维码入场</div>
    </div>
    
  </div>
  
  <!-- 底部锯齿装饰 -->
  <div style="height: 10px; background: radial-gradient(circle, transparent 50%, #fff 50%); background-size: 15px 15px; background-position: center top; transform: rotate(180deg); margin-top: -1px;"></div>
</div>
    `.trim()
  }
