import { TheatreTemplate } from '../../theatreTemplates'

export const healthCheckupTemplate: TheatreTemplate = {
  id: 'health_checkup',
  category: '健康医疗',
  name: '体检报告',
  keywords: ['体检', '健康', '检查'],
  fields: [
    { key: 'NAME', label: '姓名', placeholder: '张三' },
    { key: 'DATE', label: '日期', placeholder: '2024-11-22' },
    { key: 'HEIGHT', label: '身高', placeholder: '175cm' },
    { key: 'WEIGHT', label: '体重', placeholder: '65kg' },
    { key: 'BMI', label: 'BMI', placeholder: '21.2' },
    { key: 'BLOOD_PRESSURE', label: '血压', placeholder: '120/80' },
    { key: 'HEART_RATE', label: '心率', placeholder: '72次/分' },
    { key: 'BLOOD_SUGAR', label: '血糖', placeholder: '5.2mmol/L' },
    { key: 'RESULT', label: '结论', placeholder: '身体健康，各项指标正常，继续保持。' },
  ],
  htmlTemplate: `
<div data-health-report style="background: #fff; border-radius: 4px; overflow: hidden; width: 100%; max-width: 320px; margin: 0 auto; font-family: sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #eee;">
  <div style="background: #4a90e2; color: white; padding: 20px; position: relative;">
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">健康体检报告</div>
    <div style="font-size: 12px; opacity: 0.9;">Physical Examination Report</div>
    <div style="position: absolute; right: 20px; top: 20px; width: 40px; height: 40px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; color: #4a90e2; font-weight: bold; font-size: 20px;">H</div>
  </div>
  
  <div style="padding: 20px;">
    <div style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #f5f5f5; padding-bottom: 15px;">
      <div style="width: 60px; height: 60px; background: #f0f0f0; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">👤</div>
      <div>
        <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px;">{{NAME}}</div>
        <div style="font-size: 12px; color: #999;">体检日期: {{DATE}}</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">BMI指数</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{BMI}}</div>
        <div style="font-size: 10px; color: #52c41a; margin-top: 2px;">正常范围</div>
      </div>
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">血压 mmHg</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{BLOOD_PRESSURE}}</div>
        <div style="font-size: 10px; color: #52c41a; margin-top: 2px;">正常</div>
      </div>
    </div>
    
    <table style="width: 100%; font-size: 13px; margin-bottom: 20px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0; color: #666;">身高/体重</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 500;">{{HEIGHT}} / {{WEIGHT}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0; color: #666;">心率</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 500;">{{HEART_RATE}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0; color: #666;">空腹血糖</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 500;">{{BLOOD_SUGAR}}</td>
      </tr>
    </table>
    
    <div style="background: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: bold; color: #1890ff; margin-bottom: 5px;">总检结论</div>
      <div style="font-size: 12px; color: #333; line-height: 1.5;">{{RESULT}}</div>
    </div>
  </div>
  
  <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 10px; color: #999;">
    本报告仅供参考，不作为临床诊断依据
  </div>
</div>
  `.trim()
}
