import { TheatreTemplate } from '../../theatreTemplates'

export const postcardTemplate: TheatreTemplate = {
    id: 'postcard',
    category: '情感关系',
    name: '明信片',
    keywords: ['明信片', '寄明信片', '风景明信片'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '明信片排版设计案例分享' },
      { key: 'PLACE', label: '地点', placeholder: '野 在 山 川' },
      { key: 'PLACE_EN', label: '英文地点', placeholder: 'YAZA RESORT HOTEL' },
      { key: 'BLESSING', label: '祝福语', placeholder: '愿您每一年的今天，\n欢喜良辰，幸福加倍。' },
      { key: 'BLESSING_EN', label: '英文祝福', placeholder: 'May each year on this day,\nHappy moments, double happiness.' }
    ],
    htmlTemplate: `
<div onclick="this.classList.toggle('flipped')" style="max-width:600px;height:400px;margin:0 auto;perspective:1000px;cursor:pointer">
  <div class="card" style="position:relative;width:100%;height:100%;transform-style:preserve-3d">
    <div class="front" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:flex">
      <div style="flex:1;background:linear-gradient(135deg,#8b9d83 0%,#5a6d52 100%);position:relative"></div>
      <div style="width:180px;background:#f5f5f0;display:flex;align-items:center;justify-content:center;padding:30px;position:relative">
        <div style="writing-mode:vertical-rl;text-orientation:upright;font-size:20px;letter-spacing:8px;color:#333;font-weight:300">{{TITLE}}</div>
        <div style="position:absolute;bottom:80px;right:30px;text-align:center">
          <div style="font-size:16px;letter-spacing:12px;color:#333;margin-bottom:8px;writing-mode:vertical-rl;text-orientation:upright">{{PLACE}}</div>
          <div style="font-size:9px;color:#999;letter-spacing:1px;writing-mode:vertical-rl">{{PLACE_EN}}</div>
        </div>
      </div>
    </div>
    
    <div class="back" style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:#f5f5f0;box-shadow:0 4px 20px rgba(0,0,0,0.15);transform:rotateY(180deg);display:flex">
      <div style="flex:1;padding:50px;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="font-size:60px;color:#ccc;line-height:1;margin-bottom:20px">"</div>
          <div style="font-size:18px;color:#333;line-height:1.8;margin-bottom:12px;white-space:pre-wrap">{{BLESSING}}</div>
          <div style="font-size:12px;color:#999;line-height:1.6;font-style:italic;white-space:pre-wrap">{{BLESSING_EN}}</div>
        </div>
        <div>
          <div style="font-size:20px;letter-spacing:18px;color:#333;margin-bottom:15px">{{PLACE}}</div>
          <div style="width:80px;height:60px;border:2px solid #d0d0d0;background:#fafafa"></div>
        </div>
      </div>
      <div style="width:240px;background:linear-gradient(135deg,#a8b5a0 0%,#7a8872 100%)"></div>
    </div>
  </div>
</div>
<style>
.card{transition:transform 0.6s}
.flipped .card{transform:rotateY(180deg)}
</style>
    `.trim()
  }
