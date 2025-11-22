import { TheatreTemplate } from '../../theatreTemplates'

export const diaryTemplate: TheatreTemplate = {
    id: 'diary',
    category: '工作学习',
    name: '日记',
    keywords: ['日记', '记录'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '平凡的一天' },
      { key: 'CONTENT', label: '内容', placeholder: '今天天气很好...' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'WEEKDAY', label: '星期', placeholder: '星期四' },
      { key: 'WEATHER', label: '天气', placeholder: '晴' },
      { key: 'MOOD', label: '心情', placeholder: '开心' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #f9f6f0; padding: 30px 25px; border-radius: 3px; box-shadow: 0 2px 10px rgba(0,0,0,0.1), inset 0 0 100px rgba(255,255,200,0.1); position: relative; font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 纸张纹理效果 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(200,200,180,0.15) 29px, rgba(200,200,180,0.15) 30px); pointer-events: none; border-radius: 3px;"></div>
  
  <!-- 订书钉装饰 -->
  <div style="position: absolute; top: 15px; left: 15px; width: 8px; height: 8px; background: #888; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
  <div style="position: absolute; top: 15px; right: 15px; width: 8px; height: 8px; background: #888; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
  
  <!-- 内容区 -->
  <div style="position: relative; z-index: 1;">
    <!-- 日期和天气 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid #d4c5a9;">
      <div>
        <div style="font-size: 18px; font-weight: bold; color: #2c2416; margin-bottom: 3px;">{{DATE}}</div>
        <div style="font-size: 13px; color: #6b5d4f;">{{WEEKDAY}}</div>
      </div>
      <div style="text-align: right; font-size: 13px; color: #6b5d4f;">
        <div style="margin-bottom: 3px;">天气：{{WEATHER}}</div>
        <div>心情：{{MOOD}}</div>
      </div>
    </div>
    
    <!-- 标题 -->
    <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #2c2416; font-weight: bold; text-align: center; letter-spacing: 1px;">{{TITLE}}</h2>
    
    <!-- 正文 -->
    <div style="font-size: 14px; line-height: 1.9; color: #3a3229; text-indent: 2em; white-space: pre-wrap; word-wrap: break-word;">{{CONTENT}}</div>
    
    <!-- 底部装饰 -->
    <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #9b8b7e; font-style: italic;">
      —— 记于{{DATE}}
    </div>
  </div>
  
  <!-- 边缘磨损效果 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent);"></div>
  <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent);"></div>
</div>
    `.trim()
  }
