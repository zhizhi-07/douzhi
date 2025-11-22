import { TheatreTemplate } from '../../theatreTemplates'

export const deliveryReviewTemplate: TheatreTemplate = {
    id: 'delivery_review',
    category: '生活消费',
    name: '外卖评价记录',
    keywords: ['外卖评价', '骑手打分', '外卖评价记录', '我的评价', '外卖订单'],
    fields: [
      { key: 'REVIEW1_STORE', label: '评价1店铺', placeholder: '张亮麻辣烫' },
      { key: 'REVIEW1_RIDER', label: '评价1骑手', placeholder: '李师傅' },
      { key: 'REVIEW1_RATING', label: '评价1星级', placeholder: '5' },
      { key: 'REVIEW1_TIP', label: '评价1打赏', placeholder: '10' },
      { key: 'REVIEW1_COMMENT', label: '评价1内容', placeholder: '下这么大雨我的外卖竟然毫发无损，包装很仔细，骑手态度超好，辛苦了！' },
      { key: 'REVIEW1_TIME', label: '评价1时间', placeholder: '11月20日 19:30' },
      
      { key: 'REVIEW2_STORE', label: '评价2店铺', placeholder: '肯德基（中山路店）' },
      { key: 'REVIEW2_RIDER', label: '评价2骑手', placeholder: '王师傅' },
      { key: 'REVIEW2_RATING', label: '评价2星级', placeholder: '5' },
      { key: 'REVIEW2_TIP', label: '评价2打赏', placeholder: '5' },
      { key: 'REVIEW2_COMMENT', label: '评价2内容', placeholder: '速度很快，半小时就到了，炸鸡还是热的！骑手很负责。' },
      { key: 'REVIEW2_TIME', label: '评价2时间', placeholder: '11月19日 12:45' },
      
      { key: 'REVIEW3_STORE', label: '评价3店铺', placeholder: '喜茶（万达店）' },
      { key: 'REVIEW3_RIDER', label: '评价3骑手', placeholder: '陈师傅' },
      { key: 'REVIEW3_RATING', label: '评价3星级', placeholder: '4' },
      { key: 'REVIEW3_TIP', label: '评价3打赏', placeholder: '0' },
      { key: 'REVIEW3_COMMENT', label: '评价3内容', placeholder: '送得挺快的，就是杯子有点洒了，下次注意包装。' },
      { key: 'REVIEW3_TIME', label: '评价3时间', placeholder: '11月18日 15:20' },
      
      { key: 'REVIEW4_STORE', label: '评价4店铺', placeholder: '麦当劳（天河店）' },
      { key: 'REVIEW4_RIDER', label: '评价4骑手', placeholder: '刘师傅' },
      { key: 'REVIEW4_RATING', label: '评价4星级', placeholder: '5' },
      { key: 'REVIEW4_TIP', label: '评价4打赏', placeholder: '5' },
      { key: 'REVIEW4_COMMENT', label: '评价4内容', placeholder: '骑手很贴心，还帮我按门铃，服务态度一级棒！' },
      { key: 'REVIEW4_TIME', label: '评价4时间', placeholder: '11月17日 20:10' }
    ],
    htmlTemplate: `
<div data-delivery-review style="max-width:375px;margin:0 auto;background:#f8f8f8;font-family:-apple-system,'PingFang SC',sans-serif;min-height:600px">
  
  <!-- 头部 -->
  <div style="background:#fff;padding:16px;border-bottom:1px solid #f0f0f0">
    <div style="font-size:18px;font-weight:600;color:#333">我的评价</div>
    <div style="font-size:13px;color:#999;margin-top:4px">共 4 条评价</div>
  </div>
  
  <!-- 评价记录列表 -->
  <div style="padding:8px 0">
    
    <!-- 评价1 -->
    <div data-review-item style="background:#fff;margin-bottom:8px;padding:14px;border-radius:8px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;background:#ffa726;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;flex-shrink:0">骑</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600;color:#333">{{REVIEW1_STORE}}</div>
            <div style="font-size:12px;color:#999">{{REVIEW1_TIME}}</div>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:8px">骑手：{{REVIEW1_RIDER}}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:10px">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style="font-size:12px;color:#ffa726;margin-left:4px">{{REVIEW1_RATING}}星</span>
            <span style="background:#fff5e6;color:#ffa726;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px">已打赏 ¥{{REVIEW1_TIP}}</span>
          </div>
          <div style="font-size:14px;line-height:1.6;color:#333;background:#f8f8f8;padding:10px;border-radius:6px">
            {{REVIEW1_COMMENT}}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 评价2 -->
    <div data-review-item style="background:#fff;margin-bottom:8px;padding:14px;border-radius:8px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;background:#ffa726;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;flex-shrink:0">骑</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600;color:#333">{{REVIEW2_STORE}}</div>
            <div style="font-size:12px;color:#999">{{REVIEW2_TIME}}</div>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:8px">骑手：{{REVIEW2_RIDER}}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:10px">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style="font-size:12px;color:#ffa726;margin-left:4px">{{REVIEW2_RATING}}星</span>
            <span style="background:#fff5e6;color:#ffa726;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px">已打赏 ¥{{REVIEW2_TIP}}</span>
          </div>
          <div style="font-size:14px;line-height:1.6;color:#333;background:#f8f8f8;padding:10px;border-radius:6px">
            {{REVIEW2_COMMENT}}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 评价3 -->
    <div data-review-item style="background:#fff;margin-bottom:8px;padding:14px;border-radius:8px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;background:#ffa726;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;flex-shrink:0">骑</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600;color:#333">{{REVIEW3_STORE}}</div>
            <div style="font-size:12px;color:#999">{{REVIEW3_TIME}}</div>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:8px">骑手：{{REVIEW3_RIDER}}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:10px">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#e0e0e0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style="font-size:12px;color:#ffa726;margin-left:4px">{{REVIEW3_RATING}}星</span>
          </div>
          <div style="font-size:14px;line-height:1.6;color:#333;background:#f8f8f8;padding:10px;border-radius:6px">
            {{REVIEW3_COMMENT}}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 评价4 -->
    <div data-review-item style="background:#fff;margin-bottom:8px;padding:14px;border-radius:8px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:44px;height:44px;background:#ffa726;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;flex-shrink:0">骑</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600;color:#333">{{REVIEW4_STORE}}</div>
            <div style="font-size:12px;color:#999">{{REVIEW4_TIME}}</div>
          </div>
          <div style="font-size:13px;color:#666;margin-bottom:8px">骑手：{{REVIEW4_RIDER}}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:10px">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="#ffd21e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style="font-size:12px;color:#ffa726;margin-left:4px">{{REVIEW4_RATING}}星</span>
            <span style="background:#fff5e6;color:#ffa726;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px">已打赏 ¥{{REVIEW4_TIP}}</span>
          </div>
          <div style="font-size:14px;line-height:1.6;color:#333;background:#f8f8f8;padding:10px;border-radius:6px">
            {{REVIEW4_COMMENT}}
          </div>
        </div>
      </div>
    </div>
    
  </div>
  
</div>
    `.trim()
  }
