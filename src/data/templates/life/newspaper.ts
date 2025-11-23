import { TheatreTemplate } from '../../theatreTemplates'

export const newspaperTemplate: TheatreTemplate = {
  id: 'newspaper',
  category: '生活消费',
  name: '头条新闻',
  keywords: ['新闻', '报纸', '头条', '报道'],
  fields: [
    { key: 'PAPER_NAME', label: '报纸名称', placeholder: '每日邮报' },
    { key: 'DATE', label: '日期', placeholder: '2025年11月23日' },
    { key: 'HEADLINE', label: '头条标题', placeholder: '重磅消息' },
    { key: 'SUBHEAD', label: '副标题', placeholder: '震惊全网的真相' },
    { key: 'CONTENT', label: '正文内容', placeholder: '今日发生了一件大事...' },
    { key: 'IMAGE_CAPTION', label: '图片说明', placeholder: '现场照片' },
  ],
  htmlTemplate: `
<div style="
  width: 100%;
  max-width: 380px;
  background: #f4ebd9;
  padding: 15px;
  color: #2c2c2c;
  font-family: 'Times New Roman', 'Songti SC', serif;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
">
  <!-- 纸张纹理 -->
  <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.5%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.1%22/%3E%3C/svg%3E'); pointer-events: none;"></div>
  
  <!-- 报头 -->
  <div style="border-bottom: 2px solid #2c2c2c; padding-bottom: 8px; margin-bottom: 12px; text-align: center; position: relative; z-index: 1;">
    <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px; line-height: 1; margin-bottom: 4px; text-transform: uppercase;">{{PAPER_NAME}}</div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #2c2c2c; padding-top: 4px; font-style: italic;">
      <span>NO. 1024</span>
      <span>{{DATE}}</span>
      <span>1.00 RMB</span>
    </div>
  </div>

  <!-- 头条 -->
  <div style="text-align: center; margin-bottom: 12px; position: relative; z-index: 1;">
    <div style="font-size: 28px; font-weight: bold; line-height: 1.1; margin-bottom: 6px;">{{HEADLINE}}</div>
    <div style="font-size: 14px; font-style: italic; color: #444;">—— {{SUBHEAD}}</div>
  </div>

  <!-- 内容布局 -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; position: relative; z-index: 1;">
    <!-- 左栏：图片 -->
    <div>
      <div style="width: 100%; aspect-ratio: 4/3; background: #ddd; border: 1px solid #999; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; filter: grayscale(100%) contrast(120%);">
        <div style="font-size: 40px;">📷</div>
      </div>
      <div style="font-size: 10px; color: #666; text-align: center;">▲ {{IMAGE_CAPTION}}</div>
    </div>
    
    <!-- 右栏：正文 -->
    <div style="font-size: 11px; line-height: 1.4; text-align: justify;">
      <span style="float: left; font-size: 32px; line-height: 0.8; font-weight: bold; margin-right: 4px;">T</span>
      {{CONTENT}}
    </div>
  </div>

  <!-- 底部栏 -->
  <div style="margin-top: 12px; border-top: 1px solid #2c2c2c; padding-top: 4px; font-size: 9px; text-align: center; position: relative; z-index: 1;">
    PRINTED IN DOUZHI CITY • WEATHER: SUNNY • STOCK: UP
  </div>
</div>
  `.trim()
}
