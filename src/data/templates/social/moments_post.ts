import { TheatreTemplate } from '../../theatreTemplates'

export const momentsPostTemplate: TheatreTemplate = {
    id: 'moments_post',
    category: '社交通讯',
    name: '朋友圈动态',
    keywords: ['朋友圈', '发朋友圈', '动态', '分享'],
    fields: [
      { key: 'NAME', label: '用户名', placeholder: '张三' },
      { key: 'POST1', label: '动态1内容', placeholder: '今天天气真好！出去走走' },
      { key: 'TIME1', label: '动态1时间', placeholder: '10分钟前' },
      { key: 'LIKE1', label: '动态1点赞', placeholder: '李四、王五' },
      { key: 'COMMENT1', label: '动态1评论', placeholder: '李四：确实不错' },
      { key: 'POST2', label: '动态2内容', placeholder: '终于完成这个项目了，太不容易了' },
      { key: 'TIME2', label: '动态2时间', placeholder: '2小时前' },
      { key: 'LIKE2', label: '动态2点赞', placeholder: '王五、赵六、孙七' },
      { key: 'COMMENT2A', label: '动态2评论A', placeholder: '王五：辛苦了' },
      { key: 'COMMENT2B', label: '动态2评论B', placeholder: '赵六：恭喜恭喜' },
      { key: 'POST3', label: '动态3内容', placeholder: '周末愉快~' },
      { key: 'TIME3', label: '动态3时间', placeholder: '昨天' },
      { key: 'LIKE3', label: '动态3点赞', placeholder: '李四、周八' },
    ],
    htmlTemplate: `
<div style="max-width: 370px; margin: 0 auto; background: #ededed; padding: 0; border-radius: 0; font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部个人信息 -->
  <div style="background: white; padding: 16px; border-bottom: 1px solid #e5e5e5;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 50px; height: 50px; border-radius: 6px; background: #4facfe; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">{{NAME_INITIAL}}</div>
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #2d3436;">{{NAME}}</div>
        <div style="font-size: 13px; color: #999;">查看朋友圈</div>
      </div>
    </div>
  </div>
  
  <!-- 动态列表 -->
  <div style="background: #ededed;">
    <!-- 动态1 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST1}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME1}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95; margin-bottom: 4px;">赞 {{LIKE1}}</div>
            <div style="border-top: 1px solid #e5e5e5; padding-top: 6px; margin-top: 4px;">
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4;">{{COMMENT1}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 动态2 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST2}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME2}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95; margin-bottom: 4px;">赞 {{LIKE2}}</div>
            <div style="border-top: 1px solid #e5e5e5; padding-top: 6px; margin-top: 4px;">
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4; margin-bottom: 3px;">{{COMMENT2A}}</div>
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4;">{{COMMENT2B}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 动态3 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST3}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME3}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95;">赞 {{LIKE3}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
