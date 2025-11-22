import { TheatreTemplate } from '../../theatreTemplates'

export const privateAlbumTemplate: TheatreTemplate = {
    id: 'private_album',
    category: '隐私安全',
    name: '私密相册',
    keywords: ['私密相册', '加密相册', '隐藏相册', '私密照片', '色情相册'],
    fields: [
      { key: 'ALBUM_TITLE', label: '相册标题', placeholder: '我们的秘密' },
      { key: 'DATE', label: '日期', placeholder: '2024年8月' },
      { key: 'PASSWORD', label: '密码', placeholder: '1234' },
      
      { key: 'PHOTO1_DESC', label: '照片1描述', placeholder: '她穿着黑色蕾丝内衣躺在床上' },
      { key: 'PHOTO1_THOUGHT', label: '照片1心理', placeholder: '那一刻她的眼神让我心跳加速，我想记录下她最美的样子' },
      { key: 'PHOTO1_SOURCE', label: '照片1来源', placeholder: '周末在家' },
      
      { key: 'PHOTO2_DESC', label: '照片2描述', placeholder: '浴室里的她浑身湿透' },
      { key: 'PHOTO2_THOUGHT', label: '照片2心理', placeholder: '水珠顺着她的皮肤滑落，太性感了' },
      { key: 'PHOTO2_SOURCE', label: '照片2来源', placeholder: '洗澡时偷拍' },
      
      { key: 'PHOTO3_DESC', label: '照片3描述', placeholder: '她趴在床上，只穿了一件T恤' },
      { key: 'PHOTO3_THOUGHT', label: '照片3心理', placeholder: '那条曲线太完美了，忍不住拍下来' },
      { key: 'PHOTO3_SOURCE', label: '照片3来源', placeholder: '清晨' },
      
      { key: 'PHOTO4_DESC', label: '照片4描述', placeholder: '她坐在我腿上接吻的瞬间' },
      { key: 'PHOTO4_THOUGHT', label: '照片4心理', placeholder: '这是我们最亲密的时刻' },
      { key: 'PHOTO4_SOURCE', label: '照片4来源', placeholder: '情人节' }
    ],
    htmlTemplate: `
<div data-private-album data-password="{{PASSWORD}}" style="max-width:340px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif">
  <div style="background:#000;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.3)">
    
    <!-- 头部 -->
    <div style="background:#1c1c1e;padding:14px 16px;border-bottom:1px solid #2c2c2e">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:17px;font-weight:600;color:#fff">{{ALBUM_TITLE}}</div>
        <div data-lock-btn style="width:28px;height:28px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer">
          <div style="width:10px;height:10px;border:2px solid #fff;border-radius:2px"></div>
        </div>
      </div>
    </div>
    
    <!-- 照片网格 -->
    <div data-photos-container style="padding:8px;background:#000;display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      
      <!-- 照片1 -->
      <div data-photo-card="1" style="perspective:1000px;cursor:pointer">
        <div data-photo-flip="1" style="position:relative;padding-top:100%;transform-style:preserve-3d;transition:transform 0.6s">
          <!-- 正面 -->
          <div style="position:absolute;inset:0;backface-visibility:hidden;background:#2c2c2e;border-radius:6px;padding:12px;display:flex;align-items:center;justify-content:center">
            <div style="font-size:12px;line-height:1.5;color:#fff;text-align:center">{{PHOTO1_DESC}}</div>
          </div>
          <!-- 背面 -->
          <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);background:#1c1c1e;border-radius:6px;padding:10px;display:flex;flex-direction:column;justify-content:center;gap:6px">
            <div style="font-size:10px;color:#8e8e93">心理活动</div>
            <div style="font-size:11px;line-height:1.4;color:#fff">{{PHOTO1_THOUGHT}}</div>
            <div style="font-size:9px;color:#666;margin-top:4px">{{PHOTO1_SOURCE}}</div>
          </div>
        </div>
      </div>
      
      <!-- 照片2 -->
      <div data-photo-card="2" style="perspective:1000px;cursor:pointer">
        <div data-photo-flip="2" style="position:relative;padding-top:100%;transform-style:preserve-3d;transition:transform 0.6s">
          <div style="position:absolute;inset:0;backface-visibility:hidden;background:#2c2c2e;border-radius:6px;padding:12px;display:flex;align-items:center;justify-content:center">
            <div style="font-size:12px;line-height:1.5;color:#fff;text-align:center">{{PHOTO2_DESC}}</div>
          </div>
          <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);background:#1c1c1e;border-radius:6px;padding:10px;display:flex;flex-direction:column;justify-content:center;gap:6px">
            <div style="font-size:10px;color:#8e8e93">心理活动</div>
            <div style="font-size:11px;line-height:1.4;color:#fff">{{PHOTO2_THOUGHT}}</div>
            <div style="font-size:9px;color:#666;margin-top:4px">{{PHOTO2_SOURCE}}</div>
          </div>
        </div>
      </div>
      
      <!-- 照片3 -->
      <div data-photo-card="3" style="perspective:1000px;cursor:pointer">
        <div data-photo-flip="3" style="position:relative;padding-top:100%;transform-style:preserve-3d;transition:transform 0.6s">
          <div style="position:absolute;inset:0;backface-visibility:hidden;background:#2c2c2e;border-radius:6px;padding:12px;display:flex;align-items:center;justify-content:center">
            <div style="font-size:12px;line-height:1.5;color:#fff;text-align:center">{{PHOTO3_DESC}}</div>
          </div>
          <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);background:#1c1c1e;border-radius:6px;padding:10px;display:flex;flex-direction:column;justify-content:center;gap:6px">
            <div style="font-size:10px;color:#8e8e93">心理活动</div>
            <div style="font-size:11px;line-height:1.4;color:#fff">{{PHOTO3_THOUGHT}}</div>
            <div style="font-size:9px;color:#666;margin-top:4px">{{PHOTO3_SOURCE}}</div>
          </div>
        </div>
      </div>
      
      <!-- 照片4 -->
      <div data-photo-card="4" style="perspective:1000px;cursor:pointer">
        <div data-photo-flip="4" style="position:relative;padding-top:100%;transform-style:preserve-3d;transition:transform 0.6s">
          <div style="position:absolute;inset:0;backface-visibility:hidden;background:#2c2c2e;border-radius:6px;padding:12px;display:flex;align-items:center;justify-content:center">
            <div style="font-size:12px;line-height:1.5;color:#fff;text-align:center">{{PHOTO4_DESC}}</div>
          </div>
          <div style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);background:#1c1c1e;border-radius:6px;padding:10px;display:flex;flex-direction:column;justify-content:center;gap:6px">
            <div style="font-size:10px;color:#8e8e93">心理活动</div>
            <div style="font-size:11px;line-height:1.4;color:#fff">{{PHOTO4_THOUGHT}}</div>
            <div style="font-size:9px;color:#666;margin-top:4px">{{PHOTO4_SOURCE}}</div>
          </div>
        </div>
      </div>
      
    </div>
    
    <!-- 底部 -->
    <div style="padding:12px 16px;background:#1c1c1e;border-top:1px solid #2c2c2e">
      <div style="font-size:12px;color:#8e8e93">{{DATE}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
