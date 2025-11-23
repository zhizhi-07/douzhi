import { TheatreTemplate } from '../../theatreTemplates'

export const retroGameTemplate: TheatreTemplate = {
  id: 'retro_game',
  category: '娱乐休闲',
  name: '复古游戏机',
  keywords: ['游戏机', '掌机', '游戏', 'GameBoy'],
  fields: [
    { key: 'GAME_TITLE', label: '游戏名称', placeholder: 'TETRIS' },
    { key: 'SCORE', label: '得分', placeholder: '9999' },
    { key: 'LEVEL', label: '关卡', placeholder: '05' },
    { key: 'PLAYER_NAME', label: '玩家', placeholder: 'PLAYER1' },
  ],
  htmlTemplate: `
<div style="
  width: 300px;
  background: #c0c0c0;
  border-radius: 10px 10px 30px 10px;
  padding: 20px 15px 30px;
  box-shadow: 4px 4px 0 #888, inset -2px -2px 5px rgba(0,0,0,0.2);
  font-family: 'Courier New', monospace;
  position: relative;
  margin: 0 auto;
">
  <!-- 屏幕边框 -->
  <div style="
    background: #555;
    border-radius: 8px 8px 20px 8px;
    padding: 15px 20px;
    box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5);
    margin-bottom: 20px;
  ">
    <div style="color: #888; font-size: 8px; margin-bottom: 4px; display: flex; justify-content: space-between;">
      <span>DOT MATRIX WITH STEREO SOUND</span>
      <span style="color: #b00;">🔴 BATTERY</span>
    </div>
    
    <!-- 液晶屏幕 -->
    <div class="game-screen" style="
      background: #8bac0f;
      border: 2px solid #708c08;
      height: 140px;
      box-shadow: inset 2px 2px 5px rgba(0,0,0,0.2);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    ">
      <!-- 像素网格效果 -->
      <div style="position: absolute; inset: 0; background-image: linear-gradient(transparent 2px, rgba(15, 56, 15, 0.1) 2px), linear-gradient(90deg, transparent 2px, rgba(15, 56, 15, 0.1) 2px); background-size: 3px 3px; pointer-events: none;"></div>
      
      <div style="color: #0f380f; font-weight: bold; font-size: 18px; letter-spacing: 2px; text-shadow: 1px 1px 0 rgba(139, 172, 15, 0.5); z-index: 1;">
        {{GAME_TITLE}}
      </div>
      
      <div style="margin-top: 15px; width: 80%; z-index: 1;">
        <div style="display: flex; justify-content: space-between; color: #0f380f; font-size: 12px; font-weight: bold; border-bottom: 2px solid #0f380f; padding-bottom: 2px; margin-bottom: 4px;">
          <span>SCORE</span>
          <span>{{SCORE}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #0f380f; font-size: 12px; font-weight: bold;">
          <span>LEVEL</span>
          <span>{{LEVEL}}</span>
        </div>
      </div>
      
      <div style="position: absolute; bottom: 5px; color: #306230; font-size: 10px; font-weight: bold; animation: blink 1s infinite;">
        PRESS START
      </div>
    </div>
  </div>
  
  <!-- NINTENDO LOGO -->
  <div style="color: #333; font-weight: bold; font-style: italic; font-size: 14px; margin-bottom: 20px; letter-spacing: 1px;">
    Nintendo <span style="font-size: 16px;">GAME BOY</span>
  </div>
  
  <!-- 按钮区域 -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px;">
    <!-- 十字键 -->
    <div style="position: relative; width: 70px; height: 70px;">
      <div style="position: absolute; top: 25px; left: 0; width: 70px; height: 20px; background: #222; border-radius: 2px; box-shadow: 1px 1px 2px #000;"></div>
      <div style="position: absolute; top: 0; left: 25px; width: 20px; height: 70px; background: #222; border-radius: 2px; box-shadow: 1px 1px 2px #000;"></div>
      <div style="position: absolute; top: 25px; left: 25px; width: 20px; height: 20px; background: #1a1a1a; border-radius: 50%;"></div> <!-- 中心凹陷 -->
    </div>
    
    <!-- AB键 -->
    <div style="transform: rotate(-25deg); margin-bottom: 10px;">
      <div style="display: flex; gap: 12px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 28px; height: 28px; background: #8f1c3a; border-radius: 50%; box-shadow: 1px 1px 2px #444; cursor: pointer;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'"></div>
          <div style="font-size: 10px; font-weight: bold; color: #333; margin-top: 4px;">B</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: -10px;">
          <div style="width: 28px; height: 28px; background: #8f1c3a; border-radius: 50%; box-shadow: 1px 1px 2px #444; cursor: pointer;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'"></div>
          <div style="font-size: 10px; font-weight: bold; color: #333; margin-top: 4px;">A</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Select/Start -->
  <div style="display: flex; justify-content: center; gap: 10px; margin-top: 30px;">
    <div style="transform: rotate(-25deg); display: flex; flex-direction: column; align-items: center;">
      <div style="width: 40px; height: 10px; background: #666; border-radius: 10px; box-shadow: 0 1px 1px #000;"></div>
      <div style="font-size: 8px; font-weight: bold; color: #333; margin-top: 4px; letter-spacing: 0.5px;">SELECT</div>
    </div>
    <div style="transform: rotate(-25deg); display: flex; flex-direction: column; align-items: center;">
      <div style="width: 40px; height: 10px; background: #666; border-radius: 10px; box-shadow: 0 1px 1px #000;"></div>
      <div style="font-size: 8px; font-weight: bold; color: #333; margin-top: 4px; letter-spacing: 0.5px;">START</div>
    </div>
  </div>
  
  <style>
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  </style>
</div>
  `.trim()
}
