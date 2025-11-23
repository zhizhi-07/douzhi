import { TheatreTemplate } from '../../theatreTemplates'

export const refundRequestTemplate: TheatreTemplate = {
  id: 'refund_request',
  category: '生活消费',
  name: '退款申请',
  keywords: ['退款', '售后', '退货'],
  fields: [
    { key: 'PRODUCT_NAME', label: '商品名称', placeholder: 'iPhone 15 Pro Max' },
    { key: 'REFUND_AMOUNT', label: '退款金额', placeholder: '9999.00' },
    { key: 'REFUND_REASON', label: '退款原因', placeholder: '7天无理由退货' },
    { key: 'STATUS', label: '当前状态', placeholder: '退款成功' },
    { key: 'APPLY_TIME', label: '申请时间', placeholder: '2024-11-20 14:00' },
    { key: 'PROCESS_TIME', label: '到账时间', placeholder: '2024-11-22 09:30' },
    { key: 'ORDER_NO', label: '订单号', placeholder: 'REF20241120001' },
  ],
  htmlTemplate: `
<div data-refund-request style="background: #fff; padding: 20px; border-radius: 12px; width: 100%; max-width: 320px; margin: 0 auto; font-family: sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
  <div style="border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 15px;">
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">{{STATUS}}</div>
    <div style="font-size: 12px; color: #999;">{{PROCESS_TIME}}</div>
  </div>
  
  <div style="margin-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">+{{REFUND_AMOUNT}}</div>
    <div style="font-size: 12px; color: #666;">退回到原支付账户</div>
  </div>
  
  <div style="position: relative; padding-left: 20px; margin-bottom: 20px;">
    <!-- Timeline Line -->
    <div style="position: absolute; top: 5px; left: 6px; width: 2px; height: calc(100% - 10px); background: #e0e0e0;"></div>
    
    <!-- Step 1 -->
    <div style="position: relative; margin-bottom: 20px;">
      <div style="position: absolute; left: -20px; top: 5px; width: 10px; height: 10px; background: #52c41a; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #52c41a;"></div>
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">商家已同意退款</div>
      <div style="font-size: 12px; color: #999;">系统自动处理</div>
    </div>
    
    <!-- Step 2 -->
    <div style="position: relative; margin-bottom: 20px;">
      <div style="position: absolute; left: -20px; top: 5px; width: 10px; height: 10px; background: #52c41a; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #52c41a;"></div>
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">银行受理退款</div>
      <div style="font-size: 12px; color: #999;">预计1-3个工作日到账</div>
    </div>
    
    <!-- Step 3 -->
    <div style="position: relative;">
      <div style="position: absolute; left: -20px; top: 5px; width: 10px; height: 10px; background: #52c41a; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #52c41a;"></div>
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">退款成功</div>
      <div style="font-size: 12px; color: #999;">{{PROCESS_TIME}}</div>
    </div>
  </div>
  
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 12px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #666;">退款商品</span>
      <span style="color: #333; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{PRODUCT_NAME}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #666;">退款原因</span>
      <span style="color: #333;">{{REFUND_REASON}}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #666;">订单编号</span>
      <span style="color: #333;">{{ORDER_NO}}</span>
    </div>
  </div>
</div>
  `.trim()
}
