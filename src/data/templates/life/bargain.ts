import { TheatreTemplate } from '../../theatreTemplates'

export const bargainTemplate: TheatreTemplate = {
  id: 'bargain',
  category: '生活消费',
  name: '砍一刀',
  keywords: ['砍一刀', '帮我砍', '拼多多砍价', '帮忙砍价', '差一点'],
  fields: [
    { key: 'PRODUCT_NAME', label: '商品名称', placeholder: 'iPhone 15 Pro Max 1TB' },
    { key: 'ORIGINAL_PRICE', label: '原价', placeholder: '12999' },
    { key: 'TARGET_PRICE', label: '目标价格', placeholder: '0.01' },
    { key: 'SAVE_AMOUNT', label: '立省金额', placeholder: '12998.99' },
    { key: 'CURRENT_PROGRESS', label: '当前进度', placeholder: '99.99' },
    { key: 'HELPED_COUNT', label: '已帮砍人数', placeholder: '247' },
    { key: 'TIME_LEFT', label: '剩余时间', placeholder: '23小时59分' }
  ],
  htmlTemplate: `
<div data-bargain style="max-width:340px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
  
  <!-- 顶部成功倒计时 -->
  <div style="background:#ff4757;padding:12px;text-align:center">
    <div style="font-size:13px;color:#fff;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>距离0元购还剩 {{TIME_LEFT}}</span>
    </div>
  </div>
  
  <!-- 商品区 -->
  <div style="padding:16px;background:#fff">
    
    <!-- 商品图 -->
    <div style="position:relative;width:100%;aspect-ratio:1;background:#fff;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;border:2px solid #ffe0e0;overflow:hidden">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <!-- 0元购标签 -->
      <div style="position:absolute;top:12px;left:12px;background:#ffa500;padding:6px 14px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;gap:4px">
        <span style="font-size:16px">🎉</span>
        <span style="font-size:13px;font-weight:bold;color:#fff">0元购</span>
      </div>
    </div>
    
    <!-- 商品信息 -->
    <div style="margin-bottom:12px">
      <div style="font-size:15px;font-weight:600;color:#333;line-height:1.4;margin-bottom:8px">{{PRODUCT_NAME}}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;color:#999;text-decoration:line-through">¥{{ORIGINAL_PRICE}}</span>
        <span style="font-size:24px;font-weight:bold;color:#ff4757">¥{{TARGET_PRICE}}</span>
        <span style="background:#ff4757;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">立省¥{{SAVE_AMOUNT}}</span>
      </div>
    </div>
    
  </div>
  
  <!-- 进度区（核心套路） -->
  <div style="padding:0 16px 16px">
    
    <!-- 主进度条 -->
    <div style="background:#fff5f5;border-radius:12px;padding:16px;margin-bottom:12px;border:2px solid #ffcccc;position:relative;overflow:hidden">
      
      <!-- 闪光效果 -->
      <div style="position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent);animation:shine 2s infinite"></div>
      
      <div style="position:relative;z-index:1">
        <!-- 进度提示 -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:14px;color:#333;font-weight:600">
            砍价进度
          </div>
          <div style="font-size:18px;font-weight:bold;color:#ff4757">
            {{CURRENT_PROGRESS}}%
          </div>
        </div>
        
        <!-- 进度条 -->
        <div style="position:relative;height:24px;background:#f5f5f5;border-radius:12px;overflow:hidden;border:2px solid #ffcccc;margin-bottom:12px">
          <div style="position:absolute;top:0;left:0;height:100%;width:{{CURRENT_PROGRESS}}%;background:#ffa500;transition:width 0.5s"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:bold;color:#333;z-index:2">就差一点点！</div>
        </div>
        
        <!-- 已帮砍人数 -->
        <div style="text-align:center;font-size:12px;color:#666">
          已有 <span style="color:#ff4757;font-weight:bold">{{HELPED_COUNT}}</span> 位好友助力
        </div>
      </div>
    </div>
    
    <!-- 动态套路提示（可折叠） -->
    <div style="margin-bottom:14px">
      <div data-trick-toggle style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8f8f8;border-radius:8px 8px 0 0;cursor:pointer;border-bottom:1px solid #eee">
        <span style="font-size:13px;font-weight:600;color:#666">💡 砍价进度详情</span>
        <span data-trick-arrow style="font-size:12px;color:#999;transition:transform 0.3s">▼</span>
      </div>
      <div data-trick-box style="background:#fff;border-radius:0 0 8px 8px;padding:14px;border-left:4px solid #ff4757;border-right:1px solid #eee;border-bottom:1px solid #eee;position:relative;overflow:hidden">
      <!-- 闪烁动画 -->
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:shine 3s infinite"></div>
      
      <div style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span data-trick-icon style="font-size:22px">💎</span>
          <span data-trick-title style="font-size:14px;font-weight:bold;color:#ff4757">还差1颗钻石就成功了！</span>
        </div>
        <div data-trick-progress style="background:#fff;border-radius:6px;padding:8px;border:1px dashed #ffcccc">
          <div style="font-size:13px;font-weight:600;color:#ff4757">钻石：0/1</div>
        </div>
      </div>
    </div>
    
  </div>
  
  <!-- 底部按钮区 -->
  <div style="padding:0 16px 16px">
    <!-- 主按钮 -->
    <button data-bargain-btn style="width:100%;background:#ff4757;color:#fff;border:none;border-radius:24px;padding:14px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(255,71,87,0.3);margin-bottom:10px;position:relative;overflow:hidden">
      <span style="position:relative;z-index:1">📢 邀请好友助力（还差1个）</span>
      <div style="position:absolute;top:0;right:-20px;width:100px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3));transform:skewX(-20deg);animation:shine 3s infinite"></div>
    </button>
    
    <!-- 次要按钮 -->
    <button data-share-btn style="width:100%;background:#fff;color:#ff4757;border:2px solid #ff4757;border-radius:24px;padding:12px;font-size:14px;font-weight:600;cursor:pointer">
      分享到微信群（再来一刀就成功）
    </button>
    
    <div style="text-align:center;margin-top:10px;font-size:11px;color:#999">
      已有 <span style="color:#ff4757;font-weight:bold">8247</span> 人成功0元购
    </div>
  </div>
  
  <!-- CSS动画 -->
  <style>
    @keyframes shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    [data-bargain-btn]:hover, [data-share-btn]:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255,71,87,0.5);
    }
    [data-bargain-btn]:active, [data-share-btn]:active {
      transform: translateY(0);
    }
  </style>
  
</div>
  `.trim()
}
