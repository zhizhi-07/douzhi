import { TheatreTemplate } from '../../theatreTemplates'

export const certificateTemplate: TheatreTemplate = {
    id: 'certificate',
    category: '工作学习',
    name: '证书',
    keywords: ['证书', '奖状', '荣誉证书', '获奖'],
    fields: [
      { key: 'NAME', label: '获奖人', placeholder: '张三' },
      { key: 'TITLE', label: '证书标题', placeholder: '优秀员工奖' },
      { key: 'CONTENT', label: '证书内容', placeholder: '在2024年度工作中表现突出，特发此证，以资鼓励' },
      { key: 'ORGANIZATION', label: '颁发机构', placeholder: '某某公司' },
      { key: 'DATE', label: '颁发日期', placeholder: '2025年1月' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: #fff8f0; padding: 32px 28px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: 'Georgia', 'Noto Serif SC', serif; border: 6px solid #d4af37; position: relative;">
  <!-- 装饰角 -->
  <div style="position: absolute; top: 20px; left: 20px; width: 30px; height: 30px; border-top: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
  <div style="position: absolute; top: 20px; right: 20px; width: 30px; height: 30px; border-top: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>
  <div style="position: absolute; bottom: 20px; left: 20px; width: 30px; height: 30px; border-bottom: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
  <div style="position: absolute; bottom: 20px; right: 20px; width: 30px; height: 30px; border-bottom: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>
  
  <!-- 标题 -->
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="font-size: 32px; font-weight: bold; color: #d4af37; letter-spacing: 4px; margin-bottom: 8px;">{{TITLE}}</div>
    <div style="width: 60px; height: 2px; background: #d4af37; margin: 0 auto;"></div>
  </div>
  
  <!-- 获奖人 -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 14px; color: #999; margin-bottom: 8px;">兹授予</div>
    <div style="font-size: 28px; font-weight: bold; color: #2d3436; border-bottom: 2px solid #d4af37; display: inline-block; padding: 0 20px 4px;">{{NAME}}</div>
  </div>
  
  <!-- 正文 -->
  <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin-bottom: 24px;">
    <div style="font-size: 15px; color: #2d3436; line-height: 1.9;">{{CONTENT}}</div>
  </div>
  
  <!-- 底部信息 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px;">
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; border: 2px solid #e74c3c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #e74c3c; margin: 0 auto 8px;">印章</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 15px; color: #2d3436; font-weight: 600; margin-bottom: 6px;">{{ORGANIZATION}}</div>
      <div style="font-size: 13px; color: #636e72;">{{DATE}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
