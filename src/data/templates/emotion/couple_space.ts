import { TheatreTemplate } from '../../theatreTemplates'

export const coupleSpaceTemplate: TheatreTemplate = {
  id: 'couple_space',
  category: '情感关系',
  name: '情侣空间',
  keywords: ['情侣', '恋爱', '纪念日', '空间', '秀恩爱'],
  fields: [
    { key: 'BOY_NAME', label: '男方昵称', placeholder: '猪猪' },
    { key: 'GIRL_NAME', label: '女方昵称', placeholder: '宝宝' },
    { key: 'DAYS_COUNT', label: '相恋天数', placeholder: '520' },
    { key: 'BACKGROUND_IMAGE', label: '背景图描述', placeholder: '星空下的海边' },
    { key: 'NEXT_ANNIVERSARY', label: '下一个纪念日', placeholder: '恋爱两周年' },
    { key: 'DAYS_LEFT', label: '倒计时天数', placeholder: '12' },
    { key: 'DIARY_DATE', label: '日记日期', placeholder: '11月23日' },
    { key: 'DIARY_CONTENT', label: '甜蜜日记', placeholder: '今天一起去吃了火锅，你帮我剥虾的样子真帅！以后也要一直这样开心下去~' },
    { key: 'NOTE_TEXT', label: '便利贴留言', placeholder: '记得按时吃饭，想你！❤️' },
  ],
  htmlTemplate: `
<div id="couple-space-app" style="width: 100%; max-width: 375px; margin: 0 auto; background: #fbfcfd; border-radius: 30px; overflow: hidden; border: 8px solid #333; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; user-select: none; aspect-ratio: 9/19.5; display: flex; flex-direction: column;">
  
  <!-- 顶部背景区 -->
  <div style="position: relative; height: 240px; background: linear-gradient(to bottom, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);">
    <!-- 装饰：星星/粒子 -->
    <div style="position: absolute; top: 20px; left: 20px; font-size: 12px; color: white; opacity: 0.8;">✨</div>
    <div style="position: absolute; top: 40px; right: 30px; font-size: 16px; color: white; opacity: 0.6;">✨</div>
    <div style="position: absolute; bottom: 80px; left: 50px; font-size: 10px; color: white; opacity: 0.5;">✨</div>

    <!-- 顶部状态栏占位 -->
    <div style="height: 44px;"></div>

    <!-- 核心信息：天数 -->
    <div style="text-align: center; color: white; margin-top: 10px;">
      <div style="font-size: 14px; letter-spacing: 2px; opacity: 0.9;">我们相爱了</div>
      <div style="font-size: 48px; font-weight: 800; font-family: 'Didot', serif; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">{{DAYS_COUNT}}</div>
      <div style="font-size: 12px; letter-spacing: 4px; opacity: 0.8;">DAYS</div>
    </div>

    <!-- 头像连接区 -->
    <div style="position: absolute; bottom: -30px; width: 100%; display: flex; justify-content: center; align-items: center; gap: 15px;">
      <div style="display: flex; flex-direction: column; align-items: center;">
         <div style="width: 64px; height: 64px; border-radius: 50%; background: #fff; padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
           <div style="width: 100%; height: 100%; border-radius: 50%; background: #a18cd1; display: flex; align-items: center; justify-content: center; font-size: 28px;">👦</div>
         </div>
         <div style="font-size: 12px; color: #666; margin-top: 6px; font-weight: 600;">{{BOY_NAME}}</div>
      </div>
      
      <div style="font-size: 20px; color: #ff6b6b; margin-bottom: 20px; animation: heartbeat 1.5s infinite;">❤️</div>
      
      <div style="display: flex; flex-direction: column; align-items: center;">
         <div style="width: 64px; height: 64px; border-radius: 50%; background: #fff; padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
           <div style="width: 100%; height: 100%; border-radius: 50%; background: #ff9a9e; display: flex; align-items: center; justify-content: center; font-size: 28px;">👧</div>
         </div>
         <div style="font-size: 12px; color: #666; margin-top: 6px; font-weight: 600;">{{GIRL_NAME}}</div>
      </div>
    </div>
  </div>

  <!-- 内容滚动区 -->
  <div style="flex: 1; overflow-y: auto; padding: 45px 20px 20px; background: #fbfcfd;">
    
    <!-- 纪念日卡片 -->
    <div style="background: white; border-radius: 16px; padding: 15px 20px; box-shadow: 0 4px 20px rgba(255, 154, 158, 0.15); display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">下一个纪念日</div>
        <div style="font-size: 16px; font-weight: 700; color: #333;">{{NEXT_ANNIVERSARY}}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 12px; color: #999; margin-right: 2px;">还有</span>
        <span style="font-size: 24px; font-weight: 800; color: #ff6b6b;">{{DAYS_LEFT}}</span>
        <span style="font-size: 12px; color: #999;">天</span>
      </div>
    </div>

    <!-- 功能按钮组 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
       <div class="interactive-btn" onclick="showHeart(this)" style="background: #fff0f6; padding: 15px; border-radius: 16px; text-align: center; cursor: pointer; transition: transform 0.1s;">
         <div style="font-size: 24px; margin-bottom: 5px;">🤗</div>
         <div style="font-size: 13px; font-weight: 600; color: #d63384;">抱抱 Ta</div>
         <div style="font-size: 10px; color: #e6a8bc; margin-top: 2px;">今日已抱 3 次</div>
       </div>
       <div class="interactive-btn" onclick="showHeart(this)" style="background: #fff7e6; padding: 15px; border-radius: 16px; text-align: center; cursor: pointer; transition: transform 0.1s;">
         <div style="font-size: 24px; margin-bottom: 5px;">💋</div>
         <div style="font-size: 13px; font-weight: 600; color: #d46b08;">亲亲 Ta</div>
         <div style="font-size: 10px; color: #ffd591; margin-top: 2px;">今日已亲 5 次</div>
       </div>
    </div>

    <!-- 甜蜜日记 (拍立得风格) -->
    <div style="background: white; padding: 12px 12px 20px 12px; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 25px; transform: rotate(-2deg); position: relative;">
      <!-- 胶带装饰 -->
      <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 80px; height: 25px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(2px); border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 2px 5px rgba(0,0,0,0.1);"></div>
      
      <div style="width: 100%; aspect-ratio: 4/3; background: #eee; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 2px;">
        <div style="font-size: 40px;">📸</div>
        <div style="position: absolute; bottom: 5px; right: 5px; font-size: 10px; color: white; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 10px;">{{BACKGROUND_IMAGE}}</div>
      </div>
      
      <div style="padding: 0 10px;">
        <div style="font-size: 12px; color: #999; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
          <span>📅 {{DIARY_DATE}}</span>
          <span style="width: 3px; height: 3px; background: #ccc; border-radius: 50%;"></span>
          <span>🌤️ 晴</span>
        </div>
        <div style="font-size: 14px; color: #444; line-height: 1.6; font-family: 'cursive';">
          {{DIARY_CONTENT}}
        </div>
      </div>
    </div>

    <!-- 装饰：便利贴留言 -->
    <div style="background: #fffbe6; padding: 15px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #ffe58f; margin-bottom: 20px; position: relative;">
      <div style="font-size: 13px; color: #555; line-height: 1.5;">
        "{{NOTE_TEXT}}"
      </div>
      <div style="position: absolute; right: 10px; bottom: 10px; font-size: 10px; color: #999;">—— {{GIRL_NAME}}</div>
    </div>

  </div>

  <!-- 底部 Tab -->
  <div style="height: 60px; background: white; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #f0f0f0;">
    <div style="display: flex; flex-direction: column; align-items: center; color: #ff6b6b;">
      <div style="font-size: 20px;">🏠</div>
      <div style="font-size: 10px; margin-top: 2px;">小窝</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #ccc;">
      <div style="font-size: 20px;">📖</div>
      <div style="font-size: 10px; margin-top: 2px;">日记</div>
    </div>
    <div style="width: 40px; height: 40px; background: #ff6b6b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-top: -20px; box-shadow: 0 4px 10px rgba(255, 107, 107, 0.4); font-size: 20px;">
      +
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #ccc;">
      <div style="font-size: 20px;">🎁</div>
      <div style="font-size: 10px; margin-top: 2px;">愿望</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #ccc;">
      <div style="font-size: 20px;">👤</div>
      <div style="font-size: 10px; margin-top: 2px;">我的</div>
    </div>
  </div>

  <script>
    // 动画脚本
    function showHeart(element) {
      element.style.transform = 'scale(0.95)';
      setTimeout(() => element.style.transform = 'scale(1)', 100);

      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.position = 'absolute';
      heart.style.left = (element.getBoundingClientRect().left + element.offsetWidth/2 - 10) + 'px';
      heart.style.top = (element.getBoundingClientRect().top) + 'px';
      heart.style.fontSize = '20px';
      heart.style.pointerEvents = 'none';
      heart.style.zIndex = '100';
      heart.style.transition = 'all 1s ease-out';
      
      // 这里因为是内嵌HTML，无法直接获取document.body，只能在容器内操作
      // 简化处理：直接在按钮内部添加
      const miniHeart = document.createElement('div');
      miniHeart.innerText = '❤️';
      miniHeart.style.position = 'absolute';
      miniHeart.style.top = '50%';
      miniHeart.style.left = '50%';
      miniHeart.style.transform = 'translate(-50%, -50%)';
      miniHeart.style.opacity = '1';
      miniHeart.style.fontSize = '20px';
      miniHeart.style.transition = 'all 0.8s ease-out';
      
      element.appendChild(miniHeart);
      
      // 强制重绘
      void miniHeart.offsetWidth;
      
      miniHeart.style.top = '-50%';
      miniHeart.style.opacity = '0';
      
      setTimeout(() => miniHeart.remove(), 800);
    }
  </script>

  <style>
    @keyframes heartbeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  </style>
</div>
  `.trim()
}
