import { TheatreTemplate } from '../../theatreTemplates'

export const businessCardTemplate: TheatreTemplate = {
    id: 'business_card',
    category: '工作学习',
    name: '名片',
    keywords: ['名片', '联系方式', '个人信息'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '林深' },
      { key: 'TITLE', label: '职位', placeholder: '独立摄影师' },
      { key: 'COMPANY', label: '工作室/公司', placeholder: '见鹿文化' },
      { key: 'PHONE', label: '电话', placeholder: '138 0000 0000' },
      { key: 'EMAIL', label: '邮箱', placeholder: 'lin@example.com' },
      { key: 'ADDRESS', label: '地址', placeholder: '杭州市西湖区' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background-color: #fdfbf7; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZDdkM2NhIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4='), linear-gradient(to bottom right, #fff, #f7f3e8); border-radius: 2px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); font-family: 'Songti SC', 'SimSun', 'Times New Roman', serif; position: relative; color: #2c3e50; padding: 32px 28px; border: 1px solid rgba(0,0,0,0.05);">
  
  <!-- 装饰：水墨/水彩晕染 -->
  <div style="position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: radial-gradient(circle at center, rgba(108, 92, 231, 0.08) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
  <div style="position: absolute; bottom: 20px; left: -20px; width: 120px; height: 120px; background: radial-gradient(circle at center, rgba(255, 118, 117, 0.06) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
  
  <!-- 主体内容布局 -->
  <div style="display: flex; justify-content: space-between; height: 100%;">
    
    <!-- 左侧：联系方式（横排小字） -->
    <div style="display: flex; flex-direction: column; justify-content: flex-end; font-size: 11px; color: #7f8c8d; line-height: 2.2; letter-spacing: 0.5px;">
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; color: #34495e; font-size: 12px; letter-spacing: 1px; margin-bottom: 4px;">{{COMPANY}}</div>
      </div>
      
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 3px; height: 3px; background: #b2bec3; border-radius: 50%;"></span>
        <span>{{PHONE}}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 3px; height: 3px; background: #b2bec3; border-radius: 50%;"></span>
        <span>{{EMAIL}}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 3px; height: 3px; background: #b2bec3; border-radius: 50%;"></span>
        <span>{{ADDRESS}}</span>
      </div>
    </div>

    <!-- 右侧：姓名职位（竖排） -->
    <div style="display: flex; flex-direction: row-reverse; align-items: flex-start; gap: 16px; padding-top: 10px;">
      <!-- 姓名 -->
      <div style="writing-mode: vertical-rl; font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #2c3e50; height: 140px; display: flex; align-items: center;">
        {{NAME}}
      </div>
      
      <!-- 职位 -->
      <div style="writing-mode: vertical-rl; font-size: 12px; letter-spacing: 3px; color: #95a5a6; height: 100px; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 8px; margin-left: 4px; display: flex; align-items: center;">
        {{TITLE}}
      </div>
    </div>
  </div>

  <!-- 装饰印章 -->
  <div style="position: absolute; top: 30px; left: 24px; width: 24px; height: 24px; border: 1px solid #c0392b; color: #c0392b; font-size: 10px; display: flex; align-items: center; justify-content: center; border-radius: 2px; opacity: 0.6; transform: rotate(-10deg);">
    <div style="writing-mode: vertical-rl; letter-spacing: 2px;">信</div>
  </div>

</div>
    `.trim()
  }
