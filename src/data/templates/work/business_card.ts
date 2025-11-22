import { TheatreTemplate } from '../../theatreTemplates'

export const businessCardTemplate: TheatreTemplate = {
    id: 'business_card',
    category: '工作学习',
    name: '名片',
    keywords: ['名片', '联系方式', '个人信息'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'TITLE', label: '职位', placeholder: '产品经理' },
      { key: 'COMPANY', label: '公司', placeholder: '某某科技有限公司' },
      { key: 'PHONE', label: '电话', placeholder: '138-0000-0000' },
      { key: 'EMAIL', label: '邮箱', placeholder: 'zhangsan@example.com' },
      { key: 'ADDRESS', label: '地址', placeholder: '北京市朝阳区' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(102,126,234,0.25); font-family: -apple-system, 'PingFang SC', sans-serif; position: relative;">
  <!-- 背景装饰 -->
  <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
  <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
  
  <div style="padding: 32px 24px; position: relative; z-index: 1;">
    <!-- 个人信息 -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; letter-spacing: 0.5px;">{{NAME}}</div>
      <div style="font-size: 15px; color: rgba(255,255,255,0.9); margin-bottom: 6px;">{{TITLE}}</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.75);">{{COMPANY}}</div>
    </div>
    
    <!-- 联系方式 -->
    <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 18px 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">Tel</div>
        <div style="font-size: 14px; color: white; font-family: 'Courier New', monospace;">{{PHONE}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">@</div>
        <div style="font-size: 13px; color: white;">{{EMAIL}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">Loc</div>
        <div style="font-size: 13px; color: white;">{{ADDRESS}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
