import { TheatreTemplate } from '../../theatreTemplates'

export const hospitalRegistrationTemplate: TheatreTemplate = {
    id: 'hospital_registration',
    category: '健康医疗',
    name: '挂号单',
    keywords: ['挂号单', '挂号', '就诊', '医院'],
    fields: [
      { key: 'PATIENT', label: '患者姓名', placeholder: '张三' },
      { key: 'HOSPITAL', label: '医院名称', placeholder: '市人民医院' },
      { key: 'DEPARTMENT', label: '就诊科室', placeholder: '内科' },
      { key: 'DOCTOR', label: '医生', placeholder: '李医生' },
      { key: 'DATE', label: '就诊日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '就诊时间', placeholder: '上午 09:30' },
      { key: 'NUMBER', label: '挂号序号', placeholder: '15' },
      { key: 'FEE', label: '挂号费', placeholder: '5' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif; border: 2px solid #00b894;">
  <!-- 顶部医院信息 -->
  <div style="background: #00b894; color: white; padding: 16px 20px;">
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">{{HOSPITAL}}</div>
    <div style="font-size: 12px; opacity: 0.9;">门诊挂号单</div>
  </div>
  
  <!-- 主要信息 -->
  <div style="padding: 20px;">
    <!-- 患者信息 -->
    <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px dashed #ddd;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">患者姓名</div>
      <div style="font-size: 20px; font-weight: bold; color: #2d3436;">{{PATIENT}}</div>
    </div>
    
    <!-- 就诊信息 -->
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊科室</div>
        <div style="font-size: 16px; color: #2d3436; font-weight: 600;">{{DEPARTMENT}}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">接诊医生</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 500;">{{DOCTOR}}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊日期</div>
          <div style="font-size: 14px; color: #2d3436; font-weight: 500;">{{DATE}}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊时间</div>
          <div style="font-size: 14px; color: #2d3436; font-weight: 500;">{{TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 序号和费用 -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">挂号序号</div>
        <div style="font-size: 32px; color: #00b894; font-weight: bold;">{{NUMBER}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">挂号费用</div>
        <div style="font-size: 22px; color: #e74c3c; font-weight: bold;">¥{{FEE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f8f9fa; padding: 10px 20px; text-align: center; font-size: 10px; color: #999;">
    请按时就诊，过号作废
  </div>
</div>
    `.trim()
  }
