import { TheatreTemplate } from '../../theatreTemplates'

export const expressPackageTemplate: TheatreTemplate = {
    id: 'express_package',
    category: '生活消费',
    name: '快递单',
    keywords: ['快递单', '快递', '包裹', '物流单'],
    fields: [
      { key: 'EXPRESS_NO', label: '快递单号', placeholder: 'SF1234567890' },
      { key: 'COMPANY', label: '快递公司', placeholder: '顺丰速运' },
      { key: 'FROM_NAME', label: '寄件人', placeholder: '张三' },
      { key: 'FROM_ADDRESS', label: '寄件地址', placeholder: '北京市朝阳区' },
      { key: 'TO_NAME', label: '收件人', placeholder: '李四' },
      { key: 'TO_ADDRESS', label: '收件地址', placeholder: '上海市浦东新区' },
      { key: 'GOODS', label: '物品', placeholder: '文件' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border: 2px solid #000; font-family: -apple-system, 'PingFang SC', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <!-- 顶部公司条 -->
  <div style="background: #000; color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold;">{{COMPANY}}</div>
    <div style="font-size: 11px; opacity: 0.8;">EXPRESS</div>
  </div>
  
  <!-- 快递单号 -->
  <div style="background: #fff3cd; padding: 12px 15px; border-bottom: 2px dashed #000;">
    <div style="font-size: 10px; color: #666; margin-bottom: 4px;">快递单号</div>
    <div style="font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 1px;">{{EXPRESS_NO}}</div>
  </div>
  
  <!-- 收寄件信息 -->
  <div style="padding: 15px;">
    <!-- 收件人 -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 6px; height: 18px; background: #000; border-radius: 2px;"></div>
        <div style="font-size: 13px; font-weight: bold;">收件人</div>
      </div>
      <div style="padding-left: 14px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #000;">{{TO_NAME}}</div>
        <div style="font-size: 13px; color: #666; line-height: 1.5;">{{TO_ADDRESS}}</div>
      </div>
    </div>
    
    <!-- 寄件人 -->
    <div style="margin-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 6px; height: 18px; background: #666; border-radius: 2px;"></div>
        <div style="font-size: 13px; font-weight: bold; color: #666;">寄件人</div>
      </div>
      <div style="padding-left: 14px;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">{{FROM_NAME}}</div>
        <div style="font-size: 12px; color: #999; line-height: 1.5;">{{FROM_ADDRESS}}</div>
      </div>
    </div>
    
    <!-- 物品信息 -->
    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
      <div style="font-size: 11px; color: #666; margin-bottom: 4px;">物品</div>
      <div style="font-size: 14px; font-weight: 500;">{{GOODS}}</div>
    </div>
  </div>
  
  <!-- 底部条形码 -->
  <div style="border-top: 2px dashed #000; padding: 12px 15px; text-align: center;">
    <div style="display: flex; justify-content: center; gap: 1px; margin-bottom: 6px;">
      ${Array(25).fill(0).map((_, i) => `<div style="width: 2px; height: ${12 + Math.random() * 15}px; background: #000;"></div>`).join('')}
    </div>
    <div style="font-size: 9px; color: #999; font-family: 'Courier New', monospace; letter-spacing: 1px;">{{EXPRESS_NO}}</div>
  </div>
</div>
    `.trim()
  }
