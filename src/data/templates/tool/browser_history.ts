import { TheatreTemplate } from '../../theatreTemplates'

export const browserHistoryTemplate: TheatreTemplate = {
  id: 'browser_history',
  category: '工具应用',
  name: '浏览历史',
  keywords: ['历史', '记录', '浏览器', '访问'],
  fields: [
    { key: 'RECORD1_TITLE', label: '标题1', placeholder: '如何快速致富 - 知乎' },
    { key: 'RECORD1_URL', label: '网址1', placeholder: 'zhihu.com' },
    { key: 'RECORD1_TIME', label: '时间1', placeholder: '10:30' },
    { key: 'RECORD2_TITLE', label: '标题2', placeholder: 'Python入门教程' },
    { key: 'RECORD2_URL', label: '网址2', placeholder: 'bilibili.com' },
    { key: 'RECORD2_TIME', label: '时间2', placeholder: '09:15' },
    { key: 'RECORD3_TITLE', label: '标题3', placeholder: '今日头条' },
    { key: 'RECORD3_URL', label: '网址3', placeholder: 'toutiao.com' },
    { key: 'RECORD3_TIME', label: '时间3', placeholder: '08:45' },
  ],
  htmlTemplate: `
<div data-browser-history style="background: #fff; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid #ddd;">
  <div style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-weight: bold; font-size: 14px;">History</div>
    <div style="color: #1890ff; font-size: 12px; cursor: pointer;">Clear browsing data</div>
  </div>
  
  <div style="background: #fff;">
    <div style="padding: 10px 15px; background: #f9f9f9; font-size: 12px; color: #666; font-weight: bold;">Today</div>
    
    <!-- Item 1 -->
    <div style="padding: 12px 15px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: flex-start;">
      <div style="width: 16px; height: 16px; background: #ddd; border-radius: 50%; margin-right: 10px; margin-top: 2px;"></div>
      <div style="flex: 1;">
        <div style="font-size: 13px; color: #333; margin-bottom: 2px; font-weight: 500;">{{RECORD1_TITLE}}</div>
        <div style="font-size: 11px; color: #999;">{{RECORD1_URL}}</div>
      </div>
      <div style="font-size: 11px; color: #999;">{{RECORD1_TIME}}</div>
    </div>
    
    <!-- Item 2 -->
    <div style="padding: 12px 15px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: flex-start;">
      <div style="width: 16px; height: 16px; background: #ddd; border-radius: 50%; margin-right: 10px; margin-top: 2px;"></div>
      <div style="flex: 1;">
        <div style="font-size: 13px; color: #333; margin-bottom: 2px; font-weight: 500;">{{RECORD2_TITLE}}</div>
        <div style="font-size: 11px; color: #999;">{{RECORD2_URL}}</div>
      </div>
      <div style="font-size: 11px; color: #999;">{{RECORD2_TIME}}</div>
    </div>
    
    <!-- Item 3 -->
    <div style="padding: 12px 15px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: flex-start;">
      <div style="width: 16px; height: 16px; background: #ddd; border-radius: 50%; margin-right: 10px; margin-top: 2px;"></div>
      <div style="flex: 1;">
        <div style="font-size: 13px; color: #333; margin-bottom: 2px; font-weight: 500;">{{RECORD3_TITLE}}</div>
        <div style="font-size: 11px; color: #999;">{{RECORD3_URL}}</div>
      </div>
      <div style="font-size: 11px; color: #999;">{{RECORD3_TIME}}</div>
    </div>
  </div>
  
  <div style="padding: 10px; text-align: center; color: #1890ff; font-size: 12px; cursor: pointer;">
    Show older history
  </div>
</div>
  `.trim()
}
