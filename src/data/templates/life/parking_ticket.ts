import { TheatreTemplate } from '../../theatreTemplates'

export const parkingTicketTemplate: TheatreTemplate = {
    id: 'parking_ticket',
    category: '生活消费',
    name: '停车票',
    keywords: ['停车票', '停车', '停车费', '停车凭证'],
    fields: [
      { key: 'PLATE', label: '车牌号', placeholder: '京A12345' },
      { key: 'LOCATION', label: '停车场', placeholder: '万达广场地下停车场' },
      { key: 'ENTER_TIME', label: '入场时间', placeholder: '2025-01-15 14:30' },
      { key: 'EXIT_TIME', label: '出场时间', placeholder: '2025-01-15 17:45' },
      { key: 'DURATION', label: '停车时长', placeholder: '3小时15分' },
      { key: 'FEE', label: '停车费', placeholder: '20' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif; border: 2px solid #f39c12;">
  <!-- 顶部标题栏 -->
  <div style="background: #f39c12; color: white; padding: 14px 20px; text-align: center;">
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">停车凭证</div>
    <div style="font-size: 11px; opacity: 0.9;">PARKING TICKET</div>
  </div>
  
  <!-- 主要信息 -->
  <div style="padding: 20px;">
    <!-- 车牌号 -->
    <div style="text-align: center; margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">车牌号码</div>
      <div style="font-size: 28px; font-weight: bold; color: #2d3436; letter-spacing: 3px;">{{PLATE}}</div>
    </div>
    
    <!-- 停车场位置 -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; color: #999; margin-bottom: 4px;">停车场地点</div>
      <div style="font-size: 15px; color: #2d3436; font-weight: 500;">{{LOCATION}}</div>
    </div>
    
    <!-- 时间信息 -->
    <div style="background: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">入场时间</div>
          <div style="font-size: 13px; color: #2d3436; font-weight: 500;">{{ENTER_TIME}}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">出场时间</div>
          <div style="font-size: 13px; color: #2d3436; font-weight: 500;">{{EXIT_TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 费用信息 -->
    <div style="border-top: 2px dashed #ddd; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">停车时长</div>
        <div style="font-size: 16px; color: #2d3436; font-weight: 600;">{{DURATION}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">应付金额</div>
        <div style="font-size: 26px; color: #f39c12; font-weight: bold;">¥{{FEE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f8f9fa; padding: 10px 20px; text-align: center; font-size: 10px; color: #999;">
    请妥善保管此凭证，出场时出示
  </div>
</div>
    `.trim()
  }
