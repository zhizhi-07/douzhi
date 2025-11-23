import { TheatreTemplate } from '../../theatreTemplates'

export const confessionWallTemplate: TheatreTemplate = {
  id: 'confession_wall',
  category: '社交通讯',
  name: '树洞倾诉',
  keywords: ['树洞', '秘密', '倾诉', '匿名'],
  fields: [
    { key: 'POST_ID', label: '编号', placeholder: '#1024' },
    { key: 'ANONYMOUS_NAME', label: '化名', placeholder: '某同学' },
    { key: 'CONTENT', label: '内容', placeholder: '其实我一直暗恋隔壁班的那个男生，每次路过他们班门口都会心跳加速。' },
    { key: 'POST_TIME', label: '时间', placeholder: '刚刚' },
    { key: 'LIKE_COUNT', label: '点赞', placeholder: '520' },
    { key: 'COMMENT_COUNT', label: '评论', placeholder: '99' },
  ],
  htmlTemplate: `
<div data-tree-hole style="background: #fff; width: 100%; max-width: 300px; margin: 0 auto; font-family: 'Times New Roman', serif; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
  <div style="height: 120px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); position: relative; display: flex; align-items: center; justify-content: center;">
    <div style="font-size: 40px; color: white; opacity: 0.8;">🌲</div>
    <div style="position: absolute; bottom: 10px; right: 15px; color: white; font-size: 12px; background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 10px;">{{POST_ID}}</div>
  </div>
  
  <div style="padding: 20px;">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="width: 30px; height: 30px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 10px;">🦊</div>
      <div style="font-size: 14px; font-weight: bold; color: #555;">{{ANONYMOUS_NAME}}</div>
      <div style="font-size: 12px; color: #ccc; margin-left: auto;">{{POST_TIME}}</div>
    </div>
    
    <div style="font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 20px; min-height: 80px;">
      {{CONTENT}}
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #eee; padding-top: 15px;">
      <div style="display: flex; gap: 15px;">
        <div style="font-size: 12px; color: #999; display: flex; align-items: center;">
          <span style="font-size: 16px; margin-right: 4px;">♥</span> {{LIKE_COUNT}}
        </div>
        <div style="font-size: 12px; color: #999; display: flex; align-items: center;">
          <span style="font-size: 16px; margin-right: 4px;">💬</span> {{COMMENT_COUNT}}
        </div>
      </div>
      <div style="font-size: 12px; color: #1890ff; cursor: pointer;">去围观 ></div>
    </div>
  </div>
</div>
  `.trim()
}
