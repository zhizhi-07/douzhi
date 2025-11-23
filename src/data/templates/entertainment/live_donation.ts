import { TheatreTemplate } from '../../theatreTemplates'

export const liveDonationTemplate: TheatreTemplate = {
    id: 'live_donation',
    category: '娱乐休闲',
    name: '直播打赏',
    keywords: ['直播', '打赏', '礼物', '榜一'],
    fields: [
      { key: 'STREAMER', label: '主播', placeholder: '全村的希望' },
      { key: 'AUDIENCE_COUNT', label: '人气值', placeholder: '10.5w' },
      { key: 'GIFT_NAME', label: '礼物名', placeholder: '超级火箭' },
      { key: 'USER_NAME', label: '送礼人', placeholder: '榜一大哥' },
      { key: 'COMBO', label: '连击数', placeholder: '666' },
      { key: 'MESSAGE', label: '弹幕留言', placeholder: '主播太强了！支持！' },
      { key: 'STREAMER_REACTION', label: '主播反应', placeholder: '感谢大哥送的火箭！老板大气！爱你么么哒！' },
      { key: 'VIP_LIST', label: '贵宾名单', placeholder: '1. 榜一大哥<br>2. 守护甜心<br>3. 隔壁老王' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: rgba(0,0,0,0.8); border-radius: 12px; overflow: hidden; font-family: -apple-system, sans-serif; position: relative; height: 250px; color: white;">
  <!-- 模拟直播画面背景 -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg=='); opacity: 0.3;"></div>
  
  <!-- 头部信息 -->
  <div style="position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; z-index: 5;">
    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); padding: 2px 8px 2px 2px; border-radius: 15px; cursor: pointer;" data-action="streamer-click">
      <div style="width: 24px; height: 24px; background: #ff7675; border-radius: 50%; margin-right: 5px;"></div>
      <div style="font-size: 12px; font-weight: bold;">{{STREAMER}}</div>
    </div>
    <div style="font-size: 10px; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; cursor: pointer;" data-action="show-rank">
      🔥 {{AUDIENCE_COUNT}}
    </div>
  </div>

  <!-- 主播反馈气泡 (初始隐藏) -->
  <div class="reaction-bubble" style="position: absolute; top: 45px; left: 15px; background: white; color: #333; padding: 8px 12px; border-radius: 12px; border-top-left-radius: 0; font-size: 12px; font-weight: bold; transform: scale(0); transition: transform 0.2s; transform-origin: top left; z-index: 6; max-width: 80%;">
    {{STREAMER_REACTION}}
  </div>

  <!-- 弹幕区域 -->
  <div style="position: absolute; top: 60px; left: 10px; right: 10px; bottom: 80px; overflow: hidden; font-size: 12px; text-shadow: 1px 1px 2px black; pointer-events: none;">
    <div style="opacity: 0.7; margin-bottom: 4px;"><span style="color: #fab1a0;">路人甲:</span> 666666</div>
    <div style="opacity: 0.7; margin-bottom: 4px;"><span style="color: #74b9ff;">小粉丝:</span> 前排围观</div>
    <div style="font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px; animation: slideIn 0.3s; display: inline-block;">
      <span style="color: #ffd700;">{{USER_NAME}}:</span> {{MESSAGE}}
    </div>
  </div>

  <!-- 礼物横幅特效 -->
  <div style="position: absolute; bottom: 20px; left: 0; right: 0; background: linear-gradient(90deg, transparent, rgba(231, 76, 60, 0.8), transparent); padding: 10px 0; text-align: center; transform: scale(0); animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
    <div style="font-size: 14px; font-weight: bold;">
      <span style="color: #ffd700;">{{USER_NAME}}</span> 送出
    </div>
    <div style="font-size: 24px; font-weight: 900; color: #fff; text-shadow: 0 0 10px #e74c3c; margin: 5px 0;">
      🚀 {{GIFT_NAME}}
    </div>
    <div style="font-size: 32px; font-style: italic; font-weight: 900; color: #f1c40f; text-shadow: 2px 2px 0 #e67e22;">
      x {{COMBO}}
    </div>
  </div>
  
  <!-- 互动按钮 -->
  <div data-gift-btn style="position: absolute; bottom: 10px; right: 10px; background: #e74c3c; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.5); z-index: 10;">
    🎁
  </div>
  
  <!-- 隐藏贵宾榜 -->
  <div hidden data-vip-list>{{VIP_LIST}}</div>

  <style>
    @keyframes popUp { to { transform: scale(1); } }
    @keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  </style>
</div>
    `.trim()
  }
