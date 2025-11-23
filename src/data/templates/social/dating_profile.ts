import { TheatreTemplate } from '../../theatreTemplates'

export const datingProfileTemplate: TheatreTemplate = {
    id: 'dating_profile',
    category: '社交通讯',
    name: '婚恋网配对',
    keywords: ['婚恋', '相亲', '交友', '配对'],
    fields: [
      { key: 'NAME', label: '姓名/昵称', placeholder: 'Jessica' },
      { key: 'AGE', label: '年龄', placeholder: '26' },
      { key: 'JOB', label: '职业', placeholder: '设计师' },
      { key: 'DISTANCE', label: '距离', placeholder: '3km' },
      { key: 'BIO', label: '个人简介', placeholder: '热爱生活，喜欢旅行和摄影。寻找那个懂我的人。' },
      { key: 'TAGS', label: '标签（逗号分隔）', placeholder: '猫奴, 咖啡控, 健身, 摄影' },
      { key: 'MATCH_RATE', label: '匹配度', placeholder: '98%' },
      { key: '星座', label: '星座', placeholder: '天秤座' }
    ],
    htmlTemplate: `
<div data-dating-profile style="max-width: 320px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; position: relative; height: 500px; perspective: 1000px;">
  
  <div class="card-inner" style="position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer;">
    
    <!-- 正面：照片和基本信息 -->
    <div class="card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); background: #fff;">
      <!-- 照片区域 (模拟) -->
      <div style="height: 380px; background: #f0f0f0; position: relative;">
        <div style="position: absolute; inset: 0; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iI2RkZCIvPjxwYXRoIGQ9Ik0yMCAxMDBROTAgNjAgODAgMTAwIiBmaWxsPSIjZGRkIi8+PC9zdmc+'); background-size: cover; background-position: center; filter: grayscale(0.2);"></div>
        
        <!-- 匹配度标签 -->
        <div style="position: absolute; top: 20px; right: 20px; background: linear-gradient(45deg, #fd297b, #ff655b); color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(253, 41, 123, 0.3);">
          Match {{MATCH_RATE}}
        </div>
        
        <!-- 底部渐变遮罩 -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 150px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
        
        <div style="position: absolute; bottom: 20px; left: 20px; color: white;">
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">{{NAME}}</span>
            <span style="font-size: 20px; font-weight: 500;">{{AGE}}</span>
          </div>
          <div style="font-size: 14px; opacity: 0.9; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <span>💼 {{JOB}}</span>
            <span style="width: 4px; height: 4px; background: white; border-radius: 50%; opacity: 0.6;"></span>
            <span>📍 {{DISTANCE}}</span>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div style="height: 120px; display: flex; justify-content: center; align-items: center; gap: 30px;">
        <div style="width: 50px; height: 50px; border-radius: 50%; border: 1px solid #e8e8e8; display: flex; align-items: center; justify-content: center; color: #ff4757; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
        <div style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(45deg, #fd297b, #ff655b); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px rgba(253, 41, 123, 0.3); transform: scale(1); animation: pulse 2s infinite;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </div>
        <div style="width: 50px; height: 50px; border-radius: 50%; border: 1px solid #e8e8e8; display: flex; align-items: center; justify-content: center; color: #2ecc71; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
      </div>
    </div>

    <!-- 背面：详细资料 -->
    <div class="card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); border-radius: 20px; overflow: hidden; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding: 30px; box-sizing: border-box; display: flex; flex-direction: column;">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #333;">About Me</div>
      
      <div style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 30px;">
        "{{BIO}}"
      </div>
      
      <div style="margin-bottom: 30px;">
        <div style="font-size: 12px; color: #999; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Interests</div>
        <div data-tags style="display: flex; flex-wrap: wrap; gap: 8px;">
          <!-- JS 生成标签 -->
          <div style="display:none;">{{TAGS}}</div>
        </div>
      </div>
      
      <div style="margin-top: auto;">
        <div style="font-size: 12px; color: #999; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Basic Info</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #333;">
          <div>📏 {{AGE}}岁</div>
          <div>⭐ {{星座}}</div>
          <div>💼 {{JOB}}</div>
          <div>🎓 本科</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #ccc;">
        Tap to flip back
      </div>
    </div>
    
  </div>
</div>
    `.trim()
}
