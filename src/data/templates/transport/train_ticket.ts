import { TheatreTemplate } from '../../theatreTemplates'

export const trainTicketTemplate: TheatreTemplate = {
    id: 'train_ticket',
    category: '交通出行',
    name: '火车票',
    keywords: ['火车票', '高铁票', '动车票', '车票'],
    fields: [
      { key: 'TRAIN_NO', label: '车次', placeholder: 'G1234' },
      { key: 'FROM_STATION', label: '始发站', placeholder: '北京南' },
      { key: 'TO_STATION', label: '到达站', placeholder: '上海虹桥' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'TIME', label: '发车时间', placeholder: '08:30' },
      { key: 'SEAT', label: '座位', placeholder: '06车12A号' },
      { key: 'PRICE', label: '票价', placeholder: '553' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: white; border: 3px solid #003d82; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,61,130,0.2); font-family: 'SimHei', 'Microsoft YaHei', sans-serif;">
  <!-- 顶部蓝条 -->
  <div style="background: #003d82; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">中国铁路</div>
    <div style="font-size: 13px; opacity: 0.9;">电子客票</div>
  </div>
  
  <!-- 主要信息区 -->
  <div style="padding: 20px;">
    <!-- 车次和日期 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0;">
      <div>
        <div style="font-size: 28px; font-weight: bold; color: #003d82;">{{TRAIN_NO}}</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">高速动车组</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 14px; color: #333; font-weight: 500;">{{DATE}}</div>
        <div style="font-size: 12px; color: #666; margin-top: 2px;">{{TIME}}开</div>
      </div>
    </div>
    
    <!-- 站点信息 -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="flex: 1;">
        <div style="font-size: 24px; font-weight: bold; color: #000;">{{FROM_STATION}}</div>
      </div>
      <div style="flex: 0 0 60px; text-align: center;">
        <svg width="60" height="20" viewBox="0 0 60 20" style="display: block;">
          <path d="M5 10 L55 10" stroke="#003d82" stroke-width="2" fill="none"/>
          <path d="M55 10 L50 7 M55 10 L50 13" stroke="#003d82" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="flex: 1; text-align: right;">
        <div style="font-size: 24px; font-weight: bold; color: #000;">{{TO_STATION}}</div>
      </div>
    </div>
    
    <!-- 座位和票价 -->
    <div style="display: flex; justify-content: space-between; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <div>
        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">座位号</div>
        <div style="font-size: 18px; font-weight: bold; color: #003d82;">{{SEAT}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">票价</div>
        <div style="font-size: 20px; font-weight: bold; color: #e63946;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f0f4f8; padding: 10px 20px; font-size: 11px; color: #666; text-align: center; border-top: 1px dashed #ddd;">
    请提前到站 · 对号入座 · 保管好车票
  </div>
</div>
    `.trim()
  }
