import { TheatreTemplate } from '../../theatreTemplates'

export const musicPlayerTemplate: TheatreTemplate = {
    id: 'music_player',
    category: '娱乐休闲',
    name: '音乐播放器',
    keywords: ['音乐', '播放器', '正在播放', '歌曲'],
    fields: [
      { key: 'SONG', label: '歌曲名', placeholder: '晴天' },
      { key: 'ARTIST', label: '歌手', placeholder: '周杰伦' },
      { key: 'ALBUM', label: '专辑', placeholder: '叶惠美' },
      { key: 'DURATION', label: '时长', placeholder: '04:28' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 封面区 -->
  <div style="background: #2d3436; padding: 40px; text-align: center;">
    <div style="width: 160px; height: 160px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: 600;">MUSIC</div>
  </div>
  
  <!-- 歌曲信息 -->
  <div style="padding: 24px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 20px; font-weight: bold; color: #2d3436; margin-bottom: 6px;">{{SONG}}</div>
      <div style="font-size: 15px; color: #636e72;">{{ARTIST}}</div>
      <div style="font-size: 13px; color: #999; margin-top: 4px;">{{ALBUM}}</div>
    </div>
    
    <!-- 进度条 -->
    <div style="margin-bottom: 20px;">
      <div style="height: 4px; background: #e5e5e5; border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
        <div style="width: 45%; height: 100%; background: #0984e3;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #999;">
        <div>02:00</div>
        <div>{{DURATION}}</div>
      </div>
    </div>
    
    <!-- 控制按钮 -->
    <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-size: 18px;">⏮</div>
      <div data-play-btn style="width: 56px; height: 56px; border-radius: 50%; background: #0984e3; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; cursor: pointer; transition: transform 0.2s;">▶</div>
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-size: 18px;">⏭</div>
    </div>
  </div>
</div>
    `.trim()
  }
