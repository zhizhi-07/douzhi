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
<div style="max-width: 380px; margin: 0 auto; background: radial-gradient(circle, #a01818 0%, #800e0e 100%); padding: 8px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: 'STSong', 'SimSun', serif; position: relative; border: 1px solid #5a0a0a;">
  <!-- 金色内框 -->
  <div style="border: 4px double #d4af37; border-radius: 4px; padding: 30px 24px; background: #fffdf5; position: relative; min-height: 280px; box-shadow: inset 0 0 20px rgba(0,0,0,0.05);">
    
    <!-- 四角装饰 -->
    <div style="position: absolute; top: 8px; left: 8px; width: 40px; height: 40px; border-top: 4px double #d4af37; border-left: 4px double #d4af37; border-radius: 8px 0 0 0;"></div>
    <div style="position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border-top: 4px double #d4af37; border-right: 4px double #d4af37; border-radius: 0 8px 0 0;"></div>
    <div style="position: absolute; bottom: 8px; left: 8px; width: 40px; height: 40px; border-bottom: 4px double #d4af37; border-left: 4px double #d4af37; border-radius: 0 0 0 8px;"></div>
    <div style="position: absolute; bottom: 8px; right: 8px; width: 40px; height: 40px; border-bottom: 4px double #d4af37; border-right: 4px double #d4af37; border-radius: 0 0 8px 0;"></div>

    <!-- 顶部标题 -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 14px; color: #d4af37; letter-spacing: 4px; margin-bottom: 8px; text-transform: uppercase;">Certificate of Honor</div>
      <div style="font-size: 32px; font-weight: bold; color: #c0392b; letter-spacing: 8px; font-family: 'STKaiti', 'KaiTi', serif; text-shadow: 1px 1px 0 rgba(0,0,0,0.1);">荣誉证书</div>
    </div>
    
    <!-- 正文内容 -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 16px; color: #555; margin-bottom: 12px;">兹授予</div>
      <div style="font-size: 28px; font-weight: bold; color: #2c3e50; margin-bottom: 12px; border-bottom: 1px solid #d4af37; display: inline-block; padding: 0 20px 4px; min-width: 120px;">{{NAME}}</div>
      <div style="font-size: 18px; font-weight: bold; color: #d4af37; margin-bottom: 20px;">{{TITLE}}</div>
      <div style="font-size: 15px; color: #555; line-height: 1.8; padding: 0 10px;">
        {{CONTENT}}
      </div>
    </div>
    
    <!-- 底部特发此证 -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="font-size: 14px; color: #999; letter-spacing: 2px;">特发此证，以资鼓励</div>
    </div>
    
    <!-- 底部落款 -->
    <div style="display: flex; justify-content: flex-end; align-items: flex-end; position: relative;">
      <div style="text-align: center; position: relative; z-index: 2;">
        <div style="font-size: 16px; font-weight: bold; color: #2c3e50; margin-bottom: 6px; font-family: 'STKaiti', 'KaiTi', serif;">{{ORGANIZATION}}</div>
        <div style="font-size: 13px; color: #7f8c8d;">{{DATE}}</div>
      </div>
      
      <!-- 印章 -->
      <div style="position: absolute; top: -30px; right: -10px; width: 90px; height: 90px; border: 3px solid rgba(231, 76, 60, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-25deg); z-index: 1; mix-blend-mode: multiply;">
        <div style="width: 80px; height: 80px; border: 1px solid rgba(231, 76, 60, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <div style="font-size: 24px; color: rgba(231, 76, 60, 0.7);">★</div>
          <div style="font-size: 10px; color: rgba(231, 76, 60, 0.7); margin-top: 2px; font-weight: bold;">专用章</div>
        </div>
      </div>
    </div>
    
  </div>
</div>
    `.trim()
  }
