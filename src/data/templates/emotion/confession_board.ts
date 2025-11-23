import { TheatreTemplate } from '../../theatreTemplates'

export const confessionBoardTemplate: TheatreTemplate = {
    id: 'confession_board',
    category: '情感关系',
    name: '表白墙',
    keywords: ['表白墙', '表白', '告白墙', '论坛'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '致我喜欢的女孩' },
      { key: 'CONTENT', label: '内容', placeholder: '我一直默默关注你很久了...' },
      { key: 'AUTHOR', label: '发帖人', placeholder: '匿名用户' },
      { key: 'TIME', label: '时间', placeholder: '2小时前' },
      { key: 'LIKE', label: '点赞数', placeholder: '128' },
      { key: 'COMMENT1', label: '评论1', placeholder: '祝福你们' },
      { key: 'COMMENT2', label: '评论2', placeholder: '好甜' },
      { key: 'COMMENT3', label: '评论3', placeholder: '加油！' }
    ],
    htmlTemplate: `
<div style="
  max-width: 380px; 
  margin: 0 auto; 
  background: linear-gradient(135deg, #ffeef8 0%, #fff0f6 50%, #f3e5f5 100%);
  border-radius: 16px; 
  overflow: hidden; 
  box-shadow: 0 8px 24px rgba(233, 30, 99, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
">
  <!-- 顶部用户信息 -->
  <div style="padding: 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);">
    <div style="display: flex; align-items: center; gap: 12px;">
      <!-- 匿名头像 -->
      <div style="
        width: 44px; 
        height: 44px; 
        border-radius: 50%; 
        background: linear-gradient(135deg, #f48fb1, #ec407a);
        display: flex; 
        align-items: center; 
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(236, 64, 122, 0.3);
      ">
        💌
      </div>
      
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #333;">{{AUTHOR}}</div>
        <div style="font-size: 12px; color: #999; margin-top: 2px;">{{TIME}}</div>
      </div>

      <!-- 表白墙标签 -->
      <div style="
        background: linear-gradient(135deg, #f48fb1, #ec407a);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
      ">
        表白墙
      </div>
    </div>
  </div>

  <!-- 内容区 -->
  <div style="padding: 20px; background: white;">
    <!-- 标题 -->
    <div style="
      font-size: 18px; 
      font-weight: bold; 
      color: #d81b60; 
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    ">
      <span style="font-size: 16px;">💕</span>
      <span>{{TITLE}}</span>
    </div>

    <!-- 正文 -->
    <div style="
      font-size: 15px; 
      line-height: 1.8; 
      color: #333; 
      white-space: pre-wrap;
      padding: 16px;
      background: linear-gradient(135deg, #fff9fb 0%, #fff 100%);
      border-left: 3px solid #f48fb1;
      border-radius: 8px;
    ">
      {{CONTENT}}
    </div>

    <!-- 互动栏 -->
    <div style="
      display: flex; 
      align-items: center; 
      gap: 24px; 
      margin-top: 16px; 
      padding-top: 12px; 
      border-top: 1px solid #f5f5f5;
    ">
      <div style="display: flex; align-items: center; gap: 6px; color: #ec407a; font-size: 14px; cursor: pointer;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span style="font-weight: 600;">{{LIKE}}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; color: #999; font-size: 14px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>3</span>
      </div>
    </div>
  </div>

  <!-- 评论区 -->
  <div style="background: #fafafa; padding: 16px;">
    <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
      <span>💬</span>
      <span>热门评论</span>
    </div>

    <!-- 评论1 -->
    <div style="
      background: white; 
      padding: 12px; 
      border-radius: 8px; 
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    ">
      <div style="display: flex; gap: 10px;">
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #ce93d8, #ab47bc);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">
          😊
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: #333; line-height: 1.5;">{{COMMENT1}}</div>
        </div>
      </div>
    </div>

    <!-- 评论2 -->
    <div style="
      background: white; 
      padding: 12px; 
      border-radius: 8px; 
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    ">
      <div style="display: flex; gap: 10px;">
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #81d4fa, #29b6f6);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">
          🥰
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: #333; line-height: 1.5;">{{COMMENT2}}</div>
        </div>
      </div>
    </div>

    <!-- 评论3 -->
    <div style="
      background: white; 
      padding: 12px; 
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    ">
      <div style="display: flex; gap: 10px;">
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #a5d6a7, #66bb6a);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">
          💪
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: #333; line-height: 1.5;">{{COMMENT3}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
