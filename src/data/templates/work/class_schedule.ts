import { TheatreTemplate } from '../../theatreTemplates'

export const classScheduleTemplate: TheatreTemplate = {
    id: 'class_schedule',
    category: '工作学习',
    name: '课程表',
    keywords: ['课程表', '课表', '上课时间', '课程安排'],
    fields: [
      { key: 'WEEK', label: '星期', placeholder: '星期一' },
      { key: 'CLASS1', label: '第1节', placeholder: '语文' },
      { key: 'CLASS2', label: '第2节', placeholder: '数学' },
      { key: 'CLASS3', label: '第3节', placeholder: '英语' },
      { key: 'CLASS4', label: '第4节', placeholder: '物理' },
      { key: 'CLASS5', label: '第5节', placeholder: '化学' },
      { key: 'CLASS6', label: '第6节', placeholder: '生物' },
      { key: 'CLASS7', label: '第7节', placeholder: '体育' },
      { key: 'CLASS8', label: '第8节', placeholder: '自习' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部标题 -->
  <div style="background: #6c5ce7; color: white; padding: 16px 20px;">
    <div style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 8px;">{{WEEK}} 课程表</div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 11px; opacity: 0.8;">
      <div style="text-align: center;">一</div>
      <div style="text-align: center;">二</div>
      <div style="text-align: center;">三</div>
      <div style="text-align: center;">四</div>
      <div style="text-align: center;">五</div>
      <div style="text-align: center;">六</div>
      <div style="text-align: center;">日</div>
    </div>
  </div>
  
  <!-- 课程列表 -->
  <div style="padding: 14px;">
    <!-- 上午 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">上午</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #5dade2;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第1节 08:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS1}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #52b3d9;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第2节 09:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS2}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #48b9d0;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第3节 10:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS3}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #3ebfc6;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第4节 11:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS4}}</div>
      </div>
    </div>
    
    <!-- 午休 -->
    <div style="text-align: center; padding: 8px; background: #fff8e6; border-radius: 6px; margin-bottom: 12px;">
      <div style="font-size: 12px; color: #e67e22;">午休时间 12:00 - 14:00</div>
    </div>
    
    <!-- 下午 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">下午</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
      <div style="padding: 10px; background: #f0fcf8; border-radius: 6px; border-left: 3px solid #45c5a0;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第5节 14:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS5}}</div>
      </div>
      <div style="padding: 10px; background: #f0fcf8; border-radius: 6px; border-left: 3px solid #3bb894;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第6节 15:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS6}}</div>
      </div>
    </div>
    
    <!-- 晚上 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">晚上</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
      <div style="padding: 10px; background: #faf5ff; border-radius: 6px; border-left: 3px solid #9b87d8;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第7节 18:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS7}}</div>
      </div>
      <div style="padding: 10px; background: #faf5ff; border-radius: 6px; border-left: 3px solid #8b7bc5;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第8节 19:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS8}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
