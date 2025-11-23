import { TheatreTemplate } from '../../theatreTemplates'

export const coupleHotelTemplate: TheatreTemplate = {
    id: 'couple_hotel',
    category: '生活消费',
    name: '情侣酒店',
    keywords: ['情侣酒店', '开房', '酒店', '大床房'],
    fields: [
      { key: 'HOTEL_NAME', label: '酒店名称', placeholder: '520 Love Hotel' },
      { key: 'ROOM_TYPE', label: '房型', placeholder: '梦幻水床主题房' },
      { key: 'CHECK_IN', label: '入住时间', placeholder: '2025-05-20 20:00' },
      { key: 'CHECK_OUT', label: '退房时间', placeholder: '2025-05-21 12:00' },
      { key: 'FEATURES', label: '房间特色', placeholder: '圆形水床、按摩浴缸、星空顶、落地窗' },
      { key: 'PRICE', label: '价格', placeholder: '520' },
      { key: 'GUEST_NAME', label: '入住人', placeholder: '李雷 & 韩梅梅' },
      { key: 'MESSAGE', label: '特别备注', placeholder: '准备玫瑰花瓣和红酒' }
    ],
    htmlTemplate: `
<div data-couple-hotel style="max-width: 350px; margin: 0 auto; background: linear-gradient(135deg, #2c0b1e 0%, #1a0510 100%); color: #ffd1dc; border-radius: 20px; overflow: hidden; font-family: 'Didot', serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
  <!-- 顶部图片区域 (模拟) -->
  <div style="height: 160px; background: linear-gradient(45deg, #ff6b6b, #ff8e8e); position: relative; overflow: hidden;">
    <div style="position: absolute; inset: 0; background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwIDMwLjZMMTAgMjBhNiA2IDAgMCAxIDgtOGwMiAyIDIgLTIgYTYgNiAwIDAgMSA4IDhsLTEwIDEwLjZ6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMikiLz48L3N2Zz4='); opacity: 0.3;"></div>
    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(44,11,30,1), transparent);">
      <div style="font-size: 24px; font-weight: bold; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{{HOTEL_NAME}}</div>
      <div style="font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 4px;">✨ {{ROOM_TYPE}}</div>
    </div>
  </div>

  <!-- 详情卡片 -->
  <div style="padding: 25px;">
    <!-- 时间信息 -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 25px; text-align: center;">
      <div>
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">CHECK-IN</div>
        <div style="font-size: 16px; font-weight: bold; color: #fff;">{{CHECK_IN}}</div>
      </div>
      <div style="display: flex; align-items: center; color: #ff6b6b;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
      <div>
        <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">CHECK-OUT</div>
        <div style="font-size: 16px; font-weight: bold; color: #fff;">{{CHECK_OUT}}</div>
      </div>
    </div>

    <!-- 特色标签 -->
    <div style="margin-bottom: 25px;">
      <div style="font-size: 12px; opacity: 0.6; margin-bottom: 10px;">ROOM FEATURES</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <!-- JS将解析FEATURES并生成标签 -->
        <div data-features="{{FEATURES}}" style="display: none;"></div>
        <!-- 预留容器 -->
        <div data-feature-tags style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
      </div>
    </div>

    <!-- 入住人和备注 -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="opacity: 0.6;">Guests</span>
        <span style="color: #fff;">{{GUEST_NAME}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="opacity: 0.6;">Note</span>
        <span style="color: #ff9ff3; font-style: italic;">{{MESSAGE}}</span>
      </div>
    </div>

    <!-- 底部总价和按钮 -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <div>
        <div style="font-size: 12px; opacity: 0.6;">Total Amount</div>
        <div style="font-size: 28px; font-weight: bold; color: #fff;">¥{{PRICE}}</div>
      </div>
      <div data-unlock-btn style="width: 50px; height: 50px; border-radius: 50%; background: #ff6b6b; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 15px rgba(255,107,107,0.4); transition: all 0.3s;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
    </div>
  </div>
  
  <!-- 隐藏的"私密模式"遮罩 -->
  <div data-privacy-mask style="position: absolute; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.5s;">
    <div style="font-size: 40px; margin-bottom: 20px;">🔒</div>
    <div style="font-size: 18px; color: #fff; letter-spacing: 2px;">PRIVATE MODE</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 10px;">Tap to Unlock</div>
  </div>
</div>
    `.trim()
}
