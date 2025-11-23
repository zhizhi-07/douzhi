import { TheatreTemplate } from '../../theatreTemplates'

export const smsScreenshotTemplate: TheatreTemplate = {
    id: 'sms_screenshot',
    category: '社交通讯',
    name: '短信截图',
    keywords: ['短信', '验证码', '短信截图', '消息通知'],
    fields: [
      { key: 'SENDER', label: '发送方', placeholder: '10086' },
      { key: 'SENDER_INFO', label: '发送方详情', placeholder: '中国移动客户服务热线' },
      { key: 'TIME', label: '时间', placeholder: '下午 2:30' },
      { key: 'CONTENT', label: '短信内容', placeholder: '【中国移动】尊敬的客户，您本月流量已使用80%，回复CXLL查询详情。' },
      { key: 'CONTEXT', label: '背景故事', placeholder: '这是在月末最后一天收到的提醒短信，当时正在外面没有WiFi。' },
    ],
    htmlTemplate: `
<div style="width: 100%; max-width: 375px; margin: 0 auto; background: #fff; border-radius: 30px; overflow: hidden; border: 8px solid #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.2); aspect-ratio: 9/19.5;">
  <!-- 状态栏 -->
  <div style="height: 44px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); display: flex; justify-content: space-between; align-items: center; padding: 0 20px; font-size: 15px; font-weight: 600; z-index: 10; position: relative;">
    <div>9:41</div>
    <div style="display: flex; gap: 6px;">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M1 8C1 8 3.5 4 9 4C14.5 4 17 8 17 8" stroke="black" stroke-width="2" stroke-linecap="round"/><path d="M1 8.5C1 8.5 3.5 12.5 9 12.5C14.5 12.5 17 8.5 17 8.5" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M13 4V2C13 1.44772 12.5523 1 12 1H2C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H12C12.5523 11 13 10.5523 13 10V8" stroke="black" stroke-width="2"/><rect x="14" y="4" width="2" height="4" fill="black"/></svg>
    </div>
  </div>

  <!-- 导航栏 -->
  <div onclick="this.parentElement.querySelector('.details-modal').style.display = 'flex'" style="padding: 10px 16px; background: rgba(245,245,245,0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.05); height: 44px;">
    <div style="color: #007aff; font-size: 17px; display: flex; align-items: center;">
      <span style="font-size: 24px; margin-right: 4px; margin-top: -2px;">‹</span> 列表
    </div>
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="font-size: 12px; color: #8e8e93; margin-bottom: 2px;">{{SENDER}} ></div>
    </div>
    <div style="width: 40px;"></div> <!-- 占位 -->
  </div>

  <!-- 消息列表区域 -->
  <div style="padding: 20px 16px; background: #fff; height: calc(100% - 180px); overflow-y: auto;">
    
    <!-- 时间戳 -->
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 11px; color: #8e8e93; font-weight: 500;">{{TIME}}</span>
    </div>

    <!-- 接收到的短信 -->
    <div onclick="this.parentElement.parentElement.querySelector('.details-modal').style.display = 'flex'" style="display: flex; margin-bottom: 20px; cursor: pointer;">
      <div style="width: 30px; height: 30px; border-radius: 50%; background: #e5e5ea; color: #8e8e93; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-right: 8px; flex-shrink: 0;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      </div>
      <div style="background: #e9e9eb; padding: 10px 14px; border-radius: 18px; border-top-left-radius: 4px; max-width: 75%; position: relative;">
        <div style="font-size: 16px; line-height: 1.4; color: #000;">{{CONTENT}}</div>
      </div>
    </div>

    <!-- 模拟回复输入框 -->
    <div style="position: absolute; bottom: 20px; left: 0; width: 100%; padding: 0 16px; box-sizing: border-box;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 28px; height: 28px; background: #e9e9eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93;">
          <span style="font-size: 18px; font-weight: 300; margin-top: -2px;">+</span>
        </div>
        <div style="flex: 1; height: 36px; border-radius: 18px; border: 1px solid #c6c6c8; padding: 0 14px; display: flex; align-items: center; font-size: 16px; color: #000;">
          短信/彩信
        </div>
        <div style="width: 28px; height: 28px; background: #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
        </div>
      </div>
    </div>

  </div>

  <!-- 详情模态框 (默认隐藏) -->
  <div class="details-modal" onclick="this.style.display = 'none'" style="display: none; position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 100; align-items: center; justify-content: center; padding: 20px;">
    <div onclick="event.stopPropagation()" style="background: rgba(255,255,255,0.95); width: 90%; border-radius: 20px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); transform: translateY(0); animation: slideUp 0.3s ease-out;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 60px; background: #e5e5ea; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px; color: #8e8e93;">👤</span>
        </div>
        <div style="font-size: 20px; font-weight: 700; color: #000; margin-bottom: 4px;">{{SENDER}}</div>
        <div style="font-size: 13px; color: #8e8e93;">{{SENDER_INFO}}</div>
      </div>
      
      <div style="background: #f2f2f7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #8e8e93; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Message Context</div>
        <div style="font-size: 15px; line-height: 1.5; color: #333;">
          {{CONTEXT}}
        </div>
      </div>

      <div onclick="this.closest('.details-modal').style.display = 'none'" style="height: 44px; background: #007aff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; cursor: pointer;">
        关闭
      </div>
    </div>
  </div>
  
  <style>
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</div>
    `.trim()
  }
