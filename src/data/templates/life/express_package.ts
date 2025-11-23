import { TheatreTemplate } from '../../theatreTemplates'

export const expressPackageTemplate: TheatreTemplate = {
    id: 'express_package',
    category: '生活消费',
    name: '快递单',
    keywords: ['快递单', '快递', '包裹', '物流单'],
    fields: [
      { key: 'COMPANY', label: '快递公司', placeholder: '顺丰速运' },
      { key: 'EXPRESS_NO', label: '快递单号', placeholder: 'SF1357924680' },
      { key: 'STATUS', label: '当前状态', placeholder: '派送中' },
      { key: 'LOCATION', label: '当前位置', placeholder: '北京市朝阳区三里屯营业点' },
      { key: 'DATE', label: '更新时间', placeholder: '今天 09:41' },
      { key: 'FROM_NAME', label: '寄件人', placeholder: '张三' },
      { key: 'FROM_AREA', label: '寄件地区', placeholder: '广东 深圳' },
      { key: 'TO_NAME', label: '收件人', placeholder: '李四' },
      { key: 'TO_AREA', label: '收件地区', placeholder: '北京 朝阳' },
      { key: 'GOODS', label: '物品名称', placeholder: '电子产品' },
      { key: 'WEIGHT', label: '重量', placeholder: '0.5kg' },
    ],
    htmlTemplate: `
<div data-express-card style="max-width: 360px; margin: 0 auto; background: #f4f6f8; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
  <!-- Header Area with Map Background Simulation -->
  <div style="background: white; padding: 20px; position: relative; z-index: 1;">
    <!-- Status Tag -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
       <div style="display: flex; align-items: center; gap: 8px;">
         <div style="width: 32px; height: 32px; background: #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-style: italic;">SF</div>
         <div>
           <div style="font-weight: 700; font-size: 16px; color: #1a1a1a;">{{COMPANY}}</div>
           <div style="font-size: 12px; color: #999;">官方服务</div>
         </div>
       </div>
       <div style="background: #e6f7ff; color: #1890ff; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600;">{{STATUS}}</div>
    </div>

    <!-- Route Visualization -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding: 0 8px;">
      <div style="text-align: center;">
        <div style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">{{FROM_AREA}}</div>
        <div style="font-size: 12px; color: #999;">{{FROM_NAME}}</div>
      </div>
      
      <div style="flex: 1; margin: 0 20px; position: relative; height: 40px; display: flex; align-items: center; justify-content: center;">
        <!-- Progress Line -->
        <div style="width: 100%; height: 2px; background: #f0f0f0; position: absolute;"></div>
        <div style="width: 70%; height: 2px; background: #1890ff; position: absolute; left: 0;"></div>
        <!-- Truck Icon -->
        <div style="width: 32px; height: 32px; background: #1890ff; border-radius: 50%; position: absolute; left: 70%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(24, 144, 255, 0.3);">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        </div>
      </div>

      <div style="text-align: center;">
        <div style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">{{TO_AREA}}</div>
        <div style="font-size: 12px; color: #999;">{{TO_NAME}}</div>
      </div>
    </div>
  </div>

  <!-- Tracking Info Card -->
  <div style="background: white; margin-top: 1px; padding: 20px;">
     <!-- Latest Status -->
     <div style="display: flex; gap: 16px; margin-bottom: 24px;">
       <div style="display: flex; flex-direction: column; align-items: center;">
         <div style="width: 10px; height: 10px; background: #1890ff; border-radius: 50%; margin-top: 6px; position: relative;">
           <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(24, 144, 255, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
         </div>
         <div style="width: 2px; flex: 1; background: #f0f0f0; margin-top: 4px; min-height: 20px;"></div>
       </div>
       <div>
         <div style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; line-height: 1.5;">{{LOCATION}}</div>
         <div style="font-size: 12px; color: #999;">{{DATE}} · {{STATUS}}</div>
       </div>
     </div>

     <!-- Meta Info Grid -->
     <div style="background: #f9fafb; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
       <div>
         <div style="font-size: 11px; color: #999; margin-bottom: 4px;">运单号</div>
         <div style="display: flex; align-items: center; gap: 6px;">
           <div style="font-family: 'DIN Alternate', monospace; font-weight: 600; font-size: 15px; color: #333;">{{EXPRESS_NO}}</div>
           <div data-copy-btn="{{EXPRESS_NO}}" style="width: 16px; height: 16px; background: #e6f7ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1890ff;">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
           </div>
         </div>
       </div>
       <div>
         <div style="font-size: 11px; color: #999; margin-bottom: 4px;">物品详情</div>
         <div style="font-size: 13px; font-weight: 600; color: #333;">{{GOODS}} <span style="color: #ccc; margin: 0 4px;">|</span> {{WEIGHT}}</div>
       </div>
     </div>
  </div>

  <!-- Action Buttons -->
  <div style="display: flex; background: white; border-top: 1px solid #f0f0f0;">
    <div style="flex: 1; padding: 14px; text-align: center; font-size: 13px; font-weight: 600; color: #666; cursor: pointer; border-right: 1px solid #f0f0f0;">联系快递员</div>
    <div style="flex: 1; padding: 14px; text-align: center; font-size: 13px; font-weight: 600; color: #1890ff; cursor: pointer;">查看物流详情</div>
  </div>

  <style>
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(24, 144, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
    }
  </style>
</div>
    `.trim()
  }
