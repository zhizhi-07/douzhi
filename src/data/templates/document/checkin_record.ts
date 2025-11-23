import { TheatreTemplate } from '../../theatreTemplates'

export const checkinRecordTemplate: TheatreTemplate = {
  id: 'checkin_record',
  category: '证件文书',
  name: '开房记录',
  keywords: ['开房', '酒店', '记录', '入住'],
  fields: [
    { key: 'HOTEL_NAME', label: '酒店', placeholder: '希尔顿酒店' },
    { key: 'ROOM_NO', label: '房号', placeholder: '8808' },
    { key: 'GUEST1_NAME', label: '房客1', placeholder: '张三' },
    { key: 'GUEST1_ID', label: '证件1', placeholder: '5101****1234' },
    { key: 'GUEST2_NAME', label: '房客2', placeholder: '李四' },
    { key: 'GUEST2_ID', label: '证件2', placeholder: '5101****5678' },
    { key: 'CHECKIN_TIME', label: '入住', placeholder: '2024-11-22 23:30' },
    { key: 'CHECKOUT_TIME', label: '退房', placeholder: '2024-11-23 12:00' },
    { key: 'STAY_HOURS', label: '时长', placeholder: '12.5小时' },
  ],
  htmlTemplate: `
<div data-checkin-record style="background: #fff; width: 100%; max-width: 300px; margin: 0 auto; font-family: 'SimSun', serif; border: 1px solid #000; padding: 2px;">
  <div style="border: 1px solid #000; padding: 15px;">
    <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
      <div style="font-size: 18px; font-weight: bold;">旅馆业治安管理信息系统</div>
      <div style="font-size: 12px; margin-top: 5px;">入住登记单</div>
    </div>
    
    <div style="font-size: 12px; line-height: 1.8;">
      <div style="border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px;">
        <span style="font-weight: bold;">酒店名称：</span> {{HOTEL_NAME}}
      </div>
      <div style="border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px;">
        <span style="font-weight: bold;">房间号码：</span> {{ROOM_NO}}
      </div>
      
      <div style="margin-top: 10px;">
        <span style="font-weight: bold;">入住人员信息：</span>
      </div>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px;">
        <tr style="background: #f0f0f0;">
          <th style="border: 1px solid #000; padding: 4px;">姓名</th>
          <th style="border: 1px solid #000; padding: 4px;">证件号码</th>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{GUEST1_NAME}}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{GUEST1_ID}}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{GUEST2_NAME}}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">{{GUEST2_ID}}</td>
        </tr>
      </table>
      
      <div style="border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px;">
        <span style="font-weight: bold;">入住时间：</span> {{CHECKIN_TIME}}
      </div>
      <div style="border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px;">
        <span style="font-weight: bold;">退房时间：</span> {{CHECKOUT_TIME}}
      </div>
      <div>
        <span style="font-weight: bold;">停留时长：</span> {{STAY_HOURS}}
      </div>
    </div>
    
    <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px;">
      <div>前台操作员：007</div>
      <div>打印时间：{{CHECKOUT_TIME}}</div>
    </div>
    
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); border: 3px solid red; color: red; padding: 5px 10px; font-size: 20px; font-weight: bold; opacity: 0.3; pointer-events: none;">
      内部资料 严禁外泄
    </div>
  </div>
</div>
  `.trim()
}
