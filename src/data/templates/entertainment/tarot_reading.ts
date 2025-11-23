import { TheatreTemplate } from '../../theatreTemplates'

export const tarotReadingTemplate: TheatreTemplate = {
  id: 'tarot_reading',
  category: '娱乐休闲',
  name: '塔罗占卜',
  keywords: ['塔罗', '占卜', '抽牌', '运势'],
  fields: [
    { key: 'QUESTION', label: '问题', placeholder: '我的运势如何' },
    { key: 'CARD1_NAME', label: '牌1名称', placeholder: '愚者' },
    { key: 'CARD1_DESC', label: '牌1解读', placeholder: '新的开始' },
    { key: 'CARD2_NAME', label: '牌2名称', placeholder: '力量' },
    { key: 'CARD2_DESC', label: '牌2解读', placeholder: '内在的力量' },
    { key: 'CARD3_NAME', label: '牌3名称', placeholder: '命运之轮' },
    { key: 'CARD3_DESC', label: '牌3解读', placeholder: '转机' },
  ],
  htmlTemplate: `
<div style="
  width: 100%;
  max-width: 400px;
  background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%);
  border: 1px solid #4a3b69;
  border-radius: 12px;
  padding: 20px;
  color: #e0d2f4;
  font-family: 'Georgia', serif;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  overflow: hidden;
  position: relative;
">
  <!-- 装饰背景 -->
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>
  
  <div style="text-align: center; margin-bottom: 20px; position: relative; z-index: 2;">
    <div style="font-size: 14px; color: #9f8bb0; letter-spacing: 2px; margin-bottom: 4px;">TAROT READING</div>
    <div style="font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(183, 148, 244, 0.5);">{{QUESTION}}</div>
  </div>

  <div style="display: flex; justify-content: space-between; gap: 10px; perspective: 1000px; position: relative; z-index: 2;">
    <!-- 卡片 1 -->
    <div class="tarot-card-container" style="width: 32%; aspect-ratio: 2/3; cursor: pointer;" onclick="this.querySelector('.tarot-inner').style.transform = 'rotateY(180deg)'">
      <div class="tarot-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.8s; transform-style: preserve-3d;">
        <!-- 背面 -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: linear-gradient(135deg, #2c1e3f, #120920);
          border: 2px solid #ffd700;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 24px;">🔮</div>
        </div>
        <!-- 正面 -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateY(180deg);
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        ">
          <div style="flex: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(to bottom, #e6e9f0 0%, #eef1f5 100%);">
            🃏
          </div>
          <div style="padding: 8px 4px; background: #fff; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 2px;">{{CARD1_NAME}}</div>
            <div style="font-size: 10px; color: #666; line-height: 1.2;">{{CARD1_DESC}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片 2 -->
    <div class="tarot-card-container" style="width: 32%; aspect-ratio: 2/3; cursor: pointer;" onclick="this.querySelector('.tarot-inner').style.transform = 'rotateY(180deg)'">
      <div class="tarot-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.8s; transform-style: preserve-3d;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: linear-gradient(135deg, #2c1e3f, #120920);
          border: 2px solid #ffd700;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 24px;">🔮</div>
        </div>
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateY(180deg);
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        ">
          <div style="flex: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(to bottom, #e6e9f0 0%, #eef1f5 100%);">
            🌙
          </div>
          <div style="padding: 8px 4px; background: #fff; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 2px;">{{CARD2_NAME}}</div>
            <div style="font-size: 10px; color: #666; line-height: 1.2;">{{CARD2_DESC}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片 3 -->
    <div class="tarot-card-container" style="width: 32%; aspect-ratio: 2/3; cursor: pointer;" onclick="this.querySelector('.tarot-inner').style.transform = 'rotateY(180deg)'">
      <div class="tarot-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.8s; transform-style: preserve-3d;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: linear-gradient(135deg, #2c1e3f, #120920);
          border: 2px solid #ffd700;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 24px;">🔮</div>
        </div>
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateY(180deg);
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        ">
          <div style="flex: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(to bottom, #e6e9f0 0%, #eef1f5 100%);">
            ⭐
          </div>
          <div style="padding: 8px 4px; background: #fff; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 2px;">{{CARD3_NAME}}</div>
            <div style="font-size: 10px; color: #666; line-height: 1.2;">{{CARD3_DESC}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 15px; text-align: center; font-size: 11px; color: #8a7a9e;">
    点击卡牌翻开解读
  </div>
</div>
  `.trim()
}
