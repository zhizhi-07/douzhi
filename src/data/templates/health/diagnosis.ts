import { TheatreTemplate } from '../../theatreTemplates'

export const diagnosisTemplate: TheatreTemplate = {
    id: 'diagnosis',
    category: '健康医疗',
    name: '诊断书',
    keywords: ['诊断书', '病历', '诊断证明', '医疗'],
    fields: [
      { key: 'PATIENT', label: '患者姓名', placeholder: '张三' },
      { key: 'HOSPITAL', label: '医院', placeholder: '市人民医院' },
      { key: 'DIAGNOSIS', label: '诊断结果', placeholder: '感冒' },
      { key: 'DOCTOR', label: '医生', placeholder: '李医生' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; padding: 28px 24px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: 'Georgia', 'Noto Serif SC', serif; border: 2px solid #e74c3c;">
  <!-- 医院抬头 -->
  <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e74c3c;">
    <div style="font-size: 22px; font-weight: bold; color: #2d3436; margin-bottom: 6px;">{{HOSPITAL}}</div>
    <div style="font-size: 16px; color: #636e72;">诊断证明书</div>
  </div>
  
  <!-- 患者信息 -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 14px; color: #999; margin-bottom: 6px;">患者姓名</div>
    <div style="font-size: 18px; font-weight: bold; color: #2d3436;">{{PATIENT}}</div>
  </div>
  
  <!-- 诊断结果 -->
  <div style="background: #fff5f5; padding: 18px; border-radius: 8px; border-left: 4px solid #e74c3c; margin-bottom: 20px;">
    <div style="font-size: 13px; color: #999; margin-bottom: 8px;">临床诊断</div>
    <div style="font-size: 16px; color: #2d3436; line-height: 1.6;">{{DIAGNOSIS}}</div>
  </div>
  
  <!-- 底部信息 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed #ddd;">
    <div>
      <div style="font-size: 13px; color: #999; margin-bottom: 4px;">主治医师</div>
      <div style="font-size: 15px; font-weight: 600; color: #2d3436;">{{DOCTOR}}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 13px; color: #999; margin-bottom: 4px;">诊断日期</div>
      <div style="font-size: 15px; font-weight: 600; color: #2d3436;">{{DATE}}</div>
    </div>
  </div>
  
  <!-- 印章 -->
  <div style="text-align: right; margin-top: 16px;">
    <div style="display: inline-block; width: 70px; height: 70px; border: 2px solid #e74c3c; border-radius: 50%; color: #e74c3c; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">医院印章</div>
  </div>
</div>
    `.trim()
  }
