import { TheatreTemplate } from '../../theatreTemplates'

export const memoTemplate: TheatreTemplate = {
    id: 'memo',
    category: '工作学习',
    name: '备忘录',
    keywords: ['备忘录', '待办', '提醒', '记事'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '今日待办' },
      { key: 'ITEM1', label: '事项1', placeholder: '买菜' },
      { key: 'ITEM2', label: '事项2', placeholder: '开会' },
      { key: 'ITEM3', label: '事项3', placeholder: '健身' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
    ],
    htmlTemplate: `
<div data-memo style="max-width: 350px; margin: 0 auto; background: #fff9e6; padding: 22px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-family: -apple-system, 'PingFang SC', sans-serif; border-top: 6px solid #f59e0b;">
  <!-- 标题区 -->
  <div style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #fcd34d;">
    <div style="font-size: 20px; color: #1f2937; font-weight: 700; margin-bottom: 6px;">{{TITLE}}</div>
    <div style="font-size: 12px; color: #9ca3af;">{{DATE}}</div>
  </div>
  
  <!-- 待办列表 -->
  <div>
    <div data-todo-item="1" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="1" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="1" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM1}}</span>
    </div>
    
    <div data-todo-item="2" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="2" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="2" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM2}}</span>
    </div>
    
    <div data-todo-item="3" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="3" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="3" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM3}}</span>
    </div>
  </div>
  
  <!-- 进度条 -->
  <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #fbbf24;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <div style="font-size: 12px; color: #6b7280;">完成进度</div>
      <div data-progress-text style="font-size: 12px; font-weight: 600; color: #f59e0b;">0/3</div>
    </div>
    <div style="height: 6px; background: #fef3c7; border-radius: 3px; overflow: hidden;">
      <div data-progress-bar style="height: 100%; width: 0%; background: #f59e0b; transition: width 0.3s;"></div>
    </div>
  </div>
</div>
    `.trim()
  }
