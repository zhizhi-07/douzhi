import { TheatreTemplate } from '../../theatreTemplates'

export const alarmClockTemplate: TheatreTemplate = {
  id: 'alarm_clock',
  category: '工具应用',
  name: '闹钟',
  keywords: ['闹钟', '提醒', '时间'],
  fields: [
    { key: 'ALARM1_TIME', label: '时间1', placeholder: '07:30' },
    { key: 'ALARM1_LABEL', label: '标签1', placeholder: '起床' },
    { key: 'ALARM2_TIME', label: '时间2', placeholder: '08:00' },
    { key: 'ALARM2_LABEL', label: '标签2', placeholder: '出门' },
    { key: 'ALARM3_TIME', label: '时间3', placeholder: '23:00' },
    { key: 'ALARM3_LABEL', label: '标签3', placeholder: '睡觉' },
  ],
  htmlTemplate: `
<div data-alarm-clock style="background: #000; color: white; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333;">
  <div style="padding: 20px; text-align: center; border-bottom: 1px solid #222;">
    <div style="font-size: 16px; font-weight: bold;">Alarm</div>
  </div>
  
  <div style="padding: 10px;">
    <!-- Alarm 1 -->
    <div style="padding: 15px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 32px; font-weight: 300; font-family: 'Helvetica Neue', sans-serif;">{{ALARM1_TIME}}</div>
        <div style="font-size: 12px; color: #888;">{{ALARM1_LABEL}}</div>
      </div>
      <div style="width: 50px; height: 30px; background: #34c759; border-radius: 15px; position: relative; cursor: pointer;">
        <div style="width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    </div>
    
    <!-- Alarm 2 -->
    <div style="padding: 15px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 32px; font-weight: 300; font-family: 'Helvetica Neue', sans-serif;">{{ALARM2_TIME}}</div>
        <div style="font-size: 12px; color: #888;">{{ALARM2_LABEL}}</div>
      </div>
      <div style="width: 50px; height: 30px; background: #34c759; border-radius: 15px; position: relative; cursor: pointer;">
        <div style="width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    </div>
    
    <!-- Alarm 3 (Inactive) -->
    <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center; opacity: 0.6;">
      <div>
        <div style="font-size: 32px; font-weight: 300; font-family: 'Helvetica Neue', sans-serif;">{{ALARM3_TIME}}</div>
        <div style="font-size: 12px; color: #888;">{{ALARM3_LABEL}}</div>
      </div>
      <div style="width: 50px; height: 30px; background: #333; border-radius: 15px; position: relative; cursor: pointer;">
        <div style="width: 26px; height: 26px; background: #888; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    </div>
  </div>
  
  <div style="padding: 15px; text-align: center; font-size: 12px; color: #666;">
    Next alarm in 8 hours 30 minutes
  </div>
</div>
  `.trim()
}
