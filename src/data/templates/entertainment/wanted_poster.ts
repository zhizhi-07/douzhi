import { TheatreTemplate } from '../../theatreTemplates'

export const wantedPosterTemplate: TheatreTemplate = {
  id: 'wanted_poster',
  category: '娱乐休闲',
  name: '通缉令',
  keywords: ['通缉', '悬赏', '通缉令', '抓捕'],
  fields: [
    { key: 'NAME', label: '姓名', placeholder: '路飞' },
    { key: 'REWARD', label: '赏金', placeholder: '3,000,000,000' },
    { key: 'CRIME', label: '罪名', placeholder: '偷走我的心' },
    { key: 'STATUS', label: '状态', placeholder: 'DEAD OR ALIVE' },
  ],
  htmlTemplate: `
<div style="
  width: 320px;
  background: #e8dcc5;
  padding: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  font-family: 'Times New Roman', serif;
  text-align: center;
  position: relative;
  margin: 0 auto;
  background-image: url('data:image/svg+xml,%3Csvg width=%22100%22 height=%22100%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.15%22/%3E%3C/svg%3E');
">
  <!-- 钉孔 -->
  <div style="
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: #333;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.5);
  "></div>

  <div style="
    font-size: 48px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #2d2d2d;
    margin-bottom: 5px;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
    transform: scaleY(1.2);
  ">WANTED</div>
  
  <div style="
    font-size: 20px;
    font-weight: bold;
    color: #2d2d2d;
    margin-bottom: 20px;
    font-family: serif;
  ">{{STATUS}}</div>

  <!-- 照片框 -->
  <div style="
    width: 240px;
    height: 200px;
    margin: 0 auto 20px;
    border: 4px solid #2d2d2d;
    background: #d4c5a9;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  ">
    <div style="font-size: 60px; opacity: 0.5;">👤</div>
    <!-- 罪名印章 -->
    <div style="
      position: absolute;
      bottom: 10px;
      right: 10px;
      border: 3px solid #c0392b;
      color: #c0392b;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 14px;
      transform: rotate(-15deg);
      opacity: 0.8;
      text-transform: uppercase;
    ">
      {{CRIME}}
    </div>
  </div>

  <div style="
    font-size: 32px;
    font-weight: bold;
    color: #2d2d2d;
    text-transform: uppercase;
    margin-bottom: 15px;
    border-bottom: 2px solid #2d2d2d;
    display: inline-block;
    padding-bottom: 5px;
  ">{{NAME}}</div>

  <div style="
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  ">
    <div style="font-size: 14px; font-weight: bold;">BERRY</div>
    <div style="
      font-size: 28px;
      font-weight: 900;
      color: #2d2d2d;
    ">{{REWARD}}</div>
    <div style="font-size: 14px; font-weight: bold;">-</div>
  </div>

  <div style="
    font-size: 10px;
    color: #2d2d2d;
    font-weight: bold;
    text-transform: uppercase;
  ">
    Marine Headquarters
  </div>
</div>
  `.trim()
}
