import { TheatreTemplate } from '../../theatreTemplates'

export const datingMatchTemplate: TheatreTemplate = {
  id: 'dating_match',
  category: '社交通讯',
  name: '配对成功',
  keywords: ['配对', '探探', '陌陌', '交友'],
  fields: [
    { key: 'APP_NAME', label: 'App名称', placeholder: 'Tinder' },
    { key: 'MATCH_NAME', label: '对方昵称', placeholder: 'Jessica' },
    { key: 'AGE', label: '年龄', placeholder: '24' },
    { key: 'DISTANCE', label: '距离', placeholder: '3km' },
    { key: 'PROFILE_TEXT', label: '简介', placeholder: '喜欢旅行和摄影，寻找有趣的灵魂。' },
    { key: 'COMMON_INTERESTS', label: '共同兴趣', placeholder: '旅行、摄影、美食' },
  ],
  htmlTemplate: `
<div data-dating-match style="background: linear-gradient(135deg, #fd297b, #ff655b); width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 12px; overflow: hidden; color: white; position: relative; height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
  <!-- Background Circles -->
  <div style="position: absolute; width: 300px; height: 300px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); animation: ripple 2s infinite;"></div>
  <div style="position: absolute; width: 300px; height: 300px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); animation: ripple 2s infinite 0.5s;"></div>
  
  <div style="font-family: 'Brush Script MT', cursive; font-size: 48px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); margin-bottom: 20px; transform: rotate(-5deg); z-index: 10;">It's a Match!</div>
  <div style="font-size: 14px; margin-bottom: 30px; opacity: 0.9; z-index: 10;">你和 {{MATCH_NAME}} 互相喜欢了</div>
  
  <div style="display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 30px; z-index: 10;">
    <div style="width: 80px; height: 80px; border-radius: 50%; background: #fff; border: 3px solid white; overflow: hidden; margin-right: -15px; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
      <div style="width: 100%; height: 100%; background: #ddd; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 30px;">You</div>
    </div>
    <div style="width: 80px; height: 80px; border-radius: 50%; background: #eee; border: 3px solid white; overflow: hidden; margin-left: -15px; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
      <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 30px;">Her</div>
    </div>
  </div>
  
  <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; width: 80%; z-index: 10; backdrop-filter: blur(5px);">
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span style="font-weight: bold;">{{MATCH_NAME}}, {{AGE}}</span>
      <span style="font-size: 12px; opacity: 0.8;">📍 {{DISTANCE}}</span>
    </div>
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 10px; line-height: 1.4;">"{{PROFILE_TEXT}}"</div>
    <div style="font-size: 10px; opacity: 0.7;">✨ {{COMMON_INTERESTS}}</div>
  </div>
  
  <div style="margin-top: 30px; width: 80%; display: flex; gap: 10px; z-index: 10;">
    <button style="flex: 1; background: transparent; border: 2px solid white; color: white; padding: 10px; border-radius: 20px; font-weight: bold; cursor: pointer;">以后再说</button>
    <button style="flex: 1; background: white; border: none; color: #fd297b; padding: 10px; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">发消息</button>
  </div>
</div>
  `.trim()
}
