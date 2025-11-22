import { TheatreTemplate } from '../../theatreTemplates'

export const checkInTemplate: TheatreTemplate = {
    id: 'check_in',
    category: '工作学习',
    name: '打卡记录',
    keywords: ['打卡', '签到', '上班打卡', '考勤'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '打卡时间', placeholder: '09:00:23' },
      { key: 'LOCATION', label: '打卡地点', placeholder: '公司大楼' },
      { key: 'STATUS', label: '状态', placeholder: '正常' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部 -->
  <div style="background: #0984e3; color: white; padding: 20px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 8px;">✓</div>
    <div style="font-size: 20px; font-weight: bold;">打卡成功</div>
  </div>
  
  <!-- 内容区 -->
  <div style="padding: 24px;">
    <!-- 姓名 -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 24px; font-weight: bold; color: #2d3436;">{{NAME}}</div>
    </div>
    
    <!-- 打卡信息 -->
    <div style="background: #f8f9fa; padding: 18px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 13px; color: #999;">打卡时间</div>
        <div data-time style="font-size: 15px; color: #2d3436; font-weight: 600;">{{TIME}}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 13px; color: #999;">打卡日期</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 600;">{{DATE}}</div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div style="font-size: 13px; color: #999;">打卡地点</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 600;">{{LOCATION}}</div>
      </div>
    </div>
    
    <!-- 状态 -->
    <div style="text-align: center; padding: 12px; background: #d5f4e6; border-radius: 8px;">
      <div data-status style="font-size: 16px; color: #00b894; font-weight: bold;">{{STATUS}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
