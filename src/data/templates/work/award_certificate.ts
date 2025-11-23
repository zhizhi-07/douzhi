import { TheatreTemplate } from '../../theatreTemplates'

export const awardCertificateTemplate: TheatreTemplate = {
  id: 'award_certificate',
  category: '工作学习',
  name: '荣誉证书',
  keywords: ['证书', '奖状', '荣誉', '颁奖'],
  fields: [
    { key: 'RECIPIENT', label: '获奖人', placeholder: '李明' },
    { key: 'AWARD_NAME', label: '奖项名称', placeholder: '最佳员工奖' },
    { key: 'DESCRIPTION', label: '获奖原因', placeholder: '在工作中表现优异，特发此证，以资鼓励。' },
    { key: 'ISSUER', label: '颁发机构', placeholder: '豆汁科技有限公司' },
    { key: 'DATE', label: '日期', placeholder: '二〇二五年十一月二十三日' },
  ],
  htmlTemplate: `
<div style="
  width: 400px;
  height: 280px;
  padding: 20px;
  background: #fff;
  border: 1px solid #d4af37;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  font-family: 'Kaiti', 'STKaiti', 'KaiTi', serif;
  position: relative;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
">
  <!-- 外框花纹 -->
  <div style="
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 2px solid #d4af37;
    border-radius: 4px;
    pointer-events: none;
  ">
    <div style="
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      border: 1px solid #d4af37;
      pointer-events: none;
    "></div>
  </div>

  <!-- 红色背景角标 -->
  <div style="
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(#d4af37 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.1;
    pointer-events: none;
  "></div>

  <div style="text-align: center; width: 80%; position: relative; z-index: 1;">
    <div style="
      font-size: 36px;
      font-weight: bold;
      color: #d63031;
      letter-spacing: 10px;
      margin-bottom: 20px;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
    ">荣誉证书</div>

    <div style="font-size: 18px; color: #2d3436; text-align: left; margin-bottom: 10px;">
      <span style="font-weight: bold; border-bottom: 1px solid #2d3436; padding: 0 10px;">{{RECIPIENT}}</span> 同志：
    </div>

    <div style="
      font-size: 16px;
      color: #2d3436;
      line-height: 1.8;
      text-indent: 2em;
      text-align: left;
      margin-bottom: 20px;
      min-height: 60px;
    ">
      荣获 <span style="font-weight: bold; color: #d63031;">{{AWARD_NAME}}</span>。
      {{DESCRIPTION}}
    </div>

    <div style="text-align: right; margin-top: 30px; font-size: 16px; color: #2d3436;">
      <div style="margin-bottom: 8px;">{{ISSUER}}</div>
      <div>{{DATE}}</div>
    </div>
  </div>

  <!-- 印章 -->
  <div style="
    position: absolute;
    bottom: 30px;
    right: 40px;
    width: 100px;
    height: 100px;
    border: 3px solid #d63031;
    border-radius: 50%;
    color: #d63031;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    transform: rotate(-15deg);
    opacity: 0.8;
    mix-blend-mode: multiply;
    pointer-events: none;
  ">
    <div style="
      width: 80px;
      height: 80px;
      border: 1px solid #d63031;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    ">
      <span>优秀<br>专用章</span>
    </div>
  </div>
</div>
  `.trim()
}
