import { TheatreTemplate } from '../../theatreTemplates'

export const newspaperTemplate: TheatreTemplate = {
  id: 'newspaper',
  category: '生活消费',
  name: '头条新闻',
  keywords: ['新闻', '报纸', '头条', '报道'],
  fields: [
    { key: 'PAPER_NAME', label: '报纸名称', placeholder: '每日邮报' },
    { key: 'PUBLISHER', label: '发行单位', placeholder: '豆汁传媒集团' },
    { key: 'DATE', label: '日期', placeholder: '2025年11月23日' },
    { key: 'SECTION', label: '版面', placeholder: 'A1 头条' },
    { key: 'WEATHER', label: '天气', placeholder: '晴转多云 23°C' },
    { key: 'HEADLINE', label: '头条标题', placeholder: '重磅消息' },
    { key: 'SUBHEAD', label: '副标题', placeholder: '震惊全网的真相' },
    { key: 'AUTHOR', label: '记者/作者', placeholder: '本报特约记者' },
    { key: 'CONTENT', label: '正文内容', placeholder: '今日发生了一件大事...' },
    { key: 'IMAGE_CAPTION', label: '图片说明', placeholder: '现场照片' },
    { key: 'BACK_CONTENT', label: '背面/后续内容', placeholder: '更多详细报道请翻页查看...' },
  ],
  htmlTemplate: `
<div style="perspective: 1000px; width: 380px; margin: 0 auto; cursor: pointer;" onclick="this.querySelector('.newspaper-inner').style.transform = this.querySelector('.newspaper-inner').style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)'">
  <div class="newspaper-inner" style="
    position: relative;
    width: 100%;
    height: 560px;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  ">
    <!-- 正面 (Front) -->
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      background: #f4ebd9;
      padding: 20px;
      box-sizing: border-box;
      color: #2c2c2c;
      font-family: 'Times New Roman', 'Songti SC', serif;
      display: flex;
      flex-direction: column;
    ">
      <!-- 纸张纹理 -->
      <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.5%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.1%22/%3E%3C/svg%3E'); pointer-events: none;"></div>
      
      <!-- 报头 -->
      <div style="border-bottom: 3px double #2c2c2c; padding-bottom: 8px; margin-bottom: 12px; text-align: center; position: relative; z-index: 1;">
        <div style="font-size: 36px; font-weight: 900; letter-spacing: -1px; line-height: 1; margin-bottom: 8px; text-transform: uppercase;">{{PAPER_NAME}}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; border-top: 1px solid #2c2c2c; padding-top: 4px; font-weight: 600;">
          <span>{{PUBLISHER}}</span>
          <span>{{DATE}} | {{WEATHER}}</span>
          <span>CN-1024</span>
        </div>
      </div>

      <!-- 版面标识 -->
      <div style="text-align: right; font-size: 10px; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 2px;">{{SECTION}}</div>

      <!-- 头条区域 -->
      <div style="text-align: center; margin-bottom: 16px; position: relative; z-index: 1;">
        <div style="font-size: 32px; font-weight: bold; line-height: 1.1; margin-bottom: 8px; letter-spacing: -0.5px;">{{HEADLINE}}</div>
        <div style="font-size: 16px; font-style: italic; color: #444; font-family: serif;">—— {{SUBHEAD}}</div>
      </div>

      <!-- 内容布局 -->
      <div style="flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; overflow: hidden;">
        <!-- 图片 -->
        <div style="width: 100%; aspect-ratio: 16/9; background: #ddd; border: 1px solid #999; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; filter: grayscale(100%) contrast(120%); position: relative;">
          <div style="font-size: 40px;">📷</div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; font-size: 10px;">{{IMAGE_CAPTION}}</div>
        </div>
        
        <!-- 作者与正文 -->
        <div style="margin-bottom: 8px; font-weight: bold; font-size: 11px;">文 / {{AUTHOR}}</div>
        <div style="font-size: 12px; line-height: 1.6; text-align: justify; column-count: 2; column-gap: 15px; height: 100%;">
          <span style="float: left; font-size: 36px; line-height: 0.8; font-weight: bold; margin-right: 4px; margin-top: 2px;">T</span>
          {{CONTENT}}
        </div>
      </div>

      <!-- 底部提示 -->
      <div style="text-align: center; font-size: 10px; color: #666; margin-top: 10px; border-top: 1px dashed #999; padding-top: 4px;">
        >>> 点击翻阅下一页 >>>
      </div>
    </div>

    <!-- 背面 (Back) -->
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      background: #f0e6d2;
      transform: rotateY(180deg);
      padding: 20px;
      box-sizing: border-box;
      color: #2c2c2c;
      font-family: 'Times New Roman', 'Songti SC', serif;
      display: flex;
      flex-direction: column;
    ">
       <!-- 纸张纹理 -->
      <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.5%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.1%22/%3E%3C/svg%3E'); pointer-events: none;"></div>

      <div style="border-bottom: 2px solid #2c2c2c; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
         <div style="font-size: 14px; font-weight: bold;">深度报道</div>
         <div style="font-size: 10px;">PAGE A2</div>
      </div>

      <div style="flex: 1; column-count: 2; column-gap: 20px; column-rule: 1px solid #ccc; text-align: justify; font-size: 11px; line-height: 1.8; position: relative; z-index: 1;">
        <div style="background: #333; color: #fff; padding: 4px 8px; display: inline-block; margin-bottom: 8px; font-size: 10px; font-weight: bold;">续上文</div>
        <br/>
        {{BACK_CONTENT}}
        <br/><br/>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;"/>
        <strong>相关阅读：</strong><br/>
        • 更多市民对此事表示关注<br/>
        • 专家呼吁加强监管<br/>
        <br/>
        <div style="border: 2px solid #2c2c2c; padding: 8px; margin-top: 10px; break-inside: avoid;">
           <div style="text-align: center; font-weight: bold; border-bottom: 1px solid #2c2c2c; margin-bottom: 4px;">今日天气</div>
           <div style="text-align: center; font-size: 24px;">☀️</div>
           <div style="text-align: center;">{{WEATHER}}</div>
        </div>
      </div>

      <div style="margin-top: auto; border-top: 1px solid #2c2c2c; padding-top: 8px; text-align: center; font-size: 10px;">
        本报地址：豆汁市代码区1024号 | 电话：888-8888
      </div>
    </div>
  </div>
</div>
  `.trim()
}
