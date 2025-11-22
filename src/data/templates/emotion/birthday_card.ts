import { TheatreTemplate } from '../../theatreTemplates'

export const birthdayCardTemplate: TheatreTemplate = {
    id: 'birthday_card',
    category: '情感关系',
    name: '生日贺卡',
    keywords: ['生日贺卡', '生日快乐', '生日祝福', '贺卡'],
    fields: [
      { key: 'TO_NAME', label: '收卡人', placeholder: '小红' },
      { key: 'MESSAGE', label: '祝福语', placeholder: '祝你生日快乐，心想事成' },
      { key: 'FROM_NAME', label: '送卡人', placeholder: '你的朋友' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #ffeaa7; border-radius: 20px; padding: 30px 25px; box-shadow: 0 10px 30px rgba(253,203,110,0.4); position: relative; overflow: hidden; font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 装饰彩带 -->
  <div style="position: absolute; top: -10px; left: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; transform: rotate(45deg);"></div>
  <div style="position: absolute; bottom: -15px; right: -15px; width: 100px; height: 100px; background: rgba(255,255,255,0.15); border-radius: 50%;"></div>
  
  <div style="position: relative; z-index: 1;">
    <!-- 标题 -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 32px; font-weight: bold; color: #d63031; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); margin-bottom: 10px;">生日快乐</div>
      <div style="font-size: 18px; color: #2d3436; font-weight: 500;">Dear {{TO_NAME}}</div>
    </div>
    
    <!-- 祝福内容 -->
    <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px dashed rgba(214,48,49,0.3);">
      <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #2d3436; text-align: center; white-space: pre-wrap;">{{MESSAGE}}</p>
    </div>
    
    <!-- 装饰蜡烛 -->
    <div style="display: flex; justify-content: center; gap: 12px; margin: 20px 0;">
      ${Array(5).fill(0).map((_, i) => `
        <div style="width: 8px; height: 35px; background: #e74c3c; border-radius: 4px 4px 0 0; position: relative;">
          <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 10px; height: 12px; background: #f39c12; border-radius: 50% 50% 0 0;"></div>
        </div>
      `).join('')}
    </div>
    
    <!-- 落款 -->
    <div style="text-align: right; font-size: 14px; color: #636e72; font-style: italic; margin-top: 25px;">
      —— {{FROM_NAME}}
    </div>
  </div>
</div>
    `.trim()
  }
