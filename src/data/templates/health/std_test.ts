import { TheatreTemplate } from '../../theatreTemplates'

export const stdTestTemplate: TheatreTemplate = {
  id: 'std_test',
  category: '健康医疗',
  name: '医学检测报告',
  keywords: ['检测', '报告', '医学'],
  fields: [
    { key: 'PATIENT_NAME', label: '姓名', placeholder: '王五' },
    { key: 'TEST_DATE', label: '日期', placeholder: '2024-11-22' },
    { key: 'HIV_RESULT', label: 'HIV抗体', placeholder: '阴性(-)' },
    { key: 'SYPHILIS_RESULT', label: '梅毒螺旋体', placeholder: '阴性(-)' },
    { key: 'GONORRHEA_RESULT', label: '淋球菌', placeholder: '阴性(-)' },
    { key: 'OVERALL_CONCLUSION', label: '结论', placeholder: '本次检测未见异常。' },
  ],
  htmlTemplate: `
<div data-medical-report style="background: #fff; padding: 30px 20px; width: 100%; max-width: 320px; margin: 0 auto; font-family: 'SimSun', serif; color: #333; border: 1px solid #ccc; position: relative;">
  <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #c00; padding-bottom: 10px;">
    <div style="font-size: 18px; font-weight: bold; color: #c00;">临床检验报告单</div>
    <div style="font-size: 10px; margin-top: 5px;">Clinical Laboratory Report</div>
  </div>
  
  <div style="font-size: 12px; margin-bottom: 15px; display: flex; flex-wrap: wrap;">
    <div style="width: 50%; margin-bottom: 5px;">姓名: {{PATIENT_NAME}}</div>
    <div style="width: 50%; margin-bottom: 5px;">样本号: 20241122088</div>
    <div style="width: 50%;">科室: 检验科</div>
    <div style="width: 50%;">日期: {{TEST_DATE}}</div>
  </div>
  
  <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="border-bottom: 1px solid #000;">
        <th style="text-align: left; padding: 5px 0;">项目名称</th>
        <th style="text-align: center; padding: 5px 0;">结果</th>
        <th style="text-align: right; padding: 5px 0;">参考值</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 8px 0;">HIV抗体检测</td>
        <td style="text-align: center; font-weight: bold;">{{HIV_RESULT}}</td>
        <td style="text-align: right;">阴性(-)</td>
      </tr>
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 8px 0;">梅毒螺旋体抗体</td>
        <td style="text-align: center; font-weight: bold;">{{SYPHILIS_RESULT}}</td>
        <td style="text-align: right;">阴性(-)</td>
      </tr>
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 8px 0;">淋球菌DNA检测</td>
        <td style="text-align: center; font-weight: bold;">{{GONORRHEA_RESULT}}</td>
        <td style="text-align: right;">阴性(-)</td>
      </tr>
    </tbody>
  </table>
  
  <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 20px; font-size: 12px;">
    <div style="font-weight: bold; margin-bottom: 5px;">检测结论:</div>
    <div>{{OVERALL_CONCLUSION}}</div>
  </div>
  
  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 30px;">
    <div>检验者: 李医生</div>
    <div>审核者: 张主任</div>
  </div>
  
  <div style="position: absolute; bottom: 20px; right: 20px; width: 80px; height: 80px; border: 2px solid #c00; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #c00; font-weight: bold; opacity: 0.3; transform: rotate(-15deg); font-size: 14px;">
    <div style="text-align: center; border: 1px solid #c00; border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
      检验专用章
    </div>
  </div>
</div>
  `.trim()
}
