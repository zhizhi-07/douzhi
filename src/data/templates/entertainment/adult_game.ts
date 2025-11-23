import { TheatreTemplate } from '../../theatreTemplates'

export const adultGameTemplate: TheatreTemplate = {
    id: 'adult_game',
    category: '娱乐休闲',
    name: '互动游戏',
    keywords: ['游戏', 'galgame', '互动', '剧情'],
    fields: [
      { key: 'CHARACTER', label: '角色名', placeholder: '神秘少女' },
      { key: 'FAVORABILITY', label: '好感度', placeholder: '85' },
      { key: 'DIALOGUE', label: '台词', placeholder: '如果不选我的话...会有惩罚哦？' },
      { key: 'INNER_THOUGHTS', label: '内心独白', placeholder: '（明明很想让他选我，却还要装作不在意...笨蛋...）' },
      { key: 'OPTION_A', label: '选项A', placeholder: '乖乖听话' },
      { key: 'OPTION_B', label: '转身离开' },
      { key: 'SCENE', label: '场景', placeholder: '深夜的教室' },
      { key: 'SECRET_CLUE', label: '隐藏线索', placeholder: '她紧握的手心里似乎藏着一封信。' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #2d3436; border-radius: 12px; overflow: hidden; font-family: 'Segoe UI', sans-serif; position: relative; height: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
  <!-- 背景图 (模拟) -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, #a8c0ff, #3f2b96); opacity: 0.5;"></div>
  
  <!-- 好感度 (可点击) -->
  <div style="position: absolute; top: 15px; right: 15px; z-index: 10; cursor: pointer;" data-action="show-favorability">
    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 20px; color: #ff7675;">
      <span style="font-size: 18px; margin-right: 5px;">❤</span>
      <span style="font-weight: bold;">{{FAVORABILITY}}</span>
    </div>
  </div>

  <!-- 角色立绘 (模拟) - 可点击 -->
  <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 200px; height: 350px; background: radial-gradient(circle at 50% 30%, #fab1a0, transparent); opacity: 0.8; filter: blur(20px); cursor: pointer;" data-action="touch-character"></div>
  <div style="position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 180px; height: 280px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2); font-size: 100px; pointer-events: none;">?</div>

  <!-- UI层 -->
  <div style="position: absolute; bottom: 20px; left: 10px; right: 10px; display: flex; flex-direction: column; gap: 10px;">
    
    <!-- 对话框 -->
    <div style="background: rgba(0,0,0,0.8); border: 2px solid #74b9ff; border-radius: 8px; padding: 15px; color: white; position: relative;">
      <div style="position: absolute; top: -12px; left: 10px; background: #74b9ff; color: #000; padding: 2px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;">{{CHARACTER}}</div>
      <div style="font-size: 14px; line-height: 1.5; min-height: 40px;">
        <span style="color: #fab1a0;">"</span>{{DIALOGUE}}<span style="color: #fab1a0;">"</span>
        <span style="display: inline-block; width: 8px; height: 14px; background: #fff; animation: blink 1s infinite; vertical-align: middle; margin-left: 5px;"></span>
      </div>
    </div>

    <!-- 选项 -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div data-option="A" style="background: rgba(255,255,255,0.9); color: #2d3436; padding: 10px; text-align: center; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; border-left: 4px solid #00b894;">
        A. {{OPTION_A}}
      </div>
      <div data-option="B" style="background: rgba(255,255,255,0.9); color: #2d3436; padding: 10px; text-align: center; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; border-left: 4px solid #e17055;">
        B. {{OPTION_B}}
      </div>
    </div>
  </div>
  
  <!-- 隐藏数据 -->
  <div hidden data-inner-thoughts>{{INNER_THOUGHTS}}</div>
  <div hidden data-secret-clue>{{SECRET_CLUE}}</div>
  
  <style>
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } 100% { transform: translateX(0); } }
  </style>
</div>
    `.trim()
  }
