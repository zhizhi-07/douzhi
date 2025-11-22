import { TheatreTemplate } from '../../theatreTemplates'

export const loveLetterTemplate: TheatreTemplate = {
    id: 'love_letter',
    category: '情感关系',
    name: '情书',
    keywords: ['情书', '告白', '表白', '喜欢你'],
    fields: [
      { key: 'TO_NAME', label: '收信人', placeholder: '亲爱的你' },
      { key: 'CONTENT', label: '内容', placeholder: '遇见你是我最美的意外' },
      { key: 'FROM_NAME', label: '寄信人', placeholder: '想你的人' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.21' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #fff5f7; padding: 30px 25px; border-radius: 8px; box-shadow: 0 4px 20px rgba(255, 192, 203, 0.3); font-family: 'Georgia', 'Noto Serif SC', serif; position: relative;">
  <!-- 信纸纹理 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,192,203,0.1) 29px, rgba(255,192,203,0.1) 30px); pointer-events: none; border-radius: 8px;"></div>
  
  <!-- 装饰线条 -->
  <div style="position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; border: 2px solid rgba(213, 0, 109, 0.2); border-radius: 50%;"></div>
  <div style="position: absolute; bottom: 15px; left: 15px; width: 25px; height: 25px; border: 2px solid rgba(213, 0, 109, 0.15); border-radius: 50%;"></div>
  
  <!-- 内容 -->
  <div style="position: relative; z-index: 1;">
    <div style="text-align: right; font-size: 14px; color: #999; margin-bottom: 20px; font-style: italic;">{{DATE}}</div>
    
    <div style="font-size: 16px; color: #d5006d; margin-bottom: 16px; font-weight: 500;">致 {{TO_NAME}}：</div>
    
    <div style="font-size: 15px; line-height: 2; color: #333; text-indent: 2em; margin: 20px 0; min-height: 100px; white-space: pre-wrap;">{{CONTENT}}</div>
    
    <div style="text-align: right; margin-top: 30px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">—— {{FROM_NAME}}</div>
      <div style="width: 40px; height: 2px; background: #d5006d; margin: 0 auto;"></div>
    </div>
  </div>
</div>
    `.trim()
  }
