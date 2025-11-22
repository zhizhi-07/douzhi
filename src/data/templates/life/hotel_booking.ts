import { TheatreTemplate } from '../../theatreTemplates'

export const hotelBookingTemplate: TheatreTemplate = {
    id: 'hotel_booking',
    category: '生活消费',
    name: '酒店订单',
    keywords: ['酒店订单', '酒店预订', '开房记录', '订房'],
    fields: [
      { key: 'HOTEL_NAME', label: '酒店名称', placeholder: '希尔顿酒店' },
      { key: 'ROOM_TYPE', label: '房型', placeholder: '豪华大床房' },
      { key: 'CHECK_IN', label: '入住日期', placeholder: '11月21日' },
      { key: 'CHECK_OUT', label: '离店日期', placeholder: '11月22日' },
      { key: 'NIGHTS', label: '住宿晚数', placeholder: '1' },
      { key: 'GUEST_NAME', label: '入住人', placeholder: '张三' },
      { key: 'GUEST_PHONE', label: '手机号', placeholder: '138****1234' },
      { key: 'TOTAL_PRICE', label: '总价', placeholder: '599' },
      { key: 'ORDER_NO', label: '订单号', placeholder: 'HT20251121001' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#007aff;padding:20px 16px;text-align:center">
    <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:8px;font-weight:500;letter-spacing:0.5px">预订成功</div>
    <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:8px">{{HOTEL_NAME}}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.9)">{{ROOM_TYPE}}</div>
  </div>
  
  <div style="padding:16px">
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:10px;font-weight:600">入住信息</div>
      <div style="background:#f2f2f7;padding:12px;border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:14px;color:#000">入住日期</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{CHECK_IN}}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:14px;color:#000">离店日期</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="font-size:14px;font-weight:500;color:#000">{{CHECK_OUT}}</div>
            <div style="background:#ff3b30;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:500">{{NIGHTS}}晚</div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="background:#f2f2f7;padding:12px;border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;color:#8e8e93">入住人</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{GUEST_NAME}}</div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <div style="font-size:13px;color:#8e8e93">手机号</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{GUEST_PHONE}}</div>
        </div>
      </div>
    </div>
    
    <div style="background:#f2f2f7;padding:14px;border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;color:#8e8e93">订单总价</div>
        <div style="font-size:24px;font-weight:700;color:#ff3b30;font-variant-numeric:tabular-nums">¥{{TOTAL_PRICE}}</div>
      </div>
      <div style="font-size:11px;color:#8e8e93;text-align:right">订单号：{{ORDER_NO}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
