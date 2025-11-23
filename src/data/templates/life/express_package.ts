import { TheatreTemplate } from '../../theatreTemplates'

export const expressPackageTemplate: TheatreTemplate = {
    id: 'express_package',
    category: '生活消费',
    name: '快递单',
    keywords: ['快递单', '快递', '包裹', '物流单', '查快递'],
    fields: [
      { key: 'STATUS', label: '当前状态', placeholder: '已签收' },
      { key: 'STATUS_DESC', label: '状态描述', placeholder: '您的快递已签收，签收人：凭取货码签收' },
      { key: 'COMPANY', label: '快递公司', placeholder: '顺丰速运' },
      { key: 'EXPRESS_NO', label: '快递单号', placeholder: 'SF1357924680' },
      { key: 'PICKUP_CODE', label: '取件码', placeholder: '8-2056' },
      { key: 'LOCATION', label: '当前位置', placeholder: '北京市朝阳区三里屯营业点' },
      { key: 'DATE', label: '更新时间', placeholder: '今天 14:23' },
      { key: 'GOODS', label: '物品名称', placeholder: '电子产品' },
      { key: 'FROM_AREA', label: '发货地', placeholder: '广东深圳' },
      { key: 'TO_AREA', label: '收货地', placeholder: '北京朝阳' },
    ],
    htmlTemplate: `
<div data-express-card style="max-width: 375px; margin: 0 auto; background: #F2F4F7; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
  
  <!-- 顶部状态区 -->
  <div style="background: linear-gradient(135deg, #2B303B 0%, #424855 100%); padding: 24px 20px 50px; color: white; position: relative;">
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div>
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 6px;">{{STATUS}}</div>
        <div style="font-size: 13px; opacity: 0.8;">{{STATUS_DESC}}</div>
      </div>
      <div style="background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; backdrop-filter: blur(5px);">
        <div style="font-size: 12px; font-weight: 600;">{{COMPANY}}</div>
      </div>
    </div>
    
    <!-- 装饰圆弧 -->
    <div style="position: absolute; bottom: -20px; left: 0; right: 0; height: 40px; background: #F2F4F7; border-radius: 20px 20px 0 0;"></div>
  </div>

  <!-- 核心卡片 -->
  <div style="padding: 0 16px; position: relative; top: -20px;">
    <!-- 物流轨迹卡片 -->
    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 12px;">
      
      <!-- 路线图 -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <div style="text-align: center; width: 80px;">
          <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 4px;">{{FROM_AREA}}</div>
          <div style="font-size: 11px; color: #999; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; display: inline-block;">发货地</div>
        </div>
        
        <div style="flex: 1; height: 1px; background: #e0e0e0; margin: 0 10px; position: relative;">
          <!-- 箭头 -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #EBF2FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2B303B;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
        
        <div style="text-align: center; width: 80px;">
          <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 4px;">{{TO_AREA}}</div>
          <div style="font-size: 11px; color: #999; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; display: inline-block;">收货地</div>
        </div>
      </div>

      <!-- 最新动态 -->
      <div style="display: flex; gap: 12px; padding-top: 16px; border-top: 1px dashed #eee;">
        <div style="width: 10px; display: flex; flex-direction: column; align-items: center; padding-top: 4px;">
          <div style="width: 10px; height: 10px; background: #2B303B; border-radius: 50%; box-shadow: 0 0 0 4px rgba(43, 48, 59, 0.1);"></div>
          <div style="width: 1px; flex: 1; background: #e0e0e0; margin-top: 4px;"></div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: #333; line-height: 1.5; margin-bottom: 4px;">{{LOCATION}}</div>
          <div style="font-size: 12px; color: #999;">{{DATE}}</div>
        </div>
      </div>
    </div>

    <!-- 取件码卡片 (如果有) -->
    <div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 2px;">取件码</div>
        <div style="font-size: 24px; font-weight: 700; color: #2B303B; letter-spacing: 1px;">{{PICKUP_CODE}}</div>
      </div>
      <div style="text-align: center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z"/></svg>
        <div style="font-size: 10px; color: #999; margin-top: 2px;">扫码取件</div>
      </div>
    </div>

    <!-- 详情信息 -->
    <div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;">
        <span style="color: #999;">运单号码</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: #333; font-weight: 500;">{{EXPRESS_NO}}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px;">
        <span style="color: #999;">物品信息</span>
        <span style="color: #333; font-weight: 500;">{{GOODS}}</span>
      </div>
    </div>
  </div>

  <!-- 底部按钮 -->
  <div style="padding: 0 16px 20px; display: flex; gap: 12px;">
    <div style="flex: 1; background: white; color: #333; border: 1px solid #e0e0e0; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 600;">物流详情</div>
    <div style="flex: 1; background: white; color: #333; border: 1px solid #e0e0e0; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 600;">联系派送员</div>
  </div>

</div>
    `.trim()
  }
