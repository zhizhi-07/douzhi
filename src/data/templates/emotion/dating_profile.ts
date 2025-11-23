import { TheatreTemplate } from '../../theatreTemplates'

export const datingProfileTemplate: TheatreTemplate = {
  id: 'dating_profile',
  category: '情感关系',
  name: '征婚资料',
  keywords: ['征婚', '相亲', '资料卡', '介绍'],
  fields: [
    { key: 'NAME', label: '姓名', placeholder: '王富贵' },
    { key: 'AGE', label: '年龄', placeholder: '28岁' },
    { key: 'HEIGHT', label: '身高', placeholder: '180cm' },
    { key: 'EDUCATION', label: '学历', placeholder: '硕士' },
    { key: 'JOB', label: '职业', placeholder: '程序员' },
    { key: 'INCOME', label: '收入', placeholder: '50w+' },
    { key: 'HOMETOWN', label: '籍贯', placeholder: '北京' },
    { key: 'HOBBIES', label: '爱好', placeholder: '健身、看书、旅游' },
    { key: 'REQUIREMENTS', label: '要求', placeholder: '温柔贤惠，孝顺父母' },
  ],
  htmlTemplate: `
<div data-dating-profile style="background: #fff; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee;">
  <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); padding: 20px; text-align: center; color: white;">
    <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: #ff9a9e; font-size: 40px; font-weight: bold; border: 3px solid rgba(255,255,255,0.5);">
      ♂
    </div>
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">{{NAME}}</div>
    <div style="font-size: 12px; opacity: 0.9;">{{AGE}} • {{HEIGHT}} • {{HOMETOWN}}</div>
  </div>
  
  <div style="padding: 20px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 2px;">学历</div>
        <div style="font-size: 13px; color: #333;">{{EDUCATION}}</div>
      </div>
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 2px;">职业</div>
        <div style="font-size: 13px; color: #333;">{{JOB}}</div>
      </div>
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 2px;">年薪</div>
        <div style="font-size: 13px; color: #ff4d4f;">{{INCOME}}</div>
      </div>
      <div style="background: #f9f9f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 2px;">房车</div>
        <div style="font-size: 13px; color: #333;">有房有车</div>
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 12px; font-weight: bold; color: #ff9a9e; margin-bottom: 5px;">兴趣爱好</div>
      <div style="font-size: 12px; color: #666; line-height: 1.5;">{{HOBBIES}}</div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 12px; font-weight: bold; color: #ff9a9e; margin-bottom: 5px;">择偶标准</div>
      <div style="font-size: 12px; color: #666; line-height: 1.5; background: #fff0f6; padding: 10px; border-radius: 4px;">
        {{REQUIREMENTS}}
      </div>
    </div>
    
    <button style="width: 100%; background: #ff9a9e; color: white; border: none; padding: 10px; border-radius: 20px; font-size: 14px; cursor: pointer; box-shadow: 0 4px 10px rgba(255,154,158,0.3);">
      打招呼
    </button>
  </div>
</div>
  `.trim()
}
