import { TheatreTemplate } from '../../theatreTemplates'

export const commentSectionTemplate: TheatreTemplate = {
  id: 'comment_section',
  category: '社交通讯',
  name: '评论区',
  keywords: ['评论', '回复', '互动'],
  fields: [
    { key: 'POST_TITLE', label: '帖子标题', placeholder: '关于这件事情大家怎么看？' },
    { key: 'COMMENT1_USER', label: '用户1', placeholder: '热心网友' },
    { key: 'COMMENT1_CONTENT', label: '评论1', placeholder: '这也太离谱了吧！完全不敢相信。' },
    { key: 'COMMENT1_LIKES', label: '赞1', placeholder: '1.2w' },
    { key: 'COMMENT2_USER', label: '用户2', placeholder: '吃瓜群众' },
    { key: 'COMMENT2_CONTENT', label: '评论2', placeholder: '前排围观，坐等后续反转。' },
    { key: 'COMMENT2_LIKES', label: '赞2', placeholder: '856' },
  ],
  htmlTemplate: `
<div data-comment-section style="background: #fff; width: 100%; max-width: 320px; margin: 0 auto; font-family: sans-serif; border-radius: 8px 8px 0 0; overflow: hidden; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
  <div style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px;">{{POST_TITLE}}</div>
    <div style="font-size: 12px; color: #999;">全部评论 238</div>
  </div>
  
  <div style="padding: 0 15px;">
    <!-- Comment 1 (Hot) -->
    <div style="padding: 15px 0; border-bottom: 1px solid #f5f5f5;">
      <div style="display: flex; margin-bottom: 5px;">
        <div style="width: 32px; height: 32px; background: #ffec3d; border-radius: 50%; margin-right: 10px;"></div>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: #666; margin-bottom: 2px;">{{COMMENT1_USER}}</div>
          <div style="font-size: 14px; color: #333; line-height: 1.4;">{{COMMENT1_CONTENT}}</div>
          <div style="display: flex; align-items: center; margin-top: 8px; font-size: 12px; color: #999;">
            <span style="margin-right: 15px;">10分钟前</span>
            <span style="margin-right: 15px; font-weight: bold; color: #333;">回复</span>
          </div>
        </div>
        <div style="text-align: center; color: #999;">
          <div style="font-size: 16px;">♡</div>
          <div style="font-size: 10px;">{{COMMENT1_LIKES}}</div>
        </div>
      </div>
    </div>
    
    <!-- Comment 2 -->
    <div style="padding: 15px 0; border-bottom: 1px solid #f5f5f5;">
      <div style="display: flex; margin-bottom: 5px;">
        <div style="width: 32px; height: 32px; background: #69c0ff; border-radius: 50%; margin-right: 10px;"></div>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: #666; margin-bottom: 2px;">{{COMMENT2_USER}}</div>
          <div style="font-size: 14px; color: #333; line-height: 1.4;">{{COMMENT2_CONTENT}}</div>
          <div style="display: flex; align-items: center; margin-top: 8px; font-size: 12px; color: #999;">
            <span style="margin-right: 15px;">半小时前</span>
            <span style="margin-right: 15px; font-weight: bold; color: #333;">回复</span>
          </div>
        </div>
        <div style="text-align: center; color: #999;">
          <div style="font-size: 16px;">♡</div>
          <div style="font-size: 10px;">{{COMMENT2_LIKES}}</div>
        </div>
      </div>
    </div>
  </div>
  
  <div style="padding: 10px 15px; border-top: 1px solid #eee; display: flex; align-items: center; background: #fff;">
    <div style="flex: 1; background: #f5f5f5; border-radius: 18px; padding: 8px 15px; font-size: 13px; color: #999;">说点什么...</div>
    <div style="font-size: 20px; margin-left: 15px; color: #333;">☺</div>
    <div style="font-size: 20px; margin-left: 15px; color: #333;">⊕</div>
  </div>
</div>
  `.trim()
}
