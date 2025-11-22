import { TheatreTemplate } from '../../theatreTemplates'

export const marriageCertificateTemplate: TheatreTemplate = {
    id: 'marriage_certificate',
    category: '证件文书',
    name: '结婚证',
    keywords: ['结婚证', '结婚', '领证', '婚姻'],
    fields: [
      { key: 'NAME1', label: '配偶1姓名', placeholder: '张三' },
      { key: 'ID1', label: '配偶1身份证', placeholder: '110101199001011234' },
      { key: 'NAME2', label: '配偶2姓名', placeholder: '李四' },
      { key: 'ID2', label: '配偶2身份证', placeholder: '110101199002025678' },
      { key: 'DATE', label: '登记日期', placeholder: '2025年1月15日' },
      { key: 'NUMBER', label: '证件编号', placeholder: 'J123456789' },
    ],
    htmlTemplate: `
<div style="max-width: 400px; margin: 0 auto; background: #c62828; padding: 20px; border-radius: 8px; box-shadow: 0 8px 30px rgba(198,40,40,0.4); font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 书本容器 -->
  <div style="display: flex; gap: 4px; background: #8b1a1a; padding: 4px; border-radius: 4px;">
    <!-- 左页 -->
    <div style="flex: 1; background: #fff5f7; padding: 20px 16px; border-radius: 4px 0 0 4px; box-shadow: inset -2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 80px; margin: 0 auto 10px; background: #ff6b9d; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">♥</div>
        <div style="font-size: 12px; color: #999;">中华人民共和国</div>
        <div style="font-size: 18px; font-weight: bold; color: #ff6b9d; margin-top: 4px;">结婚证</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME1}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID1}}</span></div>
        <div style="border-top: 1px dashed #ddd; margin: 12px 0;"></div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME2}}</div>
        <div><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID2}}</span></div>
      </div>
    </div>
    
    <!-- 中缝 -->
    <div style="width: 2px; background: rgba(0,0,0,0.3); box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>
    
    <!-- 右页 -->
    <div style="flex: 1; background: #fff5f7; padding: 20px 16px; border-radius: 0 4px 4px 0; box-shadow: inset 2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: bold; color: #2d3436;">登记信息</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666; margin-bottom: 16px;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记日期：</span>{{DATE}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记机关：</span>民政局</div>
        <div><span style="color: #999;">证件编号：</span>{{NUMBER}}</div>
      </div>
      <div style="background: white; padding: 10px; border-radius: 4px; text-align: center; margin-bottom: 12px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 6px;">特此证明</div>
        <div style="font-size: 11px; color: #2d3436; line-height: 1.6;">持证人自愿结为夫妻，双方具有完全民事行为能力</div>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; border: 2px solid #ff6b9d; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #ff6b9d;">印章</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
