import { TheatreTemplate } from '../../theatreTemplates'

export const leaderboardTemplate: TheatreTemplate = {
  id: 'leaderboard',
  category: '娱乐休闲',
  name: '排行榜',
  keywords: ['排行', '排名', '榜单'],
  fields: [
    { key: 'BOARD_NAME', label: '榜单', placeholder: '王者荣耀段位榜' },
    { key: 'MY_RANK', label: '我的排名', placeholder: '8' },
    { key: 'MY_SCORE', label: '我的分数', placeholder: '王者50星' },
    { key: 'RANK1_NAME', label: 'No.1', placeholder: '梦泪' },
    { key: 'RANK1_SCORE', label: '分1', placeholder: '王者100星' },
    { key: 'RANK2_NAME', label: 'No.2', placeholder: '一诺' },
    { key: 'RANK2_SCORE', label: '分2', placeholder: '王者98星' },
  ],
  htmlTemplate: `
<div data-leaderboard style="background: linear-gradient(180deg, #4b6cb7 0%, #182848 100%); width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 16px; overflow: hidden; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
  <div style="text-align: center; padding: 20px 0 30px;">
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">{{BOARD_NAME}}</div>
    <div style="font-size: 12px; opacity: 0.7;">每周一更新</div>
  </div>
  
  <div style="background: white; border-radius: 20px 20px 0 0; padding: 20px; color: #333; min-height: 200px;">
    <!-- Top 3 Podium (Simplified) -->
    <div style="display: flex; justify-content: center; align-items: flex-end; margin-bottom: 30px; margin-top: -40px;">
      <div style="text-align: center; margin: 0 10px;">
        <div style="font-size: 12px; color: white; margin-bottom: 5px; font-weight: bold;">{{RANK2_NAME}}</div>
        <div style="width: 60px; height: 70px; background: #c0c0c0; border-radius: 8px 8px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid white;">
          <span style="font-size: 20px; font-weight: bold; color: #fff;">2</span>
        </div>
      </div>
      <div style="text-align: center; margin: 0 10px; z-index: 1;">
        <div style="width: 50px; height: 20px; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCAyMCI+PHBhdGggZD0iTTI1IDAgTDMwIDEwIEw0MCAxMCBMMzIgMTUgTDM1IDI1IEwyNSAyMCBMMTUgMjUgTDE4IDE1IEwxMCAxMCBMMjAgMTAgWiIgZmlsbD0iI2ZmZCIvPjwvc3ZnPg==') no-repeat center; background-size: contain; margin: 0 auto;"></div>
        <div style="font-size: 12px; color: white; margin-bottom: 5px; font-weight: bold;">{{RANK1_NAME}}</div>
        <div style="width: 70px; height: 90px; background: #ffd700; border-radius: 8px 8px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);">
          <span style="font-size: 24px; font-weight: bold; color: #fff;">1</span>
        </div>
      </div>
      <div style="text-align: center; margin: 0 10px;">
        <div style="font-size: 12px; color: white; margin-bottom: 5px; font-weight: bold;">???</div>
        <div style="width: 60px; height: 60px; background: #cd7f32; border-radius: 8px 8px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid white;">
          <span style="font-size: 20px; font-weight: bold; color: #fff;">3</span>
        </div>
      </div>
    </div>
    
    <!-- My Rank -->
    <div style="background: #f5f5f5; padding: 10px 15px; border-radius: 10px; display: flex; align-items: center; margin-bottom: 10px; border: 1px solid #eee;">
      <div style="font-weight: bold; color: #666; width: 25px;">{{MY_RANK}}</div>
      <div style="width: 30px; height: 30px; background: #ddd; border-radius: 50%; margin-right: 10px;"></div>
      <div style="flex: 1; font-weight: bold;">我</div>
      <div style="font-weight: bold; color: #4b6cb7;">{{MY_SCORE}}</div>
    </div>
  </div>
</div>
  `.trim()
}
