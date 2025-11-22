import { TheatreTemplate } from '../../theatreTemplates'

export const overtimeRecordTemplate: TheatreTemplate = {
    id: 'overtime_record',
    category: '工作学习',
    name: '加班记录',
    keywords: ['加班', '加班记录', '加班时长', '加班申请'],
    fields: [
      { key: 'APPLICANT', label: '申请人', placeholder: '张三' },
      { key: 'DEPARTMENT', label: '部门', placeholder: '技术部' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'START_TIME', label: '开始时间', placeholder: '18:30' },
      { key: 'END_TIME', label: '结束时间', placeholder: '22:00' },
      { key: 'HOURS', label: '加班时长', placeholder: '3.5小时' },
      { key: 'REASON', label: '加班事由', placeholder: '紧急项目上线需要完成代码部署及测试工作' },
      { key: 'APPROVER', label: '审批人', placeholder: '李经理' },
      { key: 'APPROVE_TIME', label: '审批时间', placeholder: '11-21 19:05' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#007aff;padding:16px;text-align:center">
    <div style="font-size:18px;font-weight:600;color:#fff;margin-bottom:6px">加班申请单</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.85)">Overtime Application</div>
  </div>
  
  <div style="padding:16px">
    <div style="background:#f2f2f7;padding:12px;border-radius:10px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;background:#007aff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600;flex-shrink:0">{{APPLICANT_INITIAL}}</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;color:#000;margin-bottom:2px">{{APPLICANT}}</div>
          <div style="font-size:12px;color:#8e8e93">{{DEPARTMENT}}</div>
        </div>
        <div style="background:#34c759;color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">已批准</div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;font-weight:600">加班时间</div>
      <div style="background:#f2f2f7;border-radius:8px;padding:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;color:#8e8e93">{{DATE}}</div>
          <div style="font-size:14px;color:#000;font-weight:500">{{START_TIME}} - {{END_TIME}}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:14px;color:#000;font-weight:600">时长</div>
          <div style="font-size:20px;color:#007aff;font-weight:700;font-variant-numeric:tabular-nums">{{HOURS}}</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;font-weight:600">加班事由</div>
      <div style="background:#f2f2f7;border-radius:8px;padding:12px">
        <div style="font-size:14px;color:#000;line-height:1.6">{{REASON}}</div>
      </div>
    </div>
    
    <div style="background:#f2f2f7;padding:12px;border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#8e8e93">审批人</div>
        <div style="font-size:14px;color:#000;font-weight:500">{{APPROVER}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;color:#8e8e93">{{APPROVE_TIME}}</div>
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:16px;height:16px;background:#34c759;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff">✓</div>
          <div style="font-size:13px;color:#34c759;font-weight:500">已批准</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
