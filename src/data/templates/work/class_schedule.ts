import { TheatreTemplate } from '../../theatreTemplates'

export const classScheduleTemplate: TheatreTemplate = {
    id: 'class_schedule',
    category: '工作学习',
    name: '课程表',
    keywords: ['课程表', '课表', '上课时间', '课程安排'],
    fields: [
      { key: 'WEEK', label: '星期', placeholder: '星期一' },
      { key: 'CLASS1', label: '第1节 (08:00)', placeholder: '语文' },
      { key: 'CLASS2', label: '第2节 (09:00)', placeholder: '数学' },
      { key: 'CLASS3', label: '第3节 (10:00)', placeholder: '英语' },
      { key: 'CLASS4', label: '第4节 (11:00)', placeholder: '物理' },
      { key: 'CLASS5', label: '第5节 (14:00)', placeholder: '化学' },
      { key: 'CLASS6', label: '第6节 (15:00)', placeholder: '生物' },
      { key: 'CLASS7', label: '第7节 (16:00)', placeholder: '自习' },
      { key: 'CLASS8', label: '晚自习 (19:00)', placeholder: '阅读' },
    ],
    htmlTemplate: `
<div style="
  max-width: 380px; 
  margin: 0 auto; 
  background-color: #2d3a2d;
  background-image: url('data:image/svg+xml,%3Csvg width=\\'200\\' height=\\'200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noise)\\' opacity=\\'0.08\\'/%3E%3C/svg%3E');
  border: 12px solid #8d6e63;
  border-radius: 8px;
  box-shadow: 
    inset 0 0 20px rgba(0,0,0,0.5),
    0 10px 20px rgba(0,0,0,0.3);
  font-family: 'Short Stack', 'Architects Daughter', 'Patrick Hand', 'Comic Sans MS', cursive, sans-serif;
  color: #f0f0f0;
  position: relative;
  overflow: hidden;
">
  <!-- 粉笔灰效果 -->
  <div style="position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.03) 100%); pointer-events: none;"></div>

  <!-- 顶部装饰：挂绳 -->
  <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 80px; height: 24px; background: rgba(0,0,0,0.2); border-radius: 0 0 40px 40px; border: 2px dashed #a1887f; border-top: none;"></div>

  <!-- 标题区域 -->
  <div style="padding: 24px 20px 10px; text-align: center; border-bottom: 2px dashed rgba(255,255,255,0.3);">
    <div style="
      font-size: 24px; 
      font-weight: bold; 
      color: #ffecb3; 
      text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
      letter-spacing: 2px;
      display: inline-block;
      transform: rotate(-2deg);
    ">
      {{WEEK}} 课程表
    </div>
    <div style="font-size: 12px; color: #a5d6a7; margin-top: 4px; opacity: 0.8;">
      ✨ Keep Learning! ✨
    </div>
  </div>

  <!-- 课程列表 -->
  <div style="padding: 20px 16px;">
    <!-- 上午 -->
    <div style="margin-bottom: 16px;">
      <div style="
        font-size: 14px; 
        color: #ffcc80; 
        margin-bottom: 8px; 
        border-left: 3px solid #ffcc80; 
        padding-left: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">
        Morning ☀️
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">08:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS1}}</span>
        </li>
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">09:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS2}}</span>
        </li>
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">10:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS3}}</span>
        </li>
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">11:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS4}}</span>
        </li>
      </ul>
    </div>

    <!-- 午休装饰 -->
    <div style="text-align: center; margin: 12px 0; opacity: 0.7;">
      <span style="border: 1px dashed rgba(255,255,255,0.4); padding: 2px 8px; border-radius: 10px; font-size: 12px; color: #b2dfdb;">
        ☕ Lunch Break 💤
      </span>
    </div>

    <!-- 下午 -->
    <div style="margin-bottom: 16px;">
      <div style="
        font-size: 14px; 
        color: #ffab91; 
        margin-bottom: 8px; 
        border-left: 3px solid #ffab91; 
        padding-left: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">
        Afternoon 🌤️
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">14:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS5}}</span>
        </li>
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">15:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS6}}</span>
        </li>
        <li style="display: flex; align-items: baseline; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">16:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS7}}</span>
        </li>
      </ul>
    </div>

    <!-- 晚上 -->
    <div>
      <div style="
        font-size: 14px; 
        color: #ce93d8; 
        margin-bottom: 8px; 
        border-left: 3px solid #ce93d8; 
        padding-left: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">
        Evening 🌙
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="display: flex; align-items: baseline;">
          <span style="width: 60px; font-size: 12px; color: #cfd8dc; font-family: monospace;">19:00</span>
          <span style="flex: 1; font-size: 16px; font-weight: bold; color: #fff;">{{CLASS8}}</span>
        </li>
      </ul>
    </div>
  </div>

  <!-- 底部装饰 -->
  <div style="
    position: absolute; 
    bottom: 10px; 
    right: 10px; 
    font-size: 40px; 
    opacity: 0.2; 
    transform: rotate(-15deg);
    pointer-events: none;
  ">
    📚
  </div>
  
  <!-- 磁铁装饰 -->
  <div style="
    position: absolute; 
    top: 15px; 
    right: 15px; 
    width: 20px; 
    height: 20px; 
    border-radius: 50%; 
    background: radial-gradient(circle at 30% 30%, #ff5252, #b71c1c);
    box-shadow: 2px 2px 4px rgba(0,0,0,0.4);
  "></div>

</div>
    `.trim()
  }
