import { TheatreTemplate } from '../../theatreTemplates'

export const callLogTemplate: TheatreTemplate = {
    id: 'call_log',
    category: '社交通讯',
    name: '通话记录',
    keywords: ['通话记录', '通话', '电话记录', '通话详单'],
    fields: [
      { key: 'NAME', label: '联系人', placeholder: '张三' },
      { key: 'NUMBER', label: '电话号码', placeholder: '138****1234' },
      { key: 'CALL1_TYPE', label: '通话1类型', placeholder: '呼出' },
      { key: 'CALL1_TIME', label: '通话1时间', placeholder: '14:30' },
      { key: 'CALL1_DURATION', label: '通话1时长', placeholder: '5分32秒' },
      { key: 'CALL1_CONTENT', label: '通话1内容', placeholder: '讨论明天的会议安排' },
      { key: 'CALL2_TYPE', label: '通话2类型', placeholder: '呼入' },
      { key: 'CALL2_TIME', label: '通话2时间', placeholder: '11:20' },
      { key: 'CALL2_DURATION', label: '通话2时长', placeholder: '2分15秒' },
      { key: 'CALL2_CONTENT', label: '通话2内容', placeholder: '确认文件是否收到' },
      { key: 'CALL3_TYPE', label: '通话3类型', placeholder: '呼出' },
      { key: 'CALL3_TIME', label: '通话3时间', placeholder: '昨天' },
      { key: 'CALL3_DURATION', label: '通话3时长', placeholder: '15分48秒' },
      { key: 'CALL3_CONTENT', label: '通话3内容', placeholder: '详细沟通项目进度' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部联系人卡片 -->
  <div style="background: #00b894; color: white; padding: 20px;">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">{{NAME_INITIAL}}</div>
      <div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">{{NAME}}</div>
        <div style="font-size: 13px; opacity: 0.9;">{{NUMBER}}</div>
      </div>
    </div>
  </div>
  
  <!-- 通话记录列表 -->
  <div style="padding: 16px;">
    <div style="font-size: 13px; color: #999; margin-bottom: 12px; font-weight: 600;">通话记录</div>
    
    <!-- 记录1 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #00b894;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL1_TYPE}}</div>
          <div style="font-size: 12px; color: #00b894;">{{CALL1_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL1_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL1_CONTENT}}</div>
    </div>
    
    <!-- 记录2 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #0984e3;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL2_TYPE}}</div>
          <div style="font-size: 12px; color: #0984e3;">{{CALL2_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL2_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL2_CONTENT}}</div>
    </div>
    
    <!-- 记录3 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #636e72;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL3_TYPE}}</div>
          <div style="font-size: 12px; color: #636e72;">{{CALL3_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL3_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL3_CONTENT}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
