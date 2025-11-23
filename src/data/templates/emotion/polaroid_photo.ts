import { TheatreTemplate } from '../../theatreTemplates'

export const polaroidPhotoTemplate: TheatreTemplate = {
  id: 'polaroid_photo',
  category: '情感关系',
  name: '拍立得照片',
  keywords: ['拍立得', '照片', '相片', '回忆'],
  fields: [
    { key: 'NOTE', label: '手写备注', placeholder: '美好的回忆' },
    { key: 'DATE', label: '日期', placeholder: '2025.11.23' },
    { key: 'LOCATION', label: '地点', placeholder: '东京铁塔' },
  ],
  htmlTemplate: `
<div class="polaroid-container" style="
  width: 320px;
  padding: 15px 15px 60px 15px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  transform: rotate(-2deg);
  transition: transform 0.3s ease;
  cursor: pointer;
  position: relative;
  margin: 20px auto;
" onmouseover="this.style.transform='rotate(0deg) scale(1.02)'" onmouseout="this.style.transform='rotate(-2deg) scale(1)'">
  
  <!-- 胶带 -->
  <div style="
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 30px;
    background: rgba(255, 255, 255, 0.4);
    border-left: 2px solid rgba(255,255,255,0.2);
    border-right: 2px solid rgba(255,255,255,0.2);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    z-index: 10;
  "></div>

  <!-- 照片区域 -->
  <div style="
    width: 100%;
    aspect-ratio: 1/1;
    background: #2d3436;
    margin-bottom: 15px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
  ">
    <!-- 默认图片占位 -->
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
      color: white;
      font-size: 40px;
    ">
      📸
    </div>
    
    <!-- 光泽反光 -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%);
      pointer-events: none;
    "></div>
  </div>

  <!-- 底部文字 -->
  <div style="
    font-family: 'Caveat', 'Bradley Hand', cursive;
    color: #2d3436;
    text-align: center;
  ">
    <div style="font-size: 24px; transform: rotate(-1deg);">{{NOTE}}</div>
    <div style="
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 14px;
      color: #636e72;
      font-family: sans-serif;
    ">
      <span>📍 {{LOCATION}}</span>
      <span>{{DATE}}</span>
    </div>
  </div>
</div>
  `.trim()
}
