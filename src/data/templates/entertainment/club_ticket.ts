import { TheatreTemplate } from '../../theatreTemplates'

export const clubTicketTemplate: TheatreTemplate = {
  id: 'club_ticket',
  category: '娱乐休闲',
  name: '夜店门票',
  keywords: ['夜店', '门票', '入场券', 'Party'],
  fields: [
    { key: 'EVENT_NAME', label: '活动', placeholder: 'Neon Night 2024' },
    { key: 'VENUE', label: '场地', placeholder: 'SPACE CLUB' },
    { key: 'DATE', label: '日期', placeholder: '2024.11.22' },
    { key: 'TIME', label: '时间', placeholder: '22:00 - LATE' },
    { key: 'TICKET_TYPE', label: '票种', placeholder: 'VIP ACCESS' },
    { key: 'PRICE', label: '票价', placeholder: '¥880' },
    { key: 'TICKET_NO', label: '票号', placeholder: 'No.0088' },
  ],
  htmlTemplate: `
<div data-club-ticket style="background: #000; width: 100%; max-width: 300px; margin: 0 auto; font-family: 'Arial Black', sans-serif; border-radius: 12px; overflow: hidden; color: white; position: relative; border: 2px solid #333; box-shadow: 0 0 20px rgba(255,0,255,0.3);">
  <!-- Holographic effect simulation -->
  <div style="position: absolute; inset: 0; background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%); pointer-events: none;"></div>
  
  <div style="padding: 25px; text-align: center; border-bottom: 2px dashed #333; position: relative;">
    <div style="position: absolute; bottom: -10px; left: -10px; width: 20px; height: 20px; background: #f0f0f0; border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -10px; right: -10px; width: 20px; height: 20px; background: #f0f0f0; border-radius: 50%;"></div>
    
    <div style="font-size: 12px; letter-spacing: 4px; color: #ff00ff; margin-bottom: 10px;">ADMIT ONE</div>
    <div style="font-size: 28px; text-transform: uppercase; background: linear-gradient(90deg, #00ffff, #ff00ff); -webkit-background-clip: text; color: transparent; margin-bottom: 5px; line-height: 1;">{{EVENT_NAME}}</div>
    <div style="font-size: 14px; color: #888;">AT {{VENUE}}</div>
  </div>
  
  <div style="padding: 25px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <div style="font-size: 10px; color: #666; margin-bottom: 2px;">DATE</div>
        <div style="font-size: 16px; font-weight: bold;">{{DATE}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; color: #666; margin-bottom: 2px;">TIME</div>
        <div style="font-size: 16px; font-weight: bold;">{{TIME}}</div>
      </div>
    </div>
    
    <div style="background: #111; padding: 10px; border: 1px solid #333; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 10px; color: #666;">TICKET TYPE</div>
        <div style="color: #00ffff; font-weight: bold;">{{TICKET_TYPE}}</div>
      </div>
      <div style="font-size: 18px; font-weight: bold;">{{PRICE}}</div>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
      <!-- Barcode -->
      <div style="height: 40px; background: repeating-linear-gradient(90deg, #fff 0px, #fff 2px, transparent 2px, transparent 4px); margin-bottom: 5px;"></div>
      <div style="font-size: 10px; letter-spacing: 2px; color: #666;">{{TICKET_NO}}</div>
    </div>
  </div>
</div>
  `.trim()
}
