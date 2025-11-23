import { TheatreTemplate } from '../../theatreTemplates'

export const loveLetterTemplate: TheatreTemplate = {
    id: 'love_letter',
    category: '情感关系',
    name: '情书',
    keywords: ['情书', '告白', '表白', '喜欢你'],
    fields: [
      { key: 'TO_NAME', label: '收信人', placeholder: '亲爱的你' },
      { key: 'CONTENT', label: '内容', placeholder: '遇见你是我最美的意外...' },
      { key: 'FROM_NAME', label: '寄信人', placeholder: '想你的人' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.21' },
    ],
    htmlTemplate: `
<div style="
  max-width: 360px; 
  margin: 0 auto; 
  background-color: #fdf6e3;
  background-image: url('data:image/svg+xml,%3Csvg width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.8\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noise)\\' opacity=\\'0.15\\'/%3E%3C/svg%3E');
  padding: 40px 30px; 
  box-shadow: 0 5px 25px rgba(0,0,0,0.15), inset 0 0 60px rgba(139,69,19,0.1);
  font-family: 'Dancing Script', 'Great Vibes', 'KaiTi', 'STKaiti', cursive, serif;
  color: #5d4037;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0% 5px, 5% 0%, 10% 5px, 15% 0%, 20% 5px, 25% 0%, 30% 5px, 35% 0%, 40% 5px, 45% 0%, 50% 5px, 55% 0%, 60% 5px, 65% 0%, 70% 5px, 75% 0%, 80% 5px, 85% 0%, 90% 5px, 95% 0%, 100% 5px,
    100% 100%, 0% 100%
  );
">
  <!-- 顶部火漆印章 -->
  <div style="position: absolute; top: 20px; right: 20px; width: 60px; height: 60px; opacity: 0.9;">
    <svg viewBox="0 0 100 100" fill="#b71c1c">
      <path d="M50 5 C25 5 5 25 5 50 C5 75 25 95 50 95 C75 95 95 75 95 50 C95 25 75 5 50 5 Z" filter="url(#drop-shadow)"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#8e0000" stroke-width="2"/>
      <path d="M35 50 Q50 35 65 50 Q50 65 35 50" fill="#8e0000" opacity="0.5"/>
      <text x="50" y="65" text-anchor="middle" fill="#5c0000" font-size="40" font-family="serif" font-weight="bold">Love</text>
    </svg>
  </div>

  <!-- 日期邮戳风格 -->
  <div style="
    position: absolute; 
    top: 30px; 
    left: 30px; 
    width: 80px; 
    height: 80px; 
    border: 2px dashed #a1887f; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transform: rotate(-15deg);
    opacity: 0.6;
    color: #8d6e63;
    font-size: 12px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
  ">
    <div style="text-align: center;">
      <div>POST</div>
      <div style="margin: 4px 0;">{{DATE}}</div>
      <div>OFFICE</div>
    </div>
  </div>

  <!-- 信件内容 -->
  <div style="margin-top: 60px; position: relative; z-index: 10;">
    <div style="font-size: 20px; margin-bottom: 24px; font-weight: bold;">Dear {{TO_NAME}},</div>
    
    <div style="
      font-size: 18px; 
      line-height: 2.2; 
      text-indent: 2em; 
      white-space: pre-wrap; 
      text-shadow: 0 1px 0 rgba(255,255,255,0.5);
    ">
      {{CONTENT}}
    </div>
    
    <div style="margin-top: 40px; display: flex; flex-col; align-items: flex-end;">
      <div style="font-size: 18px; font-style: italic; margin-right: 20px;">Yours sincerely,</div>
      <div style="
        font-size: 24px; 
        font-weight: bold; 
        border-bottom: 2px solid #d7ccc8; 
        padding: 0 20px 5px;
        transform: rotate(-2deg);
      ">
        {{FROM_NAME}}
      </div>
    </div>
  </div>

  <!-- 底部装饰纹理 -->
  <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100px; background: linear-gradient(to top, rgba(139,69,19,0.05), transparent); pointer-events: none;"></div>
</div>
    `.trim()
  }
