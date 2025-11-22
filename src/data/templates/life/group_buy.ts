import { TheatreTemplate } from '../../theatreTemplates'

export const groupBuyTemplate: TheatreTemplate = {
  id: 'group_buy',
  category: '生活消费',
  name: '拼团',
  keywords: ['拼团', '拼多多', '一起拼', '砍价', '团购'],
  fields: [
    { key: 'PRODUCT_NAME', label: '商品名称', placeholder: 'Apple iPhone 15 Pro Max 256GB 原色钛金属' },
    { key: 'ORIGINAL_PRICE', label: '原价', placeholder: '9999' },
    { key: 'GROUP_PRICE', label: '拼团价', placeholder: '7999' },
    { key: 'PEOPLE_NEEDED', label: '成团人数', placeholder: '3' },
    { key: 'PEOPLE_JOINED', label: '已参团人数', placeholder: '2' },
    { key: 'TIME_LEFT', label: '剩余时间', placeholder: '23小时45分钟' },
    { key: 'INITIATOR_NAME', label: '发起人', placeholder: '小红' },
    { key: 'PARTICIPANT1', label: '参团人1', placeholder: '小明' },
    { key: 'PARTICIPANT2', label: '参团人2', placeholder: '小李' },
    { key: 'SAVE_AMOUNT', label: '立省金额', placeholder: '2000' }
  ],
  htmlTemplate: `
<div data-group-buy style="max-width:340px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
  
  <!-- 顶部商品区 -->
  <div style="position:relative;background:linear-gradient(135deg,#ff6e40 0%,#ff4757 100%);padding:16px">
    
    <!-- 拼团标签 -->
    <div style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,0.95);padding:4px 12px;border-radius:12px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
      <div style="width:6px;height:6px;background:#ff4757;border-radius:50%;animation:pulse 2s infinite"></div>
      <span style="font-size:11px;font-weight:600;color:#ff4757">{{PEOPLE_NEEDED}}人团</span>
    </div>
    
    <!-- 商品图片占位 -->
    <div style="width:100%;aspect-ratio:1;background:#fff;border-radius:8px;margin-top:28px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <!-- 价格角标 -->
      <div style="position:absolute;top:0;right:0;background:linear-gradient(135deg,#ffd700,#ffaa00);padding:8px 16px;border-radius:0 0 0 20px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">
        <div style="font-size:11px;color:#8b4513;font-weight:500">拼团价</div>
        <div style="font-size:20px;font-weight:bold;color:#8b4513;line-height:1">¥{{GROUP_PRICE}}</div>
      </div>
    </div>
    
  </div>
  
  <!-- 商品信息区 -->
  <div style="padding:16px;background:#fff">
    
    <!-- 商品名称 -->
    <div style="font-size:15px;font-weight:500;color:#333;line-height:1.4;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
      {{PRODUCT_NAME}}
    </div>
    
    <!-- 价格对比 -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="display:flex;align-items:baseline;gap:4px">
        <span style="font-size:12px;color:#ff4757;font-weight:600">拼团价</span>
        <span style="font-size:24px;font-weight:bold;color:#ff4757">¥{{GROUP_PRICE}}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:13px;color:#999;text-decoration:line-through">¥{{ORIGINAL_PRICE}}</span>
        <span style="background:linear-gradient(135deg,#ff6e40,#ff4757);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600">省¥{{SAVE_AMOUNT}}</span>
      </div>
    </div>
    
    <!-- 拼团进度 -->
    <div style="background:linear-gradient(135deg,#fff5f5,#ffe8e8);border-radius:8px;padding:14px;margin-bottom:14px;border:1px solid #ffdddd">
      
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:13px;color:#333;font-weight:500">
          还差<span style="color:#ff4757;font-weight:bold;font-size:18px;margin:0 4px">{{PEOPLE_NEEDED}}</span>人成团
        </div>
        <div style="font-size:11px;color:#ff4757;background:#fff;padding:4px 10px;border-radius:12px;border:1px solid #ffdddd">
          <svg style="width:12px;height:12px;vertical-align:middle;margin-right:2px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {{TIME_LEFT}}
        </div>
      </div>
      
      <!-- 参团者头像 -->
      <div style="display:flex;align-items:center;gap:8px">
        <div style="display:flex;align-items:center">
          <!-- 发起人 -->
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;position:relative">
            {{INITIATOR_NAME}}
            <div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#ffd700;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:8px">团</div>
          </div>
          <!-- 参团者1 -->
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f093fb,#f5576c);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;margin-left:-10px">
            {{PARTICIPANT1}}
          </div>
          <!-- 参团者2 -->
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#00f2fe);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;margin-left:-10px">
            {{PARTICIPANT2}}
          </div>
          <!-- 空位 -->
          <div style="width:36px;height:36px;border-radius:50%;background:#fff;border:2px dashed #ffcccc;display:flex;align-items:center;justify-content:center;margin-left:-10px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </div>
        <div style="flex:1;text-align:right;font-size:11px;color:#999">
          已拼{{PEOPLE_JOINED}}/{{PEOPLE_NEEDED}}人
        </div>
      </div>
      
    </div>
    
  </div>
  
  <!-- 底部按钮区 -->
  <div style="padding:0 16px 16px">
    <button data-join-btn style="width:100%;background:linear-gradient(135deg,#ff6e40,#ff4757);color:#fff;border:none;border-radius:24px;padding:14px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(255,71,87,0.4);transition:all 0.3s;position:relative;overflow:hidden">
      <span style="position:relative;z-index:1">立即参团</span>
      <div style="position:absolute;top:0;right:-20px;width:100px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3));transform:skewX(-20deg);animation:shine 3s infinite"></div>
    </button>
    
    <div style="text-align:center;margin-top:10px;font-size:11px;color:#999">
      拼团成功后48小时内发货
    </div>
  </div>
  
  <!-- CSS动画 -->
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
    @keyframes shine {
      0% { left: -100px; }
      100% { left: 100%; }
    }
    [data-join-btn]:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255,71,87,0.5);
    }
    [data-join-btn]:active {
      transform: translateY(0);
    }
  </style>
  
</div>
  `.trim()
}
