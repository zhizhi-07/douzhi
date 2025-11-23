import { TheatreTemplate } from '../../theatreTemplates'

export const adultSiteMembershipTemplate: TheatreTemplate = {
  id: 'adult_site_membership',
  category: '工作学习',
  name: '网站会员',
  keywords: ['网站', '会员', '订阅', 'Pornhub'],
  fields: [
    { key: 'SITE_NAME', label: '网站', placeholder: 'P***hub' },
    { key: 'USERNAME', label: '用户', placeholder: 'BigBoy' },
    { key: 'MEMBERSHIP_TYPE', label: '类型', placeholder: 'Premium' },
    { key: 'START_DATE', label: '开始', placeholder: '2024-11-22' },
    { key: 'EXPIRE_DATE', label: '结束', placeholder: '2025-11-22' },
    { key: 'PRICE', label: '价格', placeholder: '$9.99/mo' },
    { key: 'FEATURES', label: '特权', placeholder: '4K UHD, No Ads' },
  ],
  htmlTemplate: `
<div data-site-membership style="background: #000; color: white; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
  <div style="padding: 20px; text-align: center; border-bottom: 1px solid #333;">
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">
      <span style="background: white; color: black; padding: 2px 5px; border-radius: 3px; margin-right: 2px;">{{SITE_NAME}}</span>
      <span style="color: orange;">{{MEMBERSHIP_TYPE}}</span>
    </div>
    <div style="font-size: 12px; color: #888;">Subscription Active</div>
  </div>
  
  <div style="padding: 20px;">
    <div style="margin-bottom: 15px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Username</div>
      <div style="font-size: 14px;">{{USERNAME}}</div>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Plan</div>
        <div style="font-size: 14px;">{{PRICE}}</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Next Billing</div>
        <div style="font-size: 14px;">{{EXPIRE_DATE}}</div>
      </div>
    </div>
    
    <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
      <div style="font-size: 12px; color: orange; margin-bottom: 5px;">Premium Features</div>
      <div style="font-size: 12px; color: #ccc;">• {{FEATURES}}</div>
    </div>
  </div>
  
  <div style="padding: 15px; text-align: center;">
    <button style="background: orange; border: none; color: black; padding: 8px 20px; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer;">Manage Subscription</button>
  </div>
</div>
  `.trim()
}
