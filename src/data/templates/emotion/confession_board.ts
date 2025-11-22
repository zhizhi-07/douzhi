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
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#fff;padding:16px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:38px;height:38px;border-radius:50%;background:#ff3b30;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600;flex-shrink:0">匿</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;color:#000">{{AUTHOR}}</div>
        <div style="font-size:12px;color:#8e8e93">{{TIME}}</div>
      </div>
    </div>
    
    <div style="font-size:17px;font-weight:600;color:#000;margin-bottom:10px">{{TITLE}}</div>
    <div style="font-size:15px;color:#000;line-height:1.6">{{CONTENT}}</div>
    
    <div style="display:flex;gap:20px;margin-top:14px;padding-top:12px">
      <div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#8e8e93">
        <span style="color:#ff3b30">♡</span>
        <span>{{LIKE}}</span>
      </div>
      <div style="font-size:13px;color:#8e8e93">评论 3</div>
    </div>
  </div>
  
  <div style="background:#f9f9f9;padding:12px 16px">
    <div style="font-size:13px;font-weight:600;color:#000;margin-bottom:10px">评论</div>
    <div style="margin-bottom:8px;padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT1}}</div>
    </div>
    <div style="margin-bottom:8px;padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT2}}</div>
    </div>
    <div style="padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT3}}</div>
    </div>
  </div>
</div>
    `.trim()
  }
