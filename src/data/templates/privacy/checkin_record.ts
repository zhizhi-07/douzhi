import { TheatreTemplate } from '../../theatreTemplates'

export const checkinRecordTemplate: TheatreTemplate = {
    id: 'checkin_record',
    category: '隐私安全',
    name: '开房记录',
    keywords: ['开房', '入住', '酒店', '记录'],
    fields: [
      { key: 'HOTEL_NAME', label: '酒店名称', placeholder: '希尔顿大酒店' },
      { key: 'ROOM_NO', label: '房间号', placeholder: '8302' },
      { key: 'CHECKIN_TIME', label: '入住时间', placeholder: '2024-11-21 23:15:09' },
      { key: 'CHECKOUT_TIME', label: '退房时间', placeholder: '2024-11-22 11:30:00' },
      { key: 'GUEST1_NAME', label: '入住人1', placeholder: '王**' },
      { key: 'GUEST1_ID', label: '证件号1', placeholder: '1101011990********' },
      { key: 'GUEST2_NAME', label: '入住人2（可选）', placeholder: '李**' },
      { key: 'GUEST2_ID', label: '证件号2（可选）', placeholder: '1101011995********' },
      { key: 'STAY_HOURS', label: '时长', placeholder: '12小时' }
    ],
    htmlTemplate: `
<div data-checkin-record style="max-width: 350px; margin: 0 auto; background: #f0f2f5; font-family: 'Consolas', 'Monaco', monospace; border: 1px solid #dcdcdc; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
  <!-- 顶部状态栏 -->
  <div style="background: #2d3436; color: #00b894; padding: 8px 12px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
    <div>SYSTEM_LOG_V3.0</div>
    <div style="width: 8px; height: 8px; background: #00b894; border-radius: 50%; box-shadow: 0 0 5px #00b894;"></div>
  </div>
  
  <!-- 酒店信息 -->
  <div style="padding: 15px; background: #fff; border-bottom: 1px dashed #ccc;">
    <div style="font-weight: bold; font-size: 16px; color: #2d3436; margin-bottom: 5px;">{{HOTEL_NAME}}</div>
    <div style="font-size: 12px; color: #636e72;">Room: {{ROOM_NO}}</div>
  </div>
  
  <!-- 敏感信息区域 -->
  <div style="padding: 15px; position: relative;">
    <!-- 水印 -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 40px; color: rgba(0,0,0,0.03); pointer-events: none; white-space: nowrap;">CONFIDENTIAL</div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 12px; color: #b2bec3; margin-bottom: 4px;">GUEST INFO</div>
      
      <div style="background: #fff; border: 1px solid #e0e0e0; padding: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; position: relative;">
          <span style="color: #2d3436;">{{GUEST1_NAME}}</span>
          <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px); opacity: 0.8; cursor: pointer; transition: opacity 0.3s;" data-mosaic></div>
        </div>
        <div style="font-size: 12px; color: #636e72; position: relative;">
          ID: {{GUEST1_ID}}
          <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px); opacity: 0.8; cursor: pointer; transition: opacity 0.3s;" data-mosaic></div>
        </div>
      </div>
      
      <div style="background: #fff; border: 1px solid #e0e0e0; padding: 10px; margin-top: 5px; display: {{GUEST2_NAME}} ? 'block' : 'none';">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; position: relative;">
          <span style="color: #2d3436;">{{GUEST2_NAME}}</span>
          <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px); opacity: 0.8; cursor: pointer; transition: opacity 0.3s;" data-mosaic></div>
        </div>
        <div style="font-size: 12px; color: #636e72; position: relative;">
          ID: {{GUEST2_ID}}
          <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px); opacity: 0.8; cursor: pointer; transition: opacity 0.3s;" data-mosaic></div>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div>
        <div style="font-size: 12px; color: #b2bec3;">CHECK-IN</div>
        <div style="font-size: 13px; color: #2d3436;">{{CHECKIN_TIME}}</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #b2bec3;">CHECK-OUT</div>
        <div style="font-size: 13px; color: #2d3436;">{{CHECKOUT_TIME}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部 -->
  <div style="background: #fff; border-top: 1px solid #eee; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 12px; color: #636e72;">Duration: {{STAY_HOURS}}</div>
    <div style="font-size: 10px; color: #b2bec3;">PSB_SYNC_OK</div>
  </div>
  
  <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #999; opacity: 0.6;">
    Click mosaic area to reveal
  </div>
</div>
    `.trim()
}
