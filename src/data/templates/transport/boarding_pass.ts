import { TheatreTemplate } from '../../theatreTemplates'

export const boardingPassTemplate: TheatreTemplate = {
    id: 'boarding_pass',
    category: '交通出行',
    name: '登机牌',
    keywords: ['登机牌', '机票', '航班', '飞机票'],
    fields: [
      { key: 'PASSENGER', label: '乘客姓名', placeholder: '张三' },
      { key: 'FLIGHT', label: '航班号', placeholder: 'CA1234' },
      { key: 'FROM', label: '出发地', placeholder: '北京首都' },
      { key: 'TO', label: '目的地', placeholder: '上海虹桥' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '起飞时间', placeholder: '14:30' },
      { key: 'GATE', label: '登机口', placeholder: 'A12' },
      { key: 'SEAT', label: '座位号', placeholder: '32F' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部航空公司条 -->
  <div style="background: #0066cc; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold;">✈ 航空公司</div>
    <div style="font-size: 12px; opacity: 0.9;">BOARDING PASS</div>
  </div>
  
  <!-- 主要信息区 -->
  <div style="padding: 24px 20px;">
    <!-- 乘客信息 -->
    <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #ddd;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">乘客姓名 PASSENGER</div>
      <div style="font-size: 20px; font-weight: bold; color: #333;">{{PASSENGER}}</div>
    </div>
    
    <!-- 航班信息 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div style="flex: 1;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">出发 FROM</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{FROM}}</div>
      </div>
      <div style="font-size: 24px; color: #0066cc;">→</div>
      <div style="flex: 1; text-align: right;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">到达 TO</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{TO}}</div>
      </div>
    </div>
    
    <!-- 详细信息 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8f9fa; padding: 16px; border-radius: 8px;">
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">航班 FLIGHT</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{FLIGHT}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">日期 DATE</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{DATE}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">起飞 TIME</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{TIME}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">登机口 GATE</div>
        <div style="font-size: 16px; font-weight: 600; color: #0066cc;">{{GATE}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">座位 SEAT</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{SEAT}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部二维码 -->
  <div style="background: #f8f9fa; padding: 16px 20px; text-align: center; border-top: 2px dashed #ddd;">
    <div style="width: 80px; height: 80px; background: #000; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 60px; height: 60px; background: white; border: 8px solid #000; box-sizing: border-box;"></div>
    </div>
    <div style="font-size: 10px; color: #999; margin-top: 8px;">请于起飞前45分钟到达登机口</div>
  </div>
</div>
    `.trim()
  }
