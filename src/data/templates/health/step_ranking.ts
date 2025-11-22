import { TheatreTemplate } from '../../theatreTemplates'

export const stepRankingTemplate: TheatreTemplate = {
    id: 'step_ranking',
    category: '健康医疗',
    name: '步数排行',
    keywords: ['步数', '运动排行', '微信运动', '步数排行'],
    fields: [
      { key: 'TIME', label: '时间', placeholder: '15:30' },
      { key: 'DATE', label: '日期', placeholder: '11月22日' },
      { key: 'MY_STEPS', label: '我的步数', placeholder: '12580' },
      { key: 'MY_RANK', label: '我的排名', placeholder: '3' },
      { key: 'MY_NAME', label: '我的昵称', placeholder: '我' },
      { key: 'RANK1_NAME', label: '第1名昵称', placeholder: '运动达人' },
      { key: 'RANK1_STEPS', label: '第1名步数', placeholder: '18520' },
      { key: 'RANK2_NAME', label: '第2名昵称', placeholder: '健康使者' },
      { key: 'RANK2_STEPS', label: '第2名步数', placeholder: '15230' },
      { key: 'RANK3_NAME', label: '第3名昵称', placeholder: '快乐行者' },
      { key: 'RANK3_STEPS', label: '第3名步数', placeholder: '12580' },
      { key: 'RANK4_NAME', label: '第4名昵称', placeholder: '小明' },
      { key: 'RANK4_STEPS', label: '第4名步数', placeholder: '10250' },
      { key: 'RANK5_NAME', label: '第5名昵称', placeholder: '小红' },
      { key: 'RANK5_STEPS', label: '第5名步数', placeholder: '9800' }
    ],
    htmlTemplate: `
<div style="max-width: 375px; margin: 0 auto; background: linear-gradient(to bottom, #f7f7f7 0%, #ededed 100%); border-radius: 0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
  <!-- 状态栏 -->
  <div style="background: #f7f7f7; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: #000;">
    <div style="flex: 1;">{{TIME}}</div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" style="opacity: 0.5;">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <span style="font-size: 11px;">中国移动</span>
      <svg width="14" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" style="opacity: 0.7;">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <path d="M12 20h.01"/>
      </svg>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 3px;">
      <span style="font-size: 11px;">100%</span>
      <svg width="20" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
        <rect x="2" y="7" width="18" height="10" rx="2"/>
        <rect x="4" y="9" width="14" height="6" fill="#000"/>
        <line x1="21" y1="10" x2="21" y2="14" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
  
  <!-- 导航栏 -->
  <div style="background: #ededed; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5px solid #c8c8c8;">
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span style="font-size: 15px; font-weight: 600; color: #000;">微信运动</span>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  </div>
  
  <!-- 内容区 -->
  <div style="background: #ededed; min-height: 450px;">
    <!-- 日期标签 -->
    <div style="text-align: center; padding: 16px 0 12px 0;">
      <span style="background: rgba(0,0,0,0.08); color: #888; font-size: 11px; padding: 3px 10px; border-radius: 10px;">{{DATE}}</span>
    </div>
    
    <!-- 我的步数卡片 -->
    <div style="margin: 0 12px 16px 12px; background: #fff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="font-size: 13px; color: #888; margin-bottom: 8px;">我的步数</div>
      <div style="font-size: 52px; font-weight: 700; color: #07c160; margin-bottom: 6px; font-family: -apple-system-headline;">{{MY_STEPS}}</div>
      <div style="display: inline-block; background: #fef6e6; color: #d4a029; font-size: 12px; padding: 4px 12px; border-radius: 12px; font-weight: 500;">排名第 {{MY_RANK}} 名</div>
    </div>
    
    <!-- 排行榜卡片 -->
    <div style="margin: 0 12px 16px 12px; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 14px; padding-left: 4px;">步数排行榜</div>
      
      <!-- 第1名 -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin-bottom: 2px;">
        <div style="width: 20px; text-align: center; font-size: 17px; font-weight: 700; color: #ffd700;">1</div>
        <div style="width: 42px; height: 42px; border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; font-weight: 600;">{{RANK1_NAME_INITIAL}}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 500; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{RANK1_NAME}}</div>
          <div style="font-size: 13px; color: #888; margin-top: 2px;">{{RANK1_STEPS}} 步</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffd700" style="flex-shrink: 0;">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
      
      <!-- 第2名 -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin-bottom: 2px;">
        <div style="width: 20px; text-align: center; font-size: 17px; font-weight: 700; color: #c0c0c0;">2</div>
        <div style="width: 42px; height: 42px; border-radius: 4px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; font-weight: 600;">{{RANK2_NAME_INITIAL}}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 500; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{RANK2_NAME}}</div>
          <div style="font-size: 13px; color: #888; margin-top: 2px;">{{RANK2_STEPS}} 步</div>
        </div>
      </div>
      
      <!-- 第3名 -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin-bottom: 2px;">
        <div style="width: 20px; text-align: center; font-size: 17px; font-weight: 700; color: #cd7f32;">3</div>
        <div style="width: 42px; height: 42px; border-radius: 4px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; font-weight: 600;">{{RANK3_NAME_INITIAL}}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 500; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{RANK3_NAME}}</div>
          <div style="font-size: 13px; color: #888; margin-top: 2px;">{{RANK3_STEPS}} 步</div>
        </div>
      </div>
      
      <!-- 第4名 -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin-bottom: 2px;">
        <div style="width: 20px; text-align: center; font-size: 16px; font-weight: 600; color: #999;">4</div>
        <div style="width: 42px; height: 42px; border-radius: 4px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; font-weight: 600;">{{RANK4_NAME_INITIAL}}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 500; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{RANK4_NAME}}</div>
          <div style="font-size: 13px; color: #888; margin-top: 2px;">{{RANK4_STEPS}} 步</div>
        </div>
      </div>
      
      <!-- 第5名 -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 8px;">
        <div style="width: 20px; text-align: center; font-size: 16px; font-weight: 600; color: #999;">5</div>
        <div style="width: 42px; height: 42px; border-radius: 4px; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; font-weight: 600;">{{RANK5_NAME_INITIAL}}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 500; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{RANK5_NAME}}</div>
          <div style="font-size: 13px; color: #888; margin-top: 2px;">{{RANK5_STEPS}} 步</div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div style="margin: 0 12px 16px 12px; display: flex; gap: 10px;">
      <div id="likeBtn" onclick="
        var btn = this;
        var isLiked = btn.getAttribute('data-liked') === 'true';
        if (isLiked) {
          btn.style.background = 'linear-gradient(135deg, #07c160 0%, #05a854 100%)';
          btn.innerHTML = '点赞';
          btn.setAttribute('data-liked', 'false');
        } else {
          btn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
          btn.innerHTML = '已赞';
          btn.setAttribute('data-liked', 'true');
        }
      " data-liked="false" style="flex: 1; background: linear-gradient(135deg, #07c160 0%, #05a854 100%); border-radius: 8px; padding: 13px; text-align: center; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; user-select: none; transition: all 0.3s; box-shadow: 0 3px 12px rgba(7,193,96,0.4); border: none;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">点赞</div>
      <div id="shareBtn" onclick="
        var btn = this;
        var originalText = btn.innerHTML;
        btn.innerHTML = '✓ 分享成功';
        btn.style.background = 'linear-gradient(135deg, #07c160 0%, #05a854 100%)';
        btn.style.color = '#fff';
        setTimeout(function() {
          btn.innerHTML = originalText;
          btn.style.background = '#fff';
          btn.style.color = '#000';
        }, 1500);
      " style="flex: 1; background: #fff; border-radius: 8px; padding: 13px; text-align: center; color: #000; font-size: 15px; font-weight: 600; box-shadow: 0 3px 12px rgba(0,0,0,0.08); cursor: pointer; user-select: none; transition: all 0.3s; border: 1px solid #e5e5e5;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">分享</div>
    </div>
  </div>
</div>
    `.trim()
  }
